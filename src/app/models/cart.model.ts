/**
 * 🛒 Cart Model
 * Modelo de dados para carrinho de compras
 */

export interface Cart {
  id: string;
  userId: string;
  pharmacyId: string;               // Carrinho vinculado a uma farmácia
  items: CartItem[];
  subtotal: number;                 // Soma dos items em centavos
  deliveryFee: number;              // Taxa de entrega em centavos
  discount: number;                 // Desconto aplicado em centavos
  total: number;                    // Total final em centavos
  couponCode?: string;              // Cupom aplicado
  expiresAt: Date;                  // Data de expiração (7 dias)
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  product?: any;                    // Dados do produto (pode ser carregado separadamente)
  quantity: number;
  unitPrice: number;                // Preço unitário em centavos
  subtotal: number;                 // quantity * unitPrice
  total: number;                    // subtotal - desconto (se houver)
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ApplyCouponRequest {
  couponCode: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  hasFreeDelivery: boolean;
  missingForFreeDelivery?: number; // Valor que falta para frete grátis
}
