/**
 * @file order-status-change.interface.spec.ts
 * @description Testes unitários para a interface OrderStatusChange
 */

import { OrderStatus, OrderStatusChange } from '../../order.model';

describe('OrderStatusChange Interface', () => {
  it('should create simple status change', () => {
    const change: OrderStatusChange = {
      status: OrderStatus.PAYMENT_CONFIRMED,
      timestamp: new Date()
    };

    expect(change.status).toBe(OrderStatus.PAYMENT_CONFIRMED);
    expect(change.timestamp).toBeDefined();
  });

  it('should create status change with note', () => {
    const change: OrderStatusChange = {
      status: OrderStatus.CANCELED,
      timestamp: new Date(),
      note: 'Produto indisponível'
    };

    expect(change.note).toBe('Produto indisponível');
  });

  it('should create status change with changedBy', () => {
    const change: OrderStatusChange = {
      status: OrderStatus.PRESCRIPTION_APPROVED,
      timestamp: new Date(),
      changedBy: 'pharmacist-456'
    };

    expect(change.changedBy).toBe('pharmacist-456');
  });
});
