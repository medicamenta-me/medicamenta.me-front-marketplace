/**
 * 💳 Checkout Service
 * Serviço de checkout para processar pedidos no marketplace
 * 
 * Features:
 * - Validação de carrinho
 * - Criação de pedidos via API v2
 * - Processamento de pagamentos (integração Stripe/PagSeguro)
 * - Validação de endereço
 * - Upload de receitas médicas
 * - Geração de número de pedido
 * - Retry logic para resiliência
 * 
 * @version 2.0.0 - Migrado para API v2
 * @date 03/01/2026
 */

import { Injectable, signal, inject, computed } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, of, throwError, firstValueFrom, timer } from 'rxjs';
import { map, tap, catchError, switchMap, retry, retryWhen, delayWhen, take } from 'rxjs/operators';
import { 
  Order, 
  OrderItem, 
  OrderStatus, 
  PaymentStatus, 
  DeliveryAddress,
  CreateOrderRequest,
  OrderStatusChange
} from '../../models/order.model';
import { Cart, CartItem } from '../../models/cart.model';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { IntegrationService, ApiError } from './integration.service';

/**
 * Configuração do checkout
 */
export const CHECKOUT_CONFIG = {
  MIN_ORDER_VALUE: 1000,              // R$ 10,00 mínimo
  MAX_PRESCRIPTION_IMAGES: 5,
  MAX_IMAGE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ORDER_PREFIX: 'ORD',
  PIX_EXPIRY_MINUTES: 30,
  BOLETO_EXPIRY_DAYS: 3,
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 30000
};

/**
 * Métodos de pagamento disponíveis
 */
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PIX: 'pix',
  BOLETO: 'boleto'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

/**
 * Resultado da validação de checkout
 */
export interface CheckoutValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Resultado do checkout
 */
export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  paymentUrl?: string;
  pixCode?: string;
  boletoUrl?: string;
  errorMessage?: string;
}

/**
 * Dados para criação do pedido
 */
export interface CheckoutData {
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: DeliveryAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Resposta da API v2 para criação de pedido
 */
export interface CreateOrderApiResponse {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentUrl?: string;
  pixCode?: string;
  boletoUrl?: string;
  createdAt: string;
}

/**
 * Payload para criação de pedido via API v2
 * Diferente de CreateOrderRequest (que usa cartId)
 */
export interface CreateOrderApiRequest {
  userId: string;
  pharmacyId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: DeliveryAddress;
  paymentMethod: string;
  prescriptionRequired: boolean;
  notes?: string;
}

/**
 * Resposta da API v2 para atualização de status
 */
export interface UpdateOrderStatusApiResponse {
  success: boolean;
  order: Order;
  statusHistory: OrderStatusChange[];
  notificationSent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly api = inject(IntegrationService);

  // Estado
  private readonly _processing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentStep = signal<number>(1);
  private readonly _retryCount = signal<number>(0);

  // Getters públicos
  readonly processing = this._processing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly retryCount = this._retryCount.asReadonly();

  // Computed
  readonly canRetry = computed(() => 
    this._retryCount() < CHECKOUT_CONFIG.MAX_RETRIES && this._error() !== null
  );

  // ============================================
  // MÉTODOS PÚBLICOS - VALIDAÇÃO
  // ============================================

  /**
   * 🔍 Valida se o checkout pode ser realizado
   */
  validateCheckout(cart: Cart | null, data: CheckoutData): CheckoutValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Valida carrinho
    if (!cart) {
      errors.push('Carrinho vazio');
      return { valid: false, errors, warnings };
    }

    if (cart.items.length === 0) {
      errors.push('Carrinho sem itens');
    }

    if (cart.total < CHECKOUT_CONFIG.MIN_ORDER_VALUE) {
      errors.push(`Pedido mínimo: R$ ${(CHECKOUT_CONFIG.MIN_ORDER_VALUE / 100).toFixed(2)}`);
    }

    // Valida endereço se delivery
    if (data.deliveryType === 'delivery') {
      if (!data.deliveryAddress) {
        errors.push('Endereço de entrega obrigatório');
      } else {
        const addressErrors = this.validateAddress(data.deliveryAddress);
        errors.push(...addressErrors);
      }
    }

    // Valida método de pagamento
    if (!this.isValidPaymentMethod(data.paymentMethod)) {
      errors.push('Método de pagamento inválido');
    }

