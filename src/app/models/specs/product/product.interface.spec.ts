/**
 * @file product.interface.spec.ts
 * @description Testes unitários para a interface Product
 */

import { Product, ProductCategory } from '../../product.model';

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
