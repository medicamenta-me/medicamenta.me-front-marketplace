/**
 * 📦 Product Management Page
 * Página de gestão de produtos para farmácias
 * 
 * Features:
 * - Lista de produtos da farmácia
 * - Filtros (categoria, status, estoque)
 * - Busca de produtos
 * - Edição em lote
 * - Ativar/desativar produtos
 * - Alertas de estoque baixo
 * - Ações rápidas (editar, duplicar, excluir)
 */

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, ProductCategory, ProductFilters, CATEGORY_LABELS } from '../../models/product.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { debounceTime, distinctUntilChanged, Subject, takeUntil, firstValueFrom } from 'rxjs';

export type ProductSortField = 'name' | 'price' | 'stock' | 'soldCount' | 'createdAt';
export type SortDirection = 'asc' | 'desc';
export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type StatusFilter = 'all' | 'active' | 'inactive';

export interface ProductListFilters extends ProductFilters {
  stockFilter?: StockFilter;
  statusFilter?: StatusFilter;
  sortField?: ProductSortField;
  sortDirection?: SortDirection;
}

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="product-management-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" routerLink="/pharmacy/dashboard">
            <span>←</span>
          </button>
          <div class="header-title">
            <h1>Gestão de Produtos</h1>
            <span class="product-count">{{ totalProducts() }} produtos</span>
          </div>
        </div>
        <div class="header-right">
          @if (selectedProducts().length > 0) {
            <div class="bulk-actions">
              <span class="selected-count">{{ selectedProducts().length }} selecionados</span>
              <button class="bulk-btn activate" (click)="bulkActivate()">
                <span>✓</span> Ativar
              </button>
              <button class="bulk-btn deactivate" (click)="bulkDeactivate()">
                <span>✗</span> Desativar
              </button>
              <button class="bulk-btn delete" (click)="bulkDelete()">
                <span>🗑</span> Excluir
              </button>
            </div>
          } @else {
            <button class="add-product-btn" (click)="addProduct()">
              <span>+</span> Novo Produto
            </button>
          }
        </div>
      </header>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <!-- Search -->
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar produtos..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
          />
          @if (searchQuery()) {
            <button class="clear-search" (click)="clearSearch()">✕</button>
          }
        </div>

        <!-- Category Filter -->
        <div class="filter-group">
          <select class="filter-select" [ngModel]="selectedCategory()" (ngModelChange)="onCategoryChange($event)">
            <option value="">Todas Categorias</option>
            @for (category of categories; track category.value) {
              <option [value]="category.value">{{ category.label }}</option>
            }
          </select>
        </div>

        <!-- Stock Filter -->
        <div class="filter-group">
          <select class="filter-select" [ngModel]="stockFilter()" (ngModelChange)="onStockFilterChange($event)">
            <option value="all">Todo Estoque</option>
            <option value="in_stock">Em Estoque</option>
            <option value="low_stock">Estoque Baixo</option>
            <option value="out_of_stock">Sem Estoque</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <select class="filter-select" [ngModel]="statusFilter()" (ngModelChange)="onStatusFilterChange($event)">
            <option value="all">Todos Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <!-- Sort -->
        <div class="filter-group sort-group">
          <select class="filter-select" [ngModel]="sortField()" (ngModelChange)="onSortFieldChange($event)">
            <option value="createdAt">Mais Recentes</option>
            <option value="name">Nome</option>
            <option value="price">Preço</option>
            <option value="stock">Estoque</option>
            <option value="soldCount">Mais Vendidos</option>
          </select>
          <button class="sort-direction-btn" (click)="toggleSortDirection()">
            {{ sortDirection() === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>

      <!-- Alerts -->
      @if (lowStockProducts().length > 0) {
        <div class="alert warning">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">{{ lowStockProducts().length }} produto(s) com estoque baixo</span>
          <button class="alert-action" (click)="filterLowStock()">Ver</button>
        </div>
      }

      @if (outOfStockProducts().length > 0) {
        <div class="alert danger">
          <span class="alert-icon">🚫</span>
          <span class="alert-text">{{ outOfStockProducts().length }} produto(s) sem estoque</span>
          <button class="alert-action" (click)="filterOutOfStock()">Ver</button>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner />
          <p>Carregando produtos...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <app-empty-state
          icon="❌"
          title="Erro ao carregar"
          [message]="error()!"
          actionText="Tentar novamente"
          (action)="loadProducts()"
        />
      }

      <!-- Empty State -->
      @if (!loading() && !error() && filteredProducts().length === 0) {
        <app-empty-state
          icon="📦"
          title="Nenhum produto encontrado"
          [message]="getEmptyMessage()"
          actionText="Adicionar Produto"
          (action)="addProduct()"
        />
      }

      <!-- Products List -->
      @if (!loading() && !error() && filteredProducts().length > 0) {
        <div class="products-list">
          <!-- Header Row -->
          <div class="list-header">
            <div class="col checkbox-col">
              <input
                type="checkbox"
                [checked]="allSelected()"
                [indeterminate]="someSelected() && !allSelected()"
                (change)="toggleSelectAll($event)"
              />
            </div>
            <div class="col image-col">Imagem</div>
            <div class="col name-col">Produto</div>
            <div class="col category-col">Categoria</div>
            <div class="col price-col">Preço</div>
            <div class="col stock-col">Estoque</div>
            <div class="col status-col">Status</div>
            <div class="col actions-col">Ações</div>
          </div>

          <!-- Product Rows -->
          @for (product of filteredProducts(); track product.id) {
            <div 
              class="product-row" 
              [class.selected]="isSelected(product.id)"
              [class.low-stock]="isLowStock(product)"
              [class.out-of-stock]="isOutOfStock(product)"
              [class.inactive]="!product.isActive"
            >
              <div class="col checkbox-col">
                <input
                  type="checkbox"
                  [checked]="isSelected(product.id)"
                  (change)="toggleSelect(product.id)"
                />
              </div>
              
              <div class="col image-col">
                <div class="product-image">
                  @if (product.images[0]) {
                    <img [src]="product.images[0]" [alt]="product.name" />
                  } @else {
                    <span class="image-placeholder">💊</span>
                  }
                </div>
              </div>

              <div class="col name-col">
                <div class="product-info">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-sku">SKU: {{ product.sku }}</span>
                  @if (product.requiresPrescription) {
                    <span class="prescription-badge">📋 Receita</span>
                  }
                </div>
              </div>

              <div class="col category-col">
                <span class="category-badge">{{ getCategoryLabel(product.category) }}</span>
              </div>

              <div class="col price-col">
                <div class="price-info">
                  <span class="current-price">{{ formatCurrency(product.price) }}</span>
                  @if (product.originalPrice && product.originalPrice > product.price) {
                    <span class="original-price">{{ formatCurrency(product.originalPrice) }}</span>
                    <span class="discount-badge">-{{ product.discount }}%</span>
                  }
                </div>
              </div>

              <div class="col stock-col">
                <div class="stock-info" [class.low]="isLowStock(product)" [class.out]="isOutOfStock(product)">
                  <span class="stock-value">{{ product.stock }}</span>
                  @if (isOutOfStock(product)) {
                    <span class="stock-label">Sem estoque</span>
                  } @else if (isLowStock(product)) {
                    <span class="stock-label">Baixo</span>
                  }
                </div>
              </div>

              <div class="col status-col">
                <label class="status-toggle">
                  <input 
                    type="checkbox" 
                    [checked]="product.isActive"
                    (change)="toggleProductStatus(product)"
                  />
                  <span class="toggle-slider"></span>
                  <span class="status-label">{{ product.isActive ? 'Ativo' : 'Inativo' }}</span>
                </label>
              </div>

              <div class="col actions-col">
                <div class="actions-menu">
                  <button class="action-btn edit" (click)="editProduct(product)" title="Editar">
                    <span>✏️</span>
                  </button>
                  <button class="action-btn duplicate" (click)="duplicateProduct(product)" title="Duplicar">
                    <span>📋</span>
                  </button>
                  <button class="action-btn delete" (click)="deleteProduct(product)" title="Excluir">
                    <span>🗑️</span>
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
              class="page-btn prev"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
            >
              ←
            </button>
            
            @for (page of visiblePages(); track page) {
              @if (page === '...') {
                <span class="page-ellipsis">...</span>
              } @else {
                <button 
                  class="page-btn"
                  [class.active]="currentPage() === page"
                  (click)="goToPage(+page)"
                >
                  {{ page }}
                </button>
              }
            }

            <button 
              class="page-btn next"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)"
            >
              →
            </button>
          </div>
        }
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div class="modal-overlay" role="dialog" aria-modal="true" tabindex="-1" (click)="closeDeleteModal()" (keydown.escape)="closeDeleteModal()">
          <div class="modal-content" role="document" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
            <h2>Confirmar Exclusão</h2>
            <p>
              @if (productsToDelete().length === 1) {
                Tem certeza que deseja excluir o produto <strong>{{ productsToDelete()[0].name }}</strong>?
              } @else {
                Tem certeza que deseja excluir <strong>{{ productsToDelete().length }} produtos</strong>?
              }
            </p>
            <p class="warning-text">Esta ação não pode ser desfeita.</p>
            <div class="modal-actions">
              <button class="cancel-btn" (click)="closeDeleteModal()">Cancelar</button>
              <button class="confirm-btn" (click)="confirmDelete()" [disabled]="deleting()">
                @if (deleting()) {
                  <span>Excluindo...</span>
                } @else {
                  <span>Excluir</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-management-container {
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
      flex-wrap: wrap;
      gap: 1rem;
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
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .product-count {
      font-size: 0.875rem;
      color: #64748b;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .add-product-btn {
      display: flex;
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

    .add-product-btn:hover {
      background: #2563eb;
    }

    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .selected-count {
      font-size: 0.875rem;
      color: #64748b;
      padding-right: 0.75rem;
      border-right: 1px solid #e2e8f0;
    }

    .bulk-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .bulk-btn.activate {
      background: #dcfce7;
      color: #16a34a;
    }

    .bulk-btn.deactivate {
      background: #fef3c7;
      color: #d97706;
    }

    .bulk-btn.delete {
      background: #fee2e2;
      color: #dc2626;
    }

    .bulk-btn:hover {
      filter: brightness(0.95);
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
      max-width: 400px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 2.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: border-color 0.2s;
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
      font-size: 0.875rem;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.25rem;
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

    .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .sort-group {
      display: flex;
      gap: 0;
    }

    .sort-group .filter-select {
      border-radius: 8px 0 0 8px;
    }

    .sort-direction-btn {
      padding: 0 0.75rem;
      border: 1px solid #e2e8f0;
      border-left: none;
      border-radius: 0 8px 8px 0;
      background: white;
      cursor: pointer;
      font-size: 1rem;
    }

    .sort-direction-btn:hover {
      background: #f8fafc;
    }

    /* Alerts */
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .alert.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .alert.danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .alert-icon {
      font-size: 1.25rem;
    }

    .alert-text {
      flex: 1;
      font-size: 0.875rem;
    }

    .alert-action {
      background: none;
      border: none;
      color: inherit;
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.875rem;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 1rem;
      color: #64748b;
    }

    /* Products List */
    .products-list {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .list-header {
      display: flex;
      align-items: center;
      padding: 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .product-row {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.2s;
    }

    .product-row:last-child {
      border-bottom: none;
    }

    .product-row:hover {
      background: #f8fafc;
    }

    .product-row.selected {
      background: #eff6ff;
    }

    .product-row.inactive {
      opacity: 0.6;
    }

    .product-row.low-stock {
      background: #fefce8;
    }

    .product-row.out-of-stock {
      background: #fef2f2;
    }

    .col {
      padding: 0 0.5rem;
    }

    .checkbox-col {
      width: 40px;
    }

    .image-col {
      width: 60px;
    }

    .name-col {
      flex: 2;
      min-width: 200px;
    }

    .category-col {
      flex: 1;
      min-width: 120px;
    }

    .price-col {
      flex: 1;
      min-width: 100px;
    }

    .stock-col {
      width: 100px;
    }

    .status-col {
      width: 100px;
    }

    .actions-col {
      width: 120px;
    }

    .product-image {
      width: 48px;
      height: 48px;
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

    .image-placeholder {
      font-size: 1.5rem;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .product-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .product-sku {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .prescription-badge {
      display: inline-block;
      font-size: 0.625rem;
      color: #6366f1;
      background: #eef2ff;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      width: fit-content;
    }

    .category-badge {
      font-size: 0.75rem;
      color: #475569;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .price-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .current-price {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .original-price {
      font-size: 0.75rem;
      color: #94a3b8;
      text-decoration: line-through;
    }

    .discount-badge {
      font-size: 0.625rem;
      color: #16a34a;
      background: #dcfce7;
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
    }

    .stock-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.125rem;
    }

    .stock-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stock-info.low .stock-value {
      color: #d97706;
    }

    .stock-info.out .stock-value {
      color: #dc2626;
    }

    .stock-label {
      font-size: 0.625rem;
      color: inherit;
    }

    /* Status Toggle */
    .status-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .status-toggle input {
      display: none;
    }

    .toggle-slider {
      width: 36px;
      height: 20px;
      background: #cbd5e1;
      border-radius: 10px;
      position: relative;
      transition: background 0.2s;
    }

    .toggle-slider::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
    }

    .status-toggle input:checked + .toggle-slider {
      background: #3b82f6;
    }

    .status-toggle input:checked + .toggle-slider::after {
      transform: translateX(16px);
    }

    .status-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Actions */
    .actions-menu {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f1f5f9;
    }

    .action-btn.edit:hover {
      background: #dbeafe;
    }

    .action-btn.duplicate:hover {
      background: #dcfce7;
    }

    .action-btn.delete:hover {
      background: #fee2e2;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .page-btn {
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .page-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-ellipsis {
      color: #94a3b8;
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
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
    }

    .modal-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem;
    }

    .modal-content p {
      color: #64748b;
      margin: 0 0 0.5rem;
    }

    .warning-text {
      color: #dc2626 !important;
      font-size: 0.875rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .cancel-btn {
      padding: 0.75rem 1.5rem;
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cancel-btn:hover {
      background: #f8fafc;
    }

    .confirm-btn {
      padding: 0.75rem 1.5rem;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .confirm-btn:hover:not(:disabled) {
      background: #b91c1c;
    }

    .confirm-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .name-col { min-width: 150px; }
      .category-col { min-width: 100px; }
    }

    @media (max-width: 768px) {
      .product-management-container {
        padding: 1rem;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-container {
        max-width: 100%;
      }

      .filter-group {
        width: 100%;
      }

      .filter-select {
        width: 100%;
      }

      .products-list {
        overflow-x: auto;
      }

      .list-header,
      .product-row {
        min-width: 800px;
      }

      .bulk-actions {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ProductManagementPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // State
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly products = signal<Product[]>([]);
  readonly selectedProducts = signal<string[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('');
  readonly stockFilter = signal<StockFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly sortField = signal<ProductSortField>('createdAt');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 20;

  // Modal
  readonly showDeleteModal = signal<boolean>(false);
  readonly productsToDelete = signal<Product[]>([]);
  readonly deleting = signal<boolean>(false);

  // Computed
  readonly filteredProducts = computed(() => {
    let result = [...this.products()];

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    const category = this.selectedCategory();
    if (category) {
      result = result.filter(p => p.category === category);
    }

    // Stock filter
    const stock = this.stockFilter();
    if (stock === 'in_stock') {
      result = result.filter(p => p.stock > p.minStock);
    } else if (stock === 'low_stock') {
      result = result.filter(p => p.stock > 0 && p.stock <= p.minStock);
    } else if (stock === 'out_of_stock') {
      result = result.filter(p => p.stock === 0);
    }

    // Status filter
    const status = this.statusFilter();
    if (status === 'active') {
      result = result.filter(p => p.isActive);
    } else if (status === 'inactive') {
      result = result.filter(p => !p.isActive);
    }

    // Sort
    const field = this.sortField();
    const direction = this.sortDirection();
    result.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        case 'soldCount':
          comparison = a.soldCount - b.soldCount;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const start = (this.currentPage() - 1) * this.pageSize;
    return result.slice(start, start + this.pageSize);
  });

  readonly totalProducts = computed(() => this.products().length);
  readonly totalPages = computed(() => Math.ceil(this.totalProducts() / this.pageSize));

  readonly lowStockProducts = computed(() => 
    this.products().filter(p => p.stock > 0 && p.stock <= p.minStock)
  );

  readonly outOfStockProducts = computed(() => 
    this.products().filter(p => p.stock === 0)
  );

  readonly allSelected = computed(() => {
    const filtered = this.filteredProducts();
    return filtered.length > 0 && filtered.every(p => this.isSelected(p.id));
  });

  readonly someSelected = computed(() => {
    const filtered = this.filteredProducts();
    return filtered.some(p => this.isSelected(p.id));
  });

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  // Categories
  readonly categories = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup search debounce
   */
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
    });
  }

  /**
   * Load products
   */
  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const pharmacyId = this.authService.currentUser()?.uid;
    
    if (!pharmacyId) {
      this.error.set('Usuário não autenticado');
      this.loading.set(false);
      return;
    }

    this.productService.getProductsByPharmacy(pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.products.set(result.products);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar produtos:', err);
          this.error.set('Erro ao carregar produtos');
          this.loading.set(false);
        }
      });
  }

  /**
   * Filter handlers
   */
  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  onStockFilterChange(filter: StockFilter): void {
    this.stockFilter.set(filter);
    this.currentPage.set(1);
  }

  onStatusFilterChange(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
  }

  onSortFieldChange(field: ProductSortField): void {
    this.sortField.set(field);
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  filterLowStock(): void {
    this.stockFilter.set('low_stock');
    this.currentPage.set(1);
  }

  filterOutOfStock(): void {
    this.stockFilter.set('out_of_stock');
    this.currentPage.set(1);
  }

  /**
   * Selection handlers
   */
  isSelected(productId: string): boolean {
    return this.selectedProducts().includes(productId);
  }

  toggleSelect(productId: string): void {
    const selected = this.selectedProducts();
    if (selected.includes(productId)) {
      this.selectedProducts.set(selected.filter(id => id !== productId));
    } else {
      this.selectedProducts.set([...selected, productId]);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const allIds = this.filteredProducts().map(p => p.id);
      this.selectedProducts.set(allIds);
    } else {
      this.selectedProducts.set([]);
    }
  }

  /**
   * Stock helpers
   */
  isLowStock(product: Product): boolean {
    return product.stock > 0 && product.stock <= product.minStock;
  }

  isOutOfStock(product: Product): boolean {
    return product.stock === 0;
  }

  /**
   * Actions
   */
  addProduct(): void {
    this.router.navigate(['/pharmacy/products/new']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/pharmacy/products/edit', product.id]);
  }

  async duplicateProduct(product: Product): Promise<void> {
    try {
      const duplicated = { ...product, id: '', name: `${product.name} (Cópia)`, sku: `${product.sku}-copy` };
      await firstValueFrom(this.productService.createProduct(duplicated));
      this.loadProducts();
    } catch (err) {
      console.error('Erro ao duplicar produto:', err);
    }
  }

  deleteProduct(product: Product): void {
    this.productsToDelete.set([product]);
    this.showDeleteModal.set(true);
  }

  async toggleProductStatus(product: Product): Promise<void> {
    try {
      await firstValueFrom(this.productService.updateProduct(product.id, { isActive: !product.isActive }));
      this.loadProducts();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  }

  /**
   * Bulk actions
   */
  async bulkActivate(): Promise<void> {
    try {
      const ids = this.selectedProducts();
      await Promise.all(ids.map(id => firstValueFrom(this.productService.updateProduct(id, { isActive: true }))));
      this.selectedProducts.set([]);
      this.loadProducts();
    } catch (err) {
      console.error('Erro ao ativar produtos:', err);
    }
  }

  async bulkDeactivate(): Promise<void> {
    try {
      const ids = this.selectedProducts();
      await Promise.all(ids.map(id => firstValueFrom(this.productService.updateProduct(id, { isActive: false }))));
      this.selectedProducts.set([]);
      this.loadProducts();
    } catch (err) {
      console.error('Erro ao desativar produtos:', err);
    }
  }

  bulkDelete(): void {
    const products = this.products().filter(p => this.selectedProducts().includes(p.id));
    this.productsToDelete.set(products);
    this.showDeleteModal.set(true);
  }

  /**
   * Delete modal
   */
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.productsToDelete.set([]);
  }

  async confirmDelete(): Promise<void> {
    this.deleting.set(true);

    try {
      const products = this.productsToDelete();
      await Promise.all(products.map(p => firstValueFrom(this.productService.deleteProduct(p.id))));
      this.selectedProducts.set(this.selectedProducts().filter(id => !products.some(p => p.id === id)));
      this.closeDeleteModal();
      this.loadProducts();
    } catch (err) {
      console.error('Erro ao excluir produtos:', err);
    } finally {
      this.deleting.set(false);
    }
  }

  /**
   * Pagination
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
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

  getCategoryLabel(category: ProductCategory): string {
    return CATEGORY_LABELS[category] || category;
  }

  getEmptyMessage(): string {
    if (this.searchQuery()) {
      return `Nenhum produto encontrado para "${this.searchQuery()}"`;
    }
    if (this.selectedCategory()) {
      return 'Nenhum produto nesta categoria';
    }
    if (this.stockFilter() !== 'all') {
      return 'Nenhum produto com este filtro de estoque';
    }
    if (this.statusFilter() !== 'all') {
      return 'Nenhum produto com este status';
    }
    return 'Comece adicionando seus produtos';
  }
}
