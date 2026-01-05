/**
 * @file order-requests.spec.ts
 * @description Testes unitários para as interfaces de requisição de Order
 */

import {
  CreateOrderRequest,
  CancelOrderRequest,
  RefundOrderRequest
} from '../../order.model';

describe('CreateOrderRequest Interface', () => {
  it('should create delivery order request', () => {
    const request: CreateOrderRequest = {
      cartId: 'cart-123',
      deliveryType: 'delivery',
      deliveryAddress: {
        recipientName: 'João',
        phone: '11999999999',
        street: 'Rua A',
        number: '100',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234567'
      },
      paymentMethod: 'credit_card'
    };

    expect(request.cartId).toBe('cart-123');
    expect(request.deliveryType).toBe('delivery');
    expect(request.deliveryAddress).toBeDefined();
  });

  it('should create pickup order request', () => {
    const request: CreateOrderRequest = {
      cartId: 'cart-456',
      deliveryType: 'pickup',
      paymentMethod: 'pix'
    };

    expect(request.deliveryType).toBe('pickup');
    expect(request.deliveryAddress).toBeUndefined();
  });

  it('should create order request with notes', () => {
    const request: CreateOrderRequest = {
      cartId: 'cart-789',
      deliveryType: 'delivery',
      deliveryAddress: {
        recipientName: 'Maria',
        phone: '11988888888',
        street: 'Rua B',
        number: '200',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234568'
      },
      paymentMethod: 'boleto',
      notes: 'Entregar no período da manhã'
    };

    expect(request.notes).toContain('manhã');
  });

  it('should create order request with prescription', () => {
    const request: CreateOrderRequest = {
      cartId: 'cart-rx',
      deliveryType: 'pickup',
      paymentMethod: 'credit_card',
      prescriptionImages: ['receita1.jpg', 'receita2.jpg']
    };

    expect(request.prescriptionImages).toBeDefined();
    expect(request.prescriptionImages!.length).toBe(2);
  });
});

describe('CancelOrderRequest Interface', () => {
  it('should create cancel request with reason', () => {
    const request: CancelOrderRequest = {
      reason: 'Mudança de planos'
    };
    expect(request.reason).toBe('Mudança de planos');
  });

  it('should create cancel request with detailed reason', () => {
    const request: CancelOrderRequest = {
      reason: 'Encontrei o produto mais barato em outra farmácia'
    };
    expect(request.reason.length).toBeGreaterThan(10);
  });
});

describe('RefundOrderRequest Interface', () => {
  it('should create full refund request', () => {
    const request: RefundOrderRequest = {
      reason: 'Produto com defeito'
    };
    expect(request.reason).toBe('Produto com defeito');
    expect(request.amount).toBeUndefined();
  });

  it('should create partial refund request', () => {
    const request: RefundOrderRequest = {
      reason: 'Apenas um item com problema',
      amount: 1990
    };
    expect(request.amount).toBe(1990);
  });
});
