/**
 * @file product.model.spec.ts
 * @description Testes unitários para o modelo de produtos do marketplace
 * @coverage 100% target
 */

import {
  Product,
  ProductCategory,
  CATEGORY_LABELS,
  ProductFilters,
  ProductSortOptions
} from './product.model';

describe('Product Model', () => {

  // ==========================================================================
  // ProductCategory ENUM TESTS
  // ==========================================================================

  describe('ProductCategory Enum', () => {
    it('should have ANALGESICS category', () => {
      expect(ProductCategory.ANALGESICS).toBe('analgesics');
    });

    it('should have ANTIBIOTICS category', () => {
      expect(ProductCategory.ANTIBIOTICS).toBe('antibiotics');
    });

    it('should have ANTIHISTAMINES category', () => {
      expect(ProductCategory.ANTIHISTAMINES).toBe('antihistamines');
    });

    it('should have ANTIHYPERTENSIVES category', () => {
      expect(ProductCategory.ANTIHYPERTENSIVES).toBe('antihypertensives');
    });

    it('should have CARDIOVASCULAR category', () => {
      expect(ProductCategory.CARDIOVASCULAR).toBe('cardiovascular');
    });

    it('should have DERMATOLOGICALS category', () => {
      expect(ProductCategory.DERMATOLOGICALS).toBe('dermatologicals');
    });

    it('should have DIABETES category', () => {
      expect(ProductCategory.DIABETES).toBe('diabetes');
    });

    it('should have DIGESTIVE category', () => {
      expect(ProductCategory.DIGESTIVE).toBe('digestive');
    });

    it('should have SUPPLEMENTS category', () => {
      expect(ProductCategory.SUPPLEMENTS).toBe('supplements');
    });

    it('should have VITAMINS category', () => {
      expect(ProductCategory.VITAMINS).toBe('vitamins');
    });

    it('should have PEDIATRICS category', () => {
      expect(ProductCategory.PEDIATRICS).toBe('pediatrics');
    });

    it('should have WOMEN_HEALTH category', () => {
      expect(ProductCategory.WOMEN_HEALTH).toBe('women_health');
    });

    it('should have MEDICAL_DEVICES category', () => {
      expect(ProductCategory.MEDICAL_DEVICES).toBe('medical_devices');
    });

    it('should have 13 total categories', () => {
      const categoryCount = Object.keys(ProductCategory).length;
      expect(categoryCount).toBe(13);
    });
  });

  // ==========================================================================
  // CATEGORY_LABELS TESTS
  // ==========================================================================

  describe('CATEGORY_LABELS', () => {
    it('should have label for ANALGESICS', () => {
      expect(CATEGORY_LABELS[ProductCategory.ANALGESICS]).toBe('Analgésicos e Antitérmicos');
    });

    it('should have label for ANTIBIOTICS', () => {
      expect(CATEGORY_LABELS[ProductCategory.ANTIBIOTICS]).toBe('Antibióticos');
    });

    it('should have label for ANTIHISTAMINES', () => {
      expect(CATEGORY_LABELS[ProductCategory.ANTIHISTAMINES]).toBe('Antialérgicos');
    });

    it('should have label for ANTIHYPERTENSIVES', () => {
      expect(CATEGORY_LABELS[ProductCategory.ANTIHYPERTENSIVES]).toBe('Anti-hipertensivos');
    });

    it('should have label for CARDIOVASCULAR', () => {
      expect(CATEGORY_LABELS[ProductCategory.CARDIOVASCULAR]).toBe('Cardiovasculares');
    });

    it('should have label for DERMATOLOGICALS', () => {
      expect(CATEGORY_LABELS[ProductCategory.DERMATOLOGICALS]).toBe('Dermatológicos');
    });

    it('should have label for DIABETES', () => {
      expect(CATEGORY_LABELS[ProductCategory.DIABETES]).toBe('Diabetes');
    });

    it('should have label for DIGESTIVE', () => {
      expect(CATEGORY_LABELS[ProductCategory.DIGESTIVE]).toBe('Sistema Digestivo');
    });

    it('should have label for SUPPLEMENTS', () => {
      expect(CATEGORY_LABELS[ProductCategory.SUPPLEMENTS]).toBe('Suplementos');
    });

    it('should have label for VITAMINS', () => {
      expect(CATEGORY_LABELS[ProductCategory.VITAMINS]).toBe('Vitaminas e Minerais');
    });

    it('should have label for PEDIATRICS', () => {
      expect(CATEGORY_LABELS[ProductCategory.PEDIATRICS]).toBe('Pediatria');
    });

    it('should have label for WOMEN_HEALTH', () => {
      expect(CATEGORY_LABELS[ProductCategory.WOMEN_HEALTH]).toBe('Saúde da Mulher');
    });

    it('should have label for MEDICAL_DEVICES', () => {
      expect(CATEGORY_LABELS[ProductCategory.MEDICAL_DEVICES]).toBe('Dispositivos Médicos');
    });

    it('should have labels for all categories', () => {
      Object.values(ProductCategory).forEach(category => {
        expect(CATEGORY_LABELS[category]).toBeDefined();
        expect(typeof CATEGORY_LABELS[category]).toBe('string');
        expect(CATEGORY_LABELS[category].length).toBeGreaterThan(0);
      });
    });

    it('should have Portuguese labels', () => {
      // Check that labels are in Portuguese (no English words)
      const labels = Object.values(CATEGORY_LABELS);
      const englishWords = ['and', 'the', 'of', 'for', 'with'];
      
      labels.forEach(label => {
        englishWords.forEach(word => {
          expect(label.toLowerCase()).not.toContain(` ${word} `);
        });
      });
    });
  });

  // ==========================================================================
  // Product INTERFACE TESTS
  // ==========================================================================

  describe('Product Interface', () => {
    it('should create a valid basic product', () => {
      const product: Product = {
        id: 'prod-123',
        name: 'Dipirona 500mg',
        description: 'Analgésico e antitérmico',
        manufacturer: 'EMS',
        category: ProductCategory.ANALGESICS,
        images: ['image1.jpg'],
        price: 1990,
        stock: 100,
        minStock: 10,
        requiresPrescription: false,
        pharmacyId: 'pharma-123',
        sku: 'DIP500EMS',
        specifications: {},
        rating: 4.5,
        reviewCount: 150,
        soldCount: 500,
        isFeatured: false,
        isActive: true,
        tags: ['analgésico', 'dipirona'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.id).toBe('prod-123');
      expect(product.name).toBe('Dipirona 500mg');
      expect(product.price).toBe(1990);
      expect(product.category).toBe(ProductCategory.ANALGESICS);
      expect(product.requiresPrescription).toBe(false);
    });

    it('should create product with all optional fields', () => {
      const product: Product = {
        id: 'prod-456',
        name: 'Amoxicilina 500mg',
        description: 'Antibiótico',
        activeIngredient: 'Amoxicilina',
        dosage: '500mg',
        manufacturer: 'Medley',
        category: ProductCategory.ANTIBIOTICS,
        subcategory: 'Penicilinas',
        images: ['image1.jpg', 'image2.jpg'],
        price: 2990,
        originalPrice: 3590,
        discount: 17,
        stock: 50,
        minStock: 5,
        requiresPrescription: true,
        prescriptionType: 'simple',
        pharmacyId: 'pharma-123',
        sku: 'AMX500MED',
        ean: '7891234567890',
        anvisaRegistry: '123456789',
        packageSize: '20 cápsulas',
        specifications: {
          peso: '100g',
          volume: '100ml'
        },
        rating: 4.8,
        reviewCount: 200,
        soldCount: 1000,
        isFeatured: true,
        isActive: true,
        tags: ['antibiótico', 'amoxicilina'],
        seoTitle: 'Amoxicilina 500mg - Compre Online',
        seoDescription: 'Amoxicilina 500mg com melhor preço',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.activeIngredient).toBe('Amoxicilina');
      expect(product.dosage).toBe('500mg');
      expect(product.originalPrice).toBe(3590);
      expect(product.discount).toBe(17);
      expect(product.prescriptionType).toBe('simple');
      expect(product.ean).toBe('7891234567890');
      expect(product.seoTitle).toBeDefined();
    });

    it('should handle prescription types', () => {
      const simpleProduct: Product = {
        id: 'p1',
        name: 'Product 1',
        description: 'Desc',
        manufacturer: 'Mfg',
        category: ProductCategory.ANTIBIOTICS,
        images: [],
        price: 1000,
        stock: 10,
        minStock: 1,
        requiresPrescription: true,
        prescriptionType: 'simple',
        pharmacyId: 'ph1',
        sku: 'SKU1',
        specifications: {},
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        isFeatured: false,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const controlledProduct: Product = {
        ...simpleProduct,
        id: 'p2',
        sku: 'SKU2',
        prescriptionType: 'controlled'
      };

      const specialProduct: Product = {
        ...simpleProduct,
        id: 'p3',
        sku: 'SKU3',
        prescriptionType: 'special'
      };

      expect(simpleProduct.prescriptionType).toBe('simple');
      expect(controlledProduct.prescriptionType).toBe('controlled');
      expect(specialProduct.prescriptionType).toBe('special');
    });

    it('should calculate discount correctly', () => {
      const product: Product = {
        id: 'p1',
        name: 'Product',
        description: 'Desc',
        manufacturer: 'Mfg',
        category: ProductCategory.VITAMINS,
        images: [],
        price: 1990,
        originalPrice: 2490,
        discount: 20,
        stock: 10,
        minStock: 1,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'SKU1',
        specifications: {},
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        isFeatured: false,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Verify discount math
      const expectedDiscount = Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100);
      expect(expectedDiscount).toBe(20);
    });

    it('should handle product with specifications', () => {
      const product: Product = {
        id: 'p1',
        name: 'Product',
        description: 'Desc',
        manufacturer: 'Mfg',
        category: ProductCategory.MEDICAL_DEVICES,
        images: [],
        price: 5000,
        stock: 10,
        minStock: 1,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'SKU1',
        specifications: {
          peso: '500g',
          dimensoes: '10x20x5cm',
          material: 'Plástico ABS',
          garantia: '1 ano'
        },
        rating: 4.0,
        reviewCount: 25,
        soldCount: 100,
        isFeatured: false,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(Object.keys(product.specifications).length).toBe(4);
      expect(product.specifications['peso']).toBe('500g');
      expect(product.specifications['garantia']).toBe('1 ano');
    });
  });

  // ==========================================================================
  // ProductFilters INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // ProductSortOptions INTERFACE TESTS
  // ==========================================================================

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

  // ==========================================================================
  // EDGE CASES & VALIDATION TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle product with zero price', () => {
      const product: Product = {
        id: 'p1',
        name: 'Free Sample',
        description: 'Amostra grátis',
        manufacturer: 'Lab',
        category: ProductCategory.SUPPLEMENTS,
        images: [],
        price: 0,
        stock: 100,
        minStock: 10,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'FREE',
        specifications: {},
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        isFeatured: false,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.price).toBe(0);
    });

    it('should handle product with zero stock', () => {
      const product: Product = {
        id: 'p1',
        name: 'Out of Stock',
        description: 'Produto esgotado',
        manufacturer: 'Lab',
        category: ProductCategory.VITAMINS,
        images: [],
        price: 1000,
        stock: 0,
        minStock: 5,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'OOS',
        specifications: {},
        rating: 4.5,
        reviewCount: 100,
        soldCount: 500,
        isFeatured: false,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.stock).toBe(0);
      expect(product.soldCount).toBe(500);
    });

    it('should handle product with no images', () => {
      const product: Product = {
        id: 'p1',
        name: 'No Image Product',
        description: 'Sem imagem',
        manufacturer: 'Lab',
        category: ProductCategory.DIGESTIVE,
        images: [],
        price: 1000,
        stock: 10,
        minStock: 1,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'NIP',
        specifications: {},
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        isFeatured: false,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.images.length).toBe(0);
    });

    it('should handle product with multiple images', () => {
      const product: Product = {
        id: 'p1',
        name: 'Multi Image Product',
        description: 'Com várias imagens',
        manufacturer: 'Lab',
        category: ProductCategory.DERMATOLOGICALS,
        images: [
          'image1.jpg',
          'image2.jpg',
          'image3.jpg',
          'image4.jpg',
          'image5.jpg'
        ],
        price: 1000,
        stock: 10,
        minStock: 1,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'MIP',
        specifications: {},
        rating: 4.0,
        reviewCount: 50,
        soldCount: 200,
        isFeatured: true,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.images.length).toBe(5);
    });

    it('should handle product with empty tags', () => {
      const product: Product = {
        id: 'p1',
        name: 'No Tags Product',
        description: 'Sem tags',
        manufacturer: 'Lab',
        category: ProductCategory.PEDIATRICS,
        images: [],
        price: 1000,
        stock: 10,
        minStock: 1,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'NTP',
        specifications: {},
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        isFeatured: false,
        isActive: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.tags.length).toBe(0);
    });

    it('should handle filters with only minimum price', () => {
      const filters: ProductFilters = {
        priceMin: 5000
      };

      expect(filters.priceMin).toBe(5000);
      expect(filters.priceMax).toBeUndefined();
    });

    it('should handle filters with only maximum price', () => {
      const filters: ProductFilters = {
        priceMax: 10000
      };

      expect(filters.priceMin).toBeUndefined();
      expect(filters.priceMax).toBe(10000);
    });

    it('should handle featured product', () => {
      const product: Product = {
        id: 'featured',
        name: 'Featured Product',
        description: 'Em destaque',
        manufacturer: 'Premium Lab',
        category: ProductCategory.SUPPLEMENTS,
        images: ['featured.jpg'],
        price: 9990,
        stock: 50,
        minStock: 5,
        requiresPrescription: false,
        pharmacyId: 'ph1',
        sku: 'FEAT',
        specifications: {},
        rating: 4.9,
        reviewCount: 500,
        soldCount: 2000,
        isFeatured: true,
        isActive: true,
        tags: ['destaque', 'premium'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.isFeatured).toBe(true);
      expect(product.rating).toBeGreaterThan(4.5);
    });

    it('should handle inactive product', () => {
      const product: Product = {
        id: 'inactive',
        name: 'Inactive Product',
        description: 'Produto inativo',
        manufacturer: 'Lab',
        category: ProductCategory.CARDIOVASCULAR,
        images: [],
        price: 1000,
        stock: 0,
        minStock: 1,
        requiresPrescription: true,
        pharmacyId: 'ph1',
        sku: 'INACT',
        specifications: {},
        rating: 3.0,
        reviewCount: 10,
        soldCount: 50,
        isFeatured: false,
        isActive: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(product.isActive).toBe(false);
    });
  });
});