    // Warnings
    if (cart.subtotal < 5000) {
      warnings.push('Compras acima de R$ 50,00 têm frete grátis');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 📍 Valida endereço de entrega
   */
  validateAddress(address: DeliveryAddress): string[] {
    const errors: string[] = [];

    if (!address.recipientName || address.recipientName.length < 3) {
      errors.push('Nome do destinatário inválido');
    }

    if (!address.phone || !this.isValidPhone(address.phone)) {
      errors.push('Telefone inválido');
    }

    if (!address.street || address.street.length < 3) {
      errors.push('Rua inválida');
    }

    if (!address.number) {
      errors.push('Número obrigatório');
    }

    if (!address.neighborhood || address.neighborhood.length < 2) {
      errors.push('Bairro inválido');
    }

    if (!address.city || address.city.length < 2) {
      errors.push('Cidade inválida');
    }

    if (!address.state || address.state.length !== 2) {
      errors.push('Estado inválido');
    }

    if (!address.zipCode || !this.isValidZipCode(address.zipCode)) {
      errors.push('CEP inválido');
    }

    return errors;
  }

  /**
   * 💳 Valida método de pagamento
   */
  isValidPaymentMethod(method: string): boolean {
    return Object.values(PAYMENT_METHODS).includes(method as PaymentMethod);
  }

  // ============================================
  // MÉTODOS PÚBLICOS - CHECKOUT
  // ============================================

  /**
   * 🛍️ Processa checkout completo via API v2
   * Migrado de Firestore direto para API centralizada
   */
  processCheckout(cart: Cart, data: CheckoutData): Observable<CheckoutResult> {
    // Valida
    const validation = this.validateCheckout(cart, data);
    if (!validation.valid) {
      return of({
        success: false,
        errorMessage: validation.errors.join(', ')
      });
    }

    this._processing.set(true);
    this._error.set(null);
    this._retryCount.set(0);

    const user = this.authService.currentUser();
    if (!user) {
      this._processing.set(false);
      return of({ success: false, errorMessage: 'Usuário não autenticado' });
    }

    // Prepara payload para API v2
    const orderRequest: CreateOrderApiRequest = {
      userId: user.uid,
      pharmacyId: cart.pharmacyId,
      items: this.mapCartItemsToOrderItems(cart.items),
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      discount: cart.discount,
      total: cart.total,
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      prescriptionRequired: this.checkPrescriptionRequired(cart.items),
      notes: data.notes
    };

    // Chama API v2 com retry automático
    return this.createOrderViaApi(orderRequest).pipe(
      tap(result => {
        this._processing.set(false);
        if (result.success) {
          // Limpa carrinho após sucesso
          this.cartService.clearCart().subscribe();
        }
      }),
      catchError(error => {
        console.error('Erro no checkout:', error);
        const errorMessage = this.parseApiError(error);
        this._error.set(errorMessage);
        this._processing.set(false);
        return of({ success: false, errorMessage });
      })
    );
  }

  /**
   * 📦 Cria pedido via API v2
   * Substitui o acesso direto ao Firestore
   */
  private createOrderViaApi(orderRequest: CreateOrderApiRequest): Observable<CheckoutResult> {
    return this.api.post<CreateOrderApiResponse>('/v2/orders', orderRequest, {
      timeout: CHECKOUT_CONFIG.REQUEST_TIMEOUT_MS,
      retries: CHECKOUT_CONFIG.MAX_RETRIES
    }).pipe(
      map(response => ({
        success: true,
        orderId: response.id,
        orderNumber: response.orderNumber,
        paymentUrl: response.paymentUrl,
        pixCode: response.pixCode,
        boletoUrl: response.boletoUrl
      })),
      retryWhen(errors => 
        errors.pipe(
          delayWhen((error, index) => {
            this._retryCount.set(index + 1);
            // Retry apenas para erros recuperáveis (5xx, timeout)
            if (this.isRetryableError(error) && index < CHECKOUT_CONFIG.MAX_RETRIES) {
              const delay = CHECKOUT_CONFIG.RETRY_DELAY_MS * Math.pow(2, index);
              console.log(`Retry ${index + 1}/${CHECKOUT_CONFIG.MAX_RETRIES} após ${delay}ms`);
              return timer(delay);
            }
            return throwError(() => error);
          }),
          take(CHECKOUT_CONFIG.MAX_RETRIES)
        )
      ),
      catchError(error => {
        const errorMessage = this.parseApiError(error);
        return of({ success: false, errorMessage });
      })
    );
  }

  /**
   * 🔄 Verifica se erro é recuperável (deve tentar retry)
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    // Timeout
    if (error.name === 'TimeoutError') return true;
    
    // Erros de rede
    if (error.status === 0) return true;
    
    // Erros de servidor (5xx)
    if (error.status >= 500 && error.status < 600) return true;
    
    // Rate limiting (429)
    if (error.status === 429) return true;
    
    return false;
  }

  /**
   * 🔍 Parse de erros da API
   */
  private parseApiError(error: any): string {
    if (!error) return 'Erro desconhecido';
    
    // Erro da API com estrutura conhecida
    if (error.error?.message) {
      return error.error.message;
    }
    
    // Erros HTTP comuns
    switch (error.status) {
      case 400:
        return 'Dados inválidos. Verifique as informações do pedido.';
      case 401:
        return 'Sessão expirada. Por favor, faça login novamente.';
      case 403:
        return 'Acesso negado. Você não tem permissão para esta operação.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return 'Conflito de dados. O pedido pode já ter sido processado.';
      case 422:
        return 'Dados inválidos. Verifique as informações fornecidas.';
      case 429:
        return 'Muitas requisições. Aguarde um momento e tente novamente.';
      case 500:
        return 'Erro no servidor. Tente novamente em alguns instantes.';
      case 503:
        return 'Serviço temporariamente indisponível. Tente novamente.';
      default:
        return error.message || 'Erro ao processar pedido';
    }
  }

  /**
   * 📦 Cria pedido no Firestore (LEGACY - mantido para compatibilidade)
   * @deprecated Use createOrderViaApi em vez disso
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  private createOrder(order: Omit<Order, 'id'>): Observable<string | null> {
    console.warn('DEPRECATED: createOrder via Firestore. Use API v2.');
    // Redireciona para API
    const orderRequest: CreateOrderApiRequest = {
      userId: order.userId,
      pharmacyId: order.pharmacyId,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      prescriptionRequired: order.prescriptionRequired,
      notes: order.notes
    };
    
    return this.api.post<CreateOrderApiResponse>('/v2/orders', orderRequest).pipe(
      map(response => response.id),
      catchError(error => {
        console.error('Erro ao criar pedido:', error);
        return of(null);
      })
    );
  }

  /**
   * 💳 Processa pagamento
   */
  private processPayment(
    orderId: string, 
    amount: number, 
    method: PaymentMethod
  ): Observable<Partial<CheckoutResult>> {
    switch (method) {
      case PAYMENT_METHODS.PIX:
        return this.generatePixPayment(orderId, amount);
      case PAYMENT_METHODS.BOLETO:
        return this.generateBoleto(orderId, amount);
      case PAYMENT_METHODS.CREDIT_CARD:
      case PAYMENT_METHODS.DEBIT_CARD:
        return of({ paymentUrl: `/checkout/payment/${orderId}` });
      default:
        return of({});
    }
  }

  /**
   * 📱 Gera pagamento PIX
   */
  private generatePixPayment(orderId: string, amount: number): Observable<Partial<CheckoutResult>> {
    // Mock - Em produção, integrar com gateway de pagamento
    const pixCode = this.generateMockPixCode(orderId, amount);
    return of({ pixCode });
  }

  /**
   * 📄 Gera boleto
   */
  private generateBoleto(orderId: string, amount: number): Observable<Partial<CheckoutResult>> {
    // Mock - Em produção, integrar com gateway de pagamento
    const boletoUrl = `/api/boleto/${orderId}`;
    return of({ boletoUrl });
  }

  // ============================================
  // MÉTODOS AUXILIARES - UPLOAD DE RECEITA
  // ============================================

  /**
   * 📤 Upload de imagem de receita
   */
  /* istanbul ignore next - Requires Firebase Storage for testing */
  uploadPrescriptionImage(orderId: string, file: File): Observable<string | null> {
    // Valida arquivo
    const validation = this.validatePrescriptionImage(file);
    if (!validation.valid) {
      this._error.set(validation.error || 'Arquivo inválido');
      return of(null);
    }

    const fileName = `prescriptions/${orderId}/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, fileName);

    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => from(getDownloadURL(storageRef))),
      catchError(error => {
        console.error('Erro ao fazer upload:', error);
        this._error.set('Erro ao enviar imagem');
        return of(null);
      })
    );
  }

  /**
   * 🔍 Valida imagem de receita
   */
  validatePrescriptionImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Arquivo não fornecido' };
    }

    if (!CHECKOUT_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo não permitido' };
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > CHECKOUT_CONFIG.MAX_IMAGE_SIZE_MB) {
      return { valid: false, error: `Tamanho máximo: ${CHECKOUT_CONFIG.MAX_IMAGE_SIZE_MB}MB` };
    }

    return { valid: true };
  }

  // ============================================
  // MÉTODOS AUXILIARES - HELPERS
  // ============================================

  /**
   * 🔢 Gera número único do pedido
   */
  generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${CHECKOUT_CONFIG.ORDER_PREFIX}-${year}-${random}`;
  }

  /**
   * 🗺️ Mapeia itens do carrinho para itens do pedido
   */
  mapCartItemsToOrderItems(cartItems: CartItem[]): OrderItem[] {
    return cartItems.map(item => ({
      productId: item.productId,
      productName: item.product?.name || 'Produto',
      productImage: item.product?.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      discount: 0,
      total: item.total
    }));
  }

  /**
   * 💊 Verifica se algum item requer receita
   */
  checkPrescriptionRequired(items: CartItem[]): boolean {
    return items.some(item => item.product?.prescriptionRequired === true);
  }

  /**
   * 📱 Valida telefone brasileiro
   */
  isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }

