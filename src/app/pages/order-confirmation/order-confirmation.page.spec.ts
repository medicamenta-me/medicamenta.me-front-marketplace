/**
 * 🧪 Order Confirmation Page Tests
 * Testes unitários para a página de confirmação de pedido
 * 
 * Cenários:
 * - Loading state
 * - Error state (pedido não encontrado)
 * - Success state (pedido exibido)
 * - Timeline de status
 * - Informações de entrega
 * - Informações de pagamento
 * - Resumo do pedido
 * - Ações disponíveis
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { OrderConfirmationPage, OrderService } from './order-confirmation.page';
import { Order, OrderStatus, PaymentStatus } from '../../models/order.model';

describe('OrderConfirmationPage', () => {
  let component: OrderConfirmationPage;
  let fixture: ComponentFixture<OrderConfirmationPage>;
  let router: Router;
  let activatedRoute: ActivatedRoute;

  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'ORD-2025-000001',
    userId: 'user-456',
    pharmacyId: 'pharmacy-789',
    pharmacyName: 'Farmácia Central',
    customerEmail: 'cliente@email.com',
    items: [
      {
        productId: 'prod-1',
        productName: 'Dipirona 500mg',
        productImage: 'img1.jpg',
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
    discount: 500,
    total: 5979,
    status: OrderStatus.PAYMENT_CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: 'pix',
    deliveryType: 'delivery',
    deliveryAddress: {
      recipientName: 'João Silva',
      phone: '(11) 99999-9999',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    notes: 'Entregar na portaria',
    prescriptionRequired: false,
    prescriptionVerified: false,
    statusHistory: [],
    createdAt: new Date('2025-12-29T10:00:00'),
    updatedAt: new Date('2025-12-29T10:00:00')
  };

  const createMockRoute = (orderId: string | null) => ({
    snapshot: {
      paramMap: {
        get: (key: string) => key === 'orderId' ? orderId : null
      }
    }
  });

  // Mock ActivatedRoute - defaults to no orderId to allow tests to control state
  let mockActivatedRoute: { snapshot: { paramMap: { get: (key: string) => string | null } } };

  beforeEach(async () => {
    // Reset mock to no orderId
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => null
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [OrderConfirmationPage, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderConfirmationPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  // ============================================
  // TESTES DE INICIALIZAÇÃO
  // ============================================

  describe('Initialization', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve iniciar com loading true', () => {
      expect(component.loading()).toBe(true);
    });

    it('deve iniciar com order null', () => {
      expect(component.order()).toBeNull();
    });

    it('deve iniciar com error null', () => {
      expect(component.error()).toBeNull();
    });

    it('deve ter 5 steps no timeline', () => {
      expect(component.orderSteps().length).toBe(5);
    });

    it('deve ter os steps corretos', () => {
      const steps = component.orderSteps();
      expect(steps[0].status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(steps[1].status).toBe(OrderStatus.PAYMENT_CONFIRMED);
      expect(steps[2].status).toBe(OrderStatus.PREPARING);
      expect(steps[3].status).toBe(OrderStatus.OUT_FOR_DELIVERY);
      expect(steps[4].status).toBe(OrderStatus.DELIVERED);
    });
  });

  // ============================================
  // TESTES DE CARREGAMENTO
  // ============================================

  describe('Loading', () => {
    it('deve definir error se orderId não informado', fakeAsync(() => {
      // Mock route without orderId
      (activatedRoute.snapshot.paramMap.get as jasmine.Spy) = jasmine.createSpy().and.returnValue(null);
      
      component.ngOnInit();
      tick();

      expect(component.error()).toBe('ID do pedido não informado');
      expect(component.loading()).toBe(false);
    }));

    it('deve carregar pedido mock quando orderService não disponível', fakeAsync(() => {
      // Mock route with orderId
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue('order-123');
      
      component.ngOnInit();
      tick();

      expect(component.order()).toBeTruthy();
      expect(component.loading()).toBe(false);
    }));

    it('deve definir loading false após carregar', fakeAsync(() => {
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue('order-123');
      
      component.ngOnInit();
      tick();

      expect(component.loading()).toBe(false);
    }));
  });

  // ============================================
  // TESTES DE TIMELINE
  // ============================================

  describe('Timeline', () => {
    beforeEach(() => {
      component.order.set(mockOrder);
    });

    it('deve marcar step como completed se anterior ao status atual', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PAYMENT_CONFIRMED });
      expect(component.isStepCompleted(OrderStatus.PENDING_PAYMENT)).toBe(true);
    });

    it('deve não marcar step como completed se igual ao status atual', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PAYMENT_CONFIRMED });
      expect(component.isStepCompleted(OrderStatus.PAYMENT_CONFIRMED)).toBe(false);
    });

    it('deve não marcar step como completed se posterior ao status atual', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PAYMENT_CONFIRMED });
      expect(component.isStepCompleted(OrderStatus.PREPARING)).toBe(false);
    });

    it('deve identificar step atual corretamente', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PREPARING });
      expect(component.isCurrentStep(OrderStatus.PREPARING)).toBe(true);
    });

    it('deve não identificar outros steps como atual', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PREPARING });
      expect(component.isCurrentStep(OrderStatus.PAYMENT_CONFIRMED)).toBe(false);
    });

    it('deve retornar false para isStepCompleted se order null', () => {
      component.order.set(null);
      expect(component.isStepCompleted(OrderStatus.PAYMENT_CONFIRMED)).toBe(false);
    });

    it('deve retornar false para isCurrentStep se order null', () => {
      component.order.set(null);
      expect(component.isCurrentStep(OrderStatus.PAYMENT_CONFIRMED)).toBe(false);
    });
  });

  // ============================================
  // TESTES DE FORMATAÇÃO DE ENDEREÇO
  // ============================================

  describe('Address Formatting', () => {
    it('deve formatar endereço completo com complemento', () => {
      const address = mockOrder.deliveryAddress;
      const formatted = component.formatAddress(address);
      
      expect(formatted).toContain('Rua das Flores');
      expect(formatted).toContain('123');
      expect(formatted).toContain('Apto 45');
      expect(formatted).toContain('Centro');
      expect(formatted).toContain('São Paulo');
      expect(formatted).toContain('SP');
      expect(formatted).toContain('01234-567');
    });

    it('deve formatar endereço sem complemento', () => {
      const address = { 
        recipientName: 'João Silva',
        phone: '(11) 99999-9999',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      };
      const formatted = component.formatAddress(address);
      
      expect(formatted).not.toContain('undefined');
      expect(formatted).toContain('Rua das Flores');
    });

    it('deve retornar string vazia se address undefined', () => {
      const formatted = component.formatAddress(undefined);
      expect(formatted).toBe('');
    });
  });

  // ============================================
  // TESTES DE FORMATAÇÃO DE MOEDA
  // ============================================

  describe('Currency Formatting', () => {
    it('deve formatar valor em centavos para reais', () => {
      const formatted = component.formatCurrency(1990);
      expect(formatted).toContain('19');
      expect(formatted).toContain('90');
    });

    it('deve formatar valor zero', () => {
      const formatted = component.formatCurrency(0);
      expect(formatted).toContain('0');
    });

    it('deve formatar valores grandes', () => {
      const formatted = component.formatCurrency(100000);
      expect(formatted).toContain('1.000');
    });
  });

  // ============================================
  // TESTES DE FORMATAÇÃO DE DATA
  // ============================================

  describe('Date Formatting', () => {
    beforeEach(() => {
      component.order.set(mockOrder);
    });

    it('deve formatar data de entrega estimada', () => {
      const formatted = component.formatEstimatedDelivery();
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('deve retornar string vazia se order null', () => {
      component.order.set(null);
      const formatted = component.formatEstimatedDelivery();
      expect(formatted).toBe('');
    });

    it('deve formatar data de vencimento do boleto', () => {
      const formatted = component.formatBoletoExpiry();
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('deve retornar string vazia para boleto se order null', () => {
      component.order.set(null);
      const formatted = component.formatBoletoExpiry();
      expect(formatted).toBe('');
    });
  });

  // ============================================
  // TESTES DE MÉTODO DE PAGAMENTO
  // ============================================

  describe('Payment Method', () => {
    it('deve retornar ícone correto para PIX', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'pix' });
      expect(component.getPaymentMethodIcon()).toBe('⚡');
    });

    it('deve retornar ícone correto para cartão de crédito', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'credit_card' });
      expect(component.getPaymentMethodIcon()).toBe('💳');
    });

    it('deve retornar ícone correto para cartão de débito', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'debit_card' });
      expect(component.getPaymentMethodIcon()).toBe('💳');
    });

    it('deve retornar ícone correto para boleto', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'boleto' });
      expect(component.getPaymentMethodIcon()).toBe('📄');
    });

    it('deve retornar ícone default para método desconhecido', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'unknown' as any });
      expect(component.getPaymentMethodIcon()).toBe('💰');
    });

    it('deve retornar nome correto para PIX', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'pix' });
      expect(component.getPaymentMethodName()).toBe('PIX');
    });

    it('deve retornar nome correto para cartão de crédito', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'credit_card' });
      expect(component.getPaymentMethodName()).toBe('Cartão de Crédito');
    });

    it('deve retornar nome correto para cartão de débito', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'debit_card' });
      expect(component.getPaymentMethodName()).toBe('Cartão de Débito');
    });

    it('deve retornar nome correto para boleto', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'boleto' });
      expect(component.getPaymentMethodName()).toBe('Boleto Bancário');
    });
  });

  // ============================================
  // TESTES DE STATUS DE PAGAMENTO
  // ============================================

  describe('Payment Status', () => {
    it('deve retornar classe paid para pagamento confirmado', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PAID });
      expect(component.getPaymentStatusClass()).toBe('paid');
    });

    it('deve retornar classe failed para pagamento falhou', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.FAILED });
      expect(component.getPaymentStatusClass()).toBe('failed');
    });

    it('deve retornar classe pending para pagamento pendente', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PENDING });
      expect(component.getPaymentStatusClass()).toBe('pending');
    });

    it('deve retornar label correto para pending', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PENDING });
      expect(component.getPaymentStatusLabel()).toBe('Aguardando');
    });

    it('deve retornar label correto para paid', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PAID });
      expect(component.getPaymentStatusLabel()).toBe('Pago');
    });

    it('deve retornar label correto para failed', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.FAILED });
      expect(component.getPaymentStatusLabel()).toBe('Falhou');
    });

    it('deve retornar label correto para processing', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PROCESSING });
      expect(component.getPaymentStatusLabel()).toBe('Processando');
    });

    it('deve retornar label correto para refunded', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.REFUNDED });
      expect(component.getPaymentStatusLabel()).toBe('Reembolsado');
    });
  });

  // ============================================
  // TESTES DE COPIAR PIX
  // ============================================

  describe('Copy PIX Code', () => {
    it('deve copiar código PIX para clipboard', fakeAsync(() => {
      const mockOrder2 = { ...mockOrder, pixCode: 'PIX123456789' };
      component.order.set(mockOrder2);

      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      spyOn(window, 'alert');

      component.copyPixCode();
      tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('PIX123456789');
      expect(window.alert).toHaveBeenCalledWith('Código PIX copiado!');
    }));

    it('deve exibir erro se falhar ao copiar', fakeAsync(() => {
      const mockOrder2 = { ...mockOrder, pixCode: 'PIX123456789' };
      component.order.set(mockOrder2);

      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject());
      spyOn(window, 'alert');

      component.copyPixCode();
      tick();

      expect(window.alert).toHaveBeenCalledWith('Erro ao copiar código');
    }));

    it('deve não fazer nada se pixCode não existir', () => {
      component.order.set({ ...mockOrder, pixCode: undefined });

      spyOn(navigator.clipboard, 'writeText');

      component.copyPixCode();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTES DE RENDERIZAÇÃO
  // ============================================

  describe('Rendering', () => {
    // Helper to setup component state before testing rendering
    const setupState = (config: { loading: boolean; error: string | null; order: Order | null }) => {
      // First detectChanges triggers ngOnInit
      fixture.detectChanges();
      // Now override the state
      component.loading.set(config.loading);
      component.error.set(config.error);
      component.order.set(config.order);
      // Detect changes again to render with new state
      fixture.detectChanges();
    };

    it('deve renderizar loading state', () => {
      setupState({ loading: true, error: null, order: null });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-loading-spinner')).toBeTruthy();
    });

    it('deve renderizar error state', () => {
      setupState({ loading: false, error: 'Pedido não encontrado', order: null });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.error-state')).toBeTruthy();
      expect(compiled.textContent).toContain('Pedido não encontrado');
    });

    it('deve renderizar success state com order', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.success-header')).toBeTruthy();
      expect(compiled.textContent).toContain('Pedido Confirmado');
    });

    it('deve exibir número do pedido', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('ORD-2025-000001');
    });

    it('deve exibir email do cliente', () => {
      setupState({ loading: false, error: null, order: mockOrder });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('cliente@email.com');
    });

    it('deve exibir timeline de status', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.order-timeline')).toBeTruthy();
    });

    it('deve exibir itens do pedido', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Dipirona 500mg');
      expect(compiled.textContent).toContain('Paracetamol 750mg');
    });

    it('deve exibir informações de entrega para delivery', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.address-card')).toBeTruthy();
      expect(compiled.textContent).toContain('João Silva');
    });

    it('deve exibir informações de retirada para pickup', () => {
      setupState({ loading: false, error: null, order: { ...mockOrder, deliveryType: 'pickup' } });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pickup-card')).toBeTruthy();
      expect(compiled.textContent).toContain('Farmácia Central');
    });

    it('deve exibir resumo do pedido', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.order-summary')).toBeTruthy();
    });

    it('deve exibir desconto quando aplicado', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.discount')).toBeTruthy();
    });

    it('deve exibir observações quando existirem', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.order-notes')).toBeTruthy();
      expect(compiled.textContent).toContain('Entregar na portaria');
    });

    it('deve não exibir observações quando não existirem', () => {
      setupState({ loading: false, error: null, order: { ...mockOrder, notes: undefined } });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.order-notes')).toBeFalsy();
    });

    it('deve exibir botões de ação', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.order-actions')).toBeTruthy();
      expect(compiled.textContent).toContain('Ver Meus Pedidos');
      expect(compiled.textContent).toContain('Continuar Comprando');
    });

    it('deve exibir seção de ajuda', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.help-section')).toBeTruthy();
    });

    it('deve exibir info de PIX para pagamento pendente', () => {
      setupState({ 
        loading: false, 
        error: null, 
        order: { 
          ...mockOrder, 
          paymentMethod: 'pix',
          paymentStatus: PaymentStatus.PENDING,
          pixCode: 'PIX123'
        }
      });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pix-info')).toBeTruthy();
    });

    it('deve não exibir info de PIX para pagamento pago', () => {
      setupState({ 
        loading: false, 
        error: null, 
        order: { 
          ...mockOrder, 
          paymentMethod: 'pix',
          paymentStatus: PaymentStatus.PAID
        }
      });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pix-info')).toBeFalsy();
    });

    it('deve exibir info de boleto para pagamento pendente', () => {
      setupState({ 
        loading: false, 
        error: null, 
        order: { 
          ...mockOrder, 
          paymentMethod: 'boleto',
          paymentStatus: PaymentStatus.PENDING,
          boletoUrl: 'https://boleto.url'
        }
      });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.boleto-info')).toBeTruthy();
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    // Helper to setup component state for edge case tests
    const setupEdgeState = (order: any) => {
      fixture.detectChanges(); // Trigger ngOnInit
      component.loading.set(false);
      component.error.set(null);
      component.order.set(order);
      fixture.detectChanges();
    };

    it('deve lidar com item sem imagem', () => {
      const orderNoImage = {
        ...mockOrder,
        items: [{
          productId: 'prod-1',
          productName: 'Produto sem imagem',
          productImage: undefined,
          quantity: 1,
          unitPrice: 1000,
          subtotal: 1000,
          discount: 0,
          total: 1000
        }]
      };
      setupEdgeState(orderNoImage);

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.placeholder-image')).toBeTruthy();
    });

    it('deve lidar com item sem productName', () => {
      const orderNoProductName = {
        ...mockOrder,
        items: [{
          productId: 'prod-1',
          productName: '',
          quantity: 1,
          unitPrice: 1000,
          subtotal: 1000,
          discount: 0,
          total: 1000
        }]
      };
      setupEdgeState(orderNoProductName as any);

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Produto');
    });

    it('deve lidar com frete grátis', () => {
      setupEdgeState({ ...mockOrder, deliveryFee: 0 });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Grátis');
    });

    it('deve lidar com pedido sem desconto', () => {
      setupEdgeState({ ...mockOrder, discount: 0 });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.discount')).toBeFalsy();
    });

    it('deve lidar com endereço sem complemento', () => {
      const orderNoComplement: Order = {
        ...mockOrder,
        deliveryAddress: {
          recipientName: 'João Silva',
          phone: '(11) 99999-9999',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        }
      };
      setupEdgeState(orderNoComplement);

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).not.toContain('undefined');
    });
  });
});
