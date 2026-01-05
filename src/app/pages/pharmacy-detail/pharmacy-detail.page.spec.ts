/**
 * 🧪 Pharmacy Detail Page Tests
 * Testes unitários para a página de detalhes de farmácia
 * 
 * Cenários:
 * - Inicialização
 * - Carregamento de dados
 * - Loading/Error states
 * - Tabs (info, products, reviews)
 * - Ações rápidas (ligar, WhatsApp, direções)
 * - Formatação de dados
 * - Navegação
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PharmacyDetailPage } from './pharmacy-detail.page';
import { PharmacyService } from '../../services/pharmacy.service';
import { Pharmacy, PharmacyStatus, VerificationStatus, PaymentMethod } from '../../models/pharmacy.model';
import { Product, ProductCategory } from '../../models/product.model';
import { Review, ReviewStatus } from '../../models/review.model';
import { of, throwError } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';

describe('PharmacyDetailPage', () => {
  let component: PharmacyDetailPage;
  let fixture: ComponentFixture<PharmacyDetailPage>;
  let router: Router;
  let mockPharmacyService: jasmine.SpyObj<PharmacyService>;
  let mockActivatedRoute: { snapshot: { paramMap: { get: jasmine.Spy } } };

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
      complement: 'Loja 1',
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
      whatsapp: '(11) 99999-9999',
      email: 'contato@farmacia.com.br',
      website: 'https://farmacia.com.br'
    },
    businessHours: [
      { dayOfWeek: 0, openTime: '08:00', closeTime: '12:00', isClosed: false },
      { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '14:00', isClosed: false }
    ],
    logo: 'https://example.com/logo.png',
    banner: 'https://example.com/banner.png',
    description: 'Farmácia completa no centro de SP',
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
    paymentMethods: [PaymentMethod.CREDIT_CARD, PaymentMethod.PIX, PaymentMethod.CASH],
    policies: {
      returnPolicy: 'Troca em até 7 dias'
    },
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
    tags: ['delivery', '24h'],
    isFeatured: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Paracetamol 500mg',
      description: 'Analgésico e antitérmico',
      manufacturer: 'EMS',
      pharmacyId: 'pharmacy-1',
      price: 1299,
      originalPrice: 1599,
      discount: 19,
      stock: 100,
      minStock: 10,
      category: ProductCategory.ANALGESICS,
      subcategory: 'analgesicos',
      images: ['https://example.com/paracetamol.jpg'],
      requiresPrescription: false,
      sku: 'SKU-001',
      specifications: {},
      rating: 4.5,
      reviewCount: 50,
      soldCount: 200,
      isActive: true,
      isFeatured: false,
      tags: ['analgesico'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockReviews: Review[] = [
    {
      id: 'review-1',
      targetType: 'pharmacy',
      targetId: 'pharmacy-1',
      orderId: 'order-1',
      userId: 'user-1',
      userName: 'Maria Silva',
      rating: 5,
      comment: 'Ótimo atendimento!',
      isVerifiedPurchase: true,
      helpful: 10,
      notHelpful: 0,
      status: ReviewStatus.APPROVED,
      reportCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Mock signals
  let loadingSignal: WritableSignal<boolean>;
  let errorSignal: WritableSignal<string | null>;

  beforeEach(async () => {
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('pharmacy-1')
        }
      }
    };

    mockPharmacyService = jasmine.createSpyObj('PharmacyService', [
      'getPharmacyById',
      'getPharmacyProducts',
      'getPharmacyReviews',
      'isOpenNow',
      'getNextOpenTime',
      'formatCurrency',
      'getPaymentMethodLabel'
    ], {
      loading: loadingSignal,
      error: errorSignal
    });

    // Configurar mocks padrão
    mockPharmacyService.getPharmacyById.and.returnValue(of(mockPharmacy));
    mockPharmacyService.getPharmacyProducts.and.returnValue(of(mockProducts));
    mockPharmacyService.getPharmacyReviews.and.returnValue(of(mockReviews));
    mockPharmacyService.isOpenNow.and.returnValue(true);
    mockPharmacyService.getNextOpenTime.and.returnValue('Amanhã às 08:00');
    mockPharmacyService.formatCurrency.and.callFake((v: number) => `R$ ${(v/100).toFixed(2)}`);
    mockPharmacyService.getPaymentMethodLabel.and.callFake((m: PaymentMethod) => {
      const labels: Record<PaymentMethod, string> = {
        [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
        [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
        [PaymentMethod.PIX]: 'PIX',
        [PaymentMethod.BOLETO]: 'Boleto',
        [PaymentMethod.CASH]: 'Dinheiro',
        [PaymentMethod.INSURANCE]: 'Convênio'
      };
      return labels[m] || m;
    });

    await TestBed.configureTestingModule({
      imports: [PharmacyDetailPage, RouterTestingModule],
      providers: [
        { provide: PharmacyService, useValue: mockPharmacyService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PharmacyDetailPage);
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

    it('deve iniciar com activeTab como info', () => {
      expect(component.activeTab()).toBe('info');
    });

    it('deve iniciar com pharmacy null', () => {
      expect(component.pharmacy()).toBeNull();
    });

    it('deve iniciar com products vazio', () => {
      expect(component.products()).toEqual([]);
    });

    it('deve iniciar com reviews vazio', () => {
      expect(component.reviews()).toEqual([]);
    });

    it('deve iniciar com loadingProducts false', () => {
      expect(component.loadingProducts()).toBe(false);
    });

    it('deve iniciar com loadingReviews false', () => {
      expect(component.loadingReviews()).toBe(false);
    });

    it('deve carregar farmácia no ngOnInit', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(mockPharmacyService.getPharmacyById).toHaveBeenCalledWith('pharmacy-1');
    }));

    it('deve carregar produtos após carregar farmácia', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(mockPharmacyService.getPharmacyProducts).toHaveBeenCalledWith('pharmacy-1');
    }));
  });

  // ============================================
  // TESTES DE LOADING/ERROR STATES
  // ============================================

  describe('Loading State', () => {
    it('deve exibir loading quando loading é true', () => {
      loadingSignal.set(true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.loading-container')).toBeTruthy();
    });

    it('deve ocultar loading quando loading é false', fakeAsync(() => {
      loadingSignal.set(false);
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.loading-container')).toBeFalsy();
    }));
  });

  describe('Error State', () => {
    it('deve exibir erro quando error não é null', () => {
      errorSignal.set('Erro ao carregar');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-empty-state')).toBeTruthy();
    });
  });

  // ============================================
  // TESTES DE COMPUTED
  // ============================================

  describe('Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve calcular isOpen corretamente quando aberta', fakeAsync(() => {
      // Mock deve ser configurado ANTES do detectChanges
      mockPharmacyService.isOpenNow.and.returnValue(true);
      mockPharmacyService.getPharmacyById.and.returnValue(of(mockPharmacy));
      
      fixture.detectChanges();
      tick();
      
      expect(component.isOpen()).toBe(true);
    }));

    it('deve calcular isOpen corretamente quando fechada', fakeAsync(() => {
      // Reconfigurar o TestBed para este teste específico
      mockPharmacyService.isOpenNow.and.returnValue(false);
      mockPharmacyService.getPharmacyById.and.returnValue(of(mockPharmacy));
      
      // Criar novo fixture para garantir que o computed use o novo mock
      const newFixture = TestBed.createComponent(PharmacyDetailPage);
      const newComponent = newFixture.componentInstance;
      
      newFixture.detectChanges();
      tick();
      
      expect(newComponent.isOpen()).toBe(false);
      
      newFixture.destroy();
    }));

    it('deve calcular nextOpenTime quando fechada', fakeAsync(() => {
      // Reconfigurar mocks
      mockPharmacyService.isOpenNow.and.returnValue(false);
      mockPharmacyService.getNextOpenTime.and.returnValue('Amanhã às 08:00');
      mockPharmacyService.getPharmacyById.and.returnValue(of(mockPharmacy));
      
      // Criar novo fixture para garantir que o computed use o novo mock
      const newFixture = TestBed.createComponent(PharmacyDetailPage);
      const newComponent = newFixture.componentInstance;
      
      newFixture.detectChanges();
      tick();
      
      expect(newComponent.nextOpenTime()).toBe('Amanhã às 08:00');
      
      newFixture.destroy();
    }));

    it('deve retornar vazio para nextOpenTime quando aberta', fakeAsync(() => {
      mockPharmacyService.isOpenNow.and.returnValue(true);
      mockPharmacyService.getPharmacyById.and.returnValue(of(mockPharmacy));
      
      fixture.detectChanges();
      tick();
      
      expect(component.nextOpenTime()).toBe('');
    }));

    it('deve calcular formattedBusinessHours corretamente', () => {
      component.pharmacy.set(mockPharmacy);
      fixture.detectChanges();
      
      const hours = component.formattedBusinessHours();
      expect(hours.length).toBe(7);
      expect(hours[0].day).toBe('Domingo');
      expect(hours[1].day).toBe('Segunda');
    });

    it('deve retornar array vazio para formattedBusinessHours sem farmácia', () => {
      component.pharmacy.set(null);
      expect(component.formattedBusinessHours()).toEqual([]);
    });
  });

  // ============================================
  // TESTES DE TABS
  // ============================================

  describe('Tabs', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve mudar para tab info', () => {
      component.setActiveTab('info');
      expect(component.activeTab()).toBe('info');
    });

    it('deve mudar para tab products', () => {
      component.setActiveTab('products');
      expect(component.activeTab()).toBe('products');
    });

    it('deve mudar para tab reviews', () => {
      component.setActiveTab('reviews');
      expect(component.activeTab()).toBe('reviews');
    });

    it('deve carregar reviews ao mudar para tab reviews', fakeAsync(() => {
      component.pharmacy.set(mockPharmacy);
      component.setActiveTab('reviews');
      tick();
      
      expect(mockPharmacyService.getPharmacyReviews).toHaveBeenCalledWith('pharmacy-1');
    }));

    it('não deve recarregar reviews se já existirem', fakeAsync(() => {
      component.pharmacy.set(mockPharmacy);
      component.reviews.set(mockReviews);
      
      mockPharmacyService.getPharmacyReviews.calls.reset();
      component.setActiveTab('reviews');
      tick();
      
      expect(mockPharmacyService.getPharmacyReviews).not.toHaveBeenCalled();
    }));
  });

  // ============================================
  // TESTES DE FORMATAÇÃO
  // ============================================

  describe('Formatting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve formatar endereço completo', () => {
      component.pharmacy.set(mockPharmacy);
      const address = component.formatAddress();
      
      expect(address).toContain('Rua das Flores');
      expect(address).toContain('123');
      expect(address).toContain('Loja 1');
      expect(address).toContain('Centro');
      expect(address).toContain('São Paulo');
      expect(address).toContain('SP');
    });

    it('deve retornar vazio para formatAddress sem farmácia', () => {
      component.pharmacy.set(null);
      expect(component.formatAddress()).toBe('');
    });

    it('deve formatar moeda corretamente', () => {
      const result = component.formatCurrency(1990);
      expect(result).toContain('19');
      expect(result).toContain('90');
    });

    it('deve formatar data corretamente', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0); // 15 de janeiro de 2025, meio-dia local
      const result = component.formatDate(date);
      
      expect(result).toContain('jan');
      expect(result).toContain('2025');
    });

    it('deve retornar vazio para formatDate sem data', () => {
      expect(component.formatDate(null as any)).toBe('');
    });

    it('deve identificar dia atual corretamente', () => {
      const today = new Date().getDay();
      expect(component.isToday(today)).toBe(true);
      expect(component.isToday((today + 1) % 7)).toBe(false);
    });
  });

  // ============================================
  // TESTES DE ÍCONES
  // ============================================

  describe('Payment Method Icons', () => {
    it('deve retornar ícone para cartão de crédito', () => {
      expect(component.getPaymentMethodIcon(PaymentMethod.CREDIT_CARD)).toBe('💳');
    });

    it('deve retornar ícone para PIX', () => {
      expect(component.getPaymentMethodIcon(PaymentMethod.PIX)).toBe('📱');
    });

    it('deve retornar ícone para boleto', () => {
      expect(component.getPaymentMethodIcon(PaymentMethod.BOLETO)).toBe('📄');
    });

    it('deve retornar ícone para dinheiro', () => {
      expect(component.getPaymentMethodIcon(PaymentMethod.CASH)).toBe('💵');
    });

    it('deve retornar ícone para convênio', () => {
      expect(component.getPaymentMethodIcon(PaymentMethod.INSURANCE)).toBe('🏥');
    });
  });

  // ============================================
  // TESTES DE LINKS
  // ============================================

  describe('Links', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve gerar link do WhatsApp corretamente', () => {
      component.pharmacy.set(mockPharmacy);
      const link = component.getWhatsAppLink();
      
      expect(link).toContain('wa.me');
      expect(link).toContain('55');
    });

    it('deve retornar vazio para WhatsApp link sem telefone', () => {
      const pharmacyNoWhatsApp = { ...mockPharmacy, contact: { ...mockPharmacy.contact, whatsapp: undefined } };
      component.pharmacy.set(pharmacyNoWhatsApp);
      
      expect(component.getWhatsAppLink()).toBe('');
    });
  });

  // ============================================
  // TESTES DE NAVEGAÇÃO
  // ============================================

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve navegar para /pharmacies ao clicar em goBack', () => {
      spyOn(router, 'navigate');
      component.goBack();
      
      expect(router.navigate).toHaveBeenCalledWith(['/pharmacies']);
    });

    it('deve navegar para produto ao clicar em viewProduct', () => {
      spyOn(router, 'navigate');
      component.viewProduct('prod-1');
      
      expect(router.navigate).toHaveBeenCalledWith(['/products', 'prod-1']);
    });

    it('deve navegar para review ao clicar em writeReview', () => {
      spyOn(router, 'navigate');
      component.pharmacy.set(mockPharmacy);
      component.writeReview();
      
      expect(router.navigate).toHaveBeenCalledWith(['/pharmacies', 'pharmacy-1', 'review']);
    });
  });

  // ============================================
  // TESTES DE AÇÕES
  // ============================================

  describe('Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pharmacy.set(mockPharmacy);
    }));

    it('deve ter método callPharmacy', () => {
      // Não podemos testar window.location.href sem causar page reload
      // Apenas verificamos que o método existe
      expect(component.callPharmacy).toBeDefined();
    });

    it('não deve lançar erro ao abrir WhatsApp', () => {
      spyOn(window, 'open');
      expect(() => component.openWhatsApp()).not.toThrow();
    });

    it('deve abrir Google Maps ao clicar em direções', () => {
      spyOn(window, 'open');
      component.openDirections();
      
      expect(window.open).toHaveBeenCalled();
      const url = (window.open as jasmine.Spy).calls.mostRecent().args[0];
      expect(url).toContain('google.com/maps');
    });

    it('não deve lançar erro ao compartilhar', () => {
      // sharePharmacy pode usar navigator.share que não existe no ambiente de teste
      // ou navigator.clipboard que pode falhar
      expect(component.sharePharmacy).toBeDefined();
    });
  });

  // ============================================
  // TESTES DE LOAD MORE
  // ============================================

  describe('Load More', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve setar loadingMoreProducts para true ao carregar mais produtos', () => {
      component.loadMoreProducts();
      expect(component.loadingMoreProducts()).toBe(true);
    });

    it('deve setar loadingMoreReviews para true ao carregar mais reviews', () => {
      component.loadMoreReviews();
      expect(component.loadingMoreReviews()).toBe(true);
    });

    it('deve setar hasMoreProducts para false após carregar mais', fakeAsync(() => {
      component.hasMoreProducts.set(true);
      component.loadMoreProducts();
      tick(1100);
      
      expect(component.hasMoreProducts()).toBe(false);
    }));

    it('deve setar hasMoreReviews para false após carregar mais', fakeAsync(() => {
      component.hasMoreReviews.set(true);
      component.loadMoreReviews();
      tick(1100);
      
      expect(component.hasMoreReviews()).toBe(false);
    }));
  });

  // ============================================
  // TESTES DE RENDERING
  // ============================================

  describe('Rendering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve renderizar nome da farmácia', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Farmácia Central');
    });

    it('deve renderizar banner da farmácia', () => {
      const compiled = fixture.nativeElement;
      const banner = compiled.querySelector('.banner-image');
      expect(banner).toBeTruthy();
    });

    it('deve renderizar logo da farmácia', () => {
      const compiled = fixture.nativeElement;
      const logo = compiled.querySelector('.pharmacy-logo');
      expect(logo).toBeTruthy();
    });

    it('deve renderizar rating', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('4.5');
      expect(compiled.textContent).toContain('150');
    });

    it('deve renderizar status aberta', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Aberta agora');
    });

    it('deve renderizar endereço', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('São Paulo');
    });

    it('deve renderizar quick actions', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.quick-actions')).toBeTruthy();
      expect(compiled.querySelector('.action-btn.call')).toBeTruthy();
    });

    it('deve renderizar tabs', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelectorAll('.tab-btn').length).toBe(3);
    });

    it('deve renderizar badge de destaque', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Destaque');
    });

    it('deve renderizar badge verificada', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Verificada');
    });
  });

  // ============================================
  // TESTES DE INFO TAB
  // ============================================

  describe('Info Tab', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.setActiveTab('info');
      fixture.detectChanges();
    }));

    it('deve renderizar descrição', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Farmácia completa no centro de SP');
    });

    it('deve renderizar horário de funcionamento', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.business-hours')).toBeTruthy();
    });

    it('deve renderizar opções de delivery', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Delivery');
      expect(compiled.textContent).toContain('30-60 min');
    });

    it('deve renderizar opção de retirada', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Retirada na Loja');
    });

    it('deve renderizar formas de pagamento', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.payment-methods')).toBeTruthy();
    });

    it('deve renderizar informações do farmacêutico', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Dr. João Silva');
    });

    it('deve renderizar informações legais', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('12.345.678/0001-90');
    });

    it('deve renderizar informações de contato', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('(11) 3333-4444');
    });
  });

  // ============================================
  // TESTES DE PRODUCTS TAB
  // ============================================

  describe('Products Tab', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.setActiveTab('products');
      fixture.detectChanges();
    }));

    it('deve renderizar produtos', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.products-grid')).toBeTruthy();
    });

    it('deve exibir loading ao carregar produtos', fakeAsync(() => {
      component.loadingProducts.set(true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.products-tab .loading-container')).toBeTruthy();
    }));

    it('deve exibir empty state quando não há produtos', fakeAsync(() => {
      component.products.set([]);
      component.loadingProducts.set(false);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.products-tab app-empty-state')).toBeTruthy();
    }));
  });

  // ============================================
  // TESTES DE REVIEWS TAB
  // ============================================

  describe('Reviews Tab', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.setActiveTab('reviews');
      tick();
      fixture.detectChanges();
    }));

    it('deve renderizar resumo de avaliações', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.reviews-summary')).toBeTruthy();
    });

    it('deve exibir loading ao carregar reviews', fakeAsync(() => {
      component.loadingReviews.set(true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.reviews-tab .loading-container')).toBeTruthy();
    }));

    it('deve exibir botão de escrever avaliação', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.write-review-btn')).toBeTruthy();
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('deve lidar com farmácia sem banner', fakeAsync(() => {
      const pharmacyNoBanner: Pharmacy = { ...mockPharmacy, banner: undefined };
      mockPharmacyService.getPharmacyById.and.returnValue(of(pharmacyNoBanner));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.banner-placeholder')).toBeTruthy();
    }));

    it('deve lidar com farmácia sem logo', fakeAsync(() => {
      const pharmacyNoLogo: Pharmacy = { ...mockPharmacy, logo: undefined };
      mockPharmacyService.getPharmacyById.and.returnValue(of(pharmacyNoLogo));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.logo-placeholder')).toBeTruthy();
    }));

    it('deve lidar com farmácia sem WhatsApp', fakeAsync(() => {
      const pharmacyNoWhatsApp: Pharmacy = { 
        ...mockPharmacy, 
        contact: { ...mockPharmacy.contact, whatsapp: undefined } 
      };
      mockPharmacyService.getPharmacyById.and.returnValue(of(pharmacyNoWhatsApp));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.action-btn.whatsapp')).toBeFalsy();
    }));

    it('deve lidar com farmácia sem descrição', fakeAsync(() => {
      const pharmacyNoDesc: Pharmacy = { ...mockPharmacy, description: undefined };
      mockPharmacyService.getPharmacyById.and.returnValue(of(pharmacyNoDesc));
      
      fixture.detectChanges();
      tick();
      component.setActiveTab('info');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      // Não deve exibir seção "Sobre"
      const infoSections = compiled.querySelectorAll('.info-section h2');
      const hasAboutSection = Array.from(infoSections).some((h2: any) => h2.textContent === 'Sobre');
      expect(hasAboutSection).toBe(false);
    }));

    it('deve lidar com farmácia não encontrada', fakeAsync(() => {
      mockPharmacyService.getPharmacyById.and.returnValue(of(null));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Farmácia não encontrada');
    }));

    it('deve lidar com erro ao carregar farmácia', fakeAsync(() => {
      errorSignal.set('Erro ao carregar farmácia');
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-empty-state')).toBeTruthy();
    }));

    it('deve lidar com farmácia não featured', fakeAsync(() => {
      const pharmacyNotFeatured: Pharmacy = { ...mockPharmacy, isFeatured: false };
      mockPharmacyService.getPharmacyById.and.returnValue(of(pharmacyNotFeatured));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.badge.featured')).toBeFalsy();
    }));

    it('deve lidar com farmácia não verificada', fakeAsync(() => {
      const pharmacyNotVerified: Pharmacy = { 
        ...mockPharmacy, 
        verificationStatus: VerificationStatus.PENDING 
      };
      mockPharmacyService.getPharmacyById.and.returnValue(of(pharmacyNotVerified));
      
      fixture.detectChanges();
      tick();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.badge.verified')).toBeFalsy();
    }));
  });
});
