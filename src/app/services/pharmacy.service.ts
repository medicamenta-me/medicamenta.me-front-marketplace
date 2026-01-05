/**
 * 🏪 Pharmacy Service
 * Serviço para gerenciamento de farmácias do marketplace
 * 
 * Funcionalidades:
 * - Listagem com filtros
 * - Busca por localização
 * - Detalhes da farmácia
 * - Produtos da farmácia
 * - Avaliações
 * - Horário de funcionamento
 * 
 * API v2: Integração via IntegrationService (Sprint M2)
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  getDoc,
  DocumentSnapshot,
  QueryConstraint 
} from '@angular/fire/firestore';
import { Observable, from, of, BehaviorSubject, throwError, timer } from 'rxjs';
import { map, catchError, tap, retryWhen, delayWhen, take, switchMap } from 'rxjs/operators';
import { 
  Pharmacy, 
  PharmacyFilters, 
  PharmacyStatus, 
  VerificationStatus,
  BusinessHours,
  PaymentMethod
} from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { Review } from '../models/review.model';
import { IntegrationService } from '../core/services/integration.service';

// Labels para status
export const PHARMACY_STATUS_LABELS: Record<PharmacyStatus, string> = {
  [PharmacyStatus.ACTIVE]: 'Ativa',
  [PharmacyStatus.INACTIVE]: 'Inativa',
  [PharmacyStatus.SUSPENDED]: 'Suspensa',
  [PharmacyStatus.PENDING]: 'Pendente'
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'Pendente',
  [VerificationStatus.UNDER_REVIEW]: 'Em Análise',
  [VerificationStatus.APPROVED]: 'Aprovada',
  [VerificationStatus.REJECTED]: 'Rejeitada',
  [VerificationStatus.REQUIRES_CHANGES]: 'Requer Alterações'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.BOLETO]: 'Boleto',
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.INSURANCE]: 'Convênio'
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado'
};

export interface PharmacyListResult {
  pharmacies: Pharmacy[];
  total: number;
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
}

export interface NearbyPharmacy extends Pharmacy {
  distance: number; // em km
}

// ============================================================================
// API V2 INTERFACES - Sprint M2
// ============================================================================

/**
 * Parâmetros de busca de farmácias via API v2
 */
export interface PharmacySearchParams {
  city?: string;
  state?: string;
  status?: PharmacyStatus;
  verificationStatus?: VerificationStatus;
  hasDelivery?: boolean;
  hasPickup?: boolean;
  minRating?: number;
  paymentMethod?: PaymentMethod;
  isActive?: boolean;
  searchQuery?: string;
  sortBy?: 'rating' | 'distance' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Resultado de busca de farmácias via API v2
 */
export interface PharmacySearchResult {
  pharmacies: Pharmacy[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: PharmacyFacets;
}

/**
 * Facets para filtros dinâmicos
 */
export interface PharmacyFacets {
  cities: Array<{ name: string; count: number }>;
  states: Array<{ name: string; count: number }>;
  ratingRanges: Array<{ min: number; max: number; count: number }>;
  paymentMethods: Array<{ method: PaymentMethod; count: number }>;
}

/**
 * Parâmetros de busca por proximidade
 */
export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
  hasDelivery?: boolean;
  minRating?: number;
}

/**
 * Resultado de busca por proximidade
 */
export interface NearbySearchResult {
  pharmacies: NearbyPharmacy[];
  total: number;
  searchRadius: number;
  center: { latitude: number; longitude: number };
}

/**
 * Resposta da API v2 (wrapper)
 */
interface ApiV2Response<T> {
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private readonly firestore = inject(Firestore);
  private readonly integrationService = inject(IntegrationService);
  private readonly pageSize = 10;
  
  // Cache
  private pharmacyCache = new Map<string, Pharmacy>();
  private cacheExpiry = new Map<string, number>();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutos
  
  // State
  private lastDocSubject = new BehaviorSubject<DocumentSnapshot | null>(null);
  
  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentPharmacy = signal<Pharmacy | null>(null);
  readonly pharmacies = signal<Pharmacy[]>([]);
  readonly totalPharmacies = signal(0);
  
  // Computed
  readonly hasPharmacies = computed(() => this.pharmacies().length > 0);

