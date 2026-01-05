/**
 * 💳 Checkout Page
 * Página de finalização de compra
 * 
 * Features:
 * - 4 passos: Endereço, Pagamento, Receita (se necessário), Confirmação
 * - Validação em tempo real
 * - Upload de receita médica
 * - Múltiplos métodos de pagamento
 */

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { CheckoutService, CHECKOUT_CONFIG, PAYMENT_METHODS, CheckoutData, PaymentMethod } from '../../core/services/checkout.service';
import { Cart } from '../../models/cart.model';
import { DeliveryAddress } from '../../models/order.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="checkout-page">
      <!-- Header -->
      <header class="checkout-header">
        <a routerLink="/cart" class="back-link">← Voltar ao carrinho</a>
        <h1>Finalizar Compra</h1>
      </header>

      <!-- Loading -->
      @if (processing()) {
        <app-loading-spinner message="Processando..." [overlay]="true"></app-loading-spinner>
      }

      <!-- Steps Indicator -->
      <div class="steps-indicator">
        @for (step of steps; track step.number; let i = $index) {
          <div 
            class="step" 
            [class.active]="currentStep() === step.number"
            [class.completed]="currentStep() > step.number"
          >
            <div class="step-number">{{ step.number }}</div>
            <div class="step-title">{{ step.title }}</div>
          </div>
          @if (i < steps.length - 1) {
            <div class="step-divider" [class.completed]="currentStep() > step.number"></div>
          }
        }
      </div>

      <div class="checkout-content">
        <main class="checkout-main">
          <!-- Step 1: Delivery -->
          @if (currentStep() === 1) {
            <section class="checkout-section">
              <h2>Tipo de Entrega</h2>
              
              <div class="delivery-options">
                <label class="delivery-option" [class.selected]="deliveryType() === 'delivery'">
                  <input 
                    type="radio" 
                    name="deliveryType" 
                    value="delivery"
                    [checked]="deliveryType() === 'delivery'"
                    (change)="setDeliveryType('delivery')"
                  />
                  <span class="option-icon">🚚</span>
                  <span class="option-text">
                    <strong>Entrega em casa</strong>
                    <small>Receba em seu endereço</small>
                  </span>
                </label>
                
                <label class="delivery-option" [class.selected]="deliveryType() === 'pickup'">
                  <input 
                    type="radio" 
                    name="deliveryType" 
                    value="pickup"
                    [checked]="deliveryType() === 'pickup'"
                    (change)="setDeliveryType('pickup')"
                  />
                  <span class="option-icon">🏪</span>
                  <span class="option-text">
                    <strong>Retirar na loja</strong>
                    <small>Retire na farmácia</small>
                  </span>
                </label>
              </div>

              @if (deliveryType() === 'delivery') {
                <h3>Endereço de Entrega</h3>
                <form [formGroup]="addressForm" class="address-form">
                  <div class="form-row">
                    <div class="form-group full">
                      <label for="recipientName">Nome do destinatário *</label>
                      <input id="recipientName" type="text" formControlName="recipientName" placeholder="Nome completo" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group full">
                      <label for="phone">Telefone *</label>
                      <input id="phone" type="tel" formControlName="phone" placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="zipCode">CEP *</label>
                      <input id="zipCode" type="text" formControlName="zipCode" placeholder="00000-000" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group large">
                      <label for="street">Rua *</label>
                      <input id="street" type="text" formControlName="street" placeholder="Nome da rua" />
                    </div>
                    <div class="form-group small">
                      <label for="number">Número *</label>
                      <input id="number" type="text" formControlName="number" placeholder="Nº" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group full">
                      <label for="complement">Complemento</label>
                      <input id="complement" type="text" formControlName="complement" placeholder="Apto, bloco, etc." />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="neighborhood">Bairro *</label>
                      <input id="neighborhood" type="text" formControlName="neighborhood" placeholder="Bairro" />
                    </div>
                    <div class="form-group">
                      <label for="city">Cidade *</label>
                      <input id="city" type="text" formControlName="city" placeholder="Cidade" />
                    </div>
                    <div class="form-group small">
                      <label for="state">Estado *</label>
                      <input id="state" type="text" formControlName="state" placeholder="UF" maxlength="2" />
                    </div>
                  </div>
                </form>
              }

              <div class="step-actions">
                <button class="btn-primary" [disabled]="!canProceedToStep2()" (click)="nextStep()">
                  Continuar
                </button>
              </div>
            </section>
          }

          <!-- Step 2: Payment -->
          @if (currentStep() === 2) {
            <section class="checkout-section">
              <h2>Forma de Pagamento</h2>
              
              <div class="payment-options">
                @for (method of paymentMethods; track method.id) {
                  <label 
                    class="payment-option" 
                    [class.selected]="selectedPaymentMethod() === method.id"
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      [value]="method.id"
                      [checked]="selectedPaymentMethod() === method.id"
                      (change)="selectPaymentMethod(method.id)"
                    />
                    <span class="option-icon">{{ method.icon }}</span>
                    <span class="option-text">
                      <strong>{{ method.name }}</strong>
                      <small>{{ method.description }}</small>
                    </span>
                  </label>
                }
              </div>

              <div class="step-actions">
                <button class="btn-secondary" (click)="previousStep()">Voltar</button>
                <button class="btn-primary" [disabled]="!selectedPaymentMethod()" (click)="nextStep()">
                  Continuar
                </button>
              </div>
            </section>
          }

          <!-- Step 3: Prescription (optional) -->
          @if (currentStep() === 3) {
            <section class="checkout-section">
              <h2>Receita Médica</h2>
              
              @if (requiresPrescription()) {
                <div class="prescription-required">
                  <p class="warning">
                    ⚠️ Alguns itens do seu pedido requerem receita médica.
                  </p>
                  <p>Faça upload da foto da sua receita (máximo {{ CHECKOUT_CONFIG.MAX_PRESCRIPTION_IMAGES }} imagens):</p>
                  
                  <div class="upload-area">
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      (change)="onPrescriptionUpload($event)"
                    />
                    <span>📷 Clique ou arraste para enviar</span>
                  </div>

                  @if (prescriptionImages().length > 0) {
                    <div class="prescription-preview">
                      @for (img of prescriptionImages(); track $index) {
                        <div class="preview-item">
                          <img [src]="img" alt="Receita" />
                          <button class="btn-remove" (click)="removePrescriptionImage($index)">×</button>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="no-prescription">
                  ✅ Nenhum item do seu pedido requer receita médica.
                </p>
              }

              <div class="form-group">
                <label for="orderNotes">Observações (opcional)</label>
                <textarea 
                  id="orderNotes"
                  [(ngModel)]="orderNotes" 
                  placeholder="Alguma instrução especial para entrega?"
                  rows="3"
                ></textarea>
              </div>

              <div class="step-actions">
                <button class="btn-secondary" (click)="previousStep()">Voltar</button>
                <button 
                  class="btn-primary" 
                  [disabled]="requiresPrescription() && prescriptionImages().length === 0" 
                  (click)="nextStep()"
                >
                  Continuar
                </button>
              </div>
            </section>
          }

          <!-- Step 4: Confirmation -->
          @if (currentStep() === 4) {
            <section class="checkout-section">
              <h2>Confirme seu Pedido</h2>
              
              <div class="confirmation-summary">
                <div class="summary-block">
                  <h4>Entrega</h4>
                  @if (deliveryType() === 'delivery' && getAddressData()) {
                    <p>{{ getAddressData()?.recipientName }}</p>
                    <p>{{ getAddressData()?.street }}, {{ getAddressData()?.number }}</p>
                    @if (getAddressData()?.complement) {
                      <p>{{ getAddressData()?.complement }}</p>
                    }
                    <p>{{ getAddressData()?.neighborhood }} - {{ getAddressData()?.city }}/{{ getAddressData()?.state }}</p>
                    <p>CEP: {{ getAddressData()?.zipCode }}</p>
                  } @else {
                    <p>Retirar na farmácia</p>
                  }
                </div>

                <div class="summary-block">
                  <h4>Pagamento</h4>
                  <p>{{ getSelectedPaymentMethodName() }}</p>
                </div>

                @if (orderNotes) {
                  <div class="summary-block">
                    <h4>Observações</h4>
                    <p>{{ orderNotes }}</p>
                  </div>
                }
              </div>

              <div class="step-actions">
                <button class="btn-secondary" (click)="previousStep()">Voltar</button>
                <button 
                  class="btn-primary btn-confirm" 
                  [disabled]="processing()" 
                  (click)="confirmOrder()"
                >
                  {{ processing() ? 'Processando...' : 'Confirmar Pedido' }}
                </button>
              </div>
            </section>
          }
        </main>

        <!-- Sidebar - Order Summary -->
        <aside class="checkout-sidebar">
          <div class="order-summary">
            <h3>Resumo do Pedido</h3>
            
            @if (cart(); as currentCart) {
              <div class="summary-items">
                @for (item of currentCart.items; track item.productId) {
                  <div class="summary-item">
                    <span class="item-qty">{{ item.quantity }}x</span>
                    <span class="item-name">{{ item.product?.name || 'Produto' }}</span>
                    <span class="item-price">{{ formatCurrency(item.total) }}</span>
                  </div>
                }
              </div>

              <div class="summary-totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>{{ formatCurrency(currentCart.subtotal) }}</span>
                </div>
                @if (currentCart.discount > 0) {
                  <div class="total-row discount">
                    <span>Desconto</span>
                    <span>-{{ formatCurrency(currentCart.discount) }}</span>
                  </div>
                }
                <div class="total-row">
                  <span>Frete</span>
                  <span>{{ currentCart.deliveryFee === 0 ? 'Grátis' : formatCurrency(currentCart.deliveryFee) }}</span>
                </div>
                <div class="total-row final">
                  <span>Total</span>
                  <span>{{ formatCurrency(currentCart.total) }}</span>
                </div>
              </div>
            }
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    .checkout-header {
      margin-bottom: 2rem;

      .back-link {
        color: #666;
        text-decoration: none;
        font-size: 0.9rem;

        &:hover { color: #10b981; }
      }

      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0.5rem 0 0;
      }
    }

    .steps-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;

        .step-number {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e2e8f0;
          color: #666;
          font-weight: 600;
        }

        .step-title {
          font-size: 0.75rem;
          color: #666;
        }

        &.active {
          .step-number {
            background: #10b981;
            color: #fff;
          }
          .step-title { color: #10b981; }
        }

        &.completed {
          .step-number {
            background: #10b981;
            color: #fff;
          }
        }
      }

      .step-divider {
        width: 60px;
        height: 2px;
        background: #e2e8f0;
        margin: 0 0.5rem;

        &.completed { background: #10b981; }
      }

      @media (max-width: 640px) {
        .step-title { display: none; }
        .step-divider { width: 30px; }
      }
    }

    .checkout-content {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .checkout-section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;

      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 1.5rem;
        color: #1a1a1a;
      }

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 1.5rem 0 1rem;
        color: #4a5568;
      }
    }

    .delivery-options, .payment-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .delivery-option, .payment-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      input { display: none; }

      .option-icon {
        font-size: 1.5rem;
      }

      .option-text {
        display: flex;
        flex-direction: column;

        strong { font-size: 1rem; }
        small { color: #666; font-size: 0.85rem; }
      }

      &:hover { border-color: #10b981; }

      &.selected {
        border-color: #10b981;
        background: #ecfdf5;
      }
    }

    .address-form {
      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .form-group {
        flex: 1;

        &.full { flex: 1 0 100%; }
        &.large { flex: 2; }
        &.small { flex: 0.5; min-width: 80px; }

        label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 0.25rem;
        }

        input, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #10b981;
          }
        }
      }
    }

    .prescription-required {
      .warning {
        padding: 0.75rem;
        background: #fffbeb;
        border: 1px solid #fbbf24;
        border-radius: 6px;
        color: #92400e;
        margin-bottom: 1rem;
      }
    }

    .upload-area {
      position: relative;
      border: 2px dashed #e2e8f0;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      margin: 1rem 0;

      input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      &:hover { border-color: #10b981; }
    }

    .prescription-preview {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;

      .preview-item {
        position: relative;
        width: 100px;
        height: 100px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
        }

        .btn-remove {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
        }
      }
    }

    .no-prescription {
      padding: 1rem;
      background: #ecfdf5;
      border-radius: 6px;
      color: #059669;
    }

    .confirmation-summary {
      .summary-block {
        padding: 1rem;
        background: #f7fafc;
        border-radius: 6px;
        margin-bottom: 1rem;

        h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #666;
          margin: 0 0 0.5rem;
          text-transform: uppercase;
        }

        p {
          margin: 0.25rem 0;
          color: #1a1a1a;
        }
      }
    }

    .step-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;

      button {
        padding: 0.875rem 2rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-primary {
        background: #10b981;
        color: #fff;
        border: none;

        &:hover:not(:disabled) { background: #059669; }
      }

      .btn-secondary {
        background: #fff;
        color: #4a5568;
        border: 1px solid #e2e8f0;

        &:hover:not(:disabled) { background: #f7fafc; }
      }

      .btn-confirm {
        background: #0ea5e9;

        &:hover:not(:disabled) { background: #0284c7; }
      }
    }

    .checkout-sidebar {
      @media (max-width: 900px) {
        order: -1;
      }
    }

    .order-summary {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      position: sticky;
      top: 1rem;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem;
      }

      .summary-items {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .summary-item {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem 0;
        font-size: 0.9rem;

        .item-qty {
          color: #666;
          min-width: 30px;
        }

        .item-name {
          flex: 1;
          color: #1a1a1a;
        }

        .item-price {
          color: #1a1a1a;
          font-weight: 500;
        }
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.95rem;

        &.discount { color: #10b981; }

        &.final {
          font-size: 1.1rem;
          font-weight: 700;
          padding-top: 1rem;
          margin-top: 0.5rem;
          border-top: 2px solid #e2e8f0;
        }
      }
    }

    .form-group {
      margin: 1rem 0;

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: #4a5568;
        margin-bottom: 0.25rem;
      }

      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 1rem;
        resize: vertical;

        &:focus {
          outline: none;
          border-color: #10b981;
        }
      }
    }
  `]
})
export class CheckoutPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);

  readonly CHECKOUT_CONFIG = CHECKOUT_CONFIG;

  // Estado
  readonly cart = this.cartService.cart;
  readonly processing = this.checkoutService.processing;
  readonly currentStep = signal(1);
  readonly deliveryType = signal<'delivery' | 'pickup'>('delivery');
  readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);
  readonly prescriptionImages = signal<string[]>([]);
  orderNotes = '';

  // Formulário de endereço
  addressForm: FormGroup = this.fb.group({
    recipientName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)]],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    street: ['', [Validators.required, Validators.minLength(3)]],
    number: ['', Validators.required],
    complement: [''],
    neighborhood: ['', [Validators.required, Validators.minLength(2)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    state: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/i)]]
  });

  // Steps
  steps = [
    { number: 1, title: 'Entrega' },
    { number: 2, title: 'Pagamento' },
    { number: 3, title: 'Receita' },
    { number: 4, title: 'Confirmação' }
  ];

  // Payment methods
  paymentMethods = [
    { id: PAYMENT_METHODS.PIX, name: 'Pix', icon: '📱', description: 'Pagamento instantâneo' },
    { id: PAYMENT_METHODS.CREDIT_CARD, name: 'Cartão de Crédito', icon: '💳', description: 'Parcele em até 12x' },
    { id: PAYMENT_METHODS.DEBIT_CARD, name: 'Cartão de Débito', icon: '💳', description: 'Débito à vista' },
    { id: PAYMENT_METHODS.BOLETO, name: 'Boleto', icon: '📄', description: 'Vence em 3 dias úteis' }
  ];

  // Computed
  readonly requiresPrescription = computed(() => {
    const currentCart = this.cart();
    if (!currentCart) return false;
    return currentCart.items.some(item => item.product?.prescriptionRequired === true);
  });

  ngOnInit(): void {
    // Carregar carrinho se necessário
    const currentCart = this.cart();
    if (!currentCart || currentCart.items.length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  setDeliveryType(type: 'delivery' | 'pickup'): void {
    this.deliveryType.set(type);
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod.set(method);
  }

  canProceedToStep2(): boolean {
    if (this.deliveryType() === 'pickup') return true;
    return this.addressForm.valid;
  }

  nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  onPrescriptionUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const currentImages = this.prescriptionImages();
    const remaining = CHECKOUT_CONFIG.MAX_PRESCRIPTION_IMAGES - currentImages.length;
    
    const files = Array.from(input.files).slice(0, remaining);
    
    files.forEach(file => {
      if (CHECKOUT_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.prescriptionImages.update(imgs => [...imgs, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removePrescriptionImage(index: number): void {
    this.prescriptionImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  getAddressData(): DeliveryAddress | null {
    if (!this.addressForm.valid) return null;
    return this.addressForm.value;
  }

  getSelectedPaymentMethodName(): string {
    const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod());
    return method?.name || '';
  }

  confirmOrder(): void {
    const checkoutData: CheckoutData = {
      deliveryType: this.deliveryType(),
      paymentMethod: this.selectedPaymentMethod()!,
      notes: this.orderNotes || undefined
    };

    if (this.deliveryType() === 'delivery') {
      checkoutData.deliveryAddress = this.getAddressData()!;
    }

    const currentCart = this.cart();
    if (!currentCart) {
      alert('Carrinho vazio');
      return;
    }

    this.checkoutService.processCheckout(currentCart, checkoutData).subscribe({
      next: (result) => {
        if (result.success) {
          // Navegar para página de confirmação/pagamento
          this.router.navigate(['/order-confirmation', result.orderId]);
        } else {
          alert(result.errorMessage || 'Erro ao processar pedido');
        }
      },
      error: (error) => {
        console.error('Erro no checkout:', error);
        alert('Erro ao processar pedido. Tente novamente.');
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }
}
