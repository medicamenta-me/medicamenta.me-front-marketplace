/**
 * 🧪 Empty State Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir ícone padrão', () => {
    const compiled = fixture.nativeElement;
    const icon = compiled.querySelector('.icon');
    expect(icon.textContent).toBe('📭');
  });

  it('deve exibir título padrão', () => {
    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('.title');
    expect(title.textContent).toBe('Nenhum resultado encontrado');
  });

  it('deve exibir mensagem padrão', () => {
    const compiled = fixture.nativeElement;
    const message = compiled.querySelector('.message');
    expect(message.textContent).toBe('Tente ajustar sua busca ou filtros.');
  });

  it('deve exibir botão quando actionLabel é fornecido', () => {
    component.actionLabel = 'Tentar novamente';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const button = compiled.querySelector('.btn-action');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Tentar novamente');
  });

  it('não deve exibir botão quando actionLabel está vazio', () => {
    component.actionLabel = '';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const button = compiled.querySelector('.btn-action');
    expect(button).toBeFalsy();
  });

  it('deve emitir evento ao clicar no botão', () => {
    component.actionLabel = 'Ação';
    fixture.detectChanges();
    
    spyOn(component.action, 'emit');
    
    const button = fixture.nativeElement.querySelector('.btn-action');
    button.click();
    
    expect(component.action.emit).toHaveBeenCalled();
  });

  it('deve aceitar customização de ícone', () => {
    component.icon = '🔍';
    fixture.detectChanges();
    
    const icon = fixture.nativeElement.querySelector('.icon');
    expect(icon.textContent).toBe('🔍');
  });

  it('deve aceitar customização de título', () => {
    component.title = 'Sem produtos';
    fixture.detectChanges();
    
    const title = fixture.nativeElement.querySelector('.title');
    expect(title.textContent).toBe('Sem produtos');
  });
});
