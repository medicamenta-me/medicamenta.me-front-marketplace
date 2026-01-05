/**
 * 📋 Order Management Page
 * Página de gestão de pedidos para farmácias
 * 
 * Features:
 * - Lista de pedidos recebidos
 * - Filtros (status, data, valor)
 * - Atualização de status
 * - Validação de receitas
 * - Impressão de etiquetas
 * - Detalhes do pedido
 */

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { 
  Order, 
  OrderStatus, 
  PaymentStatus, 
  ORDER_STATUS_LABELS,
  OrderFilters
} from '../../models/order.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Subject, takeUntil } from 'rxjs';

export type OrderTab = 'all' | 'pending' | 'processing' | 'completed' | 'canceled';

export interface OrderStatusOption {
  value: OrderStatus;
  label: string;
  color: string;
}

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="order-management-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" routerLink="/pharmacy/dashboard">
            <span>←</span>
          </button>
          <div class="header-title">
            <h1>Gestão de Pedidos</h1>
            <span class="order-count">{{ totalOrders() }} pedidos</span>
          </div>
        </div>
        <div class="header-right">
          <button class="refresh-btn" (click)="loadOrders()" [disabled]="loading()">
            <span>🔄</span> Atualizar
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs-container">
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'all'"
          (click)="setActiveTab('all')"
        >
          Todos
          <span class="tab-count">{{ orders().length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'pending'"
          (click)="setActiveTab('pending')"
        >
          Pendentes
          <span class="tab-count warning">{{ pendingOrders().length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'processing'"
          (click)="setActiveTab('processing')"
        >
          Em Preparo
          <span class="tab-count">{{ processingOrders().length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'completed'"
          (click)="setActiveTab('completed')"
        >
          Concluídos
          <span class="tab-count success">{{ completedOrders().length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'canceled'"
          (click)="setActiveTab('canceled')"
        >
          Cancelados
          <span class="tab-count danger">{{ canceledOrders().length }}</span>
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <!-- Search -->
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar pedido pelo número..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
          />
          @if (searchQuery()) {
            <button class="clear-search" (click)="clearSearch()">✕</button>
          }
        </div>

        <!-- Date Filter -->
        <div class="filter-group">
          <select class="filter-select" [ngModel]="dateFilter()" (ngModelChange)="onDateFilterChange($event)">
            <option value="all">Todas as datas</option>
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
          </select>
        </div>

        <!-- Payment Status Filter -->
        <div class="filter-group">
          <select class="filter-select" [ngModel]="paymentFilter()" (ngModelChange)="onPaymentFilterChange($event)">
            <option value="all">Todos pagamentos</option>
            <option value="pending">Aguardando</option>
            <option value="paid">Pagos</option>
            <option value="failed">Falha</option>
          </select>
        </div>

        <!-- Delivery Type Filter -->
        <div class="filter-group">
          <select class="filter-select" [ngModel]="deliveryFilter()" (ngModelChange)="onDeliveryFilterChange($event)">
            <option value="all">Todos tipos</option>
            <option value="delivery">Entrega</option>
            <option value="pickup">Retirada</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-icon">💰</span>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(totalRevenue()) }}</span>
            <span class="stat-label">Faturamento</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📦</span>
          <div class="stat-content">
            <span class="stat-value">{{ filteredOrders().length }}</span>
            <span class="stat-label">Pedidos</span>
          </div>
        </div>
        <div class="stat-card pending-card" [class.alert]="pendingOrders().length > 5">
          <span class="stat-icon">⏳</span>
          <div class="stat-content">
            <span class="stat-value">{{ pendingOrders().length }}</span>
            <span class="stat-label">Pendentes</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📋</span>
          <div class="stat-content">
            <span class="stat-value">{{ prescriptionPending().length }}</span>
            <span class="stat-label">Receitas Pendentes</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner />
          <p>Carregando pedidos...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <app-empty-state
          icon="❌"
          title="Erro ao carregar"
          [message]="error()!"
          actionText="Tentar novamente"
          (action)="loadOrders()"
        />
      }

      <!-- Empty State -->
      @if (!loading() && !error() && filteredOrders().length === 0) {
        <app-empty-state
          icon="📋"
          title="Nenhum pedido encontrado"
          [message]="getEmptyMessage()"
        />
      }

      <!-- Orders List -->
      @if (!loading() && !error() && filteredOrders().length > 0) {
        <div class="orders-list">
          @for (order of filteredOrders(); track order.id) {
            <div 
              class="order-card"
              [class.pending]="isPending(order)"
              [class.prescription-required]="order.prescriptionRequired && !order.prescriptionVerified"
            >
              <!-- Order Header -->
              <div class="order-header">
                <div class="order-info">
                  <span class="order-number">{{ order.orderNumber }}</span>
                  <span class="order-date">{{ formatDate(order.createdAt) }}</span>
                </div>
                <div class="order-status">
                  <span 
                    class="status-badge"
                    [style.background]="getStatusColor(order.status)"
                  >
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
              </div>

              <!-- Prescription Alert -->
              @if (order.prescriptionRequired && !order.prescriptionVerified) {
                <div class="prescription-alert">
                  <span class="alert-icon">📋</span>
                  <span class="alert-text">Receita precisa ser verificada</span>
                  <button class="verify-btn" (click)="verifyPrescription(order)">
                    Verificar
                  </button>
                </div>
              }

              <!-- Order Items -->
              <div class="order-items">
                @for (item of order.items.slice(0, 3); track item.productId) {
                  <div class="order-item">
                    <div class="item-image">
                      @if (item.productImage) {
                        <img [src]="item.productImage" [alt]="item.productName" />
                      } @else {
                        <span>💊</span>
                      }
                    </div>
                    <div class="item-info">
                      <span class="item-name">{{ item.productName }}</span>
                      <span class="item-qty">Qtd: {{ item.quantity }}</span>
                    </div>
                    <span class="item-price">{{ formatCurrency(item.total) }}</span>
                  </div>
                }
                @if (order.items.length > 3) {
                  <span class="more-items">+ {{ order.items.length - 3 }} item(s)</span>
                }
              </div>

              <!-- Order Footer -->
              <div class="order-footer">
                <div class="order-delivery">
                  <span class="delivery-type">
                    {{ order.deliveryType === 'delivery' ? '🚚 Entrega' : '🏪 Retirada' }}
                  </span>
                  <span class="payment-status" [class]="getPaymentStatusClass(order.paymentStatus)">
                    {{ getPaymentStatusLabel(order.paymentStatus) }}
                  </span>
                </div>
                <div class="order-total">
                  <span class="total-label">Total:</span>
                  <span class="total-value">{{ formatCurrency(order.total) }}</span>
                </div>
              </div>

              <!-- Order Actions -->
              <div class="order-actions">
                @if (canUpdateStatus(order)) {
                  <div class="status-update">
                    <select 
                      class="status-select"
                      [ngModel]="order.status"
                      (ngModelChange)="updateOrderStatus(order, $event)"
                    >
                      @for (status of getAvailableStatuses(order); track status.value) {
                        <option [value]="status.value">{{ status.label }}</option>
                      }
                    </select>
                  </div>
                }
                <button class="action-btn view" (click)="viewOrder(order)">
                  <span>👁️</span> Ver Detalhes
                </button>
                @if (order.deliveryType === 'delivery' && canPrintLabel(order)) {
                  <button class="action-btn print" (click)="printLabel(order)">
                    <span>🏷️</span> Etiqueta
                  </button>
                }
                @if (canCancel(order)) {
                  <button class="action-btn cancel" (click)="cancelOrder(order)">
                    <span>❌</span> Cancelar
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Order Detail Modal -->
      @if (selectedOrder()) {
        <div class="modal-overlay" role="dialog" aria-modal="true" tabindex="-1" (click)="closeOrderDetail()" (keydown.escape)="closeOrderDetail()">
          <div class="modal-content order-detail-modal" role="document" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Pedido {{ selectedOrder()!.orderNumber }}</h2>
              <button class="close-btn" (click)="closeOrderDetail()">✕</button>
            </div>

            <div class="modal-body">
              <!-- Status Timeline -->
              <div class="status-timeline">
                @for (change of selectedOrder()!.statusHistory; track $index) {
                  <div class="timeline-item" [class.current]="$index === selectedOrder()!.statusHistory.length - 1">
                    <span class="timeline-dot"></span>
                    <div class="timeline-content">
                      <span class="timeline-status">{{ getStatusLabel(change.status) }}</span>
                      <span class="timeline-date">{{ formatDateTime(change.timestamp) }}</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Customer Info -->
              <div class="detail-section">
                <h3>Cliente</h3>
                @if (selectedOrder()!.deliveryAddress) {
                  <p class="customer-name">{{ selectedOrder()!.deliveryAddress!.recipientName }}</p>
                  <p class="customer-phone">{{ selectedOrder()!.deliveryAddress!.phone }}</p>
                }
                <p class="customer-email">{{ selectedOrder()!.customerEmail }}</p>
              </div>

              <!-- Delivery Info -->
              @if (selectedOrder()!.deliveryType === 'delivery' && selectedOrder()!.deliveryAddress) {
                <div class="detail-section">
                  <h3>Endereço de Entrega</h3>
                  <p>{{ getFormattedAddress(selectedOrder()!.deliveryAddress!) }}</p>
                  @if (selectedOrder()!.deliveryAddress!.instructions) {
                    <p class="delivery-instructions">
                      <strong>Instruções:</strong> {{ selectedOrder()!.deliveryAddress!.instructions }}
                    </p>
                  }
                </div>
              }

              <!-- Prescription Images -->
              @if (selectedOrder()!.prescriptionRequired && selectedOrder()!.prescriptionImages?.length) {
                <div class="detail-section">
                  <h3>Receita Médica</h3>
                  <div class="prescription-images">
                    @for (img of selectedOrder()!.prescriptionImages; track $index) {
                      <button type="button" class="prescription-image-btn" (click)="openImage(img)" (keydown.enter)="openImage(img)">
                        <img [src]="img" alt="Receita" />
                      </button>
                    }
                  </div>
                  <div class="prescription-status">
                    @if (selectedOrder()!.prescriptionVerified) {
                      <span class="verified">✓ Verificada em {{ formatDateTime(selectedOrder()!.prescriptionVerifiedAt!) }}</span>
                    } @else {
                      <span class="pending">⏳ Aguardando verificação</span>
                      <button class="verify-btn" (click)="verifyPrescription(selectedOrder()!)">
                        Aprovar Receita
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Items -->
              <div class="detail-section">
                <h3>Itens do Pedido</h3>
                <div class="items-list">
                  @for (item of selectedOrder()!.items; track item.productId) {
                    <div class="item-row">
                      <div class="item-image">
                        @if (item.productImage) {
                          <img [src]="item.productImage" [alt]="item.productName" />
                        } @else {
                          <span>💊</span>
                        }
                      </div>
                      <div class="item-details">
                        <span class="item-name">{{ item.productName }}</span>
                        <span class="item-qty">{{ item.quantity }}x {{ formatCurrency(item.unitPrice) }}</span>
                      </div>
                      <span class="item-total">{{ formatCurrency(item.total) }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Totals -->
              <div class="detail-section totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>{{ formatCurrency(selectedOrder()!.subtotal) }}</span>
                </div>
                <div class="total-row">
                  <span>Frete</span>
                  <span>{{ formatCurrency(selectedOrder()!.deliveryFee) }}</span>
                </div>
                @if (selectedOrder()!.discount > 0) {
                  <div class="total-row discount">
                    <span>Desconto</span>
                    <span>-{{ formatCurrency(selectedOrder()!.discount) }}</span>
                  </div>
                }
                <div class="total-row final">
                  <span>Total</span>
                  <span>{{ formatCurrency(selectedOrder()!.total) }}</span>
                </div>
              </div>

              <!-- Notes -->
              @if (selectedOrder()!.notes) {
                <div class="detail-section">
                  <h3>Observações do Cliente</h3>
                  <p class="notes">{{ selectedOrder()!.notes }}</p>
                </div>
              }
            </div>

            <div class="modal-footer">
              @if (canUpdateStatus(selectedOrder()!)) {
                <select 
                  class="status-select large"
                  [ngModel]="selectedOrder()!.status"
                  (ngModelChange)="updateOrderStatus(selectedOrder()!, $event)"
                >
                  @for (status of getAvailableStatuses(selectedOrder()!); track status.value) {
                    <option [value]="status.value">{{ status.label }}</option>
                  }
                </select>
              }
              <button class="btn secondary" (click)="closeOrderDetail()">Fechar</button>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Order Modal -->
      @if (orderToCancel()) {
        <div class="modal-overlay" role="dialog" aria-modal="true" tabindex="-1" (click)="closeCancelModal()" (keydown.escape)="closeCancelModal()">
          <div class="modal-content cancel-modal" role="document" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
            <h2>Cancelar Pedido</h2>
            <p>Tem certeza que deseja cancelar o pedido <strong>{{ orderToCancel()!.orderNumber }}</strong>?</p>
            <div class="cancel-form">
              <label for="cancel-reason">Motivo do cancelamento:</label>
              <textarea 
                id="cancel-reason"
                [(ngModel)]="cancelReason"
                placeholder="Informe o motivo do cancelamento..."
                rows="3"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button class="btn secondary" (click)="closeCancelModal()">Voltar</button>
              <button 
                class="btn danger" 
                (click)="confirmCancel()"
                [disabled]="!cancelReason || canceling()"
              >
                {{ canceling() ? 'Cancelando...' : 'Confirmar Cancelamento' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-management-container {
      min-height: 100vh;
      background: #f5f6fa;
      padding: 1.5rem;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .order-count {
      font-size: 0.875rem;
      color: #64748b;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #f8fafc;
    }

    .tab-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .tab-count {
      background: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tab-btn.active .tab-count {
      background: rgba(255,255,255,0.2);
    }

    .tab-count.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .tab-count.success {
      background: #dcfce7;
      color: #16a34a;
    }

    .tab-count.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-container {
      flex: 1;
      min-width: 200px;
      max-width: 300px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 2.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .clear-search {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }

    .filter-group {
      display: flex;
      align-items: center;
    }

    .filter-select {
      padding: 0.75rem 2rem 0.75rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      font-size: 0.875rem;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 16px;
    }

    /* Stats Cards */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-card.pending-card.alert {
      background: #fef3c7;
    }

    .stat-icon {
      font-size: 1.5rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 1rem;
      color: #64748b;
    }

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }

    .order-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .order-card.pending {
      border-left: 4px solid #f59e0b;
    }

    .order-card.prescription-required {
      border-left: 4px solid #8b5cf6;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .order-number {
      font-weight: 600;
      color: #1e293b;
    }

    .order-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .prescription-alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #fef3c7;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }

    .alert-icon {
      font-size: 1rem;
    }

    .alert-text {
      flex: 1;
      font-size: 0.875rem;
      color: #92400e;
    }

    .verify-btn {
      padding: 0.25rem 0.75rem;
      background: #f59e0b;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .order-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .item-image {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .item-qty {
      font-size: 0.75rem;
      color: #64748b;
    }

    .item-price {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .more-items {
      font-size: 0.75rem;
      color: #64748b;
      text-align: center;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .order-delivery {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .delivery-type {
      font-size: 0.875rem;
      color: #64748b;
    }

    .payment-status {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .payment-status.paid {
      background: #dcfce7;
      color: #16a34a;
    }

    .payment-status.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .payment-status.failed {
      background: #fee2e2;
      color: #dc2626;
    }

    .order-total {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .total-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .total-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
    }

    .order-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .status-select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      appearance: none;
      background: white;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 14px;
    }

    .status-select.large {
      padding: 0.75rem 2.5rem 0.75rem 1rem;
      font-size: 1rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f8fafc;
    }

    .action-btn.view:hover {
      background: #dbeafe;
      border-color: #3b82f6;
    }

    .action-btn.print:hover {
      background: #dcfce7;
      border-color: #16a34a;
    }

    .action-btn.cancel:hover {
      background: #fee2e2;
      border-color: #dc2626;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .order-detail-modal {
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      border-radius: 6px;
    }

    .close-btn:hover {
      background: #f1f5f9;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .status-timeline {
      margin-bottom: 1.5rem;
      padding-left: 1rem;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding-bottom: 1rem;
      position: relative;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 16px;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }

    .timeline-item:last-child::before {
      display: none;
    }

    .timeline-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e2e8f0;
      margin-top: 4px;
      flex-shrink: 0;
    }

    .timeline-item.current .timeline-dot {
      background: #3b82f6;
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .timeline-status {
      font-weight: 500;
      color: #1e293b;
    }

    .timeline-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .detail-section {
      margin-bottom: 1.5rem;
    }

    .detail-section h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .customer-name {
      font-weight: 500;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }

    .customer-phone,
    .customer-email {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 0.25rem;
    }

    .prescription-images {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .prescription-images img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid #e2e8f0;
    }

    .prescription-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .prescription-status .verified {
      color: #16a34a;
      font-size: 0.875rem;
    }

    .prescription-status .pending {
      color: #d97706;
      font-size: 0.875rem;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .item-total {
      font-weight: 600;
      color: #1e293b;
    }

    .totals {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .total-row.discount {
      color: #16a34a;
    }

    .total-row.final {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      padding-top: 0.5rem;
      margin-top: 0.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .notes {
      background: #fef3c7;
      padding: 0.75rem;
      border-radius: 8px;
      color: #92400e;
      font-size: 0.875rem;
      margin: 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn.secondary {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    .btn.danger {
      background: #dc2626;
      border: none;
      color: white;
    }

    .btn.danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Cancel Modal */
    .cancel-modal {
      padding: 1.5rem;
    }

    .cancel-modal h2 {
      margin: 0 0 0.5rem;
    }

    .cancel-modal p {
      color: #64748b;
      margin: 0 0 1rem;
    }

    .cancel-form label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .cancel-form textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      resize: vertical;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .order-management-container {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-container {
        max-width: 100%;
      }

      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .order-actions {
        flex-direction: column;
      }

      .status-update {
        width: 100%;
      }

      .status-select {
        width: 100%;
      }

      .action-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class OrderManagementPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly destroy$ = new Subject<void>();

  // State
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly activeTab = signal<OrderTab>('all');
  readonly searchQuery = signal<string>('');
  readonly dateFilter = signal<string>('all');
  readonly paymentFilter = signal<string>('all');
  readonly deliveryFilter = signal<string>('all');
  readonly selectedOrder = signal<Order | null>(null);
  readonly orderToCancel = signal<Order | null>(null);
  readonly canceling = signal<boolean>(false);
  cancelReason = '';

  // Computed
  readonly filteredOrders = computed(() => {
    let result = [...this.orders()];

    // Tab filter
    const tab = this.activeTab();
    if (tab === 'pending') {
      result = result.filter(o => this.isPending(o));
    } else if (tab === 'processing') {
      result = result.filter(o => this.isProcessing(o));
    } else if (tab === 'completed') {
      result = result.filter(o => this.isCompleted(o));
    } else if (tab === 'canceled') {
      result = result.filter(o => o.status === OrderStatus.CANCELED);
    }

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(o => o.orderNumber.toLowerCase().includes(query));
    }

    // Date filter
    const date = this.dateFilter();
    if (date !== 'all') {
      const now = new Date();
      result = result.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (date === 'today') {
          return orderDate.toDateString() === now.toDateString();
        } else if (date === 'yesterday') {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return orderDate.toDateString() === yesterday.toDateString();
        } else if (date === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        } else if (date === 'month') {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Payment filter
    const payment = this.paymentFilter();
    if (payment !== 'all') {
      result = result.filter(o => {
        if (payment === 'paid') return o.paymentStatus === PaymentStatus.PAID;
        if (payment === 'pending') return o.paymentStatus === PaymentStatus.PENDING;
        if (payment === 'failed') return o.paymentStatus === PaymentStatus.FAILED;
        return true;
      });
    }

    // Delivery filter
    const delivery = this.deliveryFilter();
    if (delivery !== 'all') {
      result = result.filter(o => o.deliveryType === delivery);
    }

    return result;
  });

  readonly totalOrders = computed(() => this.orders().length);
  readonly pendingOrders = computed(() => this.orders().filter(o => this.isPending(o)));
  readonly processingOrders = computed(() => this.orders().filter(o => this.isProcessing(o)));
  readonly completedOrders = computed(() => this.orders().filter(o => this.isCompleted(o)));
  readonly canceledOrders = computed(() => this.orders().filter(o => o.status === OrderStatus.CANCELED));
  readonly prescriptionPending = computed(() => 
    this.orders().filter(o => o.prescriptionRequired && !o.prescriptionVerified)
  );
  readonly totalRevenue = computed(() => 
    this.filteredOrders()
      .filter(o => o.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, o) => sum + o.total, 0)
  );

  ngOnInit(): void {
    this.loadOrders();
    this.handleQueryParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle query params
   */
  private handleQueryParams(): void {
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status === 'pending') {
      this.activeTab.set('pending');
    }
  }

  /**
   * Load orders
   */
  async loadOrders(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pharmacyId = this.authService.currentUser()?.uid;
      
      if (!pharmacyId) {
        this.error.set('Usuário não autenticado');
        this.loading.set(false);
        return;
      }

      const result = await this.checkoutService.getPharmacyOrders(pharmacyId);
      this.orders.set(result);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      this.error.set('Erro ao carregar pedidos');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Tab handlers
   */
  setActiveTab(tab: OrderTab): void {
    this.activeTab.set(tab);
  }

  /**
   * Filter handlers
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onDateFilterChange(filter: string): void {
    this.dateFilter.set(filter);
  }

  onPaymentFilterChange(filter: string): void {
    this.paymentFilter.set(filter);
  }

  onDeliveryFilterChange(filter: string): void {
    this.deliveryFilter.set(filter);
  }

  /**
   * Status helpers
   */
  isPending(order: Order): boolean {
    return [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAYMENT_CONFIRMED,
      OrderStatus.PRESCRIPTION_PENDING
    ].includes(order.status);
  }

  isProcessing(order: Order): boolean {
    return [
      OrderStatus.PRESCRIPTION_APPROVED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.OUT_FOR_DELIVERY
    ].includes(order.status);
  }

  isCompleted(order: Order): boolean {
    return [OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status);
  }

  canUpdateStatus(order: Order): boolean {
    return ![OrderStatus.CANCELED, OrderStatus.REFUNDED, OrderStatus.COMPLETED].includes(order.status);
  }

  canCancel(order: Order): boolean {
    return ![
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELED,
      OrderStatus.REFUNDED
    ].includes(order.status);
  }

  canPrintLabel(order: Order): boolean {
    return [
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.OUT_FOR_DELIVERY
    ].includes(order.status);
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING_PAYMENT]: '#f59e0b',
      [OrderStatus.PAYMENT_CONFIRMED]: '#3b82f6',
      [OrderStatus.PRESCRIPTION_PENDING]: '#8b5cf6',
      [OrderStatus.PRESCRIPTION_APPROVED]: '#3b82f6',
      [OrderStatus.PREPARING]: '#0891b2',
      [OrderStatus.READY_FOR_PICKUP]: '#16a34a',
      [OrderStatus.OUT_FOR_DELIVERY]: '#059669',
      [OrderStatus.DELIVERED]: '#16a34a',
      [OrderStatus.COMPLETED]: '#16a34a',
      [OrderStatus.CANCELED]: '#dc2626',
      [OrderStatus.REFUNDED]: '#6b7280'
    };
    return colors[status] || '#64748b';
  }

  getAvailableStatuses(order: Order): OrderStatusOption[] {
    const allStatuses: OrderStatusOption[] = [
      { value: OrderStatus.PENDING_PAYMENT, label: 'Aguardando Pagamento', color: '#f59e0b' },
      { value: OrderStatus.PAYMENT_CONFIRMED, label: 'Pagamento Confirmado', color: '#3b82f6' },
      { value: OrderStatus.PRESCRIPTION_PENDING, label: 'Aguardando Receita', color: '#8b5cf6' },
      { value: OrderStatus.PRESCRIPTION_APPROVED, label: 'Receita Aprovada', color: '#3b82f6' },
      { value: OrderStatus.PREPARING, label: 'Preparando', color: '#0891b2' },
      { value: OrderStatus.READY_FOR_PICKUP, label: 'Pronto para Retirada', color: '#16a34a' },
      { value: OrderStatus.OUT_FOR_DELIVERY, label: 'Saiu para Entrega', color: '#059669' },
      { value: OrderStatus.DELIVERED, label: 'Entregue', color: '#16a34a' },
      { value: OrderStatus.COMPLETED, label: 'Concluído', color: '#16a34a' }
    ];

    // Filter based on current status
    const currentIndex = allStatuses.findIndex(s => s.value === order.status);
    return allStatuses.slice(currentIndex);
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Aguardando',
      [PaymentStatus.AUTHORIZED]: 'Autorizado',
      [PaymentStatus.PROCESSING]: 'Processando',
      [PaymentStatus.PAID]: 'Pago',
      [PaymentStatus.FAILED]: 'Falha',
      [PaymentStatus.REFUNDED]: 'Reembolsado',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'Reemb. Parcial'
    };
    return labels[status] || status;
  }

  getPaymentStatusClass(status: PaymentStatus): string {
    if (status === PaymentStatus.PAID) return 'paid';
    if (status === PaymentStatus.FAILED) return 'failed';
    return 'pending';
  }

  /**
   * Actions
   */
  async updateOrderStatus(order: Order, newStatus: OrderStatus): Promise<void> {
    try {
      await this.checkoutService.updateOrderStatus(order.id, newStatus);
      await this.loadOrders();
      
      // Update selected order if open
      if (this.selectedOrder()?.id === order.id) {
        const updated = this.orders().find(o => o.id === order.id);
        if (updated) {
          this.selectedOrder.set(updated);
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  }

  async verifyPrescription(order: Order): Promise<void> {
    try {
      await this.checkoutService.verifyPrescription(order.id);
      await this.loadOrders();
    } catch (err) {
      console.error('Erro ao verificar receita:', err);
    }
  }

  viewOrder(order: Order): void {
    this.selectedOrder.set(order);
  }

  closeOrderDetail(): void {
    this.selectedOrder.set(null);
  }

  printLabel(order: Order): void {
    // TODO: Implement label printing
    console.log('Imprimir etiqueta:', order.orderNumber);
  }

  cancelOrder(order: Order): void {
    this.orderToCancel.set(order);
    this.cancelReason = '';
  }

  closeCancelModal(): void {
    this.orderToCancel.set(null);
    this.cancelReason = '';
  }

  async confirmCancel(): Promise<void> {
    const order = this.orderToCancel();
    if (!order || !this.cancelReason) return;

    this.canceling.set(true);

    try {
      await this.checkoutService.cancelOrder(order.id, this.cancelReason);
      this.closeCancelModal();
      await this.loadOrders();
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
    } finally {
      this.canceling.set(false);
    }
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }

  /**
   * Formatting helpers
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getFormattedAddress(address: any): string {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''} - ${address.neighborhood}, ${address.city}/${address.state} - ${address.zipCode}`;
  }

  getEmptyMessage(): string {
    if (this.searchQuery()) {
      return `Nenhum pedido encontrado para "${this.searchQuery()}"`;
    }
    if (this.activeTab() !== 'all') {
      return `Nenhum pedido ${this.getTabLabel()} no momento`;
    }
    return 'Nenhum pedido recebido ainda';
  }

  private getTabLabel(): string {
    const labels: Record<OrderTab, string> = {
      all: '',
      pending: 'pendente',
      processing: 'em preparo',
      completed: 'concluído',
      canceled: 'cancelado'
    };
    return labels[this.activeTab()];
  }
}
