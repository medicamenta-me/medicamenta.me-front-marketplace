/**
 * @file review-status.enum.spec.ts
 * @description Testes unitários para o enum ReviewStatus
 */

import { ReviewStatus } from '../../review.model';

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
