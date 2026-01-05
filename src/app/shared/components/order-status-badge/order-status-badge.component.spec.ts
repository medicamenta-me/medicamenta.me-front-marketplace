/**
 * 🧪 Order Status Badge Component Tests
 * Testes unitários para OrderStatusBadgeComponent
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { OrderStatusBadgeComponent, BadgeSize, BadgeVariant } from './order-status-badge.component';
import { OrderStatusService, OrderStatusInfo } from '../../../services/order-status.service';
import { OrderStatus } from '../../../models/order.model';

describe('OrderStatusBadgeComponent', () => {
  let component: OrderStatusBadgeComponent;
  let fixture: ComponentFixture<OrderStatusBadgeComponent>;
  let orderStatusServiceMock: jasmine.SpyObj<OrderStatusService>;

  beforeEach(async () => {
    orderStatusServiceMock = jasmine.createSpyObj('OrderStatusService', [
      'watchOrder',
      'unwatchOrder',
      'calculateProgress',
      'getStatusLabel'
    ]);

    orderStatusServiceMock.calculateProgress.and.callFake((status: OrderStatus) => {
      const progressMap: Record<OrderStatus, number> = {
        [OrderStatus.PENDING_PAYMENT]: 0,
        [OrderStatus.PAYMENT_CONFIRMED]: 12,
        [OrderStatus.PRESCRIPTION_PENDING]: 25,
        [OrderStatus.PRESCRIPTION_APPROVED]: 37,
        [OrderStatus.PREPARING]: 50,
        [OrderStatus.READY_FOR_PICKUP]: 62,
        [OrderStatus.OUT_FOR_DELIVERY]: 75,
        [OrderStatus.DELIVERED]: 87,
        [OrderStatus.COMPLETED]: 100,
        [OrderStatus.CANCELED]: 0,
        [OrderStatus.REFUNDED]: 0
      };
      return progressMap[status] ?? 0;
    });

    await TestBed.configureTestingModule({
      imports: [OrderStatusBadgeComponent],
      providers: [
        { provide: OrderStatusService, useValue: orderStatusServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  // ===== INITIALIZATION =====

  describe('Initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default size md', () => {
      expect(component.size).toBe('md');
    });

    it('should have default variant subtle', () => {
      expect(component.variant).toBe('subtle');
    });

    it('should show icon by default', () => {
      expect(component.showIcon).toBe(true);
    });

    it('should show label by default', () => {
      expect(component.showLabel).toBe(true);
    });

    it('should not show progress by default', () => {
      expect(component.showProgress).toBe(false);
    });

    it('should be animated by default', () => {
      expect(component.animated).toBe(true);
    });

    it('should not be interactive by default', () => {
      expect(component.interactive).toBe(false);
    });
  });

  // ===== STATUS DISPLAY =====

  describe('Status Display', () => {
    it('should display PENDING_PAYMENT status', () => {
      component.status = OrderStatus.PENDING_PAYMENT;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('⏳');
      expect(config.label).toBe('Aguardando Pagamento');
    });

    it('should display PAYMENT_CONFIRMED status', () => {
      component.status = OrderStatus.PAYMENT_CONFIRMED;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('✅');
      expect(config.label).toBe('Pagamento Confirmado');
    });

    it('should display PREPARING status', () => {
      component.status = OrderStatus.PREPARING;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('📦');
      expect(config.label).toBe('Preparando');
    });

    it('should display READY_FOR_PICKUP status', () => {
      component.status = OrderStatus.READY_FOR_PICKUP;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('🏪');
      expect(config.label).toBe('Pronto para Retirada');
    });

    it('should display OUT_FOR_DELIVERY status', () => {
      component.status = OrderStatus.OUT_FOR_DELIVERY;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('🚚');
      expect(config.label).toBe('Saiu para Entrega');
    });

    it('should display DELIVERED status', () => {
      component.status = OrderStatus.DELIVERED;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('🎉');
      expect(config.label).toBe('Entregue');
    });

    it('should display COMPLETED status', () => {
      component.status = OrderStatus.COMPLETED;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('✅');
      expect(config.label).toBe('Concluído');
    });

    it('should display CANCELED status', () => {
      component.status = OrderStatus.CANCELED;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('❌');
      expect(config.label).toBe('Cancelado');
    });

    it('should display REFUNDED status', () => {
      component.status = OrderStatus.REFUNDED;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('💰');
      expect(config.label).toBe('Reembolsado');
    });

    it('should display PRESCRIPTION_PENDING status', () => {
      component.status = OrderStatus.PRESCRIPTION_PENDING;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('📋');
      expect(config.label).toBe('Aguardando Receita');
    });

    it('should display PRESCRIPTION_APPROVED status', () => {
      component.status = OrderStatus.PRESCRIPTION_APPROVED;
      fixture.detectChanges();

      const config = component.config();
      expect(config.icon).toBe('✅');
      expect(config.label).toBe('Receita Aprovada');
    });
  });

  // ===== CSS CLASSES =====

  describe('CSS Classes', () => {
    it('should include status class', () => {
      component.status = OrderStatus.PREPARING;
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('status-preparing');
    });

    it('should include size class', () => {
      component.size = 'lg';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('badge-lg');
    });

    it('should include variant class', () => {
      component.variant = 'solid';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('variant-solid');
    });

    it('should include interactive class when interactive', () => {
      component.interactive = true;
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('interactive');
    });

    it('should not include interactive class when not interactive', () => {
      component.interactive = false;
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).not.toContain('interactive');
    });
  });

  // ===== SIZES =====

  describe('Sizes', () => {
    it('should apply sm size', () => {
      component.size = 'sm';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('badge-sm');
    });

    it('should apply md size', () => {
      component.size = 'md';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('badge-md');
    });

    it('should apply lg size', () => {
      component.size = 'lg';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('badge-lg');
    });
  });

  // ===== VARIANTS =====

  describe('Variants', () => {
    it('should apply solid variant', () => {
      component.variant = 'solid';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('variant-solid');
    });

    it('should apply outline variant', () => {
      component.variant = 'outline';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('variant-outline');
    });

    it('should apply subtle variant', () => {
      component.variant = 'subtle';
      fixture.detectChanges();

      const classes = component.badgeClasses();
      expect(classes).toContain('variant-subtle');
    });
  });

  // ===== PULSE ANIMATION =====

  describe('Pulse Animation', () => {
    it('should pulse for PENDING_PAYMENT', () => {
      component.status = OrderStatus.PENDING_PAYMENT;
      fixture.detectChanges();

      expect(component.config().pulse).toBe(true);
    });

    it('should pulse for PREPARING', () => {
      component.status = OrderStatus.PREPARING;
      fixture.detectChanges();

      expect(component.config().pulse).toBe(true);
    });

    it('should pulse for OUT_FOR_DELIVERY', () => {
      component.status = OrderStatus.OUT_FOR_DELIVERY;
      fixture.detectChanges();

      expect(component.config().pulse).toBe(true);
    });

    it('should pulse for PRESCRIPTION_PENDING', () => {
      component.status = OrderStatus.PRESCRIPTION_PENDING;
      fixture.detectChanges();

      expect(component.config().pulse).toBe(true);
    });

    it('should not pulse for COMPLETED', () => {
      component.status = OrderStatus.COMPLETED;
      fixture.detectChanges();

      expect(component.config().pulse).toBe(false);
    });

    it('should not pulse for DELIVERED', () => {
      component.status = OrderStatus.DELIVERED;
      fixture.detectChanges();

      expect(component.config().pulse).toBe(false);
    });

    it('should not pulse for CANCELED', () => {
      component.status = OrderStatus.CANCELED;
      fixture.detectChanges();

      expect(component.config().pulse).toBe(false);
    });
  });

  // ===== PROGRESS =====

  describe('Progress', () => {
    it('should calculate 0% for PENDING_PAYMENT', () => {
      component.status = OrderStatus.PENDING_PAYMENT;
      fixture.detectChanges();

      expect(component.progressPercent()).toBe(0);
    });

    it('should calculate 50% for PREPARING', () => {
      component.status = OrderStatus.PREPARING;
      fixture.detectChanges();

      expect(component.progressPercent()).toBe(50);
    });

    it('should calculate 100% for COMPLETED', () => {
      component.status = OrderStatus.COMPLETED;
      fixture.detectChanges();

      expect(component.progressPercent()).toBe(100);
    });

    it('should calculate 0% for CANCELED', () => {
      component.status = OrderStatus.CANCELED;
      fixture.detectChanges();

      expect(component.progressPercent()).toBe(0);
    });
  });

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      component.status = OrderStatus.PREPARING;
      fixture.detectChanges();

      const ariaLabel = component.ariaLabel();
      expect(ariaLabel).toContain('Preparando');
    });

    it('should have role status', () => {
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.order-status-badge');
      expect(badge.getAttribute('role')).toBe('status');
    });
  });

  // ===== REAL-TIME WATCHING =====

  describe('Real-time Watching', () => {
    it('should start watching when orderId is provided', () => {
      const mockSignal = signal<OrderStatusInfo | null>(null);
      orderStatusServiceMock.watchOrder.and.returnValue(mockSignal);

      component.orderId = 'order123';
      component.ngOnInit();

      expect(orderStatusServiceMock.watchOrder).toHaveBeenCalledWith('order123', { notifyOnChange: false });
    });

    it('should not watch when orderId is null', () => {
      component.orderId = null;
      component.ngOnInit();

      expect(orderStatusServiceMock.watchOrder).not.toHaveBeenCalled();
    });

    it('should unwatch on destroy', () => {
      component.orderId = 'order123';
      const mockSignal = signal<OrderStatusInfo | null>(null);
      orderStatusServiceMock.watchOrder.and.returnValue(mockSignal);

      component.ngOnInit();
      component.ngOnDestroy();

      expect(orderStatusServiceMock.unwatchOrder).toHaveBeenCalledWith('order123');
    });

    it('should not unwatch if never watched', () => {
      component.orderId = null;
      component.ngOnDestroy();

      expect(orderStatusServiceMock.unwatchOrder).not.toHaveBeenCalled();
    });
  });

  // ===== DEFAULT STATUS =====

  describe('Default Status', () => {
    it('should default to PENDING_PAYMENT when status is null', () => {
      component.status = null;
      fixture.detectChanges();

      expect(component.effectiveStatus()).toBe(OrderStatus.PENDING_PAYMENT);
    });
  });

  // ===== DISPLAY OPTIONS =====

  describe('Display Options', () => {
    it('should hide icon when showIcon is false', () => {
      component.showIcon = false;
      fixture.detectChanges();

      expect(component.showIcon).toBe(false);
    });

    it('should hide label when showLabel is false', () => {
      component.showLabel = false;
      fixture.detectChanges();

      expect(component.showLabel).toBe(false);
    });

    it('should show progress when showProgress is true', () => {
      component.showProgress = true;
      fixture.detectChanges();

      expect(component.showProgress).toBe(true);
    });

    it('should disable animation when animated is false', () => {
      component.animated = false;
      fixture.detectChanges();

      expect(component.animated).toBe(false);
    });
  });

  // ===== COLORS =====

  describe('Status Colors', () => {
    it('should have correct color for success statuses', () => {
      const successStatuses = [
        OrderStatus.PAYMENT_CONFIRMED,
        OrderStatus.PRESCRIPTION_APPROVED,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED
      ];

      successStatuses.forEach(status => {
        component.status = status;
        fixture.detectChanges();
        const config = component.config();
        expect(config.color).toMatch(/#(10b981|059669)/);
      });
    });

    it('should have correct color for warning statuses', () => {
      const warningStatuses = [
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PRESCRIPTION_PENDING
      ];

      warningStatuses.forEach(status => {
        component.status = status;
        fixture.detectChanges();
        const config = component.config();
        expect(config.color).toBe('#f59e0b');
      });
    });

    it('should have correct color for danger statuses', () => {
      component.status = OrderStatus.CANCELED;
      fixture.detectChanges();
      const config = component.config();
      expect(config.color).toBe('#ef4444');
    });
  });
});
