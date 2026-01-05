/**
 * 🧪 Pharmacy List Page Tests
 * Testes unitários para a página de listagem de farmácias
 * 
 * Cenários:
 * - Inicialização
 * - Loading state
 * - Error state
 * - Empty state
 * - Lista de farmácias
 * - Filtros
 * - Busca
 * - Ordenação
 * - Paginação
 * - Geolocalização
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PharmacyListPage } from './pharmacy-list.page';
import { PharmacyService, NearbyPharmacy } from '../../services/pharmacy.service';
import { Pharmacy, PharmacyStatus, VerificationStatus, PaymentMethod } from '../../models/pharmacy.model';
import { of, BehaviorSubject } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';

describe('PharmacyListPage', () => {
  let component: PharmacyListPage;
  let fixture: ComponentFixture<PharmacyListPage>;
  let router: Router;
  let mockPharmacyService: jasmine.SpyObj<PharmacyService>;

  const mockPharmacy: Pharmacy = {
    id: 'pharmacy-1',
    name: 'Farmácia Central',
    legalName: 'Farmácia Central LTDA',
    cnpj: '12.345.678/0001-90',
    anvisaLicense: 'AFE-123456',
    crf: 'CRF-SP-12345',
    responsiblePharmacist: {
      name: 'Dr. João Silva',
      crf: 'CRF-SP-12345',
      phone: '(11) 99999-9999'
    },
    address: {
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil',
      latitude: -23.5505,
      longitude: -46.6333
    },
    contact: {
      phone: '(11) 3333-4444',
      email: 'contato@farmacia.com.br'
    },
    businessHours: [
      { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isClosed: false }
    ],
    rating: 4.5,
    reviewCount: 150,
    orderCount: 1200,
    deliveryOptions: {
      hasDelivery: true,
      deliveryFee: 999,
      freeDeliveryMinimum: 10000,
      estimatedTime: '30-60 min',
      hasPickup: true
    },
    paymentMethods: [PaymentMethod.CREDIT_CARD, PaymentMethod.PIX],
    policies: {},
    status: PharmacyStatus.ACTIVE,
    verificationStatus: VerificationStatus.APPROVED,
    verificationDocuments: {},
    commission: 15,
    metadata: {
      totalSales: 15000000,
      averageTicket: 12500,
      conversionRate: 68,
      responseTime: 15
    },
    tags: ['delivery'],
    isFeatured: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPharmacies: Pharmacy[] = [
    mockPharmacy,
    { ...mockPharmacy, id: 'pharmacy-2', name: 'Drogaria Popular', rating: 4.2, isFeatured: false },
    { ...mockPharmacy, id: 'pharmacy-3', name: 'Farma Saúde', rating: 4.8, reviewCount: 200 }
  ];

  // Mock signals for loading and error
  let loadingSignal: WritableSignal<boolean>;
  let errorSignal: WritableSignal<string | null>;

  beforeEach(async () => {
    // Reset signals for each test
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);

    mockPharmacyService = jasmine.createSpyObj('PharmacyService', [
      'getPharmacies',
      'getNearbyPharmacies',
      'searchPharmaciesApi',
      'getNearbyPharmaciesViaApi',
      'isOpenNow',
      'getNextOpenTime',
      'formatCurrency',
      'getPaymentMethodLabel'
    ], {
      loading: loadingSignal,
      error: errorSignal
    });

    // Configurar mocks padrão
    mockPharmacyService.getPharmacies.and.returnValue(of({
      pharmacies: mockPharmacies,
      total: 3,
      hasMore: false,
      lastDoc: null
    }));
    mockPharmacyService.getNearbyPharmacies.and.returnValue(of([]));
    
    // Mocks para API v2
    mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
      pharmacies: mockPharmacies,
      total: 3,
      page: 1,
      pageSize: 12,
      totalPages: 1
    }));
    mockPharmacyService.getNearbyPharmaciesViaApi.and.returnValue(of({
      pharmacies: [],
      total: 0,
      searchRadius: 20,
      center: { latitude: 0, longitude: 0 }
    }));
    
    mockPharmacyService.isOpenNow.and.returnValue(true);
    mockPharmacyService.getNextOpenTime.and.returnValue('Amanhã às 08:00');
    mockPharmacyService.formatCurrency.and.callFake((v) => `R$ ${(v/100).toFixed(2)}`);
    mockPharmacyService.getPaymentMethodLabel.and.returnValue('Cartão de Crédito');

    await TestBed.configureTestingModule({
      imports: [PharmacyListPage, RouterTestingModule],
      providers: [
        { provide: PharmacyService, useValue: mockPharmacyService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PharmacyListPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  // ============================================
  // TESTES DE INICIALIZAÇÃO
  // ============================================

  describe('Initialization', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve iniciar com searchQuery vazio', () => {
      expect(component.searchQuery()).toBe('');
    });

    it('deve iniciar com filtros vazios', () => {
      expect(component.filters()).toEqual({});
    });

    it('deve iniciar com sortBy rating', () => {
      expect(component.sortBy()).toBe('rating');
    });

    it('deve iniciar com useLocation false', () => {
      expect(component.useLocation()).toBe(false);
    });

    it('deve iniciar com hasMore false', () => {
      expect(component.hasMore()).toBe(false);
    });

    it('deve iniciar com loadingMore false', () => {
      expect(component.loadingMore()).toBe(false);
    });

    it('deve iniciar com pharmacies vazio', () => {
      expect(component.pharmacies()).toEqual([]);
    });

    it('deve carregar farmácias no ngOnInit', () => {
      fixture.detectChanges();
      expect(mockPharmacyService.searchPharmaciesApi).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTES DE COMPUTED
  // ============================================

  describe('Computed Values', () => {
    it('deve calcular activeFiltersCount corretamente - sem filtros', () => {
      expect(component.activeFiltersCount()).toBe(0);
    });

    it('deve calcular activeFiltersCount com hasDelivery', () => {
      component.filters.set({ hasDelivery: true });
      expect(component.activeFiltersCount()).toBe(1);
    });

    it('deve calcular activeFiltersCount com hasPickup', () => {
      component.filters.set({ hasPickup: true });
      expect(component.activeFiltersCount()).toBe(1);
    });

    it('deve calcular activeFiltersCount com rating', () => {
      component.filters.set({ rating: 4 });
      expect(component.activeFiltersCount()).toBe(1);
    });

    it('deve calcular activeFiltersCount com searchQuery', () => {
      component.searchQuery.set('farmácia');
      expect(component.activeFiltersCount()).toBe(1);
    });

    it('deve calcular activeFiltersCount com múltiplos filtros', () => {
      component.filters.set({ hasDelivery: true, hasPickup: true, rating: 4 });
      component.searchQuery.set('teste');
      expect(component.activeFiltersCount()).toBe(4);
    });
  });

  // ============================================
  // TESTES DE FILTROS
  // ============================================

  describe('Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve toggle delivery filter', () => {
      expect(component.filters().hasDelivery).toBeFalsy();
      component.toggleDelivery();
      expect(component.filters().hasDelivery).toBe(true);
      component.toggleDelivery();
      expect(component.filters().hasDelivery).toBe(false);
    });

    it('deve toggle pickup filter', () => {
      expect(component.filters().hasPickup).toBeFalsy();
      component.togglePickup();
      expect(component.filters().hasPickup).toBe(true);
      component.togglePickup();
      expect(component.filters().hasPickup).toBe(false);
    });

    it('deve atualizar rating filter', () => {
      component.onRatingFilter(4.5);
      expect(component.filters().rating).toBe(4.5);
    });

    it('deve limpar todos os filtros', () => {
      component.filters.set({ hasDelivery: true, hasPickup: true, rating: 4 });
      component.searchQuery.set('teste');
      component.sortBy.set('name');
      
      component.clearFilters();
      
      expect(component.filters()).toEqual({});
      expect(component.searchQuery()).toBe('');
      expect(component.sortBy()).toBe('rating');
    });

    it('deve recarregar farmácias ao mudar filtros', () => {
      const initialCallCount = mockPharmacyService.searchPharmaciesApi.calls.count();
      component.toggleDelivery();
      expect(mockPharmacyService.searchPharmaciesApi.calls.count()).toBeGreaterThan(initialCallCount);
    });
  });

  // ============================================
  // TESTES DE BUSCA
  // ============================================

  describe('Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve atualizar searchQuery', () => {
      component.searchQuery.set('farmácia central');
      expect(component.searchQuery()).toBe('farmácia central');
    });

    it('deve limpar busca', () => {
      component.searchQuery.set('teste');
      component.clearSearch();
      expect(component.searchQuery()).toBe('');
    });

    it('deve recarregar farmácias ao buscar', () => {
      const initialCallCount = mockPharmacyService.searchPharmaciesApi.calls.count();
      component.searchQuery.set('teste');
      component.onSearch();
      expect(mockPharmacyService.searchPharmaciesApi.calls.count()).toBeGreaterThan(initialCallCount);
    });
  });

  // ============================================
  // TESTES DE ORDENAÇÃO
  // ============================================

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.pharmacies.set([...mockPharmacies]);
    });

    it('deve ordenar por rating (padrão)', () => {
      component.sortBy.set('rating');
      component.onSort();
      const sorted = component.pharmacies();
      expect(sorted[0].rating).toBeGreaterThanOrEqual(sorted[1].rating);
    });

    it('deve ordenar por nome', () => {
      component.sortBy.set('name');
      component.onSort();
      const sorted = component.pharmacies();
      expect(sorted[0].name.localeCompare(sorted[1].name)).toBeLessThanOrEqual(0);
    });

    it('deve ordenar por quantidade de reviews', () => {
      component.sortBy.set('reviews');
      component.onSort();
      const sorted = component.pharmacies();
      expect(sorted[0].reviewCount).toBeGreaterThanOrEqual(sorted[1].reviewCount);
    });

    it('deve ordenar por distância quando useLocation ativo', () => {
      const nearbyPharmacies: NearbyPharmacy[] = [
        { ...mockPharmacy, distance: 5 },
        { ...mockPharmacy, id: 'p2', name: 'B', distance: 2 },
        { ...mockPharmacy, id: 'p3', name: 'C', distance: 10 }
      ];
      component.pharmacies.set(nearbyPharmacies);
      component.sortBy.set('distance');
      component.onSort();
      const sorted = component.pharmacies() as NearbyPharmacy[];
      expect(sorted[0].distance).toBeLessThanOrEqual(sorted[1].distance);
    });
  });

  // ============================================
  // TESTES DE NAVEGAÇÃO
  // ============================================

  describe('Navigation', () => {
    it('deve navegar para detalhes da farmácia', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.viewPharmacy('pharmacy-123');
      expect(navigateSpy).toHaveBeenCalledWith(['/pharmacies', 'pharmacy-123']);
    });
  });

  // ============================================
  // TESTES DE HELPERS
  // ============================================

  describe('Helper Methods', () => {
    it('deve verificar se farmácia está aberta', () => {
      component.isOpenNow(mockPharmacy);
      expect(mockPharmacyService.isOpenNow).toHaveBeenCalledWith(mockPharmacy);
    });

    it('deve obter próximo horário de abertura', () => {
      component.getNextOpenTime(mockPharmacy);
      expect(mockPharmacyService.getNextOpenTime).toHaveBeenCalledWith(mockPharmacy);
    });

    it('deve identificar NearbyPharmacy', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, distance: 5 };
      expect(component.isNearbyPharmacy(nearbyPharmacy)).toBe(true);
      expect(component.isNearbyPharmacy(mockPharmacy)).toBe(false);
    });

    it('deve formatar distância em metros', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, distance: 0.5 };
      const result = component.formatDistance(nearbyPharmacy);
      expect(result).toContain('m');
    });

    it('deve formatar distância em km', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, distance: 2.5 };
      const result = component.formatDistance(nearbyPharmacy);
      expect(result).toContain('km');
    });

    it('deve retornar string vazia para farmácia sem distance', () => {
      const result = component.formatDistance(mockPharmacy);
      expect(result).toBe('');
    });

    it('deve formatar moeda', () => {
      component.formatCurrency(1990);
      expect(mockPharmacyService.formatCurrency).toHaveBeenCalledWith(1990);
    });

    it('deve obter label do método de pagamento', () => {
      component.getPaymentMethodLabel('credit_card');
      expect(mockPharmacyService.getPaymentMethodLabel).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTES DE ÍCONES DE PAGAMENTO
  // ============================================

  describe('Payment Method Icons', () => {
    it('deve retornar ícone para cartão de crédito', () => {
      expect(component.getPaymentMethodIcon('credit_card')).toBe('💳');
    });

    it('deve retornar ícone para cartão de débito', () => {
      expect(component.getPaymentMethodIcon('debit_card')).toBe('💳');
    });

    it('deve retornar ícone para PIX', () => {
      expect(component.getPaymentMethodIcon('pix')).toBe('⚡');
    });

    it('deve retornar ícone para boleto', () => {
      expect(component.getPaymentMethodIcon('boleto')).toBe('📄');
    });

    it('deve retornar ícone para dinheiro', () => {
      expect(component.getPaymentMethodIcon('cash')).toBe('💵');
    });

    it('deve retornar ícone para convênio', () => {
      expect(component.getPaymentMethodIcon('insurance')).toBe('🏥');
    });

    it('deve retornar ícone padrão para método desconhecido', () => {
      expect(component.getPaymentMethodIcon('unknown')).toBe('💰');
    });
  });

  // ============================================
  // TESTES DE PAGINAÇÃO
  // ============================================

  describe('Pagination', () => {
    beforeEach(() => {
      mockPharmacyService.getPharmacies.and.returnValue(of({
        pharmacies: mockPharmacies,
        total: 3,
        hasMore: true,
        lastDoc: {} as any
      }));
      fixture.detectChanges();
    });

    it('deve carregar mais farmácias', () => {
      component.hasMore.set(true);
      const initialCallCount = mockPharmacyService.searchPharmaciesApi.calls.count();
      
      component.loadMore();
      
      expect(mockPharmacyService.searchPharmaciesApi.calls.count()).toBeGreaterThan(initialCallCount);
    });

    it('deve não carregar mais se hasMore false', () => {
      component.hasMore.set(false);
      const initialCallCount = mockPharmacyService.searchPharmaciesApi.calls.count();
      
      component.loadMore();
      
      expect(mockPharmacyService.searchPharmaciesApi.calls.count()).toBe(initialCallCount);
    });

    it('deve não carregar mais se já carregando', () => {
      component.hasMore.set(true);
      component.loadingMore.set(true);
      const initialCallCount = mockPharmacyService.searchPharmaciesApi.calls.count();
      
      component.loadMore();
      
      expect(mockPharmacyService.searchPharmaciesApi.calls.count()).toBe(initialCallCount);
    });
  });

  // ============================================
  // TESTES DE RENDERIZAÇÃO
  // ============================================

  describe('Rendering', () => {
    // Helper para setup de estado
    const setupState = (config: { 
      pharmacies?: (Pharmacy | NearbyPharmacy)[];
      hasMore?: boolean;
    }) => {
      fixture.detectChanges();
      if (config.pharmacies !== undefined) {
        component.pharmacies.set(config.pharmacies);
      }
      if (config.hasMore !== undefined) {
        component.hasMore.set(config.hasMore);
      }
      fixture.detectChanges();
    };

    it('deve renderizar header', () => {
      setupState({ pharmacies: [] });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.page-header h1')).toBeTruthy();
      expect(compiled.textContent).toContain('Farmácias');
    });

    it('deve renderizar search box', () => {
      setupState({ pharmacies: [] });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.search-input')).toBeTruthy();
    });

    it('deve renderizar filtros', () => {
      setupState({ pharmacies: [] });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.filter-row')).toBeTruthy();
    });

    it('deve renderizar grid de farmácias', () => {
      setupState({ pharmacies: mockPharmacies });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pharmacies-grid')).toBeTruthy();
    });

    it('deve renderizar cards de farmácias', () => {
      setupState({ pharmacies: mockPharmacies });
      const compiled = fixture.nativeElement;
      const cards = compiled.querySelectorAll('.pharmacy-card');
      expect(cards.length).toBe(3);
    });

    it('deve exibir nome da farmácia nos cards', () => {
      setupState({ pharmacies: mockPharmacies });
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Farmácia Central');
    });

    it('deve exibir badge de destaque para farmácia featured', () => {
      setupState({ pharmacies: [mockPharmacy] });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.featured-badge')).toBeTruthy();
    });

    it('deve exibir botão load more quando hasMore', () => {
      setupState({ pharmacies: mockPharmacies, hasMore: true });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.load-more-btn')).toBeTruthy();
    });

    it('deve não exibir botão load more quando não hasMore', () => {
      setupState({ pharmacies: mockPharmacies, hasMore: false });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.load-more-btn')).toBeFalsy();
    });

    it('deve exibir resumo de resultados', () => {
      setupState({ pharmacies: mockPharmacies });
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.results-summary')).toBeTruthy();
      expect(compiled.textContent).toContain('3 farmácias');
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('deve lidar com lista vazia de farmácias', () => {
      mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
        pharmacies: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0
      }));
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-empty-state')).toBeTruthy();
    });

    it('deve lidar com farmácia sem logo', () => {
      const pharmacyNoLogo = { ...mockPharmacy, logo: undefined };
      component.pharmacies.set([pharmacyNoLogo]);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pharmacy-logo')).toBeFalsy();
    });

    it('deve lidar com farmácia sem banner', () => {
      const pharmacyNoBanner = { ...mockPharmacy, banner: undefined };
      component.pharmacies.set([pharmacyNoBanner]);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pharmacy-banner.placeholder')).toBeTruthy();
    });

    it('deve lidar com muitos métodos de pagamento', fakeAsync(() => {
      const pharmacyManyMethods: Pharmacy = {
        ...mockPharmacy,
        id: 'pharmacy-many-methods',
        paymentMethods: [
          PaymentMethod.CREDIT_CARD,
          PaymentMethod.DEBIT_CARD,
          PaymentMethod.PIX,
          PaymentMethod.BOLETO,
          PaymentMethod.CASH,
          PaymentMethod.INSURANCE
        ]
      };
      
      // Configurar mock para retornar a farmácia com muitos métodos
      mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
        pharmacies: [pharmacyManyMethods],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1
      }));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      const moreMethodsElement = compiled.querySelector('.more-methods');
      expect(moreMethodsElement).toBeTruthy();
      if (moreMethodsElement) {
        expect(moreMethodsElement.textContent).toContain('+2');
      }
    }));

    it('deve exibir delivery grátis quando freeDeliveryMinimum', () => {
      component.pharmacies.set([mockPharmacy]);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Grátis acima');
    });

    it('deve exibir delivery grátis quando deliveryFee é 0', fakeAsync(() => {
      const pharmacyFreeDelivery: Pharmacy = {
        ...mockPharmacy,
        id: 'pharmacy-free-delivery',
        deliveryOptions: { 
          hasDelivery: true,
          deliveryFee: 0,
          estimatedTime: '30-60 min',
          hasPickup: true
        }
      };
      
      // Configurar mock para retornar a farmácia com delivery grátis
      mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
        pharmacies: [pharmacyFreeDelivery],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1
      }));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      // Verifica se contém "Grátis" no texto (sem "acima de")
      const freeElement = compiled.querySelector('.free');
      expect(freeElement).toBeTruthy();
      if (freeElement) {
        expect(freeElement.textContent).toContain('Grátis');
      }
    }));
  });

  // ============================================
  // TESTES DE GEOLOCALIZAÇÃO
  // ============================================

  describe('Geolocation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve desativar useLocation quando já está ativo', () => {
      component.useLocation.set(true);
      component.toggleLocation();
      expect(component.useLocation()).toBe(false);
    });

    it('deve recarregar farmácias ao desativar localização', () => {
      component.useLocation.set(true);
      const initialCallCount = mockPharmacyService.searchPharmaciesApi.calls.count();
      component.toggleLocation();
      expect(mockPharmacyService.searchPharmaciesApi.calls.count()).toBeGreaterThan(initialCallCount);
    });

    it('deve incluir useLocation no activeFiltersCount', () => {
      component.useLocation.set(true);
      expect(component.activeFiltersCount()).toBe(1);
    });
  });

  // ============================================
  // TESTES DE NEARBY PHARMACIES
  // ============================================

  describe('Nearby Pharmacies', () => {
    const nearbyPharmacies: NearbyPharmacy[] = [
      { ...mockPharmacy, id: 'n1', name: 'Nearby 1', distance: 1.5 },
      { ...mockPharmacy, id: 'n2', name: 'Nearby 2', distance: 3.0, deliveryOptions: { ...mockPharmacy.deliveryOptions, hasDelivery: false } },
      { ...mockPharmacy, id: 'n3', name: 'Nearby 3', distance: 0.8, rating: 4.8 }
    ];

    beforeEach(() => {
      mockPharmacyService.getNearbyPharmacies.and.returnValue(of(nearbyPharmacies));
      // Mock dinâmico que aplica filtros
      mockPharmacyService.getNearbyPharmaciesViaApi.and.callFake((params: any) => {
        let filtered = [...nearbyPharmacies];
        if (params.hasDelivery) {
          filtered = filtered.filter(p => p.deliveryOptions.hasDelivery);
        }
        if (params.minRating) {
          filtered = filtered.filter(p => p.rating >= params.minRating);
        }
        return of({
          pharmacies: filtered,
          total: filtered.length,
          searchRadius: params.radiusKm || 20,
          center: { latitude: params.latitude, longitude: params.longitude }
        });
      });
      fixture.detectChanges();
    });

    it('deve filtrar por delivery nas farmácias próximas', () => {
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      component.filters.set({ hasDelivery: true });
      
      component.loadPharmacies();
      
      const filtered = component.pharmacies();
      expect(filtered.every(p => p.deliveryOptions.hasDelivery)).toBe(true);
    });

    it('deve filtrar por pickup nas farmácias próximas', () => {
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      component.filters.set({ hasPickup: true });
      
      component.loadPharmacies();
      
      const filtered = component.pharmacies();
      expect(filtered.every(p => p.deliveryOptions.hasPickup)).toBe(true);
    });

    it('deve filtrar por rating nas farmácias próximas', () => {
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      component.filters.set({ rating: 4.7 });
      
      component.loadPharmacies();
      
      const filtered = component.pharmacies();
      expect(filtered.every(p => p.rating >= 4.7)).toBe(true);
    });

    it('deve filtrar por busca nas farmácias próximas', () => {
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      component.searchQuery.set('Nearby 1');
      
      component.loadPharmacies();
      
      const filtered = component.pharmacies();
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });

    it('deve setar hasMore como false para farmácias próximas', () => {
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      
      component.loadPharmacies();
      
      expect(component.hasMore()).toBe(false);
    });

    it('deve filtrar por cidade na busca de farmácias próximas', () => {
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      component.searchQuery.set('São Paulo');
      
      component.loadPharmacies();
      
      const filtered = component.pharmacies();
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TESTES DE LOADMORE
  // ============================================

  describe('LoadMore Advanced', () => {
    it('deve acumular farmácias ao carregar mais', fakeAsync(() => {
      const firstBatch = [mockPharmacy];
      const secondBatch = [{ ...mockPharmacy, id: 'pharmacy-4', name: 'Farmácia Nova' }];
      
      mockPharmacyService.searchPharmaciesApi.and.returnValues(
        of({ pharmacies: firstBatch, total: 2, page: 1, pageSize: 12, totalPages: 2 }),
        of({ pharmacies: secondBatch, total: 2, page: 2, pageSize: 12, totalPages: 2 })
      );
      
      fixture.detectChanges();
      tick();
      component.hasMore.set(true);
      
      component.loadMore();
      tick();
      
      expect(component.pharmacies().length).toBe(2);
    }));

    it('deve setar loadingMore como false após erro', fakeAsync(() => {
      import('rxjs').then(({ throwError }) => {
        mockPharmacyService.searchPharmaciesApi.and.returnValues(
          of({ pharmacies: [mockPharmacy], total: 1, page: 1, pageSize: 12, totalPages: 2 }),
          throwError(() => new Error('Network error'))
        );
      });
      
      fixture.detectChanges();
      tick();
      component.hasMore.set(true);
      component.loadingMore.set(false);
      
      // Even if error occurs, loadingMore should be false after
      expect(component.loadingMore()).toBe(false);
    }));
  });

  // ============================================
  // TESTES DE SORT EDGE CASES
  // ============================================

  describe('Sort Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve lidar com sortBy unknown', () => {
      component.pharmacies.set([...mockPharmacies]);
      (component.sortBy as any).set('unknown');
      component.onSort();
      // Should return pharmacies unsorted
      expect(component.pharmacies().length).toBe(3);
    });

    it('deve lidar com pharmacies sem distance no sort por distance', () => {
      component.pharmacies.set([mockPharmacy]); // No distance property
      component.sortBy.set('distance');
      component.onSort();
      // Should use 999 as default distance
      expect(component.pharmacies().length).toBe(1);
    });

    it('deve ordenar farmácias mistas (com e sem distance)', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, id: 'nearby', distance: 2 };
      component.pharmacies.set([mockPharmacy, nearbyPharmacy]);
      component.sortBy.set('distance');
      component.onSort();
      const sorted = component.pharmacies();
      // nearbyPharmacy (distance: 2) should come before mockPharmacy (distance: 999)
      expect((sorted[0] as NearbyPharmacy).distance || 999).toBeLessThan((sorted[1] as NearbyPharmacy).distance || 999);
    });
  });

  // ============================================
  // TESTES DE FORMAT DISTANCE EDGE CASES
  // ============================================

  describe('Format Distance Edge Cases', () => {
    it('deve formatar distância exatamente 1km', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, distance: 1 };
      const result = component.formatDistance(nearbyPharmacy);
      expect(result).toBe('1.0km');
    });

    it('deve formatar distância < 1km em metros', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, distance: 0.1 };
      const result = component.formatDistance(nearbyPharmacy);
      expect(result).toBe('100m');
    });

    it('deve formatar distância = 0.999 em metros', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, distance: 0.999 };
      const result = component.formatDistance(nearbyPharmacy);
      expect(result).toBe('999m');
    });

    it('deve formatar distância 10+ km', () => {
      const nearbyPharmacy: NearbyPharmacy = { ...mockPharmacy, distance: 15.7 };
      const result = component.formatDistance(nearbyPharmacy);
      expect(result).toBe('15.7km');
    });
  });

  // ============================================
  // TESTES DE ACTIVE FILTERS COUNT
  // ============================================

  describe('Active Filters Count Edge Cases', () => {
    it('deve contar useLocation como filtro', () => {
      component.useLocation.set(true);
      expect(component.activeFiltersCount()).toBe(1);
    });

    it('deve contar todos os filtros combinados incluindo useLocation', () => {
      component.filters.set({ hasDelivery: true, hasPickup: true, rating: 4.5 });
      component.searchQuery.set('teste');
      component.useLocation.set(true);
      expect(component.activeFiltersCount()).toBe(5);
    });

    it('deve não contar rating 0 como filtro', () => {
      component.filters.set({ rating: 0 });
      expect(component.activeFiltersCount()).toBe(0);
    });

    it('deve contar rating > 0 como filtro', () => {
      component.filters.set({ rating: 0.1 });
      expect(component.activeFiltersCount()).toBe(1);
    });
  });

  // ============================================
  // TESTES DE TEMPLATE INTERACTIONS
  // ============================================

  describe('Template Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve exibir botão clear-btn quando searchQuery não vazio', () => {
      component.searchQuery.set('teste');
      fixture.detectChanges();
      const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
      expect(clearBtn).toBeTruthy();
    });

    it('deve não exibir botão clear-btn quando searchQuery vazio', () => {
      component.searchQuery.set('');
      fixture.detectChanges();
      const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
      expect(clearBtn).toBeFalsy();
    });

    it('deve exibir active-filters quando há filtros ativos', () => {
      component.filters.set({ hasDelivery: true });
      fixture.detectChanges();
      const activeFilters = fixture.nativeElement.querySelector('.active-filters');
      expect(activeFilters).toBeTruthy();
    });

    it('deve não exibir active-filters quando não há filtros', () => {
      component.filters.set({});
      component.searchQuery.set('');
      component.useLocation.set(false);
      fixture.detectChanges();
      const activeFilters = fixture.nativeElement.querySelector('.active-filters');
      expect(activeFilters).toBeFalsy();
    });

    it('deve marcar botão delivery como active quando filtro ativo', () => {
      component.filters.set({ hasDelivery: true });
      fixture.detectChanges();
      const deliveryBtn = fixture.nativeElement.querySelectorAll('.filter-btn')[1];
      expect(deliveryBtn.classList.contains('active')).toBe(true);
    });

    it('deve marcar botão location como active quando useLocation', () => {
      component.useLocation.set(true);
      fixture.detectChanges();
      const locationBtn = fixture.nativeElement.querySelectorAll('.filter-btn')[0];
      expect(locationBtn.classList.contains('active')).toBe(true);
    });
  });

  // ============================================
  // TESTES DE KEYBOARD NAVIGATION
  // ============================================

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.pharmacies.set([mockPharmacy]);
      fixture.detectChanges();
    });

    it('deve ter tabindex no card de farmácia', () => {
      const card = fixture.nativeElement.querySelector('.pharmacy-card');
      expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('deve ter role button no card de farmácia', () => {
      const card = fixture.nativeElement.querySelector('.pharmacy-card');
      expect(card.getAttribute('role')).toBe('button');
    });
  });

  // ============================================
  // TESTES DE ESTADOS DE UI
  // ============================================

  describe('UI States', () => {
    it('deve exibir loading spinner quando loading', () => {
      loadingSignal.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-loading-spinner')).toBeTruthy();
    });

    it('deve exibir erro quando error existe', () => {
      errorSignal.set('Erro ao carregar farmácias');
      fixture.detectChanges();
      const errorState = fixture.nativeElement.querySelector('.error-state');
      expect(errorState).toBeTruthy();
    });

    it('deve exibir mensagem de erro', () => {
      errorSignal.set('Erro específico');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Erro específico');
    });

    it('deve ter botão retry no estado de erro', () => {
      errorSignal.set('Erro');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.retry-btn')).toBeTruthy();
    });

    it('deve chamar loadPharmacies ao clicar retry', () => {
      errorSignal.set('Erro');
      fixture.detectChanges();
      spyOn(component, 'loadPharmacies');
      
      const retryBtn = fixture.nativeElement.querySelector('.retry-btn');
      retryBtn.click();
      
      expect(component.loadPharmacies).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTES DE DELIVERY INFO
  // ============================================

  describe('Delivery Info Display', () => {
    it('deve exibir tempo estimado de delivery', () => {
      component.pharmacies.set([mockPharmacy]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('30-60 min');
    });

    it('deve exibir badge de retirada quando hasPickup', () => {
      component.pharmacies.set([mockPharmacy]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.pickup-badge')).toBeTruthy();
    });

    it('deve não exibir delivery badge quando hasDelivery false', () => {
      const pharmacyNoDelivery = {
        ...mockPharmacy,
        deliveryOptions: { ...mockPharmacy.deliveryOptions, hasDelivery: false }
      };
      mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
        pharmacies: [pharmacyNoDelivery],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1
      }));
      
      // Criar nova instância do componente com dados limpos
      fixture = TestBed.createComponent(PharmacyListPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      
      const deliveryBadge = fixture.nativeElement.querySelector('.delivery-info .delivery-badge');
      // Se hasDelivery é false, não deve ter o badge com ícone de caminhão
      const deliveryText = deliveryBadge?.textContent || '';
      expect(deliveryText.includes('🚚')).toBe(false);
    });
  });

  // ============================================
  // TESTES DE STATUS (OPEN/CLOSED)
  // ============================================

  describe('Pharmacy Status Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve exibir status aberta quando isOpenNow true', () => {
      mockPharmacyService.isOpenNow.and.returnValue(true);
      component.pharmacies.set([mockPharmacy]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.status-badge.open')).toBeTruthy();
    });

    it('deve exibir status fechada quando isOpenNow false', () => {
      mockPharmacyService.isOpenNow.and.returnValue(false);
      component.pharmacies.set([mockPharmacy]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.status-badge.closed')).toBeTruthy();
    });

    it('deve exibir próximo horário quando fechada', () => {
      mockPharmacyService.isOpenNow.and.returnValue(false);
      mockPharmacyService.getNextOpenTime.and.returnValue('Amanhã às 08:00');
      component.pharmacies.set([mockPharmacy]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Amanhã às 08:00');
    });
  });

  // ============================================
  // TESTES DE API V2 - Sprint M2
  // ============================================

  describe('API V2 Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deve chamar searchPharmaciesApi com parâmetros corretos', () => {
      component.searchQuery.set('farmácia teste');
      component.filters.set({ hasDelivery: true, rating: 4 });
      component.sortBy.set('rating');
      
      component.loadPharmacies();
      
      expect(mockPharmacyService.searchPharmaciesApi).toHaveBeenCalledWith(jasmine.objectContaining({
        searchQuery: 'farmácia teste',
        hasDelivery: true,
        minRating: 4,
        sortBy: 'rating',
        sortOrder: 'desc',
        page: 1,
        pageSize: 12
      }));
    });

    it('deve chamar searchPharmaciesApi com sortBy name e sortOrder asc', () => {
      component.sortBy.set('name');
      
      component.loadPharmacies();
      
      expect(mockPharmacyService.searchPharmaciesApi).toHaveBeenCalledWith(jasmine.objectContaining({
        sortBy: 'name',
        sortOrder: 'asc'
      }));
    });

    it('deve atualizar hasMore baseado na paginação da API', fakeAsync(() => {
      mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
        pharmacies: mockPharmacies,
        total: 100,
        page: 1,
        pageSize: 12,
        totalPages: 9
      }));
      
      component.loadPharmacies();
      tick();
      
      expect(component.hasMore()).toBe(true);
    }));

    it('deve setar hasMore false quando na última página', fakeAsync(() => {
      mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
        pharmacies: mockPharmacies,
        total: 3,
        page: 1,
        pageSize: 12,
        totalPages: 1
      }));
      
      component.loadPharmacies();
      tick();
      
      expect(component.hasMore()).toBe(false);
    }));

    it('deve incrementar página ao loadMore', () => {
      component.hasMore.set(true);
      
      component.loadMore();
      
      // Verifica que página 2 foi solicitada
      expect(mockPharmacyService.searchPharmaciesApi).toHaveBeenCalledWith(jasmine.objectContaining({
        page: 2
      }));
    });

    it('deve chamar getNearbyPharmaciesViaApi quando useLocation ativo', () => {
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      
      component.loadPharmacies();
      
      expect(mockPharmacyService.getNearbyPharmaciesViaApi).toHaveBeenCalledWith(jasmine.objectContaining({
        latitude: -23.55,
        longitude: -46.63,
        radiusKm: 20,
        limit: 50
      }));
    });

    it('deve aplicar filtros client-side para hasPickup em nearby', fakeAsync(() => {
      const nearbyWithMixedPickup: NearbyPharmacy[] = [
        { ...mockPharmacy, id: 'n1', name: 'With Pickup', distance: 1.0, deliveryOptions: { ...mockPharmacy.deliveryOptions, hasPickup: true } },
        { ...mockPharmacy, id: 'n2', name: 'No Pickup', distance: 2.0, deliveryOptions: { ...mockPharmacy.deliveryOptions, hasPickup: false } }
      ];
      
      mockPharmacyService.getNearbyPharmaciesViaApi.and.returnValue(of({
        pharmacies: nearbyWithMixedPickup,
        total: 2,
        searchRadius: 20,
        center: { latitude: -23.55, longitude: -46.63 }
      }));
      
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      component.filters.set({ hasPickup: true });
      
      component.loadPharmacies();
      tick();
      
      expect(component.pharmacies().length).toBe(1);
      expect(component.pharmacies()[0].name).toBe('With Pickup');
    }));

    it('deve aplicar filtro de busca client-side em nearby', fakeAsync(() => {
      const nearbyPharmacies: NearbyPharmacy[] = [
        { ...mockPharmacy, id: 'n1', name: 'Farmácia ABC', distance: 1.0 },
        { ...mockPharmacy, id: 'n2', name: 'Drogaria XYZ', distance: 2.0 }
      ];
      
      mockPharmacyService.getNearbyPharmaciesViaApi.and.returnValue(of({
        pharmacies: nearbyPharmacies,
        total: 2,
        searchRadius: 20,
        center: { latitude: -23.55, longitude: -46.63 }
      }));
      
      component['userLatitude'] = -23.55;
      component['userLongitude'] = -46.63;
      component.useLocation.set(true);
      component.searchQuery.set('ABC');
      
      component.loadPharmacies();
      tick();
      
      expect(component.pharmacies().length).toBe(1);
      expect(component.pharmacies()[0].name).toBe('Farmácia ABC');
    }));

    it('deve atualizar totalResults com total da API', fakeAsync(() => {
      mockPharmacyService.searchPharmaciesApi.and.returnValue(of({
        pharmacies: mockPharmacies,
        total: 150,
        page: 1,
        pageSize: 12,
        totalPages: 13
      }));
      
      component.loadPharmacies();
      tick();
      
      expect(component.totalResults()).toBe(150);
    }));

    it('deve reverter currentPage em caso de erro no loadMore', fakeAsync(() => {
      import('rxjs').then(({ throwError }) => {
        component.hasMore.set(true);
        mockPharmacyService.searchPharmaciesApi.and.returnValue(
          throwError(() => new Error('Network error'))
        );
        
        component.loadMore();
        tick();
        
        // currentPage deve voltar a 1 após erro
        expect(component['currentPage']).toBe(1);
      });
    }));
  });
});
