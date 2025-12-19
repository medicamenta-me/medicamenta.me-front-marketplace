/**
 * 🧪 Product Card Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';
import { Product } from '../../../models/product.model';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Paracetamol 500mg',
    description: 'Analgésico e antitérmico',
    activeIngredient: 'Paracetamol',
    dosage: '500mg',
    manufacturer: 'Lab A',
    category: 'ANALGESICS',
    images: ['https://example.com/image.jpg'],
    price: 12.5,
    stock: 10,
    requiresPrescription: false,
    pharmacyId: 'pharmacy-1',
    rating: 4.5,
    reviewCount: 25,
    soldCount: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir nome do produto', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.product-name').textContent).toContain('Paracetamol 500mg');
  });

  it('deve verificar se produto está em estoque', () => {
    expect(component.isInStock).toBe(true);
    
    component.product = { ...mockProduct, stock: 0 };
    expect(component.isInStock).toBe(false);
  });

  it('deve verificar se produto tem estoque baixo', () => {
    component.product = { ...mockProduct, stock: 5 };
    expect(component.isLowStock).toBe(true);
    
    component.product = { ...mockProduct, stock: 10 };
    expect(component.isLowStock).toBe(false);
  });

  it('deve emitir evento ao adicionar ao carrinho', () => {
    spyOn(component.addToCart, 'emit');
    const event = new Event('click');
    
    component.onAddToCart(event);
    
    expect(component.addToCart.emit).toHaveBeenCalledWith(mockProduct);
  });

  it('deve formatar preço corretamente', () => {
    expect(component.formattedPrice).toContain('12,50');
  });

  it('deve retornar primeira imagem', () => {
    expect(component.mainImage).toBe('https://example.com/image.jpg');
  });

  it('deve retornar placeholder se não houver imagem', () => {
    component.product = { ...mockProduct, images: [] };
    expect(component.mainImage).toBe('assets/placeholder.png');
  });

  it('deve criar array de estrelas', () => {
    expect(component.ratingStars).toEqual([1, 2, 3, 4, 5]);
  });

  it('deve verificar estrelas preenchidas', () => {
    component.product = { ...mockProduct, rating: 4 };
    expect(component.isStarFilled(1)).toBe(true);
    expect(component.isStarFilled(4)).toBe(true);
    expect(component.isStarFilled(5)).toBe(false);
  });

  it('deve parar propagação do evento ao clicar no botão', () => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    spyOn(event, 'preventDefault');
    
    component.onAddToCart(event);
    
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
