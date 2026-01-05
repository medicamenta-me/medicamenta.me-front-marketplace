/**
 * @file cart-item.interface.spec.ts
 * @description Testes unitários para a interface CartItem
 */

import { CartItem } from '../../cart.model';

describe('CartItem Interface', () => {
  it('should create basic cart item', () => {
    const item: CartItem = {
      productId: 'prod-123',
      quantity: 1,
      unitPrice: 1990,
      subtotal: 1990,
      total: 1990
    };

    expect(item.productId).toBe('prod-123');
    expect(item.quantity).toBe(1);
    expect(item.unitPrice).toBe(1990);
    expect(item.subtotal).toBe(1990);
    expect(item.total).toBe(1990);
  });

  it('should create cart item with multiple quantity', () => {
    const item: CartItem = {
      productId: 'prod-456',
      quantity: 3,
      unitPrice: 1000,
      subtotal: 3000,
      total: 3000
    };

    expect(item.quantity).toBe(3);
    expect(item.subtotal).toBe(item.quantity * item.unitPrice);
  });

  it('should create cart item with product data', () => {
    const item: CartItem = {
      productId: 'prod-789',
      product: {
        id: 'prod-789',
        name: 'Dipirona 500mg',
        price: 1990,
        images: ['dipirona.jpg']
      },
      quantity: 2,
      unitPrice: 1990,
      subtotal: 3980,
      total: 3980
    };

    expect(item.product).toBeDefined();
    expect(item.product.name).toBe('Dipirona 500mg');
  });

  it('should calculate subtotal correctly', () => {
    const quantity = 5;
    const unitPrice = 2500;
    const expectedSubtotal = quantity * unitPrice;

    const item: CartItem = {
      productId: 'prod-calc',
      quantity,
      unitPrice,
      subtotal: expectedSubtotal,
      total: expectedSubtotal
    };

    expect(item.subtotal).toBe(12500);
  });

  it('should handle item with discount', () => {
    const quantity = 2;
    const unitPrice = 5000;
    const subtotal = quantity * unitPrice;
    const discountedTotal = subtotal - 1000; // 10% off

    const item: CartItem = {
      productId: 'prod-discount',
      quantity,
      unitPrice,
      subtotal,
      total: discountedTotal
    };

    expect(item.subtotal).toBe(10000);
    expect(item.total).toBe(9000);
    expect(item.total).toBeLessThan(item.subtotal);
  });
});
