import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';
import { Product, ProductCategory } from '../../models/product.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: '1',
    name: 'Paracetamol 500mg',
    description: 'Analgésico e antitérmico para alívio de dores',
    price: 12.50,
    category: ProductCategory.ANALGESICS,
    images: ['https://example.com/image1.jpg'],
    stock: 100,
    requiresPrescription: false,
    rating: 4.5,
    reviewCount: 120,
    soldCount: 50,
    tags: ['dor', 'febre'],
    discount: 10,
    manufacturer: 'EMS',
    minStock: 5,
    pharmacyId: 'pharmacy1',
    sku: 'PAR500',
    specifications: {},
    isFeatured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should use grid view by default', () => {
      expect(component.viewMode).toBe('grid');
    });
  });

  describe('Price Formatting', () => {
    it('should format price correctly', () => {
      expect(component.formatPrice(12.50)).toBe('R$ 12,50');
      expect(component.formatPrice(100)).toBe('R$ 100,00');
    });

    it('should calculate discounted price', () => {
      const discounted = component.getDiscountedPrice();
      expect(discounted).toBe(11.25);
    });

    it('should return null when no discount', () => {
      component.product = { ...mockProduct, discount: undefined };
      expect(component.getDiscountedPrice()).toBeNull();
    });
  });

  describe('Stock Status', () => {
    it('should return true when product is in stock', () => {
      expect(component.isInStock()).toBe(true);
    });

    it('should return false when product is out of stock', () => {
      component.product = { ...mockProduct, stock: 0 };
      expect(component.isInStock()).toBe(false);
    });
  });

  describe('Rating Display', () => {
    it('should generate correct rating stars', () => {
      const stars = component.getRatingStars();
      expect(stars.length).toBe(5);
    });

    it('should handle different ratings', () => {
      component.product = { ...mockProduct, rating: 3.2 };
      const stars = component.getRatingStars();
      expect(stars.filter(s => s.filled).length).toBe(3);
    });
  });

  describe('Images', () => {
    it('should get primary image', () => {
      expect(component.getPrimaryImage()).toBe('https://example.com/image1.jpg');
    });

    it('should use placeholder when no images', () => {
      component.product = { ...mockProduct, images: [] };
      expect(component.getPrimaryImage()).toBe('/assets/placeholder-product.png');
    });
  });

  describe('User Interactions', () => {
    it('should emit productClick when card is clicked', () => {
      spyOn(component.productClick, 'emit');
      component.onProductClick();
      expect(component.productClick.emit).toHaveBeenCalledWith('1');
    });
  });

  // ============================================
  // TESTES ADICIONAIS
  // ============================================

  describe('Price Formatting Edge Cases', () => {
    it('should format zero price', () => {
      expect(component.formatPrice(0)).toBe('R$ 0,00');
    });

    it('should format large price', () => {
      expect(component.formatPrice(9999.99)).toBe('R$ 9999,99');
    });

    it('should format price with many decimals', () => {
      expect(component.formatPrice(12.555)).toBe('R$ 12,55');
    });

    it('should format integer price', () => {
      expect(component.formatPrice(50)).toBe('R$ 50,00');
    });
  });

  describe('Discount Calculations', () => {
    it('should calculate 50% discount correctly', () => {
      component.product = { ...mockProduct, discount: 50 };
      const discounted = component.getDiscountedPrice();
      expect(discounted).toBe(6.25);
    });

    it('should calculate 100% discount correctly', () => {
      component.product = { ...mockProduct, discount: 100 };
      const discounted = component.getDiscountedPrice();
      expect(discounted).toBe(0);
    });

    it('should return null when discount is 0', () => {
      component.product = { ...mockProduct, discount: 0 };
      expect(component.getDiscountedPrice()).toBeNull();
    });

    it('should handle negative price gracefully', () => {
      component.product = { ...mockProduct, price: -10, discount: 10 };
      const discounted = component.getDiscountedPrice();
      expect(discounted).toBe(-9);
    });
  });

  describe('Rating Stars Edge Cases', () => {
    it('should handle rating of 0', () => {
      component.product = { ...mockProduct, rating: 0 };
      const stars = component.getRatingStars();
      expect(stars.filter(s => s.filled).length).toBe(0);
    });

    it('should handle rating of 5', () => {
      component.product = { ...mockProduct, rating: 5 };
      const stars = component.getRatingStars();
      expect(stars.filter(s => s.filled).length).toBe(5);
    });

    it('should round up rating of 4.6 to 5', () => {
      component.product = { ...mockProduct, rating: 4.6 };
      const stars = component.getRatingStars();
      expect(stars.filter(s => s.filled).length).toBe(5);
    });

    it('should round down rating of 4.4 to 4', () => {
      component.product = { ...mockProduct, rating: 4.4 };
      const stars = component.getRatingStars();
      expect(stars.filter(s => s.filled).length).toBe(4);
    });

    it('should handle rating of 2.5', () => {
      component.product = { ...mockProduct, rating: 2.5 };
      const stars = component.getRatingStars();
      expect(stars.filter(s => s.filled).length).toBe(3);
    });

    it('should have exactly 5 stars', () => {
      const stars = component.getRatingStars();
      expect(stars.length).toBe(5);
    });
  });

  describe('Stock Edge Cases', () => {
    it('should return true for stock of 1', () => {
      component.product = { ...mockProduct, stock: 1 };
      expect(component.isInStock()).toBe(true);
    });

    it('should return true for large stock', () => {
      component.product = { ...mockProduct, stock: 99999 };
      expect(component.isInStock()).toBe(true);
    });

    it('should return false for negative stock', () => {
      component.product = { ...mockProduct, stock: -1 };
      expect(component.isInStock()).toBe(false);
    });
  });

  describe('Images Edge Cases', () => {
    it('should return first image when multiple images exist', () => {
      component.product = { 
        ...mockProduct, 
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ] 
      };
      expect(component.getPrimaryImage()).toBe('https://example.com/image1.jpg');
    });

    it('should handle single image array', () => {
      component.product = { ...mockProduct, images: ['single.jpg'] };
      expect(component.getPrimaryImage()).toBe('single.jpg');
    });
  });

  describe('View Mode', () => {
    it('should accept list view mode', () => {
      component.viewMode = 'list';
      expect(component.viewMode).toBe('list');
    });

    it('should accept grid view mode', () => {
      component.viewMode = 'grid';
      expect(component.viewMode).toBe('grid');
    });
  });

  describe('Product Output Events', () => {
    it('should emit correct product id', () => {
      const emitSpy = spyOn(component.productClick, 'emit');
      component.product = { ...mockProduct, id: 'custom-id-123' };
      
      component.onProductClick();
      
      expect(emitSpy).toHaveBeenCalledWith('custom-id-123');
    });

    it('should emit event only once per click', () => {
      const emitSpy = spyOn(component.productClick, 'emit');
      
      component.onProductClick();
      
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component with Different Product Types', () => {
    it('should handle prescription required product', () => {
      component.product = { ...mockProduct, requiresPrescription: true };
      fixture.detectChanges();
      expect(component.product.requiresPrescription).toBe(true);
    });

    it('should handle featured product', () => {
      component.product = { ...mockProduct, isFeatured: true };
      fixture.detectChanges();
      expect(component.product.isFeatured).toBe(true);
    });

    it('should handle inactive product', () => {
      component.product = { ...mockProduct, isActive: false };
      fixture.detectChanges();
      expect(component.product.isActive).toBe(false);
    });

    it('should handle product with no tags', () => {
      component.product = { ...mockProduct, tags: [] };
      fixture.detectChanges();
      expect(component.product.tags.length).toBe(0);
    });

    it('should handle product with many tags', () => {
      component.product = { ...mockProduct, tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] };
      fixture.detectChanges();
      expect(component.product.tags.length).toBe(5);
    });
  });
});
