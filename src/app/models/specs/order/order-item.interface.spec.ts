/**
 * @file order-item.interface.spec.ts
 * @description Testes unitários para a interface OrderItem
 */

import { OrderItem } from '../../order.model';

describe('OrderItem Interface', () => {
  it('should create valid order item', () => {
    const item: OrderItem = {
      productId: 'prod-123',
      productName: 'Dipirona 500mg',
      productImage: 'dipirona.jpg',
      quantity: 2,
      unitPrice: 1990,
      subtotal: 3980,
      discount: 0,
      total: 3980
    };

    expect(item.productId).toBe('prod-123');
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(1990);
    expect(item.subtotal).toBe(3980);
  });

  it('should create order item with discount', () => {
    const item: OrderItem = {
      productId: 'prod-456',
      productName: 'Vitamina C 1000mg',
      quantity: 3,
      unitPrice: 2500,
      subtotal: 7500,
      discount: 750,
      total: 6750
    };

    expect(item.discount).toBe(750);
    expect(item.total).toBe(6750);
    expect(item.total).toBe(item.subtotal - item.discount);
  });

  it('should allow item without image', () => {
    const item: OrderItem = {
      productId: 'prod-789',
      productName: 'Produto sem imagem',
      quantity: 1,
      unitPrice: 1000,
      subtotal: 1000,
      discount: 0,
      total: 1000
    };

    expect(item.productImage).toBeUndefined();
  });
});
