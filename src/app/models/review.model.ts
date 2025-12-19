/**
 * ⭐ Review Model
 * Modelo de dados para avaliações de produtos e farmácias
 */

export interface Review {
  id: string;
  userId: string;
  userName?: string;                // Nome exibido publicamente
  userAvatar?: string;
  targetType: 'product' | 'pharmacy';
  targetId: string;                 // ID do produto ou farmácia
  orderId: string;                  // Pedido relacionado
  rating: number;                   // 1-5 estrelas
  title?: string;                   // Título da avaliação
  comment?: string;                 // Comentário detalhado
  images?: string[];                // Fotos do produto (opcional)
  isVerifiedPurchase: boolean;      // Compra verificada
  helpful: number;                  // Quantas pessoas acharam útil
  notHelpful: number;               // Quantas pessoas não acharam útil
  pharmacyResponse?: {
    comment: string;
    respondedAt: Date;
    respondedBy: string;
  };
  status: ReviewStatus;
  moderationNotes?: string;         // Notas de moderação (admin)
  reportCount: number;              // Denúncias recebidas
  createdAt: Date;
  updatedAt: Date;
}

export enum ReviewStatus {
  PENDING = 'pending',              // Aguardando moderação
  APPROVED = 'approved',            // Aprovada
  REJECTED = 'rejected',            // Rejeitada
  FLAGGED = 'flagged'               // Sinalizada para revisão
}

export interface CreateReviewRequest {
  targetType: 'product' | 'pharmacy';
  targetId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewFilters {
  targetType?: 'product' | 'pharmacy';
  targetId?: string;
  userId?: string;
  rating?: number;
  status?: ReviewStatus;
  isVerifiedPurchase?: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchasePercentage: number;
}

export interface MarkHelpfulRequest {
  helpful: boolean;                 // true = helpful, false = not helpful
}

export interface ReportReviewRequest {
  reason: string;
  details?: string;
}
