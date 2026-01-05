/**
 * 🛍️ Product List Page
 * Página de listagem de produtos com Material Design
 */

import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';

import { ProductService, PaginatedProducts } from '../../core/services/product.service';
import { Product, ProductCategory, ProductFilters, ProductSortOptions } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatBadgeModule,
    MatSidenavModule,
    ProductCardComponent,
    ProductFiltersComponent
  ]
})
export class ProductListPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  products = signal<Product[]>([]);
  isLoading = signal(false);
  hasMore = signal(true);
  showFilters = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  
  // Filtros e ordenação
  searchQuery = signal('');
  selectedCategory = signal<ProductCategory | undefined>(undefined);
  sortBy = signal<ProductSortOptions>({ field: 'createdAt', direction: 'desc' });
  activeFilters = signal<ProductFilters>({});
  
  // Paginação
  private lastDocument: any = null;
  private readonly PAGE_SIZE = 20;
  
  // Computed
  filteredProductsCount = computed(() => this.products().length);
  hasActiveFilters = computed(() => {
    const filters = this.activeFilters();
    return !!(
      filters.category || 
      filters.priceMin || 
      filters.priceMax || 
      filters.requiresPrescription !== undefined ||
      filters.inStock
    );
  });

  // Expose para template
  readonly JSON = JSON;
  readonly Object = Object;

  // Categorias disponíveis
  readonly categories = Object.values(ProductCategory);
  
  // Opções de ordenação
  readonly sortOptions = [
    { label: 'Mais Recentes', value: { field: 'createdAt', direction: 'desc' } as ProductSortOptions },
    { label: 'Mais Antigos', value: { field: 'createdAt', direction: 'asc' } as ProductSortOptions },
    { label: 'Menor Preço', value: { field: 'price', direction: 'asc' } as ProductSortOptions },
    { label: 'Maior Preço', value: { field: 'price', direction: 'desc' } as ProductSortOptions },
    { label: 'Melhor Avaliação', value: { field: 'rating', direction: 'desc' } as ProductSortOptions },
    { label: 'Mais Vendidos', value: { field: 'soldCount', direction: 'desc' } as ProductSortOptions },
    { label: 'Nome (A-Z)', value: { field: 'name', direction: 'asc' } as ProductSortOptions }
  ];

  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    // Observa mudanças na rota (categoria)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['category']) {
          this.selectedCategory.set(params['category'] as ProductCategory);
          this.activeFilters.update(f => ({ ...f, category: params['category'] }));
        }
        this.loadProducts(true);
      });

    // Observa mudanças no searchQuery (com debounce)
    this.productService.searchQuery$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.searchQuery.set(query);
        if (query.length >= 3) {
          this.searchProducts(query);
        } else if (query.length === 0) {
          this.loadProducts(true);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 📋 Carrega produtos com filtros atuais
   */
  async loadProducts(reset: boolean = false) {
    if (this.isLoading()) return;

    this.isLoading.set(true);

    try {
      if (reset) {
        this.products.set([]);
        this.lastDocument = null;
        this.hasMore.set(true);
      }

      const result = await firstValueFrom(
        this.productService.getProducts(
          this.activeFilters(),
          this.sortBy(),
          this.PAGE_SIZE,
          this.lastDocument
        )
      );

      if (result) {
        if (reset) {
          this.products.set(result.products);
        } else {
          this.products.update(current => [...current, ...result.products]);
        }
        
        this.lastDocument = result.lastDocument;
        this.hasMore.set(result.hasMore);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * 🔍 Busca produtos por texto
   */
  async searchProducts(query: string) {
    this.isLoading.set(true);

    try {
      const result = await firstValueFrom(
        this.productService.searchProducts(query, this.PAGE_SIZE)
      );
      
      if (result) {
        this.products.set(result.products);
        this.lastDocument = result.lastDocument;
        this.hasMore.set(result.hasMore);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * 📄 Carrega mais produtos (paginação)
   */
  async loadMore() {
    if (!this.hasMore() || this.isLoading()) return;
    await this.loadProducts(false);
  }

  /**
   * 🔍 Manipula busca
   */
  onSearchChange(event: Event) {
    const query = (event.target as HTMLInputElement).value || '';
    this.productService.searchQuery$.next(query);
  }

  /**
   * 📊 Manipula mudança de ordenação
   */
  onSortChange(value: string) {
    const selectedOption = this.sortOptions.find(opt => 
      JSON.stringify(opt.value) === value
    );
    if (selectedOption) {
      this.sortBy.set(selectedOption.value);
      this.loadProducts(true);
    }
  }

  /**
   * 🎛️ Aplica filtros
   */
  onFiltersApply(filters: ProductFilters) {
    this.activeFilters.set(filters);
    this.showFilters.set(false);
    this.loadProducts(true);
  }

  /**
   * 🧹 Limpa filtros
   */
  clearFilters() {
    this.activeFilters.set({});
    this.selectedCategory.set(undefined);
    this.searchQuery.set('');
    this.productService.searchQuery$.next('');
    this.router.navigate([], {
      queryParams: {},
      queryParamsHandling: 'merge'
    });
    this.loadProducts(true);
  }

  /**
   * 🗂️ Remove filtro específico
   */
  removeFilter(filterKey: keyof ProductFilters) {
    this.activeFilters.update(filters => {
      const newFilters = { ...filters };
      delete newFilters[filterKey];
      return newFilters;
    });
    this.loadProducts(true);
  }

  /**
   * 👁️ Alterna modo de visualização
   */
  toggleViewMode() {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  /**
   * 🎯 Navega para detalhes do produto
   */
  goToProductDetail(productId: string) {
    this.router.navigate(['/products', productId]);
  }

  /**
   * 📝 Obtém label da categoria
   */
  getCategoryLabel(category: ProductCategory): string {
    const labels: Record<ProductCategory, string> = {
      [ProductCategory.ANALGESICS]: 'Analgésicos',
      [ProductCategory.ANTIBIOTICS]: 'Antibióticos',
      [ProductCategory.ANTIHISTAMINES]: 'Antialérgicos',
      [ProductCategory.ANTIHYPERTENSIVES]: 'Anti-hipertensivos',
      [ProductCategory.CARDIOVASCULAR]: 'Cardiovasculares',
      [ProductCategory.DERMATOLOGICALS]: 'Dermatológicos',
      [ProductCategory.DIABETES]: 'Diabetes',
      [ProductCategory.DIGESTIVE]: 'Digestivo',
      [ProductCategory.SUPPLEMENTS]: 'Suplementos',
      [ProductCategory.VITAMINS]: 'Vitaminas',
      [ProductCategory.PEDIATRICS]: 'Pediátricos',
      [ProductCategory.WOMEN_HEALTH]: 'Saúde da Mulher',
      [ProductCategory.MEDICAL_DEVICES]: 'Dispositivos Médicos'
    };
    return labels[category] || category;
  }

  /**
   * 💰 Formata preço em centavos para reais
   */
  formatPrice(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}
