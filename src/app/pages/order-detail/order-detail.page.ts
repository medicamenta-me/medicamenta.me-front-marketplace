/**
 * 📄 Order Detail Page
 * Página de detalhes de um pedido específico
 * 
 * Features:
 * - Informações completas do pedido
 * - Timeline de status detalhado
 * - Informações de entrega/retirada
 * - Detalhes de pagamento
 * - Lista de itens
 * - Ações: Cancelar, Refazer pedido, Contato
 * - 🆕 Real-time status updates via Firestore
 * - 🆕 Toast notifications on status changes
 * 
 * @version 2.0.0 - Real-time integration (M3.3)
 */

import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Order, OrderStatus, ORDER_STATUS_LABELS, PaymentStatus, OrderStatusChange } from '../../models/order.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';
import { OrderStatusService, OrderStatusInfo } from '../../services/order-status.service';
import { ToastService } from '../../services/toast.service';

// Order service interface for dependency injection
export interface OrderDetailService {
  getOrder(orderId: string): Promise<Order | null>;
  cancelOrder(orderId: string, reason: string): Promise<void>;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, OrderStatusBadgeComponent],
  template: `
    <div class="order-detail-page">
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
          <a routerLink="/orders" class="btn-primary">Ver Meus Pedidos</a>
        </div>
      }

      <!-- Order Details -->
      @if (order() && !loading() && !error()) {
        <div class="order-content">
          <!-- Header -->
          <header class="order-header">
            <div class="header-left">
              <a routerLink="/orders" class="back-link">← Voltar</a>
              <h1>Pedido #{{ order()!.orderNumber }}</h1>
              <p class="order-date">Realizado em {{ formatDate(order()!.createdAt) }}</p>
            </div>
            <div class="header-right">
              <app-order-status-badge
                [orderId]="order()!.id"
                [status]="currentStatus()"
                size="lg"
                variant="solid"
                [showProgress]="true"
                [animated]="true"
              ></app-order-status-badge>
            </div>
          </header>

          <!-- Status Timeline -->
          <section class="status-timeline-section">
            <h2>Acompanhamento</h2>
            <div class="timeline">
              @for (step of statusSteps(); track step.status) {
                <div 
                  class="timeline-step"
                  [class.completed]="isStepCompleted(step.status)"
                  [class.current]="isCurrentStep(step.status)"
                  [class.canceled]="order()!.status === orderStatusCanceled"
                >
                  <div class="step-line"></div>
                  <div class="step-dot"></div>
                  <div class="step-content">
                    <span class="step-icon">{{ step.icon }}</span>
                    <span class="step-label">{{ step.label }}</span>
                    @if (getStepDate(step.status)) {
                      <span class="step-date">{{ getStepDate(step.status) }}</span>
                    }
                  </div>
                </div>
              }
            </div>

            @if (order()!.trackingCode) {
              <div class="tracking-info">
                <span class="label">Código de rastreio:</span>
                <span class="code">{{ order()!.trackingCode }}</span>
                <button class="btn-copy" (click)="copyTrackingCode()">📋</button>
              </div>
            }
          </section>

          <!-- Delivery/Pickup Info -->
          <section class="delivery-section">
            <h2>{{ order()!.deliveryType === 'delivery' ? 'Entrega' : 'Retirada' }}</h2>
            
            @if (order()!.deliveryType === 'delivery' && order()!.deliveryAddress) {
              <div class="address-card">
                <div class="address-icon">📍</div>
                <div class="address-details">
                  <p class="recipient">{{ order()!.deliveryAddress!.recipientName }}</p>
                  <p>{{ formatAddress(order()!.deliveryAddress) }}</p>
                  @if (order()!.deliveryAddress!.complement) {
                    <p>{{ order()!.deliveryAddress!.complement }}</p>
                  }
                  <p class="phone">📞 {{ order()!.deliveryAddress!.phone }}</p>
                </div>
              </div>
              @if (order()!.estimatedDeliveryTime) {
                <div class="delivery-estimate">
                  <span class="label">Previsão:</span>
                  <span class="value">{{ order()!.estimatedDeliveryTime }}</span>
                </div>
              }
            } @else {
              <div class="pickup-card">
                <div class="pickup-icon">🏪</div>
                <div class="pickup-details">
                  <p class="pharmacy-name">{{ order()!.pharmacyName }}</p>
                  <p>Retire seu pedido na farmácia</p>
                </div>
              </div>
            }
          </section>

          <!-- Payment Info -->
          <section class="payment-section">
            <h2>Pagamento</h2>
            <div class="payment-card">
              <div class="payment-method">
                <span class="method-icon">{{ getPaymentMethodIcon() }}</span>
                <div class="method-info">
                  <span class="method-name">{{ getPaymentMethodName() }}</span>
                  <span 
                    class="payment-status"
                    [class]="getPaymentStatusClass()"
                  >
                    {{ getPaymentStatusLabel() }}
                  </span>
                </div>
              </div>

              @if (order()!.paidAt) {
                <div class="paid-info">
                  <span class="label">Pago em:</span>
                  <span class="value">{{ formatDate(order()!.paidAt!) }}</span>
                </div>
              }

              @if (order()!.paymentMethod === 'pix' && order()!.paymentStatus === 'pending' && order()!.pixCode) {
                <div class="pix-pending">
                  <p>Escaneie o QR Code ou copie o código PIX:</p>
                  <div class="pix-code">
                    <code>{{ order()!.pixCode }}</code>
                    <button class="btn-copy" (click)="copyPixCode()">📋 Copiar</button>
                  </div>
                </div>
              }

              @if (order()!.paymentMethod === 'boleto' && order()!.paymentStatus === 'pending' && order()!.boletoUrl) {
                <div class="boleto-pending">
                  <a [href]="order()!.boletoUrl" target="_blank" class="btn-boleto">
                    📄 Ver Boleto
                  </a>
                </div>
              }
            </div>
          </section>

          <!-- Order Items -->
          <section class="items-section">
            <h2>Itens do Pedido ({{ order()!.items.length }})</h2>
            <div class="items-list">
              @for (item of order()!.items; track item.productId) {
                <div class="item-row">
                  <div class="item-image">
                    @if (item.productImage) {
                      <img [src]="item.productImage" [alt]="item.productName" />
                    } @else {
                      <div class="placeholder-image">📦</div>
                    }
                  </div>
                  <div class="item-info">
                    <h3>{{ item.productName }}</h3>
                    <p class="item-price">{{ formatCurrency(item.unitPrice) }} x {{ item.quantity }}</p>
                  </div>
                  <div class="item-total">
                    {{ formatCurrency(item.subtotal) }}
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Order Summary -->
          <section class="summary-section">
            <h2>Resumo</h2>
            <div class="summary-card">
              <div class="summary-line">
                <span>Subtotal ({{ order()!.items.length }} {{ order()!.items.length === 1 ? 'item' : 'itens' }})</span>
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
          @if (order()!.notes || order()!.pharmacyNotes) {
            <section class="notes-section">
              <h2>Observações</h2>
              @if (order()!.notes) {
                <div class="note-card">
                  <span class="note-label">Suas observações:</span>
                  <p>{{ order()!.notes }}</p>
                </div>
              }
              @if (order()!.pharmacyNotes) {
                <div class="note-card pharmacy">
                  <span class="note-label">Observações da farmácia:</span>
                  <p>{{ order()!.pharmacyNotes }}</p>
                </div>
              }
            </section>
          }

          <!-- Actions -->
          <section class="actions-section">
            @if (canCancel()) {
              <button class="btn-danger" (click)="cancelOrder()">
                ❌ Cancelar Pedido
              </button>
            }
            @if (canReorder()) {
              <button class="btn-secondary" (click)="reorder()">
                🔄 Refazer Pedido
              </button>
            }
            <a routerLink="/orders" class="btn-outline">
              📋 Ver Todos os Pedidos
            </a>
          </section>

          <!-- Help -->
          <section class="help-section">
            <h2>Precisa de Ajuda?</h2>
            <div class="help-options">
              <a href="mailto:suporte@medicamenta.me" class="help-link">
                📧 suporte&#64;medicamenta.me
              </a>
              <a href="tel:+5511999999999" class="help-link">
                📞 (11) 99999-9999
              </a>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-detail-page {
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

    .error-icon {
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

    /* Header */
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .back-link {
      color: #0066cc;
      text-decoration: none;
      font-size: 14px;
      display: block;
      margin-bottom: 8px;
    }

    .order-header h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 4px;
    }

    .order-date {
      font-size: 14px;
      color: #666;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .status-badge.pending {
      background: #fff3e0;
      color: #e65100;
    }

    .status-badge.confirmed {
      background: #e3f2fd;
      color: #1565c0;
    }

    .status-badge.preparing {
      background: #fce4ec;
      color: #c2185b;
    }

    .status-badge.shipped {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.delivered {
      background: #e8f5e9;
      color: #1b5e20;
    }

    .status-badge.canceled {
      background: #ffebee;
      color: #c62828;
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

    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 40px;
    }

    .timeline-step {
      position: relative;
      padding-bottom: 24px;
    }

    .timeline-step:last-child {
      padding-bottom: 0;
    }

    .step-line {
      position: absolute;
      left: -28px;
      top: 12px;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .timeline-step:last-child .step-line {
      display: none;
    }

    .step-dot {
      position: absolute;
      left: -32px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e0e0e0;
      border: 2px solid white;
    }

    .timeline-step.completed .step-dot {
      background: #4caf50;
    }

    .timeline-step.current .step-dot {
      background: #2196f3;
      width: 14px;
      height: 14px;
      left: -34px;
      top: 2px;
      animation: pulse 2s infinite;
    }

    .timeline-step.canceled .step-dot {
      background: #f44336;
    }

    .timeline-step.completed .step-line {
      background: #4caf50;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    .step-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .step-icon {
      font-size: 20px;
    }

    .step-label {
      font-weight: 500;
      color: #333;
    }

    .step-date {
      font-size: 12px;
      color: #999;
      margin-left: auto;
    }

    .tracking-info {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tracking-info .label {
      font-size: 13px;
      color: #666;
    }

    .tracking-info .code {
      font-family: monospace;
      font-weight: 600;
      color: #333;
    }

    /* Address & Pickup Cards */
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

    .delivery-estimate {
      margin-top: 12px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
    }

    /* Payment */
    .payment-card {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .method-icon {
      font-size: 32px;
    }

    .method-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .method-name {
      font-weight: 600;
      color: #333;
    }

    .payment-status {
      font-size: 13px;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .payment-status.paid {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .payment-status.pending {
      background: #fff3e0;
      color: #e65100;
    }

    .payment-status.failed {
      background: #ffebee;
      color: #c62828;
    }

    .paid-info {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
    }

    .paid-info .label {
      color: #666;
      margin-right: 8px;
    }

    .pix-pending, .boleto-pending {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
    }

    .pix-code {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .pix-code code {
      flex: 1;
      padding: 8px;
      background: white;
      border-radius: 4px;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Items List */
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .item-image {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      background: white;
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
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .item-info {
      flex: 1;
    }

    .item-info h3 {
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
    }

    .item-price {
      font-size: 13px;
      color: #666;
    }

    .item-total {
      font-weight: 600;
      color: #333;
    }

    /* Summary */
    .summary-card {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #666;
    }

    .summary-line.discount span {
      color: #2e7d32;
    }

    .summary-line.total {
      padding-top: 12px;
      margin-top: 8px;
      border-top: 1px solid #ddd;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    /* Notes */
    .note-card {
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .note-card:last-child {
      margin-bottom: 0;
    }

    .note-card.pharmacy {
      background: #e3f2fd;
    }

    .note-label {
      font-size: 12px;
      color: #666;
      display: block;
      margin-bottom: 4px;
    }

    .note-card p {
      margin: 0;
      color: #333;
    }

    /* Actions */
    .actions-section {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .btn-primary, .btn-secondary, .btn-outline, .btn-danger {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #0066cc;
      color: white;
    }

    .btn-primary:hover {
      background: #0052a3;
    }

    .btn-secondary {
      background: white;
      color: #0066cc;
      border: 1px solid #0066cc;
    }

    .btn-secondary:hover {
      background: #f0f7ff;
    }

    .btn-outline {
      background: white;
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-outline:hover {
      border-color: #999;
      color: #333;
    }

    .btn-danger {
      background: #f44336;
      color: white;
    }

    .btn-danger:hover {
      background: #d32f2f;
    }

    .btn-copy {
      padding: 8px 12px;
      background: #e0e0e0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-copy:hover {
      background: #ccc;
    }

    .btn-boleto {
      display: inline-block;
      padding: 12px 24px;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 8px;
    }

    /* Help Section */
    .help-options {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .help-link {
      color: #0066cc;
      text-decoration: none;
    }

    .help-link:hover {
      text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .order-header {
        flex-direction: column;
        gap: 16px;
      }

      .actions-section {
        flex-direction: column;
      }

      .actions-section button,
      .actions-section a {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class OrderDetailPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orderStatusService = inject(OrderStatusService);
  private toastService = inject(ToastService);

  // Signals
  order = signal<Order | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Real-time status signal
  private realtimeStatus = signal<OrderStatusInfo | null>(null);

  // Expose enum to template
  orderStatusCanceled = OrderStatus.CANCELED;

  // Current order ID for cleanup
  private currentOrderId: string | null = null;

  // Computed: current status (real-time > order)
  currentStatus = computed(() => {
    const realtime = this.realtimeStatus();
    if (realtime) {
      return realtime.status;
    }
    return this.order()?.status ?? OrderStatus.PENDING_PAYMENT;
  });

  // Effect: update order when real-time status changes
  private statusEffect = effect(() => {
    const realtime = this.realtimeStatus();
    const currentOrder = this.order();
    
    if (realtime && currentOrder && realtime.status !== currentOrder.status) {
      // Update local order with new status
      this.order.set({
        ...currentOrder,
        status: realtime.status,
        updatedAt: realtime.updatedAt
      });
      
      console.log(`[OrderDetailPage] Real-time status update: ${realtime.previousStatus} → ${realtime.status}`);
    }
  });

  // Status steps for timeline
  statusSteps = computed(() => [
    { status: OrderStatus.PENDING_PAYMENT, icon: '💳', label: 'Pagamento' },
    { status: OrderStatus.PAYMENT_CONFIRMED, icon: '✅', label: 'Confirmado' },
    { status: OrderStatus.PREPARING, icon: '📦', label: 'Preparando' },
    { status: OrderStatus.OUT_FOR_DELIVERY, icon: '🚚', label: 'A caminho' },
    { status: OrderStatus.DELIVERED, icon: '🎉', label: 'Entregue' }
  ]);

  // Order service (will be injected in real app)
  private orderService: OrderDetailService | null = null;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    
    if (!orderId) {
      this.error.set('ID do pedido não informado');
      this.loading.set(false);
      return;
    }

    this.currentOrderId = orderId;
    this.loadOrder(orderId);
    this.startRealtimeWatch(orderId);
  }

  ngOnDestroy(): void {
    // Cleanup: stop watching order
    if (this.currentOrderId) {
      this.orderStatusService.unwatchOrder(this.currentOrderId);
      console.log(`[OrderDetailPage] Stopped watching order ${this.currentOrderId}`);
    }
    
    // Cleanup: clear status check interval
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * Inicia monitoramento real-time do pedido
   */
  private startRealtimeWatch(orderId: string): void {
    const statusSignal = this.orderStatusService.watchOrder(orderId, {
      notifyOnChange: true,
      onStatusChange: (prev, current) => {
        this.handleStatusChange(prev, current);
      }
    });

    // Store reference to watch for changes
    // The signal updates automatically via Firestore listener
    this.watchStatusUpdates(statusSignal);

    console.log(`[OrderDetailPage] Started real-time watch for order ${orderId}`);
  }

  /**
   * Monitora atualizações do signal de status
   */
  private watchStatusUpdates(statusSignal: ReturnType<typeof this.orderStatusService.watchOrder>): void {
    // Poll the signal periodically to update local state
    // This is a workaround since effects cannot be created dynamically
    const checkInterval = setInterval(() => {
      const status = statusSignal();
      if (status) {
        const current = this.realtimeStatus();
        if (!current || current.status !== status.status || current.updatedAt !== status.updatedAt) {
          this.realtimeStatus.set(status);
        }
      }
    }, 500);

    // Store interval for cleanup
    this.statusCheckInterval = checkInterval;
  }

  // Interval reference for cleanup
  private statusCheckInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Trata mudança de status com notificação toast
   */
  private handleStatusChange(previousStatus: OrderStatus, newStatus: OrderStatus): void {
    const notification = this.orderStatusService.getStatusNotification(newStatus);
    
    this.toastService.show({
      message: `${notification.icon} ${notification.message}`,
      color: notification.color,
      duration: 5000,
      dismissible: true
    });

    console.log(`[OrderDetailPage] Status changed: ${previousStatus} → ${newStatus}`);
  }

  async loadOrder(orderId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

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
        },
        {
          productId: 'prod-2',
          productName: 'Paracetamol 750mg',
          quantity: 1,
          unitPrice: 1500,
          subtotal: 1500,
          discount: 0,
          total: 1500
        }
      ],
      subtotal: 5480,
      deliveryFee: 999,
      discount: 500,
      total: 5979,
      status: OrderStatus.OUT_FOR_DELIVERY,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pix',
      deliveryType: 'delivery',
      deliveryAddress: {
        recipientName: 'João Silva',
        phone: '(11) 99999-9999',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      estimatedDeliveryTime: 'Hoje, até 18h',
      trackingCode: 'BR123456789',
      notes: 'Entregar na portaria',
      prescriptionRequired: false,
      prescriptionVerified: false,
      statusHistory: [
        { status: OrderStatus.PENDING_PAYMENT, timestamp: new Date(Date.now() - 3600000 * 5) },
        { status: OrderStatus.PAYMENT_CONFIRMED, timestamp: new Date(Date.now() - 3600000 * 4) },
        { status: OrderStatus.PREPARING, timestamp: new Date(Date.now() - 3600000 * 2) },
        { status: OrderStatus.OUT_FOR_DELIVERY, timestamp: new Date(Date.now() - 3600000) }
      ],
      paidAt: new Date(Date.now() - 3600000 * 4),
      createdAt: new Date(Date.now() - 3600000 * 5),
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

  getStepDate(status: OrderStatus): string {
    const order = this.order();
    if (!order?.statusHistory) return '';

    const historyItem = order.statusHistory.find(h => h.status === status);
    if (historyItem) {
      return this.formatDateTime(historyItem.timestamp);
    }
    return '';
  }

  canCancel(): boolean {
    const order = this.order();
    if (!order) return false;

    const cancelableStatuses = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAYMENT_CONFIRMED
    ];

    return cancelableStatuses.includes(order.status);
  }

  canReorder(): boolean {
    const order = this.order();
    if (!order) return false;

    const reorderableStatuses = [
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELED
    ];

    return reorderableStatuses.includes(order.status);
  }

  cancelOrder(): void {
    if (confirm('Tem certeza que deseja cancelar este pedido?')) {
      console.log('Cancelando pedido...');
      // In real app, would call orderService.cancelOrder
    }
  }

  reorder(): void {
    console.log('Refazendo pedido...');
    this.router.navigate(['/cart']);
  }

  copyTrackingCode(): void {
    const order = this.order();
    if (order?.trackingCode) {
      navigator.clipboard.writeText(order.trackingCode).then(() => {
        alert('Código de rastreio copiado!');
      });
    }
  }

  copyPixCode(): void {
    const order = this.order();
    if (order?.pixCode) {
      navigator.clipboard.writeText(order.pixCode).then(() => {
        alert('Código PIX copiado!');
      });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAddress(address: Order['deliveryAddress']): string {
    if (!address) return '';
    return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zipCode}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  getStatusClass(status: OrderStatus): string {
    const classMap: Record<string, string> = {
      [OrderStatus.PENDING_PAYMENT]: 'pending',
      [OrderStatus.PAYMENT_CONFIRMED]: 'confirmed',
      [OrderStatus.PREPARING]: 'preparing',
      [OrderStatus.READY_FOR_PICKUP]: 'preparing',
      [OrderStatus.OUT_FOR_DELIVERY]: 'shipped',
      [OrderStatus.DELIVERED]: 'delivered',
      [OrderStatus.COMPLETED]: 'delivered',
      [OrderStatus.CANCELED]: 'canceled',
      [OrderStatus.REFUNDED]: 'canceled'
    };
    return classMap[status] || 'pending';
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
}
