/**
 * @file order.interface.spec.ts
 * @description Testes unitários para a interface Order
 */

import { Order, OrderStatus, PaymentStatus } from '../../order.model';

describe('Order Interface', () => {
  it('should create valid delivery order', () => {
    const order: Order = {
      id: 'ord-123',
      orderNumber: 'ORD-2025-001234',
      userId: 'user-123',
      pharmacyId: 'pharma-123',
      items: [
        {
          productId: 'prod-1',
          productName: 'Dipirona',
          quantity: 2,
          unitPrice: 1990,
          subtotal: 3980,
          discount: 0,
          total: 3980
        }
      ],
      subtotal: 3980,
      deliveryFee: 500,
      discount: 0,
      total: 4480,
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

    expect(order.orderNumber).toBe('ORD-2025-001234');
    expect(order.deliveryType).toBe('delivery');
    expect(order.total).toBe(4480);
  });

  it('should create valid pickup order', () => {
    const order: Order = {
      id: 'ord-456',
      orderNumber: 'ORD-2025-001235',
      userId: 'user-456',
      pharmacyId: 'pharma-456',
      items: [
        {
          productId: 'prod-2',
          productName: 'Amoxicilina',
          quantity: 1,
          unitPrice: 2990,
          subtotal: 2990,
          discount: 0,
          total: 2990
        }
      ],
      subtotal: 2990,
      deliveryFee: 0,
      discount: 0,
      total: 2990,
      deliveryType: 'pickup',
      paymentMethod: 'pix',
      paymentStatus: PaymentStatus.PAID,
      prescriptionRequired: true,
      prescriptionImages: ['receita.jpg'],
      prescriptionVerified: true,
      prescriptionVerifiedAt: new Date(),
      prescriptionVerifiedBy: 'pharmacist-123',
      status: OrderStatus.READY_FOR_PICKUP,
      statusHistory: [
        {
          status: OrderStatus.PENDING_PAYMENT,
          timestamp: new Date()
        },
        {
          status: OrderStatus.PAYMENT_CONFIRMED,
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(order.deliveryType).toBe('pickup');
    expect(order.deliveryFee).toBe(0);
    expect(order.prescriptionRequired).toBe(true);
    expect(order.prescriptionVerified).toBe(true);
  });

  it('should create order with status history', () => {
    const order: Order = {
      id: 'ord-789',
      orderNumber: 'ORD-2025-001236',
      userId: 'user-789',
      pharmacyId: 'pharma-789',
      items: [],
      subtotal: 5000,
      deliveryFee: 500,
      discount: 500,
      total: 5000,
      deliveryType: 'delivery',
      paymentMethod: 'boleto',
      paymentStatus: PaymentStatus.PAID,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.COMPLETED,
      statusHistory: [
        { status: OrderStatus.PENDING_PAYMENT, timestamp: new Date() },
        { status: OrderStatus.PAYMENT_CONFIRMED, timestamp: new Date() },
        { status: OrderStatus.PREPARING, timestamp: new Date() },
        { status: OrderStatus.OUT_FOR_DELIVERY, timestamp: new Date() },
        { status: OrderStatus.DELIVERED, timestamp: new Date() },
        { status: OrderStatus.COMPLETED, timestamp: new Date() }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date()
    };

    expect(order.statusHistory.length).toBe(6);
    expect(order.status).toBe(OrderStatus.COMPLETED);
    expect(order.completedAt).toBeDefined();
  });

  it('should create canceled order', () => {
    const order: Order = {
      id: 'ord-canceled',
      orderNumber: 'ORD-2025-001237',
      userId: 'user-canceled',
      pharmacyId: 'pharma-canceled',
      items: [],
      subtotal: 1000,
      deliveryFee: 0,
      discount: 0,
      total: 1000,
      deliveryType: 'pickup',
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.REFUNDED,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.CANCELED,
      statusHistory: [
        { status: OrderStatus.PENDING_PAYMENT, timestamp: new Date() },
        { status: OrderStatus.CANCELED, timestamp: new Date(), note: 'Cancelado pelo cliente' }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      canceledAt: new Date()
    };

    expect(order.status).toBe(OrderStatus.CANCELED);
    expect(order.canceledAt).toBeDefined();
    expect(order.paymentStatus).toBe(PaymentStatus.REFUNDED);
  });

  it('should create order with tracking code', () => {
    const order: Order = {
      id: 'ord-tracking',
      orderNumber: 'ORD-2025-001238',
      userId: 'user-tracking',
      pharmacyId: 'pharma-tracking',
      items: [],
      subtotal: 2000,
      deliveryFee: 1000,
      discount: 0,
      total: 3000,
      deliveryType: 'delivery',
      deliveryAddress: {
        recipientName: 'Test',
        phone: '11999999999',
        street: 'Rua Test',
        number: '1',
        neighborhood: 'Test',
        city: 'SP',
        state: 'SP',
        zipCode: '01234567'
      },
      estimatedDeliveryTime: '30-60 minutos',
      trackingCode: 'TRACK123456',
      paymentMethod: 'pix',
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date(),
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.OUT_FOR_DELIVERY,
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(order.trackingCode).toBe('TRACK123456');
    expect(order.estimatedDeliveryTime).toBe('30-60 minutos');
  });

  it('should create order with notes', () => {
    const order: Order = {
      id: 'ord-notes',
      orderNumber: 'ORD-2025-001239',
      userId: 'user-notes',
      pharmacyId: 'pharma-notes',
      items: [],
      subtotal: 1500,
      deliveryFee: 500,
      discount: 0,
      total: 2000,
      deliveryType: 'delivery',
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.PENDING,
      prescriptionRequired: false,
      prescriptionVerified: false,
      status: OrderStatus.PENDING_PAYMENT,
      statusHistory: [],
      notes: 'Por favor, entregar depois das 18h',
      pharmacyNotes: 'Cliente solicitou entrega no período noturno',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(order.notes).toContain('18h');
    expect(order.pharmacyNotes).toContain('noturno');
  });
});
