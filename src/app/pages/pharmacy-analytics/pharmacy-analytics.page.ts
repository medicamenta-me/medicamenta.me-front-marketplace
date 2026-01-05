/**
 * 📊 Pharmacy Analytics Page
 * Página de análises e relatórios para farmácias
 * 
 * Funcionalidades:
 * - Gráfico de vendas (linha/barra)
 * - Produtos mais vendidos (ranking)
 * - Vendas por categoria (pizza)
 * - Ticket médio e conversão
 * - Filtros por período
 * - Exportação de relatórios
 */

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PharmacyService } from '../../services/pharmacy.service';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

// Interfaces de Analytics
export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  items: number;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  growth: number;
  imageUrl?: string;
}

export interface CategorySales {
  category: string;
  revenue: number;
  percentage: number;
  color: string;
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  conversionRate: number;
  returningCustomers: number;
  newCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export interface PeriodFilter {
  label: string;
  value: 'today' | '7days' | '30days' | '90days' | 'year' | 'custom';
  days?: number;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  salesData: SalesData[];
  topProducts: TopProduct[];
  categorySales: CategorySales[];
}

@Component({
  selector: 'app-pharmacy-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    PercentPipe
  ],
  template: `
    <div class="analytics-container" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="analytics-sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="pharmacy-logo" *ngIf="!sidebarCollapsed()">
            <span class="logo-icon">📊</span>
            <span class="logo-text">Analytics</span>
          </div>
          <button class="toggle-btn" (click)="toggleSidebar()">
            <span>{{ sidebarCollapsed() ? '→' : '←' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/pharmacy/dashboard" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Dashboard</span>
          </a>
          <a routerLink="/pharmacy/products" class="nav-item">
            <span class="nav-icon">📦</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Produtos</span>
          </a>
          <a routerLink="/pharmacy/orders" class="nav-item">
            <span class="nav-icon">📋</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Pedidos</span>
          </a>
          <a routerLink="/pharmacy/analytics" class="nav-item active">
            <span class="nav-icon">📊</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed()">Analytics</span>
          </a>
        </nav>

        <div class="sidebar-footer" *ngIf="!sidebarCollapsed()">
          <button class="btn-back" routerLink="/pharmacy/dashboard">
            ← Voltar ao Dashboard
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="analytics-main">
        <!-- Header -->
        <header class="analytics-header">
          <div class="header-title">
            <h1>📊 Analytics</h1>
            <p class="subtitle">Métricas e relatórios de performance</p>
          </div>

          <div class="header-actions">
            <!-- Period Filter -->
            <div class="period-filter">
              @for (period of periodFilters; track period.value) {
                <button 
                  class="period-btn"
                  [class.active]="selectedPeriod() === period.value"
                  (click)="selectPeriod(period.value)">
                  {{ period.label }}
                </button>
              }
            </div>

            <!-- Custom Date Range -->
            @if (selectedPeriod() === 'custom') {
              <div class="date-range">
                <input 
                  type="date" 
                  [value]="customStartDate()"
                  (change)="setCustomStartDate($event)">
                <span>até</span>
                <input 
                  type="date"
                  [value]="customEndDate()"
                  (change)="setCustomEndDate($event)">
                <button class="btn-apply" (click)="applyCustomRange()">
                  Aplicar
                </button>
              </div>
            }

            <!-- Export Button -->
            <button class="btn-export" (click)="exportReport()">
              📥 Exportar
            </button>
          </div>
        </header>

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando dados...</p>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="error-state">
            <span class="error-icon">⚠️</span>
            <p>{{ error() }}</p>
            <button class="btn-retry" (click)="loadAnalytics()">
              Tentar Novamente
            </button>
          </div>
        }

        <!-- Analytics Content -->
        @if (!loading() && !error()) {
          <!-- KPI Cards -->
          <section class="kpi-section">
            <div class="kpi-grid">
              <!-- Total Revenue -->
              <div class="kpi-card revenue">
                <div class="kpi-icon">💰</div>
                <div class="kpi-content">
                  <span class="kpi-value">{{ metrics()?.totalRevenue | currency:'BRL':'symbol':'1.2-2' }}</span>
                  <span class="kpi-label">Receita Total</span>
                  <div class="kpi-change" [class.positive]="(metrics()?.revenueGrowth ?? 0) >= 0" [class.negative]="(metrics()?.revenueGrowth ?? 0) < 0">
                    <span>{{ (metrics()?.revenueGrowth ?? 0) >= 0 ? '↑' : '↓' }}</span>
                    <span>{{ metrics()?.revenueGrowth | percent:'1.1-1' }}</span>
                  </div>
                </div>
              </div>

              <!-- Total Orders -->
              <div class="kpi-card orders">
                <div class="kpi-icon">📦</div>
                <div class="kpi-content">
                  <span class="kpi-value">{{ metrics()?.totalOrders | number }}</span>
                  <span class="kpi-label">Total de Pedidos</span>
                  <div class="kpi-change" [class.positive]="(metrics()?.ordersGrowth ?? 0) >= 0" [class.negative]="(metrics()?.ordersGrowth ?? 0) < 0">
                    <span>{{ (metrics()?.ordersGrowth ?? 0) >= 0 ? '↑' : '↓' }}</span>
                    <span>{{ metrics()?.ordersGrowth | percent:'1.1-1' }}</span>
                  </div>
                </div>
              </div>

              <!-- Average Ticket -->
              <div class="kpi-card ticket">
                <div class="kpi-icon">🎫</div>
                <div class="kpi-content">
                  <span class="kpi-value">{{ metrics()?.avgTicket | currency:'BRL':'symbol':'1.2-2' }}</span>
                  <span class="kpi-label">Ticket Médio</span>
                </div>
              </div>

              <!-- Conversion Rate -->
              <div class="kpi-card conversion">
                <div class="kpi-icon">📈</div>
                <div class="kpi-content">
                  <span class="kpi-value">{{ metrics()?.conversionRate | percent:'1.1-1' }}</span>
                  <span class="kpi-label">Taxa de Conversão</span>
                </div>
              </div>

              <!-- New Customers -->
              <div class="kpi-card customers">
                <div class="kpi-icon">👤</div>
                <div class="kpi-content">
                  <span class="kpi-value">{{ metrics()?.newCustomers | number }}</span>
                  <span class="kpi-label">Novos Clientes</span>
                </div>
              </div>

              <!-- Returning Customers -->
              <div class="kpi-card returning">
                <div class="kpi-icon">🔄</div>
                <div class="kpi-content">
                  <span class="kpi-value">{{ metrics()?.returningCustomers | number }}</span>
                  <span class="kpi-label">Clientes Recorrentes</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Charts Section -->
          <section class="charts-section">
            <!-- Sales Chart (CSS-based bar chart) -->
            <div class="chart-card sales-chart">
              <div class="chart-header">
                <h2>📈 Vendas no Período</h2>
                <div class="chart-type-toggle">
                  <button 
                    [class.active]="salesChartType() === 'line'"
                    (click)="setSalesChartType('line')">
                    Linha
                  </button>
                  <button 
                    [class.active]="salesChartType() === 'bar'"
                    (click)="setSalesChartType('bar')">
                    Barra
                  </button>
                </div>
              </div>
              <div class="chart-container css-chart">
                <div class="bar-chart">
                  @for (data of salesData(); track data.date) {
                    <div class="bar-item">
                      <div class="bar" [style.height.%]="getBarHeight(data.revenue)" [attr.title]="'R$ ' + data.revenue.toFixed(2)">
                        <span class="bar-value">{{ data.revenue | currency:'BRL':'symbol':'1.0-0' }}</span>
                      </div>
                      <span class="bar-label">{{ data.date }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Category Distribution (CSS-based) -->
            <div class="chart-card category-chart">
              <div class="chart-header">
                <h2>🥧 Vendas por Categoria</h2>
              </div>
              <div class="category-bars">
                @for (category of categorySales(); track category.category) {
                  <div class="category-bar-item">
                    <div class="category-bar-header">
                      <span class="category-name">{{ category.category }}</span>
                      <span class="category-value">{{ category.revenue | currency:'BRL':'symbol':'1.0-0' }}</span>
                    </div>
                    <div class="category-bar-track">
                      <div 
                        class="category-bar-fill" 
                        [style.width.%]="category.percentage * 100"
                        [style.backgroundColor]="category.color">
                      </div>
                    </div>
                    <span class="category-percentage">{{ category.percentage | percent:'1.0-0' }}</span>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- Top Products Section -->
          <section class="top-products-section">
            <div class="section-header">
              <h2>🏆 Produtos Mais Vendidos</h2>
              <button class="btn-view-all" routerLink="/pharmacy/products">
                Ver Todos →
              </button>
            </div>

            <div class="top-products-table">
              <table>
                <thead>
                  <tr>
                    <th class="rank-col">#</th>
                    <th class="product-col">Produto</th>
                    <th class="qty-col">Qtd. Vendida</th>
                    <th class="revenue-col">Receita</th>
                    <th class="growth-col">Crescimento</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of topProducts(); track product.id; let i = $index) {
                    <tr>
                      <td class="rank-col">
                        <span class="rank" [class.top3]="i < 3">{{ i + 1 }}</span>
                      </td>
                      <td class="product-col">
                        <div class="product-info">
                          <div class="product-image">
                            @if (product.imageUrl) {
                              <img [src]="product.imageUrl" [alt]="product.name">
                            } @else {
                              <span class="no-image">📦</span>
                            }
                          </div>
                          <span class="product-name">{{ product.name }}</span>
                        </div>
                      </td>
                      <td class="qty-col">{{ product.quantity | number }}</td>
                      <td class="revenue-col">{{ product.revenue | currency:'BRL':'symbol':'1.2-2' }}</td>
                      <td class="growth-col">
                        <span 
                          class="growth-badge"
                          [class.positive]="product.growth >= 0"
                          [class.negative]="product.growth < 0">
                          {{ product.growth >= 0 ? '+' : '' }}{{ product.growth | percent:'1.1-1' }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="empty-state">
                        Nenhum dado disponível para o período selecionado
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- Additional Insights -->
          <section class="insights-section">
            <div class="section-header">
              <h2>💡 Insights</h2>
            </div>

            <div class="insights-grid">
              <!-- Peak Hours -->
              <div class="insight-card">
                <div class="insight-icon">⏰</div>
                <div class="insight-content">
                  <h3>Horário de Pico</h3>
                  <p class="insight-value">{{ peakHour() }}</p>
                  <p class="insight-desc">Maior volume de vendas</p>
                </div>
              </div>

              <!-- Best Day -->
              <div class="insight-card">
                <div class="insight-icon">📅</div>
                <div class="insight-content">
                  <h3>Melhor Dia</h3>
                  <p class="insight-value">{{ bestDay() }}</p>
                  <p class="insight-desc">Dia com mais pedidos</p>
                </div>
              </div>

              <!-- Average Items -->
              <div class="insight-card">
                <div class="insight-icon">🛒</div>
                <div class="insight-content">
                  <h3>Itens por Pedido</h3>
                  <p class="insight-value">{{ avgItemsPerOrder() | number:'1.1-1' }}</p>
                  <p class="insight-desc">Média de itens</p>
                </div>
              </div>

              <!-- Repeat Rate -->
              <div class="insight-card">
                <div class="insight-icon">🔁</div>
                <div class="insight-content">
                  <h3>Taxa de Recompra</h3>
                  <p class="insight-value">{{ repeatPurchaseRate() | percent:'1.0-0' }}</p>
                  <p class="insight-desc">Clientes que voltam</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Comparison Period -->
          <section class="comparison-section">
            <div class="section-header">
              <h2>📊 Comparativo com Período Anterior</h2>
            </div>

            <div class="comparison-grid">
              <div class="comparison-item">
                <span class="comp-label">Receita</span>
                <div class="comp-bars">
                  <div class="comp-bar current" [style.width.%]="getComparisonWidth('revenue', 'current')">
                    <span>{{ currentPeriodRevenue() | currency:'BRL':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="comp-bar previous" [style.width.%]="getComparisonWidth('revenue', 'previous')">
                    <span>{{ previousPeriodRevenue() | currency:'BRL':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
                <div class="comp-legend">
                  <span class="current-label">Atual</span>
                  <span class="previous-label">Anterior</span>
                </div>
              </div>

              <div class="comparison-item">
                <span class="comp-label">Pedidos</span>
                <div class="comp-bars">
                  <div class="comp-bar current" [style.width.%]="getComparisonWidth('orders', 'current')">
                    <span>{{ currentPeriodOrders() }}</span>
                  </div>
                  <div class="comp-bar previous" [style.width.%]="getComparisonWidth('orders', 'previous')">
                    <span>{{ previousPeriodOrders() }}</span>
                  </div>
                </div>
                <div class="comp-legend">
                  <span class="current-label">Atual</span>
                  <span class="previous-label">Anterior</span>
                </div>
              </div>
            </div>
          </section>
        }
      </main>

      <!-- Mobile Bottom Nav -->
      <nav class="mobile-nav">
        <a routerLink="/pharmacy/dashboard" class="mobile-nav-item">
          <span class="mobile-nav-icon">🏠</span>
          <span class="mobile-nav-label">Dashboard</span>
        </a>
        <a routerLink="/pharmacy/products" class="mobile-nav-item">
          <span class="mobile-nav-icon">📦</span>
          <span class="mobile-nav-label">Produtos</span>
        </a>
        <a routerLink="/pharmacy/orders" class="mobile-nav-item">
          <span class="mobile-nav-icon">📋</span>
          <span class="mobile-nav-label">Pedidos</span>
        </a>
        <a routerLink="/pharmacy/analytics" class="mobile-nav-item active">
          <span class="mobile-nav-icon">📊</span>
          <span class="mobile-nav-label">Analytics</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    /* Base Styles */
    :host {
      display: block;
      min-height: 100vh;
      background: #f5f7fa;
    }

    .analytics-container {
      display: flex;
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    /* Sidebar */
    .analytics-sidebar {
      width: 250px;
      background: linear-gradient(180deg, #1a365d 0%, #2d3748 100%);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
    }

    .analytics-sidebar.collapsed {
      width: 70px;
    }

    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .pharmacy-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .toggle-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .sidebar-nav {
      padding: 1rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .nav-icon {
      font-size: 1.25rem;
      width: 24px;
      text-align: center;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-back {
      width: 100%;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .btn-back:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Main Content */
    .analytics-main {
      flex: 1;
      margin-left: 250px;
      padding: 1.5rem;
      transition: margin-left 0.3s ease;
    }

    .sidebar-collapsed .analytics-main {
      margin-left: 70px;
    }

    /* Header */
    .analytics-header {
      margin-bottom: 1.5rem;
    }

    .header-title h1 {
      font-size: 1.75rem;
      color: #1a365d;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #718096;
      margin: 0;
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      align-items: center;
    }

    .period-filter {
      display: flex;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .period-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      color: #4a5568;
      transition: all 0.2s;
    }

    .period-btn:hover {
      background: #f7fafc;
    }

    .period-btn.active {
      background: #4299e1;
      color: white;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-range input {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .date-range span {
      color: #718096;
    }

    .btn-apply {
      padding: 0.5rem 1rem;
      background: #48bb78;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .btn-export {
      padding: 0.5rem 1rem;
      background: #1a365d;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .btn-export:hover {
      background: #2d3748;
    }

    /* Loading & Error States */
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      text-align: center;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #4299e1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .btn-retry {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #4299e1;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    /* KPI Section */
    .kpi-section {
      margin-bottom: 1.5rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .kpi-icon {
      font-size: 2rem;
      opacity: 0.8;
    }

    .kpi-content {
      flex: 1;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a365d;
      display: block;
    }

    .kpi-label {
      font-size: 0.875rem;
      color: #718096;
      display: block;
      margin-top: 0.25rem;
    }

    .kpi-change {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .kpi-change.positive {
      background: #c6f6d5;
      color: #276749;
    }

    .kpi-change.negative {
      background: #fed7d7;
      color: #c53030;
    }

    /* Charts Section */
    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .chart-header h2 {
      font-size: 1.125rem;
      color: #1a365d;
      margin: 0;
    }

    .chart-type-toggle {
      display: flex;
      background: #f7fafc;
      border-radius: 6px;
      overflow: hidden;
    }

    .chart-type-toggle button {
      padding: 0.375rem 0.75rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.75rem;
      color: #718096;
    }

    .chart-type-toggle button.active {
      background: #4299e1;
      color: white;
    }

    .chart-container {
      height: 300px;
      position: relative;
    }

    .pie-container {
      height: 200px;
    }

    .category-legend {
      margin-top: 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-label {
      color: #4a5568;
    }

    .legend-value {
      color: #718096;
      font-weight: 500;
    }

    /* Top Products Section */
    .top-products-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      font-size: 1.125rem;
      color: #1a365d;
      margin: 0;
    }

    .btn-view-all {
      background: none;
      border: none;
      color: #4299e1;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .top-products-table {
      overflow-x: auto;
    }

    .top-products-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .top-products-table th {
      text-align: left;
      padding: 0.75rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #718096;
      border-bottom: 2px solid #e2e8f0;
    }

    .top-products-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .rank-col { width: 50px; }
    .product-col { width: 40%; }
    .qty-col, .revenue-col, .growth-col { text-align: right; }

    .rank {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: #f7fafc;
      border-radius: 50%;
      font-weight: 600;
      color: #4a5568;
    }

    .rank.top3 {
      background: #fefcbf;
      color: #975a16;
    }

    .product-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .product-image {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      overflow: hidden;
      background: #f7fafc;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      font-size: 1.25rem;
    }

    .product-name {
      font-weight: 500;
      color: #2d3748;
    }

    .growth-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .growth-badge.positive {
      background: #c6f6d5;
      color: #276749;
    }

    .growth-badge.negative {
      background: #fed7d7;
      color: #c53030;
    }

    .empty-state {
      text-align: center;
      color: #718096;
      padding: 2rem !important;
    }

    /* Insights Section */
    .insights-section {
      margin-bottom: 1.5rem;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .insight-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .insight-icon {
      font-size: 2rem;
    }

    .insight-content h3 {
      font-size: 0.875rem;
      color: #718096;
      margin: 0 0 0.5rem 0;
    }

    .insight-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a365d;
      display: block;
    }

    .insight-desc {
      font-size: 0.75rem;
      color: #a0aec0;
      margin: 0.25rem 0 0 0;
    }

    /* Comparison Section */
    .comparison-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .comparison-grid {
      display: grid;
      gap: 1.5rem;
    }

    .comparison-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .comp-label {
      font-weight: 600;
      color: #2d3748;
    }

    .comp-bars {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .comp-bar {
      height: 36px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      padding: 0 1rem;
      font-weight: 500;
      min-width: 80px;
      transition: width 0.5s ease;
    }

    .comp-bar.current {
      background: linear-gradient(90deg, #4299e1, #63b3ed);
      color: white;
    }

    .comp-bar.previous {
      background: #e2e8f0;
      color: #4a5568;
    }

    .comp-legend {
      display: flex;
      gap: 1.5rem;
      font-size: 0.75rem;
    }

    .current-label::before {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #4299e1;
      border-radius: 3px;
      margin-right: 0.5rem;
    }

    .previous-label::before {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #e2e8f0;
      border-radius: 3px;
      margin-right: 0.5rem;
    }

    /* Mobile Navigation */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid #e2e8f0;
      padding: 0.5rem;
      z-index: 100;
    }

    .mobile-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
      color: #718096;
      text-decoration: none;
      font-size: 0.75rem;
    }

    .mobile-nav-item.active {
      color: #4299e1;
    }

    .mobile-nav-icon {
      font-size: 1.25rem;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .analytics-sidebar {
        display: none;
      }

      .analytics-main {
        margin-left: 0;
        padding: 1rem;
        padding-bottom: 5rem;
      }

      .sidebar-collapsed .analytics-main {
        margin-left: 0;
      }

      .mobile-nav {
        display: flex;
        justify-content: space-around;
      }

      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .period-filter {
        flex-wrap: wrap;
        justify-content: center;
      }

      .date-range {
        flex-wrap: wrap;
        justify-content: center;
      }

      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .kpi-card {
        padding: 1rem;
      }

      .kpi-value {
        font-size: 1.25rem;
      }

      .insights-grid {
        grid-template-columns: 1fr 1fr;
      }

      .top-products-table {
        font-size: 0.875rem;
      }

      .product-image {
        width: 32px;
        height: 32px;
      }
    }

    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .insights-grid {
        grid-template-columns: 1fr;
      }

      .chart-container {
        height: 250px;
      }
    }

    /* CSS Bar Chart Styles */
    .css-chart {
      height: auto;
      min-height: 200px;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 200px;
      padding: 1rem 0;
      gap: 4px;
    }

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 60px;
    }

    .bar {
      width: 100%;
      background: linear-gradient(180deg, #4299e1, #63b3ed);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      position: relative;
      transition: height 0.3s ease;
    }

    .bar:hover {
      background: linear-gradient(180deg, #3182ce, #4299e1);
    }

    .bar-value {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem;
      white-space: nowrap;
      color: #4a5568;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .bar:hover .bar-value {
      opacity: 1;
    }

    .bar-label {
      font-size: 0.7rem;
      color: #718096;
      margin-top: 0.5rem;
      text-align: center;
    }

    /* Category Bars */
    .category-bars {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .category-bar-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .category-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-name {
      font-size: 0.875rem;
      color: #4a5568;
    }

    .category-value {
      font-size: 0.75rem;
      color: #718096;
    }

    .category-bar-track {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .category-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .category-percentage {
      font-size: 0.75rem;
      color: #718096;
      text-align: right;
    }
  `]
})
export class PharmacyAnalyticsPage implements OnInit, OnDestroy {
  // Dependencies
  private readonly pharmacyService = inject(PharmacyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // State Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sidebarCollapsed = signal(false);

  // Period Filter
  readonly selectedPeriod = signal<string>('30days');
  readonly customStartDate = signal('');
  readonly customEndDate = signal('');

  // Analytics Data
  readonly metrics = signal<AnalyticsMetrics | null>(null);
  readonly salesData = signal<SalesData[]>([]);
  readonly topProducts = signal<TopProduct[]>([]);
  readonly categorySales = signal<CategorySales[]>([]);

  // Chart Type
  readonly salesChartType = signal<'line' | 'bar'>('line');

  // Insights
  readonly peakHour = signal('14:00 - 16:00');
  readonly bestDay = signal('Sexta-feira');
  readonly avgItemsPerOrder = signal(3.2);
  readonly repeatPurchaseRate = signal(0.35);

  // Comparison Data
  readonly currentPeriodRevenue = signal(0);
  readonly previousPeriodRevenue = signal(0);
  readonly currentPeriodOrders = signal(0);
  readonly previousPeriodOrders = signal(0);

  // Period Filters
  readonly periodFilters: PeriodFilter[] = [
    { label: 'Hoje', value: 'today', days: 1 },
    { label: '7 dias', value: '7days', days: 7 },
    { label: '30 dias', value: '30days', days: 30 },
    { label: '90 dias', value: '90days', days: 90 },
    { label: '1 ano', value: 'year', days: 365 },
    { label: 'Personalizado', value: 'custom' }
  ];

  // Category Colors
  private readonly categoryColors = [
    '#4299e1', '#48bb78', '#ed8936', '#9f7aea', 
    '#f56565', '#38b2ac', '#ed64a6', '#667eea'
  ];

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega dados de analytics
   */
  loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    const userId = this.authService.currentUser()?.uid;
    if (!userId) {
      this.error.set('Usuário não autenticado');
      this.loading.set(false);
      return;
    }

    // Simular carregamento de dados (em produção seria do backend)
    setTimeout(() => {
      this.loadMockData();
      this.loading.set(false);
    }, 1000);
  }

