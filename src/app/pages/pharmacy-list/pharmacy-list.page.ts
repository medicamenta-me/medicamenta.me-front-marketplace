/**
 * 🏪 Pharmacy List Page
 * Página de listagem de farmácias do marketplace
 * 
 * Features:
 * - Listagem com paginação
 * - Filtros por localização, rating, delivery
 * - Busca textual
 * - Ordenação
 * - Cards responsivos
 * - Geolocalização (farmácias próximas)
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  PharmacyService, 
  NearbyPharmacy,
  DAY_OF_WEEK_LABELS,
  PharmacySearchParams,
  PharmacySearchResult,
  NearbySearchParams,
  NearbySearchResult
} from '../../services/pharmacy.service';
import { 
  Pharmacy, 
  PharmacyFilters, 
  PharmacyStatus, 
  VerificationStatus 
} from '../../models/pharmacy.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';

type SortOption = 'rating' | 'distance' | 'name' | 'reviews';

@Component({
  selector: 'app-pharmacy-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RatingStarsComponent
  ],
  template: `
    <div class="pharmacy-list-container">
      <!-- Header -->
      <header class="page-header">
        <h1>Farmácias</h1>
        <p class="subtitle">Encontre farmácias próximas a você</p>
      </header>

      <!-- Search & Filters -->
      <section class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch()"
            placeholder="Buscar farmácias..."
            class="search-input"
          />
          @if (searchQuery()) {
            <button class="clear-btn" (click)="clearSearch()">✕</button>
          }
        </div>

        <div class="filter-row">
          <!-- Location Filter -->
          <button 
            class="filter-btn"
            [class.active]="useLocation()"
            (click)="toggleLocation()"
          >
            📍 Próximas de mim
          </button>

          <!-- Delivery Filter -->
          <button 
            class="filter-btn"
            [class.active]="filters().hasDelivery"
            (click)="toggleDelivery()"
          >
            🚚 Com delivery
          </button>

          <!-- Pickup Filter -->
          <button 
            class="filter-btn"
            [class.active]="filters().hasPickup"
            (click)="togglePickup()"
          >
            🏪 Retirada na loja
          </button>

          <!-- Rating Filter -->
          <select 
            class="filter-select"
            [ngModel]="filters().rating"
            (ngModelChange)="onRatingFilter($event)"
          >
            <option [ngValue]="0">Qualquer avaliação</option>
            <option [ngValue]="4">⭐ 4+ estrelas</option>
            <option [ngValue]="4.5">⭐ 4.5+ estrelas</option>
          </select>

          <!-- Sort -->
          <select 
            class="filter-select"
            [(ngModel)]="sortBy"
            (ngModelChange)="onSort()"
          >
            <option value="rating">Melhor avaliados</option>
            <option value="distance" [disabled]="!useLocation()">Mais próximos</option>
            <option value="name">Nome A-Z</option>
            <option value="reviews">Mais avaliados</option>
          </select>
        </div>

        @if (activeFiltersCount() > 0) {
          <div class="active-filters">
            <span class="filters-label">Filtros ativos ({{ activeFiltersCount() }}):</span>
            <button class="clear-all-btn" (click)="clearFilters()">Limpar todos</button>
          </div>
        }
      </section>

      <!-- Loading State -->
      @if (loading()) {
        <app-loading-spinner />
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <span class="error-icon">⚠️</span>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadPharmacies()">Tentar novamente</button>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && pharmacies().length === 0) {
        <app-empty-state
          icon="🏪"
          title="Nenhuma farmácia encontrada"
          message="Tente ajustar os filtros ou buscar em outra região."
        />
      }

      <!-- Pharmacies Grid -->
      @if (!loading() && pharmacies().length > 0) {
        <div class="pharmacies-grid">
          @for (pharmacy of pharmacies(); track pharmacy.id) {
            <article 
              class="pharmacy-card"
              tabindex="0"
              role="button"
              (click)="viewPharmacy(pharmacy.id)"
              (keydown.enter)="viewPharmacy(pharmacy.id)"
              (keydown.space)="viewPharmacy(pharmacy.id)"
            >
              <!-- Banner/Logo -->
              <div class="pharmacy-header">
                @if (pharmacy.banner) {
                  <img 
                    [src]="pharmacy.banner" 
                    [alt]="pharmacy.name + ' banner'"
                    class="pharmacy-banner"
                  />
                } @else {
                  <div class="pharmacy-banner placeholder">
                    <span>🏪</span>
                  </div>
                }
                
                @if (pharmacy.logo) {
                  <img 
                    [src]="pharmacy.logo" 
                    [alt]="pharmacy.name + ' logo'"
                    class="pharmacy-logo"
                  />
                }

                @if (pharmacy.isFeatured) {
                  <span class="featured-badge">⭐ Destaque</span>
                }
              </div>

              <!-- Info -->
              <div class="pharmacy-info">
                <h3 class="pharmacy-name">{{ pharmacy.name }}</h3>
                
                <div class="pharmacy-location">
                  <span class="location-icon">📍</span>
                  {{ pharmacy.address.neighborhood }}, {{ pharmacy.address.city }}
                </div>

                <!-- Rating -->
                <div class="pharmacy-rating">
                  <app-rating-stars [rating]="pharmacy.rating" [count]="pharmacy.reviewCount" />
                  <span class="review-count">({{ pharmacy.reviewCount }} avaliações)</span>
                </div>

                <!-- Distance (if location enabled) -->
                @if (useLocation() && isNearbyPharmacy(pharmacy)) {
                  <div class="pharmacy-distance">
                    <span class="distance-icon">📏</span>
                    {{ formatDistance(pharmacy) }}
                  </div>
                }

                <!-- Status -->
                <div class="pharmacy-status">
                  @if (isOpenNow(pharmacy)) {
                    <span class="status-badge open">✓ Aberta agora</span>
                  } @else {
                    <span class="status-badge closed">
                      Fechada • {{ getNextOpenTime(pharmacy) }}
                    </span>
                  }
                </div>

                <!-- Delivery Info -->
                <div class="delivery-info">
                  @if (pharmacy.deliveryOptions.hasDelivery) {
                    <span class="delivery-badge">
                      🚚 {{ pharmacy.deliveryOptions.estimatedTime }}
                      @if (pharmacy.deliveryOptions.deliveryFee === 0) {
                        <span class="free">Grátis</span>
                      } @else if (pharmacy.deliveryOptions.freeDeliveryMinimum) {
                        <span class="free-above">
                          Grátis acima de {{ formatCurrency(pharmacy.deliveryOptions.freeDeliveryMinimum) }}
                        </span>
                      }
                    </span>
                  }
                  @if (pharmacy.deliveryOptions.hasPickup) {
                    <span class="pickup-badge">🏪 Retirada</span>
                  }
                </div>

                <!-- Payment Methods -->
                <div class="payment-methods">
                  @for (method of pharmacy.paymentMethods.slice(0, 4); track method) {
                    <span class="payment-icon" [title]="getPaymentMethodLabel(method)">
                      {{ getPaymentMethodIcon(method) }}
                    </span>
                  }
                  @if (pharmacy.paymentMethods.length > 4) {
                    <span class="more-methods">+{{ pharmacy.paymentMethods.length - 4 }}</span>
                  }
                </div>
              </div>
            </article>
          }
        </div>

        <!-- Pagination -->
        @if (hasMore()) {
          <div class="load-more">
            <button 
              class="load-more-btn"
              [disabled]="loadingMore()"
              (click)="loadMore()"
            >
              @if (loadingMore()) {
                Carregando...
              } @else {
                Carregar mais farmácias
              }
            </button>
          </div>
        }

        <!-- Results Summary -->
        <div class="results-summary">
          Exibindo {{ pharmacies().length }} farmácias
        </div>
      }
    </div>
  `,
  styles: [`
    .pharmacy-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .subtitle {
      color: #666;
      margin: 8px 0 0;
    }

    /* Search Section */
    .search-section {
      margin-bottom: 24px;
    }

    .search-box {
      position: relative;
      margin-bottom: 16px;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
    }

    .search-input {
      width: 100%;
      padding: 14px 48px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 16px;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #2196F3;
    }

    .clear-btn {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: #999;
    }

    .filter-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 10px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      border-color: #2196F3;
    }

    .filter-btn.active {
      background: #E3F2FD;
      border-color: #2196F3;
      color: #1976D2;
    }

    .filter-select {
      padding: 10px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      cursor: pointer;
    }

    .active-filters {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .filters-label {
      font-size: 14px;
      color: #666;
    }

    .clear-all-btn {
      background: none;
      border: none;
      color: #F44336;
      cursor: pointer;
      font-size: 14px;
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 48px 24px;
      background: #FFEBEE;
      border-radius: 12px;
    }

    .error-icon {
      font-size: 48px;
    }

    .error-state p {
      color: #C62828;
      margin: 16px 0;
    }

    .retry-btn {
      padding: 12px 24px;
      background: #F44336;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    /* Pharmacies Grid */
    .pharmacies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .pharmacy-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }

    .pharmacy-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .pharmacy-card:focus {
      outline: 2px solid #2196F3;
      outline-offset: 2px;
    }

    .pharmacy-header {
      position: relative;
      height: 120px;
    }

    .pharmacy-banner {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .pharmacy-banner.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
      font-size: 48px;
    }

    .pharmacy-logo {
      position: absolute;
      bottom: -24px;
      left: 16px;
      width: 56px;
      height: 56px;
      border-radius: 12px;
      border: 3px solid white;
      background: white;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .featured-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      background: #FFC107;
      color: #1a1a1a;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .pharmacy-info {
      padding: 32px 16px 16px;
    }

    .pharmacy-name {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 8px;
    }

    .pharmacy-location {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .pharmacy-rating {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .review-count {
      font-size: 13px;
      color: #888;
    }

    .pharmacy-distance {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #2196F3;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .pharmacy-status {
      margin-bottom: 12px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.open {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .status-badge.closed {
      background: #FFEBEE;
      color: #C62828;
    }

    .delivery-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .delivery-badge,
    .pickup-badge {
      font-size: 13px;
      color: #666;
    }

    .free {
      color: #4CAF50;
      font-weight: 600;
    }

    .free-above {
      color: #666;
      font-size: 12px;
    }

    .payment-methods {
      display: flex;
      gap: 6px;
    }

    .payment-icon {
      font-size: 18px;
    }

    .more-methods {
      font-size: 12px;
      color: #888;
      padding: 2px 8px;
      background: #f5f5f5;
      border-radius: 10px;
    }

    /* Load More */
    .load-more {
      text-align: center;
      margin-top: 32px;
    }

    .load-more-btn {
      padding: 14px 32px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .load-more-btn:hover:not(:disabled) {
      background: #1976D2;
    }

    .load-more-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .results-summary {
      text-align: center;
      margin-top: 16px;
      color: #888;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .pharmacy-list-container {
        padding: 16px;
      }

      .page-header h1 {
        font-size: 24px;
      }

      .filter-row {
        flex-direction: column;
      }

      .filter-btn,
      .filter-select {
        width: 100%;
      }

      .pharmacies-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PharmacyListPage implements OnInit {
  private readonly router = inject(Router);
  private readonly pharmacyService = inject(PharmacyService);

  // State
  readonly loading = this.pharmacyService.loading;
  readonly error = this.pharmacyService.error;
  readonly pharmacies = signal<(Pharmacy | NearbyPharmacy)[]>([]);
  readonly searchQuery = signal('');
  readonly filters = signal<PharmacyFilters>({});
  readonly sortBy = signal<SortOption>('rating');
  readonly useLocation = signal(false);
  readonly hasMore = signal(false);
  readonly loadingMore = signal(false);
  readonly totalResults = signal(0);
  
  // User location & pagination
  private userLatitude = 0;
  private userLongitude = 0;
  private currentPage = 1;

  // Computed
  readonly activeFiltersCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.hasDelivery) count++;
    if (f.hasPickup) count++;
    if (f.rating && f.rating > 0) count++;
    if (this.searchQuery()) count++;
    if (this.useLocation()) count++;
    return count;
  });

  ngOnInit(): void {
    this.loadPharmacies();
  }

  loadPharmacies(): void {
    this.currentPage = 1;
    
    if (this.useLocation() && this.userLatitude && this.userLongitude) {
      this.loadNearbyPharmacies();
    } else {
      this.loadAllPharmacies();
    }
  }

  private loadAllPharmacies(): void {
    // Usar API v2 via searchPharmaciesApi com fallback automático
    const params: PharmacySearchParams = {
      searchQuery: this.searchQuery() || undefined,
      hasDelivery: this.filters().hasDelivery,
      hasPickup: this.filters().hasPickup,
      minRating: this.filters().rating,
      city: this.filters().city,
      state: this.filters().state,
      sortBy: this.sortBy() === 'reviews' ? 'rating' : this.sortBy() as 'rating' | 'name',
      sortOrder: this.sortBy() === 'name' ? 'asc' : 'desc',
      page: this.currentPage,
      pageSize: 12
    };

    this.pharmacyService.searchPharmaciesApi(params).subscribe({
      next: (result: PharmacySearchResult) => {
        this.pharmacies.set(this.sortPharmacies(result.pharmacies));
        this.hasMore.set(result.page < result.totalPages);
        this.totalResults.set(result.total);
      },
      error: (err) => {
        console.error('Erro ao carregar farmácias:', err);
      }
    });
  }

  private loadNearbyPharmacies(): void {
    // Usar API v2 via getNearbyPharmaciesViaApi
    const params: NearbySearchParams = {
      latitude: this.userLatitude,
      longitude: this.userLongitude,
      radiusKm: 20,
      hasDelivery: this.filters().hasDelivery,
      minRating: this.filters().rating,
      limit: 50
    };

    this.pharmacyService.getNearbyPharmaciesViaApi(params).subscribe({
      next: (result: NearbySearchResult) => {
        // Aplicar filtros client-side não suportados pela API
        let filtered = result.pharmacies;
        if (this.filters().hasPickup) {
          filtered = filtered.filter(p => p.deliveryOptions.hasPickup);
        }
        if (this.searchQuery()) {
          const search = this.searchQuery().toLowerCase();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.address.city.toLowerCase().includes(search)
          );
        }
        this.pharmacies.set(this.sortPharmacies(filtered));
        this.hasMore.set(false);
        this.totalResults.set(filtered.length);
      },
      error: (err) => {
        console.error('Erro ao carregar farmácias próximas:', err);
        // Fallback para método antigo
        this.loadNearbyPharmaciesFallback();
      }
    });
  }

  /** Fallback para getNearbyPharmacies via Firestore */
  private loadNearbyPharmaciesFallback(): void {
    this.pharmacyService.getNearbyPharmacies(
      this.userLatitude,
      this.userLongitude,
      20
    ).subscribe({
      next: (pharmacies) => {
        let filtered = pharmacies;
        
        // Aplicar filtros client-side
        if (this.filters().hasDelivery) {
          filtered = filtered.filter(p => p.deliveryOptions.hasDelivery);
        }
        if (this.filters().hasPickup) {
          filtered = filtered.filter(p => p.deliveryOptions.hasPickup);
        }
        if (this.filters().rating) {
          filtered = filtered.filter(p => p.rating >= (this.filters().rating || 0));
        }
        if (this.searchQuery()) {
          const search = this.searchQuery().toLowerCase();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.address.city.toLowerCase().includes(search)
          );
        }

        this.pharmacies.set(this.sortPharmacies(filtered));
        this.hasMore.set(false);
        this.totalResults.set(filtered.length);
      }
    });
  }

  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) return;

    this.loadingMore.set(true);
    this.currentPage++;

    // Usar API v2 via searchPharmaciesApi
    const params: PharmacySearchParams = {
      searchQuery: this.searchQuery() || undefined,
      hasDelivery: this.filters().hasDelivery,
      hasPickup: this.filters().hasPickup,
      minRating: this.filters().rating,
      city: this.filters().city,
      state: this.filters().state,
      sortBy: this.sortBy() === 'reviews' ? 'rating' : this.sortBy() as 'rating' | 'name',
      sortOrder: this.sortBy() === 'name' ? 'asc' : 'desc',
      page: this.currentPage,
      pageSize: 12
    };

    this.pharmacyService.searchPharmaciesApi(params).subscribe({
      next: (result: PharmacySearchResult) => {
        const current = this.pharmacies();
        this.pharmacies.set(this.sortPharmacies([...current, ...result.pharmacies]));
        this.hasMore.set(result.page < result.totalPages);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
        this.currentPage--; // Reverter incremento em caso de erro
      }
    });
  }

  private sortPharmacies(pharmacies: (Pharmacy | NearbyPharmacy)[]): (Pharmacy | NearbyPharmacy)[] {
    const sorted = [...pharmacies];
    
    switch (this.sortBy()) {
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'distance':
        return sorted.sort((a, b) => {
          const distA = (a as NearbyPharmacy).distance || 999;
          const distB = (b as NearbyPharmacy).distance || 999;
          return distA - distB;
        });
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'reviews':
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      default:
        return sorted;
    }
  }

  onSearch(): void {
    this.loadPharmacies();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.loadPharmacies();
  }

  toggleLocation(): void {
    if (!this.useLocation()) {
      // Solicitar localização
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLatitude = position.coords.latitude;
            this.userLongitude = position.coords.longitude;
            this.useLocation.set(true);
            this.loadPharmacies();
          },
          (error) => {
            console.error('Erro ao obter localização:', error);
            alert('Não foi possível obter sua localização');
          }
        );
      } else {
        alert('Geolocalização não suportada');
      }
    } else {
      this.useLocation.set(false);
      this.loadPharmacies();
    }
  }

  toggleDelivery(): void {
    this.filters.update(f => ({
      ...f,
      hasDelivery: !f.hasDelivery
    }));
    this.loadPharmacies();
  }

  togglePickup(): void {
    this.filters.update(f => ({
      ...f,
      hasPickup: !f.hasPickup
    }));
    this.loadPharmacies();
  }

  onRatingFilter(rating: number): void {
    this.filters.update(f => ({ ...f, rating }));
    this.loadPharmacies();
  }

  onSort(): void {
    const pharmacies = this.pharmacies();
    this.pharmacies.set(this.sortPharmacies(pharmacies));
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filters.set({});
    this.useLocation.set(false);
    this.sortBy.set('rating');
    this.loadPharmacies();
  }

  viewPharmacy(pharmacyId: string): void {
    this.router.navigate(['/pharmacies', pharmacyId]);
  }

  isOpenNow(pharmacy: Pharmacy): boolean {
    return this.pharmacyService.isOpenNow(pharmacy);
  }

  getNextOpenTime(pharmacy: Pharmacy): string {
    return this.pharmacyService.getNextOpenTime(pharmacy);
  }

  isNearbyPharmacy(pharmacy: Pharmacy | NearbyPharmacy): pharmacy is NearbyPharmacy {
    return 'distance' in pharmacy;
  }

  formatDistance(pharmacy: Pharmacy | NearbyPharmacy): string {
    if (this.isNearbyPharmacy(pharmacy)) {
      return pharmacy.distance < 1
        ? `${Math.round(pharmacy.distance * 1000)}m`
        : `${pharmacy.distance.toFixed(1)}km`;
    }
    return '';
  }

  formatCurrency(valueInCents: number): string {
    return this.pharmacyService.formatCurrency(valueInCents);
  }

  getPaymentMethodLabel(method: string): string {
    return this.pharmacyService.getPaymentMethodLabel(method as any);
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'credit_card':
        return '💳';
      case 'debit_card':
        return '💳';
      case 'pix':
        return '⚡';
      case 'boleto':
        return '📄';
      case 'cash':
        return '💵';
      case 'insurance':
        return '🏥';
      default:
        return '💰';
    }
  }
}
