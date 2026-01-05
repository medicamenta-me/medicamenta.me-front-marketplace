/**
 * @file order-status.enum.spec.ts
 * @description Testes unitários para os enums OrderStatus e PaymentStatus
 */

import { OrderStatus, PaymentStatus, ORDER_STATUS_LABELS } from '../../order.model';

describe('OrderStatus Enum', () => {
  it('should have PENDING_PAYMENT status', () => {
    expect(OrderStatus.PENDING_PAYMENT).toBe('pending_payment');
  });

  it('should have PAYMENT_CONFIRMED status', () => {
    expect(OrderStatus.PAYMENT_CONFIRMED).toBe('payment_confirmed');
  });

  it('should have PRESCRIPTION_PENDING status', () => {
    expect(OrderStatus.PRESCRIPTION_PENDING).toBe('prescription_pending');
  });

  it('should have PRESCRIPTION_APPROVED status', () => {
    expect(OrderStatus.PRESCRIPTION_APPROVED).toBe('prescription_approved');
  });

  it('should have PREPARING status', () => {
    expect(OrderStatus.PREPARING).toBe('preparing');
  });

  it('should have READY_FOR_PICKUP status', () => {
    expect(OrderStatus.READY_FOR_PICKUP).toBe('ready_for_pickup');
  });

  it('should have OUT_FOR_DELIVERY status', () => {
    expect(OrderStatus.OUT_FOR_DELIVERY).toBe('out_for_delivery');
  });

  it('should have DELIVERED status', () => {
    expect(OrderStatus.DELIVERED).toBe('delivered');
  });

  it('should have COMPLETED status', () => {
    expect(OrderStatus.COMPLETED).toBe('completed');
  });

  it('should have CANCELED status', () => {
    expect(OrderStatus.CANCELED).toBe('canceled');
  });

  it('should have REFUNDED status', () => {
    expect(OrderStatus.REFUNDED).toBe('refunded');
  });

  it('should have 11 total statuses', () => {
    const statusCount = Object.keys(OrderStatus).length;
    expect(statusCount).toBe(11);
  });
});

describe('PaymentStatus Enum', () => {
  it('should have PENDING status', () => {
    expect(PaymentStatus.PENDING).toBe('pending');
  });

  it('should have AUTHORIZED status', () => {
    expect(PaymentStatus.AUTHORIZED).toBe('authorized');
  });

  it('should have PROCESSING status', () => {
    expect(PaymentStatus.PROCESSING).toBe('processing');
  });

  it('should have PAID status', () => {
    expect(PaymentStatus.PAID).toBe('paid');
  });

  it('should have FAILED status', () => {
    expect(PaymentStatus.FAILED).toBe('failed');
  });

  it('should have REFUNDED status', () => {
    expect(PaymentStatus.REFUNDED).toBe('refunded');
  });

  it('should have PARTIALLY_REFUNDED status', () => {
    expect(PaymentStatus.PARTIALLY_REFUNDED).toBe('partially_refunded');
  });

  it('should have 7 total statuses', () => {
    const statusCount = Object.keys(PaymentStatus).length;
    expect(statusCount).toBe(7);
  });
});

describe('ORDER_STATUS_LABELS', () => {
  it('should have label for PENDING_PAYMENT', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.PENDING_PAYMENT]).toBe('Aguardando Pagamento');
  });

  it('should have label for PAYMENT_CONFIRMED', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.PAYMENT_CONFIRMED]).toBe('Pagamento Confirmado');
  });

  it('should have label for PRESCRIPTION_PENDING', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.PRESCRIPTION_PENDING]).toBe('Aguardando Receita');
  });

  it('should have label for PRESCRIPTION_APPROVED', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.PRESCRIPTION_APPROVED]).toBe('Receita Aprovada');
  });

  it('should have label for PREPARING', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.PREPARING]).toBe('Preparando Pedido');
  });

  it('should have label for READY_FOR_PICKUP', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.READY_FOR_PICKUP]).toBe('Pronto para Retirada');
  });

  it('should have label for OUT_FOR_DELIVERY', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.OUT_FOR_DELIVERY]).toBe('Saiu para Entrega');
  });

  it('should have label for DELIVERED', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.DELIVERED]).toBe('Entregue');
  });

  it('should have label for COMPLETED', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.COMPLETED]).toBe('Concluído');
  });

  it('should have label for CANCELED', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.CANCELED]).toBe('Cancelado');
  });

  it('should have label for REFUNDED', () => {
    expect(ORDER_STATUS_LABELS[OrderStatus.REFUNDED]).toBe('Reembolsado');
  });

  it('should have labels for all statuses', () => {
    Object.values(OrderStatus).forEach(status => {
      expect(ORDER_STATUS_LABELS[status]).toBeDefined();
      expect(typeof ORDER_STATUS_LABELS[status]).toBe('string');
      expect(ORDER_STATUS_LABELS[status].length).toBeGreaterThan(0);
    });
  });

  it('should have Portuguese labels', () => {
    const labels = Object.values(ORDER_STATUS_LABELS);
    const englishWords = ['waiting', 'confirmed', 'preparing', 'delivered'];
    
    labels.forEach(label => {
      englishWords.forEach(word => {
        expect(label.toLowerCase()).not.toContain(word);
      });
    });
  });
});
