/**
 * @file pharmacy-filters.interface.spec.ts
 * @description Testes unitários para a interface PharmacyFilters
 */

import { PharmacyFilters, VerificationStatus } from '../../pharmacy.model';

describe('PharmacyFilters Interface', () => {
  it('should create empty filters', () => {
    const filters: PharmacyFilters = {};
    expect(Object.keys(filters).length).toBe(0);
  });

  it('should filter by city', () => {
    const filters: PharmacyFilters = {
      city: 'São Paulo'
    };
    expect(filters.city).toBe('São Paulo');
  });

  it('should filter by state', () => {
    const filters: PharmacyFilters = {
      state: 'SP'
    };
    expect(filters.state).toBe('SP');
  });

  it('should filter by delivery option', () => {
    const filters: PharmacyFilters = {
      hasDelivery: true
    };
    expect(filters.hasDelivery).toBe(true);
  });

  it('should filter by pickup option', () => {
    const filters: PharmacyFilters = {
      hasPickup: true
    };
    expect(filters.hasPickup).toBe(true);
  });

  it('should filter by rating', () => {
    const filters: PharmacyFilters = {
      rating: 4
    };
    expect(filters.rating).toBe(4);
  });

  it('should filter by active status', () => {
    const filters: PharmacyFilters = {
      isActive: true
    };
    expect(filters.isActive).toBe(true);
  });

  it('should filter by verification status', () => {
    const filters: PharmacyFilters = {
      verificationStatus: VerificationStatus.APPROVED
    };
    expect(filters.verificationStatus).toBe(VerificationStatus.APPROVED);
  });

  it('should filter by search query', () => {
    const filters: PharmacyFilters = {
      searchQuery: 'drogasil'
    };
    expect(filters.searchQuery).toBe('drogasil');
  });

  it('should combine multiple filters', () => {
    const filters: PharmacyFilters = {
      city: 'São Paulo',
      state: 'SP',
      hasDelivery: true,
      hasPickup: true,
      rating: 4,
      isActive: true,
      verificationStatus: VerificationStatus.APPROVED
    };

    expect(filters.city).toBe('São Paulo');
    expect(filters.state).toBe('SP');
    expect(filters.hasDelivery).toBe(true);
    expect(filters.rating).toBe(4);
    expect(filters.verificationStatus).toBe(VerificationStatus.APPROVED);
  });
});