  /**
   * Carrega dados mock para demonstração
   */
  private loadMockData(): void {
    // Métricas principais
    this.metrics.set({
      totalRevenue: 45678.90,
      totalOrders: 342,
      avgTicket: 133.57,
      conversionRate: 0.032,
      returningCustomers: 89,
      newCustomers: 56,
      revenueGrowth: 0.15,
      ordersGrowth: 0.08
    });

    // Dados de vendas
    const salesData: SalesData[] = [];
    const days = this.getDaysForPeriod();
    const baseDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      salesData.push({
        date: this.formatDate(date),
        revenue: Math.random() * 2000 + 1000,
        orders: Math.floor(Math.random() * 20 + 5),
        items: Math.floor(Math.random() * 50 + 15)
      });
    }
    this.salesData.set(salesData);

    // Top produtos
    this.topProducts.set([
      { id: '1', name: 'Dipirona 500mg', quantity: 156, revenue: 4680.00, growth: 0.12 },
      { id: '2', name: 'Paracetamol 750mg', quantity: 142, revenue: 3550.00, growth: 0.08 },
      { id: '3', name: 'Ibuprofeno 400mg', quantity: 98, revenue: 2940.00, growth: -0.03 },
      { id: '4', name: 'Vitamina C 1g', quantity: 87, revenue: 2610.00, growth: 0.25 },
      { id: '5', name: 'Omeprazol 20mg', quantity: 76, revenue: 2280.00, growth: 0.05 },
      { id: '6', name: 'Loratadina 10mg', quantity: 65, revenue: 1625.00, growth: 0.18 },
      { id: '7', name: 'Dorflex', quantity: 54, revenue: 1350.00, growth: -0.07 },
      { id: '8', name: 'Buscopan Composto', quantity: 43, revenue: 1290.00, growth: 0.02 }
    ]);

