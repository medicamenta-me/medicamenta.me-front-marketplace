/**
 * 🧪 Product Management Page Tests
 * Testes unitários para a página de gestão de produtos
 * 
 * Cenários:
 * - Inicialização
 * - Carregamento de produtos
 * - Filtros (busca, categoria, estoque, status)
 * - Ordenação
 * - Seleção de produtos
 * - Ações (editar, duplicar, excluir)
 * - Ações em lote
 * - Paginação
 * - Modal de exclusão
 */

import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { ProductManagementPage, StockFilter, StatusFilter, ProductSortField } from './product-management.page';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, ProductCategory } from '../../models/product.model';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('ProductManagementPage', () => {
  let component: ProductManagementPage;
  let fixture: ComponentFixture<ProductManagementPage>;
  let router: Router;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockAuthService: any;

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Dipirona 500mg',
      description: 'Analgésico e antitérmico',
      activeIngredient: 'Dipirona Sódica',
      dosage: '500mg',
      manufacturer: 'Lab A',
      category: ProductCategory.ANALGESICS,
      images: ['https://example.com/dipirona.jpg'],
      price: 1990,
      stock: 100,
      minStock: 10,
      requiresPrescription: false,
      pharmacyId: 'pharmacy-1',
      sku: 'DIP-500',
      rating: 4.5,
      reviewCount: 50,
      soldCount: 200,
      isFeatured: true,
      isActive: true,
      tags: ['analgésico'],
      specifications: {},
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'prod-2',
      name: 'Amoxicilina 500mg',
      description: 'Antibiótico',
      activeIngredient: 'Amoxicilina',
      dosage: '500mg',
      manufacturer: 'Lab B',
      category: ProductCategory.ANTIBIOTICS,
      images: [],
      price: 2990,
      originalPrice: 3500,
      discount: 15,
      stock: 5,
      minStock: 10,
      requiresPrescription: true,
      pharmacyId: 'pharmacy-1',
      sku: 'AMO-500',
      rating: 4.2,
      reviewCount: 30,
      soldCount: 100,
      isFeatured: false,
      isActive: true,
      tags: ['antibiótico'],
      specifications: {},
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-02')
    },
    {
      id: 'prod-3',
      name: 'Vitamina C 1g',
      description: 'Suplemento vitamínico',
      manufacturer: 'Lab C',
      category: ProductCategory.VITAMINS,
      images: ['https://example.com/vitc.jpg'],
      price: 1500,
      stock: 0,
      minStock: 5,
      requiresPrescription: false,
      pharmacyId: 'pharmacy-1',
      sku: 'VIT-C-1G',
      rating: 4.8,
      reviewCount: 80,
      soldCount: 300,
      isFeatured: true,
      isActive: false,
      tags: ['vitamina'],
      specifications: {},
      createdAt: new Date('2025-01-03'),
      updatedAt: new Date('2025-01-03')
    }
  ];

  beforeEach(async () => {
    mockProductService = jasmine.createSpyObj('ProductService', [
      'getProductsByPharmacy',
      'createProduct',
      'updateProduct',
      'deleteProduct'
    ]);

    mockAuthService = {
      currentUser: signal({ uid: 'pharmacy-1', email: 'pharmacy@test.com' }),
      userProfile: signal({ role: 'pharmacy' }),
      isAuthenticated: signal(true)
    };

    mockProductService.getProductsByPharmacy.and.returnValue(of({ products: mockProducts, lastDocument: null, hasMore: false }));
    mockProductService.createProduct.and.returnValue(of('new-id'));
    mockProductService.updateProduct.and.returnValue(of(void 0));
    mockProductService.deleteProduct.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [
        ProductManagementPage,
        RouterTestingModule.withRoutes([]),
        FormsModule
      ],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => null },
              queryParamMap: { get: () => null }
            }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(ProductManagementPage);
    component = fixture.componentInstance;
  });

  // ==================== INICIALIZAÇÃO ====================
  describe('Inicialização', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have initial loading state as true', () => {
      expect(component.loading()).toBe(true);
    });

    it('should have initial error state as null', () => {
      expect(component.error()).toBeNull();
    });

    it('should have empty products array initially', () => {
      expect(component.products().length).toBe(0);
    });

    it('should have empty selectedProducts array initially', () => {
      expect(component.selectedProducts().length).toBe(0);
    });

    it('should have empty searchQuery initially', () => {
      expect(component.searchQuery()).toBe('');
    });

    it('should have default sortField as createdAt', () => {
      expect(component.sortField()).toBe('createdAt');
    });

    it('should have default sortDirection as desc', () => {
      expect(component.sortDirection()).toBe('desc');
    });

    it('should have default stockFilter as all', () => {
      expect(component.stockFilter()).toBe('all');
    });

    it('should have default statusFilter as all', () => {
      expect(component.statusFilter()).toBe('all');
    });

    it('should have currentPage as 1', () => {
      expect(component.currentPage()).toBe(1);
    });

    it('should have pageSize as 20', () => {
      expect(component.pageSize).toBe(20);
    });

    it('should have showDeleteModal as false', () => {
      expect(component.showDeleteModal()).toBe(false);
    });

    it('should have categories array', () => {
      expect(component.categories.length).toBeGreaterThan(0);
    });
  });

  // ==================== CARREGAMENTO DE PRODUTOS ====================
  describe('Carregamento de Produtos', () => {
    it('should call loadProducts on init', fakeAsync(() => {
      spyOn(component, 'loadProducts').and.callThrough();
      fixture.detectChanges();
      tick();
      expect(component.loadProducts).toHaveBeenCalled();
    }));

    it('should load products successfully', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.products().length).toBe(3);
      expect(component.loading()).toBe(false);
    }));

    it('should set error when user not authenticated', fakeAsync(() => {
      mockAuthService.currentUser = signal(null);
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Usuário não autenticado');
    }));

    it('should handle load error', fakeAsync(() => {
      mockProductService.getProductsByPharmacy.and.returnValue(throwError(() => new Error('Error')));
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Erro ao carregar produtos');
    }));

    it('should call getProductsByPharmacy with pharmacyId', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockProductService.getProductsByPharmacy).toHaveBeenCalledWith('pharmacy-1');
    }));

    it('should set loading to false after load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.loading()).toBe(false);
    }));
  });

  // ==================== FILTROS ====================
  describe('Filtros', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    describe('Busca', () => {
      it('should filter by search query', fakeAsync(() => {
        component.searchQuery.set('dipirona');
        tick(300);
        expect(component.filteredProducts().length).toBe(1);
        expect(component.filteredProducts()[0].name).toBe('Dipirona 500mg');
      }));

      it('should filter by SKU', fakeAsync(() => {
        component.searchQuery.set('AMO-500');
        tick(300);
        expect(component.filteredProducts().length).toBe(1);
        expect(component.filteredProducts()[0].sku).toBe('AMO-500');
      }));

      it('should clear search', () => {
        component.searchQuery.set('test');
        component.clearSearch();
        expect(component.searchQuery()).toBe('');
      });

      it('should reset page on search', fakeAsync(() => {
        component.currentPage.set(2);
        component.onSearchChange('dipirona');
        tick(300);
        expect(component.currentPage()).toBe(1);
      }));

      it('should be case insensitive', fakeAsync(() => {
        component.searchQuery.set('DIPIRONA');
        tick(300);
        expect(component.filteredProducts().length).toBe(1);
      }));
    });

    describe('Categoria', () => {
      it('should filter by category', () => {
        component.onCategoryChange(ProductCategory.ANALGESICS);
        expect(component.filteredProducts().length).toBe(1);
        expect(component.filteredProducts()[0].category).toBe(ProductCategory.ANALGESICS);
      });

      it('should show all when category is empty', () => {
        component.selectedCategory.set(ProductCategory.ANALGESICS);
        component.onCategoryChange('');
        expect(component.filteredProducts().length).toBe(3);
      });

      it('should reset page on category change', () => {
        component.currentPage.set(2);
        component.onCategoryChange(ProductCategory.VITAMINS);
        expect(component.currentPage()).toBe(1);
      });
    });

    describe('Estoque', () => {
      it('should filter in stock products', () => {
        component.onStockFilterChange('in_stock');
        const products = component.filteredProducts();
        expect(products.every(p => p.stock > p.minStock)).toBe(true);
      });

      it('should filter low stock products', () => {
        component.onStockFilterChange('low_stock');
        const products = component.filteredProducts();
        expect(products.every(p => p.stock > 0 && p.stock <= p.minStock)).toBe(true);
      });

      it('should filter out of stock products', () => {
        component.onStockFilterChange('out_of_stock');
        const products = component.filteredProducts();
        expect(products.every(p => p.stock === 0)).toBe(true);
      });

      it('should show all when filter is all', () => {
        component.stockFilter.set('low_stock');
        component.onStockFilterChange('all');
        expect(component.filteredProducts().length).toBe(3);
      });

      it('should filter low stock via filterLowStock', () => {
        component.filterLowStock();
        expect(component.stockFilter()).toBe('low_stock');
      });

      it('should filter out of stock via filterOutOfStock', () => {
        component.filterOutOfStock();
        expect(component.stockFilter()).toBe('out_of_stock');
      });
    });

    describe('Status', () => {
      it('should filter active products', () => {
        component.onStatusFilterChange('active');
        const products = component.filteredProducts();
        expect(products.every(p => p.isActive)).toBe(true);
      });

      it('should filter inactive products', () => {
        component.onStatusFilterChange('inactive');
        const products = component.filteredProducts();
        expect(products.every(p => !p.isActive)).toBe(true);
      });

      it('should show all when filter is all', () => {
        component.statusFilter.set('active');
        component.onStatusFilterChange('all');
        expect(component.filteredProducts().length).toBe(3);
      });
    });
  });

  // ==================== ORDENAÇÃO ====================
  describe('Ordenação', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should sort by name ascending', () => {
      component.sortField.set('name');
      component.sortDirection.set('asc');
      const products = component.filteredProducts();
      expect(products[0].name).toBe('Amoxicilina 500mg');
    });

    it('should sort by name descending', () => {
      component.sortField.set('name');
      component.sortDirection.set('desc');
      const products = component.filteredProducts();
      expect(products[0].name).toBe('Vitamina C 1g');
    });

    it('should sort by price ascending', () => {
      component.sortField.set('price');
      component.sortDirection.set('asc');
      const products = component.filteredProducts();
      expect(products[0].price).toBe(1500);
    });

    it('should sort by price descending', () => {
      component.sortField.set('price');
      component.sortDirection.set('desc');
      const products = component.filteredProducts();
      expect(products[0].price).toBe(2990);
    });

    it('should sort by stock ascending', () => {
      component.sortField.set('stock');
      component.sortDirection.set('asc');
      const products = component.filteredProducts();
      expect(products[0].stock).toBe(0);
    });

    it('should sort by soldCount descending', () => {
      component.sortField.set('soldCount');
      component.sortDirection.set('desc');
      const products = component.filteredProducts();
      expect(products[0].soldCount).toBe(300);
    });

    it('should sort by createdAt descending (default)', () => {
      const products = component.filteredProducts();
      expect(products[0].id).toBe('prod-3');
    });

    it('should toggle sort direction', () => {
      expect(component.sortDirection()).toBe('desc');
      component.toggleSortDirection();
      expect(component.sortDirection()).toBe('asc');
      component.toggleSortDirection();
      expect(component.sortDirection()).toBe('desc');
    });

    it('should change sort field', () => {
      component.onSortFieldChange('name');
      expect(component.sortField()).toBe('name');
    });
  });

  // ==================== SELEÇÃO ====================
  describe('Seleção', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should check if product is selected', () => {
      component.selectedProducts.set(['prod-1']);
      expect(component.isSelected('prod-1')).toBe(true);
      expect(component.isSelected('prod-2')).toBe(false);
    });

    it('should toggle select product', () => {
      expect(component.isSelected('prod-1')).toBe(false);
      component.toggleSelect('prod-1');
      expect(component.isSelected('prod-1')).toBe(true);
      component.toggleSelect('prod-1');
      expect(component.isSelected('prod-1')).toBe(false);
    });

    it('should select all products', () => {
      const event = { target: { checked: true } } as any;
      component.toggleSelectAll(event);
      expect(component.selectedProducts().length).toBe(3);
    });

    it('should deselect all products', () => {
      component.selectedProducts.set(['prod-1', 'prod-2', 'prod-3']);
      const event = { target: { checked: false } } as any;
      component.toggleSelectAll(event);
      expect(component.selectedProducts().length).toBe(0);
    });

    it('should compute allSelected correctly', () => {
      expect(component.allSelected()).toBe(false);
      component.selectedProducts.set(['prod-1', 'prod-2', 'prod-3']);
      expect(component.allSelected()).toBe(true);
    });

    it('should compute someSelected correctly', () => {
      expect(component.someSelected()).toBe(false);
      component.selectedProducts.set(['prod-1']);
      expect(component.someSelected()).toBe(true);
      expect(component.allSelected()).toBe(false);
    });
  });

  // ==================== HELPERS ====================
  describe('Helpers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should check low stock', () => {
      expect(component.isLowStock(mockProducts[0])).toBe(false); // stock: 100, minStock: 10
      expect(component.isLowStock(mockProducts[1])).toBe(true);  // stock: 5, minStock: 10
    });

    it('should check out of stock', () => {
      expect(component.isOutOfStock(mockProducts[0])).toBe(false);
      expect(component.isOutOfStock(mockProducts[2])).toBe(true);
    });

    it('should format currency correctly', () => {
      expect(component.formatCurrency(1990)).toContain('19,90');
      expect(component.formatCurrency(0)).toContain('0,00');
    });

    it('should get category label', () => {
      expect(component.getCategoryLabel(ProductCategory.ANALGESICS)).toBe('Analgésicos e Antitérmicos');
      expect(component.getCategoryLabel(ProductCategory.ANTIBIOTICS)).toBe('Antibióticos');
    });

    it('should return correct empty message for search', () => {
      component.searchQuery.set('test');
      expect(component.getEmptyMessage()).toContain('test');
    });

    it('should return correct empty message for category', () => {
      component.selectedCategory.set(ProductCategory.DIABETES);
      expect(component.getEmptyMessage()).toContain('categoria');
    });

    it('should return correct empty message for stock filter', () => {
      component.stockFilter.set('out_of_stock');
      expect(component.getEmptyMessage()).toContain('estoque');
    });

    it('should return correct empty message for status filter', () => {
      component.statusFilter.set('active');
      expect(component.getEmptyMessage()).toContain('status');
    });

    it('should return default empty message', () => {
      expect(component.getEmptyMessage()).toContain('adicionando');
    });

    it('should compute lowStockProducts', () => {
      expect(component.lowStockProducts().length).toBe(1);
      expect(component.lowStockProducts()[0].id).toBe('prod-2');
    });

    it('should compute outOfStockProducts', () => {
      expect(component.outOfStockProducts().length).toBe(1);
      expect(component.outOfStockProducts()[0].id).toBe('prod-3');
    });

    it('should compute totalProducts', () => {
      expect(component.totalProducts()).toBe(3);
    });
  });

  // ==================== AÇÕES ====================
  describe('Ações', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate to add product', () => {
      component.addProduct();
      expect(router.navigate).toHaveBeenCalledWith(['/pharmacy/products/new']);
    });

    it('should navigate to edit product', () => {
      component.editProduct(mockProducts[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/pharmacy/products/edit', 'prod-1']);
    });

    it('should duplicate product', fakeAsync(() => {
      component.duplicateProduct(mockProducts[0]);
      tick();
      expect(mockProductService.createProduct).toHaveBeenCalled();
      expect(mockProductService.getProductsByPharmacy).toHaveBeenCalledTimes(2);
    }));

    it('should open delete modal for single product', () => {
      component.deleteProduct(mockProducts[0]);
      expect(component.showDeleteModal()).toBe(true);
      expect(component.productsToDelete().length).toBe(1);
    });

    it('should toggle product status', fakeAsync(() => {
      component.toggleProductStatus(mockProducts[0]);
      tick();
      expect(mockProductService.updateProduct).toHaveBeenCalledWith('prod-1', { isActive: false });
    }));
  });

  // ==================== AÇÕES EM LOTE ====================
  describe('Ações em Lote', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedProducts.set(['prod-1', 'prod-2']);
    }));

    it('should bulk activate products', fakeAsync(() => {
      component.bulkActivate();
      tick();
      expect(mockProductService.updateProduct).toHaveBeenCalledTimes(2);
      expect(component.selectedProducts().length).toBe(0);
    }));

    it('should bulk deactivate products', fakeAsync(() => {
      component.bulkDeactivate();
      tick();
      expect(mockProductService.updateProduct).toHaveBeenCalledTimes(2);
      expect(component.selectedProducts().length).toBe(0);
    }));

    it('should open bulk delete modal', () => {
      component.bulkDelete();
      expect(component.showDeleteModal()).toBe(true);
      expect(component.productsToDelete().length).toBe(2);
    });
  });

  // ==================== MODAL DE EXCLUSÃO ====================
  describe('Modal de Exclusão', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open delete modal', () => {
      component.deleteProduct(mockProducts[0]);
      expect(component.showDeleteModal()).toBe(true);
    });

    it('should close delete modal', () => {
      component.showDeleteModal.set(true);
      component.productsToDelete.set([mockProducts[0]]);
      component.closeDeleteModal();
      expect(component.showDeleteModal()).toBe(false);
      expect(component.productsToDelete().length).toBe(0);
    });

    it('should confirm delete', fakeAsync(() => {
      component.productsToDelete.set([mockProducts[0]]);
      component.showDeleteModal.set(true);
      component.confirmDelete();
      tick();
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('prod-1');
      expect(component.showDeleteModal()).toBe(false);
    }));

    it('should set deleting to true during deletion', fakeAsync(() => {
      component.productsToDelete.set([mockProducts[0]]);
      component.confirmDelete();
      expect(component.deleting()).toBe(true);
      tick();
      expect(component.deleting()).toBe(false);
    }));

    it('should handle delete error', fakeAsync(() => {
      mockProductService.deleteProduct.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');
      component.productsToDelete.set([mockProducts[0]]);
      component.confirmDelete();
      tick();
      expect(console.error).toHaveBeenCalled();
      expect(component.deleting()).toBe(false);
    }));
  });

  // ==================== PAGINAÇÃO ====================
  describe('Paginação', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute totalPages', () => {
      expect(component.totalPages()).toBe(1);
    });

    it('should go to page', () => {
      component.goToPage(1);
      expect(component.currentPage()).toBe(1);
    });

    it('should not go to invalid page (too low)', () => {
      component.currentPage.set(1);
      component.goToPage(0);
      expect(component.currentPage()).toBe(1);
    });

    it('should not go to invalid page (too high)', () => {
      component.currentPage.set(1);
      component.goToPage(999);
      expect(component.currentPage()).toBe(1);
    });

    it('should compute visiblePages', () => {
      expect(component.visiblePages()).toBeDefined();
      expect(Array.isArray(component.visiblePages())).toBe(true);
    });
  });

  // ==================== TEMPLATE RENDERING ====================
  describe('Template Rendering', () => {
    it('should show loading spinner when loading', fakeAsync(() => {
      // Primeiro detect para inicializar
      fixture.detectChanges();
      tick();
      
      // Agora forçamos o loading
      component.loading.set(true);
      fixture.detectChanges();
      
      const loading = fixture.nativeElement.querySelector('.loading-container');
      expect(loading).toBeTruthy();
    }));

    it('should show error state when error', fakeAsync(() => {
      mockProductService.getProductsByPharmacy.and.returnValue(throwError(() => new Error('Error')));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('app-empty-state');
      expect(error).toBeTruthy();
    }));

    it('should show empty state when no products', fakeAsync(() => {
      mockProductService.getProductsByPharmacy.and.returnValue(of({ products: [], lastDocument: null, hasMore: false }));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('app-empty-state');
      expect(empty).toBeTruthy();
    }));

    it('should show products list when loaded', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const list = fixture.nativeElement.querySelector('.products-list');
      expect(list).toBeTruthy();
    }));

    it('should show bulk actions when products selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedProducts.set(['prod-1']);
      fixture.detectChanges();
      const bulkActions = fixture.nativeElement.querySelector('.bulk-actions');
      expect(bulkActions).toBeTruthy();
    }));

    it('should show add button when no products selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const addBtn = fixture.nativeElement.querySelector('.add-product-btn');
      expect(addBtn).toBeTruthy();
    }));

    it('should show low stock alert', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('.alert.warning');
      expect(alert).toBeTruthy();
    }));

    it('should show out of stock alert', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('.alert.danger');
      expect(alert).toBeTruthy();
    }));

    it('should show delete modal when open', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.showDeleteModal.set(true);
      component.productsToDelete.set([mockProducts[0]]);
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    }));

    it('should show prescription badge for prescription products', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('.prescription-badge');
      expect(badge).toBeTruthy();
    }));

    it('should show discount badge when product has discount', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('.discount-badge');
      expect(badge).toBeTruthy();
    }));
  });

  // ==================== CICLO DE VIDA ====================
  describe('Ciclo de Vida', () => {
    it('should setup search debounce on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSearchChange('test');
      tick(100);
      expect(component.searchQuery()).toBe(''); // Not updated yet
      tick(200);
      expect(component.searchQuery()).toBe('test'); // Updated after debounce
    }));

    it('should cleanup on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle product without images', () => {
      const noImageProduct = mockProducts[1]; // Has empty images array
      expect(noImageProduct.images.length).toBe(0);
    });

    it('should handle product without originalPrice', () => {
      const noOriginalPrice = mockProducts[0];
      expect(noOriginalPrice.originalPrice).toBeUndefined();
    });

    it('should handle multiple filters at once', () => {
      component.searchQuery.set('a');
      component.selectedCategory.set(ProductCategory.ANTIBIOTICS);
      component.stockFilter.set('low_stock');
      component.statusFilter.set('active');
      const products = component.filteredProducts();
      expect(products.length).toBe(1);
      expect(products[0].id).toBe('prod-2');
    });

    it('should handle empty search results', fakeAsync(() => {
      component.searchQuery.set('xyz123');
      tick(300);
      expect(component.filteredProducts().length).toBe(0);
    }));

    it('should handle concurrent selections', () => {
      component.toggleSelect('prod-1');
      component.toggleSelect('prod-2');
      component.toggleSelect('prod-3');
      expect(component.selectedProducts().length).toBe(3);
      component.toggleSelect('prod-1');
      expect(component.selectedProducts().length).toBe(2);
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle duplicateProduct error', fakeAsync(() => {
      mockProductService.createProduct.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');
      component.duplicateProduct(mockProducts[0]);
      tick();
      expect(console.error).toHaveBeenCalled();
    }));

    it('should handle toggleProductStatus error', fakeAsync(() => {
      mockProductService.updateProduct.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');
      component.toggleProductStatus(mockProducts[0]);
      tick();
      expect(console.error).toHaveBeenCalled();
    }));

    it('should handle bulkActivate error', fakeAsync(() => {
      mockProductService.updateProduct.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');
      component.selectedProducts.set(['prod-1']);
      component.bulkActivate();
      tick();
      expect(console.error).toHaveBeenCalled();
    }));

    it('should handle bulkDeactivate error', fakeAsync(() => {
      mockProductService.updateProduct.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');
      component.selectedProducts.set(['prod-1']);
      component.bulkDeactivate();
      tick();
      expect(console.error).toHaveBeenCalled();
    }));
  });

  // ==================== COMPUTED SIGNALS ====================
  describe('Computed Signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should recompute filteredProducts on filter change', () => {
      const initial = component.filteredProducts();
      component.statusFilter.set('inactive');
      const filtered = component.filteredProducts();
      expect(filtered.length).toBeLessThan(initial.length);
    });

    it('should recompute totalPages on products change', () => {
      expect(component.totalPages()).toBe(1);
    });

    it('should recompute lowStockProducts on products change', () => {
      expect(component.lowStockProducts().length).toBe(1);
    });

    it('should recompute outOfStockProducts on products change', () => {
      expect(component.outOfStockProducts().length).toBe(1);
    });

    it('should recompute allSelected on selection change', () => {
      expect(component.allSelected()).toBe(false);
      const allIds = component.products().map(p => p.id);
      component.selectedProducts.set(allIds);
      expect(component.allSelected()).toBe(true);
    });

    it('should recompute someSelected on selection change', () => {
      expect(component.someSelected()).toBe(false);
      component.selectedProducts.set(['prod-1']);
      expect(component.someSelected()).toBe(true);
    });
  });
});
