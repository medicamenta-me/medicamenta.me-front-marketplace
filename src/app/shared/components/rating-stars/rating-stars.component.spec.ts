/**
 * 🧪 Rating Stars Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingStarsComponent } from './rating-stars.component';

describe('RatingStarsComponent', () => {
  let component: RatingStarsComponent;
  let fixture: ComponentFixture<RatingStarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingStarsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RatingStarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('✅ Criação e Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com rating 0', () => {
      expect(component.rating).toBe(0);
    });

    it('deve inicializar com count 0', () => {
      expect(component.count).toBe(0);
    });

    it('deve inicializar com showCount true', () => {
      expect(component.showCount).toBe(true);
    });
  });

  describe('✅ Estrelas', () => {
    it('deve ter 5 estrelas', () => {
      expect(component.stars).toEqual([1, 2, 3, 4, 5]);
    });

    it('deve sempre retornar array com 5 elementos', () => {
      expect(component.stars.length).toBe(5);
    });

    it('deve renderizar 5 elementos de estrela', () => {
      const stars = fixture.nativeElement.querySelectorAll('.star');
      expect(stars.length).toBe(5);
    });
  });

  describe('✅ Cálculo de Estrelas Preenchidas', () => {
    it('deve calcular estrelas preenchidas corretamente para 4.7', () => {
      component.rating = 4.7;
      expect(component.filledStars).toBe(4);
    });

    it('deve calcular estrelas preenchidas corretamente para 3.2', () => {
      component.rating = 3.2;
      expect(component.filledStars).toBe(3);
    });

    it('deve retornar 0 para rating 0', () => {
      component.rating = 0;
      expect(component.filledStars).toBe(0);
    });

    it('deve retornar 5 para rating 5', () => {
      component.rating = 5;
      expect(component.filledStars).toBe(5);
    });

    it('deve retornar 1 para rating 1.1', () => {
      component.rating = 1.1;
      expect(component.filledStars).toBe(1);
    });

    it('deve retornar 2 para rating 2.9', () => {
      component.rating = 2.9;
      expect(component.filledStars).toBe(2);
    });

    it('deve retornar 0 para rating 0.9', () => {
      component.rating = 0.9;
      expect(component.filledStars).toBe(0);
    });

    it('deve retornar 4 para rating 4.99', () => {
      component.rating = 4.99;
      expect(component.filledStars).toBe(4);
    });

    it('deve lidar com rating negativo', () => {
      component.rating = -1;
      expect(component.filledStars).toBe(-1);
    });

    it('deve lidar com rating acima de 5', () => {
      component.rating = 6;
      expect(component.filledStars).toBe(6);
    });
  });

  describe('✅ Exibição de Contagem', () => {
    it('deve exibir contagem quando showCount = true e count > 0', () => {
      component.count = 25;
      component.showCount = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const countElement = compiled.querySelector('.count');
      expect(countElement).toBeTruthy();
      expect(countElement.textContent).toContain('25');
    });

    it('não deve exibir contagem quando showCount = false', () => {
      component.count = 25;
      component.showCount = false;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const countElement = compiled.querySelector('.count');
      expect(countElement).toBeFalsy();
    });

    it('não deve exibir contagem quando count = 0', () => {
      component.count = 0;
      component.showCount = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const countElement = compiled.querySelector('.count');
      expect(countElement).toBeFalsy();
    });

    it('deve exibir contagem formatada corretamente', () => {
      component.count = 100;
      component.showCount = true;
      fixture.detectChanges();
      
      const countElement = fixture.nativeElement.querySelector('.count');
      expect(countElement.textContent).toBe('(100)');
    });

    it('deve exibir contagem com 1 avaliação', () => {
      component.count = 1;
      component.showCount = true;
      fixture.detectChanges();
      
      const countElement = fixture.nativeElement.querySelector('.count');
      expect(countElement.textContent).toBe('(1)');
    });

    it('deve exibir contagem com valores grandes', () => {
      component.count = 9999;
      component.showCount = true;
      fixture.detectChanges();
      
      const countElement = fixture.nativeElement.querySelector('.count');
      expect(countElement.textContent).toBe('(9999)');
    });
  });

  describe('✅ Classe Filled nas Estrelas', () => {
    it('deve aplicar classe filled nas estrelas corretas para rating 3', () => {
      component.rating = 3;
      fixture.detectChanges();
      
      const stars = fixture.nativeElement.querySelectorAll('.star');
      expect(stars[0].classList.contains('filled')).toBe(true);
      expect(stars[1].classList.contains('filled')).toBe(true);
      expect(stars[2].classList.contains('filled')).toBe(true);
      expect(stars[3].classList.contains('filled')).toBe(false);
      expect(stars[4].classList.contains('filled')).toBe(false);
    });

    it('deve aplicar filled em todas as estrelas para rating 5', () => {
      component.rating = 5;
      fixture.detectChanges();
      
      const stars = fixture.nativeElement.querySelectorAll('.star');
      stars.forEach((star: HTMLElement) => {
        expect(star.classList.contains('filled')).toBe(true);
      });
    });

    it('não deve aplicar filled em nenhuma estrela para rating 0', () => {
      component.rating = 0;
      fixture.detectChanges();
      
      const stars = fixture.nativeElement.querySelectorAll('.star');
      stars.forEach((star: HTMLElement) => {
        expect(star.classList.contains('filled')).toBe(false);
      });
    });

    it('deve aplicar filled apenas na primeira estrela para rating 1', () => {
      component.rating = 1;
      fixture.detectChanges();
      
      const stars = fixture.nativeElement.querySelectorAll('.star');
      expect(stars[0].classList.contains('filled')).toBe(true);
      expect(stars[1].classList.contains('filled')).toBe(false);
    });

    it('deve atualizar estrelas quando rating muda', () => {
      component.rating = 2;
      fixture.detectChanges();
      
      let stars = fixture.nativeElement.querySelectorAll('.star');
      expect(stars[1].classList.contains('filled')).toBe(true);
      expect(stars[2].classList.contains('filled')).toBe(false);
      
      component.rating = 4;
      fixture.detectChanges();
      
      stars = fixture.nativeElement.querySelectorAll('.star');
      expect(stars[3].classList.contains('filled')).toBe(true);
      expect(stars[4].classList.contains('filled')).toBe(false);
    });
  });

  describe('✅ Estrutura do Template', () => {
    it('deve ter elemento rating-stars', () => {
      const ratingStars = fixture.nativeElement.querySelector('.rating-stars');
      expect(ratingStars).toBeTruthy();
    });

    it('estrelas devem exibir emoji ⭐', () => {
      const star = fixture.nativeElement.querySelector('.star');
      expect(star.textContent).toBe('⭐');
    });
  });

  describe('✅ Combinações de Inputs', () => {
    it('deve funcionar com rating alto e count alto', () => {
      component.rating = 4.8;
      component.count = 500;
      component.showCount = true;
      fixture.detectChanges();
      
      expect(component.filledStars).toBe(4);
      const countElement = fixture.nativeElement.querySelector('.count');
      expect(countElement.textContent).toBe('(500)');
    });

    it('deve funcionar com rating baixo e showCount false', () => {
      component.rating = 1.5;
      component.count = 10;
      component.showCount = false;
      fixture.detectChanges();
      
      expect(component.filledStars).toBe(1);
      expect(fixture.nativeElement.querySelector('.count')).toBeFalsy();
    });

    it('deve funcionar com rating 0 e count 0', () => {
      component.rating = 0;
      component.count = 0;
      component.showCount = true;
      fixture.detectChanges();
      
      expect(component.filledStars).toBe(0);
      expect(fixture.nativeElement.querySelector('.count')).toBeFalsy();
    });
  });

  describe('✅ Reatividade', () => {
    it('deve reagir a múltiplas atualizações de rating', () => {
      const ratings = [0, 1, 2.5, 3.7, 4.2, 5, 0];
      
      ratings.forEach(rating => {
        component.rating = rating;
        fixture.detectChanges();
        expect(component.filledStars).toBe(Math.floor(rating));
      });
    });

    it('deve reagir a múltiplas atualizações de count', () => {
      const counts = [0, 1, 10, 100, 0];
      
      counts.forEach(count => {
        component.count = count;
        component.showCount = true;
        fixture.detectChanges();
        
        const countElement = fixture.nativeElement.querySelector('.count');
        if (count > 0) {
          expect(countElement).toBeTruthy();
          expect(countElement.textContent).toBe(`(${count})`);
        } else {
          expect(countElement).toBeFalsy();
        }
      });
    });
  });
});
