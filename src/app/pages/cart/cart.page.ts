/**
 * 🛒 Cart Page
 * Página do carrinho de compras
 * 
 * Features:
 * - Lista de itens no carrinho
 * - Atualização de quantidades
 * - Remoção de itens
 * - Aplicação de cupom
 * - Resumo do pedido
 * - Navegação para checkout
 */

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem, CartSummary } from '../../models/cart.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="cart-page">
      <!-- Header -->
      <header class="cart-header">
        <h1>Meu Carrinho</h1>
        @if (cart(); as currentCart) {
          <span class="item-count">{{ currentCart.items.length }} {{ currentCart.items.length === 1 ? 'item' : 'itens' }}</span>
        }
      </header>

      <!-- Loading State -->
      @if (loading()) {
        <app-loading-spinner message="Carregando carrinho..."></app-loading-spinner>
      }

      <!-- Error State -->
      @if (error(); as errorMessage) {
        <div class="error-message">
          <span class="icon">⚠️</span>
          <p>{{ errorMessage }}</p>
          <button class="btn-retry" (click)="loadCart()">Tentar novamente</button>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && isEmpty()) {
        <app-empty-state
          icon="🛒"
          title="Seu carrinho está vazio"
          message="Adicione produtos ao carrinho para continuar"
          actionLabel="Ver Produtos"
          (action)="goToProducts()"
        ></app-empty-state>
      }

      <!-- Cart Content -->
      @if (!loading() && !isEmpty() && cart(); as currentCart) {
        <div class="cart-content">
          <!-- Items List -->
          <div class="cart-items">
            @for (item of currentCart.items; track item.productId) {
              <div class="cart-item">
                <div class="item-image">
                  @if (item.product?.image) {
                    <img [src]="item.product.image" [alt]="item.product?.name || 'Produto'" />
                  } @else {
                    <div class="placeholder-image">📦</div>
                  }
                </div>
                
                <div class="item-details">
                  <h3 class="item-name">{{ item.product?.name || 'Produto' }}</h3>
                  @if (item.product?.description) {
                    <p class="item-description">{{ item.product.description | slice:0:100 }}...</p>
                  }
                  <p class="item-price">{{ formatCurrency(item.unitPrice) }}</p>
                </div>
                
                <div class="item-quantity">
                  <button 
                    class="qty-btn"
                    [disabled]="item.quantity <= 1 || updatingItem() === item.productId"
                    (click)="decreaseQuantity(item)"
                  >−</button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button 
                    class="qty-btn"
                    [disabled]="item.quantity >= 10 || updatingItem() === item.productId"
                    (click)="increaseQuantity(item)"
                  >+</button>
                </div>
                
                <div class="item-total">
                  <span class="total-label">Total:</span>
                  <span class="total-value">{{ formatCurrency(item.total) }}</span>
                </div>
                
                <button 
                  class="btn-remove"
                  [disabled]="removingItem() === item.productId"
                  (click)="removeItem(item)"
                  title="Remover item"
                >
                  🗑️
                </button>
              </div>
            }
          </div>

          <!-- Sidebar -->
          <aside class="cart-sidebar">
            <!-- Coupon Form -->
            <div class="coupon-section">
              <h4>Cupom de Desconto</h4>
              <div class="coupon-form">
                <input 
                  type="text" 
                  [(ngModel)]="couponCode"
                  placeholder="Digite o cupom"
                  [disabled]="applyingCoupon()"
                />
                <button 
                  class="btn-apply"
                  [disabled]="!couponCode || applyingCoupon()"
                  (click)="applyCoupon()"
                >
                  {{ applyingCoupon() ? 'Aplicando...' : 'Aplicar' }}
                </button>
              </div>
              @if (currentCart.couponCode) {
                <div class="coupon-applied">
                  <span>✅ Cupom aplicado: {{ currentCart.couponCode }}</span>
                  <button class="btn-remove-coupon" (click)="removeCoupon()">×</button>
                </div>
              }
            </div>

            <!-- Order Summary -->
            <div class="order-summary">
              <h4>Resumo do Pedido</h4>
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ formatCurrency(currentCart.subtotal) }}</span>
              </div>
              @if (currentCart.discount > 0) {
                <div class="summary-row discount">
                  <span>Desconto</span>
                  <span>-{{ formatCurrency(currentCart.discount) }}</span>
                </div>
              }
              <div class="summary-row">
                <span>Frete</span>
                <span>{{ currentCart.deliveryFee === 0 ? 'Grátis' : formatCurrency(currentCart.deliveryFee) }}</span>
              </div>
              @if (!hasFreeDelivery()) {
                <p class="free-delivery-hint">
                  Faltam {{ formatCurrency(missingForFreeDelivery()) }} para frete grátis!
                </p>
              }
              <div class="summary-row total">
                <span>Total</span>
                <span>{{ formatCurrency(currentCart.total) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="cart-actions">
              <button 
                class="btn-primary btn-checkout"
                [disabled]="isEmpty()"
                (click)="goToCheckout()"
              >
                Finalizar Compra
              </button>
              <a routerLink="/products" class="btn-secondary">
                Continuar Comprando
              </a>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .cart-header {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      margin-bottom: 2rem;

      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
      }

      .item-count {
        color: #666;
        font-size: 0.95rem;
      }
    }

    .error-message {
      text-align: center;
      padding: 2rem;
      background: #fff5f5;
      border: 1px solid #fed7d7;
      border-radius: 8px;

      .icon { font-size: 2rem; }
      p { color: #c53030; margin: 0.5rem 0; }
      .btn-retry {
        padding: 0.5rem 1rem;
        background: #e53e3e;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
    }

    .cart-content {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cart-item {
      display: grid;
      grid-template-columns: 80px 1fr auto auto auto;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      @media (max-width: 640px) {
        grid-template-columns: 80px 1fr;
        grid-template-rows: auto auto auto;
      }

      .item-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        background: #f7fafc;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 2rem;
        }
      }

      .item-details {
        .item-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          color: #1a1a1a;
        }

        .item-description {
          font-size: 0.85rem;
          color: #666;
          margin: 0 0 0.25rem;
        }

        .item-price {
          font-size: 0.95rem;
          color: #10b981;
          font-weight: 600;
          margin: 0;
        }
      }

      .item-quantity {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .qty-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;

          &:hover:not(:disabled) {
            background: #f7fafc;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .qty-value {
          min-width: 40px;
          text-align: center;
          font-weight: 600;
        }
      }

      .item-total {
        text-align: right;

        .total-label {
          display: block;
          font-size: 0.8rem;
          color: #666;
        }

        .total-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
        }
      }

      .btn-remove {
        padding: 0.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        opacity: 0.6;
        transition: opacity 0.2s;

        &:hover:not(:disabled) {
          opacity: 1;
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }
    }

    .cart-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      @media (max-width: 768px) {
        order: -1;
      }
    }

    .coupon-section {
      padding: 1.5rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      h4 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem;
        color: #1a1a1a;
      }

      .coupon-form {
        display: flex;
        gap: 0.5rem;

        input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.95rem;

          &:focus {
            outline: none;
            border-color: #10b981;
          }
        }

        .btn-apply {
          padding: 0.75rem 1rem;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;

          &:disabled {
            background: #94a3b8;
            cursor: not-allowed;
          }
        }
      }

      .coupon-applied {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.75rem;
        padding: 0.5rem;
        background: #ecfdf5;
        border-radius: 6px;
        color: #059669;
        font-size: 0.9rem;

        .btn-remove-coupon {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #059669;
        }
      }
    }

    .order-summary {
      padding: 1.5rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      h4 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem;
        color: #1a1a1a;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.95rem;
        color: #4a5568;

        &.discount { color: #10b981; }

        &.total {
          border-top: 2px solid #e2e8f0;
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
        }
      }

      .free-delivery-hint {
        font-size: 0.85rem;
        color: #f59e0b;
        background: #fffbeb;
        padding: 0.5rem;
        border-radius: 6px;
        margin: 0.5rem 0;
        text-align: center;
      }
    }

    .cart-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .btn-primary, .btn-secondary {
        display: block;
        width: 100%;
        padding: 1rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #10b981;
        color: #fff;
        border: none;

        &:hover:not(:disabled) {
          background: #059669;
        }

        &:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      }

      .btn-secondary {
        background: #fff;
        color: #4a5568;
        border: 1px solid #e2e8f0;

        &:hover {
          background: #f7fafc;
        }
      }
    }
  `]
})
export class CartPage implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  // Estado
  readonly cart = this.cartService.cart;
  readonly loading = this.cartService.loading;
  readonly error = this.cartService.error;
  
  readonly updatingItem = signal<string | null>(null);
  readonly removingItem = signal<string | null>(null);
  readonly applyingCoupon = signal(false);
  
  couponCode = '';

  // Computed
  readonly isEmpty = computed(() => {
    const currentCart = this.cart();
    return !currentCart || currentCart.items.length === 0;
  });

  readonly summary = this.cartService.cartSummary;

  readonly hasFreeDelivery = computed(() => {
    const s = this.summary();
    return s ? s.hasFreeDelivery : false;
  });

  readonly missingForFreeDelivery = computed(() => {
    const s = this.summary();
    return s?.missingForFreeDelivery || 0;
  });

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartService.loadCart().subscribe();
  }

  increaseQuantity(item: CartItem): void {
    if (item.quantity >= 10) return;
    this.updatingItem.set(item.productId);
    this.cartService.updateItemQuantity(item.productId, item.quantity + 1).subscribe({
      next: () => this.updatingItem.set(null),
      error: () => this.updatingItem.set(null)
    });
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity <= 1) return;
    this.updatingItem.set(item.productId);
    this.cartService.updateItemQuantity(item.productId, item.quantity - 1).subscribe({
      next: () => this.updatingItem.set(null),
      error: () => this.updatingItem.set(null)
    });
  }

  removeItem(item: CartItem): void {
    this.removingItem.set(item.productId);
    this.cartService.removeItem(item.productId).subscribe({
      next: () => this.removingItem.set(null),
      error: () => this.removingItem.set(null)
    });
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) return;
    this.applyingCoupon.set(true);
    this.cartService.applyCoupon(this.couponCode.trim()).subscribe({
      next: () => {
        this.applyingCoupon.set(false);
        this.couponCode = '';
      },
      error: () => this.applyingCoupon.set(false)
    });
  }

  removeCoupon(): void {
    this.cartService.removeCoupon().subscribe();
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }
}
