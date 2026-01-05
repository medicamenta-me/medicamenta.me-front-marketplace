/**
 * @file review-filters.interface.spec.ts
 * @description Testes unitários para a interface ReviewFilters
 */

import { ReviewFilters, ReviewStatus } from '../../review.model';

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
