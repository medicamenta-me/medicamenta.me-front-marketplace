/**
 * 📊 Pharmacy Dashboard Page
 * Painel de controle para farmácias
 * 
 * Features:
 * - Widgets de métricas (vendas, pedidos, rating)
 * - Gráfico de vendas (CSS-based bars)
 * - Menu lateral (desktop) / Bottom tabs (mobile)
 * - Verificação de ownership
 * - Ações rápidas
 */

import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { PharmacyService } from '../../services/pharmacy.service';
import { AuthService } from '../../core/services/auth.service';
import { Pharmacy } from '../../models/pharmacy.model';
import { Order, OrderStatus } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

export type DashboardPeriod = 'today' | 'week' | 'month' | 'year';
export type DashboardMenuItem = 'overview' | 'products' | 'orders' | 'analytics' | 'settings';

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  averageRating: number;
  totalReviews: number;
  topProducts: ProductSalesData[];
  salesByPeriod: SalesPeriodData[];
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  productImage?: string;
  soldCount: number;
  revenue: number;
}

export interface SalesPeriodData {
  date: string;
  label: string;
  sales: number;
  orders: number;
}

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencyPipe
  ],
  template: `
    <div class="dashboard-container" [class.sidebar-open]="sidebarOpen()">
      <!-- Sidebar (Desktop) -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-header">
          <div class="pharmacy-logo">
            @if (pharmacy()?.logo) {
              <img [src]="pharmacy()!.logo" [alt]="pharmacy()!.name" />
            } @else {
              <span class="logo-placeholder">🏪</span>
            }
          </div>
          <h2 class="pharmacy-name">{{ pharmacy()?.name || 'Carregando...' }}</h2>
          <button class="sidebar-toggle mobile-only" (click)="toggleSidebar()">
            <span>✕</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of menuItems; track item.id) {
            <button 
              class="nav-item"
              [class.active]="activeMenuItem() === item.id"
              (click)="setActiveMenuItem(item.id)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </button>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item logout-btn" (click)="logout()">
            <span class="nav-icon">🚪</span>
            <span class="nav-label">Sair</span>
          </button>
        </div>
      </aside>

      <!-- Mobile Header -->
      <header class="mobile-header mobile-only">
        <button class="menu-toggle" (click)="toggleSidebar()">
          <span>☰</span>
        </button>
        <h1>{{ getMenuTitle() }}</h1>
        <div class="header-actions">
          <button class="notification-btn" (click)="openNotifications()">
            <span>🔔</span>
            @if (pendingOrders() > 0) {
              <span class="badge">{{ pendingOrders() }}</span>
            }
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-container">
            <app-loading-spinner />
            <p>Carregando dashboard...</p>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <app-empty-state
            icon="❌"
            title="Erro ao carregar"
            [message]="error()!"
            actionText="Tentar novamente"
            (action)="loadDashboardData()"
          />
        }

        <!-- Dashboard Content -->
        @if (!loading() && !error()) {
          <!-- Overview -->
          @if (activeMenuItem() === 'overview') {
            <section class="dashboard-overview">
              <!-- Page Header -->
              <div class="page-header">
                <div class="header-left">
                  <h1 class="page-title">Dashboard</h1>
                  <p class="page-subtitle">Bem-vindo de volta, {{ pharmacy()?.responsiblePharmacist?.name || 'Farmacêutico' }}</p>
                </div>
                <div class="header-right">
                  <div class="period-selector">
                    @for (period of periods; track period.value) {
                      <button 
                        class="period-btn"
                        [class.active]="selectedPeriod() === period.value"
                        (click)="setSelectedPeriod(period.value)"
                      >
                        {{ period.label }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Stats Widgets -->
              <div class="stats-grid">
                <!-- Total Sales Widget -->
                <div class="stat-card sales">
                  <div class="stat-icon">💰</div>
                  <div class="stat-content">
                    <span class="stat-label">Vendas ({{ getPeriodLabel() }})</span>
                    <span class="stat-value">{{ formatCurrency(stats()?.totalSales || 0) }}</span>
                    <span class="stat-trend positive" [class.negative]="salesTrend() < 0">
                      {{ salesTrend() >= 0 ? '↑' : '↓' }} {{ Math.abs(salesTrend()) }}%
                    </span>
                  </div>
                </div>

                <!-- Total Orders Widget -->
                <div class="stat-card orders">
                  <div class="stat-icon">📦</div>
                  <div class="stat-content">
                    <span class="stat-label">Pedidos</span>
                    <span class="stat-value">{{ stats()?.totalOrders || 0 }}</span>
                    <span class="stat-trend positive">{{ ordersTrend() >= 0 ? '↑' : '↓' }} {{ Math.abs(ordersTrend()) }}%</span>
                  </div>
                </div>

                <!-- Pending Orders Widget -->
                <div class="stat-card pending" [class.alert]="pendingOrders() > 5">
                  <div class="stat-icon">⏳</div>
                  <div class="stat-content">
                    <span class="stat-label">Pedidos Pendentes</span>
                    <span class="stat-value">{{ pendingOrders() }}</span>
                    @if (pendingOrders() > 0) {
                      <button class="view-btn" (click)="goToPendingOrders()">Ver pedidos</button>
                    }
                  </div>
                </div>

                <!-- Rating Widget -->
                <div class="stat-card rating">
                  <div class="stat-icon">⭐</div>
                  <div class="stat-content">
                    <span class="stat-label">Avaliação Média</span>
                    <span class="stat-value">{{ (stats()?.averageRating || 0).toFixed(1) }}</span>
                    <span class="stat-secondary">{{ stats()?.totalReviews || 0 }} avaliações</span>
                  </div>
                </div>
              </div>

              <!-- Charts Row -->
              <div class="charts-row">
                <!-- Sales Chart (CSS-based) -->
                <div class="chart-card sales-chart">
                  <div class="chart-header">
                    <h3>Vendas por Período</h3>
                    <span class="chart-period">{{ getPeriodLabel() }}</span>
                  </div>
                  <div class="chart-container css-bar-chart">
                    @if (chartLoading()) {
                      <div class="chart-loading">
                        <app-loading-spinner />
                      </div>
                    } @else {
                      <div class="bar-chart-wrapper">
                        @for (data of stats()?.salesByPeriod || []; track data.label) {
                          <div class="bar-column">
                            <div class="bar" [style.height.%]="getBarHeight(data.sales)" [title]="'R$ ' + (data.sales / 100).toFixed(2)">
                              <span class="bar-tooltip">{{ (data.sales / 100) | currency:'BRL':'symbol':'1.0-0' }}</span>
                            </div>
                            <span class="bar-label">{{ data.label }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Top Products -->
                <div class="chart-card top-products">
                  <div class="chart-header">
                    <h3>Produtos Mais Vendidos</h3>
                    <button class="see-all-btn" (click)="goToProducts()">Ver todos</button>
                  </div>
                  <div class="products-list">
                    @if (stats()?.topProducts?.length === 0) {
                      <div class="empty-products">
                        <span>📦</span>
                        <p>Nenhuma venda ainda</p>
                      </div>
                    } @else {
                      @for (product of stats()?.topProducts?.slice(0, 5); track product.productId) {
                        <div class="product-item">
                          <div class="product-image">
                            @if (product.productImage) {
                              <img [src]="product.productImage" [alt]="product.productName" />
                            } @else {
                              <span>💊</span>
                            }
                          </div>
                          <div class="product-info">
                            <span class="product-name">{{ product.productName }}</span>
                            <span class="product-stats">{{ product.soldCount }} vendidos • {{ formatCurrency(product.revenue) }}</span>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="quick-actions">
                <h3>Ações Rápidas</h3>
                <div class="actions-grid">
                  <button class="action-btn" (click)="addProduct()">
                    <span class="action-icon">➕</span>
                    <span class="action-label">Novo Produto</span>
                  </button>
                  <button class="action-btn" (click)="goToOrders()">
                    <span class="action-icon">📋</span>
                    <span class="action-label">Ver Pedidos</span>
                  </button>
                  <button class="action-btn" (click)="goToReviews()">
                    <span class="action-icon">💬</span>
                    <span class="action-label">Ver Avaliações</span>
                  </button>
                  <button class="action-btn" (click)="goToSettings()">
                    <span class="action-icon">⚙️</span>
                    <span class="action-label">Configurações</span>
                  </button>
                </div>
              </div>
            </section>
          }

          <!-- Products Section -->
          @if (activeMenuItem() === 'products') {
            <section class="products-section">
              <div class="page-header">
                <h1 class="page-title">Meus Produtos</h1>
                <button class="primary-btn" (click)="addProduct()">
                  <span>➕</span> Novo Produto
                </button>
              </div>
              <div class="section-content">
                <p class="info-text">Acesse a gestão completa de produtos</p>
                <button class="secondary-btn" routerLink="/pharmacy/products">
                  Ir para Gestão de Produtos
                </button>
              </div>
            </section>
          }

          <!-- Orders Section -->
          @if (activeMenuItem() === 'orders') {
            <section class="orders-section">
              <div class="page-header">
                <h1 class="page-title">Pedidos</h1>
                @if (pendingOrders() > 0) {
                  <span class="pending-badge">{{ pendingOrders() }} pendentes</span>
                }
              </div>
              <div class="section-content">
                <p class="info-text">Gerencie todos os pedidos da sua farmácia</p>
                <button class="secondary-btn" routerLink="/pharmacy/orders">
                  Ir para Gestão de Pedidos
                </button>
              </div>
            </section>
          }

          <!-- Analytics Section -->
          @if (activeMenuItem() === 'analytics') {
            <section class="analytics-section">
              <div class="page-header">
                <h1 class="page-title">Análises</h1>
              </div>
              <div class="section-content">
                <p class="info-text">Veja estatísticas detalhadas do seu negócio</p>
                <button class="secondary-btn" routerLink="/pharmacy/analytics">
                  Ir para Analytics
                </button>
              </div>
            </section>
          }

          <!-- Settings Section -->
          @if (activeMenuItem() === 'settings') {
            <section class="settings-section">
              <div class="page-header">
                <h1 class="page-title">Configurações</h1>
              </div>
              <div class="section-content">
                <p class="info-text">Configure sua farmácia</p>
                <button class="secondary-btn" routerLink="/pharmacy/settings">
                  Ir para Configurações
                </button>
              </div>
            </section>
          }
        }
      </main>

      <!-- Bottom Navigation (Mobile) -->
      <nav class="bottom-nav mobile-only">
        @for (item of menuItems.slice(0, 5); track item.id) {
          <button 
            class="bottom-nav-item"
            [class.active]="activeMenuItem() === item.id"
            (click)="setActiveMenuItem(item.id)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            @if (item.id === 'orders' && pendingOrders() > 0) {
              <span class="badge">{{ pendingOrders() }}</span>
            }
          </button>
        }
      </nav>

      <!-- Sidebar Overlay (Mobile) -->
      @if (sidebarOpen() && isMobile()) {
        <button type="button" class="sidebar-overlay" aria-label="Fechar menu" (click)="toggleSidebar()" (keydown.escape)="toggleSidebar()"></button>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      min-height: 100vh;
      background: #f5f6fa;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: #1e293b;
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 100;
      transition: transform 0.3s ease;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .pharmacy-logo {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pharmacy-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-placeholder {
      font-size: 2rem;
    }

    .pharmacy-name {
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
      margin: 0;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      text-align: left;
      font-size: 0.9rem;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-item.active {
      background: #3b82f6;
      color: white;
    }

    .nav-icon {
      font-size: 1.25rem;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      padding-bottom: 5rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 1rem;
      color: #64748b;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .page-subtitle {
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .period-selector {
      display: flex;
      background: white;
      border-radius: 8px;
      padding: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .period-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #64748b;
      transition: all 0.2s;
    }

    .period-btn:hover {
      background: #f1f5f9;
    }

    .period-btn.active {
      background: #3b82f6;
      color: white;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-card.sales .stat-icon {
      background: #dcfce7;
    }

    .stat-card.orders .stat-icon {
      background: #dbeafe;
    }

    .stat-card.pending .stat-icon {
      background: #fef3c7;
    }

    .stat-card.pending.alert .stat-icon {
      background: #fee2e2;
    }

    .stat-card.rating .stat-icon {
      background: #fef9c3;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-trend {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .stat-trend.positive {
      color: #16a34a;
    }

    .stat-trend.negative {
      color: #dc2626;
    }

    .stat-secondary {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .view-btn {
      font-size: 0.75rem;
      color: #3b82f6;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }

    /* Charts */
    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .chart-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .chart-period {
      font-size: 0.75rem;
      color: #64748b;
    }

    .see-all-btn {
      font-size: 0.75rem;
      color: #3b82f6;
      background: none;
      border: none;
      cursor: pointer;
    }

    .chart-container {
      height: 250px;
      position: relative;
    }

    .chart-loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.8);
    }

    /* CSS Bar Chart */
    .css-bar-chart {
      height: auto;
      min-height: 200px;
      padding-top: 1rem;
    }

    .bar-chart-wrapper {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 180px;
      padding: 0 0.5rem;
      gap: 4px;
    }

    .bar-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 50px;
    }

    .bar {
      width: 100%;
      background: linear-gradient(180deg, #3b82f6, #60a5fa);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      position: relative;
      transition: height 0.3s ease;
      cursor: pointer;
    }

    .bar:hover {
      background: linear-gradient(180deg, #2563eb, #3b82f6);
    }

    .bar-tooltip {
      position: absolute;
      top: -28px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem;
      white-space: nowrap;
      color: #fff;
      background: #1e293b;
      padding: 2px 6px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .bar:hover .bar-tooltip {
      opacity: 1;
    }

    .bar-label {
      font-size: 0.65rem;
      color: #64748b;
      margin-top: 0.5rem;
      text-align: center;
    }

    /* Products List */
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .product-item:hover {
      background: #f8fafc;
    }

    .product-image {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .product-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .product-stats {
      font-size: 0.75rem;
      color: #64748b;
    }

    .empty-products {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .empty-products span {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    /* Quick Actions */
    .quick-actions h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }

    .action-icon {
      font-size: 1.5rem;
    }

    .action-label {
      font-size: 0.875rem;
      color: #475569;
    }

    /* Section Content */
    .section-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
    }

    .info-text {
      color: #64748b;
      margin-bottom: 1rem;
    }

    .primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .primary-btn:hover {
      background: #2563eb;
    }

    .secondary-btn {
      padding: 0.75rem 1.5rem;
      background: white;
      color: #3b82f6;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .secondary-btn:hover {
      background: #eff6ff;
    }

    .pending-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Mobile Header */
    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1rem;
      align-items: center;
      justify-content: space-between;
      z-index: 50;
    }

    .mobile-header h1 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .menu-toggle,
    .notification-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      font-size: 1.25rem;
      cursor: pointer;
      position: relative;
    }

    .notification-btn .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 16px;
      height: 16px;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Bottom Navigation */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: white;
      border-top: 1px solid #e2e8f0;
      justify-content: space-around;
      align-items: center;
      z-index: 50;
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      position: relative;
    }

    .bottom-nav-item.active {
      color: #3b82f6;
    }

    .bottom-nav-item .nav-icon {
      font-size: 1.25rem;
    }

    .bottom-nav-item .nav-label {
      font-size: 0.625rem;
    }

    .bottom-nav-item .badge {
      position: absolute;
      top: 0;
      right: 0;
      min-width: 16px;
      height: 16px;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 99;
    }

    .sidebar-toggle {
      display: none;
    }

    /* Mobile Styles */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-row {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .sidebar-toggle {
        display: block;
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        color: white;
        cursor: pointer;
      }

      .main-content {
        margin-left: 0;
        padding: 1rem;
        padding-top: 72px;
        padding-bottom: 80px;
      }

      .mobile-header,
      .bottom-nav {
        display: flex;
      }

      .sidebar-overlay {
        display: block;
      }

      .mobile-only {
        display: flex;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
      }

      .period-selector {
        width: 100%;
        justify-content: center;
      }
    }

    /* Desktop hide mobile elements */
    @media (min-width: 769px) {
      .mobile-only {
        display: none !important;
      }
    }
  `]
})
export class PharmacyDashboardPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  // State
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly pharmacy = signal<Pharmacy | null>(null);
  readonly stats = signal<DashboardStats | null>(null);
  readonly activeMenuItem = signal<DashboardMenuItem>('overview');
  readonly selectedPeriod = signal<DashboardPeriod>('week');
  readonly sidebarOpen = signal<boolean>(false);
  readonly chartLoading = signal<boolean>(false);

  // Computed
  readonly pendingOrders = computed(() => this.stats()?.pendingOrders || 0);
  readonly salesTrend = signal<number>(12.5);
  readonly ordersTrend = signal<number>(8.3);

  // Math reference for template
  readonly Math = Math;

  // Menu Items
  readonly menuItems: { id: DashboardMenuItem; label: string; icon: string }[] = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'products', label: 'Produtos', icon: '📦' },
    { id: 'orders', label: 'Pedidos', icon: '📋' },
    { id: 'analytics', label: 'Análises', icon: '📈' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' }
  ];

  // Periods
  readonly periods: { value: DashboardPeriod; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
    { value: 'year', label: 'Ano' }
  ];

  private resizeObserver: ResizeObserver | null = null;

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.sidebarOpen() && !this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }

  /**
   * Carrega dados do dashboard
   */
  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    const userId = this.authService.currentUser()?.uid;
    
    if (!userId) {
      this.error.set('Usuário não autenticado');
      this.loading.set(false);
      return;
    }

    // Carregar farmácia
    this.pharmacyService.getPharmacyById(userId).subscribe({
      next: (pharmacyResult) => {
        if (pharmacyResult) {
          this.pharmacy.set(pharmacyResult);
          
          // Carregar estatísticas
          this.loadStats();
          
          // Renderizar gráfico
          setTimeout(() => this.renderChart(), 100);
        } else {
          this.error.set('Farmácia não encontrada');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dashboard:', err);
        this.error.set('Erro ao carregar dados do dashboard');
        this.loading.set(false);
      }
    });
  }

  /**
   * Carrega estatísticas
   */
  loadStats(): void {
    // Simulação de dados - Em produção, buscar do backend
    const mockStats: DashboardStats = {
      totalSales: 1589900, // R$ 15.899,00
      totalOrders: 127,
      pendingOrders: 3,
      averageRating: this.pharmacy()?.rating || 4.5,
      totalReviews: this.pharmacy()?.reviewCount || 89,
      topProducts: [
        {
          productId: '1',
          productName: 'Dipirona 500mg',
          soldCount: 156,
          revenue: 312000
        },
        {
          productId: '2',
          productName: 'Paracetamol 750mg',
          soldCount: 134,
          revenue: 268000
        },
        {
          productId: '3',
          productName: 'Ibuprofeno 400mg',
          soldCount: 98,
          revenue: 245000
        },
        {
          productId: '4',
          productName: 'Vitamina C 1g',
          soldCount: 87,
          revenue: 174000
        },
        {
          productId: '5',
          productName: 'Omeprazol 20mg',
          soldCount: 76,
          revenue: 228000
        }
      ],
      salesByPeriod: this.generateSalesData()
    };

    this.stats.set(mockStats);
  }

  /**
   * Gera dados de vendas por período
   */
  private generateSalesData(): SalesPeriodData[] {
    const data: SalesPeriodData[] = [];
    const period = this.selectedPeriod();
    
    if (period === 'today') {
      for (let i = 8; i <= 20; i++) {
        data.push({
          date: `${i}:00`,
          label: `${i}:00`,
          sales: Math.floor(Math.random() * 50000) + 10000,
          orders: Math.floor(Math.random() * 10) + 1
        });
      }
    } else if (period === 'week') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      days.forEach((day, i) => {
        data.push({
          date: `${i}`,
          label: day,
          sales: Math.floor(Math.random() * 200000) + 50000,
          orders: Math.floor(Math.random() * 30) + 5
        });
      });
    } else if (period === 'month') {
      for (let i = 1; i <= 30; i++) {
        data.push({
          date: `${i}`,
          label: `${i}`,
          sales: Math.floor(Math.random() * 100000) + 20000,
          orders: Math.floor(Math.random() * 20) + 2
        });
      }
    } else {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      months.forEach((month, i) => {
        data.push({
          date: `${i}`,
          label: month,
          sales: Math.floor(Math.random() * 500000) + 100000,
          orders: Math.floor(Math.random() * 150) + 50
        });
      });
    }

    return data;
  }

  /**
   * Renderiza gráfico de vendas (agora feito com CSS)
   */
  private renderChart(): void {
    // O gráfico agora é renderizado diretamente via CSS bars no template
    // Esta função apenas sinaliza que o loading terminou
    this.chartLoading.set(false);
  }

  /**
   * Calcula altura da barra baseado no valor máximo
   */
  getBarHeight(sales: number): number {
    const data = this.stats()?.salesByPeriod || [];
    const maxSales = Math.max(...data.map(d => d.sales), 1);
    return (sales / maxSales) * 100;
  }

  /**
   * Setup resize observer
   */
  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.resizeObserver = new ResizeObserver(() => {
      // CSS bars resize automatically
    });

    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      this.resizeObserver.observe(chartContainer);
    }
  }

  /**
   * Verifica se está em mobile
   */
  isMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.innerWidth <= 768;
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  /**
   * Define item de menu ativo
   */
  setActiveMenuItem(item: DashboardMenuItem): void {
    this.activeMenuItem.set(item);
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }

  /**
   * Define período selecionado
   */
  setSelectedPeriod(period: DashboardPeriod): void {
    this.selectedPeriod.set(period);
    this.loadStats();
    this.renderChart();
  }

  /**
   * Retorna label do período
   */
  getPeriodLabel(): string {
    const period = this.selectedPeriod();
    const labels: Record<DashboardPeriod, string> = {
      today: 'Hoje',
      week: 'Esta Semana',
      month: 'Este Mês',
      year: 'Este Ano'
    };
    return labels[period];
  }

  /**
   * Retorna título do menu
   */
  getMenuTitle(): string {
    const item = this.menuItems.find(m => m.id === this.activeMenuItem());
    return item?.label || 'Dashboard';
  }

  /**
   * Formata valor em moeda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }

  /**
   * Navegação
   */
  goToProducts(): void {
    this.setActiveMenuItem('products');
  }

  goToOrders(): void {
    this.setActiveMenuItem('orders');
  }

  goToPendingOrders(): void {
    this.router.navigate(['/pharmacy/orders'], { queryParams: { status: 'pending' } });
  }

  goToReviews(): void {
    this.router.navigate(['/pharmacy/reviews']);
  }

  goToSettings(): void {
    this.setActiveMenuItem('settings');
  }

  addProduct(): void {
    this.router.navigate(['/pharmacy/products/new']);
  }

  openNotifications(): void {
    // TODO: Implementar notificações
    console.log('Abrir notificações');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
