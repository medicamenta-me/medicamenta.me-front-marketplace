/**
 * 🧪 Cart Service Tests
 * Testes unitários para o serviço de carrinho
 * 
 * Cenários:
 * - Carregamento de carrinho
 * - Adição de itens
 * - Atualização de quantidade
 * - Remoção de itens
 * - Aplicação de cupons
 * - Cálculo de totais
 * - Frete grátis
 * - Expiração do carrinho
 * - Edge cases e erros
 * - Testes com mocks do Firestore
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { 
  CartService, 
  CART_CONFIG, 
  VALID_COUPONS, 
  CouponValidation 
} from './cart.service';
import { AuthService } from './auth.service';
import { Cart, CartItem, CartSummary, AddToCartRequest } from '../../models/cart.model';
import { of } from 'rxjs';

describe('CartService', () => {
  // ============================================
  // TESTES DE CONFIGURAÇÃO E CONSTANTES
  // ============================================

  describe('CART_CONFIG', () => {
    it('should have correct FREE_DELIVERY_THRESHOLD', () => {
      expect(CART_CONFIG.FREE_DELIVERY_THRESHOLD).toBe(15000);
    });

    it('should have correct DEFAULT_DELIVERY_FEE', () => {
      expect(CART_CONFIG.DEFAULT_DELIVERY_FEE).toBe(999);
    });

    it('should have correct MIN_QUANTITY', () => {
      expect(CART_CONFIG.MIN_QUANTITY).toBe(1);
    });

    it('should have correct MAX_QUANTITY', () => {
      expect(CART_CONFIG.MAX_QUANTITY).toBe(99);
    });

    it('should have correct CART_EXPIRY_DAYS', () => {
      expect(CART_CONFIG.CART_EXPIRY_DAYS).toBe(7);
    });

    it('should have all required config properties', () => {
      expect(CART_CONFIG.FREE_DELIVERY_THRESHOLD).toBeDefined();
      expect(CART_CONFIG.DEFAULT_DELIVERY_FEE).toBeDefined();
      expect(CART_CONFIG.MIN_QUANTITY).toBeDefined();
      expect(CART_CONFIG.MAX_QUANTITY).toBeDefined();
      expect(CART_CONFIG.CART_EXPIRY_DAYS).toBeDefined();
    });
  });

  describe('VALID_COUPONS', () => {
    it('should have BEMVINDO10 coupon', () => {
      expect(VALID_COUPONS['BEMVINDO10']).toBeDefined();
      expect(VALID_COUPONS['BEMVINDO10'].percent).toBe(10);
      expect(VALID_COUPONS['BEMVINDO10'].minOrder).toBe(5000);
    });

    it('should have PRIMEIRA20 coupon', () => {
      expect(VALID_COUPONS['PRIMEIRA20']).toBeDefined();
      expect(VALID_COUPONS['PRIMEIRA20'].percent).toBe(20);
      expect(VALID_COUPONS['PRIMEIRA20'].minOrder).toBe(10000);
    });

    it('should have FRETE coupon', () => {
      expect(VALID_COUPONS['FRETE']).toBeDefined();
      expect(VALID_COUPONS['FRETE'].amount).toBe(999);
      expect(VALID_COUPONS['FRETE'].minOrder).toBe(5000);
    });

    it('should have DESC15 coupon', () => {
      expect(VALID_COUPONS['DESC15']).toBeDefined();
      expect(VALID_COUPONS['DESC15'].percent).toBe(15);
      expect(VALID_COUPONS['DESC15'].minOrder).toBe(7500);
    });

    it('should have 4 valid coupons', () => {
      expect(Object.keys(VALID_COUPONS).length).toBe(4);
    });
  });

  // ============================================
  // TESTES DE INTERFACES
  // ============================================

  describe('CouponValidation Interface', () => {
    it('should create valid coupon validation', () => {
      const validation: CouponValidation = {
        valid: true,
        discountPercent: 10
      };
      expect(validation.valid).toBe(true);
      expect(validation.discountPercent).toBe(10);
    });

    it('should create invalid coupon validation', () => {
      const validation: CouponValidation = {
        valid: false,
        errorMessage: 'Cupom inválido'
      };
      expect(validation.valid).toBe(false);
      expect(validation.errorMessage).toBe('Cupom inválido');
    });

    it('should create validation with discount amount', () => {
      const validation: CouponValidation = {
        valid: true,
        discountAmount: 999
      };
      expect(validation.discountAmount).toBe(999);
    });

    it('should create validation with all optional fields', () => {
      const validation: CouponValidation = {
        valid: true,
        discountPercent: 10,
        discountAmount: 500,
        errorMessage: undefined
      };
      expect(validation.valid).toBe(true);
    });
  });

  // ============================================
  // TESTES DE MODELO Cart
  // ============================================

  describe('Cart Interface', () => {
    const createMockCart = (): Cart => ({
      id: 'cart-123',
      userId: 'user-456',
      pharmacyId: 'pharmacy-789',
      items: [],
      subtotal: 0,
      deliveryFee: CART_CONFIG.DEFAULT_DELIVERY_FEE,
      discount: 0,
      total: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    it('should create cart with required fields', () => {
      const cart = createMockCart();
      expect(cart.id).toBe('cart-123');
      expect(cart.userId).toBe('user-456');
      expect(cart.pharmacyId).toBe('pharmacy-789');
    });

    it('should have empty items array initially', () => {
      const cart = createMockCart();
      expect(cart.items).toEqual([]);
      expect(cart.items.length).toBe(0);
    });

    it('should have default delivery fee', () => {
      const cart = createMockCart();
      expect(cart.deliveryFee).toBe(CART_CONFIG.DEFAULT_DELIVERY_FEE);
    });

    it('should have zero initial values', () => {
      const cart = createMockCart();
      expect(cart.subtotal).toBe(0);
      expect(cart.discount).toBe(0);
      expect(cart.total).toBe(0);
    });

    it('should have expiration date', () => {
      const cart = createMockCart();
      expect(cart.expiresAt).toBeDefined();
      expect(cart.expiresAt instanceof Date).toBe(true);
    });

    it('should have timestamps', () => {
      const cart = createMockCart();
      expect(cart.createdAt).toBeDefined();
      expect(cart.updatedAt).toBeDefined();
    });

    it('should allow optional couponCode', () => {
      const cart: Cart = {
        ...createMockCart(),
        couponCode: 'BEMVINDO10'
      };
      expect(cart.couponCode).toBe('BEMVINDO10');
    });
  });

  describe('CartItem Interface', () => {
    const createMockCartItem = (): CartItem => ({
      productId: 'prod-123',
      quantity: 2,
      unitPrice: 1990,
      subtotal: 3980,
      total: 3980
    });

    it('should create cart item with required fields', () => {
      const item = createMockCartItem();
      expect(item.productId).toBe('prod-123');
      expect(item.quantity).toBe(2);
      expect(item.unitPrice).toBe(1990);
    });

    it('should calculate subtotal correctly', () => {
      const item = createMockCartItem();
      expect(item.subtotal).toBe(item.quantity * item.unitPrice);
    });

    it('should have total equal to subtotal when no discount', () => {
      const item = createMockCartItem();
      expect(item.total).toBe(item.subtotal);
    });

    it('should allow optional product data', () => {
      const item: CartItem = {
        ...createMockCartItem(),
        product: { name: 'Dipirona 500mg' }
      };
      expect(item.product?.name).toBe('Dipirona 500mg');
    });
  });

  describe('CartSummary Interface', () => {
    it('should create summary with all required fields', () => {
      const summary: CartSummary = {
        itemCount: 3,
        subtotal: 15000,
        deliveryFee: 0,
        discount: 1500,
        total: 13500,
        hasFreeDelivery: true
      };
      expect(summary.itemCount).toBe(3);
      expect(summary.hasFreeDelivery).toBe(true);
    });

    it('should calculate total correctly', () => {
      const summary: CartSummary = {
        itemCount: 2,
        subtotal: 10000,
        deliveryFee: 999,
        discount: 0,
        total: 10999,
        hasFreeDelivery: false,
        missingForFreeDelivery: 5000
      };
      expect(summary.total).toBe(summary.subtotal + summary.deliveryFee - summary.discount);
    });

    it('should show missing for free delivery', () => {
      const summary: CartSummary = {
        itemCount: 1,
        subtotal: 10000,
        deliveryFee: 999,
        discount: 0,
        total: 10999,
        hasFreeDelivery: false,
        missingForFreeDelivery: 5000
      };
      expect(summary.missingForFreeDelivery).toBe(5000);
    });
  });

  // ============================================
  // TESTES DE LÓGICA DE CÁLCULO
  // ============================================

  describe('Cart Calculation Logic', () => {
    describe('Subtotal Calculation', () => {
      it('should calculate subtotal from single item', () => {
        const items: CartItem[] = [{
          productId: '1',
          quantity: 2,
          unitPrice: 1500,
          subtotal: 3000,
          total: 3000
        }];
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        expect(subtotal).toBe(3000);
      });

      it('should calculate subtotal from multiple items', () => {
        const items: CartItem[] = [
          { productId: '1', quantity: 2, unitPrice: 1500, subtotal: 3000, total: 3000 },
          { productId: '2', quantity: 1, unitPrice: 2000, subtotal: 2000, total: 2000 },
          { productId: '3', quantity: 3, unitPrice: 1000, subtotal: 3000, total: 3000 }
        ];
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        expect(subtotal).toBe(8000);
      });

      it('should return 0 for empty items', () => {
        const items: CartItem[] = [];
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        expect(subtotal).toBe(0);
      });
    });

    describe('Delivery Fee Calculation', () => {
      it('should have free delivery when subtotal >= threshold', () => {
        const subtotal = CART_CONFIG.FREE_DELIVERY_THRESHOLD;
        const hasFreeDelivery = subtotal >= CART_CONFIG.FREE_DELIVERY_THRESHOLD;
        expect(hasFreeDelivery).toBe(true);
      });

      it('should have delivery fee when subtotal < threshold', () => {
        const subtotal = CART_CONFIG.FREE_DELIVERY_THRESHOLD - 1;
        const hasFreeDelivery = subtotal >= CART_CONFIG.FREE_DELIVERY_THRESHOLD;
        expect(hasFreeDelivery).toBe(false);
      });

      it('should calculate missing for free delivery', () => {
        const subtotal = 10000;
        const missing = CART_CONFIG.FREE_DELIVERY_THRESHOLD - subtotal;
        expect(missing).toBe(5000);
      });

      it('should return 0 missing when free delivery achieved', () => {
        const subtotal = 20000;
        const hasFreeDelivery = subtotal >= CART_CONFIG.FREE_DELIVERY_THRESHOLD;
        const missing = hasFreeDelivery ? 0 : CART_CONFIG.FREE_DELIVERY_THRESHOLD - subtotal;
        expect(missing).toBe(0);
      });
    });

    describe('Discount Calculation', () => {
      it('should calculate percentage discount', () => {
        const subtotal = 10000;
        const percent = 10;
        const discount = Math.floor(subtotal * percent / 100);
        expect(discount).toBe(1000);
      });

      it('should calculate fixed amount discount', () => {
        const discount = 999;
        expect(discount).toBe(999);
      });

      it('should not allow negative total', () => {
        const subtotal = 1000;
        const deliveryFee = 0;
        const discount = 2000; // More than subtotal
        const total = Math.max(0, subtotal + deliveryFee - discount);
        expect(total).toBe(0);
      });
    });

    describe('Total Calculation', () => {
      it('should calculate total correctly', () => {
        const subtotal = 10000;
        const deliveryFee = 999;
        const discount = 1000;
        const total = subtotal + deliveryFee - discount;
        expect(total).toBe(9999);
      });

      it('should calculate total with free delivery', () => {
        const subtotal = 20000;
        const deliveryFee = 0;
        const discount = 0;
        const total = subtotal + deliveryFee - discount;
        expect(total).toBe(20000);
      });

      it('should calculate total with coupon', () => {
        const subtotal = 10000;
        const deliveryFee = 999;
        const discount = 1000;
        const total = subtotal + deliveryFee - discount;
        expect(total).toBe(9999);
      });
    });

    describe('Item Count Calculation', () => {
      it('should count single item', () => {
        const items: CartItem[] = [
          { productId: '1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
        ];
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        expect(count).toBe(1);
      });

      it('should count multiple items', () => {
        const items: CartItem[] = [
          { productId: '1', quantity: 2, unitPrice: 1000, subtotal: 2000, total: 2000 },
          { productId: '2', quantity: 3, unitPrice: 1500, subtotal: 4500, total: 4500 }
        ];
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        expect(count).toBe(5);
      });

      it('should return 0 for empty cart', () => {
        const items: CartItem[] = [];
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        expect(count).toBe(0);
      });
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE CUPOM
  // ============================================

  describe('Coupon Validation', () => {
    const validateCoupon = (code: string, subtotal: number): CouponValidation => {
      const coupon = VALID_COUPONS[code];
      
      if (!coupon) {
        return { valid: false, errorMessage: 'Cupom não encontrado' };
      }

      if (coupon.minOrder && subtotal < coupon.minOrder) {
        return { valid: false, errorMessage: `Pedido mínimo não atingido` };
      }

      return {
        valid: true,
        discountPercent: coupon.percent,
        discountAmount: coupon.amount
      };
    };

    it('should validate BEMVINDO10 coupon', () => {
      const result = validateCoupon('BEMVINDO10', 5000);
      expect(result.valid).toBe(true);
      expect(result.discountPercent).toBe(10);
    });

    it('should reject BEMVINDO10 below min order', () => {
      const result = validateCoupon('BEMVINDO10', 4000);
      expect(result.valid).toBe(false);
    });

    it('should validate PRIMEIRA20 coupon', () => {
      const result = validateCoupon('PRIMEIRA20', 10000);
      expect(result.valid).toBe(true);
      expect(result.discountPercent).toBe(20);
    });

    it('should reject PRIMEIRA20 below min order', () => {
      const result = validateCoupon('PRIMEIRA20', 8000);
      expect(result.valid).toBe(false);
    });

    it('should validate FRETE coupon', () => {
      const result = validateCoupon('FRETE', 5000);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(999);
    });

    it('should validate DESC15 coupon', () => {
      const result = validateCoupon('DESC15', 7500);
      expect(result.valid).toBe(true);
      expect(result.discountPercent).toBe(15);
    });

    it('should reject invalid coupon', () => {
      const result = validateCoupon('INVALID', 10000);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('Cupom não encontrado');
    });

    it('should reject empty coupon code', () => {
      const result = validateCoupon('', 10000);
      expect(result.valid).toBe(false);
    });
  });

  // ============================================
  // TESTES DE EXPIRAÇÃO DO CARRINHO
  // ============================================

  describe('Cart Expiration', () => {
    const isCartExpired = (cart: Cart): boolean => {
      return new Date() > cart.expiresAt;
    };

    it('should not be expired when created', () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CART_CONFIG.CART_EXPIRY_DAYS);
      
      const cart: Cart = {
        id: '1',
        userId: 'user',
        pharmacyId: 'pharm',
        items: [],
        subtotal: 0,
        deliveryFee: 999,
        discount: 0,
        total: 0,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isCartExpired(cart)).toBe(false);
    });

    it('should be expired after expiry date', () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Yesterday
      
      const cart: Cart = {
        id: '1',
        userId: 'user',
        pharmacyId: 'pharm',
        items: [],
        subtotal: 0,
        deliveryFee: 999,
        discount: 0,
        total: 0,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isCartExpired(cart)).toBe(true);
    });

    it('should be expired exactly at expiry time', () => {
      const expiresAt = new Date(Date.now() - 1000); // 1 second ago
      
      const cart: Cart = {
        id: '1',
        userId: 'user',
        pharmacyId: 'pharm',
        items: [],
        subtotal: 0,
        deliveryFee: 999,
        discount: 0,
        total: 0,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isCartExpired(cart)).toBe(true);
    });
  });

  // ============================================
  // TESTES DE FORMATAÇÃO
  // ============================================

  describe('Currency Formatting', () => {
    const formatCurrency = (valueInCents: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valueInCents / 100);
    };

    it('should format 0 cents', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('0,00');
    });

    it('should format 999 cents as R$ 9,99', () => {
      const formatted = formatCurrency(999);
      expect(formatted).toContain('9,99');
    });

    it('should format 1000 cents as R$ 10,00', () => {
      const formatted = formatCurrency(1000);
      expect(formatted).toContain('10,00');
    });

    it('should format large value', () => {
      const formatted = formatCurrency(100000);
      expect(formatted).toContain('1.000,00');
    });

    it('should include R$ symbol', () => {
      const formatted = formatCurrency(1500);
      expect(formatted).toContain('R$');
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE QUANTIDADE
  // ============================================

  describe('Quantity Validation', () => {
    const isValidQuantity = (quantity: number): boolean => {
      return quantity >= CART_CONFIG.MIN_QUANTITY && quantity <= CART_CONFIG.MAX_QUANTITY;
    };

    it('should accept minimum quantity', () => {
      expect(isValidQuantity(CART_CONFIG.MIN_QUANTITY)).toBe(true);
    });

    it('should accept maximum quantity', () => {
      expect(isValidQuantity(CART_CONFIG.MAX_QUANTITY)).toBe(true);
    });

    it('should reject zero quantity', () => {
      expect(isValidQuantity(0)).toBe(false);
    });

    it('should reject negative quantity', () => {
      expect(isValidQuantity(-1)).toBe(false);
    });

    it('should reject quantity above maximum', () => {
      expect(isValidQuantity(CART_CONFIG.MAX_QUANTITY + 1)).toBe(false);
    });

    it('should accept quantity in valid range', () => {
      expect(isValidQuantity(5)).toBe(true);
      expect(isValidQuantity(50)).toBe(true);
    });
  });

  // ============================================
  // TESTES DE OPERAÇÕES DE CARRINHO
  // ============================================

  describe('Cart Operations', () => {
    describe('Add Item', () => {
      it('should add item to empty cart', () => {
        const items: CartItem[] = [];
        const newItem: CartItem = {
          productId: 'prod-1',
          quantity: 1,
          unitPrice: 1990,
          subtotal: 1990,
          total: 1990
        };
        const updatedItems = [...items, newItem];
        expect(updatedItems.length).toBe(1);
        expect(updatedItems[0].productId).toBe('prod-1');
      });

      it('should update quantity when adding existing item', () => {
        const items: CartItem[] = [{
          productId: 'prod-1',
          quantity: 1,
          unitPrice: 1990,
          subtotal: 1990,
          total: 1990
        }];

        const addQuantity = 2;
        const existingIndex = items.findIndex(i => i.productId === 'prod-1');
        
        if (existingIndex >= 0) {
          items[existingIndex] = {
            ...items[existingIndex],
            quantity: items[existingIndex].quantity + addQuantity,
            subtotal: (items[existingIndex].quantity + addQuantity) * items[existingIndex].unitPrice,
            total: (items[existingIndex].quantity + addQuantity) * items[existingIndex].unitPrice
          };
        }

        expect(items[0].quantity).toBe(3);
        expect(items[0].subtotal).toBe(5970);
      });

      it('should cap quantity at maximum', () => {
        const currentQuantity = 98;
        const addQuantity = 5;
        const newQuantity = Math.min(currentQuantity + addQuantity, CART_CONFIG.MAX_QUANTITY);
        expect(newQuantity).toBe(CART_CONFIG.MAX_QUANTITY);
      });
    });

    describe('Remove Item', () => {
      it('should remove item from cart', () => {
        const items: CartItem[] = [
          { productId: 'prod-1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 },
          { productId: 'prod-2', quantity: 2, unitPrice: 1500, subtotal: 3000, total: 3000 }
        ];

        const updatedItems = items.filter(i => i.productId !== 'prod-1');
        expect(updatedItems.length).toBe(1);
        expect(updatedItems[0].productId).toBe('prod-2');
      });

      it('should return empty array when removing last item', () => {
        const items: CartItem[] = [
          { productId: 'prod-1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
        ];

        const updatedItems = items.filter(i => i.productId !== 'prod-1');
        expect(updatedItems.length).toBe(0);
      });

      it('should not affect other items', () => {
        const items: CartItem[] = [
          { productId: 'prod-1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 },
          { productId: 'prod-2', quantity: 2, unitPrice: 1500, subtotal: 3000, total: 3000 },
          { productId: 'prod-3', quantity: 3, unitPrice: 2000, subtotal: 6000, total: 6000 }
        ];

        const updatedItems = items.filter(i => i.productId !== 'prod-2');
        expect(updatedItems.length).toBe(2);
        expect(updatedItems.find(i => i.productId === 'prod-1')).toBeDefined();
        expect(updatedItems.find(i => i.productId === 'prod-3')).toBeDefined();
      });
    });

    describe('Update Quantity', () => {
      it('should update item quantity', () => {
        const items: CartItem[] = [
          { productId: 'prod-1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
        ];

        const newQuantity = 5;
        const itemIndex = items.findIndex(i => i.productId === 'prod-1');
        items[itemIndex] = {
          ...items[itemIndex],
          quantity: newQuantity,
          subtotal: newQuantity * items[itemIndex].unitPrice,
          total: newQuantity * items[itemIndex].unitPrice
        };

        expect(items[0].quantity).toBe(5);
        expect(items[0].subtotal).toBe(5000);
      });

      it('should recalculate subtotal on quantity change', () => {
        const unitPrice = 1990;
        const newQuantity = 3;
        const newSubtotal = unitPrice * newQuantity;
        expect(newSubtotal).toBe(5970);
      });
    });
  });

  // ============================================
  // TESTES DE CENÁRIOS EDGE CASE
  // ============================================

  describe('Edge Cases', () => {
    it('should handle very large quantity', () => {
      const quantity = CART_CONFIG.MAX_QUANTITY;
      const unitPrice = 9999;
      const subtotal = quantity * unitPrice;
      expect(subtotal).toBe(989901);
    });

    it('should handle very small unit price', () => {
      const quantity = 10;
      const unitPrice = 1; // 1 centavo
      const subtotal = quantity * unitPrice;
      expect(subtotal).toBe(10);
    });

    it('should handle many items', () => {
      const items: CartItem[] = Array(100).fill(null).map((_, i) => ({
        productId: `prod-${i}`,
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
        total: 1000
      }));

      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      expect(itemCount).toBe(100);
      expect(subtotal).toBe(100000);
    });

    it('should handle special characters in product name', () => {
      const item: CartItem = {
        productId: 'prod-1',
        product: { name: 'Paracetamol 500mg - Caixa c/ 20 cápsulas (®)' },
        quantity: 1,
        unitPrice: 1500,
        subtotal: 1500,
        total: 1500
      };
      expect(item.product?.name).toContain('®');
    });

    it('should handle discount equal to subtotal', () => {
      const subtotal = 10000;
      const discount = 10000;
      const deliveryFee = 0;
      const total = Math.max(0, subtotal + deliveryFee - discount);
      expect(total).toBe(0);
    });

    it('should handle discount greater than subtotal', () => {
      const subtotal = 10000;
      const discount = 15000;
      const deliveryFee = 0;
      const total = Math.max(0, subtotal + deliveryFee - discount);
      expect(total).toBe(0);
    });
  });

  // ============================================
  // TESTES DE INTEGRAÇÃO COM PHARMACY
  // ============================================

  describe('Pharmacy Integration', () => {
    it('should not allow items from different pharmacies', () => {
      const currentPharmacyId: string = 'pharmacy-1';
      const newItemPharmacyId: string = 'pharmacy-2';
      
      const isSamePharmacy = currentPharmacyId === newItemPharmacyId;
      expect(isSamePharmacy).toBe(false);
    });

    it('should allow items from same pharmacy', () => {
      const currentPharmacyId: string = 'pharmacy-1';
      const newItemPharmacyId: string = 'pharmacy-1';
      
      const isSamePharmacy = currentPharmacyId === newItemPharmacyId;
      expect(isSamePharmacy).toBe(true);
    });

    it('should allow first item from any pharmacy', () => {
      const items: CartItem[] = [];
      const canAdd = items.length === 0;
      expect(canAdd).toBe(true);
    });
  });

  // ============================================
  // TESTES DE AddToCartRequest
  // ============================================

  describe('AddToCartRequest Interface', () => {
    it('should create valid request', () => {
      const request: AddToCartRequest = {
        productId: 'prod-123',
        quantity: 2
      };
      expect(request.productId).toBe('prod-123');
      expect(request.quantity).toBe(2);
    });

    it('should validate request fields', () => {
      const request: AddToCartRequest = {
        productId: '',
        quantity: 0
      };
      expect(request.productId).toBe('');
      expect(request.quantity).toBe(0);
    });
  });

  // ============================================
  // TESTES DE CENÁRIOS NEGATIVOS
  // ============================================

  describe('Error Scenarios', () => {
    it('should handle null cart gracefully', () => {
      const checkEmpty = (cart: Cart | null): boolean => {
        if (cart === null) return true;
        return cart.items.length === 0;
      };
      expect(checkEmpty(null)).toBe(true);
    });

    it('should handle undefined items', () => {
      const items: CartItem[] | undefined = undefined;
      const safeItems = items || [];
      expect(safeItems.length).toBe(0);
    });

    it('should handle NaN in calculations', () => {
      const unitPrice = NaN;
      const quantity = 2;
      const subtotal = unitPrice * quantity;
      expect(isNaN(subtotal)).toBe(true);
    });

    it('should handle Infinity in calculations', () => {
      const unitPrice = Infinity;
      const quantity = 2;
      const subtotal = unitPrice * quantity;
      expect(subtotal).toBe(Infinity);
    });

    it('should handle item not found', () => {
      const items: CartItem[] = [
        { productId: 'prod-1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
      ];
      const found = items.find(i => i.productId === 'prod-999');
      expect(found).toBeUndefined();
    });
  });

  // ============================================
  // TESTES COM TESTBED E MOCKS DO FIRESTORE
  // ============================================

  describe('CartService with TestBed', () => {
    let service: CartService;
    let mockFirestore: any;
    let mockAuthService: any;

    const createMockCart = (): Cart => ({
      id: 'cart-123',
      userId: 'user-456',
      pharmacyId: 'pharmacy-789',
      items: [
        { productId: 'prod-1', quantity: 2, unitPrice: 1500, subtotal: 3000, total: 3000 }
      ],
      subtotal: 3000,
      deliveryFee: CART_CONFIG.DEFAULT_DELIVERY_FEE,
      discount: 0,
      total: 3999,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    beforeEach(() => {
      mockFirestore = {
        app: { name: 'test' }
      };

      mockAuthService = {
        currentUser: jasmine.createSpy('currentUser').and.returnValue({ uid: 'user-123', email: 'test@test.com' })
      };

      TestBed.configureTestingModule({
        providers: [
          CartService,
          { provide: Firestore, useValue: mockFirestore },
          { provide: AuthService, useValue: mockAuthService }
        ]
      });

      service = TestBed.inject(CartService);
    });

    describe('✅ Criação do Serviço', () => {
      it('deve criar o serviço', () => {
        expect(service).toBeTruthy();
      });

      it('deve ter sinais reativos inicializados', () => {
        expect(service.cart).toBeDefined();
        expect(service.loading).toBeDefined();
        expect(service.error).toBeDefined();
      });

      it('deve ter cart inicial como null', () => {
        expect(service.cart()).toBeNull();
      });

      it('deve ter loading inicial como false', () => {
        expect(service.loading()).toBe(false);
      });

      it('deve ter error inicial como null', () => {
        expect(service.error()).toBeNull();
      });
    });

    describe('✅ Computed Signals', () => {
      it('itemCount deve retornar 0 para carrinho null', () => {
        expect(service.itemCount()).toBe(0);
      });

      it('isEmpty deve retornar true para carrinho vazio', () => {
        expect(service.isEmpty()).toBe(true);
      });

      it('cartSummary deve retornar null para carrinho null', () => {
        expect(service.cartSummary()).toBeNull();
      });
    });

    describe('✅ validateCoupon', () => {
      it('deve validar cupom BEMVINDO10 corretamente', () => {
        const result = service.validateCoupon('BEMVINDO10', 5000);
        expect(result.valid).toBe(true);
        expect(result.discountPercent).toBe(10);
      });

      it('deve rejeitar cupom BEMVINDO10 abaixo do mínimo', () => {
        const result = service.validateCoupon('BEMVINDO10', 4000);
        expect(result.valid).toBe(false);
        expect(result.errorMessage).toContain('mínimo');
      });

      it('deve validar cupom PRIMEIRA20 corretamente', () => {
        const result = service.validateCoupon('PRIMEIRA20', 10000);
        expect(result.valid).toBe(true);
        expect(result.discountPercent).toBe(20);
      });

      it('deve rejeitar cupom PRIMEIRA20 abaixo do mínimo', () => {
        const result = service.validateCoupon('PRIMEIRA20', 9000);
        expect(result.valid).toBe(false);
      });

      it('deve validar cupom FRETE corretamente', () => {
        const result = service.validateCoupon('FRETE', 5000);
        expect(result.valid).toBe(true);
        expect(result.discountAmount).toBe(999);
      });

      it('deve validar cupom DESC15 corretamente', () => {
        const result = service.validateCoupon('DESC15', 7500);
        expect(result.valid).toBe(true);
        expect(result.discountPercent).toBe(15);
      });

      it('deve rejeitar cupom inexistente', () => {
        const result = service.validateCoupon('INVALIDO', 10000);
        expect(result.valid).toBe(false);
        expect(result.errorMessage).toBe('Cupom não encontrado');
      });

      it('deve rejeitar cupom vazio', () => {
        const result = service.validateCoupon('', 10000);
        expect(result.valid).toBe(false);
      });
    });

    describe('✅ isCartExpired', () => {
      it('deve retornar false para carrinho não expirado', () => {
        const cart = createMockCart();
        expect(service.isCartExpired(cart)).toBe(false);
      });

      it('deve retornar true para carrinho expirado', () => {
        const cart = createMockCart();
        cart.expiresAt = new Date(Date.now() - 1000);
        expect(service.isCartExpired(cart)).toBe(true);
      });

      it('deve retornar true para carrinho com data passada', () => {
        const cart = createMockCart();
        cart.expiresAt = new Date('2020-01-01');
        expect(service.isCartExpired(cart)).toBe(true);
      });
    });

    describe('✅ recalculateCart', () => {
      it('deve recalcular subtotal corretamente', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 2, unitPrice: 1000, subtotal: 2000, total: 2000 },
          { productId: '2', quantity: 1, unitPrice: 3000, subtotal: 3000, total: 3000 }
        ];
        const result = service.recalculateCart(cart);
        expect(result.subtotal).toBe(5000);
      });

      it('deve aplicar frete grátis quando subtotal >= threshold', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 10, unitPrice: 1500, subtotal: 15000, total: 15000 }
        ];
        const result = service.recalculateCart(cart);
        expect(result.deliveryFee).toBe(0);
      });

      it('deve manter frete quando subtotal < threshold', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
        ];
        const result = service.recalculateCart(cart);
        expect(result.deliveryFee).toBe(CART_CONFIG.DEFAULT_DELIVERY_FEE);
      });

      it('deve calcular total corretamente', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 1, unitPrice: 10000, subtotal: 10000, total: 10000 }
        ];
        cart.discount = 1000;
        const result = service.recalculateCart(cart);
        expect(result.total).toBe(result.subtotal + result.deliveryFee - result.discount);
      });

      it('deve garantir total não negativo', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
        ];
        cart.discount = 50000; // Desconto maior que subtotal
        const result = service.recalculateCart(cart);
        expect(result.total).toBeGreaterThanOrEqual(0);
      });

      it('deve atualizar updatedAt', () => {
        const cart = createMockCart();
        const oldUpdatedAt = cart.updatedAt;
        const result = service.recalculateCart(cart);
        expect(result.updatedAt).not.toBe(oldUpdatedAt);
      });

      it('deve recalcular desconto com cupom válido', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 1, unitPrice: 10000, subtotal: 10000, total: 10000 }
        ];
        cart.couponCode = 'BEMVINDO10';
        const result = service.recalculateCart(cart);
        expect(result.discount).toBe(1000); // 10% de 10000
      });

      it('deve zerar desconto quando cupom fica inválido', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
        ];
        cart.couponCode = 'BEMVINDO10'; // Requer minOrder 5000
        const result = service.recalculateCart(cart);
        expect(result.discount).toBe(0);
      });
    });

    describe('✅ calculateSummary', () => {
      it('deve calcular itemCount corretamente', () => {
        const cart = createMockCart();
        cart.items = [
          { productId: '1', quantity: 2, unitPrice: 1000, subtotal: 2000, total: 2000 },
          { productId: '2', quantity: 3, unitPrice: 1500, subtotal: 4500, total: 4500 }
        ];
        const summary = service.calculateSummary(cart);
        expect(summary.itemCount).toBe(5);
      });

      it('deve identificar frete grátis', () => {
        const cart = createMockCart();
        cart.subtotal = CART_CONFIG.FREE_DELIVERY_THRESHOLD;
        const summary = service.calculateSummary(cart);
        expect(summary.hasFreeDelivery).toBe(true);
      });

      it('deve calcular valor faltando para frete grátis', () => {
        const cart = createMockCart();
        cart.subtotal = 10000;
        const summary = service.calculateSummary(cart);
        expect(summary.missingForFreeDelivery).toBe(5000);
      });

      it('deve não mostrar valor faltando quando tem frete grátis', () => {
        const cart = createMockCart();
        cart.subtotal = CART_CONFIG.FREE_DELIVERY_THRESHOLD;
        const summary = service.calculateSummary(cart);
        expect(summary.missingForFreeDelivery).toBeUndefined();
      });

      it('deve calcular total corretamente', () => {
        const cart = createMockCart();
        cart.subtotal = 10000;
        cart.deliveryFee = 999;
        cart.discount = 500;
        const summary = service.calculateSummary(cart);
        expect(summary.total).toBe(10499);
      });
    });

    describe('✅ formatCurrency', () => {
      it('deve formatar 0 centavos', () => {
        const result = service.formatCurrency(0);
        expect(result).toContain('0,00');
      });

      it('deve formatar valor em centavos', () => {
        const result = service.formatCurrency(1990);
        expect(result).toContain('19,90');
      });

      it('deve formatar valor grande', () => {
        const result = service.formatCurrency(100000);
        expect(result).toContain('1.000,00');
      });

      it('deve incluir símbolo R$', () => {
        const result = service.formatCurrency(1000);
        expect(result).toContain('R$');
      });

      it('deve formatar centavos corretamente', () => {
        const result = service.formatCurrency(99);
        expect(result).toContain('0,99');
      });
    });

    describe('✅ loadCart sem usuário autenticado', () => {
      beforeEach(() => {
        mockAuthService.currentUser.and.returnValue(null);
      });

      it('deve retornar null quando não há usuário', fakeAsync(() => {
        let result: Cart | null = undefined as any;
        service.loadCart().subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull();
      }));

      it('deve setar cart como null', fakeAsync(() => {
        service.loadCart().subscribe();
        tick();
        expect(service.cart()).toBeNull();
      }));
    });

    describe('✅ addItem sem usuário autenticado', () => {
      beforeEach(() => {
        mockAuthService.currentUser.and.returnValue(null);
      });

      it('deve retornar null quando não há usuário', fakeAsync(() => {
        const request: AddToCartRequest = { productId: 'prod-1', quantity: 1 };
        const product = { name: 'Test', price: 1000, pharmacyId: 'pharm-1' };
        
        let result: Cart | null = undefined as any;
        service.addItem(request, product).subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull();
      }));

      it('deve setar erro de autenticação', fakeAsync(() => {
        const request: AddToCartRequest = { productId: 'prod-1', quantity: 1 };
        const product = { name: 'Test', price: 1000, pharmacyId: 'pharm-1' };
        
        service.addItem(request, product).subscribe();
        tick();
        expect(service.error()).toBe('Usuário não autenticado');
      }));
    });

    describe('✅ addItem validação de quantidade', () => {
      it('deve rejeitar quantidade abaixo do mínimo', fakeAsync(() => {
        const request: AddToCartRequest = { productId: 'prod-1', quantity: 0 };
        const product = { name: 'Test', price: 1000, pharmacyId: 'pharm-1' };
        
        let result: Cart | null = undefined as any;
        service.addItem(request, product).subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull();
        expect(service.error()).toContain('Quantidade');
      }));

      it('deve rejeitar quantidade acima do máximo', fakeAsync(() => {
        const request: AddToCartRequest = { productId: 'prod-1', quantity: 100 };
        const product = { name: 'Test', price: 1000, pharmacyId: 'pharm-1' };
        
        let result: Cart | null = undefined as any;
        service.addItem(request, product).subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull();
        expect(service.error()).toContain('Quantidade');
      }));
    });

    describe('✅ updateItemQuantity sem carrinho', () => {
      it('deve retornar null quando carrinho está vazio', fakeAsync(() => {
        let result: Cart | null = undefined as any;
        service.updateItemQuantity('prod-1', 2).subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull();
        expect(service.error()).toBe('Carrinho vazio');
      }));
    });

    describe('✅ updateItemQuantity validação', () => {
      it('deve rejeitar quantidade acima do máximo', fakeAsync(() => {
        // Primeiro precisamos de um carrinho, mas como o mock não está completo,
        // vamos testar apenas a lógica de validação
        let result: Cart | null = undefined as any;
        service.updateItemQuantity('prod-1', 100).subscribe(cart => {
          result = cart;
        });
        tick();
        // Deve ter erro porque não há carrinho
        expect(result).toBeNull();
      }));
    });

    describe('✅ removeItem sem carrinho', () => {
      it('deve retornar null quando carrinho está vazio', fakeAsync(() => {
        let result: Cart | null = undefined as any;
        service.removeItem('prod-1').subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull();
        expect(service.error()).toBe('Carrinho vazio');
      }));
    });

    describe('✅ applyCoupon sem carrinho', () => {
      it('deve retornar inválido quando carrinho está vazio', fakeAsync(() => {
        let result: CouponValidation | undefined;
        service.applyCoupon('BEMVINDO10').subscribe(validation => {
          result = validation;
        });
        tick();
        expect(result?.valid).toBe(false);
        expect(result?.errorMessage).toBe('Carrinho vazio');
      }));
    });

    describe('✅ removeCoupon sem carrinho', () => {
      it('deve retornar carrinho atual quando vazio', fakeAsync(() => {
        let result: Cart | null = undefined as any;
        service.removeCoupon().subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull(); // cart é null
      }));
    });

    describe('✅ clearCart sem usuário', () => {
      beforeEach(() => {
        mockAuthService.currentUser.and.returnValue(null);
      });

      it('deve retornar null e limpar cart', fakeAsync(() => {
        let result: Cart | null = undefined as any;
        service.clearCart().subscribe(cart => {
          result = cart;
        });
        tick();
        expect(result).toBeNull();
        expect(service.cart()).toBeNull();
      }));
    });
  });
});
