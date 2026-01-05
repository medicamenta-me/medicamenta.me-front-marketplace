/**
 * @file product-filters.interface.spec.ts
 * @description Testes unitários para as interfaces ProductFilters e ProductSortOptions
 */

import { ProductCategory, ProductFilters, ProductSortOptions } from '../../product.model';

describe('ProductFilters Interface', () => {
  it('should create empty filters', () => {
    const filters: ProductFilters = {};
    expect(filters).toBeDefined();
    expect(Object.keys(filters).length).toBe(0);
  });

  it('should filter by category', () => {
    const filters: ProductFilters = {
      category: ProductCategory.ANALGESICS
    };
    expect(filters.category).toBe(ProductCategory.ANALGESICS);
  });

  it('should filter by subcategory', () => {
    const filters: ProductFilters = {
      category: ProductCategory.ANTIBIOTICS,
      subcategory: 'Penicilinas'
    };
    expect(filters.subcategory).toBe('Penicilinas');
  });

  it('should filter by price range', () => {
    const filters: ProductFilters = {
      priceMin: 1000,
      priceMax: 5000
    };
    expect(filters.priceMin).toBe(1000);
    expect(filters.priceMax).toBe(5000);
  });

  it('should filter by pharmacy', () => {
    const filters: ProductFilters = {
      pharmacyId: 'pharma-123'
    };
    expect(filters.pharmacyId).toBe('pharma-123');
  });

  it('should filter by rating', () => {
    const filters: ProductFilters = {
      rating: 4
    };
    expect(filters.rating).toBe(4);
  });

  it('should filter by stock availability', () => {
    const filters: ProductFilters = {
      inStock: true
    };
    expect(filters.inStock).toBe(true);
  });

  it('should filter by prescription requirement', () => {
    const filters: ProductFilters = {
      requiresPrescription: false
    };
    expect(filters.requiresPrescription).toBe(false);
  });

  it('should filter by search query', () => {
    const filters: ProductFilters = {
      searchQuery: 'dipirona'
    };
    expect(filters.searchQuery).toBe('dipirona');
  });

  it('should filter by tags', () => {
    const filters: ProductFilters = {
      tags: ['analgésico', 'antitérmico']
    };
    expect(filters.tags).toContain('analgésico');
    expect(filters.tags).toContain('antitérmico');
  });

  it('should filter by featured', () => {
    const filters: ProductFilters = {
      isFeatured: true
    };
    expect(filters.isFeatured).toBe(true);
  });

  it('should combine multiple filters', () => {
    const filters: ProductFilters = {
      category: ProductCategory.VITAMINS,
      priceMin: 1000,
      priceMax: 10000,
      rating: 4,
      inStock: true,
      requiresPrescription: false,
      searchQuery: 'vitamina C',
      isFeatured: false
    };

    expect(filters.category).toBe(ProductCategory.VITAMINS);
    expect(filters.priceMin).toBe(1000);
    expect(filters.priceMax).toBe(10000);
    expect(filters.rating).toBe(4);
    expect(filters.inStock).toBe(true);
    expect(filters.requiresPrescription).toBe(false);
  });
});

describe('ProductSortOptions Interface', () => {
  it('should sort by price ascending', () => {
    const sort: ProductSortOptions = {
      field: 'price',
      direction: 'asc'
    };
    expect(sort.field).toBe('price');
    expect(sort.direction).toBe('asc');
  });

  it('should sort by price descending', () => {
    const sort: ProductSortOptions = {
      field: 'price',
      direction: 'desc'
    };
    expect(sort.field).toBe('price');
    expect(sort.direction).toBe('desc');
  });

  it('should sort by rating', () => {
    const sort: ProductSortOptions = {
      field: 'rating',
      direction: 'desc'
    };
    expect(sort.field).toBe('rating');
  });

  it('should sort by soldCount', () => {
    const sort: ProductSortOptions = {
      field: 'soldCount',
      direction: 'desc'
    };
    expect(sort.field).toBe('soldCount');
  });

  it('should sort by createdAt', () => {
    const sort: ProductSortOptions = {
      field: 'createdAt',
      direction: 'desc'
    };
    expect(sort.field).toBe('createdAt');
  });

  it('should sort by name', () => {
    const sort: ProductSortOptions = {
      field: 'name',
      direction: 'asc'
    };
    expect(sort.field).toBe('name');
  });

  it('should have valid field values', () => {
    const validFields = ['price', 'rating', 'soldCount', 'createdAt', 'name'];
    validFields.forEach(field => {
      const sort: ProductSortOptions = {
        field: field as ProductSortOptions['field'],
        direction: 'asc'
      };
      expect(validFields).toContain(sort.field);
    });
  });

  it('should have valid direction values', () => {
    const validDirections = ['asc', 'desc'];
    validDirections.forEach(direction => {
      const sort: ProductSortOptions = {
        field: 'price',
        direction: direction as ProductSortOptions['direction']
      };
      expect(validDirections).toContain(sort.direction);
    });
  });
});
