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

  describe('✅ Criação e Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com overlay false', () => {
      expect(component.overlay).toBe(false);
    });

    it('deve inicializar com message vazia', () => {
      expect(component.message).toBe('');
    });

    it('deve ter overlay como Input', () => {
      expect(component.overlay).toBeDefined();
    });

    it('deve ter message como Input', () => {
      expect(component.message).toBeDefined();
    });
  });

  describe('✅ Spinner', () => {
    it('deve exibir spinner', () => {
      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('.spinner');
      expect(spinner).toBeTruthy();
    });

    it('spinner deve estar sempre visível', () => {
      component.overlay = false;
      component.message = '';
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
    });

    it('spinner deve existir com overlay', () => {
      component.overlay = true;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
    });

    it('spinner deve existir com mensagem', () => {
      component.message = 'Carregando...';
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
    });
  });

  describe('✅ Overlay', () => {
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

    it('deve alternar overlay dinamicamente', () => {
      const container = fixture.nativeElement.querySelector('.loading-spinner');
      
      // Inicia sem overlay
      expect(container.classList.contains('overlay')).toBe(false);
      
      // Ativa overlay
      component.overlay = true;
      fixture.detectChanges();
      expect(container.classList.contains('overlay')).toBe(true);
      
      // Desativa overlay
      component.overlay = false;
      fixture.detectChanges();
      expect(container.classList.contains('overlay')).toBe(false);
    });

    it('overlay não deve afetar spinner', () => {
      component.overlay = true;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
    });

    it('overlay não deve afetar mensagem', () => {
      component.overlay = true;
      component.message = 'Teste';
      fixture.detectChanges();
      
      const message = fixture.nativeElement.querySelector('.message');
      expect(message).toBeTruthy();
      expect(message.textContent).toBe('Teste');
    });
  });

  describe('✅ Mensagem', () => {
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

    it('deve atualizar mensagem dinamicamente', () => {
      component.message = 'Primeira mensagem';
      fixture.detectChanges();
      
      let message = fixture.nativeElement.querySelector('.message');
      expect(message.textContent).toBe('Primeira mensagem');
      
      component.message = 'Segunda mensagem';
      fixture.detectChanges();
      
      message = fixture.nativeElement.querySelector('.message');
      expect(message.textContent).toBe('Segunda mensagem');
    });

    it('deve exibir mensagens longas', () => {
      component.message = 'Esta é uma mensagem muito longa que pode ser usada para testar o comportamento do componente';
      fixture.detectChanges();
      
      const message = fixture.nativeElement.querySelector('.message');
      expect(message).toBeTruthy();
      expect(message.textContent).toContain('muito longa');
    });

    it('deve exibir mensagens com caracteres especiais', () => {
      component.message = 'Carregando... ⏳ 50%';
      fixture.detectChanges();
      
      const message = fixture.nativeElement.querySelector('.message');
      expect(message.textContent).toBe('Carregando... ⏳ 50%');
    });

    it('deve remover mensagem quando setada para vazia', () => {
      component.message = 'Mensagem';
      fixture.detectChanges();
      
      let message = fixture.nativeElement.querySelector('.message');
      expect(message).toBeTruthy();
      
      component.message = '';
      fixture.detectChanges();
      
      message = fixture.nativeElement.querySelector('.message');
      expect(message).toBeFalsy();
    });
  });

  describe('✅ Estrutura do Template', () => {
    it('deve ter elemento loading-spinner', () => {
      const loadingSpinner = fixture.nativeElement.querySelector('.loading-spinner');
      expect(loadingSpinner).toBeTruthy();
    });

    it('deve ter estrutura correta sem overlay e sem mensagem', () => {
      component.overlay = false;
      component.message = '';
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.loading-spinner');
      const spinner = container.querySelector('.spinner');
      const message = container.querySelector('.message');
      
      expect(container).toBeTruthy();
      expect(container.classList.contains('overlay')).toBe(false);
      expect(spinner).toBeTruthy();
      expect(message).toBeFalsy();
    });

    it('deve ter estrutura correta com overlay e mensagem', () => {
      component.overlay = true;
      component.message = 'Teste';
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.loading-spinner');
      const spinner = container.querySelector('.spinner');
      const message = container.querySelector('.message');
      
      expect(container).toBeTruthy();
      expect(container.classList.contains('overlay')).toBe(true);
      expect(spinner).toBeTruthy();
      expect(message).toBeTruthy();
    });
  });

  describe('✅ Combinações de Inputs', () => {
    it('deve funcionar com overlay=true e message vazia', () => {
      component.overlay = true;
      component.message = '';
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.loading-spinner');
      expect(container.classList.contains('overlay')).toBe(true);
      expect(fixture.nativeElement.querySelector('.message')).toBeFalsy();
    });

    it('deve funcionar com overlay=false e message preenchida', () => {
      component.overlay = false;
      component.message = 'Carregando...';
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.loading-spinner');
      expect(container.classList.contains('overlay')).toBe(false);
      expect(fixture.nativeElement.querySelector('.message')).toBeTruthy();
    });

    it('deve funcionar com overlay=true e message preenchida', () => {
      component.overlay = true;
      component.message = 'Aguarde...';
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.loading-spinner');
      expect(container.classList.contains('overlay')).toBe(true);
      expect(fixture.nativeElement.querySelector('.message').textContent).toBe('Aguarde...');
    });

    it('deve funcionar com overlay=false e message vazia', () => {
      component.overlay = false;
      component.message = '';
      fixture.detectChanges();
      
      const container = fixture.nativeElement.querySelector('.loading-spinner');
      expect(container.classList.contains('overlay')).toBe(false);
      expect(fixture.nativeElement.querySelector('.message')).toBeFalsy();
    });
  });

  describe('✅ Reatividade', () => {
    it('deve reagir a múltiplas atualizações', () => {
      const states = [
        { overlay: false, message: '' },
        { overlay: true, message: 'Carregando...' },
        { overlay: false, message: 'Finalizando...' },
        { overlay: true, message: '' },
        { overlay: false, message: '' }
      ];
      
      states.forEach(state => {
        component.overlay = state.overlay;
        component.message = state.message;
        fixture.detectChanges();
        
        const container = fixture.nativeElement.querySelector('.loading-spinner');
        expect(container.classList.contains('overlay')).toBe(state.overlay);
        
        const messageEl = fixture.nativeElement.querySelector('.message');
        if (state.message) {
          expect(messageEl).toBeTruthy();
          expect(messageEl.textContent).toBe(state.message);
        } else {
          expect(messageEl).toBeFalsy();
        }
      });
    });
  });
});
