/**
 * 📦 Order Status Service
 * Serviço para monitoramento real-time de status de pedidos via Firestore onSnapshot
 *
 * Features:
 * - Real-time updates via Firestore listeners
 * - Toast notifications em mudanças de status
 * - Gerenciamento automático de listeners
 * - Cache em memória para status recentes
 * - Cleanup automático no destroy
 *
 * @author Medicamenta.me
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed, OnDestroy, WritableSignal } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  Unsubscribe,
  collection,
  query,
  where,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { ToastService } from './toast.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS, OrderStatusChange } from '../models/order.model';

/**
 * Status simplificado para real-time tracking
 */
export interface OrderStatusInfo {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  updatedAt: Date;
  trackingCode: string | null;
  estimatedDelivery: string | null;
  pharmacyNotes: string | null;
  statusHistory: OrderStatusChange[];
}

/**
 * Opções de watch
 */
export interface WatchOptions {
  notifyOnChange?: boolean;
  onStatusChange?: (prev: OrderStatus, current: OrderStatus) => void;
}

/**
 * Status de conexão do listener
 */
export type ListenerStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

/**
 * Métricas do serviço
 */
export interface OrderStatusMetrics {
  activeListeners: number;
  totalUpdates: number;
  statusChanges: number;
  errors: number;
  lastUpdateAt: Date | null;
}

/**
 * Mapeamento de status para ícones e mensagens
 */
const STATUS_NOTIFICATIONS: Record<OrderStatus, { icon: string; message: string; color: 'success' | 'warning' | 'danger' | 'primary' }> = {
  [OrderStatus.PENDING_PAYMENT]: { icon: '⏳', message: 'Aguardando pagamento', color: 'warning' },
  [OrderStatus.PAYMENT_CONFIRMED]: { icon: '✅', message: 'Pagamento confirmado!', color: 'success' },
  [OrderStatus.PRESCRIPTION_PENDING]: { icon: '📋', message: 'Aguardando verificação da receita', color: 'warning' },
  [OrderStatus.PRESCRIPTION_APPROVED]: { icon: '✅', message: 'Receita aprovada!', color: 'success' },
  [OrderStatus.PREPARING]: { icon: '📦', message: 'Seu pedido está sendo preparado!', color: 'primary' },
  [OrderStatus.READY_FOR_PICKUP]: { icon: '🏪', message: 'Pedido pronto para retirada!', color: 'success' },
  [OrderStatus.OUT_FOR_DELIVERY]: { icon: '🚚', message: 'Pedido saiu para entrega!', color: 'success' },
  [OrderStatus.DELIVERED]: { icon: '🎉', message: 'Pedido entregue! Obrigado!', color: 'success' },
  [OrderStatus.COMPLETED]: { icon: '✅', message: 'Pedido concluído com sucesso!', color: 'success' },
  [OrderStatus.CANCELED]: { icon: '❌', message: 'Pedido cancelado', color: 'danger' },
  [OrderStatus.REFUNDED]: { icon: '💰', message: 'Reembolso processado', color: 'warning' }
};

/**
 * Ordem dos status para determinar progressão
 */
const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PRESCRIPTION_PENDING,
  OrderStatus.PRESCRIPTION_APPROVED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED
];

@Injectable({ providedIn: 'root' })
export class OrderStatusService implements OnDestroy {
  private readonly firestore = inject(Firestore);
  private readonly toastService = inject(ToastService);

  // Mapa de listeners ativos
  private readonly listeners = new Map<string, Unsubscribe>();

  // Mapa de signals de status por orderId
  private readonly orderStatusSignals = new Map<string, WritableSignal<OrderStatusInfo | null>>();

  // Mapa de callbacks personalizados
  private readonly statusCallbacks = new Map<string, WatchOptions>();

  // Status de conexão por orderId
  private readonly listenerStatuses = new Map<string, WritableSignal<ListenerStatus>>();

  // Métricas globais
  private readonly _metrics = signal<OrderStatusMetrics>({
    activeListeners: 0,
    totalUpdates: 0,
    statusChanges: 0,
    errors: 0,
    lastUpdateAt: null
  });

  // Signal global de status (opcional, para uso em UI)
  readonly metrics = this._metrics.asReadonly();

  // Computed para verificar se tem listeners ativos
  readonly hasActiveListeners = computed(() => this._metrics().activeListeners > 0);

