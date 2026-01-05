/**
 * 🛒 Cart Service
 * Gerenciamento do carrinho de compras com integração Firestore
 * 
 * Features:
 * - Adicionar/remover itens
 * - Atualizar quantidades
 * - Aplicar cupons de desconto
 * - Cálculo automático de totais
 * - Sincronização com Firestore
 * - Cache local
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest, ApplyCouponRequest, CartSummary } from '../../models/cart.model';
import { AuthService } from './auth.service';

/**
 * Configuração do carrinho
 */
export const CART_CONFIG = {
  FREE_DELIVERY_THRESHOLD: 15000,     // R$ 150,00 em centavos
  DEFAULT_DELIVERY_FEE: 999,          // R$ 9,99 em centavos
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
  CART_EXPIRY_DAYS: 7
};

/**
 * Validação de cupom
 */
export interface CouponValidation {
  valid: boolean;
  discountPercent?: number;
  discountAmount?: number;
  errorMessage?: string;
}

/**
 * Cupons válidos (mock para MVP)
 */
export const VALID_COUPONS: Record<string, { percent?: number; amount?: number; minOrder?: number }> = {
  'BEMVINDO10': { percent: 10, minOrder: 5000 },
  'PRIMEIRA20': { percent: 20, minOrder: 10000 },
  'FRETE': { amount: 999, minOrder: 5000 },
  'DESC15': { percent: 15, minOrder: 7500 }
};

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  
  // Estado reativo
  private readonly _cart = signal<Cart | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Getters públicos
  readonly cart = this._cart.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly itemCount = computed(() => {
    const cart = this._cart();
    return cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  });

  readonly cartSummary = computed<CartSummary | null>(() => {
    const cart = this._cart();
    if (!cart) return null;

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const hasFreeDelivery = cart.subtotal >= CART_CONFIG.FREE_DELIVERY_THRESHOLD;
    const deliveryFee = hasFreeDelivery ? 0 : cart.deliveryFee;
    const missingForFreeDelivery = hasFreeDelivery 
      ? undefined 
      : CART_CONFIG.FREE_DELIVERY_THRESHOLD - cart.subtotal;

    return {
      itemCount,
      subtotal: cart.subtotal,
      deliveryFee,
      discount: cart.discount,
      total: cart.subtotal + deliveryFee - cart.discount,
      hasFreeDelivery,
      missingForFreeDelivery
    };
  });

  readonly isEmpty = computed(() => this.itemCount() === 0);

  // ============================================
  // MÉTODOS PÚBLICOS - CARRINHO
  // ============================================

  /**
   * 📥 Carrega carrinho do usuário
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  loadCart(): Observable<Cart | null> {
    const user = this.authService.currentUser();
    const userId = user?.uid;
    if (!userId) {
      this._cart.set(null);
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    const cartDoc = doc(this.firestore, `carts/${userId}`);

    return from(getDoc(cartDoc)).pipe(
      map(snapshot => {
        if (!snapshot.exists()) {
          return null;
        }
        const data = snapshot.data();
        const cart = this.mapDocToCart(snapshot.id, data);
        
        // Verifica expiração
        if (this.isCartExpired(cart)) {
          this.clearCart().subscribe();
          return null;
        }
        
        return cart;
      }),
      tap(cart => {
        this._cart.set(cart);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Erro ao carregar carrinho:', error);
        this._error.set('Erro ao carregar carrinho');
        this._loading.set(false);
        return of(null);
      })
    );
  }

  /**
   * ➕ Adiciona item ao carrinho
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  addItem(request: AddToCartRequest, product: { name: string; price: number; pharmacyId: string }): Observable<Cart | null> {
    const user = this.authService.currentUser();
    const userId = user?.uid;
    if (!userId) {
      this._error.set('Usuário não autenticado');
      return of(null);
    }

    // Validação de quantidade
    if (request.quantity < CART_CONFIG.MIN_QUANTITY || request.quantity > CART_CONFIG.MAX_QUANTITY) {
      this._error.set(`Quantidade deve estar entre ${CART_CONFIG.MIN_QUANTITY} e ${CART_CONFIG.MAX_QUANTITY}`);
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    const currentCart = this._cart();
    
    // Verifica se está tentando adicionar de outra farmácia
    if (currentCart && currentCart.items.length > 0 && currentCart.pharmacyId !== product.pharmacyId) {
      this._error.set('Carrinho já contém itens de outra farmácia');
      this._loading.set(false);
      return of(null);
    }

    const newItem: CartItem = {
      productId: request.productId,
      product: { name: product.name },
      quantity: request.quantity,
      unitPrice: product.price,
      subtotal: request.quantity * product.price,
      total: request.quantity * product.price
    };

    let updatedCart: Cart;

    if (currentCart) {
      // Atualiza carrinho existente
      const existingItemIndex = currentCart.items.findIndex(item => item.productId === request.productId);
      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Atualiza quantidade do item existente
        updatedItems = [...currentCart.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = Math.min(existingItem.quantity + request.quantity, CART_CONFIG.MAX_QUANTITY);
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: newQuantity * existingItem.unitPrice,
          total: newQuantity * existingItem.unitPrice
        };
      } else {
        // Adiciona novo item
        updatedItems = [...currentCart.items, newItem];
      }

      updatedCart = this.recalculateCart({ ...currentCart, items: updatedItems });
    } else {
      // Cria novo carrinho
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CART_CONFIG.CART_EXPIRY_DAYS);

      updatedCart = this.recalculateCart({
        id: userId,
        userId,
        pharmacyId: product.pharmacyId,
        items: [newItem],
        subtotal: 0,
        deliveryFee: CART_CONFIG.DEFAULT_DELIVERY_FEE,
        discount: 0,
        total: 0,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return this.saveCart(updatedCart);
  }

  /**
   * 🔄 Atualiza quantidade de um item
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  updateItemQuantity(productId: string, quantity: number): Observable<Cart | null> {
    const currentCart = this._cart();
    if (!currentCart) {
      this._error.set('Carrinho vazio');
      return of(null);
    }

    // Validação de quantidade
    if (quantity < CART_CONFIG.MIN_QUANTITY) {
      return this.removeItem(productId);
    }

    if (quantity > CART_CONFIG.MAX_QUANTITY) {
      this._error.set(`Quantidade máxima: ${CART_CONFIG.MAX_QUANTITY}`);
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    const itemIndex = currentCart.items.findIndex(item => item.productId === productId);
    if (itemIndex < 0) {
      this._error.set('Item não encontrado no carrinho');
      this._loading.set(false);
      return of(null);
    }

    const updatedItems = [...currentCart.items];
    const item = updatedItems[itemIndex];
    updatedItems[itemIndex] = {
      ...item,
      quantity,
      subtotal: quantity * item.unitPrice,
      total: quantity * item.unitPrice
    };

    const updatedCart = this.recalculateCart({ ...currentCart, items: updatedItems });
    return this.saveCart(updatedCart);
  }

  /**
   * 🗑️ Remove item do carrinho
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  removeItem(productId: string): Observable<Cart | null> {
    const currentCart = this._cart();
    if (!currentCart) {
      this._error.set('Carrinho vazio');
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    const updatedItems = currentCart.items.filter(item => item.productId !== productId);

    if (updatedItems.length === 0) {
      return this.clearCart();
    }

    const updatedCart = this.recalculateCart({ ...currentCart, items: updatedItems });
    return this.saveCart(updatedCart);
  }

  /**
   * 🏷️ Aplica cupom de desconto
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  applyCoupon(couponCode: string): Observable<CouponValidation> {
    const currentCart = this._cart();
    if (!currentCart) {
      return of({ valid: false, errorMessage: 'Carrinho vazio' });
    }

    this._loading.set(true);
    this._error.set(null);

    const validation = this.validateCoupon(couponCode.toUpperCase(), currentCart.subtotal);
    
    if (!validation.valid) {
      this._loading.set(false);
      this._error.set(validation.errorMessage || 'Cupom inválido');
      return of(validation);
    }

    const discount = validation.discountAmount || 
      Math.floor(currentCart.subtotal * (validation.discountPercent || 0) / 100);

    const updatedCart = this.recalculateCart({
      ...currentCart,
      couponCode: couponCode.toUpperCase(),
      discount
    });

    return this.saveCart(updatedCart).pipe(
      map(() => validation),
      catchError(error => {
        console.error('Erro ao aplicar cupom:', error);
        return of({ valid: false, errorMessage: 'Erro ao aplicar cupom' });
      })
    );
  }

  /**
   * 🗑️ Remove cupom
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  removeCoupon(): Observable<Cart | null> {
    const currentCart = this._cart();
    if (!currentCart || !currentCart.couponCode) {
      return of(currentCart);
    }

    this._loading.set(true);
    this._error.set(null);

    const updatedCart = this.recalculateCart({
      ...currentCart,
      couponCode: undefined,
      discount: 0
    });

    return this.saveCart(updatedCart);
  }

  /**
   * 🗑️ Limpa carrinho
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  clearCart(): Observable<Cart | null> {
    const user = this.authService.currentUser();
    const userId = user?.uid;
    if (!userId) {
      this._cart.set(null);
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    const cartDoc = doc(this.firestore, `carts/${userId}`);

    return from(deleteDoc(cartDoc)).pipe(
      map(() => {
        this._cart.set(null);
        this._loading.set(false);
        return null;
      }),
      catchError(error => {
        console.error('Erro ao limpar carrinho:', error);
        this._error.set('Erro ao limpar carrinho');
        this._loading.set(false);
        return of(null);
      })
    );
  }

  // ============================================
  // MÉTODOS AUXILIARES - CÁLCULOS
  // ============================================

  /**
   * 🧮 Recalcula totais do carrinho
   */
  recalculateCart(cart: Cart): Cart {
    const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    const hasFreeDelivery = subtotal >= CART_CONFIG.FREE_DELIVERY_THRESHOLD;
    const deliveryFee = hasFreeDelivery ? 0 : CART_CONFIG.DEFAULT_DELIVERY_FEE;
    
    // Recalcula desconto se houver cupom
    let discount = cart.discount;
    if (cart.couponCode) {
      const validation = this.validateCoupon(cart.couponCode, subtotal);
      if (validation.valid) {
        discount = validation.discountAmount || 
          Math.floor(subtotal * (validation.discountPercent || 0) / 100);
      } else {
        // Cupom não é mais válido (pedido mínimo não atingido)
        discount = 0;
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);

    return {
      ...cart,
      subtotal,
      deliveryFee,
      discount,
      total,
      updatedAt: new Date()
    };
  }

  /**
   * 🏷️ Valida cupom
   */
  validateCoupon(couponCode: string, subtotal: number): CouponValidation {
    const coupon = VALID_COUPONS[couponCode];
    
    if (!coupon) {
      return { valid: false, errorMessage: 'Cupom não encontrado' };
    }

    if (coupon.minOrder && subtotal < coupon.minOrder) {
      const minOrderFormatted = this.formatCurrency(coupon.minOrder);
      return { 
        valid: false, 
        errorMessage: `Pedido mínimo: ${minOrderFormatted}` 
      };
    }

    return {
      valid: true,
      discountPercent: coupon.percent,
      discountAmount: coupon.amount
    };
  }

  /**
   * 🕐 Verifica se carrinho expirou
   */
  isCartExpired(cart: Cart): boolean {
    return new Date() > cart.expiresAt;
  }

  /**
   * 📊 Calcula resumo do carrinho
   */
  calculateSummary(cart: Cart): CartSummary {
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const hasFreeDelivery = cart.subtotal >= CART_CONFIG.FREE_DELIVERY_THRESHOLD;
    const deliveryFee = hasFreeDelivery ? 0 : cart.deliveryFee;
    const missingForFreeDelivery = hasFreeDelivery 
      ? undefined 
      : CART_CONFIG.FREE_DELIVERY_THRESHOLD - cart.subtotal;

    return {
      itemCount,
      subtotal: cart.subtotal,
      deliveryFee,
      discount: cart.discount,
      total: cart.subtotal + deliveryFee - cart.discount,
      hasFreeDelivery,
      missingForFreeDelivery
    };
  }

  // ============================================
  // MÉTODOS AUXILIARES - FORMATAÇÃO
  // ============================================

  /**
   * 💰 Formata valor em moeda
   */
  formatCurrency(valueInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valueInCents / 100);
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * 💾 Salva carrinho no Firestore
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  private saveCart(cart: Cart): Observable<Cart | null> {
    const cartDoc = doc(this.firestore, `carts/${cart.id}`);
    
    const cartData = {
      userId: cart.userId,
      pharmacyId: cart.pharmacyId,
      items: cart.items,
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      discount: cart.discount,
      total: cart.total,
      couponCode: cart.couponCode || null,
      expiresAt: Timestamp.fromDate(cart.expiresAt),
      createdAt: Timestamp.fromDate(cart.createdAt),
      updatedAt: Timestamp.now()
    };

    return from(setDoc(cartDoc, cartData)).pipe(
      map(() => cart),
      tap(savedCart => {
        this._cart.set(savedCart);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Erro ao salvar carrinho:', error);
        this._error.set('Erro ao salvar carrinho');
        this._loading.set(false);
        return of(null);
      })
    );
  }

  /**
   * 🗺️ Mapeia documento Firestore para Cart
   */
  private mapDocToCart(id: string, data: any): Cart {
    return {
      id,
      userId: data.userId,
      pharmacyId: data.pharmacyId,
      items: data.items || [],
      subtotal: data.subtotal || 0,
      deliveryFee: data.deliveryFee || CART_CONFIG.DEFAULT_DELIVERY_FEE,
      discount: data.discount || 0,
      total: data.total || 0,
      couponCode: data.couponCode || undefined,
      expiresAt: data.expiresAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }
}
