/**
 * @file order-edge-cases.spec.ts
 * @description Testes de casos de borda para o modelo Order
 */

import { Order, OrderStatus, PaymentStatus } from '../../order.model';

describe('Order Edge Cases', () => {
  it('should handle order with single item', () => {
    const order: Order = {
      id: 'single',
      orderNumber: 'ORD-2025-SINGLE',
      userId: 'user',
      pharmacyId: 'pharma',
      items: [
        {
          productId: 'p1',
          productName: 'Item único',
          quantity: 1,
          unitPrice: 1000,
          subtotal: 1000,
          discount: 0,
          total: 1000
        }
      ],
      subtotal: 1000,
      deliveryFee: 500,
      discount: 0,
      total: 1500,
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      paymentStatus: PaymentStatus.PENDING,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.PENDING_PAYMENT,
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(order.items.length).toBe(1);
  });

  it('should handle order with multiple items', () => {
    const order: Order = {
      id: 'multi',
      orderNumber: 'ORD-2025-MULTI',
      userId: 'user',
      pharmacyId: 'pharma',
      items: [
        { productId: 'p1', productName: 'Item 1', quantity: 2, unitPrice: 1000, subtotal: 2000, discount: 0, total: 2000 },
        { productId: 'p2', productName: 'Item 2', quantity: 1, unitPrice: 2000, subtotal: 2000, discount: 200, total: 1800 },
        { productId: 'p3', productName: 'Item 3', quantity: 3, unitPrice: 500, subtotal: 1500, discount: 0, total: 1500 }
      ],
      subtotal: 5500,
      deliveryFee: 0,
      discount: 200,
      total: 5300,
      deliveryType: 'pickup',
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.PAID,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.COMPLETED,
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(order.items.length).toBe(3);
    const itemsTotal = order.items.reduce((sum, item) => sum + item.total, 0);
    expect(itemsTotal).toBe(5300);
  });

  it('should handle free delivery order', () => {
    const order: Order = {
      id: 'free-delivery',
      orderNumber: 'ORD-2025-FREE',
      userId: 'user',
      pharmacyId: 'pharma',
      items: [],
      subtotal: 10000,
      deliveryFee: 0,
      discount: 0,
      total: 10000,
      deliveryType: 'delivery',
      paymentMethod: 'pix',
      paymentStatus: PaymentStatus.PAID,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.DELIVERED,
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(order.deliveryFee).toBe(0);
    expect(order.total).toBe(order.subtotal);
  });

  it('should handle order total calculation', () => {
    const subtotal = 5000;
    const deliveryFee = 800;
    const discount = 500;
    const expectedTotal = subtotal + deliveryFee - discount;

    const order: Order = {
      id: 'calc',
      orderNumber: 'ORD-2025-CALC',
      userId: 'user',
      pharmacyId: 'pharma',
      items: [],
      subtotal,
      deliveryFee,
      discount,
      total: expectedTotal,
      deliveryType: 'delivery',
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.PENDING,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.PENDING_PAYMENT,
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(order.total).toBe(5300);
    expect(order.total).toBe(order.subtotal + order.deliveryFee - order.discount);
  });

  it('should handle payment methods', () => {
    const paymentMethods = ['credit_card', 'pix', 'boleto', 'debit_card'];
    
    paymentMethods.forEach(method => {
      const order: Order = {
        id: `pm-${method}`,
        orderNumber: `ORD-2025-${method}`,
        userId: 'user',
        pharmacyId: 'pharma',
        items: [],
        subtotal: 1000,
        deliveryFee: 0,
        discount: 0,
        total: 1000,
        deliveryType: 'pickup',
        paymentMethod: method,
        paymentStatus: PaymentStatus.PENDING,
        prescriptionRequired: false,
        prescriptionVerified: false,
        status: OrderStatus.PENDING_PAYMENT,
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(order.paymentMethod).toBe(method);
    });
  });
});
