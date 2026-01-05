/**
 * 🧪 Order Status Service Tests
 * Testes unitários para o OrderStatusService
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { signal } from '@angular/core';
import { OrderStatusService, OrderStatusInfo, WatchOptions, OrderStatusMetrics } from './order-status.service';
import { ToastService } from './toast.service';
import { OrderStatus, ORDER_STATUS_LABELS } from '../models/order.model';
import { Firestore } from '@angular/fire/firestore';

// Mock Firestore types
type UnsubscribeFn = () => void;

describe('OrderStatusService', () => {
  let service: OrderStatusService;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let firestoreMock: any;

  // Snapshot callback storage for simulating updates
  let snapshotCallbacks: Map<string, (snapshot: any) => void> = new Map();
  let errorCallbacks: Map<string, (error: any) => void> = new Map();
  let unsubscribeMocks: Map<string, jasmine.Spy> = new Map();

  // Mock snapshot data
  const createMockSnapshot = (orderId: string, data: any, exists = true) => ({
    exists: () => exists,
    id: orderId,
    data: () => data
  });

  // Mock Firestore date
  const createMockTimestamp = (date: Date) => ({
    toDate: () => date
  });

  beforeEach(() => {
    // Reset maps
    snapshotCallbacks = new Map();
    errorCallbacks = new Map();
    unsubscribeMocks = new Map();

    // Mock ToastService
    toastServiceMock = {
      show: jasmine.createSpy('show'),
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning'),
      info: jasmine.createSpy('info'),
      dismiss: jasmine.createSpy('dismiss'),
      dismissAll: jasmine.createSpy('dismissAll'),
      toasts: signal([]),
      count: signal(0),
      hasToasts: signal(false)
    } as any;

    // Mock Firestore
    firestoreMock = {};

    TestBed.configureTestingModule({
      providers: [
        OrderStatusService,
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Firestore, useValue: firestoreMock }
      ]
    });

    service = TestBed.inject(OrderStatusService);

    // Mock internal Firestore calls by overriding the watchOrder method's internal behavior
    // We'll test the public API and mock at a higher level
  });

  afterEach(() => {
    service.unwatchAll();
  });

  // ===== INITIALIZATION =====

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have no active listeners initially', () => {
      expect(service.hasActiveListeners()).toBe(false);
    });

    it('should have zero metrics initially', () => {
      const metrics = service.metrics();
      expect(metrics.activeListeners).toBe(0);
      expect(metrics.totalUpdates).toBe(0);
      expect(metrics.statusChanges).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.lastUpdateAt).toBeNull();
    });
  });

  // ===== STATUS LABELS =====

  describe('getStatusLabel()', () => {
    it('should return correct label for PENDING_PAYMENT', () => {
      expect(service.getStatusLabel(OrderStatus.PENDING_PAYMENT)).toBe('Aguardando Pagamento');
    });

    it('should return correct label for PAYMENT_CONFIRMED', () => {
      expect(service.getStatusLabel(OrderStatus.PAYMENT_CONFIRMED)).toBe('Pagamento Confirmado');
    });

    it('should return correct label for PREPARING', () => {
      expect(service.getStatusLabel(OrderStatus.PREPARING)).toBe('Preparando Pedido');
    });

    it('should return correct label for READY_FOR_PICKUP', () => {
      expect(service.getStatusLabel(OrderStatus.READY_FOR_PICKUP)).toBe('Pronto para Retirada');
    });

    it('should return correct label for OUT_FOR_DELIVERY', () => {
      expect(service.getStatusLabel(OrderStatus.OUT_FOR_DELIVERY)).toBe('Saiu para Entrega');
    });

    it('should return correct label for DELIVERED', () => {
      expect(service.getStatusLabel(OrderStatus.DELIVERED)).toBe('Entregue');
    });

    it('should return correct label for COMPLETED', () => {
      expect(service.getStatusLabel(OrderStatus.COMPLETED)).toBe('Concluído');
    });

    it('should return correct label for CANCELED', () => {
      expect(service.getStatusLabel(OrderStatus.CANCELED)).toBe('Cancelado');
    });

    it('should return correct label for REFUNDED', () => {
      expect(service.getStatusLabel(OrderStatus.REFUNDED)).toBe('Reembolsado');
    });

    it('should return correct label for PRESCRIPTION_PENDING', () => {
      expect(service.getStatusLabel(OrderStatus.PRESCRIPTION_PENDING)).toBe('Aguardando Receita');
    });

    it('should return correct label for PRESCRIPTION_APPROVED', () => {
      expect(service.getStatusLabel(OrderStatus.PRESCRIPTION_APPROVED)).toBe('Receita Aprovada');
    });
  });

  // ===== STATUS NOTIFICATIONS =====

  describe('getStatusNotification()', () => {
    it('should return success color for PAYMENT_CONFIRMED', () => {
      const notification = service.getStatusNotification(OrderStatus.PAYMENT_CONFIRMED);
      expect(notification.color).toBe('success');
    });

    it('should return warning color for PENDING_PAYMENT', () => {
      const notification = service.getStatusNotification(OrderStatus.PENDING_PAYMENT);
      expect(notification.color).toBe('warning');
    });

    it('should return danger color for CANCELED', () => {
      const notification = service.getStatusNotification(OrderStatus.CANCELED);
      expect(notification.color).toBe('danger');
    });

    it('should return primary color for PREPARING', () => {
      const notification = service.getStatusNotification(OrderStatus.PREPARING);
      expect(notification.color).toBe('primary');
    });

    it('should have icon for each status', () => {
      Object.values(OrderStatus).forEach((status) => {
        const notification = service.getStatusNotification(status);
        expect(notification.icon).toBeTruthy();
      });
    });

    it('should have message for each status', () => {
      Object.values(OrderStatus).forEach((status) => {
        const notification = service.getStatusNotification(status);
        expect(notification.message).toBeTruthy();
      });
    });
  });

  // ===== FINAL STATUS CHECK =====

  describe('isFinalStatus()', () => {
    it('should return true for DELIVERED', () => {
      expect(service.isFinalStatus(OrderStatus.DELIVERED)).toBe(true);
    });

    it('should return true for COMPLETED', () => {
      expect(service.isFinalStatus(OrderStatus.COMPLETED)).toBe(true);
    });

    it('should return true for CANCELED', () => {
      expect(service.isFinalStatus(OrderStatus.CANCELED)).toBe(true);
    });

    it('should return true for REFUNDED', () => {
      expect(service.isFinalStatus(OrderStatus.REFUNDED)).toBe(true);
    });

    it('should return false for PENDING_PAYMENT', () => {
      expect(service.isFinalStatus(OrderStatus.PENDING_PAYMENT)).toBe(false);
    });

    it('should return false for PREPARING', () => {
      expect(service.isFinalStatus(OrderStatus.PREPARING)).toBe(false);
    });

    it('should return false for OUT_FOR_DELIVERY', () => {
      expect(service.isFinalStatus(OrderStatus.OUT_FOR_DELIVERY)).toBe(false);
    });
  });

  // ===== PROGRESS CALCULATION =====

  describe('calculateProgress()', () => {
    it('should return 0 for PENDING_PAYMENT', () => {
      expect(service.calculateProgress(OrderStatus.PENDING_PAYMENT)).toBe(0);
    });

    it('should return 100 for COMPLETED', () => {
      expect(service.calculateProgress(OrderStatus.COMPLETED)).toBe(100);
    });

    it('should return 0 for CANCELED', () => {
      expect(service.calculateProgress(OrderStatus.CANCELED)).toBe(0);
    });

    it('should return 0 for REFUNDED', () => {
      expect(service.calculateProgress(OrderStatus.REFUNDED)).toBe(0);
    });

    it('should return intermediate values for middle statuses', () => {
      const preparingProgress = service.calculateProgress(OrderStatus.PREPARING);
      expect(preparingProgress).toBeGreaterThan(0);
      expect(preparingProgress).toBeLessThan(100);
    });

    it('should have increasing progress for sequential statuses', () => {
      const pending = service.calculateProgress(OrderStatus.PENDING_PAYMENT);
      const confirmed = service.calculateProgress(OrderStatus.PAYMENT_CONFIRMED);
      const preparing = service.calculateProgress(OrderStatus.PREPARING);
      const delivered = service.calculateProgress(OrderStatus.DELIVERED);

      expect(confirmed).toBeGreaterThan(pending);
      expect(preparing).toBeGreaterThan(confirmed);
      expect(delivered).toBeGreaterThan(preparing);
    });
  });

  // ===== NEXT EXPECTED STATUS =====

  describe('getNextExpectedStatus()', () => {
    it('should return PAYMENT_CONFIRMED after PENDING_PAYMENT', () => {
      expect(service.getNextExpectedStatus(OrderStatus.PENDING_PAYMENT))
        .toBe(OrderStatus.PAYMENT_CONFIRMED);
    });

    it('should return PREPARING after PRESCRIPTION_APPROVED', () => {
      expect(service.getNextExpectedStatus(OrderStatus.PRESCRIPTION_APPROVED))
        .toBe(OrderStatus.PREPARING);
    });

    it('should return OUT_FOR_DELIVERY after READY_FOR_PICKUP', () => {
      expect(service.getNextExpectedStatus(OrderStatus.READY_FOR_PICKUP))
        .toBe(OrderStatus.OUT_FOR_DELIVERY);
    });

    it('should return null for COMPLETED', () => {
      expect(service.getNextExpectedStatus(OrderStatus.COMPLETED)).toBeNull();
    });

    it('should return null for CANCELED', () => {
      expect(service.getNextExpectedStatus(OrderStatus.CANCELED)).toBeNull();
    });

    it('should return null for REFUNDED', () => {
      expect(service.getNextExpectedStatus(OrderStatus.REFUNDED)).toBeNull();
    });

    it('should return null for DELIVERED', () => {
      expect(service.getNextExpectedStatus(OrderStatus.DELIVERED)).toBeNull();
    });
  });

  // ===== WATCHING ORDERS =====

  describe('isWatching()', () => {
    it('should return false for unwatched order', () => {
      expect(service.isWatching('order123')).toBe(false);
    });
  });

  describe('getStatusSignal()', () => {
    it('should return undefined for unwatched order', () => {
      expect(service.getStatusSignal('order123')).toBeUndefined();
    });
  });

  describe('getConnectionStatus()', () => {
    it('should return undefined for unwatched order', () => {
      expect(service.getConnectionStatus('order123')).toBeUndefined();
    });
  });

  // ===== METRICS =====

  describe('Metrics', () => {
    it('should have correct initial structure', () => {
      const metrics = service.metrics();
      expect(metrics.activeListeners).toBeDefined();
      expect(metrics.totalUpdates).toBeDefined();
      expect(metrics.statusChanges).toBeDefined();
      expect(metrics.errors).toBeDefined();
      expect('lastUpdateAt' in metrics).toBe(true);
    });

    it('should be readonly signal', () => {
      const metrics = service.metrics;
      expect(typeof metrics).toBe('function');
    });
  });

  // ===== ORDER STATUS INFO INTERFACE =====

  describe('OrderStatusInfo Interface', () => {
    it('should have correct structure', () => {
      const info: OrderStatusInfo = {
        orderId: 'order123',
        orderNumber: 'ORD-2025-001',
        status: OrderStatus.PREPARING,
        updatedAt: new Date(),
        trackingCode: 'TRACK123',
        estimatedDelivery: '30-60 minutos',
        pharmacyNotes: 'Separando itens',
        statusHistory: []
      };

      expect(info.orderId).toBe('order123');
      expect(info.status).toBe(OrderStatus.PREPARING);
    });

    it('should allow optional previousStatus', () => {
      const info: OrderStatusInfo = {
        orderId: 'order123',
        orderNumber: 'ORD-2025-001',
        status: OrderStatus.PREPARING,
        previousStatus: OrderStatus.PAYMENT_CONFIRMED,
        updatedAt: new Date(),
        trackingCode: null,
        estimatedDelivery: null,
        pharmacyNotes: null,
        statusHistory: []
      };

      expect(info.previousStatus).toBe(OrderStatus.PAYMENT_CONFIRMED);
    });

    it('should allow null values for optional fields', () => {
      const info: OrderStatusInfo = {
        orderId: 'order123',
        orderNumber: 'ORD-2025-001',
        status: OrderStatus.PENDING_PAYMENT,
        updatedAt: new Date(),
        trackingCode: null,
        estimatedDelivery: null,
        pharmacyNotes: null,
        statusHistory: []
      };

      expect(info.trackingCode).toBeNull();
      expect(info.estimatedDelivery).toBeNull();
      expect(info.pharmacyNotes).toBeNull();
    });
  });

  // ===== WATCH OPTIONS INTERFACE =====

  describe('WatchOptions Interface', () => {
    it('should accept notifyOnChange option', () => {
      const options: WatchOptions = {
        notifyOnChange: false
      };
      expect(options.notifyOnChange).toBe(false);
    });

    it('should accept onStatusChange callback', () => {
      const callback = jasmine.createSpy('onStatusChange');
      const options: WatchOptions = {
        onStatusChange: callback
      };
      expect(options.onStatusChange).toBe(callback);
    });

    it('should allow empty options', () => {
      const options: WatchOptions = {};
      expect(options.notifyOnChange).toBeUndefined();
      expect(options.onStatusChange).toBeUndefined();
    });
  });

  // ===== ALL STATUS LABELS COVERAGE =====

  describe('ORDER_STATUS_LABELS coverage', () => {
    it('should have label for all OrderStatus values', () => {
      const statuses = Object.values(OrderStatus);
      statuses.forEach((status) => {
        const label = ORDER_STATUS_LABELS[status];
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
      });
    });
  });

  // ===== EDGE CASES =====

  describe('Edge Cases', () => {
    it('should handle all OrderStatus enum values in isFinalStatus', () => {
      const finalStatuses = [
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELED,
        OrderStatus.REFUNDED
      ];
      const nonFinalStatuses = Object.values(OrderStatus).filter(
        (s) => !finalStatuses.includes(s)
      );

      finalStatuses.forEach((status) => {
        expect(service.isFinalStatus(status)).toBe(true);
      });

      nonFinalStatuses.forEach((status) => {
        expect(service.isFinalStatus(status)).toBe(false);
      });
    });

    it('should calculate progress for all non-negative statuses', () => {
      Object.values(OrderStatus).forEach((status) => {
        const progress = service.calculateProgress(status);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });
    });
  });
});
