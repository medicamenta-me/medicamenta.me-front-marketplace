/**
 * @file review.model.spec.ts
 * @description Testes unitários para o modelo de avaliações do marketplace
 * @coverage 100% target
 */

import {
  Review,
  ReviewStatus,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewFilters,
  ReviewSummary,
  MarkHelpfulRequest
} from './review.model';

describe('Review Model', () => {

  // ==========================================================================
  // ReviewStatus ENUM TESTS
  // ==========================================================================

  describe('ReviewStatus Enum', () => {
    it('should have PENDING status', () => {
      expect(ReviewStatus.PENDING).toBe('pending');
    });

    it('should have APPROVED status', () => {
      expect(ReviewStatus.APPROVED).toBe('approved');
    });

    it('should have REJECTED status', () => {
      expect(ReviewStatus.REJECTED).toBe('rejected');
    });

    it('should have FLAGGED status', () => {
      expect(ReviewStatus.FLAGGED).toBe('flagged');
    });

    it('should have 4 total statuses', () => {
      const statusCount = Object.keys(ReviewStatus).length;
      expect(statusCount).toBe(4);
    });
  });

  // ==========================================================================
  // Review INTERFACE TESTS
  // ==========================================================================

  describe('Review Interface', () => {
    it('should create basic product review', () => {
      const review: Review = {
        id: 'review-123',
        userId: 'user-123',
        targetType: 'product',
        targetId: 'prod-123',
        orderId: 'order-123',
        rating: 5,
        isVerifiedPurchase: true,
        helpful: 0,
        notHelpful: 0,
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.id).toBe('review-123');
      expect(review.targetType).toBe('product');
      expect(review.rating).toBe(5);
      expect(review.isVerifiedPurchase).toBe(true);
    });

    it('should create basic pharmacy review', () => {
      const review: Review = {
        id: 'review-456',
        userId: 'user-456',
        targetType: 'pharmacy',
        targetId: 'pharma-456',
        orderId: 'order-456',
        rating: 4,
        isVerifiedPurchase: true,
        helpful: 10,
        notHelpful: 2,
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.targetType).toBe('pharmacy');
      expect(review.rating).toBe(4);
    });

    it('should create review with all optional fields', () => {
      const review: Review = {
        id: 'review-full',
        userId: 'user-full',
        userName: 'João S.',
        userAvatar: 'avatar.jpg',
        targetType: 'product',
        targetId: 'prod-full',
        orderId: 'order-full',
        rating: 5,
        title: 'Excelente produto!',
        comment: 'Produto chegou em perfeito estado, entrega rápida. Recomendo!',
        images: ['image1.jpg', 'image2.jpg'],
        isVerifiedPurchase: true,
        helpful: 50,
        notHelpful: 5,
        pharmacyResponse: {
          comment: 'Obrigado pela avaliação! Ficamos felizes que gostou.',
          respondedAt: new Date(),
          respondedBy: 'pharma-manager-123'
        },
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.userName).toBe('João S.');
      expect(review.title).toBe('Excelente produto!');
      expect(review.comment).toContain('Recomendo');
      expect(review.images!.length).toBe(2);
      expect(review.pharmacyResponse).toBeDefined();
      expect(review.pharmacyResponse!.comment).toContain('Obrigado');
    });

    it('should create pending review', () => {
      const review: Review = {
        id: 'review-pending',
        userId: 'user-pending',
        targetType: 'product',
        targetId: 'prod-pending',
        orderId: 'order-pending',
        rating: 3,
        comment: 'Produto ok',
        isVerifiedPurchase: true,
        helpful: 0,
        notHelpful: 0,
        status: ReviewStatus.PENDING,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.status).toBe(ReviewStatus.PENDING);
    });

    it('should create flagged review', () => {
      const review: Review = {
        id: 'review-flagged',
        userId: 'user-flagged',
        targetType: 'product',
        targetId: 'prod-flagged',
        orderId: 'order-flagged',
        rating: 1,
        comment: 'Comentário inapropriado...',
        isVerifiedPurchase: false,
        helpful: 0,
        notHelpful: 20,
        status: ReviewStatus.FLAGGED,
        moderationNotes: 'Avaliação sinalizada por conteúdo suspeito',
        reportCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.status).toBe(ReviewStatus.FLAGGED);
      expect(review.moderationNotes).toBeDefined();
      expect(review.reportCount).toBe(5);
    });

    it('should create rejected review', () => {
      const review: Review = {
        id: 'review-rejected',
        userId: 'user-rejected',
        targetType: 'pharmacy',
        targetId: 'pharma-rejected',
        orderId: 'order-rejected',
        rating: 1,
        comment: 'Conteúdo inadequado removido',
        isVerifiedPurchase: false,
        helpful: 0,
        notHelpful: 0,
        status: ReviewStatus.REJECTED,
        moderationNotes: 'Violação dos termos de uso - linguagem ofensiva',
        reportCount: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.status).toBe(ReviewStatus.REJECTED);
      expect(review.moderationNotes).toContain('Violação');
    });

    it('should handle non-verified purchase review', () => {
      const review: Review = {
        id: 'review-unverified',
        userId: 'user-unverified',
        targetType: 'product',
        targetId: 'prod-unverified',
        orderId: 'order-unverified',
        rating: 4,
        isVerifiedPurchase: false,
        helpful: 5,
        notHelpful: 10,
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.isVerifiedPurchase).toBe(false);
    });

    it('should handle all rating values', () => {
      const ratings = [1, 2, 3, 4, 5];
      
      ratings.forEach(rating => {
        const review: Review = {
          id: `review-${rating}`,
          userId: 'user',
          targetType: 'product',
          targetId: 'prod',
          orderId: 'order',
          rating,
          isVerifiedPurchase: true,
          helpful: 0,
          notHelpful: 0,
          status: ReviewStatus.APPROVED,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(review.rating).toBe(rating);
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      });
    });
  });

  // ==========================================================================
  // CreateReviewRequest INTERFACE TESTS
  // ==========================================================================

  describe('CreateReviewRequest Interface', () => {
    it('should create minimal review request', () => {
      const request: CreateReviewRequest = {
        targetType: 'product',
        targetId: 'prod-123',
        orderId: 'order-123',
        rating: 5
      };

      expect(request.targetType).toBe('product');
      expect(request.targetId).toBe('prod-123');
      expect(request.rating).toBe(5);
    });

    it('should create review request with title', () => {
      const request: CreateReviewRequest = {
        targetType: 'product',
        targetId: 'prod-456',
        orderId: 'order-456',
        rating: 4,
        title: 'Bom produto!'
      };

      expect(request.title).toBe('Bom produto!');
    });

    it('should create review request with comment', () => {
      const request: CreateReviewRequest = {
        targetType: 'pharmacy',
        targetId: 'pharma-789',
        orderId: 'order-789',
        rating: 5,
        comment: 'Atendimento excelente, entrega rápida!'
      };

      expect(request.comment).toContain('Atendimento');
    });

    it('should create review request with images', () => {
      const request: CreateReviewRequest = {
        targetType: 'product',
        targetId: 'prod-img',
        orderId: 'order-img',
        rating: 5,
        images: ['foto1.jpg', 'foto2.jpg', 'foto3.jpg']
      };

      expect(request.images).toBeDefined();
      expect(request.images!.length).toBe(3);
    });

    it('should create complete review request', () => {
      const request: CreateReviewRequest = {
        targetType: 'product',
        targetId: 'prod-complete',
        orderId: 'order-complete',
        rating: 5,
        title: 'Perfeito!',
        comment: 'Melhor produto que já comprei. Super recomendo!',
        images: ['produto.jpg']
      };

      expect(request.title).toBe('Perfeito!');
      expect(request.comment).toContain('Melhor');
      expect(request.images!.length).toBe(1);
    });
  });

  // ==========================================================================
  // UpdateReviewRequest INTERFACE TESTS
  // ==========================================================================

  describe('UpdateReviewRequest Interface', () => {
    it('should create update with new rating', () => {
      const request: UpdateReviewRequest = {
        rating: 4
      };

      expect(request.rating).toBe(4);
    });

    it('should create update with new title', () => {
      const request: UpdateReviewRequest = {
        title: 'Título atualizado'
      };

      expect(request.title).toBe('Título atualizado');
    });

    it('should create update with new comment', () => {
      const request: UpdateReviewRequest = {
        comment: 'Comentário atualizado após uso prolongado'
      };

      expect(request.comment).toContain('atualizado');
    });

    it('should create update with new images', () => {
      const request: UpdateReviewRequest = {
        images: ['nova_foto.jpg']
      };

      expect(request.images!.length).toBe(1);
    });

    it('should create complete update request', () => {
      const request: UpdateReviewRequest = {
        rating: 5,
        title: 'Título revisado',
        comment: 'Comentário revisado',
        images: ['img1.jpg', 'img2.jpg']
      };

      expect(request.rating).toBe(5);
      expect(request.title).toBe('Título revisado');
      expect(request.comment).toBe('Comentário revisado');
      expect(request.images!.length).toBe(2);
    });
  });

  // ==========================================================================
  // ReviewFilters INTERFACE TESTS
  // ==========================================================================

  describe('ReviewFilters Interface', () => {
    it('should create empty filters', () => {
      const filters: ReviewFilters = {};
      expect(Object.keys(filters).length).toBe(0);
    });

    it('should filter by targetType', () => {
      const productFilters: ReviewFilters = { targetType: 'product' };
      const pharmacyFilters: ReviewFilters = { targetType: 'pharmacy' };

      expect(productFilters.targetType).toBe('product');
      expect(pharmacyFilters.targetType).toBe('pharmacy');
    });

    it('should filter by targetId', () => {
      const filters: ReviewFilters = {
        targetId: 'prod-123'
      };

      expect(filters.targetId).toBe('prod-123');
    });

    it('should filter by userId', () => {
      const filters: ReviewFilters = {
        userId: 'user-123'
      };

      expect(filters.userId).toBe('user-123');
    });

    it('should filter by rating', () => {
      const filters: ReviewFilters = {
        rating: 5
      };

      expect(filters.rating).toBe(5);
    });

    it('should filter by status', () => {
      const filters: ReviewFilters = {
        status: ReviewStatus.APPROVED
      };

      expect(filters.status).toBe(ReviewStatus.APPROVED);
    });

    it('should filter by verified purchase', () => {
      const filters: ReviewFilters = {
        isVerifiedPurchase: true
      };

      expect(filters.isVerifiedPurchase).toBe(true);
    });

    it('should combine multiple filters', () => {
      const filters: ReviewFilters = {
        targetType: 'product',
        targetId: 'prod-456',
        rating: 4,
        status: ReviewStatus.APPROVED,
        isVerifiedPurchase: true
      };

      expect(filters.targetType).toBe('product');
      expect(filters.targetId).toBe('prod-456');
      expect(filters.rating).toBe(4);
      expect(filters.status).toBe(ReviewStatus.APPROVED);
      expect(filters.isVerifiedPurchase).toBe(true);
    });
  });

  // ==========================================================================
  // ReviewSummary INTERFACE TESTS
  // ==========================================================================

  describe('ReviewSummary Interface', () => {
    it('should create review summary with no reviews', () => {
      const summary: ReviewSummary = {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPurchasePercentage: 0
      };

      expect(summary.averageRating).toBe(0);
      expect(summary.totalReviews).toBe(0);
    });

    it('should create review summary with reviews', () => {
      const summary: ReviewSummary = {
        averageRating: 4.5,
        totalReviews: 100,
        ratingDistribution: { 1: 2, 2: 3, 3: 10, 4: 25, 5: 60 },
        verifiedPurchasePercentage: 85
      };

      expect(summary.averageRating).toBe(4.5);
      expect(summary.totalReviews).toBe(100);
      expect(summary.verifiedPurchasePercentage).toBe(85);
    });

    it('should have valid rating distribution', () => {
      const summary: ReviewSummary = {
        averageRating: 4.2,
        totalReviews: 50,
        ratingDistribution: { 1: 1, 2: 2, 3: 7, 4: 15, 5: 25 },
        verifiedPurchasePercentage: 90
      };

      const totalFromDistribution = 
        summary.ratingDistribution[1] +
        summary.ratingDistribution[2] +
        summary.ratingDistribution[3] +
        summary.ratingDistribution[4] +
        summary.ratingDistribution[5];

      expect(totalFromDistribution).toBe(summary.totalReviews);
    });

    it('should calculate average correctly', () => {
      const distribution = { 1: 10, 2: 10, 3: 20, 4: 30, 5: 30 };
      const total = 100;
      const weightedSum = (1 * 10) + (2 * 10) + (3 * 20) + (4 * 30) + (5 * 30);
      const expectedAverage = weightedSum / total; // 3.6

      const summary: ReviewSummary = {
        averageRating: expectedAverage,
        totalReviews: total,
        ratingDistribution: distribution,
        verifiedPurchasePercentage: 75
      };

      expect(summary.averageRating).toBe(3.6);
    });

    it('should handle all 5-star reviews', () => {
      const summary: ReviewSummary = {
        averageRating: 5.0,
        totalReviews: 50,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 50 },
        verifiedPurchasePercentage: 100
      };

      expect(summary.averageRating).toBe(5.0);
      expect(summary.ratingDistribution[5]).toBe(50);
    });

    it('should handle all 1-star reviews', () => {
      const summary: ReviewSummary = {
        averageRating: 1.0,
        totalReviews: 10,
        ratingDistribution: { 1: 10, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPurchasePercentage: 20
      };

      expect(summary.averageRating).toBe(1.0);
      expect(summary.ratingDistribution[1]).toBe(10);
    });
  });

  // ==========================================================================
  // MarkHelpfulRequest INTERFACE TESTS
  // ==========================================================================

  describe('MarkHelpfulRequest Interface', () => {
    it('should mark as helpful', () => {
      const request: MarkHelpfulRequest = {
        helpful: true
      };

      expect(request.helpful).toBe(true);
    });

    it('should mark as not helpful', () => {
      const request: MarkHelpfulRequest = {
        helpful: false
      };

      expect(request.helpful).toBe(false);
    });
  });

  // ==========================================================================
  // EDGE CASES & VALIDATION TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle review with many images', () => {
      const review: Review = {
        id: 'many-images',
        userId: 'user',
        targetType: 'product',
        targetId: 'prod',
        orderId: 'order',
        rating: 5,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg'],
        isVerifiedPurchase: true,
        helpful: 0,
        notHelpful: 0,
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.images!.length).toBe(5);
    });

    it('should handle review with long comment', () => {
      const longComment = 'A'.repeat(1000);
      
      const review: Review = {
        id: 'long-comment',
        userId: 'user',
        targetType: 'product',
        targetId: 'prod',
        orderId: 'order',
        rating: 4,
        comment: longComment,
        isVerifiedPurchase: true,
        helpful: 0,
        notHelpful: 0,
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.comment!.length).toBe(1000);
    });

    it('should handle high helpful count', () => {
      const review: Review = {
        id: 'popular',
        userId: 'user',
        targetType: 'product',
        targetId: 'prod',
        orderId: 'order',
        rating: 5,
        title: 'Melhor review!',
        comment: 'Comentário muito útil!',
        isVerifiedPurchase: true,
        helpful: 10000,
        notHelpful: 50,
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.helpful).toBe(10000);
      expect(review.helpful).toBeGreaterThan(review.notHelpful);
    });

    it('should handle review with pharmacy response', () => {
      const review: Review = {
        id: 'with-response',
        userId: 'user',
        targetType: 'pharmacy',
        targetId: 'pharma',
        orderId: 'order',
        rating: 3,
        comment: 'Demorou um pouco',
        isVerifiedPurchase: true,
        helpful: 5,
        notHelpful: 2,
        pharmacyResponse: {
          comment: 'Pedimos desculpas pelo atraso. Estamos trabalhando para melhorar.',
          respondedAt: new Date(),
          respondedBy: 'manager-123'
        },
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(review.pharmacyResponse).toBeDefined();
      expect(review.pharmacyResponse!.comment).toContain('desculpas');
    });

    it('should handle all review statuses flow', () => {
      const statusFlow = [
        ReviewStatus.PENDING,
        ReviewStatus.APPROVED,
        ReviewStatus.FLAGGED,
        ReviewStatus.REJECTED
      ];

      statusFlow.forEach(status => {
        expect(Object.values(ReviewStatus)).toContain(status);
      });
    });

    it('should calculate helpfulness ratio', () => {
      const review: Review = {
        id: 'ratio-test',
        userId: 'user',
        targetType: 'product',
        targetId: 'prod',
        orderId: 'order',
        rating: 4,
        isVerifiedPurchase: true,
        helpful: 80,
        notHelpful: 20,
        status: ReviewStatus.APPROVED,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const totalVotes = review.helpful + review.notHelpful;
      const helpfulnessRatio = review.helpful / totalVotes;

      expect(helpfulnessRatio).toBe(0.8);
    });

    it('should handle review summary percentage', () => {
      const summary: ReviewSummary = {
        averageRating: 4.2,
        totalReviews: 80,
        ratingDistribution: { 1: 2, 2: 3, 3: 10, 4: 25, 5: 40 },
        verifiedPurchasePercentage: 87.5
      };

      expect(summary.verifiedPurchasePercentage).toBeGreaterThanOrEqual(0);
      expect(summary.verifiedPurchasePercentage).toBeLessThanOrEqual(100);
    });
  });
});
