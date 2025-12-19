/**
 * 🧪 Cart Icon Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartIconComponent } from './cart-icon.component';

describe('CartIconComponent', () => {
  let component: CartIconComponent;
  let fixture: ComponentFixture<CartIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartIconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CartIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar com itemCount 0', () => {
    expect(component.itemCount).toBe(0);
  });

  it('deve exibir badge quando itemCount > 0', () => {
    component.itemCount = 5;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const badge = compiled.querySelector('.badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('5');
  });

  it('não deve exibir badge quando itemCount = 0', () => {
    component.itemCount = 0;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const badge = compiled.querySelector('.badge');
    expect(badge).toBeFalsy();
  });

  it('deve atualizar badge ao mudar itemCount', () => {
    component.itemCount = 3;
    fixture.detectChanges();
    
    let badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toBe('3');
    
    component.itemCount = 10;
    fixture.detectChanges();
    
    badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toBe('10');
  });
});