  /**
   * Inicia monitoramento real-time de um pedido
   *
   * @param orderId ID do pedido
   * @param options Opções de watch
   * @returns Signal com o status atual
   */
  watchOrder(orderId: string, options: WatchOptions = {}): WritableSignal<OrderStatusInfo | null> {
    // Se já existe listener, retorna signal existente
    if (this.orderStatusSignals.has(orderId)) {
      // Atualiza callbacks se fornecidos
      if (options.onStatusChange || options.notifyOnChange !== undefined) {
        this.statusCallbacks.set(orderId, { ...this.statusCallbacks.get(orderId), ...options });
      }
      return this.orderStatusSignals.get(orderId)!;
    }

    // Cria novo signal para este pedido
    const statusSignal = signal<OrderStatusInfo | null>(null);
    this.orderStatusSignals.set(orderId, statusSignal);

    // Cria signal de status de conexão
    const connectionStatus = signal<ListenerStatus>('connecting');
    this.listenerStatuses.set(orderId, connectionStatus);

    // Armazena opções
    this.statusCallbacks.set(orderId, options);

    // Configura listener do Firestore
    const orderRef = doc(this.firestore, 'orders', orderId);

    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        connectionStatus.set('connected');

        if (snapshot.exists()) {
          const data = snapshot.data();
          const previousStatus = statusSignal()?.status;
          const newStatus = data['status'] as OrderStatus;

          const statusInfo: OrderStatusInfo = {
            orderId,
            orderNumber: data['orderNumber'] || orderId.slice(-8).toUpperCase(),
            status: newStatus,
            previousStatus,
            updatedAt: data['updatedAt']?.toDate() || new Date(),
            trackingCode: data['trackingCode'] || null,
            estimatedDelivery: data['estimatedDeliveryTime'] || null,
            pharmacyNotes: data['pharmacyNotes'] || null,
            statusHistory: this.parseStatusHistory(data['statusHistory'])
          };

          // Verifica se houve mudança de status
          if (previousStatus && previousStatus !== newStatus) {
            this.handleStatusChange(orderId, previousStatus, newStatus, options);
          }

          statusSignal.set(statusInfo);

          // Atualiza métricas
          this.updateMetrics({
            totalUpdates: this._metrics().totalUpdates + 1,
            statusChanges: previousStatus !== newStatus
              ? this._metrics().statusChanges + 1
              : this._metrics().statusChanges,
            lastUpdateAt: new Date()
          });
        }
      },
      (error) => {
        console.error(`[OrderStatusService] Error watching order ${orderId}:`, error);
        connectionStatus.set('error');
        this.updateMetrics({ errors: this._metrics().errors + 1 });
      }
    );

    // Armazena referência do listener
    this.listeners.set(orderId, unsubscribe);
    this.updateMetrics({ activeListeners: this.listeners.size });

    return statusSignal;
  }

  /**
   * Para de monitorar um pedido
   *
   * @param orderId ID do pedido
   */
  unwatchOrder(orderId: string): void {
    const unsubscribe = this.listeners.get(orderId);

    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(orderId);
      this.orderStatusSignals.delete(orderId);
      this.statusCallbacks.delete(orderId);
      this.listenerStatuses.delete(orderId);

      this.updateMetrics({ activeListeners: this.listeners.size });
    }
  }

  /**
   * Para de monitorar todos os pedidos
   */
  unwatchAll(): void {
    for (const [orderId] of this.listeners) {
      this.unwatchOrder(orderId);
    }
  }

  /**
   * Obtém o signal de status de um pedido (se já existir)
   *
   * @param orderId ID do pedido
   * @returns Signal de status ou undefined
   */
  getStatusSignal(orderId: string): WritableSignal<OrderStatusInfo | null> | undefined {
    return this.orderStatusSignals.get(orderId);
  }

  /**
   * Obtém o status de conexão de um listener
   *
   * @param orderId ID do pedido
   * @returns Signal de status de conexão
   */
  getConnectionStatus(orderId: string): WritableSignal<ListenerStatus> | undefined {
    return this.listenerStatuses.get(orderId);
  }

  /**
   * Verifica se um pedido está sendo monitorado
   *
   * @param orderId ID do pedido
   * @returns true se estiver sendo monitorado
   */
  isWatching(orderId: string): boolean {
    return this.listeners.has(orderId);
  }

  /**
   * Retorna o label de um status
   *
   * @param status Status do pedido
   * @returns Label traduzido
   */
  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  /**
   * Retorna informações de notificação para um status
   *
   * @param status Status do pedido
   * @returns Informações de notificação
   */
  getStatusNotification(status: OrderStatus): typeof STATUS_NOTIFICATIONS[OrderStatus] {
    return STATUS_NOTIFICATIONS[status];
  }

  /**
   * Verifica se um status é "final" (não muda mais)
   *
   * @param status Status do pedido
   * @returns true se for status final
   */
  isFinalStatus(status: OrderStatus): boolean {
    return [
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELED,
      OrderStatus.REFUNDED
    ].includes(status);
  }

  /**
   * Calcula progresso percentual do pedido
   *
   * @param status Status atual
   * @returns Progresso de 0 a 100
   */
  calculateProgress(status: OrderStatus): number {
    // Status finais negativos
    if (status === OrderStatus.CANCELED || status === OrderStatus.REFUNDED) {
      return 0;
    }

    const index = STATUS_ORDER.indexOf(status);
    if (index === -1) return 0;

    // Progresso baseado na posição (0-100)
    return Math.round((index / (STATUS_ORDER.length - 1)) * 100);
  }

  /**
   * Obtém próximo status esperado
   *
   * @param currentStatus Status atual
   * @returns Próximo status ou null se for final
   */
  getNextExpectedStatus(currentStatus: OrderStatus): OrderStatus | null {
    if (this.isFinalStatus(currentStatus)) return null;

    const index = STATUS_ORDER.indexOf(currentStatus);
    if (index === -1 || index >= STATUS_ORDER.length - 1) return null;

    return STATUS_ORDER[index + 1];
  }

  /**
   * Monitora múltiplos pedidos de um usuário
   *
   * @param userId ID do usuário
   * @param limitCount Limite de pedidos (default: 10)
   * @returns Signal com lista de status
   */
  watchUserOrders(
    userId: string,
    limitCount: number = 10
  ): WritableSignal<OrderStatusInfo[]> {
    const ordersSignal = signal<OrderStatusInfo[]>([]);

    const ordersRef = collection(this.firestore, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      where('status', 'not-in', [OrderStatus.COMPLETED, OrderStatus.CANCELED, OrderStatus.REFUNDED]),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: OrderStatusInfo[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          orders.push({
            orderId: doc.id,
            orderNumber: data['orderNumber'] || doc.id.slice(-8).toUpperCase(),
            status: data['status'] as OrderStatus,
            updatedAt: data['updatedAt']?.toDate() || new Date(),
            trackingCode: data['trackingCode'] || null,
            estimatedDelivery: data['estimatedDeliveryTime'] || null,
            pharmacyNotes: data['pharmacyNotes'] || null,
            statusHistory: this.parseStatusHistory(data['statusHistory'])
          });
        });

        ordersSignal.set(orders);
      },
      (error) => {
        console.error(`[OrderStatusService] Error watching user orders:`, error);
        this.updateMetrics({ errors: this._metrics().errors + 1 });
      }
    );

    // Usa o userId como key para o listener
    const listenerKey = `user_${userId}`;
    this.listeners.set(listenerKey, unsubscribe);
    this.updateMetrics({ activeListeners: this.listeners.size });

    return ordersSignal;
  }

  /**
   * Para de monitorar pedidos de um usuário
   *
   * @param userId ID do usuário
   */
  unwatchUserOrders(userId: string): void {
    const listenerKey = `user_${userId}`;
    const unsubscribe = this.listeners.get(listenerKey);

    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerKey);
      this.updateMetrics({ activeListeners: this.listeners.size });
    }
  }

  /**
   * Lifecycle: Limpa todos os listeners ao destruir o serviço
   */
  ngOnDestroy(): void {
    this.unwatchAll();
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Trata mudança de status
   */
  private handleStatusChange(
    orderId: string,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
    options: WatchOptions
  ): void {
    // Notifica via toast se configurado (default: true)
    if (options.notifyOnChange !== false) {
      this.notifyStatusChange(orderId, newStatus);
    }

    // Executa callback personalizado se fornecido
    if (options.onStatusChange) {
      try {
        options.onStatusChange(previousStatus, newStatus);
      } catch (error) {
        console.error('[OrderStatusService] Error in status change callback:', error);
      }
    }
  }

  /**
   * Exibe notificação de mudança de status
   */
  private notifyStatusChange(orderId: string, status: OrderStatus): void {
    const notification = STATUS_NOTIFICATIONS[status];

    if (notification && this.toastService) {
      const shortId = orderId.slice(-6).toUpperCase();

      this.toastService.show({
        message: `Pedido #${shortId}: ${notification.icon} ${notification.message}`,
        duration: 5000,
        position: 'top',
        color: notification.color
      });
    }
  }

  /**
   * Parseia histórico de status do Firestore
   */
  private parseStatusHistory(history: any[]): OrderStatusChange[] {
    if (!Array.isArray(history)) return [];

    return history.map((item) => ({
      status: item.status as OrderStatus,
      timestamp: item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp),
      note: item.note,
      changedBy: item.changedBy
    }));
  }

  /**
   * Atualiza métricas do serviço
   */
  private updateMetrics(updates: Partial<OrderStatusMetrics>): void {
    this._metrics.update((current) => ({ ...current, ...updates }));
  }
}
