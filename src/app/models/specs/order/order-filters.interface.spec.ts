/**
 * @file order-filters.interface.spec.ts
 * @description Testes unitários para a interface OrderFilters
 */

import { OrderStatus, PaymentStatus, OrderFilters } from '../../order.model';

describe('OrderFilters Interface', () => {
  it('should create empty filters', () => {
    const filters: OrderFilters = {};
    expect(Object.keys(filters).length).toBe(0);
  });

  it('should filter by userId', () => {
    const filters: OrderFilters = {
      userId: 'user-123'
    };
    expect(filters.userId).toBe('user-123');
  });

  it('should filter by pharmacyId', () => {
    const filters: OrderFilters = {
      pharmacyId: 'pharma-456'
    };
    expect(filters.pharmacyId).toBe('pharma-456');
  });

  it('should filter by status', () => {
    const filters: OrderFilters = {
      status: OrderStatus.PREPARING
    };
    expect(filters.status).toBe(OrderStatus.PREPARING);
  });

  it('should filter by paymentStatus', () => {
    const filters: OrderFilters = {
      paymentStatus: PaymentStatus.PAID
    };
    expect(filters.paymentStatus).toBe(PaymentStatus.PAID);
  });

  it('should filter by date range', () => {
    const filters: OrderFilters = {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31')
    };
    expect(filters.startDate).toBeDefined();
    expect(filters.endDate).toBeDefined();
  });

  it('should filter by searchQuery', () => {
    const filters: OrderFilters = {
      searchQuery: 'ORD-2025-001234'
    };
    expect(filters.searchQuery).toContain('ORD-2025');
  });

  it('should combine multiple filters', () => {
    const filters: OrderFilters = {
      userId: 'user-123',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31')
    };

    expect(filters.userId).toBe('user-123');
    expect(filters.status).toBe(OrderStatus.COMPLETED);
    expect(filters.paymentStatus).toBe(PaymentStatus.PAID);
  });
});
