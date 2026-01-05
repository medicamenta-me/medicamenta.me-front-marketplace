/**
 * @file cart-summary.spec.ts
 * @description Testes unitários para a interface CartSummary
 */

import { CartSummary } from '../../cart.model';

describe('CartSummary Interface', () => {
  it('should create empty cart summary', () => {
    const summary: CartSummary = {
      itemCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      discount: 0,
      total: 0,
      hasFreeDelivery: false
    };

    expect(summary.itemCount).toBe(0);
    expect(summary.total).toBe(0);
    expect(summary.hasFreeDelivery).toBe(false);
  });

  it('should create cart summary with items', () => {
    const summary: CartSummary = {
      itemCount: 3,
      subtotal: 5000,
      deliveryFee: 800,
      discount: 500,
      total: 5300,
      hasFreeDelivery: false
    };

    expect(summary.itemCount).toBe(3);
    expect(summary.subtotal).toBe(5000);
    expect(summary.total).toBe(5300);
  });

  it('should create cart summary with free delivery', () => {
    const summary: CartSummary = {
      itemCount: 5,
      subtotal: 15000,
      deliveryFee: 0,
      discount: 0,
      total: 15000,
      hasFreeDelivery: true
    };

    expect(summary.hasFreeDelivery).toBe(true);
    expect(summary.deliveryFee).toBe(0);
  });

  it('should show missing for free delivery', () => {
    const summary: CartSummary = {
      itemCount: 2,
      subtotal: 7000,
      deliveryFee: 800,
      discount: 0,
      total: 7800,
      hasFreeDelivery: false,
      missingForFreeDelivery: 3000
    };

    expect(summary.hasFreeDelivery).toBe(false);
    expect(summary.missingForFreeDelivery).toBe(3000);
  });

  it('should not show missing when has free delivery', () => {
    const summary: CartSummary = {
      itemCount: 10,
      subtotal: 20000,
      deliveryFee: 0,
      discount: 2000,
      total: 18000,
      hasFreeDelivery: true
    };

    expect(summary.hasFreeDelivery).toBe(true);
    expect(summary.missingForFreeDelivery).toBeUndefined();
  });

  it('should calculate total correctly', () => {
    const subtotal = 8000;
    const deliveryFee = 1000;
    const discount = 800;
    const expectedTotal = subtotal + deliveryFee - discount;

    const summary: CartSummary = {
      itemCount: 4,
      subtotal,
      deliveryFee,
      discount,
      total: expectedTotal,
      hasFreeDelivery: false
    };

    expect(summary.total).toBe(8200);
  });
});
