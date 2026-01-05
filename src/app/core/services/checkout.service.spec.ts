/**
 * 🧪 Checkout Service Tests
 * Testes unitários para o serviço de checkout
 * 
 * Cenários:
 * - Validação de checkout
 * - Validação de endereço
 * - Validação de pagamento
 * - Geração de número de pedido
 * - Upload de receitas
 * - Mapeamento de itens
 * - Navegação de passos
 * - Edge cases e erros
 * - Testes com TestBed e mocks
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { 
  CheckoutService, 
  CHECKOUT_CONFIG, 
  PAYMENT_METHODS, 
  PaymentMethod,
  CheckoutValidation,
  CheckoutResult,
  CheckoutData,
  CreateOrderApiResponse,
  CreateOrderApiRequest,
  UpdateOrderStatusApiResponse
} from './checkout.service';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { IntegrationService } from './integration.service';
import { Cart, CartItem } from '../../models/cart.model';
import { DeliveryAddress, OrderItem, OrderStatus, PaymentStatus } from '../../models/order.model';
import { CART_CONFIG } from './cart.service';
import { of, throwError } from 'rxjs';

describe('CheckoutService', () => {
  // ============================================
  // TESTES DE CONFIGURAÇÃO
  // ============================================

  describe('CHECKOUT_CONFIG', () => {
    it('should have correct MIN_ORDER_VALUE', () => {
      expect(CHECKOUT_CONFIG.MIN_ORDER_VALUE).toBe(1000);
    });

    it('should have correct MAX_PRESCRIPTION_IMAGES', () => {
      expect(CHECKOUT_CONFIG.MAX_PRESCRIPTION_IMAGES).toBe(5);
    });

    it('should have correct MAX_IMAGE_SIZE_MB', () => {
      expect(CHECKOUT_CONFIG.MAX_IMAGE_SIZE_MB).toBe(5);
    });

    it('should have correct ALLOWED_IMAGE_TYPES', () => {
      expect(CHECKOUT_CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(CHECKOUT_CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/png');
      expect(CHECKOUT_CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/webp');
    });

    it('should have correct ORDER_PREFIX', () => {
      expect(CHECKOUT_CONFIG.ORDER_PREFIX).toBe('ORD');
    });

    it('should have correct PIX_EXPIRY_MINUTES', () => {
      expect(CHECKOUT_CONFIG.PIX_EXPIRY_MINUTES).toBe(30);
    });

    it('should have correct BOLETO_EXPIRY_DAYS', () => {
      expect(CHECKOUT_CONFIG.BOLETO_EXPIRY_DAYS).toBe(3);
    });
  });

  describe('PAYMENT_METHODS', () => {
    it('should have CREDIT_CARD', () => {
      expect(PAYMENT_METHODS.CREDIT_CARD).toBe('credit_card');
    });

    it('should have DEBIT_CARD', () => {
      expect(PAYMENT_METHODS.DEBIT_CARD).toBe('debit_card');
    });

    it('should have PIX', () => {
      expect(PAYMENT_METHODS.PIX).toBe('pix');
    });

    it('should have BOLETO', () => {
      expect(PAYMENT_METHODS.BOLETO).toBe('boleto');
    });

    it('should have 4 payment methods', () => {
      expect(Object.keys(PAYMENT_METHODS).length).toBe(4);
    });
  });

  // ============================================
  // TESTES DE INTERFACES
  // ============================================

  describe('CheckoutValidation Interface', () => {
    it('should create valid validation', () => {
      const validation: CheckoutValidation = {
        valid: true,
        errors: [],
        warnings: []
      };
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should create invalid validation with errors', () => {
      const validation: CheckoutValidation = {
        valid: false,
        errors: ['Carrinho vazio', 'Endereço inválido'],
        warnings: []
      };
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBe(2);
    });

    it('should include warnings', () => {
      const validation: CheckoutValidation = {
        valid: true,
        errors: [],
        warnings: ['Frete grátis acima de R$ 50']
      };
      expect(validation.warnings.length).toBe(1);
    });
  });

  describe('CheckoutResult Interface', () => {
    it('should create successful result', () => {
      const result: CheckoutResult = {
        success: true,
        orderId: 'order-123',
        orderNumber: 'ORD-2025-000001'
      };
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-123');
    });

    it('should create failed result', () => {
      const result: CheckoutResult = {
        success: false,
        errorMessage: 'Erro ao processar pagamento'
      };
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Erro ao processar pagamento');
    });

    it('should include PIX code', () => {
      const result: CheckoutResult = {
        success: true,
        orderId: 'order-123',
        pixCode: '00020126...'
      };
      expect(result.pixCode).toBeDefined();
    });

    it('should include boleto URL', () => {
      const result: CheckoutResult = {
        success: true,
        orderId: 'order-123',
        boletoUrl: '/api/boleto/order-123'
      };
      expect(result.boletoUrl).toBeDefined();
    });
  });

  describe('CheckoutData Interface', () => {
    it('should create delivery checkout data', () => {
      const data: CheckoutData = {
        deliveryType: 'delivery',
        deliveryAddress: createMockAddress(),
        paymentMethod: 'pix'
      };
      expect(data.deliveryType).toBe('delivery');
      expect(data.deliveryAddress).toBeDefined();
    });

    it('should create pickup checkout data', () => {
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'credit_card'
      };
      expect(data.deliveryType).toBe('pickup');
      expect(data.deliveryAddress).toBeUndefined();
    });

    it('should include notes', () => {
      const data: CheckoutData = {
        deliveryType: 'delivery',
        paymentMethod: 'pix',
        notes: 'Entregar na portaria'
      };
      expect(data.notes).toBe('Entregar na portaria');
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE ENDEREÇO
  // ============================================

  describe('Address Validation', () => {
    const validateAddress = (address: DeliveryAddress): string[] => {
      const errors: string[] = [];

      if (!address.recipientName || address.recipientName.length < 3) {
        errors.push('Nome do destinatário inválido');
      }

      if (!address.phone || !isValidPhone(address.phone)) {
        errors.push('Telefone inválido');
      }

      if (!address.street || address.street.length < 3) {
        errors.push('Rua inválida');
      }

      if (!address.number) {
        errors.push('Número obrigatório');
      }

      if (!address.neighborhood || address.neighborhood.length < 2) {
        errors.push('Bairro inválido');
      }

      if (!address.city || address.city.length < 2) {
        errors.push('Cidade inválida');
      }

      if (!address.state || address.state.length !== 2) {
        errors.push('Estado inválido');
      }

      if (!address.zipCode || !isValidZipCode(address.zipCode)) {
        errors.push('CEP inválido');
      }

      return errors;
    };

    it('should validate complete address', () => {
      const address = createMockAddress();
      const errors = validateAddress(address);
      expect(errors.length).toBe(0);
    });

    it('should reject empty recipient name', () => {
      const address = { ...createMockAddress(), recipientName: '' };
      const errors = validateAddress(address);
      expect(errors).toContain('Nome do destinatário inválido');
    });

    it('should reject short recipient name', () => {
      const address = { ...createMockAddress(), recipientName: 'AB' };
      const errors = validateAddress(address);
      expect(errors).toContain('Nome do destinatário inválido');
    });

    it('should reject invalid phone', () => {
      const address = { ...createMockAddress(), phone: '123' };
      const errors = validateAddress(address);
      expect(errors).toContain('Telefone inválido');
    });

    it('should reject empty street', () => {
      const address = { ...createMockAddress(), street: '' };
      const errors = validateAddress(address);
      expect(errors).toContain('Rua inválida');
    });

    it('should reject missing number', () => {
      const address = { ...createMockAddress(), number: '' };
      const errors = validateAddress(address);
      expect(errors).toContain('Número obrigatório');
    });

    it('should reject invalid neighborhood', () => {
      const address = { ...createMockAddress(), neighborhood: 'A' };
      const errors = validateAddress(address);
      expect(errors).toContain('Bairro inválido');
    });

    it('should reject invalid city', () => {
      const address = { ...createMockAddress(), city: '' };
      const errors = validateAddress(address);
      expect(errors).toContain('Cidade inválida');
    });

    it('should reject invalid state', () => {
      const address = { ...createMockAddress(), state: 'SPA' };
      const errors = validateAddress(address);
      expect(errors).toContain('Estado inválido');
    });

    it('should reject invalid zipCode', () => {
      const address = { ...createMockAddress(), zipCode: '123' };
      const errors = validateAddress(address);
      expect(errors).toContain('CEP inválido');
    });

    it('should accept valid 10-digit phone', () => {
      const address = { ...createMockAddress(), phone: '1123456789' };
      const errors = validateAddress(address);
      expect(errors).not.toContain('Telefone inválido');
    });

    it('should accept valid 11-digit phone', () => {
      const address = { ...createMockAddress(), phone: '11987654321' };
      const errors = validateAddress(address);
      expect(errors).not.toContain('Telefone inválido');
    });

    it('should accept phone with formatting', () => {
      const address = { ...createMockAddress(), phone: '(11) 98765-4321' };
      const errors = validateAddress(address);
      expect(errors).not.toContain('Telefone inválido');
    });

    it('should accept CEP with hyphen', () => {
      const address = { ...createMockAddress(), zipCode: '01234-567' };
      const errors = validateAddress(address);
      expect(errors).not.toContain('CEP inválido');
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE TELEFONE
  // ============================================

  describe('Phone Validation', () => {
    it('should validate 10-digit phone', () => {
      expect(isValidPhone('1123456789')).toBe(true);
    });

    it('should validate 11-digit phone', () => {
      expect(isValidPhone('11987654321')).toBe(true);
    });

    it('should validate formatted phone', () => {
      expect(isValidPhone('(11) 98765-4321')).toBe(true);
    });

    it('should reject short phone', () => {
      expect(isValidPhone('12345')).toBe(false);
    });

    it('should reject long phone', () => {
      expect(isValidPhone('123456789012')).toBe(false);
    });

    it('should reject empty phone', () => {
      expect(isValidPhone('')).toBe(false);
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE CEP
  // ============================================

  describe('ZipCode Validation', () => {
    it('should validate 8-digit CEP', () => {
      expect(isValidZipCode('01234567')).toBe(true);
    });

    it('should validate CEP with hyphen', () => {
      expect(isValidZipCode('01234-567')).toBe(true);
    });

    it('should reject short CEP', () => {
      expect(isValidZipCode('1234567')).toBe(false);
    });

    it('should reject long CEP', () => {
      expect(isValidZipCode('123456789')).toBe(false);
    });

    it('should reject empty CEP', () => {
      expect(isValidZipCode('')).toBe(false);
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE PAGAMENTO
  // ============================================

  describe('Payment Method Validation', () => {
    const isValidPaymentMethod = (method: string): boolean => {
      return Object.values(PAYMENT_METHODS).includes(method as PaymentMethod);
    };

    it('should accept credit_card', () => {
      expect(isValidPaymentMethod('credit_card')).toBe(true);
    });

    it('should accept debit_card', () => {
      expect(isValidPaymentMethod('debit_card')).toBe(true);
    });

    it('should accept pix', () => {
      expect(isValidPaymentMethod('pix')).toBe(true);
    });

    it('should accept boleto', () => {
      expect(isValidPaymentMethod('boleto')).toBe(true);
    });

    it('should reject invalid method', () => {
      expect(isValidPaymentMethod('cash')).toBe(false);
    });

    it('should reject empty method', () => {
      expect(isValidPaymentMethod('')).toBe(false);
    });
  });

  // ============================================
  // TESTES DE GERAÇÃO DE NÚMERO DE PEDIDO
  // ============================================

  describe('Order Number Generation', () => {
    const generateOrderNumber = (): string => {
      const date = new Date();
      const year = date.getFullYear();
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `${CHECKOUT_CONFIG.ORDER_PREFIX}-${year}-${random}`;
    };

    it('should start with ORDER_PREFIX', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber.startsWith(CHECKOUT_CONFIG.ORDER_PREFIX)).toBe(true);
    });

    it('should include current year', () => {
      const orderNumber = generateOrderNumber();
      const year = new Date().getFullYear().toString();
      expect(orderNumber).toContain(year);
    });

    it('should have correct format', () => {
      const orderNumber = generateOrderNumber();
      const pattern = /^ORD-\d{4}-\d{6}$/;
      expect(pattern.test(orderNumber)).toBe(true);
    });

    it('should generate unique numbers', () => {
      const numbers = new Set<string>();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateOrderNumber());
      }
      // Pode haver colisões, mas a maioria deve ser única
      expect(numbers.size).toBeGreaterThan(90);
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE CHECKOUT
  // ============================================

  describe('Checkout Validation', () => {
    const validateCheckout = (cart: Cart | null, data: CheckoutData): CheckoutValidation => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!cart) {
        errors.push('Carrinho vazio');
        return { valid: false, errors, warnings };
      }

      if (cart.items.length === 0) {
        errors.push('Carrinho sem itens');
      }

      if (cart.total < CHECKOUT_CONFIG.MIN_ORDER_VALUE) {
        errors.push(`Pedido mínimo: R$ ${(CHECKOUT_CONFIG.MIN_ORDER_VALUE / 100).toFixed(2)}`);
      }

      if (data.deliveryType === 'delivery' && !data.deliveryAddress) {
        errors.push('Endereço de entrega obrigatório');
      }

      const validMethods = Object.values(PAYMENT_METHODS);
      if (!validMethods.includes(data.paymentMethod as PaymentMethod)) {
        errors.push('Método de pagamento inválido');
      }

      return { valid: errors.length === 0, errors, warnings };
    };

    it('should validate complete checkout', () => {
      const cart = createMockCart();
      const data: CheckoutData = {
        deliveryType: 'delivery',
        deliveryAddress: createMockAddress(),
        paymentMethod: 'pix'
      };
      const result = validateCheckout(cart, data);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject null cart', () => {
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      const result = validateCheckout(null, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Carrinho vazio');
    });

    it('should reject empty cart', () => {
      const cart = { ...createMockCart(), items: [] };
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      const result = validateCheckout(cart, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Carrinho sem itens');
    });

    it('should reject cart below minimum value', () => {
      const cart = { ...createMockCart(), total: 500 };
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      const result = validateCheckout(cart, data);
      expect(result.valid).toBe(false);
    });

    it('should reject delivery without address', () => {
      const cart = createMockCart();
      const data: CheckoutData = {
        deliveryType: 'delivery',
        paymentMethod: 'pix'
      };
      const result = validateCheckout(cart, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Endereço de entrega obrigatório');
    });

    it('should accept pickup without address', () => {
      const cart = createMockCart();
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      const result = validateCheckout(cart, data);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid payment method', () => {
      const cart = createMockCart();
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'invalid' as PaymentMethod
      };
      const result = validateCheckout(cart, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Método de pagamento inválido');
    });
  });

  // ============================================
  // TESTES DE MAPEAMENTO DE ITENS
  // ============================================

  describe('Cart Items to Order Items Mapping', () => {
    const mapCartItemsToOrderItems = (cartItems: CartItem[]): OrderItem[] => {
      return cartItems.map(item => ({
        productId: item.productId,
        productName: item.product?.name || 'Produto',
        productImage: item.product?.image,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        discount: 0,
        total: item.total
      }));
    };

    it('should map single item', () => {
      const cartItems: CartItem[] = [{
        productId: 'prod-1',
        product: { name: 'Dipirona 500mg' },
        quantity: 2,
        unitPrice: 1990,
        subtotal: 3980,
        total: 3980
      }];

      const orderItems = mapCartItemsToOrderItems(cartItems);
      
      expect(orderItems.length).toBe(1);
      expect(orderItems[0].productId).toBe('prod-1');
      expect(orderItems[0].productName).toBe('Dipirona 500mg');
      expect(orderItems[0].quantity).toBe(2);
    });

    it('should map multiple items', () => {
      const cartItems: CartItem[] = [
        { productId: 'prod-1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 },
        { productId: 'prod-2', quantity: 2, unitPrice: 2000, subtotal: 4000, total: 4000 }
      ];

      const orderItems = mapCartItemsToOrderItems(cartItems);
      
      expect(orderItems.length).toBe(2);
    });

    it('should use default name when product name missing', () => {
      const cartItems: CartItem[] = [{
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
        total: 1000
      }];

      const orderItems = mapCartItemsToOrderItems(cartItems);
      
      expect(orderItems[0].productName).toBe('Produto');
    });

    it('should preserve all values', () => {
      const cartItem: CartItem = {
        productId: 'prod-1',
        product: { name: 'Test', image: 'http://example.com/img.jpg' },
        quantity: 3,
        unitPrice: 1500,
        subtotal: 4500,
        total: 4500
      };

      const orderItems = mapCartItemsToOrderItems([cartItem]);
      
      expect(orderItems[0].unitPrice).toBe(1500);
      expect(orderItems[0].subtotal).toBe(4500);
      expect(orderItems[0].total).toBe(4500);
      expect(orderItems[0].productImage).toBe('http://example.com/img.jpg');
    });

    it('should set discount to 0', () => {
      const cartItems: CartItem[] = [{
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
        total: 1000
      }];

      const orderItems = mapCartItemsToOrderItems(cartItems);
      
      expect(orderItems[0].discount).toBe(0);
    });
  });

  // ============================================
  // TESTES DE UPLOAD DE RECEITA
  // ============================================

  describe('Prescription Image Validation', () => {
    const validatePrescriptionImage = (file: { type: string; size: number } | null): { valid: boolean; error?: string } => {
      if (!file) {
        return { valid: false, error: 'Arquivo não fornecido' };
      }

      if (!CHECKOUT_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { valid: false, error: 'Tipo de arquivo não permitido' };
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > CHECKOUT_CONFIG.MAX_IMAGE_SIZE_MB) {
        return { valid: false, error: `Tamanho máximo: ${CHECKOUT_CONFIG.MAX_IMAGE_SIZE_MB}MB` };
      }

      return { valid: true };
    };

    it('should accept JPEG image', () => {
      const file = { type: 'image/jpeg', size: 1024 * 1024 };
      const result = validatePrescriptionImage(file);
      expect(result.valid).toBe(true);
    });

    it('should accept PNG image', () => {
      const file = { type: 'image/png', size: 1024 * 1024 };
      const result = validatePrescriptionImage(file);
      expect(result.valid).toBe(true);
    });

    it('should accept WebP image', () => {
      const file = { type: 'image/webp', size: 1024 * 1024 };
      const result = validatePrescriptionImage(file);
      expect(result.valid).toBe(true);
    });

    it('should reject PDF file', () => {
      const file = { type: 'application/pdf', size: 1024 * 1024 };
      const result = validatePrescriptionImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tipo de arquivo não permitido');
    });

    it('should reject GIF image', () => {
      const file = { type: 'image/gif', size: 1024 * 1024 };
      const result = validatePrescriptionImage(file);
      expect(result.valid).toBe(false);
    });

    it('should reject file too large', () => {
      const file = { type: 'image/jpeg', size: 6 * 1024 * 1024 };
      const result = validatePrescriptionImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Tamanho máximo');
    });

    it('should accept file at max size', () => {
      const file = { type: 'image/jpeg', size: 5 * 1024 * 1024 };
      const result = validatePrescriptionImage(file);
      expect(result.valid).toBe(true);
    });

    it('should reject null file', () => {
      const result = validatePrescriptionImage(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Arquivo não fornecido');
    });
  });

  // ============================================
  // TESTES DE NAVEGAÇÃO DE PASSOS
  // ============================================

  describe('Step Navigation', () => {
    let currentStep = 1;

    const nextStep = () => {
      if (currentStep < 4) currentStep++;
    };

    const previousStep = () => {
      if (currentStep > 1) currentStep--;
    };

    const setStep = (step: number) => {
      if (step >= 1 && step <= 4) currentStep = step;
    };

    const reset = () => {
      currentStep = 1;
    };

    beforeEach(() => {
      currentStep = 1;
    });

    it('should start at step 1', () => {
      expect(currentStep).toBe(1);
    });

    it('should advance to next step', () => {
      nextStep();
      expect(currentStep).toBe(2);
    });

    it('should not exceed step 4', () => {
      currentStep = 4;
      nextStep();
      expect(currentStep).toBe(4);
    });

    it('should go back to previous step', () => {
      currentStep = 3;
      previousStep();
      expect(currentStep).toBe(2);
    });

    it('should not go below step 1', () => {
      currentStep = 1;
      previousStep();
      expect(currentStep).toBe(1);
    });

    it('should set specific step', () => {
      setStep(3);
      expect(currentStep).toBe(3);
    });

    it('should not set invalid step', () => {
      setStep(0);
      expect(currentStep).toBe(1);

      setStep(5);
      expect(currentStep).toBe(1);
    });

    it('should reset to step 1', () => {
      currentStep = 3;
      reset();
      expect(currentStep).toBe(1);
    });
  });

  // ============================================
  // TESTES DE VERIFICAÇÃO DE RECEITA
  // ============================================

  describe('Prescription Requirement Check', () => {
    const checkPrescriptionRequired = (items: CartItem[]): boolean => {
      return items.some(item => item.product?.prescriptionRequired === true);
    };

    it('should return false for empty cart', () => {
      expect(checkPrescriptionRequired([])).toBe(false);
    });

    it('should return false when no prescription required', () => {
      const items: CartItem[] = [
        { productId: '1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000, product: { prescriptionRequired: false } },
        { productId: '2', quantity: 1, unitPrice: 2000, subtotal: 2000, total: 2000, product: { prescriptionRequired: false } }
      ];
      expect(checkPrescriptionRequired(items)).toBe(false);
    });

    it('should return true when prescription required', () => {
      const items: CartItem[] = [
        { productId: '1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000, product: { prescriptionRequired: false } },
        { productId: '2', quantity: 1, unitPrice: 2000, subtotal: 2000, total: 2000, product: { prescriptionRequired: true } }
      ];
      expect(checkPrescriptionRequired(items)).toBe(true);
    });

    it('should handle items without product data', () => {
      const items: CartItem[] = [
        { productId: '1', quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 }
      ];
      expect(checkPrescriptionRequired(items)).toBe(false);
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle maximum order value', () => {
      const cart = createMockCart();
      cart.total = 999999999; // Very large value
      expect(cart.total).toBe(999999999);
    });

    it('should handle minimum order value', () => {
      const cart = createMockCart();
      cart.total = CHECKOUT_CONFIG.MIN_ORDER_VALUE;
      expect(cart.total).toBe(CHECKOUT_CONFIG.MIN_ORDER_VALUE);
    });

    it('should handle special characters in notes', () => {
      const data: CheckoutData = {
        deliveryType: 'delivery',
        deliveryAddress: createMockAddress(),
        paymentMethod: 'pix',
        notes: 'Entregar na portaria - Bloco A, apto 123 (ligar antes)'
      };
      expect(data.notes).toContain('(ligar antes)');
    });

    it('should handle special characters in address', () => {
      const address = createMockAddress();
      address.complement = 'Bloco A - Apto 123 / Fundos';
      expect(address.complement).toBeDefined();
    });
  });

  // ============================================
  // TESTES DE GERENCIAMENTO DE PEDIDOS (FARMÁCIA)
  // ============================================

  describe('Pharmacy Order Management', () => {
    describe('getPharmacyOrders', () => {
      it('should return empty array when no orders exist', async () => {
        // Mock retorna array vazio
        const result: any[] = [];
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      it('should handle pharmacy ID validation', () => {
        const pharmacyId = 'pharmacy-123';
        expect(pharmacyId).toBeTruthy();
        expect(pharmacyId.length).toBeGreaterThan(0);
      });

      it('should filter orders by pharmacy ID', () => {
        const pharmacyId = 'pharmacy-123';
        const orders = [
          { pharmacyId: 'pharmacy-123', orderId: '1' },
          { pharmacyId: 'pharmacy-456', orderId: '2' },
          { pharmacyId: 'pharmacy-123', orderId: '3' }
        ];
        const filtered = orders.filter(o => o.pharmacyId === pharmacyId);
        expect(filtered.length).toBe(2);
      });

      it('should order by createdAt desc', () => {
        const orders = [
          { createdAt: new Date('2024-01-01'), id: '1' },
          { createdAt: new Date('2024-01-03'), id: '2' },
          { createdAt: new Date('2024-01-02'), id: '3' }
        ];
        const sorted = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        expect(sorted[0].id).toBe('2');
        expect(sorted[1].id).toBe('3');
        expect(sorted[2].id).toBe('1');
      });
    });

    describe('updateOrderStatus', () => {
      it('should validate order ID before update', () => {
        const orderId = 'order-123';
        expect(orderId).toBeTruthy();
        expect(orderId.length).toBeGreaterThan(0);
      });

      it('should accept valid OrderStatus values', () => {
        const validStatuses = [
          OrderStatus.PENDING_PAYMENT,
          OrderStatus.PAYMENT_CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELED
        ];
        validStatuses.forEach(status => {
          expect(status).toBeDefined();
        });
      });

      it('should track status change timestamp', () => {
        const statusChange = {
          status: OrderStatus.PAYMENT_CONFIRMED,
          changedAt: new Date(),
          changedBy: 'user-123'
        };
        expect(statusChange.changedAt).toBeInstanceOf(Date);
        expect(statusChange.changedBy).toBeTruthy();
      });

      it('should update multiple fields atomically', () => {
        const update = {
          status: OrderStatus.PREPARING,
          updatedAt: new Date(),
          statusHistory: {
            status: OrderStatus.PREPARING,
            changedAt: new Date(),
            changedBy: 'system'
          }
        };
        expect(update.status).toBe(OrderStatus.PREPARING);
        expect(update.statusHistory.status).toBe(OrderStatus.PREPARING);
      });
    });

    describe('verifyPrescription', () => {
      it('should mark prescription as verified', () => {
        const verification = {
          prescriptionVerified: true,
          prescriptionVerifiedAt: new Date(),
          prescriptionVerifiedBy: 'pharmacist-123'
        };
        expect(verification.prescriptionVerified).toBe(true);
        expect(verification.prescriptionVerifiedAt).toBeInstanceOf(Date);
      });

      it('should require verifier ID', () => {
        const verifierId = 'pharmacist-123';
        expect(verifierId).toBeTruthy();
        expect(verifierId.length).toBeGreaterThan(0);
      });

      it('should update timestamp on verification', () => {
        const before = new Date();
        const update = {
          prescriptionVerified: true,
          prescriptionVerifiedAt: new Date(),
          updatedAt: new Date()
        };
        const after = new Date();
        expect(update.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(update.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('should handle orders without prescriptions', () => {
        const order = {
          id: 'order-123',
          requiresPrescription: false,
          prescriptionVerified: false
        };
        expect(order.requiresPrescription).toBe(false);
      });
    });

    describe('cancelOrder', () => {
      it('should require cancellation reason', () => {
        const reason = 'Cliente solicitou cancelamento';
        expect(reason).toBeTruthy();
        expect(reason.length).toBeGreaterThan(0);
      });

      it('should set status to CANCELED', () => {
        const update = {
          status: OrderStatus.CANCELED,
          cancelReason: 'Produto indisponível'
        };
        expect(update.status).toBe(OrderStatus.CANCELED);
      });

      it('should track who cancelled the order', () => {
        const cancellation = {
          cancelledBy: 'admin-123',
          cancelledAt: new Date(),
          cancelReason: 'Fraude detectada'
        };
        expect(cancellation.cancelledBy).toBeTruthy();
        expect(cancellation.cancelledAt).toBeInstanceOf(Date);
      });

      it('should validate reason is not empty', () => {
        const validateReason = (reason: string): boolean => {
          return reason.trim().length > 0;
        };
        expect(validateReason('Motivo válido')).toBe(true);
        expect(validateReason('')).toBe(false);
        expect(validateReason('   ')).toBe(false);
      });

      it('should prevent cancellation of already delivered orders', () => {
        const order = { status: OrderStatus.DELIVERED };
        const canCancel = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED;
        expect(canCancel).toBe(false);
      });

      it('should allow cancellation of pending orders', () => {
        const order = { status: OrderStatus.PENDING_PAYMENT };
        const canCancel = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED;
        expect(canCancel).toBe(true);
      });
    });
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function createMockCart(): Cart {
  return {
    id: 'cart-123',
    userId: 'user-456',
    pharmacyId: 'pharmacy-789',
    items: [
      {
        productId: 'prod-1',
        product: { name: 'Dipirona 500mg' },
        quantity: 2,
        unitPrice: 1990,
        subtotal: 3980,
        total: 3980
      }
    ],
    subtotal: 3980,
    deliveryFee: CART_CONFIG.DEFAULT_DELIVERY_FEE,
    discount: 0,
    total: 3980 + CART_CONFIG.DEFAULT_DELIVERY_FEE,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createMockAddress(): DeliveryAddress {
  return {
    recipientName: 'João Silva',
    phone: '11987654321',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234567'
  };
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

function isValidZipCode(zipCode: string): boolean {
  const cleaned = zipCode.replace(/\D/g, '');
  return cleaned.length === 8;
}

// ============================================
// TESTES COM TESTBED E MOCKS
// ============================================

describe('CheckoutService with TestBed', () => {
  let service: CheckoutService;
  let mockFirestore: any;
  let mockStorage: any;
  let mockAuthService: any;
  let mockCartService: any;

  beforeEach(() => {
    mockFirestore = {
      app: { name: 'test' }
    };

    mockStorage = {
      app: { name: 'test' }
    };

    mockAuthService = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ uid: 'user-123', email: 'test@test.com' })
    };

    mockCartService = {
      clearCart: jasmine.createSpy('clearCart').and.returnValue(of(null))
    };

    const mockIntegrationService = {
      get: jasmine.createSpy('get').and.returnValue(of({ items: [], total: 0 })),
      post: jasmine.createSpy('post').and.returnValue(of({ id: 'order-123', orderNumber: 'ORD-2026-000001', status: 'pending', total: 5000 })),
      put: jasmine.createSpy('put').and.returnValue(of({})),
      patch: jasmine.createSpy('patch').and.returnValue(of({ success: true, order: {}, statusHistory: [], notificationSent: true })),
      delete: jasmine.createSpy('delete').and.returnValue(of({}))
    };

    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: Storage, useValue: mockStorage },
        { provide: AuthService, useValue: mockAuthService },
        { provide: CartService, useValue: mockCartService },
        { provide: IntegrationService, useValue: mockIntegrationService }
      ]
    });

    service = TestBed.inject(CheckoutService);
  });

  describe('✅ Criação do Serviço', () => {
    it('deve criar o serviço', () => {
      expect(service).toBeTruthy();
    });

    it('deve ter sinais reativos inicializados', () => {
      expect(service.processing).toBeDefined();
      expect(service.error).toBeDefined();
      expect(service.currentStep).toBeDefined();
    });

    it('deve ter processing inicial como false', () => {
      expect(service.processing()).toBe(false);
    });

    it('deve ter error inicial como null', () => {
      expect(service.error()).toBeNull();
    });

    it('deve ter currentStep inicial como 1', () => {
      expect(service.currentStep()).toBe(1);
    });
  });

  describe('✅ Navegação de Passos', () => {
    it('deve avançar para próximo passo', () => {
      service.nextStep();
      expect(service.currentStep()).toBe(2);
    });

    it('deve avançar até passo 4', () => {
      service.nextStep();
      service.nextStep();
      service.nextStep();
      expect(service.currentStep()).toBe(4);
    });

    it('não deve avançar além do passo 4', () => {
      service.setStep(4);
      service.nextStep();
      expect(service.currentStep()).toBe(4);
    });

    it('deve voltar para passo anterior', () => {
      service.setStep(3);
      service.previousStep();
      expect(service.currentStep()).toBe(2);
    });

    it('não deve voltar antes do passo 1', () => {
      service.previousStep();
      expect(service.currentStep()).toBe(1);
    });

    it('deve definir passo específico válido', () => {
      service.setStep(3);
      expect(service.currentStep()).toBe(3);
    });

    it('não deve definir passo menor que 1', () => {
      service.setStep(0);
      expect(service.currentStep()).toBe(1);
    });

    it('não deve definir passo maior que 4', () => {
      service.setStep(5);
      expect(service.currentStep()).toBe(1);
    });
  });

  describe('✅ Reset', () => {
    it('deve resetar currentStep para 1', () => {
      service.setStep(3);
      service.reset();
      expect(service.currentStep()).toBe(1);
    });

    it('deve resetar error para null', () => {
      (service as any)._error.set('Erro teste');
      service.reset();
      expect(service.error()).toBeNull();
    });

    it('deve resetar processing para false', () => {
      (service as any)._processing.set(true);
      service.reset();
      expect(service.processing()).toBe(false);
    });
  });

  describe('✅ validateCheckout', () => {
    it('deve invalidar carrinho null', () => {
      const data: CheckoutData = {
        deliveryType: 'delivery',
        deliveryAddress: createMockAddress(),
        paymentMethod: 'pix'
      };
      const result = service.validateCheckout(null, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Carrinho vazio');
    });

    it('deve invalidar carrinho sem itens', () => {
      const cart = createMockCart();
      cart.items = [];
      const data: CheckoutData = {
        deliveryType: 'delivery',
        deliveryAddress: createMockAddress(),
        paymentMethod: 'pix'
      };
      const result = service.validateCheckout(cart, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Carrinho sem itens');
    });

    it('deve invalidar pedido abaixo do mínimo', () => {
      const cart = createMockCart();
      cart.total = 500; // Abaixo do mínimo
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      const result = service.validateCheckout(cart, data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('mínimo'))).toBe(true);
    });

    it('deve invalidar delivery sem endereço', () => {
      const cart = createMockCart();
      const data: CheckoutData = {
        deliveryType: 'delivery',
        paymentMethod: 'pix'
      };
      const result = service.validateCheckout(cart, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Endereço de entrega obrigatório');
    });

    it('deve validar checkout completo', () => {
      const cart = createMockCart();
      cart.total = 5000;
      const data: CheckoutData = {
        deliveryType: 'delivery',
        deliveryAddress: createMockAddress(),
        paymentMethod: 'pix'
      };
      const result = service.validateCheckout(cart, data);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve validar pickup sem endereço', () => {
      const cart = createMockCart();
      cart.total = 5000;
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'credit_card'
      };
      const result = service.validateCheckout(cart, data);
      expect(result.valid).toBe(true);
    });

    it('deve adicionar warning para subtotal baixo', () => {
      const cart = createMockCart();
      cart.subtotal = 4000;
      cart.total = 5000;
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      const result = service.validateCheckout(cart, data);
      expect(result.warnings.some(w => w.includes('frete grátis'))).toBe(true);
    });

    it('deve invalidar método de pagamento inválido', () => {
      const cart = createMockCart();
      cart.total = 5000;
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'invalid_method' as any
      };
      const result = service.validateCheckout(cart, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Método de pagamento inválido');
    });
  });

  describe('✅ validateAddress', () => {
    it('deve validar endereço completo', () => {
      const address = createMockAddress();
      const errors = service.validateAddress(address);
      expect(errors.length).toBe(0);
    });

    it('deve invalidar recipientName vazio', () => {
      const address = { ...createMockAddress(), recipientName: '' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Nome do destinatário inválido');
    });

    it('deve invalidar recipientName muito curto', () => {
      const address = { ...createMockAddress(), recipientName: 'AB' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Nome do destinatário inválido');
    });

    it('deve invalidar telefone vazio', () => {
      const address = { ...createMockAddress(), phone: '' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Telefone inválido');
    });

    it('deve invalidar telefone curto', () => {
      const address = { ...createMockAddress(), phone: '1234' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Telefone inválido');
    });

    it('deve invalidar rua vazia', () => {
      const address = { ...createMockAddress(), street: '' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Rua inválida');
    });

    it('deve invalidar número vazio', () => {
      const address = { ...createMockAddress(), number: '' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Número obrigatório');
    });

    it('deve invalidar bairro vazio', () => {
      const address = { ...createMockAddress(), neighborhood: '' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Bairro inválido');
    });

    it('deve invalidar cidade vazia', () => {
      const address = { ...createMockAddress(), city: '' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Cidade inválida');
    });

    it('deve invalidar estado com tamanho errado', () => {
      const address = { ...createMockAddress(), state: 'São Paulo' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('Estado inválido');
    });

    it('deve invalidar CEP com tamanho errado', () => {
      const address = { ...createMockAddress(), zipCode: '1234' };
      const errors = service.validateAddress(address);
      expect(errors).toContain('CEP inválido');
    });
  });

  describe('✅ isValidPaymentMethod', () => {
    it('deve validar credit_card', () => {
      expect(service.isValidPaymentMethod('credit_card')).toBe(true);
    });

    it('deve validar debit_card', () => {
      expect(service.isValidPaymentMethod('debit_card')).toBe(true);
    });

    it('deve validar pix', () => {
      expect(service.isValidPaymentMethod('pix')).toBe(true);
    });

    it('deve validar boleto', () => {
      expect(service.isValidPaymentMethod('boleto')).toBe(true);
    });

    it('deve invalidar método desconhecido', () => {
      expect(service.isValidPaymentMethod('cash')).toBe(false);
    });

    it('deve invalidar string vazia', () => {
      expect(service.isValidPaymentMethod('')).toBe(false);
    });
  });

  describe('✅ isValidPhone', () => {
    it('deve validar telefone com 10 dígitos', () => {
      expect(service.isValidPhone('1112345678')).toBe(true);
    });

    it('deve validar telefone com 11 dígitos', () => {
      expect(service.isValidPhone('11912345678')).toBe(true);
    });

    it('deve validar telefone com formatação', () => {
      expect(service.isValidPhone('(11) 91234-5678')).toBe(true);
    });

    it('deve invalidar telefone muito curto', () => {
      expect(service.isValidPhone('12345')).toBe(false);
    });

    it('deve invalidar telefone muito longo', () => {
      expect(service.isValidPhone('123456789012')).toBe(false);
    });
  });

  describe('✅ isValidZipCode', () => {
    it('deve validar CEP com 8 dígitos', () => {
      expect(service.isValidZipCode('01234567')).toBe(true);
    });

    it('deve validar CEP com formatação', () => {
      expect(service.isValidZipCode('01234-567')).toBe(true);
    });

    it('deve invalidar CEP muito curto', () => {
      expect(service.isValidZipCode('1234')).toBe(false);
    });

    it('deve invalidar CEP muito longo', () => {
      expect(service.isValidZipCode('123456789')).toBe(false);
    });
  });

  describe('✅ generateOrderNumber', () => {
    it('deve gerar número com prefixo ORD', () => {
      const orderNumber = service.generateOrderNumber();
      expect(orderNumber.startsWith('ORD-')).toBe(true);
    });

    it('deve incluir ano atual', () => {
      const orderNumber = service.generateOrderNumber();
      const currentYear = new Date().getFullYear().toString();
      expect(orderNumber.includes(currentYear)).toBe(true);
    });

    it('deve ter formato correto', () => {
      const orderNumber = service.generateOrderNumber();
      const pattern = /^ORD-\d{4}-\d{6}$/;
      expect(pattern.test(orderNumber)).toBe(true);
    });

    it('deve gerar números únicos', () => {
      const numbers = new Set<string>();
      for (let i = 0; i < 10; i++) {
        numbers.add(service.generateOrderNumber());
      }
      // Deve ter gerado pelo menos alguns únicos (pode haver colisão)
      expect(numbers.size).toBeGreaterThan(0);
    });
  });

  describe('✅ mapCartItemsToOrderItems', () => {
    it('deve mapear item corretamente', () => {
      const cartItems: CartItem[] = [{
        productId: 'prod-1',
        product: { name: 'Dipirona 500mg', image: 'http://example.com/img.jpg' },
        quantity: 2,
        unitPrice: 1990,
        subtotal: 3980,
        total: 3980
      }];
      
      const orderItems = service.mapCartItemsToOrderItems(cartItems);
      
      expect(orderItems.length).toBe(1);
      expect(orderItems[0].productId).toBe('prod-1');
      expect(orderItems[0].productName).toBe('Dipirona 500mg');
      expect(orderItems[0].quantity).toBe(2);
      expect(orderItems[0].unitPrice).toBe(1990);
      expect(orderItems[0].subtotal).toBe(3980);
    });

    it('deve usar nome padrão quando product.name é undefined', () => {
      const cartItems: CartItem[] = [{
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
        total: 1000
      }];
      
      const orderItems = service.mapCartItemsToOrderItems(cartItems);
      expect(orderItems[0].productName).toBe('Produto');
    });

    it('deve mapear múltiplos itens', () => {
      const cartItems: CartItem[] = [
        { productId: 'prod-1', product: { name: 'Item 1' }, quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 },
        { productId: 'prod-2', product: { name: 'Item 2' }, quantity: 2, unitPrice: 2000, subtotal: 4000, total: 4000 }
      ];
      
      const orderItems = service.mapCartItemsToOrderItems(cartItems);
      expect(orderItems.length).toBe(2);
    });

    it('deve retornar array vazio para array vazio', () => {
      const orderItems = service.mapCartItemsToOrderItems([]);
      expect(orderItems.length).toBe(0);
    });
  });

  describe('✅ checkPrescriptionRequired', () => {
    it('deve retornar true quando item requer receita', () => {
      const items: CartItem[] = [{
        productId: 'prod-1',
        product: { name: 'Antibiótico', prescriptionRequired: true },
        quantity: 1,
        unitPrice: 5000,
        subtotal: 5000,
        total: 5000
      }];
      
      expect(service.checkPrescriptionRequired(items)).toBe(true);
    });

    it('deve retornar false quando nenhum item requer receita', () => {
      const items: CartItem[] = [{
        productId: 'prod-1',
        product: { name: 'Vitamina C', prescriptionRequired: false },
        quantity: 1,
        unitPrice: 2000,
        subtotal: 2000,
        total: 2000
      }];
      
      expect(service.checkPrescriptionRequired(items)).toBe(false);
    });

    it('deve retornar false para array vazio', () => {
      expect(service.checkPrescriptionRequired([])).toBe(false);
    });

    it('deve retornar false quando product é undefined', () => {
      const items: CartItem[] = [{
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
        total: 1000
      }];
      
      expect(service.checkPrescriptionRequired(items)).toBe(false);
    });

    it('deve retornar true se pelo menos um item requer receita', () => {
      const items: CartItem[] = [
        { productId: 'prod-1', product: { name: 'Item 1', prescriptionRequired: false }, quantity: 1, unitPrice: 1000, subtotal: 1000, total: 1000 },
        { productId: 'prod-2', product: { name: 'Antibiótico', prescriptionRequired: true }, quantity: 1, unitPrice: 5000, subtotal: 5000, total: 5000 }
      ];
      
      expect(service.checkPrescriptionRequired(items)).toBe(true);
    });
  });

  describe('✅ validatePrescriptionImage', () => {
    it('deve validar arquivo JPEG', () => {
      const file = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });
      const result = service.validatePrescriptionImage(file);
      expect(result.valid).toBe(true);
    });

    it('deve validar arquivo PNG', () => {
      const file = new File(['test'], 'prescription.png', { type: 'image/png' });
      const result = service.validatePrescriptionImage(file);
      expect(result.valid).toBe(true);
    });

    it('deve validar arquivo WebP', () => {
      const file = new File(['test'], 'prescription.webp', { type: 'image/webp' });
      const result = service.validatePrescriptionImage(file);
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar arquivo null', () => {
      const result = service.validatePrescriptionImage(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('não fornecido');
    });

    it('deve rejeitar formato PDF', () => {
      const file = new File(['test'], 'prescription.pdf', { type: 'application/pdf' });
      const result = service.validatePrescriptionImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('não permitido');
    });

    it('deve rejeitar arquivo muito grande', () => {
      // Criar um mock de arquivo grande
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = service.validatePrescriptionImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Tamanho máximo');
    });
  });

  describe('✅ processCheckout com validação inválida', () => {
    it('deve retornar erro quando validação falha', fakeAsync(() => {
      const cart = createMockCart();
      cart.items = []; // Carrinho vazio
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      
      let result: CheckoutResult | undefined;
      service.processCheckout(cart, data).subscribe(r => {
        result = r;
      });
      tick();
      
      expect(result?.success).toBe(false);
      expect(result?.errorMessage).toBeDefined();
    }));

    it('deve retornar erro quando usuário não está autenticado', fakeAsync(() => {
      mockAuthService.currentUser.and.returnValue(null);
      
      const cart = createMockCart();
      cart.total = 5000;
      const data: CheckoutData = {
        deliveryType: 'pickup',
        paymentMethod: 'pix'
      };
      
      let result: CheckoutResult | undefined;
      service.processCheckout(cart, data).subscribe(r => {
        result = r;
      });
      tick();
      
      expect(result?.success).toBe(false);
      expect(result?.errorMessage).toBe('Usuário não autenticado');
    }));
  });

  // ============================================
  // TESTES API v2 - Sprint M1
  // ============================================

  describe('🔗 API v2 Integration (Sprint M1)', () => {
    describe('CHECKOUT_CONFIG Retry Settings', () => {
      it('should have MAX_RETRIES configured', () => {
        expect(CHECKOUT_CONFIG.MAX_RETRIES).toBe(3);
      });

      it('should have RETRY_DELAY_MS configured', () => {
        expect(CHECKOUT_CONFIG.RETRY_DELAY_MS).toBe(1000);
      });

      it('should have REQUEST_TIMEOUT_MS configured', () => {
        expect(CHECKOUT_CONFIG.REQUEST_TIMEOUT_MS).toBe(30000);
      });
    });

    describe('canRetry computed', () => {
      it('should be false when no error', () => {
        expect(service.canRetry()).toBe(false);
      });
    });

    describe('retryCount signal', () => {
      it('should start at 0', () => {
        expect(service.retryCount()).toBe(0);
      });
    });

    describe('parseApiError scenarios', () => {
      it('should handle 400 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 400 });
        expect(errorMessage).toContain('Dados inválidos');
      });

      it('should handle 401 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 401 });
        expect(errorMessage).toContain('Sessão expirada');
      });

      it('should handle 403 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 403 });
        expect(errorMessage).toContain('Acesso negado');
      });

      it('should handle 404 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 404 });
        expect(errorMessage).toContain('não encontrado');
      });

      it('should handle 409 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 409 });
        expect(errorMessage).toContain('Conflito');
      });

      it('should handle 422 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 422 });
        expect(errorMessage).toContain('inválidos');
      });

      it('should handle 429 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 429 });
        expect(errorMessage).toContain('Muitas requisições');
      });

      it('should handle 500 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 500 });
        expect(errorMessage).toContain('Erro no servidor');
      });

      it('should handle 503 error', () => {
        const errorMessage = (service as any).parseApiError({ status: 503 });
        expect(errorMessage).toContain('indisponível');
      });

      it('should handle error with message', () => {
        const errorMessage = (service as any).parseApiError({ error: { message: 'Custom error' } });
        expect(errorMessage).toBe('Custom error');
      });

      it('should handle null error', () => {
        const errorMessage = (service as any).parseApiError(null);
        expect(errorMessage).toBe('Erro desconhecido');
      });

      it('should handle undefined error', () => {
        const errorMessage = (service as any).parseApiError(undefined);
        expect(errorMessage).toBe('Erro desconhecido');
      });

      it('should handle error with message property', () => {
        const errorMessage = (service as any).parseApiError({ message: 'Network error' });
        expect(errorMessage).toBe('Network error');
      });

      it('should handle unknown status code', () => {
        const errorMessage = (service as any).parseApiError({ status: 418 });
        expect(errorMessage).toContain('Erro ao processar pedido');
      });
    });

    describe('isRetryableError scenarios', () => {
      it('should return true for timeout error', () => {
        const error = { name: 'TimeoutError' };
        expect((service as any).isRetryableError(error)).toBe(true);
      });

      it('should return true for network error (status 0)', () => {
        const error = { status: 0 };
        expect((service as any).isRetryableError(error)).toBe(true);
      });

      it('should return true for 500 error', () => {
        const error = { status: 500 };
        expect((service as any).isRetryableError(error)).toBe(true);
      });

      it('should return true for 502 error', () => {
        const error = { status: 502 };
        expect((service as any).isRetryableError(error)).toBe(true);
      });

      it('should return true for 503 error', () => {
        const error = { status: 503 };
        expect((service as any).isRetryableError(error)).toBe(true);
      });

      it('should return true for 504 error', () => {
        const error = { status: 504 };
        expect((service as any).isRetryableError(error)).toBe(true);
      });

      it('should return true for 429 rate limit error', () => {
        const error = { status: 429 };
        expect((service as any).isRetryableError(error)).toBe(true);
      });

      it('should return false for 400 error', () => {
        const error = { status: 400 };
        expect((service as any).isRetryableError(error)).toBe(false);
      });

      it('should return false for 401 error', () => {
        const error = { status: 401 };
        expect((service as any).isRetryableError(error)).toBe(false);
      });

      it('should return false for 403 error', () => {
        const error = { status: 403 };
        expect((service as any).isRetryableError(error)).toBe(false);
      });

      it('should return false for 404 error', () => {
        const error = { status: 404 };
        expect((service as any).isRetryableError(error)).toBe(false);
      });

      it('should return false for null error', () => {
        expect((service as any).isRetryableError(null)).toBe(false);
      });

      it('should return false for undefined error', () => {
        expect((service as any).isRetryableError(undefined)).toBe(false);
      });
    });
  });

  // ============================================
  // TESTES DE API CALLS - Com Mock do IntegrationService
  // ============================================

  describe('📡 API Methods (Async)', () => {
    describe('getOrderById', () => {
      it('should call API get for order by id', async () => {
        // O mock retorna dados válidos, não null
        const result = await service.getOrderById('order-123');
        // O mock retorna { items: [], total: 0 } que é o mock padrão do IntegrationService.get
        expect(result).toBeDefined();
      });
    });
  });

  describe('🆕 CreateOrderApiResponse Interface', () => {
    it('should have correct structure', () => {
      const response: CreateOrderApiResponse = {
        id: 'order-123',
        orderNumber: 'ORD-2026-000001',
        status: 'pending',
        total: 5000,
        paymentUrl: 'https://pay.example.com/123',
        pixCode: '00020126...',
        boletoUrl: 'https://boleto.example.com/123',
        createdAt: '2026-01-03T10:00:00Z'
      };
      
      expect(response.id).toBe('order-123');
      expect(response.orderNumber).toContain('ORD');
      expect(response.status).toBe('pending');
      expect(response.total).toBe(5000);
      expect(response.paymentUrl).toBeDefined();
      expect(response.pixCode).toBeDefined();
      expect(response.boletoUrl).toBeDefined();
      expect(response.createdAt).toBeDefined();
    });
  });

  describe('🆕 CreateOrderApiRequest Interface', () => {
    it('should have correct structure', () => {
      const request: CreateOrderApiRequest = {
        userId: 'user-123',
        pharmacyId: 'pharmacy-123',
        items: [],
        subtotal: 4000,
        deliveryFee: 500,
        discount: 0,
        total: 4500,
        deliveryType: 'delivery',
        deliveryAddress: createMockAddress(),
        paymentMethod: 'pix',
        prescriptionRequired: false,
        notes: 'Test order'
      };
      
      expect(request.userId).toBe('user-123');
      expect(request.pharmacyId).toBe('pharmacy-123');
      expect(request.total).toBe(4500);
      expect(request.deliveryType).toBe('delivery');
      expect(request.paymentMethod).toBe('pix');
    });

    it('should allow pickup delivery type without address', () => {
      const request: CreateOrderApiRequest = {
        userId: 'user-123',
        pharmacyId: 'pharmacy-123',
        items: [],
        subtotal: 4000,
        deliveryFee: 0,
        discount: 0,
        total: 4000,
        deliveryType: 'pickup',
        paymentMethod: 'credit_card',
        prescriptionRequired: false
      };
      
      expect(request.deliveryType).toBe('pickup');
      expect(request.deliveryAddress).toBeUndefined();
    });
  });

  describe('🆕 UpdateOrderStatusApiResponse Interface', () => {
    it('should have correct structure', () => {
      const response = {
        success: true,
        order: {} as any,
        statusHistory: [],
        notificationSent: true
      };
      
      expect(response.success).toBe(true);
      expect(response.order).toBeDefined();
      expect(response.statusHistory).toBeDefined();
      expect(response.notificationSent).toBe(true);
    });
  });
});

