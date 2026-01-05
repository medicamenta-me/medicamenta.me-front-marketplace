/**
 * @file review.interface.spec.ts
 * @description Testes unitários para a interface Review
 */

import { Review, ReviewStatus } from '../../review.model';

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
