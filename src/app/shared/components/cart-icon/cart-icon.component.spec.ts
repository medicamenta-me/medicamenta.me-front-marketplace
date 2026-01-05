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

  describe('✅ Criação e Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com itemCount 0', () => {
      expect(component.itemCount).toBe(0);
    });

    it('deve ter itemCount como Input', () => {
      expect(component.itemCount).toBeDefined();
    });
  });

  describe('✅ Badge de Quantidade', () => {
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

    it('deve exibir badge com 1 item', () => {
      component.itemCount = 1;
      fixture.detectChanges();
      
      const badge = fixture.nativeElement.querySelector('.badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toBe('1');
    });

    it('deve exibir badge com valores grandes', () => {
      component.itemCount = 99;
      fixture.detectChanges();
      
      const badge = fixture.nativeElement.querySelector('.badge');
      expect(badge.textContent).toBe('99');
    });

    it('deve exibir badge com valores muito grandes', () => {
      component.itemCount = 999;
      fixture.detectChanges();
      
      const badge = fixture.nativeElement.querySelector('.badge');
      expect(badge.textContent).toBe('999');
    });

    it('não deve exibir badge com valor negativo (tratado como falsy check)', () => {
      component.itemCount = -1;
      fixture.detectChanges();
      
      // O componente verifica itemCount > 0, então -1 não exibe badge
      const badge = fixture.nativeElement.querySelector('.badge');
      expect(badge).toBeFalsy();
    });
  });

  describe('✅ Estrutura do Template', () => {
    it('deve ter elemento cart-icon', () => {
      const cartIcon = fixture.nativeElement.querySelector('.cart-icon');
      expect(cartIcon).toBeTruthy();
    });

    it('deve ter elemento icon', () => {
      const icon = fixture.nativeElement.querySelector('.icon');
      expect(icon).toBeTruthy();
    });

    it('deve exibir emoji do carrinho', () => {
      const icon = fixture.nativeElement.querySelector('.icon');
      expect(icon.textContent).toBe('🛒');
    });

    it('deve ter estrutura correta sem itens', () => {
      component.itemCount = 0;
      fixture.detectChanges();
      
      const cartIcon = fixture.nativeElement.querySelector('.cart-icon');
      const icon = cartIcon.querySelector('.icon');
      const badge = cartIcon.querySelector('.badge');
      
      expect(cartIcon).toBeTruthy();
      expect(icon).toBeTruthy();
      expect(badge).toBeFalsy();
    });

    it('deve ter estrutura correta com itens', () => {
      component.itemCount = 5;
      fixture.detectChanges();
      
      const cartIcon = fixture.nativeElement.querySelector('.cart-icon');
      const icon = cartIcon.querySelector('.icon');
      const badge = cartIcon.querySelector('.badge');
      
      expect(cartIcon).toBeTruthy();
      expect(icon).toBeTruthy();
      expect(badge).toBeTruthy();
    });
  });

  describe('✅ Reatividade', () => {
    it('deve reagir a múltiplas atualizações de itemCount', () => {
      const values = [0, 1, 5, 10, 0, 3, 0];
      
      values.forEach(value => {
        component.itemCount = value;
        fixture.detectChanges();
        
        const badge = fixture.nativeElement.querySelector('.badge');
        if (value > 0) {
          expect(badge).toBeTruthy();
          expect(badge.textContent).toBe(value.toString());
        } else {
          expect(badge).toBeFalsy();
        }
      });
    });

    it('deve atualizar de 0 para valor e voltar para 0', () => {
      expect(component.itemCount).toBe(0);
      
      component.itemCount = 5;
      fixture.detectChanges();
      let badge = fixture.nativeElement.querySelector('.badge');
      expect(badge).toBeTruthy();
      
      component.itemCount = 0;
      fixture.detectChanges();
      badge = fixture.nativeElement.querySelector('.badge');
      expect(badge).toBeFalsy();
    });
  });

  describe('✅ Valores Limite', () => {
    it('deve lidar com 0 corretamente', () => {
      component.itemCount = 0;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.badge')).toBeFalsy();
    });

    it('deve lidar com valores pequenos (1)', () => {
      component.itemCount = 1;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.badge').textContent).toBe('1');
    });

    it('deve lidar com valores médios (50)', () => {
      component.itemCount = 50;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.badge').textContent).toBe('50');
    });

    it('deve lidar com valores grandes (100)', () => {
      component.itemCount = 100;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.badge').textContent).toBe('100');
    });

    it('deve lidar com valores muito grandes (1000)', () => {
      component.itemCount = 1000;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.badge').textContent).toBe('1000');
    });
  });
});
