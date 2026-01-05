/**
 * @file pharmacy-status.enum.spec.ts
 * @description Testes unitários para os enums PharmacyStatus, VerificationStatus e PaymentMethod
 */

import { PharmacyStatus, VerificationStatus, PaymentMethod } from '../../pharmacy.model';

describe('PharmacyStatus Enum', () => {
  it('should have ACTIVE status', () => {
    expect(PharmacyStatus.ACTIVE).toBe('active');
  });

  it('should have INACTIVE status', () => {
    expect(PharmacyStatus.INACTIVE).toBe('inactive');
  });

  it('should have SUSPENDED status', () => {
    expect(PharmacyStatus.SUSPENDED).toBe('suspended');
  });

  it('should have PENDING status', () => {
    expect(PharmacyStatus.PENDING).toBe('pending');
  });

  it('should have 4 total statuses', () => {
    const statusCount = Object.keys(PharmacyStatus).length;
    expect(statusCount).toBe(4);
  });
});

describe('VerificationStatus Enum', () => {
  it('should have PENDING status', () => {
    expect(VerificationStatus.PENDING).toBe('pending');
  });

  it('should have UNDER_REVIEW status', () => {
    expect(VerificationStatus.UNDER_REVIEW).toBe('under_review');
  });

  it('should have APPROVED status', () => {
    expect(VerificationStatus.APPROVED).toBe('approved');
  });

  it('should have REJECTED status', () => {
    expect(VerificationStatus.REJECTED).toBe('rejected');
  });

  it('should have REQUIRES_CHANGES status', () => {
    expect(VerificationStatus.REQUIRES_CHANGES).toBe('requires_changes');
  });

  it('should have 5 total statuses', () => {
    const statusCount = Object.keys(VerificationStatus).length;
    expect(statusCount).toBe(5);
  });
});

describe('PaymentMethod Enum', () => {
  it('should have CREDIT_CARD method', () => {
    expect(PaymentMethod.CREDIT_CARD).toBe('credit_card');
  });

  it('should have DEBIT_CARD method', () => {
    expect(PaymentMethod.DEBIT_CARD).toBe('debit_card');
  });

  it('should have PIX method', () => {
    expect(PaymentMethod.PIX).toBe('pix');
  });

  it('should have BOLETO method', () => {
    expect(PaymentMethod.BOLETO).toBe('boleto');
  });

  it('should have CASH method', () => {
    expect(PaymentMethod.CASH).toBe('cash');
  });

  it('should have INSURANCE method', () => {
    expect(PaymentMethod.INSURANCE).toBe('insurance');
  });

  it('should have 6 total methods', () => {
    const methodCount = Object.keys(PaymentMethod).length;
    expect(methodCount).toBe(6);
  });
});
