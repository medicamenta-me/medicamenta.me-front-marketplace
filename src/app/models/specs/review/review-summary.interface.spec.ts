/**
 * @file review-summary.interface.spec.ts
 * @description Testes unitários para as interfaces ReviewSummary e MarkHelpfulRequest
 */

import { ReviewSummary, MarkHelpfulRequest } from '../../review.model';

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
