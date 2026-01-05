/**
 * 🏷️ Order Status Badge Component
 * Componente para exibição visual do status de pedidos
 *
 * Features:
 * - Visual distintivo por status
 * - Ícones contextuais
 * - Animação pulsante para status ativos
 * - Integração com OrderStatusService
 * - Acessibilidade (ARIA)
 *
 * @author Medicamenta.me
 * @version 1.0.0
 */

import { Component, Input, computed, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus, ORDER_STATUS_LABELS } from '../../../models/order.model';
import { OrderStatusService, OrderStatusInfo } from '../../../services/order-status.service';

/**
 * Configuração visual por status
 */
interface StatusConfig {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse: boolean;
}

/**
 * Tamanhos disponíveis
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Variantes de estilo
 */
export type BadgeVariant = 'solid' | 'outline' | 'subtle';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="order-status-badge"
      [class]="badgeClasses()"
      [attr.aria-label]="ariaLabel()"
      role="status"
    >
      <!-- Pulse animation for active statuses -->
      @if (config().pulse && animated) {
        <span class="pulse-ring"></span>
      }

      <!-- Icon -->
      @if (showIcon) {
        <span class="badge-icon" aria-hidden="true">{{ config().icon }}</span>
      }

      <!-- Label -->
      @if (showLabel) {
        <span class="badge-label">{{ config().label }}</span>
      }

      <!-- Progress indicator (optional) -->
      @if (showProgress && progressPercent() > 0) {
        <span class="badge-progress" [style.width.%]="progressPercent()"></span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .order-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 16px;
      font-weight: 500;
      font-size: 13px;
      line-height: 1.4;
      position: relative;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    /* Sizes */
    .badge-sm {
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 12px;
    }

    .badge-sm .badge-icon {
      font-size: 12px;
    }

    .badge-md {
      padding: 4px 10px;
      font-size: 13px;
    }

    .badge-lg {
      padding: 6px 14px;
      font-size: 15px;
      border-radius: 20px;
    }

    .badge-lg .badge-icon {
      font-size: 18px;
    }

    /* Variant: Solid */
    .variant-solid {
      color: white;
    }

    /* Variant: Outline */
    .variant-outline {
      background: transparent;
      border-width: 2px;
      border-style: solid;
    }

    /* Variant: Subtle */
    .variant-subtle {
      border: none;
    }

    /* Status Colors - Solid */
    .status-pending_payment.variant-solid { background: #f59e0b; }
    .status-payment_confirmed.variant-solid { background: #10b981; }
    .status-prescription_pending.variant-solid { background: #f59e0b; }
    .status-prescription_approved.variant-solid { background: #10b981; }
    .status-preparing.variant-solid { background: #3b82f6; }
    .status-ready_for_pickup.variant-solid { background: #8b5cf6; }
    .status-out_for_delivery.variant-solid { background: #06b6d4; }
    .status-delivered.variant-solid { background: #10b981; }
    .status-completed.variant-solid { background: #059669; }
    .status-canceled.variant-solid { background: #ef4444; }
    .status-refunded.variant-solid { background: #6b7280; }

    /* Status Colors - Outline */
    .status-pending_payment.variant-outline {
      border-color: #f59e0b;
      color: #f59e0b;
    }
    .status-payment_confirmed.variant-outline {
      border-color: #10b981;
      color: #10b981;
    }
    .status-prescription_pending.variant-outline {
      border-color: #f59e0b;
      color: #f59e0b;
    }
    .status-prescription_approved.variant-outline {
      border-color: #10b981;
      color: #10b981;
    }
    .status-preparing.variant-outline {
      border-color: #3b82f6;
      color: #3b82f6;
    }
    .status-ready_for_pickup.variant-outline {
      border-color: #8b5cf6;
      color: #8b5cf6;
    }
    .status-out_for_delivery.variant-outline {
      border-color: #06b6d4;
      color: #06b6d4;
    }
    .status-delivered.variant-outline {
      border-color: #10b981;
      color: #10b981;
    }
    .status-completed.variant-outline {
      border-color: #059669;
      color: #059669;
    }
    .status-canceled.variant-outline {
      border-color: #ef4444;
      color: #ef4444;
    }
    .status-refunded.variant-outline {
      border-color: #6b7280;
      color: #6b7280;
    }

    /* Status Colors - Subtle */
    .status-pending_payment.variant-subtle {
      background: #fef3c7;
      color: #92400e;
    }
    .status-payment_confirmed.variant-subtle {
      background: #d1fae5;
      color: #065f46;
    }
    .status-prescription_pending.variant-subtle {
      background: #fef3c7;
      color: #92400e;
    }
    .status-prescription_approved.variant-subtle {
      background: #d1fae5;
      color: #065f46;
    }
    .status-preparing.variant-subtle {
      background: #dbeafe;
      color: #1e40af;
    }
    .status-ready_for_pickup.variant-subtle {
      background: #ede9fe;
      color: #5b21b6;
    }
    .status-out_for_delivery.variant-subtle {
      background: #cffafe;
      color: #0e7490;
    }
    .status-delivered.variant-subtle {
      background: #d1fae5;
      color: #065f46;
    }
    .status-completed.variant-subtle {
      background: #d1fae5;
      color: #047857;
    }
    .status-canceled.variant-subtle {
      background: #fee2e2;
      color: #991b1b;
    }
    .status-refunded.variant-subtle {
      background: #f3f4f6;
      color: #374151;
    }

    /* Icon styles */
    .badge-icon {
      font-size: 14px;
      line-height: 1;
    }

    /* Label styles */
    .badge-label {
      white-space: nowrap;
    }

    /* Pulse animation */
    .pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      pointer-events: none;
    }

    .status-pending_payment .pulse-ring { background: rgba(245, 158, 11, 0.3); }
    .status-preparing .pulse-ring { background: rgba(59, 130, 246, 0.3); }
    .status-out_for_delivery .pulse-ring { background: rgba(6, 182, 212, 0.3); }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.05); }
    }

    /* Progress bar (for timeline-like display) */
    .badge-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.5);
      transition: width 0.3s ease;
    }

    /* Interactive state */
    .interactive {
      cursor: pointer;
    }

    .interactive:hover {
      transform: scale(1.02);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    /* Real-time indicator */
    .realtime-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: blink 1s ease-in-out infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class OrderStatusBadgeComponent implements OnInit, OnDestroy {
  private readonly orderStatusService = inject(OrderStatusService);

  // ===== INPUTS =====

  /** Status a ser exibido (estático) */
  @Input() status: OrderStatus | null = null;

  /** ID do pedido para monitoramento real-time */
  @Input() orderId: string | null = null;

  /** Tamanho do badge */
  @Input() size: BadgeSize = 'md';

  /** Variante de estilo */
  @Input() variant: BadgeVariant = 'subtle';

  /** Exibir ícone */
  @Input() showIcon = true;

  /** Exibir label */
  @Input() showLabel = true;

  /** Exibir barra de progresso */
  @Input() showProgress = false;

  /** Animar status ativos */
  @Input() animated = true;

  /** Badge clicável */
  @Input() interactive = false;

  // ===== PRIVATE STATE =====

  /** Status real-time (quando usando orderId) */
  private realtimeStatus = signal<OrderStatusInfo | null>(null);

  // ===== COMPUTED =====

  /** Status efetivo (real-time ou estático) */
  readonly effectiveStatus = computed(() => {
    const realtime = this.realtimeStatus();
    if (realtime) {
      return realtime.status;
    }
    return this.status || OrderStatus.PENDING_PAYMENT;
  });

  /** Configuração visual para o status atual */
  readonly config = computed((): StatusConfig => {
    return this.getStatusConfig(this.effectiveStatus());
  });

  /** Classes CSS do badge */
  readonly badgeClasses = computed(() => {
    const status = this.effectiveStatus();
    const statusClass = `status-${status}`;

    return [
      statusClass,
      `badge-${this.size}`,
      `variant-${this.variant}`,
      this.interactive ? 'interactive' : ''
    ].filter(Boolean).join(' ');
  });

  /** Texto para acessibilidade */
  readonly ariaLabel = computed(() => {
    const label = this.config().label;
    return `Status do pedido: ${label}`;
  });

  /** Percentual de progresso */
  readonly progressPercent = computed(() => {
    return this.orderStatusService.calculateProgress(this.effectiveStatus());
  });

  // ===== LIFECYCLE =====

  ngOnInit(): void {
    // Se tiver orderId, inicia monitoramento real-time
    if (this.orderId) {
      this.startRealtimeWatch();
    }
  }

  ngOnDestroy(): void {
    // Para monitoramento ao destruir
    if (this.orderId) {
      this.orderStatusService.unwatchOrder(this.orderId);
    }
  }

  // ===== PRIVATE METHODS =====

  private startRealtimeWatch(): void {
    if (!this.orderId) return;

    const statusSignal = this.orderStatusService.watchOrder(this.orderId, {
      notifyOnChange: false // Badge não deve disparar toasts
    });

    // Subscreve ao signal
    // Em Angular 18+, podemos usar effect() ou toObservable()
    // Por simplicidade, verificamos o valor periodicamente
    // O signal será atualizado automaticamente pelo service
    this.realtimeStatus = statusSignal as any;
  }

  private getStatusConfig(status: OrderStatus): StatusConfig {
    const configs: Record<OrderStatus, StatusConfig> = {
      [OrderStatus.PENDING_PAYMENT]: {
        icon: '⏳',
        label: 'Aguardando Pagamento',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        pulse: true
      },
      [OrderStatus.PAYMENT_CONFIRMED]: {
        icon: '✅',
        label: 'Pagamento Confirmado',
        color: '#10b981',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        pulse: false
      },
      [OrderStatus.PRESCRIPTION_PENDING]: {
        icon: '📋',
        label: 'Aguardando Receita',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        pulse: true
      },
      [OrderStatus.PRESCRIPTION_APPROVED]: {
        icon: '✅',
        label: 'Receita Aprovada',
        color: '#10b981',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        pulse: false
      },
      [OrderStatus.PREPARING]: {
        icon: '📦',
        label: 'Preparando',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        borderColor: '#3b82f6',
        pulse: true
      },
      [OrderStatus.READY_FOR_PICKUP]: {
        icon: '🏪',
        label: 'Pronto para Retirada',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        borderColor: '#8b5cf6',
        pulse: false
      },
      [OrderStatus.OUT_FOR_DELIVERY]: {
        icon: '🚚',
        label: 'Saiu para Entrega',
        color: '#06b6d4',
        bgColor: '#cffafe',
        borderColor: '#06b6d4',
        pulse: true
      },
      [OrderStatus.DELIVERED]: {
        icon: '🎉',
        label: 'Entregue',
        color: '#10b981',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        pulse: false
      },
      [OrderStatus.COMPLETED]: {
        icon: '✅',
        label: 'Concluído',
        color: '#059669',
        bgColor: '#d1fae5',
        borderColor: '#059669',
        pulse: false
      },
      [OrderStatus.CANCELED]: {
        icon: '❌',
        label: 'Cancelado',
        color: '#ef4444',
        bgColor: '#fee2e2',
        borderColor: '#ef4444',
        pulse: false
      },
      [OrderStatus.REFUNDED]: {
        icon: '💰',
        label: 'Reembolsado',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        borderColor: '#6b7280',
        pulse: false
      }
    };

    return configs[status] || configs[OrderStatus.PENDING_PAYMENT];
  }
}