  /**
   * 📮 Valida CEP brasileiro
   */
  isValidZipCode(zipCode: string): boolean {
    const cleaned = zipCode.replace(/\D/g, '');
    return cleaned.length === 8;
  }

  /**
   * 📱 Gera código PIX mock
   */
  private generateMockPixCode(orderId: string, amount: number): string {
    const base = `00020126580014br.gov.bcb.pix0136${orderId}`;
    const amountStr = (amount / 100).toFixed(2);
    return `${base}5204000053039865802BR5913Medicamenta6008SaoPaulo62070503***63041D3D`;
  }

  // ============================================
  // MÉTODOS DE NAVEGAÇÃO
  // ============================================

  /**
   * ➡️ Avança para próximo passo
   */
  nextStep(): void {
    const current = this._currentStep();
    if (current < 4) {
      this._currentStep.set(current + 1);
    }
  }

  /**
   * ⬅️ Volta para passo anterior
   */
  previousStep(): void {
    const current = this._currentStep();
    if (current > 1) {
      this._currentStep.set(current - 1);
    }
  }

  /**
   * 🎯 Define passo específico
   */
  setStep(step: number): void {
    if (step >= 1 && step <= 4) {
      this._currentStep.set(step);
    }
  }

  /**
   * 🔄 Reseta checkout
   */
  reset(): void {
    this._currentStep.set(1);
    this._error.set(null);
    this._processing.set(false);
  }

