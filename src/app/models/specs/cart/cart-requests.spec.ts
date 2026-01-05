/**
 * @file cart-requests.spec.ts
 * @description Testes unitários para as interfaces de requisição do Cart
 */

import {
  AddToCartRequest,
  UpdateCartItemRequest,
  ApplyCouponRequest
} from '../../cart.model';

describe('AddToCartRequest Interface', () => {
  it('should create request to add single item', () => {
    const request: AddToCartRequest = {
      productId: 'prod-123',
      quantity: 1
    };

    expect(request.productId).toBe('prod-123');
    expect(request.quantity).toBe(1);
  });

  it('should create request to add multiple items', () => {
    const request: AddToCartRequest = {
      productId: 'prod-456',
      quantity: 5
    };

    expect(request.quantity).toBe(5);
  });

  it('should handle large quantity', () => {
    const request: AddToCartRequest = {
      productId: 'prod-bulk',
      quantity: 100
    };

    expect(request.quantity).toBe(100);
  });
});

describe('UpdateCartItemRequest Interface', () => {
  it('should create update request with new quantity', () => {
    const request: UpdateCartItemRequest = {
      quantity: 3
    };

    expect(request.quantity).toBe(3);
  });

  it('should allow quantity of 1', () => {
    const request: UpdateCartItemRequest = {
      quantity: 1
    };

    expect(request.quantity).toBe(1);
  });

  it('should handle increase quantity', () => {
    const currentQuantity = 2;
    const request: UpdateCartItemRequest = {
      quantity: currentQuantity + 1
    };

    expect(request.quantity).toBe(3);
  });

  it('should handle decrease quantity', () => {
    const currentQuantity = 5;
    const request: UpdateCartItemRequest = {
      quantity: currentQuantity - 2
    };

    expect(request.quantity).toBe(3);
  });
});

describe('ApplyCouponRequest Interface', () => {
  it('should create coupon request', () => {
    const request: ApplyCouponRequest = {
      couponCode: 'DESCONTO10'
    };

    expect(request.couponCode).toBe('DESCONTO10');
  });

  it('should handle uppercase coupon code', () => {
    const request: ApplyCouponRequest = {
      couponCode: 'PRIMEIRACOMPRA'
    };

    expect(request.couponCode).toBe('PRIMEIRACOMPRA');
  });

  it('should handle lowercase coupon code', () => {
    const request: ApplyCouponRequest = {
      couponCode: 'fretegratis'
    };

    expect(request.couponCode).toBe('fretegratis');
  });

  it('should handle alphanumeric coupon code', () => {
    const request: ApplyCouponRequest = {
      couponCode: 'BLACK2025'
    };

    expect(request.couponCode).toBe('BLACK2025');
  });
});
