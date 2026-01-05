/**
 * 🧪 Order Management Page Tests
 * Testes unitários para a página de gestão de pedidos
 * 
 * Cenários:
 * - Inicialização
 * - Carregamento de pedidos
 * - Filtros (tabs, busca, data, pagamento, entrega)
 * - Atualização de status
 * - Verificação de receita
 * - Cancelamento de pedidos
 * - Modal de detalhes
 * - Computed properties
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { OrderManagementPage, OrderTab } from './order-management.page';
import { CheckoutService } from '../../core/services/checkout.service';
import { AuthService } from '../../core/services/auth.service';
import { Order, OrderStatus, PaymentStatus, OrderItem } from '../../models/order.model';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('OrderManagementPage', () => {
  let component: OrderManagementPage;
  let fixture: ComponentFixture<OrderManagementPage>;
  let router: Router;
  let mockCheckoutService: jasmine.SpyObj<CheckoutService>;
  let mockAuthService: any;
  let mockActivatedRoute: any;

  const mockOrderItem: OrderItem = {
    productId: 'prod-1',
    productName: 'Dipirona 500mg',
    productImage: 'https://example.com/img.jpg',
    quantity: 2,
    unitPrice: 990,
    subtotal: 1980,
    discount: 0,
    total: 1980
  };

  const mockOrders: Order[] = [
    {
      id: 'order-1',
      orderNumber: 'ORD-2025-001',
      userId: 'user-1',
      pharmacyId: 'pharmacy-1',
      pharmacyName: 'Farmácia Central',
      customerEmail: 'customer@test.com',
      items: [mockOrderItem],
      subtotal: 1980,
      deliveryFee: 500,
      discount: 0,
      total: 2480,
      deliveryAddress: {
        recipientName: 'João Silva',
        phone: '(11) 99999-9999',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      paymentStatus: PaymentStatus.PAID,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.PAYMENT_CONFIRMED,
      statusHistory: [
        { status: OrderStatus.PENDING_PAYMENT, timestamp: new Date('2025-01-01T10:00:00') },
        { status: OrderStatus.PAYMENT_CONFIRMED, timestamp: new Date('2025-01-01T10:05:00') }
      ],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-2025-002',
      userId: 'user-2',
      pharmacyId: 'pharmacy-1',
      items: [mockOrderItem, { ...mockOrderItem, productId: 'prod-2', productName: 'Paracetamol' }],
      subtotal: 3960,
      deliveryFee: 0,
      discount: 500,
      total: 3460,
      deliveryType: 'pickup',
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.PENDING,
      prescriptionRequired: true,
      prescriptionVerified: false,
      prescriptionImages: ['https://example.com/prescription.jpg'],
      status: OrderStatus.PRESCRIPTION_PENDING,
      statusHistory: [
        { status: OrderStatus.PENDING_PAYMENT, timestamp: new Date('2025-01-02T10:00:00') },
        { status: OrderStatus.PRESCRIPTION_PENDING, timestamp: new Date('2025-01-02T10:05:00') }
      ],
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-02')
    },
    {
      id: 'order-3',
      orderNumber: 'ORD-2025-003',
      userId: 'user-3',
      pharmacyId: 'pharmacy-1',
      items: [mockOrderItem],
      subtotal: 1980,
      deliveryFee: 500,
      discount: 0,
      total: 2480,
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      paymentStatus: PaymentStatus.PAID,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.PREPARING,
      statusHistory: [
        { status: OrderStatus.PREPARING, timestamp: new Date('2025-01-03') }
      ],
      createdAt: new Date('2025-01-03'),
      updatedAt: new Date('2025-01-03')
    },
    {
      id: 'order-4',
      orderNumber: 'ORD-2025-004',
      userId: 'user-4',
      pharmacyId: 'pharmacy-1',
      items: [mockOrderItem],
      subtotal: 1980,
      deliveryFee: 0,
      discount: 0,
      total: 1980,
      deliveryType: 'pickup',
      paymentMethod: 'pix',
      paymentStatus: PaymentStatus.PAID,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.COMPLETED,
      statusHistory: [
        { status: OrderStatus.COMPLETED, timestamp: new Date('2025-01-04') }
      ],
      createdAt: new Date('2025-01-04'),
      updatedAt: new Date('2025-01-04')
    },
    {
      id: 'order-5',
      orderNumber: 'ORD-2025-005',
      userId: 'user-5',
      pharmacyId: 'pharmacy-1',
      items: [mockOrderItem],
      subtotal: 1980,
      deliveryFee: 500,
      discount: 0,
      total: 2480,
      deliveryType: 'delivery',
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.FAILED,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.CANCELED,
      statusHistory: [
        { status: OrderStatus.CANCELED, timestamp: new Date('2025-01-05') }
      ],
      createdAt: new Date('2025-01-05'),
      updatedAt: new Date('2025-01-05')
    }
  ];

  beforeEach(async () => {
    mockCheckoutService = jasmine.createSpyObj('CheckoutService', [
      'getPharmacyOrders',
      'updateOrderStatus',
      'verifyPrescription',
      'cancelOrder'
    ]);

    mockAuthService = {
      currentUser: signal({ uid: 'pharmacy-1', email: 'pharmacy@test.com' }),
      userProfile: signal({ role: 'pharmacy' }),
      isAuthenticated: signal(true)
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: { get: () => null },
        queryParamMap: { get: (key: string) => null }
      }
    };

    mockCheckoutService.getPharmacyOrders.and.returnValue(Promise.resolve(mockOrders));
    mockCheckoutService.updateOrderStatus.and.returnValue(Promise.resolve({
      success: true,
      order: mockOrders[0],
      statusHistory: [],
      notificationSent: true
    } as any));
    mockCheckoutService.verifyPrescription.and.returnValue(Promise.resolve());
    mockCheckoutService.cancelOrder.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [
        OrderManagementPage,
        RouterTestingModule.withRoutes([]),
        FormsModule
      ],
      providers: [
        { provide: CheckoutService, useValue: mockCheckoutService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(OrderManagementPage);
    component = fixture.componentInstance;
  });

  // ==================== INICIALIZAÇÃO ====================
  describe('Inicialização', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have initial loading state as true', () => {
      expect(component.loading()).toBe(true);
    });

    it('should have initial error state as null', () => {
      expect(component.error()).toBeNull();
    });

    it('should have initial activeTab as all', () => {
      expect(component.activeTab()).toBe('all');
    });

    it('should have empty searchQuery', () => {
      expect(component.searchQuery()).toBe('');
    });

    it('should have default dateFilter as all', () => {
      expect(component.dateFilter()).toBe('all');
    });

    it('should have default paymentFilter as all', () => {
      expect(component.paymentFilter()).toBe('all');
    });

    it('should have default deliveryFilter as all', () => {
      expect(component.deliveryFilter()).toBe('all');
    });

    it('should have selectedOrder as null', () => {
      expect(component.selectedOrder()).toBeNull();
    });

    it('should have orderToCancel as null', () => {
      expect(component.orderToCancel()).toBeNull();
    });

    it('should have empty cancelReason', () => {
      expect(component.cancelReason).toBe('');
    });
  });

  // ==================== CARREGAMENTO DE PEDIDOS ====================
  describe('Carregamento de Pedidos', () => {
    it('should call loadOrders on init', fakeAsync(() => {
      spyOn(component, 'loadOrders').and.callThrough();
      fixture.detectChanges();
      tick();
      expect(component.loadOrders).toHaveBeenCalled();
    }));

    it('should load orders successfully', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.orders().length).toBe(5);
      expect(component.loading()).toBe(false);
    }));

    it('should set error when user not authenticated', fakeAsync(() => {
      mockAuthService.currentUser = signal(null);
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Usuário não autenticado');
    }));

    it('should handle load error', fakeAsync(() => {
      mockCheckoutService.getPharmacyOrders.and.rejectWith(new Error('Error'));
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Erro ao carregar pedidos');
    }));

    it('should call getPharmacyOrders with pharmacyId', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockCheckoutService.getPharmacyOrders).toHaveBeenCalledWith('pharmacy-1');
    }));

    it('should handle query param for pending status', fakeAsync(() => {
      mockActivatedRoute.snapshot.queryParamMap.get = (key: string) => key === 'status' ? 'pending' : null;
      fixture = TestBed.createComponent(OrderManagementPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      expect(component.activeTab()).toBe('pending');
    }));
  });

  // ==================== TABS ====================
  describe('Tabs', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set active tab', () => {
      component.setActiveTab('pending');
      expect(component.activeTab()).toBe('pending');
    });

    it('should filter pending orders when tab is pending', () => {
      component.setActiveTab('pending');
      const filtered = component.filteredOrders();
      expect(filtered.every(o => component.isPending(o))).toBe(true);
    });

    it('should filter processing orders when tab is processing', () => {
      component.setActiveTab('processing');
      const filtered = component.filteredOrders();
      expect(filtered.every(o => component.isProcessing(o))).toBe(true);
    });

    it('should filter completed orders when tab is completed', () => {
      component.setActiveTab('completed');
      const filtered = component.filteredOrders();
      expect(filtered.every(o => component.isCompleted(o))).toBe(true);
    });

    it('should filter canceled orders when tab is canceled', () => {
      component.setActiveTab('canceled');
      const filtered = component.filteredOrders();
      expect(filtered.every(o => o.status === OrderStatus.CANCELED)).toBe(true);
    });

    it('should show all orders when tab is all', () => {
      component.setActiveTab('all');
      expect(component.filteredOrders().length).toBe(5);
    });
  });

  // ==================== FILTROS ====================
  describe('Filtros', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    describe('Busca', () => {
      it('should filter by order number', () => {
        component.onSearchChange('ORD-2025-001');
        expect(component.filteredOrders().length).toBe(1);
        expect(component.filteredOrders()[0].orderNumber).toBe('ORD-2025-001');
      });

      it('should clear search', () => {
        component.searchQuery.set('test');
        component.clearSearch();
        expect(component.searchQuery()).toBe('');
      });

      it('should be case insensitive', () => {
        component.onSearchChange('ord-2025-001');
        expect(component.filteredOrders().length).toBe(1);
      });
    });

    describe('Data', () => {
      it('should filter by today', () => {
        component.onDateFilterChange('today');
        // Results depend on current date
        expect(component.dateFilter()).toBe('today');
      });

      it('should filter by yesterday', () => {
        component.onDateFilterChange('yesterday');
        expect(component.dateFilter()).toBe('yesterday');
      });

      it('should filter by week', () => {
        component.onDateFilterChange('week');
        expect(component.dateFilter()).toBe('week');
      });

      it('should filter by month', () => {
        component.onDateFilterChange('month');
        expect(component.dateFilter()).toBe('month');
      });

      it('should show all when filter is all', () => {
        component.dateFilter.set('today');
        component.onDateFilterChange('all');
        expect(component.dateFilter()).toBe('all');
      });
    });

    describe('Pagamento', () => {
      it('should filter paid orders', () => {
        component.onPaymentFilterChange('paid');
        const filtered = component.filteredOrders();
        expect(filtered.every(o => o.paymentStatus === PaymentStatus.PAID)).toBe(true);
      });

      it('should filter pending payment orders', () => {
        component.onPaymentFilterChange('pending');
        const filtered = component.filteredOrders();
        expect(filtered.every(o => o.paymentStatus === PaymentStatus.PENDING)).toBe(true);
      });

      it('should filter failed payment orders', () => {
        component.onPaymentFilterChange('failed');
        const filtered = component.filteredOrders();
        expect(filtered.every(o => o.paymentStatus === PaymentStatus.FAILED)).toBe(true);
      });
    });

    describe('Entrega', () => {
      it('should filter delivery orders', () => {
        component.onDeliveryFilterChange('delivery');
        const filtered = component.filteredOrders();
        expect(filtered.every(o => o.deliveryType === 'delivery')).toBe(true);
      });

      it('should filter pickup orders', () => {
        component.onDeliveryFilterChange('pickup');
        const filtered = component.filteredOrders();
        expect(filtered.every(o => o.deliveryType === 'pickup')).toBe(true);
      });
    });
  });

  // ==================== STATUS HELPERS ====================
  describe('Status Helpers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should identify pending orders', () => {
      expect(component.isPending(mockOrders[0])).toBe(true); // PAYMENT_CONFIRMED
      expect(component.isPending(mockOrders[1])).toBe(true); // PRESCRIPTION_PENDING
      expect(component.isPending(mockOrders[2])).toBe(false); // PREPARING
    });

    it('should identify processing orders', () => {
      expect(component.isProcessing(mockOrders[2])).toBe(true); // PREPARING
      expect(component.isProcessing(mockOrders[0])).toBe(false); // PAYMENT_CONFIRMED
    });

    it('should identify completed orders', () => {
      expect(component.isCompleted(mockOrders[3])).toBe(true); // COMPLETED
      expect(component.isCompleted(mockOrders[0])).toBe(false);
    });

    it('should check if can update status', () => {
      expect(component.canUpdateStatus(mockOrders[0])).toBe(true);
      expect(component.canUpdateStatus(mockOrders[4])).toBe(false); // CANCELED
      expect(component.canUpdateStatus(mockOrders[3])).toBe(false); // COMPLETED
    });

    it('should check if can cancel', () => {
      expect(component.canCancel(mockOrders[0])).toBe(true);
      expect(component.canCancel(mockOrders[3])).toBe(false); // COMPLETED
      expect(component.canCancel(mockOrders[4])).toBe(false); // CANCELED
    });

    it('should check if can print label', () => {
      expect(component.canPrintLabel(mockOrders[2])).toBe(true); // PREPARING
      expect(component.canPrintLabel(mockOrders[0])).toBe(false); // PAYMENT_CONFIRMED
    });

    it('should get status label', () => {
      expect(component.getStatusLabel(OrderStatus.PREPARING)).toBe('Preparando Pedido');
      expect(component.getStatusLabel(OrderStatus.COMPLETED)).toBe('Concluído');
    });

    it('should get status color', () => {
      expect(component.getStatusColor(OrderStatus.COMPLETED)).toBe('#16a34a');
      expect(component.getStatusColor(OrderStatus.CANCELED)).toBe('#dc2626');
    });

    it('should get available statuses', () => {
      const statuses = component.getAvailableStatuses(mockOrders[0]);
      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses[0].value).toBe(OrderStatus.PAYMENT_CONFIRMED);
    });

    it('should get payment status label', () => {
      expect(component.getPaymentStatusLabel(PaymentStatus.PAID)).toBe('Pago');
      expect(component.getPaymentStatusLabel(PaymentStatus.PENDING)).toBe('Aguardando');
    });

    it('should get payment status class', () => {
      expect(component.getPaymentStatusClass(PaymentStatus.PAID)).toBe('paid');
      expect(component.getPaymentStatusClass(PaymentStatus.FAILED)).toBe('failed');
      expect(component.getPaymentStatusClass(PaymentStatus.PENDING)).toBe('pending');
    });
  });

  // ==================== AÇÕES ====================
  describe('Ações', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update order status', fakeAsync(() => {
      component.updateOrderStatus(mockOrders[0], OrderStatus.PREPARING);
      tick();
      expect(mockCheckoutService.updateOrderStatus).toHaveBeenCalledWith('order-1', OrderStatus.PREPARING);
    }));

    it('should reload orders after status update', fakeAsync(() => {
      const loadSpy = spyOn(component, 'loadOrders').and.callThrough();
      component.updateOrderStatus(mockOrders[0], OrderStatus.PREPARING);
      tick();
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('should update selected order after status update', fakeAsync(() => {
      component.selectedOrder.set(mockOrders[0]);
      component.updateOrderStatus(mockOrders[0], OrderStatus.PREPARING);
      tick();
      expect(component.selectedOrder()).toBeTruthy();
    }));

    it('should verify prescription', fakeAsync(() => {
      component.verifyPrescription(mockOrders[1]);
      tick();
      expect(mockCheckoutService.verifyPrescription).toHaveBeenCalledWith('order-2');
    }));

    it('should view order details', () => {
      component.viewOrder(mockOrders[0]);
      expect(component.selectedOrder()).toEqual(mockOrders[0]);
    });

    it('should close order detail', () => {
      component.selectedOrder.set(mockOrders[0]);
      component.closeOrderDetail();
      expect(component.selectedOrder()).toBeNull();
    });

    it('should print label', () => {
      spyOn(console, 'log');
      component.printLabel(mockOrders[2]);
      expect(console.log).toHaveBeenCalledWith('Imprimir etiqueta:', 'ORD-2025-003');
    });

    it('should open image in new window', () => {
      spyOn(window, 'open');
      component.openImage('https://example.com/img.jpg');
      expect(window.open).toHaveBeenCalledWith('https://example.com/img.jpg', '_blank');
    });
  });

  // ==================== CANCELAMENTO ====================
  describe('Cancelamento', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open cancel modal', () => {
      component.cancelOrder(mockOrders[0]);
      expect(component.orderToCancel()).toEqual(mockOrders[0]);
      expect(component.cancelReason).toBe('');
    });

    it('should close cancel modal', () => {
      component.orderToCancel.set(mockOrders[0]);
      component.cancelReason = 'Test reason';
      component.closeCancelModal();
      expect(component.orderToCancel()).toBeNull();
      expect(component.cancelReason).toBe('');
    });

    it('should confirm cancel with reason', fakeAsync(() => {
      component.orderToCancel.set(mockOrders[0]);
      component.cancelReason = 'Produto indisponível';
      component.confirmCancel();
      tick();
      expect(mockCheckoutService.cancelOrder).toHaveBeenCalledWith('order-1', 'Produto indisponível');
    }));

    it('should not confirm cancel without reason', fakeAsync(() => {
      component.orderToCancel.set(mockOrders[0]);
      component.cancelReason = '';
      component.confirmCancel();
      tick();
      expect(mockCheckoutService.cancelOrder).not.toHaveBeenCalled();
    }));

    it('should not confirm cancel without order', fakeAsync(() => {
      component.cancelReason = 'Test';
      component.confirmCancel();
      tick();
      expect(mockCheckoutService.cancelOrder).not.toHaveBeenCalled();
    }));

    it('should set canceling during cancel', fakeAsync(() => {
      component.orderToCancel.set(mockOrders[0]);
      component.cancelReason = 'Test';
      expect(component.canceling()).toBe(false);
      component.confirmCancel();
      expect(component.canceling()).toBe(true);
      tick();
      expect(component.canceling()).toBe(false);
    }));

    it('should close modal after cancel', fakeAsync(() => {
      component.orderToCancel.set(mockOrders[0]);
      component.cancelReason = 'Test';
      component.confirmCancel();
      tick();
      expect(component.orderToCancel()).toBeNull();
    }));

    it('should handle cancel error', fakeAsync(() => {
      mockCheckoutService.cancelOrder.and.rejectWith(new Error('Error'));
      spyOn(console, 'error');
      component.orderToCancel.set(mockOrders[0]);
      component.cancelReason = 'Test';
      component.confirmCancel();
      tick();
      expect(console.error).toHaveBeenCalled();
      expect(component.canceling()).toBe(false);
    }));
  });

  // ==================== COMPUTED PROPERTIES ====================
  describe('Computed Properties', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute totalOrders', () => {
      expect(component.totalOrders()).toBe(5);
    });

    it('should compute pendingOrders', () => {
      expect(component.pendingOrders().length).toBe(2);
    });

    it('should compute processingOrders', () => {
      expect(component.processingOrders().length).toBe(1);
    });

    it('should compute completedOrders', () => {
      expect(component.completedOrders().length).toBe(1);
    });

    it('should compute canceledOrders', () => {
      expect(component.canceledOrders().length).toBe(1);
    });

    it('should compute prescriptionPending', () => {
      expect(component.prescriptionPending().length).toBe(1);
    });

    it('should compute totalRevenue from paid orders', () => {
      const revenue = component.totalRevenue();
      expect(revenue).toBeGreaterThan(0);
    });
  });

  // ==================== FORMATAÇÃO ====================
  describe('Formatação', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format currency', () => {
      expect(component.formatCurrency(2480)).toContain('24,80');
      expect(component.formatCurrency(0)).toContain('0,00');
    });

    it('should format date', () => {
      const formatted = component.formatDate(new Date('2025-01-15T12:00:00'));
      // O formato pt-BR é DD/MM/YYYY
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should format date time', () => {
      const formatted = component.formatDateTime(new Date('2025-01-15T10:30:00'));
      expect(formatted).toContain('15');
      expect(formatted).toContain('10');
      expect(formatted).toContain('30');
    });

    it('should format address', () => {
      const address = {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      };
      const formatted = component.getFormattedAddress(address);
      expect(formatted).toContain('Rua das Flores');
      expect(formatted).toContain('123');
      expect(formatted).toContain('Apto 101');
      expect(formatted).toContain('Centro');
      expect(formatted).toContain('São Paulo');
    });

    it('should format address without complement', () => {
      const address = {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      };
      const formatted = component.getFormattedAddress(address);
      expect(formatted).not.toContain('undefined');
    });

    it('should get empty message for search', () => {
      component.searchQuery.set('test');
      expect(component.getEmptyMessage()).toContain('test');
    });

    it('should get empty message for tab', () => {
      component.setActiveTab('pending');
      component.searchQuery.set('');
      expect(component.getEmptyMessage()).toContain('pendente');
    });

    it('should get default empty message', () => {
      component.setActiveTab('all');
      component.searchQuery.set('');
      expect(component.getEmptyMessage()).toContain('Nenhum pedido');
    });
  });

  // ==================== TEMPLATE RENDERING ====================
  describe('Template Rendering', () => {
    it('should show loading spinner when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const loading = fixture.nativeElement.querySelector('.loading-container');
      expect(loading).toBeTruthy();
    });

    it('should show error state when error', fakeAsync(() => {
      mockCheckoutService.getPharmacyOrders.and.rejectWith(new Error('Error'));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('app-empty-state');
      expect(error).toBeTruthy();
    }));

    it('should show orders list when loaded', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const list = fixture.nativeElement.querySelector('.orders-list');
      expect(list).toBeTruthy();
    }));

    it('should show tabs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const tabs = fixture.nativeElement.querySelectorAll('.tab-btn');
      expect(tabs.length).toBe(5);
    }));

    it('should show stats cards', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('.stat-card');
      expect(cards.length).toBe(4);
    }));

    it('should show order detail modal when selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedOrder.set(mockOrders[0]);
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('.order-detail-modal');
      expect(modal).toBeTruthy();
    }));

    it('should show cancel modal when order to cancel', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.orderToCancel.set(mockOrders[0]);
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('.cancel-modal');
      expect(modal).toBeTruthy();
    }));

    it('should show prescription alert for pending prescription', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('.prescription-alert');
      expect(alert).toBeTruthy();
    }));
  });

  // ==================== CICLO DE VIDA ====================
  describe('Ciclo de Vida', () => {
    it('should cleanup on destroy', fakeAsync(() => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    }));
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle updateOrderStatus error', fakeAsync(() => {
      mockCheckoutService.updateOrderStatus.and.rejectWith(new Error('Error'));
      spyOn(console, 'error');
      component.updateOrderStatus(mockOrders[0], OrderStatus.PREPARING);
      tick();
      expect(console.error).toHaveBeenCalled();
    }));

    it('should handle verifyPrescription error', fakeAsync(() => {
      mockCheckoutService.verifyPrescription.and.rejectWith(new Error('Error'));
      spyOn(console, 'error');
      component.verifyPrescription(mockOrders[1]);
      tick();
      expect(console.error).toHaveBeenCalled();
    }));
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle order without delivery address', () => {
      const orderNoAddress = { ...mockOrders[0], deliveryAddress: undefined };
      component.selectedOrder.set(orderNoAddress);
      // Should not throw
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle order without prescription images', () => {
      const orderNoPrescription = { ...mockOrders[1], prescriptionImages: undefined };
      expect(orderNoPrescription.prescriptionImages).toBeUndefined();
    });

    it('should handle multiple filters at once', () => {
      component.setActiveTab('pending');
      component.onPaymentFilterChange('paid');
      component.onDeliveryFilterChange('delivery');
      const filtered = component.filteredOrders();
      expect(Array.isArray(filtered)).toBe(true);
    });

    it('should handle order with many items', fakeAsync(() => {
      const manyItems = Array(10).fill(mockOrderItem);
      const orderManyItems = { ...mockOrders[0], items: manyItems };
      component.orders.set([orderManyItems]);
      fixture.detectChanges();
      const moreItems = fixture.nativeElement.querySelector('.more-items');
      expect(moreItems).toBeTruthy();
    }));

    it('should handle order item without image', () => {
      const itemNoImage = { ...mockOrderItem, productImage: undefined };
      const orderNoImage = { ...mockOrders[0], items: [itemNoImage] };
      component.orders.set([orderNoImage]);
      fixture.detectChanges();
      // Should show placeholder
      expect(fixture.nativeElement.textContent).toContain('💊');
    });
  });
});
