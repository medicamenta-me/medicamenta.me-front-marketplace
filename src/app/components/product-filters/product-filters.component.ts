import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ProductFilters } from '../../models/product.model';

interface CategoryOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSliderModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonToggleModule
  ],
  templateUrl: './product-filters.component.html',
  styleUrls: ['./product-filters.component.scss']
})
export class ProductFiltersComponent {
  @Input() set currentFilters(filters: ProductFilters) {
    if (filters) {
      this.updateFormFromFilters(filters);
    }
  }
  
  @Output() filtersApply = new EventEmitter<ProductFilters>();
  @Output() filtersClose = new EventEmitter<void>();

  filtersForm: FormGroup;
  priceMin = signal<number>(0);
  priceMax = signal<number>(500);

  categories: CategoryOption[] = [
    { value: 'analgesicos', label: 'Analgésicos' },
    { value: 'antibioticos', label: 'Antibióticos' },
    { value: 'anti-inflamatorios', label: 'Anti-inflamatórios' },
    { value: 'antialergicos', label: 'Antialérgicos' },
    { value: 'vitaminas', label: 'Vitaminas e Suplementos' },
    { value: 'dermocosmeticos', label: 'Dermocosméticos' },
    { value: 'higiene', label: 'Higiene Pessoal' },
    { value: 'equipamentos', label: 'Equipamentos' }
  ];

  ratingOptions = [
    { value: 5, label: '5 estrelas' },
    { value: 4, label: '4+ estrelas' },
    { value: 3, label: '3+ estrelas' },
    { value: 2, label: '2+ estrelas' },
    { value: 1, label: '1+ estrela' }
  ];

  private fb = inject(FormBuilder);

  constructor() {
    this.filtersForm = this.fb.group({
      category: [null],
      priceMin: [0],
      priceMax: [500],
      requiresPrescription: [null],
      inStock: [false],
      rating: [null]
    });

    // Observa mudanças nos sliders de preço
    this.filtersForm.get('priceMin')?.valueChanges.subscribe(value => {
      this.priceMin.set(value);
    });

    this.filtersForm.get('priceMax')?.valueChanges.subscribe(value => {
      this.priceMax.set(value);
    });
  }

  /**
   * Atualiza formulário com filtros atuais
   */
  private updateFormFromFilters(filters: ProductFilters): void {
    this.filtersForm.patchValue({
      category: filters.category || null,
      priceMin: filters.priceMin || 0,
      priceMax: filters.priceMax || 500,
      requiresPrescription: filters.requiresPrescription ?? null,
      inStock: filters.inStock || false,
      rating: filters.rating || null
    }, { emitEvent: false });
  }

  /**
   * Formata preço para exibição
   */
  formatPrice(value: number): string {
    return `R$ ${value.toFixed(0)}`;
  }

  /**
   * Aplica filtros
   */
  applyFilters(): void {
    const formValue = this.filtersForm.value;
    const filters: ProductFilters = {};

    if (formValue.category) {
      filters.category = formValue.category;
    }

    if (formValue.priceMin > 0) {
      filters.priceMin = formValue.priceMin;
    }

    if (formValue.priceMax < 500) {
      filters.priceMax = formValue.priceMax;
    }

    if (formValue.requiresPrescription !== null) {
      filters.requiresPrescription = formValue.requiresPrescription;
    }

    if (formValue.inStock) {
      filters.inStock = true;
    }

    if (formValue.rating) {
      filters.rating = formValue.rating;
    }

    this.filtersApply.emit(filters);
  }

  /**
   * Limpa todos os filtros
   */
  clearFilters(): void {
    this.filtersForm.reset({
      category: null,
      priceMin: 0,
      priceMax: 500,
      requiresPrescription: null,
      inStock: false,
      rating: null
    });
    this.filtersApply.emit({});
  }

  /**
   * Fecha painel de filtros
   */
  close(): void {
    this.filtersClose.emit();
  }
}
