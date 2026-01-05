/**
 * 🧪 Order Detail Page Tests
 * Testes unitários para a página de detalhes do pedido
 * 
 * Cenários:
 * - Loading state
 * - Error state
 * - Order details rendering
 * - Status timeline
 * - Payment info
 * - Delivery/Pickup info
 * - Order items
 * - Actions (cancel, reorder)
 * - Formatting (date, currency, status)
 * - 🆕 Real-time status updates
 * - 🆕 Toast notifications
 * 
 * @version 2.0.0 - Real-time integration tests (M3.3)
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal, WritableSignal } from '@angular/core';
import { OrderDetailPage } from './order-detail.page';
import { Order, OrderStatus, PaymentStatus } from '../../models/order.model';
import { OrderStatusService, OrderStatusInfo } from '../../services/order-status.service';
import { ToastService, ToastOptions } from '../../services/toast.service';

describe('OrderDetailPage', () => {
  let component: OrderDetailPage;
  let fixture: ComponentFixture<OrderDetailPage>;
  let router: Router;
  let activatedRoute: ActivatedRoute;

  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'ORD-2025-000001',
    userId: 'user-123',
    pharmacyId: 'pharmacy-456',
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
    status: OrderStatus.OUT_FOR_DELIVERY,
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
    estimatedDeliveryTime: 'Hoje, até 18h',
    trackingCode: 'BR123456789',
    notes: 'Entregar na portaria',
    prescriptionRequired: false,
    prescriptionVerified: false,
    statusHistory: [
      { status: OrderStatus.PENDING_PAYMENT, timestamp: new Date() },
      { status: OrderStatus.PAYMENT_CONFIRMED, timestamp: new Date() },
      { status: OrderStatus.PREPARING, timestamp: new Date() },
      { status: OrderStatus.OUT_FOR_DELIVERY, timestamp: new Date() }
    ],
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Mock ActivatedRoute
  let mockActivatedRoute: { snapshot: { paramMap: { get: (key: string) => string | null } } };

  // Mock OrderStatusService
  let mockOrderStatusService: {
    watchOrder: jasmine.Spy;
    unwatchOrder: jasmine.Spy;
    getStatusNotification: jasmine.Spy;
    getStatusLabel: jasmine.Spy;
    calculateProgress: jasmine.Spy;
    isFinalStatus: jasmine.Spy;
  };
  let mockStatusSignal: WritableSignal<OrderStatusInfo | null>;

  // Mock ToastService
  let mockToastService: {
    show: jasmine.Spy;
    success: jasmine.Spy;
    error: jasmine.Spy;
  };

  beforeEach(async () => {
    // Reset mock to no orderId
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: () => null
        }
      }
    };

    // Create mock status signal
    mockStatusSignal = signal<OrderStatusInfo | null>(null);

    // Mock OrderStatusService
    mockOrderStatusService = {
      watchOrder: jasmine.createSpy('watchOrder').and.returnValue(mockStatusSignal),
      unwatchOrder: jasmine.createSpy('unwatchOrder'),
      getStatusNotification: jasmine.createSpy('getStatusNotification').and.returnValue({
        icon: '✅',
        message: 'Test message',
        color: 'success'
      }),
      getStatusLabel: jasmine.createSpy('getStatusLabel').and.callFake((status: OrderStatus) => status),
      calculateProgress: jasmine.createSpy('calculateProgress').and.returnValue(50),
      isFinalStatus: jasmine.createSpy('isFinalStatus').and.returnValue(false)
    };

    // Mock ToastService
    mockToastService = {
      show: jasmine.createSpy('show').and.returnValue('toast-id'),
      success: jasmine.createSpy('success').and.returnValue('toast-id'),
      error: jasmine.createSpy('error').and.returnValue('toast-id')
    };

    await TestBed.configureTestingModule({
      imports: [OrderDetailPage, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: OrderStatusService, useValue: mockOrderStatusService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailPage);
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

    it('deve ter statusSteps definidos', () => {
      expect(component.statusSteps().length).toBe(5);
    });

    it('deve ter statusSteps com labels corretos', () => {
      const steps = component.statusSteps();
      expect(steps[0].label).toBe('Pagamento');
      expect(steps[4].label).toBe('Entregue');
    });
  });

  // ============================================
  // TESTES DE CARREGAMENTO
  // ============================================

  describe('Loading', () => {
    it('deve definir error se orderId não informado', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.error()).toBe('ID do pedido não informado');
      expect(component.loading()).toBe(false);
    }));

    it('deve carregar pedido mock quando orderService não disponível', fakeAsync(() => {
      mockActivatedRoute.snapshot.paramMap.get = () => 'order-123';
      
      component.ngOnInit();
      tick();

      expect(component.order()).toBeTruthy();
      expect(component.loading()).toBe(false);
    }));

    it('deve definir loading false após carregar', fakeAsync(() => {
      mockActivatedRoute.snapshot.paramMap.get = () => 'order-123';
      
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
      expect(component.isStepCompleted(OrderStatus.PENDING_PAYMENT)).toBe(true);
      expect(component.isStepCompleted(OrderStatus.PAYMENT_CONFIRMED)).toBe(true);
      expect(component.isStepCompleted(OrderStatus.PREPARING)).toBe(true);
    });

    it('deve não marcar step como completed se atual ou posterior', () => {
      expect(component.isStepCompleted(OrderStatus.OUT_FOR_DELIVERY)).toBe(false);
      expect(component.isStepCompleted(OrderStatus.DELIVERED)).toBe(false);
    });

    it('deve identificar current step', () => {
      expect(component.isCurrentStep(OrderStatus.OUT_FOR_DELIVERY)).toBe(true);
      expect(component.isCurrentStep(OrderStatus.PREPARING)).toBe(false);
    });

    it('deve retornar data do step se existir no histórico', () => {
      const date = component.getStepDate(OrderStatus.PAYMENT_CONFIRMED);
      expect(date).toBeTruthy();
    });

    it('deve retornar string vazia se step não no histórico', () => {
      const date = component.getStepDate(OrderStatus.DELIVERED);
      expect(date).toBe('');
    });

    it('deve retornar string vazia se order sem histórico', () => {
      component.order.set({ ...mockOrder, statusHistory: undefined } as any);
      const date = component.getStepDate(OrderStatus.PAYMENT_CONFIRMED);
      expect(date).toBe('');
    });
  });

  // ============================================
  // TESTES DE AÇÕES
  // ============================================

  describe('Actions', () => {
    it('deve permitir cancelar pedido pendente', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PENDING_PAYMENT });
      expect(component.canCancel()).toBe(true);
    });

    it('deve permitir cancelar pedido confirmado', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PAYMENT_CONFIRMED });
      expect(component.canCancel()).toBe(true);
    });

    it('deve não permitir cancelar pedido em preparo', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PREPARING });
      expect(component.canCancel()).toBe(false);
    });

    it('deve não permitir cancelar pedido em trânsito', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.OUT_FOR_DELIVERY });
      expect(component.canCancel()).toBe(false);
    });

    it('deve não permitir cancelar pedido entregue', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.DELIVERED });
      expect(component.canCancel()).toBe(false);
    });

    it('deve retornar false para canCancel se order null', () => {
      component.order.set(null);
      expect(component.canCancel()).toBe(false);
    });

    it('deve permitir refazer pedido entregue', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.DELIVERED });
      expect(component.canReorder()).toBe(true);
    });

    it('deve permitir refazer pedido cancelado', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.CANCELED });
      expect(component.canReorder()).toBe(true);
    });

    it('deve permitir refazer pedido completo', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.COMPLETED });
      expect(component.canReorder()).toBe(true);
    });

    it('deve não permitir refazer pedido em andamento', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PREPARING });
      expect(component.canReorder()).toBe(false);
    });

    it('deve retornar false para canReorder se order null', () => {
      component.order.set(null);
      expect(component.canReorder()).toBe(false);
    });

    it('deve navegar para carrinho ao refazer pedido', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.order.set(mockOrder);

      component.reorder();

      expect(navigateSpy).toHaveBeenCalledWith(['/cart']);
    });

    it('deve copiar código de rastreio', () => {
      component.order.set(mockOrder);
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      component.copyTrackingCode();

      expect(clipboardSpy).toHaveBeenCalledWith('BR123456789');
    });

    it('deve não copiar se sem código de rastreio', () => {
      component.order.set({ ...mockOrder, trackingCode: undefined });
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText');

      component.copyTrackingCode();

      expect(clipboardSpy).not.toHaveBeenCalled();
    });

    it('deve copiar código PIX', () => {
      component.order.set({ ...mockOrder, pixCode: 'PIX123' });
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      component.copyPixCode();

      expect(clipboardSpy).toHaveBeenCalledWith('PIX123');
    });
  });

  // ============================================
  // TESTES DE FORMATAÇÃO
  // ============================================

  describe('Formatting', () => {
    it('deve formatar data corretamente', () => {
      const date = new Date('2025-12-25');
      const formatted = component.formatDate(date);
      expect(formatted).toContain('25');
      expect(formatted).toContain('2025');
    });

    it('deve formatar data/hora corretamente', () => {
      const date = new Date('2025-12-25T14:30:00');
      const formatted = component.formatDateTime(date);
      expect(formatted).toContain('25');
    });

    it('deve formatar endereço corretamente', () => {
      const address = {
        recipientName: 'João',
        phone: '99999-9999',
        street: 'Rua A',
        number: '123',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234-567'
      };
      const formatted = component.formatAddress(address);
      expect(formatted).toContain('Rua A');
      expect(formatted).toContain('123');
      expect(formatted).toContain('Centro');
    });

    it('deve retornar string vazia para endereço undefined', () => {
      const formatted = component.formatAddress(undefined);
      expect(formatted).toBe('');
    });

    it('deve formatar moeda corretamente', () => {
      const formatted = component.formatCurrency(1990);
      expect(formatted).toContain('19');
      expect(formatted).toContain('90');
    });

    it('deve retornar label correto para status', () => {
      expect(component.getStatusLabel(OrderStatus.PENDING_PAYMENT)).toBe('Aguardando Pagamento');
      expect(component.getStatusLabel(OrderStatus.DELIVERED)).toBe('Entregue');
    });

    it('deve retornar classe correta para cada status', () => {
      expect(component.getStatusClass(OrderStatus.PENDING_PAYMENT)).toBe('pending');
      expect(component.getStatusClass(OrderStatus.PAYMENT_CONFIRMED)).toBe('confirmed');
      expect(component.getStatusClass(OrderStatus.PREPARING)).toBe('preparing');
      expect(component.getStatusClass(OrderStatus.OUT_FOR_DELIVERY)).toBe('shipped');
      expect(component.getStatusClass(OrderStatus.DELIVERED)).toBe('delivered');
      expect(component.getStatusClass(OrderStatus.CANCELED)).toBe('canceled');
    });
  });

  // ============================================
  // TESTES DE PAGAMENTO
  // ============================================

  describe('Payment Info', () => {
    it('deve retornar ícone correto para PIX', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'pix' });
      expect(component.getPaymentMethodIcon()).toBe('⚡');
    });

    it('deve retornar ícone correto para cartão de crédito', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'credit_card' });
      expect(component.getPaymentMethodIcon()).toBe('💳');
    });

    it('deve retornar ícone correto para boleto', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'boleto' });
      expect(component.getPaymentMethodIcon()).toBe('📄');
    });

    it('deve retornar ícone padrão para método desconhecido', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'unknown' } as any);
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

    it('deve retornar classe correta para pagamento pago', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PAID });
      expect(component.getPaymentStatusClass()).toBe('paid');
    });

    it('deve retornar classe correta para pagamento pendente', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PENDING });
      expect(component.getPaymentStatusClass()).toBe('pending');
    });

    it('deve retornar classe correta para pagamento falhou', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.FAILED });
      expect(component.getPaymentStatusClass()).toBe('failed');
    });

    it('deve retornar label correto para cada status de pagamento', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PAID });
      expect(component.getPaymentStatusLabel()).toBe('Pago');

      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.PENDING });
      expect(component.getPaymentStatusLabel()).toBe('Aguardando');
    });
  });

  // ============================================
  // TESTES DE RENDERIZAÇÃO
  // ============================================

  describe('Rendering', () => {
    // Helper to setup component state
    const setupState = (config: { loading: boolean; error: string | null; order: Order | null }) => {
      fixture.detectChanges(); // Trigger ngOnInit
      component.loading.set(config.loading);
      component.error.set(config.error);
      component.order.set(config.order);
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

    it('deve renderizar detalhes do pedido', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.order-content')).toBeTruthy();
    });

    it('deve exibir número do pedido', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('ORD-2025-000001');
    });

    it('deve exibir status badge', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      // Agora usa OrderStatusBadgeComponent em vez de span.status-badge
      expect(compiled.querySelector('app-order-status-badge')).toBeTruthy();
    });

    it('deve exibir timeline de status', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.timeline')).toBeTruthy();
    });

    it('deve exibir itens do pedido', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.items-list')).toBeTruthy();
      expect(compiled.textContent).toContain('Dipirona 500mg');
    });

    it('deve exibir resumo do pedido', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.summary-card')).toBeTruthy();
    });

    it('deve exibir desconto quando aplicado', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.discount')).toBeTruthy();
    });

    it('deve exibir código de rastreio quando presente', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.tracking-info')).toBeTruthy();
      expect(compiled.textContent).toContain('BR123456789');
    });

    it('deve exibir observações quando presentes', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Entregar na portaria');
    });

    it('deve exibir endereço de entrega para delivery', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.address-card')).toBeTruthy();
      expect(compiled.textContent).toContain('João Silva');
    });

    it('deve exibir info de retirada para pickup', () => {
      setupState({ loading: false, error: null, order: { ...mockOrder, deliveryType: 'pickup' } });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pickup-card')).toBeTruthy();
      expect(compiled.textContent).toContain('Farmácia Central');
    });

    it('deve exibir seção de ajuda', () => {
      setupState({ loading: false, error: null, order: mockOrder });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.help-section')).toBeTruthy();
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    // Helper to setup component state for edge case tests
    const setupEdgeState = (order: Order | null) => {
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

    it('deve lidar com pedido sem código de rastreio', () => {
      setupEdgeState({ ...mockOrder, trackingCode: undefined });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.tracking-info')).toBeFalsy();
    });

    it('deve lidar com pedido sem notas', () => {
      setupEdgeState({ ...mockOrder, notes: undefined });

      const compiled = fixture.nativeElement;
      const notesSection = compiled.querySelector('.notes-section');
      // Se não existir seção de notas, ou se existir mas não tiver "Suas observações", está correto
      expect(notesSection === null || !notesSection.textContent.includes('Suas observações')).toBe(true);
    });

    it('deve lidar com frete grátis', () => {
      setupEdgeState({ ...mockOrder, deliveryFee: 0 });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Grátis');
    });

    it('deve lidar com pedido sem desconto', () => {
      setupEdgeState({ ...mockOrder, discount: 0 });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.summary-line.discount')).toBeFalsy();
    });

    it('deve exibir botão cancelar para pedido pendente', () => {
      setupEdgeState({ ...mockOrder, status: OrderStatus.PENDING_PAYMENT });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.btn-danger')).toBeTruthy();
    });

    it('deve não exibir botão cancelar para pedido entregue', () => {
      setupEdgeState({ ...mockOrder, status: OrderStatus.DELIVERED });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.btn-danger')).toBeFalsy();
    });

    it('deve exibir botão refazer para pedido entregue', () => {
      setupEdgeState({ ...mockOrder, status: OrderStatus.DELIVERED });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Refazer Pedido');
    });

    it('deve tratar pedido cancelado na timeline', () => {
      setupEdgeState({ ...mockOrder, status: OrderStatus.CANCELED });

      const compiled = fixture.nativeElement;
      const canceledStep = compiled.querySelector('.timeline-step.canceled');
      expect(canceledStep).toBeTruthy();
    });

    it('deve retornar classe pending para status desconhecido', () => {
      // O método retorna 'pending' como default para status desconhecido
      expect(component.getStatusClass('unknown' as OrderStatus)).toBe('pending');
    });

    it('deve retornar status como label para status desconhecido', () => {
      // O método retorna o próprio status se não encontrado no ORDER_STATUS_LABELS
      expect(component.getStatusLabel('unknown' as OrderStatus)).toBe('unknown');
    });

    it('deve lidar com payment status refunded retornando label correto', () => {
      component.order.set({ ...mockOrder, paymentStatus: PaymentStatus.REFUNDED });
      // getPaymentStatusClass retorna 'pending' pra refunded por default
      expect(component.getPaymentStatusClass()).toBe('pending');
      // getPaymentStatusLabel retorna 'Reembolsado' para refunded
      expect(component.getPaymentStatusLabel()).toBe('Reembolsado');
    });

    it('deve retornar ícone correto para cartão de débito', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'debit_card' });
      expect(component.getPaymentMethodIcon()).toBe('💳');
    });

    it('deve retornar nome correto para cartão de débito', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'debit_card' });
      expect(component.getPaymentMethodName()).toBe('Cartão de Débito');
    });

    it('deve retornar nome correto para boleto', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'boleto' });
      expect(component.getPaymentMethodName()).toBe('Boleto Bancário');
    });

    it('deve retornar método como nome para método desconhecido', () => {
      component.order.set({ ...mockOrder, paymentMethod: 'unknown' } as any);
      // Retorna o próprio método se não está no mapa
      expect(component.getPaymentMethodName()).toBe('unknown');
    });

    it('deve chamar confirm ao chamar cancelOrder', () => {
      component.order.set(mockOrder);
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.cancelOrder();
      
      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja cancelar este pedido?');
    });

    it('deve logar quando confirm retorna true', () => {
      component.order.set(mockOrder);
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'log');
      
      component.cancelOrder();
      
      expect(console.log).toHaveBeenCalledWith('Cancelando pedido...');
    });

    it('deve não copiar pix code se não existir', () => {
      component.order.set({ ...mockOrder, pixCode: undefined });
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText');
      
      component.copyPixCode();
      
      expect(clipboardSpy).not.toHaveBeenCalled();
    });

    it('deve formatar endereço sem incluir complemento (formatAddress não usa complement)', () => {
      const address = {
        recipientName: 'João',
        phone: '99999-9999',
        street: 'Rua A',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234-567'
      };
      const formatted = component.formatAddress(address);
      // O método formatAddress não inclui complement na string
      expect(formatted).toContain('Rua A, 123');
      expect(formatted).toContain('Centro');
    });

    it('deve não permitir cancelar pedido com status PRESCRIPTION_PENDING', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.PRESCRIPTION_PENDING });
      // PRESCRIPTION_PENDING não está na lista de status canceláveis
      expect(component.canCancel()).toBe(false);
    });

    it('deve não permitir cancelar pedido com status DELIVERED', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.DELIVERED });
      expect(component.canCancel()).toBe(false);
    });

    it('deve verificar status COMPLETED retorna false pois não está na statusOrder list', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.COMPLETED });
      // COMPLETED não está na lista statusOrder, então currentIndex = -1
      // E qualquer stepIndex será >= currentIndex, retornando false
      expect(component.isStepCompleted(OrderStatus.DELIVERED)).toBe(false);
    });

    it('deve verificar current step para READY_FOR_PICKUP', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.READY_FOR_PICKUP });
      expect(component.isCurrentStep(OrderStatus.READY_FOR_PICKUP)).toBe(true);
    });

    it('deve retornar string vazia para paymentMethod não definido', () => {
      component.order.set({ ...mockOrder, paymentMethod: undefined } as any);
      expect(component.getPaymentMethodName()).toBe('');
    });

    it('deve retornar ícone default para paymentMethod não definido', () => {
      component.order.set({ ...mockOrder, paymentMethod: undefined } as any);
      expect(component.getPaymentMethodIcon()).toBe('💰');
    });

    it('deve verificar READY_FOR_PICKUP como status válido', () => {
      component.order.set({ ...mockOrder, status: OrderStatus.READY_FOR_PICKUP });
      expect(component.getStatusClass(OrderStatus.READY_FOR_PICKUP)).toBe('preparing');
    });

    it('deve verificar REFUNDED como status canceled class', () => {
      expect(component.getStatusClass(OrderStatus.REFUNDED)).toBe('canceled');
    });
  });

  // ============================================
  // TESTES DE REAL-TIME (M3.3)
  // ============================================

  describe('Real-Time Integration (M3.3)', () => {
    beforeEach(fakeAsync(() => {
      mockActivatedRoute.snapshot.paramMap.get = () => 'order-123';
      fixture = TestBed.createComponent(OrderDetailPage);
      component = fixture.componentInstance;
      component.ngOnInit();
      tick();
    }));

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('deve iniciar watchOrder ao carregar pedido', fakeAsync(() => {
      expect(mockOrderStatusService.watchOrder).toHaveBeenCalledWith(
        'order-123',
        jasmine.objectContaining({
          notifyOnChange: true,
          onStatusChange: jasmine.any(Function)
        })
      );
    }));

    it('deve parar de monitorar ao destruir componente', fakeAsync(() => {
      component.ngOnDestroy();
      tick();
      
      expect(mockOrderStatusService.unwatchOrder).toHaveBeenCalledWith('order-123');
    }));

    it('deve ter currentStatus computed corretamente', fakeAsync(() => {
      component.order.set(mockOrder);
      tick();
      
      expect(component.currentStatus()).toBe(OrderStatus.OUT_FOR_DELIVERY);
    }));

    it('deve atualizar status via real-time signal', fakeAsync(() => {
      component.order.set(mockOrder);
      
      // Simula atualização real-time
      const realtimeStatus: OrderStatusInfo = {
        orderId: 'order-123',
        orderNumber: 'ORD-2025-000001',
        status: OrderStatus.DELIVERED,
        previousStatus: OrderStatus.OUT_FOR_DELIVERY,
        updatedAt: new Date(),
        trackingCode: 'BR123456789',
        estimatedDelivery: null,
        pharmacyNotes: null,
        statusHistory: []
      };
      
      // Acessa diretamente o signal privado para simular atualização
      (component as any).realtimeStatus.set(realtimeStatus);
      tick();
      
      // O currentStatus deve refletir o real-time
      expect(component.currentStatus()).toBe(OrderStatus.DELIVERED);
    }));

    it('deve chamar onStatusChange callback quando status muda', fakeAsync(() => {
      // Obter o callback registrado
      const watchOrderCall = mockOrderStatusService.watchOrder.calls.mostRecent();
      const options = watchOrderCall.args[1];
      
      expect(options.onStatusChange).toBeDefined();
      
      // Simula callback de mudança de status
      options.onStatusChange(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);
      tick();
      
      // Deve mostrar toast
      expect(mockToastService.show).toHaveBeenCalled();
    }));

    it('deve mostrar toast com informações corretas na mudança de status', fakeAsync(() => {
      // Obter o callback registrado
      const watchOrderCall = mockOrderStatusService.watchOrder.calls.mostRecent();
      const options = watchOrderCall.args[1];
      
      // Simula callback
      options.onStatusChange(OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY);
      tick();
      
      // Verifica toast
      expect(mockOrderStatusService.getStatusNotification).toHaveBeenCalledWith(OrderStatus.OUT_FOR_DELIVERY);
      expect(mockToastService.show).toHaveBeenCalledWith(jasmine.objectContaining({
        message: jasmine.stringContaining('Test message'),
        color: 'success',
        duration: 5000,
        dismissible: true
      }));
    }));

    it('deve limpar interval ao destruir', fakeAsync(() => {
      // Verifica que o interval existe
      expect((component as any).statusCheckInterval).toBeTruthy();
      
      component.ngOnDestroy();
      tick();
      
      // Verifica que foi limpo
      expect((component as any).statusCheckInterval).toBeNull();
    }));

    it('não deve iniciar watch se orderId não fornecido', fakeAsync(() => {
      mockOrderStatusService.watchOrder.calls.reset();
      mockActivatedRoute.snapshot.paramMap.get = () => null;
      
      const newFixture = TestBed.createComponent(OrderDetailPage);
      const newComponent = newFixture.componentInstance;
      newComponent.ngOnInit();
      tick();
      
      expect(mockOrderStatusService.watchOrder).not.toHaveBeenCalled();
    }));

    it('deve armazenar currentOrderId corretamente', fakeAsync(() => {
      expect((component as any).currentOrderId).toBe('order-123');
    }));

    it('deve ter realtimeStatus signal inicializado', fakeAsync(() => {
      expect((component as any).realtimeStatus).toBeDefined();
      expect((component as any).realtimeStatus()).toBeNull();
    }));

    it('deve preferir status real-time sobre order.status', fakeAsync(() => {
      component.order.set(mockOrder); // OUT_FOR_DELIVERY
      
      // Simula real-time com status diferente
      const realtimeStatus: OrderStatusInfo = {
        orderId: 'order-123',
        orderNumber: 'ORD-2025-000001',
        status: OrderStatus.COMPLETED,
        previousStatus: OrderStatus.DELIVERED,
        updatedAt: new Date(),
        trackingCode: null,
        estimatedDelivery: null,
        pharmacyNotes: null,
        statusHistory: []
      };
      
      // Acessa diretamente o signal privado para teste
      (component as any).realtimeStatus.set(realtimeStatus);
      tick();
      
      // currentStatus deve retornar o real-time
      expect(component.currentStatus()).toBe(OrderStatus.COMPLETED);
    }));

    it('deve usar order.status se realtimeStatus for null', fakeAsync(() => {
      component.order.set({ ...mockOrder, status: OrderStatus.PREPARING });
      (component as any).realtimeStatus.set(null);
      tick();
      
      expect(component.currentStatus()).toBe(OrderStatus.PREPARING);
    }));
  });
});