  // ============================================
  // MÉTODOS DE GERENCIAMENTO DE PEDIDOS (FARMÁCIA)
  // Via API v2
  // ============================================

  /**
   * 📋 Obtém pedidos de uma farmácia via API v2
   */
  async getPharmacyOrders(pharmacyId: string): Promise<Order[]> {
    try {
      const response = await firstValueFrom(
        this.api.get<{ items: Order[]; total: number }>(`/v2/orders`, {
          params: {
            pharmacyId,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        })
      );
      return response.items;
    } catch (error) {
      console.error('Erro ao obter pedidos da farmácia:', error);
      throw error;
    }
  }

  /**
   * 📦 Obtém pedido por ID via API v2
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await firstValueFrom(
        this.api.get<Order>(`/v2/orders/${orderId}`)
      );
      return order;
    } catch (error) {
      console.error('Erro ao obter pedido:', error);
      return null;
    }
  }

  /**
   * 🔄 Atualiza status do pedido via API v2
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<UpdateOrderStatusApiResponse> {
    try {
      const response = await firstValueFrom(
        this.api.patch<UpdateOrderStatusApiResponse>(`/v2/orders/${orderId}/status`, {
          status,
          notes,
          notifyCustomer: true
        })
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  }

  /**
   * ✅ Verifica receita médica via API v2
   */
  async verifyPrescription(orderId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post(`/v2/orders/${orderId}/verify-prescription`, {
          verified: true
        })
      );
    } catch (error) {
      console.error('Erro ao verificar receita:', error);
      throw error;
    }
  }

  /**
   * ❌ Cancela pedido via API v2
   */
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post(`/v2/orders/${orderId}/cancel`, {
          reason,
          notifyCustomer: true
        })
      );
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      throw error;
    }
  }

  /**
   * 💰 Solicita reembolso via API v2
   */
  async requestRefund(orderId: string, reason: string, amount?: number): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post(`/v2/orders/${orderId}/refund`, {
          reason,
          amount, // Se não informado, reembolso total
          notifyCustomer: true
        })
      );
    } catch (error) {
      console.error('Erro ao solicitar reembolso:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtém estatísticas de pedidos da farmácia via API v2
   */
  async getPharmacyOrderStats(pharmacyId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }> {
    try {
      const stats = await firstValueFrom(
        this.api.get<{
          total: number;
          pending: number;
          completed: number;
          cancelled: number;
          revenue: number;
        }>(`/v2/pharmacies/${pharmacyId}/order-stats`)
      );
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}
