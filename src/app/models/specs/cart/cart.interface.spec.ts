/**
 * @file cart.interface.spec.ts
 * @description Testes unitários para a interface Cart
 */

import { Cart, CartItem } from '../../cart.model';

describe('Cart Interface', () => {
  it('should create empty cart', () => {
    const cart: Cart = {
      id: 'cart-123',
      userId: 'user-123',
      pharmacyId: 'pharma-123',
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      discount: 0,
      total: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(cart.id).toBe('cart-123');
    expect(cart.items.length).toBe(0);
    expect(cart.total).toBe(0);
  });

  it('should create cart with items', () => {
    const cart: Cart = {
      id: 'cart-456',
      userId: 'user-456',
      pharmacyId: 'pharma-456',
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 1990,
          subtotal: 3980,
          total: 3980
        },
        {
          productId: 'prod-2',
          quantity: 1,
          unitPrice: 2500,
          subtotal: 2500,
          total: 2500
        }
      ],
      subtotal: 6480,
      deliveryFee: 500,
      discount: 0,
      total: 6980,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(cart.items.length).toBe(2);
    expect(cart.subtotal).toBe(6480);
    expect(cart.total).toBe(6980);
  });

  it('should create cart with coupon', () => {
    const cart: Cart = {
      id: 'cart-coupon',
      userId: 'user-coupon',
      pharmacyId: 'pharma-coupon',
      items: [
        {
          productId: 'prod-1',
          quantity: 1,
          unitPrice: 5000,
          subtotal: 5000,
          total: 5000
        }
      ],
      subtotal: 5000,
      deliveryFee: 500,
      discount: 1000,
      total: 4500,
      couponCode: 'DESCONTO10',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(cart.couponCode).toBe('DESCONTO10');
    expect(cart.discount).toBe(1000);
    expect(cart.total).toBe(4500);
  });

  it('should calculate total correctly', () => {
    const subtotal = 10000;
    const deliveryFee = 800;
    const discount = 1500;
    const expectedTotal = subtotal + deliveryFee - discount;

    const cart: Cart = {
      id: 'cart-calc',
      userId: 'user-calc',
      pharmacyId: 'pharma-calc',
      items: [],
      subtotal,
      deliveryFee,
      discount,
      total: expectedTotal,
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(cart.total).toBe(9300);
    expect(cart.total).toBe(cart.subtotal + cart.deliveryFee - cart.discount);
  });

  it('should have expiration date', () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const cart: Cart = {
      id: 'cart-expire',
      userId: 'user-expire',
      pharmacyId: 'pharma-expire',
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      discount: 0,
      total: 0,
      expiresAt,
      createdAt: now,
      updatedAt: now
    };

    expect(cart.expiresAt.getTime()).toBeGreaterThan(cart.createdAt.getTime());
    // 7 days = 604800000 ms
    expect(cart.expiresAt.getTime() - cart.createdAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