  /**
   * Lista farmácias com filtros e paginação
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getPharmacies(
    filters: PharmacyFilters = {},
    pageSize: number = this.pageSize,
    lastDoc: DocumentSnapshot | null = null
  ): Observable<PharmacyListResult> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pharmaciesRef = collection(this.firestore, 'pharmacies');
      const constraints: QueryConstraint[] = [];

      // Filtros
      if (filters.city) {
        constraints.push(where('address.city', '==', filters.city));
      }
      if (filters.state) {
        constraints.push(where('address.state', '==', filters.state));
      }
      if (filters.hasDelivery !== undefined) {
        constraints.push(where('deliveryOptions.hasDelivery', '==', filters.hasDelivery));
      }
      if (filters.hasPickup !== undefined) {
        constraints.push(where('deliveryOptions.hasPickup', '==', filters.hasPickup));
      }
      if (filters.rating !== undefined && filters.rating > 0) {
        constraints.push(where('rating', '>=', filters.rating));
      }
      if (filters.isActive !== undefined) {
        constraints.push(where('isActive', '==', filters.isActive));
      }
      if (filters.verificationStatus) {
        constraints.push(where('verificationStatus', '==', filters.verificationStatus));
      }

      // Ordenação e paginação
      constraints.push(orderBy('isFeatured', 'desc'));
      constraints.push(orderBy('rating', 'desc'));
      constraints.push(limit(pageSize + 1)); // +1 para verificar se há mais

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(pharmaciesRef, ...constraints);

      return from(getDocs(q)).pipe(
        map(snapshot => {
          const docs = snapshot.docs;
          const hasMore = docs.length > pageSize;
          const pharmacyDocs = hasMore ? docs.slice(0, -1) : docs;

          const pharmacies = pharmacyDocs.map(doc => this.mapDocToPharmacy(doc));

          // Filtro de busca textual (client-side)
          let filteredPharmacies = pharmacies;
          if (filters.searchQuery) {
            const search = filters.searchQuery.toLowerCase();
            filteredPharmacies = pharmacies.filter(p =>
              p.name.toLowerCase().includes(search) ||
              p.address.city.toLowerCase().includes(search) ||
              p.address.neighborhood.toLowerCase().includes(search)
            );
          }

          // Cache
          filteredPharmacies.forEach(p => this.setCache(p.id, p));

          const result: PharmacyListResult = {
            pharmacies: filteredPharmacies,
            total: filteredPharmacies.length,
            hasMore,
            lastDoc: pharmacyDocs.length > 0 ? pharmacyDocs[pharmacyDocs.length - 1] : null
          };

          this.pharmacies.set(filteredPharmacies);
          this.totalPharmacies.set(filteredPharmacies.length);
          this.lastDocSubject.next(result.lastDoc);
          this.loading.set(false);

          return result;
        }),
        catchError(err => {
          console.error('Erro ao buscar farmácias:', err);
          this.error.set('Erro ao carregar farmácias');
          this.loading.set(false);
          return of({
            pharmacies: [],
            total: 0,
            hasMore: false,
            lastDoc: null
          });
        })
      );
    } catch (err) {
      this.loading.set(false);
      this.error.set('Erro ao configurar busca');
      return of({
        pharmacies: [],
        total: 0,
        hasMore: false,
        lastDoc: null
      });
    }
  }

  /**
   * Obtém detalhes de uma farmácia
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getPharmacyById(pharmacyId: string): Observable<Pharmacy | null> {
    if (!pharmacyId) {
      return of(null);
    }

    // Verificar cache
    const cached = this.getFromCache(pharmacyId);
    if (cached) {
      this.currentPharmacy.set(cached);
      return of(cached);
    }

    this.loading.set(true);
    this.error.set(null);

    const pharmacyRef = doc(this.firestore, 'pharmacies', pharmacyId);

    return from(getDoc(pharmacyRef)).pipe(
      map(docSnap => {
        if (!docSnap.exists()) {
          this.error.set('Farmácia não encontrada');
          this.loading.set(false);
          return null;
        }

        const pharmacy = this.mapDocToPharmacy(docSnap);
        this.setCache(pharmacyId, pharmacy);
        this.currentPharmacy.set(pharmacy);
        this.loading.set(false);
        return pharmacy;
      }),
      catchError(err => {
        console.error('Erro ao buscar farmácia:', err);
        this.error.set('Erro ao carregar detalhes da farmácia');
        this.loading.set(false);
        return of(null);
      })
    );
  }

  /**
   * Busca farmácias por proximidade (mock - usaria API de geolocalização real)
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getNearbyPharmacies(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Observable<NearbyPharmacy[]> {
    this.loading.set(true);
    this.error.set(null);

    // Validação de coordenadas
    if (!this.isValidCoordinate(latitude, longitude)) {
      this.error.set('Coordenadas inválidas');
      this.loading.set(false);
      return of([]);
    }

    const pharmaciesRef = collection(this.firestore, 'pharmacies');
    const q = query(
      pharmaciesRef,
      where('isActive', '==', true),
      where('verificationStatus', '==', VerificationStatus.APPROVED),
      orderBy('rating', 'desc'),
      limit(50)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const pharmacies = snapshot.docs.map(doc => this.mapDocToPharmacy(doc));

        // Calcular distância e filtrar por raio
        const nearbyPharmacies: NearbyPharmacy[] = pharmacies
          .map(p => ({
            ...p,
            distance: this.calculateDistance(
              latitude,
              longitude,
              p.address.latitude || 0,
              p.address.longitude || 0
            )
          }))
          .filter(p => p.distance <= radiusKm)
          .sort((a, b) => a.distance - b.distance);

        this.loading.set(false);
        return nearbyPharmacies;
      }),
      catchError(err => {
        console.error('Erro ao buscar farmácias próximas:', err);
        this.error.set('Erro ao buscar farmácias próximas');
        this.loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Obtém produtos de uma farmácia
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getPharmacyProducts(
    pharmacyId: string,
    pageSize: number = 20
  ): Observable<Product[]> {
    if (!pharmacyId) {
      return of([]);
    }

    const productsRef = collection(this.firestore, 'products');
    const q = query(
      productsRef,
      where('pharmacyId', '==', pharmacyId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
      }),
      catchError(err => {
        console.error('Erro ao buscar produtos:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtém avaliações de uma farmácia
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getPharmacyReviews(
    pharmacyId: string,
    pageSize: number = 10
  ): Observable<Review[]> {
    if (!pharmacyId) {
      return of([]);
    }

    const reviewsRef = collection(this.firestore, 'reviews');
    const q = query(
      reviewsRef,
      where('pharmacyId', '==', pharmacyId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));
      }),
      catchError(err => {
        console.error('Erro ao buscar avaliações:', err);
        return of([]);
      })
    );
  }

  /**
   * Verifica se a farmácia está aberta agora
   */
  isOpenNow(pharmacy: Pharmacy): boolean {
    if (!pharmacy || !pharmacy.businessHours) {
      return false;
    }

    const now = new Date();
    const dayOfWeek = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const currentTime = this.formatTime(now.getHours(), now.getMinutes());

    const todayHours = pharmacy.businessHours.find(h => h.dayOfWeek === dayOfWeek);

    if (!todayHours || todayHours.isClosed) {
      return false;
    }

    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  /**
   * Obtém próximo horário de abertura
   */
  getNextOpenTime(pharmacy: Pharmacy): string {
    if (!pharmacy || !pharmacy.businessHours) {
      return '';
    }

    const now = new Date();
    const dayOfWeek = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const currentTime = this.formatTime(now.getHours(), now.getMinutes());

    // Verificar se abre ainda hoje
    const todayHours = pharmacy.businessHours.find(h => h.dayOfWeek === dayOfWeek);
    if (todayHours && !todayHours.isClosed && currentTime < todayHours.openTime) {
      return `Hoje às ${todayHours.openTime}`;
    }

    // Procurar próximo dia aberto
    for (let i = 1; i <= 7; i++) {
      const nextDay = ((dayOfWeek + i) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const nextHours = pharmacy.businessHours.find(h => h.dayOfWeek === nextDay);
      
      if (nextHours && !nextHours.isClosed) {
        const dayName = DAY_OF_WEEK_LABELS[nextDay];
        return `${dayName} às ${nextHours.openTime}`;
      }
    }

    return 'Fechada';
  }

  /**
   * Formata horário de funcionamento para exibição
   */
  formatBusinessHours(hours: BusinessHours[]): string[] {
    if (!hours || hours.length === 0) {
      return ['Horário não informado'];
    }

    return hours.map(h => {
      const dayName = DAY_OF_WEEK_LABELS[h.dayOfWeek];
      if (h.isClosed) {
        return `${dayName}: Fechado`;
      }
      return `${dayName}: ${h.openTime} - ${h.closeTime}`;
    });
  }

  /**
   * Formata endereço completo
   */
  formatAddress(pharmacy: Pharmacy): string {
    if (!pharmacy || !pharmacy.address) {
      return '';
    }

    const { street, number, complement, neighborhood, city, state, zipCode } = pharmacy.address;
    let address = `${street}, ${number}`;
    if (complement) {
      address += ` - ${complement}`;
    }
    address += ` - ${neighborhood}, ${city}/${state}`;
    if (zipCode) {
      address += ` - CEP: ${zipCode}`;
    }
    return address;
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(valueInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valueInCents / 100);
  }

  /**
   * Obtém label do status
   */
  getStatusLabel(status: PharmacyStatus): string {
    return PHARMACY_STATUS_LABELS[status] || status;
  }

  /**
   * Obtém label do status de verificação
   */
  getVerificationStatusLabel(status: VerificationStatus): string {
    return VERIFICATION_STATUS_LABELS[status] || status;
  }

  /**
   * Obtém label do método de pagamento
   */
  getPaymentMethodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method] || method;
  }

