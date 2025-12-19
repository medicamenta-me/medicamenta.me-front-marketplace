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

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter 5 estrelas', () => {
    expect(component.stars).toEqual([1, 2, 3, 4, 5]);
  });

  it('deve calcular estrelas preenchidas corretamente', () => {
    component.rating = 4.7;
    expect(component.filledStars).toBe(4);
    
    component.rating = 3.2;
    expect(component.filledStars).toBe(3);
  });

  it('deve exibir contagem quando showCount = true', () => {
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

  it('deve aplicar classe filled nas estrelas corretas', () => {
    component.rating = 3;
    fixture.detectChanges();
    
    const stars = fixture.nativeElement.querySelectorAll('.star');
    expect(stars[0].classList.contains('filled')).toBe(true);
    expect(stars[2].classList.contains('filled')).toBe(true);
    expect(stars[3].classList.contains('filled')).toBe(false);
  });
});