    // Vendas por categoria
    this.categorySales.set([
      { category: 'Analgésicos', revenue: 12500, percentage: 0.27, color: this.categoryColors[0] },
      { category: 'Anti-inflamatórios', revenue: 9800, percentage: 0.21, color: this.categoryColors[1] },
      { category: 'Vitaminas', revenue: 7200, percentage: 0.16, color: this.categoryColors[2] },
      { category: 'Gastro', revenue: 5600, percentage: 0.12, color: this.categoryColors[3] },
      { category: 'Antialérgicos', revenue: 4200, percentage: 0.09, color: this.categoryColors[4] },
      { category: 'Outros', revenue: 6378, percentage: 0.15, color: this.categoryColors[5] }
    ]);

    // Comparação de períodos
    this.currentPeriodRevenue.set(45678.90);
    this.previousPeriodRevenue.set(39750.00);
    this.currentPeriodOrders.set(342);
    this.previousPeriodOrders.set(317);
  }

  /**
   * Calcula altura da barra baseado no valor máximo
   */
  getBarHeight(revenue: number): number {
    const data = this.salesData();
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    if (maxRevenue === 0) return 0;
    return (revenue / maxRevenue) * 100;
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  /**
   * Seleciona período
   */
  selectPeriod(period: string): void {
    this.selectedPeriod.set(period);
    if (period !== 'custom') {
      this.loadAnalytics();
    }
  }

  /**
   * Define data inicial personalizada
   */
  setCustomStartDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.customStartDate.set(input.value);
  }

  /**
   * Define data final personalizada
   */
  setCustomEndDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.customEndDate.set(input.value);
  }

  /**
   * Aplica range personalizado
   */
  applyCustomRange(): void {
    if (this.customStartDate() && this.customEndDate()) {
      this.loadAnalytics();
    }
  }

  /**
   * Altera tipo de gráfico de vendas
   */
  setSalesChartType(type: 'line' | 'bar'): void {
    this.salesChartType.set(type);
    // CSS-based chart updates automatically via Angular bindings
  }

  /**
   * Exporta relatório
   */
  exportReport(): void {
    // Gerar CSV
    const headers = ['Data', 'Receita', 'Pedidos', 'Itens'];
    const rows = this.salesData().map(d => 
      [d.date, d.revenue.toFixed(2), d.orders.toString(), d.items.toString()]
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${this.formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Obtém largura da barra de comparação
   */
  getComparisonWidth(metric: 'revenue' | 'orders', period: 'current' | 'previous'): number {
    let current: number;
    let previous: number;

    if (metric === 'revenue') {
      current = this.currentPeriodRevenue();
      previous = this.previousPeriodRevenue();
    } else {
      current = this.currentPeriodOrders();
      previous = this.previousPeriodOrders();
    }

    const max = Math.max(current, previous);
    if (max === 0) return 0;

    const value = period === 'current' ? current : previous;
    return (value / max) * 100;
  }

  /**
   * Obtém número de dias para o período selecionado
   */
  private getDaysForPeriod(): number {
    const period = this.periodFilters.find(p => p.value === this.selectedPeriod());
    return period?.days || 30;
  }

  /**
   * Formata data
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }
}
