import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProductFiltersComponent } from './product-filters.component';
import { ProductFilters, ProductCategory } from '../../models/product.model';

describe('ProductFiltersComponent', () => {
  let component: ProductFiltersComponent;
  let fixture: ComponentFixture<ProductFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFiltersComponent, ReactiveFormsModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
      expect(component.filtersForm.value).toEqual({
        category: null,
        priceMin: 0,
        priceMax: 500,
        requiresPrescription: null,
        inStock: false,
        rating: null
      });
    });

    it('should have correct number of categories', () => {
      expect(component.categories.length).toBe(8);
    });

    it('should have correct rating options', () => {
      expect(component.ratingOptions.length).toBe(5);
    });
  });

  describe('Filter Updates', () => {
    it('should update form when currentFilters input changes', () => {
      const filters: ProductFilters = {
        category: ProductCategory.ANALGESICS,
        priceMin: 10,
        priceMax: 100,
        requiresPrescription: true,
        inStock: true,
        rating: 4
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filtersForm.value.priceMin).toBe(10);
      expect(component.filtersForm.value.priceMax).toBe(100);
    });

    it('should update price signals when form changes', () => {
      component.filtersForm.patchValue({
        priceMin: 50,
        priceMax: 200
      });

      expect(component.priceMin()).toBe(50);
      expect(component.priceMax()).toBe(200);
    });
  });

  describe('Apply Filters', () => {
    it('should emit filters when applied', () => {
      spyOn(component.filtersApply, 'emit');

      component.filtersForm.patchValue({
        category: ProductCategory.ANALGESICS,
        priceMin: 10,
        priceMax: 100
      });

      component.applyFilters();

      expect(component.filtersApply.emit).toHaveBeenCalled();
    });

    it('should not include default values in applied filters', () => {
      spyOn(component.filtersApply, 'emit');

      component.filtersForm.patchValue({
        category: ProductCategory.ANALGESICS,
        priceMin: 0,
        priceMax: 500
      });

      component.applyFilters();

      const emittedFilters = (component.filtersApply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.priceMin).toBeUndefined();
      expect(emittedFilters.priceMax).toBeUndefined();
    });
  });

  describe('Clear Filters', () => {
    it('should reset form to default values', () => {
      component.filtersForm.patchValue({
        category: ProductCategory.ANALGESICS,
        priceMin: 50
      });

      component.clearFilters();

      expect(component.filtersForm.value.category).toBeNull();
      expect(component.filtersForm.value.priceMin).toBe(0);
    });

    it('should emit empty filters object', () => {
      spyOn(component.filtersApply, 'emit');
      component.clearFilters();
      expect(component.filtersApply.emit).toHaveBeenCalledWith({});
    });
  });

  describe('Close Panel', () => {
    it('should emit filtersClose event', () => {
      spyOn(component.filtersClose, 'emit');
      component.close();
      expect(component.filtersClose.emit).toHaveBeenCalled();
    });
  });

  describe('Price Formatting', () => {
    it('should format price correctly', () => {
      expect(component.formatPrice(10)).toBe('R$ 10');
      expect(component.formatPrice(150)).toBe('R$ 150');
    });
  });

  describe('Filter Application Edge Cases', () => {
    it('should include inStock filter when true', () => {
      spyOn(component.filtersApply, 'emit');
      
      component.filtersForm.patchValue({
        category: null,
        priceMin: 0,
        priceMax: 500,
        requiresPrescription: null,
        inStock: true,
        rating: null
      });

      component.applyFilters();

      const emittedFilters = (component.filtersApply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.inStock).toBe(true);
    });

    it('should NOT include inStock when false', () => {
      spyOn(component.filtersApply, 'emit');
      
      component.filtersForm.patchValue({
        category: null,
        priceMin: 0,
        priceMax: 500,
        requiresPrescription: null,
        inStock: false,
        rating: null
      });

      component.applyFilters();

      const emittedFilters = (component.filtersApply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.inStock).toBeUndefined();
    });

    it('should include requiresPrescription when NOT null', () => {
      spyOn(component.filtersApply, 'emit');
      
      component.filtersForm.patchValue({
        category: null,
        priceMin: 0,
        priceMax: 500,
        requiresPrescription: false,
        inStock: false,
        rating: null
      });

      component.applyFilters();

      const emittedFilters = (component.filtersApply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.requiresPrescription).toBe(false);
    });

    it('should include rating when set', () => {
      spyOn(component.filtersApply, 'emit');
      
      component.filtersForm.patchValue({
        category: null,
        priceMin: 0,
        priceMax: 500,
        requiresPrescription: null,
        inStock: false,
        rating: 4
      });

      component.applyFilters();

      const emittedFilters = (component.filtersApply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.rating).toBe(4);
    });

    it('should include priceMin when greater than 0', () => {
      spyOn(component.filtersApply, 'emit');
      
      component.filtersForm.patchValue({
        category: null,
        priceMin: 25,
        priceMax: 500,
        requiresPrescription: null,
        inStock: false,
        rating: null
      });

      component.applyFilters();

      const emittedFilters = (component.filtersApply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.priceMin).toBe(25);
    });

    it('should include priceMax when less than 500', () => {
      spyOn(component.filtersApply, 'emit');
      
      component.filtersForm.patchValue({
        category: null,
        priceMin: 0,
        priceMax: 200,
        requiresPrescription: null,
        inStock: false,
        rating: null
      });

      component.applyFilters();

      const emittedFilters = (component.filtersApply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.priceMax).toBe(200);
    });
  });

  describe('Current Filters Input', () => {
    it('should handle null currentFilters input gracefully', () => {
      // Pass null - should not error
      component.currentFilters = null as any;
      expect(component.filtersForm).toBeTruthy();
    });

    it('should handle undefined values in filters', () => {
      const filters: ProductFilters = {
        // All undefined/default
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filtersForm.value.category).toBeNull();
      expect(component.filtersForm.value.priceMin).toBe(0);
      expect(component.filtersForm.value.priceMax).toBe(500);
      expect(component.filtersForm.value.requiresPrescription).toBeNull();
      expect(component.filtersForm.value.inStock).toBe(false);
      expect(component.filtersForm.value.rating).toBeNull();
    });
  });
});
