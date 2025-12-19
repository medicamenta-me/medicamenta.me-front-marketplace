/**
 * 🧪 Loading Spinner Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir spinner', () => {
    const compiled = fixture.nativeElement;
    const spinner = compiled.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });

  it('deve aplicar classe overlay quando overlay = true', () => {
    component.overlay = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const container = compiled.querySelector('.loading-spinner');
    expect(container.classList.contains('overlay')).toBe(true);
  });

  it('não deve aplicar classe overlay quando overlay = false', () => {
    component.overlay = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const container = compiled.querySelector('.loading-spinner');
    expect(container.classList.contains('overlay')).toBe(false);
  });

  it('deve exibir mensagem quando fornecida', () => {
    component.message = 'Carregando...';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const message = compiled.querySelector('.message');
    expect(message).toBeTruthy();
    expect(message.textContent).toBe('Carregando...');
  });

  it('não deve exibir mensagem quando vazia', () => {
    component.message = '';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const message = compiled.querySelector('.message');
    expect(message).toBeFalsy();
  });
});
