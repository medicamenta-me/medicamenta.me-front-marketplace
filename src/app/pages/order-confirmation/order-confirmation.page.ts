/**
 * 🎉 Order Confirmation Page
 * Página de confirmação de pedido após checkout bem-sucedido
 * 
 * Features:
 * - Exibição do número do pedido
 * - Resumo dos itens comprados
 * - Informações de entrega/retirada
 * - Forma de pagamento
 * - Tempo estimado de entrega
 * - Ações: Ver pedidos, Continuar comprando
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Order, OrderStatus, ORDER_STATUS_LABELS, PaymentStatus } from '../../models/order.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

// Order service interface for dependency injection
export interface OrderService {
  getOrder(orderId: string): Promise<Order | null>;
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="order-confirmation-page">
      <!-- Loading State -->
      @if (loading()) {
        <app-loading-spinner message="Carregando pedido..."></app-loading-spinner>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <span class="error-icon">❌</span>
          <h2>Pedido não encontrado</h2>
          <p>{{ error() }}</p>
          <a routerLink="/products" class="btn-primary">Ver Produtos</a>
        </div>
      }

      <!-- Success State -->
      @if (order() && !loading() && !error()) {
        <div class="confirmation-content">
          <!-- Success Header -->
          <header class="success-header">
            <div class="success-icon">✅</div>
            <h1>Pedido Confirmado!</h1>
            <p class="order-number">Pedido #{{ order()!.orderNumber }}</p>
            <p class="confirmation-message">
              Enviamos um e-mail de confirmação para {{ order()!.customerEmail }}
            </p>
          </header>

          <!-- Order Timeline -->
          <section class="order-timeline">
            <h2>Status do Pedido</h2>
            <div class="timeline">
              @for (step of orderSteps(); track step.status) {
                <div 
                  class="timeline-step"
                  [class.completed]="isStepCompleted(step.status)"
                  [class.current]="isCurrentStep(step.status)"
                >
                  <div class="step-icon">{{ step.icon }}</div>
                  <div class="step-info">
                    <span class="step-label">{{ step.label }}</span>
                    @if (isCurrentStep(step.status)) {
                      <span class="step-status">Em andamento</span>
                    }
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Delivery Info -->
          <section class="delivery-info">
            <h2>{{ order()!.deliveryType === 'delivery' ? 'Entrega' : 'Retirada' }}</h2>
            
            @if (order()!.deliveryType === 'delivery') {
              <div class="address-card">
                <div class="address-icon">📍</div>
                <div class="address-details">
                  <p class="recipient">{{ order()!.deliveryAddress?.recipientName }}</p>
                  <p>{{ formatAddress(order()!.deliveryAddress) }}</p>
                  <p class="phone">📞 {{ order()!.deliveryAddress?.phone }}</p>
                </div>
              </div>
              <div class="estimated-delivery">
                <span class="label">Previsão de entrega:</span>
                <span class="date">{{ formatEstimatedDelivery() }}</span>
              </div>
            } @else {
              <div class="pickup-card">
                <div class="pickup-icon">🏪</div>
                <div class="pickup-details">
                  <p class="pharmacy-name">{{ order()!.pharmacyName }}</p>
                  <p>Retire seu pedido na farmácia</p>
                  <p class="pickup-time">Disponível para retirada em até 2 horas</p>
                </div>
              </div>
            }
          </section>

          <!-- Order Items -->
          <section class="order-items">
            <h2>Itens do Pedido ({{ order()!.items.length }})</h2>
            <div class="items-list">
              @for (item of order()!.items; track item.productId) {
                <div class="item-card">
                  <div class="item-image">
                    @if (item.productImage) {
                      <img [src]="item.productImage" [alt]="item.productName" />
                    } @else {
                      <div class="placeholder-image">📦</div>
                    }
                  </div>
                  <div class="item-details">
                    <h3>{{ item.productName || 'Produto' }}</h3>
                    <p class="quantity">Quantidade: {{ item.quantity }}</p>
                    <p class="unit-price">{{ formatCurrency(item.unitPrice) }} cada</p>
                  </div>
                  <div class="item-total">
                    {{ formatCurrency(item.subtotal) }}
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Payment Info -->
          <section class="payment-info">
            <h2>Pagamento</h2>
            <div class="payment-method">
              <span class="method-icon">{{ getPaymentMethodIcon() }}</span>
              <span class="method-name">{{ getPaymentMethodName() }}</span>
              <span class="payment-status" [class]="getPaymentStatusClass()">
                {{ getPaymentStatusLabel() }}
              </span>
            </div>

            @if (order()!.paymentMethod === 'pix' && order()!.paymentStatus === 'pending') {
              <div class="pix-info">
                <p>Escaneie o QR Code ou copie o código PIX para efetuar o pagamento:</p>
                <div class="pix-code">
                  <code>{{ order()!.pixCode || 'Código PIX' }}</code>
                  <button class="btn-copy" (click)="copyPixCode()">📋 Copiar</button>
                </div>
                <p class="pix-expiry">⏱️ Válido por 30 minutos</p>
              </div>
            }

            @if (order()!.paymentMethod === 'boleto' && order()!.paymentStatus === 'pending') {
              <div class="boleto-info">
                <p>Acesse o boleto para efetuar o pagamento:</p>
                <a [href]="order()!.boletoUrl" target="_blank" class="btn-boleto">
                  📄 Ver Boleto
                </a>
                <p class="boleto-expiry">⏱️ Vencimento: {{ formatBoletoExpiry() }}</p>
              </div>
            }
          </section>

          <!-- Order Summary -->
          <section class="order-summary">
            <h2>Resumo</h2>
            <div class="summary-lines">
              <div class="summary-line">
                <span>Subtotal</span>
                <span>{{ formatCurrency(order()!.subtotal) }}</span>
              </div>
              <div class="summary-line">
                <span>Frete</span>
                <span>{{ order()!.deliveryFee > 0 ? formatCurrency(order()!.deliveryFee) : 'Grátis' }}</span>
              </div>
              @if (order()!.discount > 0) {
                <div class="summary-line discount">
                  <span>Desconto</span>
                  <span>-{{ formatCurrency(order()!.discount) }}</span>
                </div>
              }
              <div class="summary-line total">
                <span>Total</span>
                <span>{{ formatCurrency(order()!.total) }}</span>
              </div>
            </div>
          </section>

          <!-- Notes -->
          @if (order()!.notes) {
            <section class="order-notes">
              <h2>Observações</h2>
              <p>{{ order()!.notes }}</p>
            </section>
          }

          <!-- Actions -->
          <section class="order-actions">
            <a routerLink="/orders" class="btn-secondary">
              📋 Ver Meus Pedidos
            </a>
            <a routerLink="/products" class="btn-primary">
              🛒 Continuar Comprando
            </a>
          </section>

          <!-- Help -->
          <section class="help-section">
            <p>Precisa de ajuda? Entre em contato:</p>
            <div class="help-links">
              <a href="mailto:suporte@medicamenta.me">📧 suporte&#64;medicamenta.me</a>
              <a href="tel:+5511999999999">📞 (11) 99999-9999</a>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-confirmation-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px;
      min-height: 100vh;
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 64px 24px;
    }

    .error-state .error-icon {
      font-size: 64px;
      display: block;
      margin-bottom: 16px;
    }

    .error-state h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 8px;
    }

    .error-state p {
      color: #666;
      margin-bottom: 24px;
    }

    /* Success Header */
    .success-header {
      text-align: center;
      padding: 32px 0;
      border-bottom: 1px solid #eee;
      margin-bottom: 24px;
    }

    .success-icon {
      font-size: 72px;
      margin-bottom: 16px;
    }

    .success-header h1 {
      font-size: 28px;
      color: #2e7d32;
      margin-bottom: 8px;
    }

    .order-number {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .confirmation-message {
      color: #666;
      font-size: 14px;
    }

    /* Sections */
    section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    section h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }

    /* Order Timeline */
    .timeline {
      display: flex;
      justify-content: space-between;
      position: relative;
    }

    .timeline::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 40px;
      right: 40px;
      height: 2px;
      background: #e0e0e0;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
      flex: 1;
    }

    .step-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      margin-bottom: 8px;
    }

    .timeline-step.completed .step-icon {
      background: #4caf50;
    }

    .timeline-step.current .step-icon {
      background: #2196f3;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .step-info {
      text-align: center;
    }

    .step-label {
      font-size: 12px;
      color: #666;
      display: block;
    }

    .step-status {
      font-size: 10px;
      color: #2196f3;
      font-weight: 600;
    }

    /* Delivery Info */
    .address-card, .pickup-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .address-icon, .pickup-icon {
      font-size: 32px;
    }

    .address-details p, .pickup-details p {
      margin: 4px 0;
      color: #666;
    }

    .recipient, .pharmacy-name {
      font-weight: 600;
      color: #333 !important;
    }

    .estimated-delivery, .pickup-time {
      margin-top: 12px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .estimated-delivery .label {
      color: #666;
    }

    .estimated-delivery .date {
      font-weight: 600;
      color: #2e7d32;
    }

    /* Order Items */
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-card {
      display: flex;
      gap: 16px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
      align-items: center;
    }

    .item-image {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-image {
      width: 100%;
      height: 100%;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .item-details {
      flex: 1;
    }

    .item-details h3 {
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
    }

    .item-details .quantity, .item-details .unit-price {
      font-size: 12px;
      color: #666;
      margin: 2px 0;
    }

    .item-total {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }

    /* Payment Info */
    .payment-method {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .method-icon {
      font-size: 24px;
    }

    .method-name {
      flex: 1;
      font-weight: 500;
      color: #333;
    }

    .payment-status {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }

    .payment-status.pending {
      background: #fff3e0;
      color: #e65100;
    }

    .payment-status.paid {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .payment-status.failed {
      background: #ffebee;
      color: #c62828;
    }

    .pix-info, .boleto-info {
      margin-top: 16px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
    }

    .pix-code {
      display: flex;
      gap: 8px;
      margin: 12px 0;
    }

    .pix-code code {
      flex: 1;
      padding: 12px;
      background: white;
      border-radius: 8px;
      font-size: 12px;
      word-break: break-all;
    }

    .btn-copy {
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn-boleto {
      display: inline-block;
      padding: 12px 24px;
      background: #1976d2;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      margin: 12px 0;
    }

    .pix-expiry, .boleto-expiry {
      font-size: 12px;
      color: #666;
    }

    /* Order Summary */
    .summary-lines {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      color: #666;
    }

    .summary-line.discount {
      color: #2e7d32;
    }

    .summary-line.total {
      border-top: 2px solid #eee;
      padding-top: 16px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    /* Order Notes */
    .order-notes p {
      color: #666;
      font-style: italic;
    }

    /* Actions */
    .order-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      background: transparent;
      box-shadow: none;
      padding: 24px 0;
    }

    .btn-primary, .btn-secondary {
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #1976d2;
      color: white;
    }

    .btn-secondary {
      background: white;
      color: #1976d2;
      border: 2px solid #1976d2;
    }

    /* Help Section */
    .help-section {
      text-align: center;
      background: #f5f5f5;
    }

    .help-section p {
      color: #666;
      margin-bottom: 12px;
    }

    .help-links {
      display: flex;
      justify-content: center;
      gap: 24px;
    }

    .help-links a {
      color: #1976d2;
      text-decoration: none;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .timeline {
        flex-direction: column;
        gap: 16px;
      }

      .timeline::before {
        top: 0;
        bottom: 0;
        left: 20px;
        right: auto;
        width: 2px;
        height: auto;
      }

      .timeline-step {
        flex-direction: row;
        gap: 16px;
      }

      .step-info {
        text-align: left;
      }

      .order-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
        justify-content: center;
      }

      .help-links {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class OrderConfirmationPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  order = signal<Order | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Order steps for timeline
  orderSteps = computed(() => [
    { status: OrderStatus.PENDING_PAYMENT, icon: '💳', label: 'Pagamento' },
    { status: OrderStatus.PAYMENT_CONFIRMED, icon: '✅', label: 'Confirmado' },
    { status: OrderStatus.PREPARING, icon: '📦', label: 'Preparando' },
    { status: OrderStatus.OUT_FOR_DELIVERY, icon: '🚚', label: 'Enviado' },
    { status: OrderStatus.DELIVERED, icon: '🎉', label: 'Entregue' }
  ]);

  // Order service (will be injected in real app)
  private orderService: OrderService | null = null;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    
    if (!orderId) {
      this.error.set('ID do pedido não informado');
      this.loading.set(false);
      return;
    }

    this.loadOrder(orderId);
  }

  async loadOrder(orderId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      // In real app, this would call the order service
      // For now, we'll simulate loading
      if (this.orderService) {
        const order = await this.orderService.getOrder(orderId);
        if (order) {
          this.order.set(order);
        } else {
          this.error.set('Pedido não encontrado');
        }
      } else {
        // Mock order for testing/development
        this.order.set(this.createMockOrder(orderId));
      }
    } catch (err) {
      console.error('Erro ao carregar pedido:', err);
      this.error.set('Erro ao carregar detalhes do pedido');
    } finally {
      this.loading.set(false);
    }
  }

  private createMockOrder(orderId: string): Order {
    return {
      id: orderId,
      orderNumber: 'ORD-2025-000001',
      userId: 'user-123',
      pharmacyId: 'pharmacy-456',
      pharmacyName: 'Farmácia Central',
      customerEmail: 'cliente@email.com',
      items: [
        {
          productId: 'prod-1',
          productName: 'Dipirona 500mg',
          productImage: '',
          quantity: 2,
          unitPrice: 1990,
          subtotal: 3980,
          discount: 0,
          total: 3980
        }
      ],
      subtotal: 3980,
      deliveryFee: 999,
      discount: 0,
      total: 4979,
      status: OrderStatus.PAYMENT_CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pix',
      deliveryType: 'delivery',
      deliveryAddress: {
        recipientName: 'João Silva',
        phone: '(11) 99999-9999',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      prescriptionRequired: false,
      prescriptionVerified: false,
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  isStepCompleted(status: OrderStatus): boolean {
    const order = this.order();
    if (!order) return false;

    const statusOrder = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAYMENT_CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED
    ];

    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(status);

    return stepIndex < currentIndex;
  }

  isCurrentStep(status: OrderStatus): boolean {
    return this.order()?.status === status;
  }

  formatAddress(address: Order['deliveryAddress']): string {
    if (!address) return '';
    
    let formatted = `${address.street}, ${address.number}`;
    if (address.complement) {
      formatted += ` - ${address.complement}`;
    }
    formatted += ` - ${address.neighborhood}`;
    formatted += `, ${address.city}/${address.state}`;
    formatted += ` - CEP: ${address.zipCode}`;
    
    return formatted;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }

  formatEstimatedDelivery(): string {
    const order = this.order();
    if (!order) return '';

    // Calculate estimated delivery (3-5 business days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    return deliveryDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  formatBoletoExpiry(): string {
    const order = this.order();
    if (!order) return '';

    // Boleto expires in 3 days
    const expiryDate = new Date(order.createdAt);
    expiryDate.setDate(expiryDate.getDate() + 3);

    return expiryDate.toLocaleDateString('pt-BR');
  }

  getPaymentMethodIcon(): string {
    const method = this.order()?.paymentMethod;
    const icons: Record<string, string> = {
      'pix': '⚡',
      'credit_card': '💳',
      'debit_card': '💳',
      'boleto': '📄'
    };
    return icons[method || ''] || '💰';
  }

  getPaymentMethodName(): string {
    const method = this.order()?.paymentMethod;
    const names: Record<string, string> = {
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'boleto': 'Boleto Bancário'
    };
    return names[method || ''] || method || '';
  }

  getPaymentStatusClass(): string {
    const status = this.order()?.paymentStatus;
    if (status === PaymentStatus.PAID) return 'paid';
    if (status === PaymentStatus.FAILED) return 'failed';
    return 'pending';
  }

  getPaymentStatusLabel(): string {
    const status = this.order()?.paymentStatus;
    const labels: Record<string, string> = {
      'pending': 'Aguardando',
      'processing': 'Processando',
      'paid': 'Pago',
      'failed': 'Falhou',
      'refunded': 'Reembolsado'
    };
    return labels[status || ''] || status || '';
  }

  copyPixCode(): void {
    const order = this.order();
    if (order?.pixCode) {
      navigator.clipboard.writeText(order.pixCode).then(() => {
        alert('Código PIX copiado!');
      }).catch(() => {
        alert('Erro ao copiar código');
      });
    }
  }
}
