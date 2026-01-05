/**
 * 📋 Order History Page
 * Página de histórico de pedidos do usuário
 * 
 * Features:
 * - Lista de todos os pedidos do usuário
 * - Filtro por status
 * - Busca por número do pedido
 * - Ordenação por data
 * - Paginação
 * - Status visual com badges coloridas
 * - Ações rápidas: ver detalhes, refazer pedido
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Order, OrderStatus, ORDER_STATUS_LABELS, PaymentStatus } from '../../models/order.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

// Order service interface for dependency injection
export interface OrderHistoryService {
  getOrders(userId: string, filters?: OrderFilters): Promise<OrderListResponse>;
}

export interface OrderFilters {
  status?: OrderStatus;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="order-history-page">
      <header class="page-header">
        <h1>Meus Pedidos</h1>
        <p class="subtitle">Acompanhe o status dos seus pedidos</p>
      </header>

      <!-- Filters -->
      <section class="filters-section">
        <div class="search-box">
          <input
            type="text"
            placeholder="Buscar por número do pedido..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="status-filters">
          <button
            class="filter-btn"
            [class.active]="selectedStatus() === null"
            (click)="filterByStatus(null)"
          >
            Todos
          </button>
          @for (status of availableStatuses; track status) {
            <button
              class="filter-btn"
              [class.active]="selectedStatus() === status"
              (click)="filterByStatus(status)"
            >
              {{ getStatusLabel(status) }}
            </button>
          }
        </div>
      </section>

      <!-- Loading State -->
      @if (loading()) {
        <app-loading-spinner message="Carregando pedidos..."></app-loading-spinner>
      }

      <!-- Empty State -->
      @if (!loading() && orders().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📦</span>
          <h2>Nenhum pedido encontrado</h2>
          @if (searchQuery || selectedStatus()) {
            <p>Tente alterar os filtros de busca</p>
            <button class="btn-secondary" (click)="clearFilters()">Limpar filtros</button>
          } @else {
            <p>Você ainda não fez nenhum pedido</p>
            <a routerLink="/products" class="btn-primary">Explorar Produtos</a>
          }
        </div>
      }

      <!-- Orders List -->
      @if (!loading() && orders().length > 0) {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <div 
              class="order-card" 
              tabindex="0"
              role="button"
              (click)="viewOrderDetails(order.id)"
              (keydown.enter)="viewOrderDetails(order.id)"
              (keydown.space)="viewOrderDetails(order.id)"
            >
              <div class="order-header">
                <div class="order-info">
                  <span class="order-number">#{{ order.orderNumber }}</span>
                  <span class="order-date">{{ formatDate(order.createdAt) }}</span>
                </div>
                <span 
                  class="status-badge"
                  [class]="getStatusClass(order.status)"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>

              <div class="order-items-preview">
                @for (item of order.items.slice(0, 3); track item.productId) {
                  <div class="item-preview">
                    <div class="item-image">
                      @if (item.productImage) {
                        <img [src]="item.productImage" [alt]="item.productName" />
                      } @else {
                        <div class="placeholder-image">📦</div>
                      }
                    </div>
                    <span class="item-name">{{ item.productName }}</span>
                    <span class="item-qty">x{{ item.quantity }}</span>
                  </div>
                }
                @if (order.items.length > 3) {
                  <div class="more-items">
                    +{{ order.items.length - 3 }} itens
                  </div>
                }
              </div>

              <div class="order-footer">
                <div class="order-total">
                  <span class="label">Total:</span>
                  <span class="value">{{ formatCurrency(order.total) }}</span>
                </div>
                <div class="order-actions">
                  @if (canReorder(order)) {
                    <button 
                      class="btn-icon" 
                      title="Refazer pedido"
                      (click)="reorder(order, $event)"
                    >
                      🔄
                    </button>
                  }
                  <button class="btn-icon" title="Ver detalhes">
                    →
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button
              class="page-btn"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
            >
              ← Anterior
            </button>
            <span class="page-info">
              Página {{ currentPage() }} de {{ totalPages() }}
            </span>
            <button
              class="page-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)"
            >
              Próxima →
            </button>
          </div>
        }
      }

      <!-- Quick Actions -->
      <section class="quick-actions">
        <a routerLink="/products" class="quick-action-link">
          🛒 Continuar Comprando
        </a>
        <a routerLink="/" class="quick-action-link">
          🏠 Voltar ao Início
        </a>
      </section>
    </div>
  `,
  styles: [`
    .order-history-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 16px;
      min-height: 100vh;
    }

    /* Header */
    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      color: #333;
      margin-bottom: 4px;
    }

    .subtitle {
      color: #666;
      font-size: 14px;
    }

    /* Filters */
    .filters-section {
      margin-bottom: 24px;
    }

    .search-box {
      position: relative;
      margin-bottom: 16px;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .search-box input:focus {
      outline: none;
      border-color: #0066cc;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
    }

    .status-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 20px;
      background: white;
      font-size: 13px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      border-color: #0066cc;
      color: #0066cc;
    }

    .filter-btn.active {
      background: #0066cc;
      border-color: #0066cc;
      color: white;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 64px 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .empty-icon {
      font-size: 64px;
      display: block;
      margin-bottom: 16px;
    }

    .empty-state h2 {
      font-size: 20px;
      color: #333;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 24px;
    }

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .order-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-number {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }

    .order-date {
      font-size: 12px;
      color: #999;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
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

    /* Order Items Preview */
    .order-items-preview {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .item-preview {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .item-image {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      overflow: hidden;
      background: white;
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
      font-size: 18px;
    }

    .item-name {
      font-size: 13px;
      color: #333;
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-qty {
      font-size: 12px;
      color: #666;
    }

    .more-items {
      font-size: 13px;
      color: #0066cc;
      padding: 8px 12px;
      background: white;
      border-radius: 4px;
    }

    /* Order Footer */
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }

    .order-total .label {
      font-size: 13px;
      color: #666;
      margin-right: 8px;
    }

    .order-total .value {
      font-size: 18px;
      font-weight: 600;
      color: #0066cc;
    }

    .order-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
    }

    .btn-icon:hover {
      background: #e0e0e0;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding: 16px;
    }

    .page-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      border-color: #0066cc;
      color: #0066cc;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 14px;
      color: #666;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }

    .quick-action-link {
      color: #0066cc;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .quick-action-link:hover {
      color: #004499;
    }

    /* Buttons */
    .btn-primary {
      display: inline-block;
      padding: 12px 24px;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .btn-primary:hover {
      background: #0052a3;
    }

    .btn-secondary {
      display: inline-block;
      padding: 12px 24px;
      background: white;
      color: #0066cc;
      border: 1px solid #0066cc;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f0f7ff;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .status-filters {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 8px;
      }

      .filter-btn {
        flex-shrink: 0;
      }

      .item-name {
        max-width: 80px;
      }

      .quick-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class OrderHistoryPage implements OnInit {
  private router = inject(Router);

  // Signals
  orders = signal<Order[]>([]);
  loading = signal(true);
  selectedStatus = signal<OrderStatus | null>(null);
  currentPage = signal(1);
  totalOrders = signal(0);
  searchQuery = '';
  private readonly pageSize = 10;

  // Available statuses for filtering
  availableStatuses: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.totalOrders() / this.pageSize));

  // Order service (will be injected in real app)
  private orderService: OrderHistoryService | null = null;

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    try {
      this.loading.set(true);

      if (this.orderService) {
        const response = await this.orderService.getOrders('current-user-id', {
          status: this.selectedStatus() || undefined,
          searchQuery: this.searchQuery || undefined,
          page: this.currentPage(),
          limit: this.pageSize
        });
        this.orders.set(response.orders);
        this.totalOrders.set(response.total);
      } else {
        // Mock data for testing/development
        this.orders.set(this.createMockOrders());
        this.totalOrders.set(5);
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      this.orders.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private createMockOrders(): Order[] {
    const mockOrders: Order[] = [
      {
        id: 'order-1',
        orderNumber: 'ORD-2025-000005',
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
        discount: 0,
        total: 6479,
        status: OrderStatus.OUT_FOR_DELIVERY,
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
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-2025-000004',
        userId: 'user-123',
        pharmacyId: 'pharmacy-456',
        pharmacyName: 'Farmácia Popular',
        customerEmail: 'cliente@email.com',
        items: [
          {
            productId: 'prod-3',
            productName: 'Vitamina C 1000mg',
            productImage: '',
            quantity: 3,
            unitPrice: 2500,
            subtotal: 7500,
            discount: 0,
            total: 7500
          }
        ],
        subtotal: 7500,
        deliveryFee: 0,
        discount: 500,
        total: 7000,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'credit_card',
        deliveryType: 'pickup',
        prescriptionRequired: false,
        prescriptionVerified: false,
        statusHistory: [],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'order-3',
        orderNumber: 'ORD-2025-000003',
        userId: 'user-123',
        pharmacyId: 'pharmacy-789',
        pharmacyName: 'Drogaria São Paulo',
        customerEmail: 'cliente@email.com',
        items: [
          {
            productId: 'prod-4',
            productName: 'Omeprazol 20mg',
            quantity: 1,
            unitPrice: 3500,
            subtotal: 3500,
            discount: 0,
            total: 3500
          },
          {
            productId: 'prod-5',
            productName: 'Losartana 50mg',
            quantity: 2,
            unitPrice: 2800,
            subtotal: 5600,
            discount: 0,
            total: 5600
          },
          {
            productId: 'prod-6',
            productName: 'Metformina 850mg',
            quantity: 1,
            unitPrice: 1900,
            subtotal: 1900,
            discount: 0,
            total: 1900
          },
          {
            productId: 'prod-7',
            productName: 'Sinvastatina 20mg',
            quantity: 1,
            unitPrice: 2200,
            subtotal: 2200,
            discount: 0,
            total: 2200
          }
        ],
        subtotal: 13200,
        deliveryFee: 1500,
        discount: 1000,
        total: 13700,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'boleto',
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
        prescriptionRequired: true,
        prescriptionVerified: true,
        statusHistory: [],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'order-4',
        orderNumber: 'ORD-2025-000002',
        userId: 'user-123',
        pharmacyId: 'pharmacy-456',
        pharmacyName: 'Farmácia Central',
        customerEmail: 'cliente@email.com',
        items: [
          {
            productId: 'prod-8',
            productName: 'Ibuprofeno 600mg',
            quantity: 1,
            unitPrice: 1200,
            subtotal: 1200,
            discount: 0,
            total: 1200
          }
        ],
        subtotal: 1200,
        deliveryFee: 0,
        discount: 0,
        total: 1200,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.REFUNDED,
        paymentMethod: 'pix',
        deliveryType: 'pickup',
        prescriptionRequired: false,
        prescriptionVerified: false,
        statusHistory: [],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
        canceledAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'order-5',
        orderNumber: 'ORD-2025-000001',
        userId: 'user-123',
        pharmacyId: 'pharmacy-456',
        pharmacyName: 'Farmácia Central',
        customerEmail: 'cliente@email.com',
        items: [
          {
            productId: 'prod-9',
            productName: 'Amoxicilina 500mg',
            quantity: 1,
            unitPrice: 4500,
            subtotal: 4500,
            discount: 0,
            total: 4500
          }
        ],
        subtotal: 4500,
        deliveryFee: 999,
        discount: 0,
        total: 5499,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'credit_card',
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
        prescriptionRequired: true,
        prescriptionVerified: true,
        statusHistory: [],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      }
    ];

    // Apply filters
    let filtered = mockOrders;

    if (this.selectedStatus()) {
      filtered = filtered.filter(o => o.status === this.selectedStatus());
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.orderNumber.toLowerCase().includes(query) ||
        o.items.some(i => i.productName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  filterByStatus(status: OrderStatus | null): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadOrders();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.currentPage.set(1);
    this.loadOrders();
  }

  clearFilters(): void {
    this.selectedStatus.set(null);
    this.searchQuery = '';
    this.currentPage.set(1);
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
    }
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  canReorder(order: Order): boolean {
    return order.status === OrderStatus.DELIVERED || 
           order.status === OrderStatus.COMPLETED ||
           order.status === OrderStatus.CANCELED;
  }

  reorder(order: Order, event: Event): void {
    event.stopPropagation();
    // In real app, would add items to cart
    console.log('Refazendo pedido:', order.orderNumber);
    this.router.navigate(['/cart']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
}
