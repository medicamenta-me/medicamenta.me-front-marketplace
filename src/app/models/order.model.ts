/**
 * 📦 Order Model
 * Modelo de dados para pedidos do marketplace
 */

export interface Order {
  id: string;
  orderNumber: string;              // Número único do pedido (ex: "ORD-2025-001234")
  userId: string;
  pharmacyId: string;
  pharmacyName?: string;            // Nome da farmácia para exibição
  customerEmail?: string;           // Email do cliente para confirmação
  items: OrderItem[];
  
  // Valores
  subtotal: number;                 // Soma dos items em centavos
  deliveryFee: number;              // Taxa de entrega
  discount: number;                 // Desconto total
  total: number;                    // Total final
  
  // Entrega
  deliveryAddress?: DeliveryAddress;
  deliveryType: 'delivery' | 'pickup';
  estimatedDeliveryTime?: string;   // Ex: "30-60 minutos"
  trackingCode?: string;
  
  // Pagamento
  paymentMethod: string;            // 'credit_card', 'pix', 'boleto', etc
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  paymentDetails?: any;             // Detalhes específicos do método
  pixCode?: string;                 // Código PIX para pagamento
  boletoUrl?: string;               // URL do boleto para pagamento
  
  // Receita (se necessário)
  prescriptionRequired: boolean;
  prescriptionImages?: string[];    // URLs das imagens da receita
  prescriptionVerified: boolean;
  prescriptionVerifiedAt?: Date;
  prescriptionVerifiedBy?: string;  // ID do farmacêutico
  
  // Status e datas
  status: OrderStatus;
  statusHistory: OrderStatusChange[];
  notes?: string;                   // Observações do cliente
  pharmacyNotes?: string;           // Observações da farmácia
  
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date;
  completedAt?: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface DeliveryAddress {
  recipientName: string;
  phone: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;            // Instruções de entrega
}

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PRESCRIPTION_PENDING = 'prescription_pending',
  PRESCRIPTION_APPROVED = 'prescription_approved',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export interface OrderStatusChange {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  changedBy?: string;               // ID do usuário/farmácia que alterou
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'Aguardando Pagamento',
  [OrderStatus.PAYMENT_CONFIRMED]: 'Pagamento Confirmado',
  [OrderStatus.PRESCRIPTION_PENDING]: 'Aguardando Receita',
  [OrderStatus.PRESCRIPTION_APPROVED]: 'Receita Aprovada',
  [OrderStatus.PREPARING]: 'Preparando Pedido',
  [OrderStatus.READY_FOR_PICKUP]: 'Pronto para Retirada',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Saiu para Entrega',
  [OrderStatus.DELIVERED]: 'Entregue',
  [OrderStatus.COMPLETED]: 'Concluído',
  [OrderStatus.CANCELED]: 'Cancelado',
  [OrderStatus.REFUNDED]: 'Reembolsado'
};

export interface OrderFilters {
  userId?: string;
  pharmacyId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;             // Busca por número do pedido
}

export interface CreateOrderRequest {
  cartId: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: DeliveryAddress;
  paymentMethod: string;
  notes?: string;
  prescriptionImages?: string[];
}

export interface CancelOrderRequest {
  reason: string;
}

export interface RefundOrderRequest {
  reason: string;
  amount?: number;                  // Reembolso parcial (opcional)
}