  /**
   * Obtém cor do badge de status
   */
  getStatusClass(status: PharmacyStatus): string {
    switch (status) {
      case PharmacyStatus.ACTIVE:
        return 'active';
      case PharmacyStatus.INACTIVE:
        return 'inactive';
      case PharmacyStatus.SUSPENDED:
        return 'suspended';
      case PharmacyStatus.PENDING:
        return 'pending';
      default:
        return '';
    }
  }

  /**
   * Obtém cor do badge de verificação
   */
  getVerificationStatusClass(status: VerificationStatus): string {
    switch (status) {
      case VerificationStatus.APPROVED:
        return 'approved';
      case VerificationStatus.PENDING:
        return 'pending';
      case VerificationStatus.UNDER_REVIEW:
        return 'review';
      case VerificationStatus.REJECTED:
        return 'rejected';
      case VerificationStatus.REQUIRES_CHANGES:
        return 'changes';
      default:
        return '';
    }
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.pharmacyCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Limpa o estado
   */
  clearState(): void {
    this.currentPharmacy.set(null);
    this.pharmacies.set([]);
    this.totalPharmacies.set(0);
    this.error.set(null);
    this.loading.set(false);
    this.lastDocSubject.next(null);
  }

  // ============================================================================
  // API V2 METHODS - Sprint M2
  // ============================================================================

  /**
   * 🔍 Busca farmácias via API v2 com filtros avançados
   * @param params Parâmetros de busca
   * @returns Observable<PharmacySearchResult>
   */
  searchPharmaciesApi(params: PharmacySearchParams = {}): Observable<PharmacySearchResult> {
    this.loading.set(true);
    this.error.set(null);

    const queryParams = this.buildPharmacyQueryParams(params);

    return this.integrationService.get<ApiV2Response<Pharmacy[]>>('/api/v2/pharmacies', {
      params: queryParams
    }).pipe(
      map(response => {
        const pharmacies = response.data || [];
        const pagination = response.pagination;

        // Cache results
        pharmacies.forEach(p => this.setCache(p.id, p));

        const result: PharmacySearchResult = {
          pharmacies,
          total: pagination?.total || pharmacies.length,
          page: pagination?.page || params.page || 1,
          pageSize: pagination?.limit || params.pageSize || this.pageSize,
          totalPages: pagination?.totalPages || Math.ceil((pagination?.total || pharmacies.length) / (params.pageSize || this.pageSize))
        };

        // Update signals
        this.pharmacies.set(pharmacies);
        this.totalPharmacies.set(result.total);
        this.loading.set(false);

        return result;
      }),
      catchError(err => {
        console.error('[PharmacyService] searchPharmaciesApi error:', err);
        this.error.set('Erro ao buscar farmácias via API');
        this.loading.set(false);
        // Fallback para Firestore
        return this.getPharmacies(params as PharmacyFilters).pipe(
          map(result => ({
            pharmacies: result.pharmacies,
            total: result.total,
            page: 1,
            pageSize: this.pageSize,
            totalPages: Math.ceil(result.total / this.pageSize)
          }))
        );
      })
    );
  }

  /**
   * 🏥 Obtém farmácia por ID via API v2
   * @param pharmacyId ID da farmácia
   * @returns Observable<Pharmacy | null>
   */
  getPharmacyByIdViaApi(pharmacyId: string): Observable<Pharmacy | null> {
    if (!pharmacyId) {
      return of(null);
    }

    // Check cache first
    const cached = this.getFromCache(pharmacyId);
    if (cached) {
      this.currentPharmacy.set(cached);
      return of(cached);
    }

    this.loading.set(true);
    this.error.set(null);

    return this.executeWithRetryApi<Pharmacy>(`/api/v2/pharmacies/${pharmacyId}`).pipe(
      tap(pharmacy => {
        if (pharmacy) {
          this.setCache(pharmacyId, pharmacy);
          this.currentPharmacy.set(pharmacy);
        }
        this.loading.set(false);
      }),
      catchError(err => {
        console.error('[PharmacyService] getPharmacyByIdViaApi error:', err);
        this.error.set('Erro ao buscar farmácia');
        this.loading.set(false);
        // Fallback
        return this.getPharmacyById(pharmacyId);
      })
    );
  }

  /**
   * 📍 Busca farmácias próximas via API v2
   * @param params Parâmetros de localização
   * @returns Observable<NearbySearchResult>
   */
  getNearbyPharmaciesViaApi(params: NearbySearchParams): Observable<NearbySearchResult> {
    if (!this.isValidCoordinate(params.latitude, params.longitude)) {
      this.error.set('Coordenadas inválidas');
      return of({
        pharmacies: [],
        total: 0,
        searchRadius: params.radiusKm || 10,
        center: { latitude: params.latitude, longitude: params.longitude }
      });
    }

    this.loading.set(true);
    this.error.set(null);

    const queryParams: Record<string, string | number | boolean> = {
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radiusKm || 10,
      limit: params.limit || 20
    };

    if (params.hasDelivery !== undefined) {
      queryParams['hasDelivery'] = params.hasDelivery;
    }
    if (params.minRating !== undefined) {
      queryParams['minRating'] = params.minRating;
    }

    return this.integrationService.get<{ pharmacies: NearbyPharmacy[] }>('/api/v2/pharmacies/nearby', {
      params: queryParams
    }).pipe(
      map(response => {
        const pharmacies = response.pharmacies || [];
        
        // Cache results
        pharmacies.forEach(p => this.setCache(p.id, p));

        this.loading.set(false);

        return {
          pharmacies,
          total: pharmacies.length,
          searchRadius: params.radiusKm || 10,
          center: { latitude: params.latitude, longitude: params.longitude }
        };
      }),
      catchError(err => {
        console.error('[PharmacyService] getNearbyPharmaciesViaApi error:', err);
        this.error.set('Erro ao buscar farmácias próximas');
        this.loading.set(false);
        // Fallback
        return this.getNearbyPharmacies(params.latitude, params.longitude, params.radiusKm).pipe(
          map(pharmacies => ({
            pharmacies,
            total: pharmacies.length,
            searchRadius: params.radiusKm || 10,
            center: { latitude: params.latitude, longitude: params.longitude }
          }))
        );
      })
    );
  }

  /**
   * 📦 Obtém produtos de uma farmácia via API v2
   * @param pharmacyId ID da farmácia
   * @param page Página atual
   * @param pageSize Tamanho da página
   * @returns Observable<{ products: Product[]; total: number }>
   */
  getPharmacyProductsViaApi(
    pharmacyId: string,
    page: number = 1,
    pageSize: number = 20
  ): Observable<{ products: Product[]; total: number }> {
    if (!pharmacyId) {
      return of({ products: [], total: 0 });
    }

    return this.integrationService.get<ApiV2Response<Product[]>>(
      `/api/v2/pharmacies/${pharmacyId}/products`,
      { params: { page, limit: pageSize } }
    ).pipe(
      map(response => ({
        products: response.data || [],
        total: response.pagination?.total || 0
      })),
      catchError(err => {
        console.error('[PharmacyService] getPharmacyProductsViaApi error:', err);
        // Fallback
        return this.getPharmacyProducts(pharmacyId, pageSize).pipe(
          map(products => ({ products, total: products.length }))
        );
      })
    );
  }

  /**
   * 🔄 Busca farmácias com texto livre via API v2
   * @param searchTerm Termo de busca
   * @param pageSize Tamanho da página
   * @returns Observable<PharmacySearchResult>
   */
  searchPharmaciesByText(searchTerm: string, pageSize: number = 20): Observable<PharmacySearchResult> {
    return this.searchPharmaciesApi({
      searchQuery: searchTerm,
      pageSize,
      isActive: true,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }

  /**
   * 🌟 Obtém farmácias em destaque via API v2
   * @param limit Número máximo de resultados
   * @returns Observable<Pharmacy[]>
   */
  getFeaturedPharmaciesViaApi(limit: number = 10): Observable<Pharmacy[]> {
    return this.searchPharmaciesApi({
      isActive: true,
      sortBy: 'rating',
      sortOrder: 'desc',
      pageSize: limit
    }).pipe(
      map(result => result.pharmacies.filter(p => p.rating && p.rating >= 4.0))
    );
  }

  /**
   * 🏙️ Obtém farmácias por cidade via API v2
   * @param city Nome da cidade
   * @param pageSize Tamanho da página
   * @returns Observable<PharmacySearchResult>
   */
  getPharmaciesByCityViaApi(city: string, pageSize: number = 20): Observable<PharmacySearchResult> {
    return this.searchPharmaciesApi({
      city,
      isActive: true,
      pageSize,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }

  /**
   * 🚚 Obtém farmácias com delivery via API v2
   * @param city Cidade opcional para filtrar
   * @returns Observable<Pharmacy[]>
   */
  getPharmaciesWithDeliveryViaApi(city?: string): Observable<Pharmacy[]> {
    const params: PharmacySearchParams = {
      hasDelivery: true,
      isActive: true,
      sortBy: 'rating',
      sortOrder: 'desc'
    };
    
    if (city) {
      params.city = city;
    }

    return this.searchPharmaciesApi(params).pipe(
      map(result => result.pharmacies)
    );
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Constrói parâmetros de query para API v2
   */
  private buildPharmacyQueryParams(params: PharmacySearchParams): Record<string, string | number | boolean> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params.city) queryParams['city'] = params.city;
    if (params.state) queryParams['state'] = params.state;
    if (params.status) queryParams['status'] = params.status;
    if (params.verificationStatus) queryParams['verificationStatus'] = params.verificationStatus;
    if (params.hasDelivery !== undefined) queryParams['hasDelivery'] = params.hasDelivery;
    if (params.hasPickup !== undefined) queryParams['hasPickup'] = params.hasPickup;
    if (params.minRating !== undefined) queryParams['minRating'] = params.minRating;
    if (params.paymentMethod) queryParams['paymentMethod'] = params.paymentMethod;
    if (params.isActive !== undefined) queryParams['isActive'] = params.isActive;
    if (params.searchQuery) queryParams['q'] = params.searchQuery;
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;
    if (params.page) queryParams['page'] = params.page;
    if (params.pageSize) queryParams['limit'] = params.pageSize;

    return queryParams;
  }

  /**
   * Executa requisição com retry exponencial
   */
  private executeWithRetryApi<T>(endpoint: string, maxRetries: number = 3): Observable<T> {
    let retryCount = 0;

    return this.integrationService.get<ApiV2Response<T> | T>(endpoint).pipe(
      map(response => {
        // Handle wrapped response
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ApiV2Response<T>).data as T;
        }
        return response as T;
      }),
      retryWhen(errors => errors.pipe(
        delayWhen(() => {
          retryCount++;
          if (retryCount > maxRetries) {
            return throwError(() => new Error('Max retries exceeded'));
          }
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 4000);
          return timer(delay);
        }),
        take(maxRetries)
      ))
    );
  }

  private mapDocToPharmacy(doc: DocumentSnapshot): Pharmacy {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.['createdAt']?.toDate?.() || new Date(),
      updatedAt: data?.['updatedAt']?.toDate?.() || new Date()
    } as Pharmacy;
  }

  private setCache(key: string, pharmacy: Pharmacy): void {
    this.pharmacyCache.set(key, pharmacy);
    this.cacheExpiry.set(key, Date.now() + this.cacheDuration);
  }

  private getFromCache(key: string): Pharmacy | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.pharmacyCache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.pharmacyCache.get(key) || null;
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Fórmula de Haversine
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Arredonda para 1 casa decimal
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private formatTime(hours: number, minutes: number): string {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
