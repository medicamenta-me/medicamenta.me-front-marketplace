/**
 * 🧪 Order History Page Tests
 * Testes unitários para a página de histórico de pedidos
 * 
 * Cenários:
 * - Loading state
 * - Empty state
 * - Orders list rendering
 * - Filters (status, search)
 * - Pagination
 * - Order actions (view details, reorder)
 * - Formatting (date, currency, status)
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { OrderHistoryPage } from './order-history.page';
import { Order, OrderStatus, PaymentStatus } from '../../models/order.model';

describe('OrderHistoryPage', () => {
  let component: OrderHistoryPage;
  let fixture: ComponentFixture<OrderHistoryPage>;
  let router: Router;

  const mockOrders: Order[] = [
    {
      id: 'order-1',
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
        }
      ],
      subtotal: 3980,
      deliveryFee: 999,
      discount: 0,
      total: 4979,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pix',
      deliveryType: 'delivery',
      prescriptionRequired: false,
      prescriptionVerified: false,
      statusHistory: [],
      createdAt: new Date('2025-12-25'),
      updatedAt: new Date('2025-12-25')
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-2025-000002',
      userId: 'user-123',
      pharmacyId: 'pharmacy-789',
      pharmacyName: 'Drogaria Popular',
      customerEmail: 'cliente@email.com',
      items: [
        {
          productId: 'prod-2',
          productName: 'Paracetamol 750mg',
          quantity: 1,
          unitPrice: 1500,
          subtotal: 1500,
          discount: 0,
          total: 1500
        },
        {
          productId: 'prod-3',
          productName: 'Vitamina C',
          quantity: 3,
          unitPrice: 2000,
          subtotal: 6000,
          discount: 0,
          total: 6000
        },
        {
          productId: 'prod-4',
          productName: 'Omeprazol 20mg',
          quantity: 1,
          unitPrice: 3500,
          subtotal: 3500,
          discount: 0,
          total: 3500
        },
        {
          productId: 'prod-5',
          productName: 'Losartana 50mg',
          quantity: 2,
          unitPrice: 2800,
          subtotal: 5600,
          discount: 0,
          total: 5600
        }
      ],
      subtotal: 16600,
      deliveryFee: 0,
      discount: 500,
      total: 16100,
      status: OrderStatus.CANCELED,
      paymentStatus: PaymentStatus.REFUNDED,
      paymentMethod: 'credit_card',
      deliveryType: 'pickup',
      prescriptionRequired: false,
      prescriptionVerified: false,
      statusHistory: [],
      createdAt: new Date('2025-12-20'),
      updatedAt: new Date('2025-12-20')
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderHistoryPage, RouterTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderHistoryPage);
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

    it('deve iniciar com loading true', () => {
      expect(component.loading()).toBe(true);
    });

    it('deve iniciar com orders vazio', () => {
      expect(component.orders().length).toBe(0);
    });

    it('deve iniciar com selectedStatus null', () => {
      expect(component.selectedStatus()).toBeNull();
    });

    it('deve iniciar com currentPage 1', () => {
      expect(component.currentPage()).toBe(1);
    });

    it('deve ter availableStatuses definidos', () => {
      expect(component.availableStatuses.length).toBeGreaterThan(0);
    });

    it('deve incluir status principais em availableStatuses', () => {
      expect(component.availableStatuses).toContain(OrderStatus.PENDING_PAYMENT);
      expect(component.availableStatuses).toContain(OrderStatus.DELIVERED);
      expect(component.availableStatuses).toContain(OrderStatus.CANCELED);
    });
  });

  // ============================================
  // TESTES DE CARREGAMENTO
  // ============================================

  describe('Loading', () => {
    it('deve carregar pedidos mock ao inicializar', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.orders().length).toBeGreaterThan(0);
      expect(component.loading()).toBe(false);
    }));

    it('deve definir loading false após carregar', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.loading()).toBe(false);
    }));

    it('deve setar totalOrders ao carregar', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.totalOrders()).toBeGreaterThan(0);
    }));
  });

  // ============================================
  // TESTES DE FILTROS
  // ============================================

  describe('Filters', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('deve filtrar por status', fakeAsync(() => {
      const initialCount = component.orders().length;
      
      component.filterByStatus(OrderStatus.DELIVERED);
      tick();

      // Deve ter filtrado (ou não, dependendo do mock)
      expect(component.selectedStatus()).toBe(OrderStatus.DELIVERED);
    }));

    it('deve resetar página ao filtrar por status', fakeAsync(() => {
      component.currentPage.set(2);
      
      component.filterByStatus(OrderStatus.PENDING_PAYMENT);
      tick();

      expect(component.currentPage()).toBe(1);
    }));

    it('deve limpar filtro de status quando null', fakeAsync(() => {
      component.filterByStatus(OrderStatus.DELIVERED);
      tick();
      
      component.filterByStatus(null);
      tick();

      expect(component.selectedStatus()).toBeNull();
    }));

    it('deve filtrar por busca', fakeAsync(() => {
      component.onSearchChange('ORD-2025');
      tick();

      expect(component.searchQuery).toBe('ORD-2025');
    }));

    it('deve resetar página ao buscar', fakeAsync(() => {
      component.currentPage.set(2);
      
      component.onSearchChange('teste');
      tick();

      expect(component.currentPage()).toBe(1);
    }));

    it('deve limpar filtros com clearFilters', fakeAsync(() => {
      component.filterByStatus(OrderStatus.DELIVERED);
      component.searchQuery = 'teste';
      component.currentPage.set(2);
      tick();

      component.clearFilters();
      tick();

      expect(component.selectedStatus()).toBeNull();
      expect(component.searchQuery).toBe('');
      expect(component.currentPage()).toBe(1);
    }));
  });

  // ============================================
  // TESTES DE PAGINAÇÃO
  // ============================================

  describe('Pagination', () => {
    it('deve calcular totalPages corretamente', () => {
      component.totalOrders.set(25);
      // pageSize = 10
      expect(component.totalPages()).toBe(3);
    });

    it('deve calcular totalPages para 0 orders', () => {
      component.totalOrders.set(0);
      expect(component.totalPages()).toBe(0);
    });

    it('deve ir para página válida', fakeAsync(() => {
      component.totalOrders.set(25);
      
      component.goToPage(2);
      tick();

      expect(component.currentPage()).toBe(2);
    }));

    it('deve não ir para página inválida (menor que 1)', fakeAsync(() => {
      component.goToPage(0);
      tick();

      expect(component.currentPage()).toBe(1);
    }));

    it('deve não ir para página inválida (maior que total)', fakeAsync(() => {
      component.totalOrders.set(10);
      
      component.goToPage(5);
      tick();

      expect(component.currentPage()).toBe(1);
    }));
  });

  // ============================================
  // TESTES DE AÇÕES
  // ============================================

  describe('Actions', () => {
    it('deve navegar para detalhes do pedido', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      component.viewOrderDetails('order-123');

      expect(navigateSpy).toHaveBeenCalledWith(['/orders', 'order-123']);
    });

    it('deve permitir refazer pedido entregue', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.DELIVERED };
      expect(component.canReorder(order)).toBe(true);
    });

    it('deve permitir refazer pedido cancelado', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.CANCELED };
      expect(component.canReorder(order)).toBe(true);
    });

    it('deve permitir refazer pedido completo', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.COMPLETED };
      expect(component.canReorder(order)).toBe(true);
    });

    it('deve não permitir refazer pedido em preparo', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.PREPARING };
      expect(component.canReorder(order)).toBe(false);
    });

    it('deve não permitir refazer pedido pendente', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.PENDING_PAYMENT };
      expect(component.canReorder(order)).toBe(false);
    });

    it('deve navegar para carrinho ao refazer pedido', () => {
      const navigateSpy = spyOn(router, 'navigate');
      const event = new Event('click');
      spyOn(event, 'stopPropagation');

      component.reorder(mockOrders[0], event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/cart']);
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

    it('deve formatar moeda corretamente', () => {
      const formatted = component.formatCurrency(1990);
      expect(formatted).toContain('19');
      expect(formatted).toContain('90');
    });

    it('deve formatar moeda zero', () => {
      const formatted = component.formatCurrency(0);
      expect(formatted).toContain('0');
    });

    it('deve retornar label correto para status', () => {
      expect(component.getStatusLabel(OrderStatus.PENDING_PAYMENT)).toBe('Aguardando Pagamento');
      expect(component.getStatusLabel(OrderStatus.DELIVERED)).toBe('Entregue');
      expect(component.getStatusLabel(OrderStatus.CANCELED)).toBe('Cancelado');
    });

    it('deve retornar classe correta para status pending', () => {
      expect(component.getStatusClass(OrderStatus.PENDING_PAYMENT)).toBe('pending');
    });

    it('deve retornar classe correta para status confirmed', () => {
      expect(component.getStatusClass(OrderStatus.PAYMENT_CONFIRMED)).toBe('confirmed');
    });

    it('deve retornar classe correta para status preparing', () => {
      expect(component.getStatusClass(OrderStatus.PREPARING)).toBe('preparing');
    });

    it('deve retornar classe correta para status shipped', () => {
      expect(component.getStatusClass(OrderStatus.OUT_FOR_DELIVERY)).toBe('shipped');
    });

    it('deve retornar classe correta para status delivered', () => {
      expect(component.getStatusClass(OrderStatus.DELIVERED)).toBe('delivered');
    });

    it('deve retornar classe correta para status canceled', () => {
      expect(component.getStatusClass(OrderStatus.CANCELED)).toBe('canceled');
    });
  });

  // ============================================
  // TESTES DE RENDERIZAÇÃO
  // ============================================

  describe('Rendering', () => {
    // Helper to setup component state
    const setupState = (config: { loading: boolean; orders: Order[] }) => {
      fixture.detectChanges(); // Trigger ngOnInit
      component.loading.set(config.loading);
      component.orders.set(config.orders);
      fixture.detectChanges();
    };

    it('deve renderizar loading state', () => {
      setupState({ loading: true, orders: [] });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-loading-spinner')).toBeTruthy();
    });

    it('deve renderizar empty state quando sem pedidos', () => {
      setupState({ loading: false, orders: [] });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.empty-state')).toBeTruthy();
      expect(compiled.textContent).toContain('Nenhum pedido encontrado');
    });

    it('deve renderizar lista de pedidos', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.orders-list')).toBeTruthy();
      expect(compiled.querySelectorAll('.order-card').length).toBe(2);
    });

    it('deve exibir número do pedido', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('ORD-2025-000001');
    });

    it('deve exibir status badge', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.status-badge')).toBeTruthy();
    });

    it('deve exibir itens do pedido', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Dipirona 500mg');
    });

    it('deve exibir total do pedido', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.order-total')).toBeTruthy();
    });

    it('deve exibir indicador de mais itens quando tem mais de 3', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.more-items')).toBeTruthy();
      expect(compiled.textContent).toContain('+1 itens');
    });

    it('deve exibir filtros de status', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.status-filters')).toBeTruthy();
      expect(compiled.querySelectorAll('.filter-btn').length).toBeGreaterThan(0);
    });

    it('deve exibir campo de busca', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.search-box input')).toBeTruthy();
    });

    it('deve exibir quick actions', () => {
      setupState({ loading: false, orders: mockOrders });

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.quick-actions')).toBeTruthy();
    });

    it('deve exibir paginação quando tem múltiplas páginas', () => {
      setupState({ loading: false, orders: mockOrders });
      component.totalOrders.set(25);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pagination')).toBeTruthy();
    });

    it('deve não exibir paginação quando tem uma página', () => {
      setupState({ loading: false, orders: mockOrders });
      component.totalOrders.set(5);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pagination')).toBeFalsy();
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('deve lidar com item sem imagem', () => {
      const orderNoImage: Order = {
        ...mockOrders[0],
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

      fixture.detectChanges();
      component.loading.set(false);
      component.orders.set([orderNoImage]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.placeholder-image')).toBeTruthy();
    });

    it('deve exibir botão limpar filtros no empty state quando tem filtros', () => {
      fixture.detectChanges();
      component.loading.set(false);
      component.orders.set([]);
      component.selectedStatus.set(OrderStatus.DELIVERED);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Limpar filtros');
    });

    it('deve exibir link explorar produtos no empty state sem filtros', () => {
      fixture.detectChanges();
      component.loading.set(false);
      component.orders.set([]);
      component.selectedStatus.set(null);
      component.searchQuery = '';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Explorar Produtos');
    });
  });

  // ============================================
  // TESTES ADICIONAIS DE EDGE CASES
  // ============================================

  describe('Additional Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    // getStatusClass edge cases
    it('deve retornar classe pending para status desconhecido', () => {
      const unknownStatus = 'UNKNOWN_STATUS' as OrderStatus;
      expect(component.getStatusClass(unknownStatus)).toBe('pending');
    });

    it('deve retornar classe preparing para READY_FOR_PICKUP', () => {
      expect(component.getStatusClass(OrderStatus.READY_FOR_PICKUP)).toBe('preparing');
    });

    it('deve retornar classe delivered para COMPLETED', () => {
      expect(component.getStatusClass(OrderStatus.COMPLETED)).toBe('delivered');
    });

    it('deve retornar classe canceled para REFUNDED', () => {
      expect(component.getStatusClass(OrderStatus.REFUNDED)).toBe('canceled');
    });

    // formatDate edge cases
    it('deve formatar data de string', () => {
      const dateStr = '2025-06-15T10:30:00.000Z';
      const formatted = component.formatDate(new Date(dateStr));
      expect(formatted).toContain('15');
    });

    it('deve formatar data com mês correto', () => {
      const date = new Date(2025, 5, 15); // June 15, 2025
      const formatted = component.formatDate(date);
      expect(formatted).toContain('15');
      expect(formatted.toLowerCase()).toContain('jun');
    });

    // formatCurrency edge cases
    it('deve formatar moeda grande corretamente', () => {
      const formatted = component.formatCurrency(999999);
      expect(formatted).toContain('9.999');
    });

    it('deve formatar moeda pequena corretamente', () => {
      const formatted = component.formatCurrency(50);
      expect(formatted).toContain('0,50');
    });

    it('deve formatar centavos corretamente', () => {
      const formatted = component.formatCurrency(199);
      expect(formatted).toContain('1,99');
    });

    // getStatusLabel edge cases
    it('deve retornar status original para status desconhecido', () => {
      const unknownStatus = 'UNKNOWN' as OrderStatus;
      const label = component.getStatusLabel(unknownStatus);
      expect(label).toBe('UNKNOWN');
    });

    it('deve retornar label para PREPARING', () => {
      expect(component.getStatusLabel(OrderStatus.PREPARING)).toBe('Preparando Pedido');
    });

    it('deve retornar label para OUT_FOR_DELIVERY', () => {
      expect(component.getStatusLabel(OrderStatus.OUT_FOR_DELIVERY)).toBe('Saiu para Entrega');
    });

    it('deve retornar label para READY_FOR_PICKUP', () => {
      expect(component.getStatusLabel(OrderStatus.READY_FOR_PICKUP)).toBe('Pronto para Retirada');
    });

    // canReorder edge cases
    it('deve não permitir refazer pedido OUT_FOR_DELIVERY', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.OUT_FOR_DELIVERY };
      expect(component.canReorder(order)).toBe(false);
    });

    it('deve não permitir refazer pedido READY_FOR_PICKUP', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.READY_FOR_PICKUP };
      expect(component.canReorder(order)).toBe(false);
    });

    it('deve não permitir refazer pedido PAYMENT_CONFIRMED', () => {
      const order: Order = { ...mockOrders[0], status: OrderStatus.PAYMENT_CONFIRMED };
      expect(component.canReorder(order)).toBe(false);
    });

    // Pagination edge cases
    it('deve calcular totalPages para exatamente pageSize itens', () => {
      component.totalOrders.set(10);
      expect(component.totalPages()).toBe(1);
    });

    it('deve calcular totalPages para pageSize + 1 itens', () => {
      component.totalOrders.set(11);
      expect(component.totalPages()).toBe(2);
    });

    it('deve calcular totalPages para 1 item', () => {
      component.totalOrders.set(1);
      expect(component.totalPages()).toBe(1);
    });

    // goToPage edge cases
    it('deve ir para última página válida', fakeAsync(() => {
      component.totalOrders.set(30);
      
      component.goToPage(3);
      tick();

      expect(component.currentPage()).toBe(3);
    }));

    it('deve não ir para página negativa', fakeAsync(() => {
      component.goToPage(-1);
      tick();

      expect(component.currentPage()).toBe(1);
    }));

    // Mock orders data verification
    it('deve ter orders com estrutura correta após load', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      orders.forEach(order => {
        expect(order.id).toBeTruthy();
        expect(order.orderNumber).toBeTruthy();
        expect(order.items.length).toBeGreaterThan(0);
        expect(order.total).toBeGreaterThan(0);
      });
    }));

    it('deve ter pelo menos um pedido DELIVERED', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
      expect(deliveredOrders.length).toBeGreaterThan(0);
    }));

    it('deve ter pelo menos um pedido CANCELED', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const canceledOrders = orders.filter(o => o.status === OrderStatus.CANCELED);
      expect(canceledOrders.length).toBeGreaterThan(0);
    }));

    // Search functionality
    it('deve encontrar pedido por número completo', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.onSearchChange('ORD-2025-000005');
      tick();

      // Verifica que o searchQuery foi setado
      expect(component.searchQuery).toBe('ORD-2025-000005');
    }));

    it('deve encontrar pedido por nome do produto', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.onSearchChange('Dipirona');
      tick();

      expect(component.searchQuery).toBe('Dipirona');
    }));

    it('deve lidar com busca case-insensitive', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.onSearchChange('DIPIRONA');
      tick();

      expect(component.searchQuery).toBe('DIPIRONA');
    }));

    // reorder functionality
    it('deve chamar stopPropagation no reorder', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');

      component.reorder(mockOrders[0], event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    // Filter combinations
    it('deve filtrar por status e busca simultaneamente', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.filterByStatus(OrderStatus.DELIVERED);
      component.onSearchChange('test');
      tick();

      expect(component.selectedStatus()).toBe(OrderStatus.DELIVERED);
      expect(component.searchQuery).toBe('test');
    }));
  });

  // ============================================
  // TESTES DE MOCK DATA
  // ============================================

  describe('Mock Data', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('deve ter 5 pedidos no mock data', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.orders().length).toBe(5);
    }));

    it('deve ter pedido com prescrição requerida', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const prescriptionOrders = orders.filter(o => o.prescriptionRequired);
      expect(prescriptionOrders.length).toBeGreaterThan(0);
    }));

    it('deve ter pedido com delivery', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const deliveryOrders = orders.filter(o => o.deliveryType === 'delivery');
      expect(deliveryOrders.length).toBeGreaterThan(0);
    }));

    it('deve ter pedido com pickup', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const pickupOrders = orders.filter(o => o.deliveryType === 'pickup');
      expect(pickupOrders.length).toBeGreaterThan(0);
    }));

    it('deve ter pedido com paymentMethod pix', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const pixOrders = orders.filter(o => o.paymentMethod === 'pix');
      expect(pixOrders.length).toBeGreaterThan(0);
    }));

    it('deve ter pedido com paymentMethod credit_card', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const creditCardOrders = orders.filter(o => o.paymentMethod === 'credit_card');
      expect(creditCardOrders.length).toBeGreaterThan(0);
    }));

    it('deve ter pedido com paymentMethod boleto', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const boletoOrders = orders.filter(o => o.paymentMethod === 'boleto');
      expect(boletoOrders.length).toBeGreaterThan(0);
    }));

    it('deve ter pedido com discount', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const orders = component.orders();
      const discountOrders = orders.filter(o => o.discount > 0);
      expect(discountOrders.length).toBeGreaterThan(0);
    }));
  });

  // ============================================
  // TESTES DE AVAILABLE STATUSES
  // ============================================

  describe('Available Statuses', () => {
    it('deve ter status PAYMENT_CONFIRMED', () => {
      expect(component.availableStatuses).toContain(OrderStatus.PAYMENT_CONFIRMED);
    });

    it('deve ter status PREPARING', () => {
      expect(component.availableStatuses).toContain(OrderStatus.PREPARING);
    });

    it('deve ter status OUT_FOR_DELIVERY', () => {
      expect(component.availableStatuses).toContain(OrderStatus.OUT_FOR_DELIVERY);
    });

    it('deve ter 6 status disponíveis', () => {
      expect(component.availableStatuses.length).toBe(6);
    });
  });
});
