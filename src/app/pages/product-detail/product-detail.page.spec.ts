import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProductDetailPage } from './product-detail.page';
import { ProductService, PaginatedProducts } from '../../core/services/product.service';
import { Product, ProductCategory } from '../../models/product.model';

describe('ProductDetailPage', () => {
  let component: ProductDetailPage;
  let fixture: ComponentFixture<ProductDetailPage>;
  let productService: jasmine.SpyObj<ProductService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: { params: BehaviorSubject<any> };

  const mockProduct: Product = {
    id: '1',
    name: 'Paracetamol 500mg',
    description: 'Analgésico e antitérmico',
    price: 1250, // R$ 12,50 in cents
    category: ProductCategory.ANALGESICS,
    images: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ],
    stock: 100,
    requiresPrescription: false,
    rating: 4.5,
    reviewCount: 120,
    soldCount: 50,
    discount: 10, // 10% discount
    tags: ['dor', 'febre'],
    manufacturer: 'EMS',
    minStock: 5,
    pharmacyId: 'pharmacy1',
    sku: 'PAR500',
    specifications: {
      'Principio Ativo': 'Paracetamol',
      'Dosagem': '500mg',
      'Forma': 'Comprimido'
    },
    isFeatured: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRelatedProducts: Product[] = [
    {
      ...mockProduct,
      id: '2',
      name: 'Dipirona 500mg',
      price: 1000
    },
    {
      ...mockProduct,
      id: '3',
      name: 'Ibuprofeno 400mg',
      price: 1500
    }
  ];

  const mockPaginatedProducts: PaginatedProducts = {
    products: mockRelatedProducts,
    hasMore: false,
    lastDocument: null,
    total: 2
  };

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getProductById',
      'getProducts'
    ]);
    (productServiceSpy as any).searchQuery$ = new BehaviorSubject<string>('');
    (productServiceSpy as any).isLoading = signal(false);
    
    // Default stub - return mock product and related products
    productServiceSpy.getProductById.and.returnValue(of(mockProduct));
    productServiceSpy.getProducts.and.returnValue(of(mockPaginatedProducts));

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    activatedRoute = {
      params: new BehaviorSubject({ id: '1' })
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetailPage, NoopAnimationsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.product()).toBeNull();
      expect(component.selectedImage()).toBe('');
      expect(component.quantity()).toBe(1);
      expect(component.isLoading()).toBe(false);
      expect(component.relatedProducts()).toEqual([]);
    });

    it('should load product on init', async () => {
      productService.getProductById.and.returnValue(of(mockProduct));
      productService.getProducts.and.returnValue(of(mockPaginatedProducts));

      component.ngOnInit();
      await fixture.whenStable();

      expect(productService.getProductById).toHaveBeenCalledWith('1');
      expect(component.product()).toEqual(mockProduct);
    });

    it('should navigate to products list if product not found', async () => {
      productService.getProductById.and.returnValue(of(null));
      router.navigate.and.returnValue(Promise.resolve(true));

      component.ngOnInit();
      await fixture.whenStable();

      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });
  });

  describe('Image Gallery', () => {
    beforeEach(() => {
      component.product.set(mockProduct);
    });

    it('should select first image as default', () => {
      component['loadProduct']('1');
      fixture.detectChanges();
      
      const firstImage = component.getPrimaryImage(mockProduct);
      expect(firstImage).toBe(mockProduct.images[0]);
    });

    it('should change selected image when thumbnail clicked', () => {
      const newImage = mockProduct.images[1];
      component.selectImage(newImage);
      
      expect(component.selectedImage()).toBe(newImage);
    });

    it('should return placeholder if no images', () => {
      const productNoImages: Product = { ...mockProduct, images: [] };
      const image = component.getPrimaryImage(productNoImages);
      
      expect(image).toBe('assets/placeholder-product.png');
    });
  });

  describe('Quantity Management', () => {
    beforeEach(() => {
      component.product.set(mockProduct);
      component.quantity.set(1);
    });

    it('should increment quantity', () => {
      component.incrementQuantity();
      expect(component.quantity()).toBe(2);
    });

    it('should decrement quantity', () => {
      component.quantity.set(5);
      component.decrementQuantity();
      expect(component.quantity()).toBe(4);
    });

    it('should not decrement below 1', () => {
      component.quantity.set(1);
      component.decrementQuantity();
      expect(component.quantity()).toBe(1);
    });

    it('should not increment above stock', () => {
      component.quantity.set(100); // max stock
      component.incrementQuantity();
      expect(component.quantity()).toBe(100);
    });

    it('should calculate total price correctly', () => {
      component.quantity.set(3);
      const total = component.totalPrice();
      expect(total).toBe(mockProduct.price * 3);
    });
  });

  describe('Price Calculations', () => {
    beforeEach(() => {
      component.product.set(mockProduct);
    });

    it('should calculate discounted price', () => {
      const discounted = component.discountedPrice();
      expect(discounted).toBe(1125); // 1250 - 10% = 1125
    });

    it('should return null if no discount', () => {
      const productNoDiscount = { ...mockProduct, discount: 0 };
      component.product.set(productNoDiscount);
      
      const discounted = component.discountedPrice();
      expect(discounted).toBeNull();
    });

    it('should format price correctly', () => {
      const formatted = component.formatPrice(1250);
      expect(formatted).toContain('12,50');
      expect(formatted).toContain('R$');
    });
  });

  describe('Stock Management', () => {
    it('should detect product in stock', () => {
      component.product.set(mockProduct);
      expect(component.inStock()).toBe(true);
    });

    it('should detect product out of stock', () => {
      const outOfStock = { ...mockProduct, stock: 0 };
      component.product.set(outOfStock);
      expect(component.inStock()).toBe(false);
    });

    it('should allow adding to cart if enough stock', () => {
      component.product.set(mockProduct);
      component.quantity.set(10);
      expect(component.canAddToCart()).toBe(true);
    });

    it('should not allow adding to cart if not enough stock', () => {
      component.product.set(mockProduct);
      component.quantity.set(200); // more than stock
      expect(component.canAddToCart()).toBe(false);
    });
  });

  describe('Cart Actions', () => {
    beforeEach(() => {
      component.product.set(mockProduct);
      component.quantity.set(2);
      spyOn(window, 'alert'); // Mock alert
    });

    it('should add product to cart', () => {
      component.addToCart();
      expect(window.alert).toHaveBeenCalled();
    });

    it('should not add to cart if cannot add', () => {
      component.quantity.set(200); // more than stock
      component.addToCart();
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('should buy now and navigate to cart', () => {
      router.navigate.and.returnValue(Promise.resolve(true));
      
      component.buyNow();
      
      expect(window.alert).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/cart']);
    });
  });

  describe('Related Products', () => {
    it('should load related products', async () => {
      productService.getProducts.and.returnValue(of(mockPaginatedProducts));
      component.product.set(mockProduct);

      await component.loadRelatedProducts(mockProduct.category);

      expect(productService.getProducts).toHaveBeenCalledWith(
        { category: mockProduct.category },
        { field: 'rating', direction: 'desc' },
        6
      );
      expect(component.relatedProducts().length).toBeGreaterThan(0);
    });

    it('should exclude current product from related', async () => {
      const productsWithCurrent = {
        ...mockPaginatedProducts,
        products: [mockProduct, ...mockRelatedProducts]
      };
      productService.getProducts.and.returnValue(of(productsWithCurrent));
      component.product.set(mockProduct);

      await component.loadRelatedProducts(mockProduct.category);

      const related = component.relatedProducts();
      expect(related.find(p => p.id === mockProduct.id)).toBeUndefined();
    });

    it('should navigate to related product', () => {
      router.navigate.and.returnValue(Promise.resolve(true));
      
      component.goToRelatedProduct('2');
      
      expect(router.navigate).toHaveBeenCalledWith(['/products', '2']);
    });
  });

  describe('Rating Display', () => {
    beforeEach(() => {
      component.product.set(mockProduct);
    });

    it('should generate rating stars array', () => {
      const stars = component.getRatingStars();
      expect(stars.length).toBe(5);
    });

    it('should mark correct number of stars as filled', () => {
      const stars = component.getRatingStars();
      const filledCount = stars.filter(s => s.filled).length;
      expect(filledCount).toBe(Math.round(mockProduct.rating));
    });

    it('should return empty array if no product', () => {
      component.product.set(null);
      const stars = component.getRatingStars();
      expect(stars).toEqual([]);
    });
  });

  describe('Category Display', () => {
    it('should return category label', () => {
      const label = component.getCategoryLabel(ProductCategory.ANALGESICS);
      expect(label).toBe('Analgésicos');
    });

    it('should return category value if no label', () => {
      const label = component.getCategoryLabel('unknown' as ProductCategory);
      expect(label).toBe('unknown');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to products list', () => {
      router.navigate.and.returnValue(Promise.resolve(true));
      
      component.goBack();
      
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null product for incrementQuantity', () => {
      component.product.set(null);
      const initialQty = component.quantity();
      
      component.incrementQuantity();
      
      expect(component.quantity()).toBe(initialQty);
    });

    it('should handle null product for addToCart', () => {
      component.product.set(null);
      spyOn(console, 'log');
      
      component.addToCart();
      
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle inStock computed with null product', () => {
      component.product.set(null);
      expect(component.inStock()).toBe(false);
    });

    it('should handle canAddToCart computed with null product', () => {
      component.product.set(null);
      expect(component.canAddToCart()).toBe(false);
    });

    it('should handle totalPrice computed with null product', () => {
      component.product.set(null);
      expect(component.totalPrice()).toBe(0);
    });

    it('should handle discountedPrice computed with null product', () => {
      component.product.set(null);
      expect(component.discountedPrice()).toBeNull();
    });

    it('should handle error when loading product', async () => {
      productService.getProductById.and.throwError(new Error('Load error'));
      spyOn(console, 'error');
      
      await component.loadProduct('invalid-id');
      
      expect(console.error).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });

    it('should handle error when loading related products', async () => {
      productService.getProducts.and.throwError(new Error('Related error'));
      spyOn(console, 'error');
      
      await component.loadRelatedProducts(ProductCategory.ANALGESICS);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should not load product if no id in route', () => {
      activatedRoute.params.next({});
      productService.getProductById.calls.reset();
      
      component.ngOnInit();
      
      expect(productService.getProductById).not.toHaveBeenCalled();
    });

    it('should handle null result from getProducts', async () => {
      productService.getProducts.and.returnValue(of(null as any));
      component.product.set(mockProduct);
      
      await component.loadRelatedProducts(ProductCategory.ANALGESICS);
      
      // Should not throw error
      expect(component.relatedProducts().length).toBe(0);
    });
  });

  describe('Discount Price Edge Cases', () => {
    it('should return null when product has undefined discount', () => {
      const productNoDiscount = { ...mockProduct };
      delete (productNoDiscount as any).discount;
      component.product.set(productNoDiscount);
      
      expect(component.discountedPrice()).toBeNull();
    });
  });
});
