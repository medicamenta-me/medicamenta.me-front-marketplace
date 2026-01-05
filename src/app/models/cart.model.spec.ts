/**
 * @file cart.model.spec.ts
 * @description Testes unitários para o modelo de carrinho do marketplace
 * @coverage 100% target
 */

import {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
  ApplyCouponRequest,
  CartSummary
} from './cart.model';

describe('Cart Model', () => {

  // ==========================================================================
  // Cart INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // CartItem INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // AddToCartRequest INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // UpdateCartItemRequest INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // ApplyCouponRequest INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // CartSummary INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // EDGE CASES & VALIDATION TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle cart with single item', () => {
      const cart: Cart = {
        id: 'single',
        userId: 'user',
        pharmacyId: 'pharma',
        items: [
          {
            productId: 'p1',
            quantity: 1,
            unitPrice: 999,
            subtotal: 999,
            total: 999
          }
        ],
        subtotal: 999,
        deliveryFee: 500,
        discount: 0,
        total: 1499,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(cart.items.length).toBe(1);
      expect(cart.total).toBe(1499);
    });

    it('should handle cart with many items', () => {
      const items: CartItem[] = Array.from({ length: 10 }, (_, i) => ({
        productId: `prod-${i}`,
        quantity: i + 1,
        unitPrice: 1000,
        subtotal: (i + 1) * 1000,
        total: (i + 1) * 1000
      }));

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

      const cart: Cart = {
        id: 'many',
        userId: 'user',
        pharmacyId: 'pharma',
        items,
        subtotal,
        deliveryFee: 0,
        discount: 0,
        total: subtotal,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(cart.items.length).toBe(10);
      // Sum of 1+2+3+...+10 = 55, times 1000 = 55000
      expect(cart.subtotal).toBe(55000);
    });

    it('should handle zero delivery fee', () => {
      const cart: Cart = {
        id: 'zero-delivery',
        userId: 'user',
        pharmacyId: 'pharma',
        items: [],
        subtotal: 5000,
        deliveryFee: 0,
        discount: 0,
        total: 5000,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(cart.deliveryFee).toBe(0);
      expect(cart.total).toBe(cart.subtotal);
    });

    it('should handle maximum discount', () => {
      const subtotal = 10000;
      const maxDiscount = subtotal; // 100% off

      const cart: Cart = {
        id: 'max-discount',
        userId: 'user',
        pharmacyId: 'pharma',
        items: [],
        subtotal,
        deliveryFee: 500,
        discount: maxDiscount,
        total: 500, // Only delivery fee
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(cart.discount).toBe(cart.subtotal);
      expect(cart.total).toBe(cart.deliveryFee);
    });

    it('should handle high-value cart', () => {
      const cart: Cart = {
        id: 'high-value',
        userId: 'user',
        pharmacyId: 'pharma',
        items: [
          {
            productId: 'expensive',
            quantity: 10,
            unitPrice: 99990, // R$ 999,90
            subtotal: 999900,
            total: 999900
          }
        ],
        subtotal: 999900,
        deliveryFee: 0,
        discount: 99990,
        total: 899910,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(cart.subtotal).toBe(999900);
      expect(cart.total).toBe(899910);
    });

    it('should handle cart with product loaded', () => {
      const item: CartItem = {
        productId: 'prod-loaded',
        product: {
          id: 'prod-loaded',
          name: 'Produto Completo',
          description: 'Descrição completa',
          price: 2990,
          images: ['img1.jpg', 'img2.jpg'],
          stock: 50,
          category: 'vitamins'
        },
        quantity: 2,
        unitPrice: 2990,
        subtotal: 5980,
        total: 5980
      };

      expect(item.product).toBeDefined();
      expect(item.product.name).toBe('Produto Completo');
      expect(item.product.images.length).toBe(2);
    });

    it('should handle cart item quantity updates', () => {
      // Simulate quantity update flow
      const originalItem: CartItem = {
        productId: 'prod-update',
        quantity: 1,
        unitPrice: 2000,
        subtotal: 2000,
        total: 2000
      };

      const updateRequest: UpdateCartItemRequest = {
        quantity: 5
      };

      // Calculate new values
      const updatedItem: CartItem = {
        ...originalItem,
        quantity: updateRequest.quantity,
        subtotal: updateRequest.quantity * originalItem.unitPrice,
        total: updateRequest.quantity * originalItem.unitPrice
      };

      expect(updatedItem.quantity).toBe(5);
      expect(updatedItem.subtotal).toBe(10000);
      expect(updatedItem.total).toBe(10000);
    });

    it('should handle cart summary for threshold calculation', () => {
      // Free delivery threshold = R$ 100,00 (10000 centavos)
      const threshold = 10000;
      const currentSubtotal = 7500;
      const missing = threshold - currentSubtotal;

      const summary: CartSummary = {
        itemCount: 3,
        subtotal: currentSubtotal,
        deliveryFee: 800,
        discount: 0,
        total: currentSubtotal + 800,
        hasFreeDelivery: currentSubtotal >= threshold,
        missingForFreeDelivery: currentSubtotal < threshold ? missing : undefined
      };

      expect(summary.hasFreeDelivery).toBe(false);
      expect(summary.missingForFreeDelivery).toBe(2500);
    });

    it('should handle cart summary at free delivery threshold', () => {
      const threshold = 10000;
      const currentSubtotal = 10000;

      const summary: CartSummary = {
        itemCount: 5,
        subtotal: currentSubtotal,
        deliveryFee: 0,
        discount: 0,
        total: currentSubtotal,
        hasFreeDelivery: currentSubtotal >= threshold
      };

      expect(summary.hasFreeDelivery).toBe(true);
      expect(summary.deliveryFee).toBe(0);
      expect(summary.missingForFreeDelivery).toBeUndefined();
    });
  });
});
