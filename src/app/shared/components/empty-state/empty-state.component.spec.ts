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

  describe('✅ Criação e Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter icon como Input com valor padrão', () => {
      expect(component.icon).toBe('📭');
    });

    it('deve ter title como Input com valor padrão', () => {
      expect(component.title).toBe('Nenhum resultado encontrado');
    });

    it('deve ter message como Input com valor padrão', () => {
      expect(component.message).toBe('Tente ajustar sua busca ou filtros.');
    });

    it('deve ter actionLabel como Input vazio', () => {
      expect(component.actionLabel).toBe('');
    });

    it('deve ter action como EventEmitter', () => {
      expect(component.action).toBeTruthy();
    });
  });

  describe('✅ Ícone', () => {
    it('deve exibir ícone padrão', () => {
      const compiled = fixture.nativeElement;
      const icon = compiled.querySelector('.icon');
      expect(icon.textContent).toBe('📭');
    });

    it('deve aceitar customização de ícone', () => {
      component.icon = '🔍';
      fixture.detectChanges();
      
      const icon = fixture.nativeElement.querySelector('.icon');
      expect(icon.textContent).toBe('🔍');
    });

    it('deve aceitar emoji de carrinho vazio', () => {
      component.icon = '🛒';
      fixture.detectChanges();
      
      const icon = fixture.nativeElement.querySelector('.icon');
      expect(icon.textContent).toBe('🛒');
    });

    it('deve aceitar emoji de erro', () => {
      component.icon = '❌';
      fixture.detectChanges();
      
      const icon = fixture.nativeElement.querySelector('.icon');
      expect(icon.textContent).toBe('❌');
    });

    it('deve aceitar emoji de busca', () => {
      component.icon = '🔎';
      fixture.detectChanges();
      
      const icon = fixture.nativeElement.querySelector('.icon');
      expect(icon.textContent).toBe('🔎');
    });
  });

  describe('✅ Título', () => {
    it('deve exibir título padrão', () => {
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('.title');
      expect(title.textContent).toBe('Nenhum resultado encontrado');
    });

    it('deve aceitar customização de título', () => {
      component.title = 'Sem produtos';
      fixture.detectChanges();
      
      const title = fixture.nativeElement.querySelector('.title');
      expect(title.textContent).toBe('Sem produtos');
    });

    it('deve aceitar título longo', () => {
      component.title = 'Nenhum produto encontrado para sua busca';
      fixture.detectChanges();
      
      const title = fixture.nativeElement.querySelector('.title');
      expect(title.textContent).toBe('Nenhum produto encontrado para sua busca');
    });

    it('deve aceitar título com caracteres especiais', () => {
      component.title = 'Busca: "paracetamol" - 0 resultados';
      fixture.detectChanges();
      
      const title = fixture.nativeElement.querySelector('.title');
      expect(title.textContent).toBe('Busca: "paracetamol" - 0 resultados');
    });
  });

  describe('✅ Mensagem', () => {
    it('deve exibir mensagem padrão', () => {
      const compiled = fixture.nativeElement;
      const message = compiled.querySelector('.message');
      expect(message.textContent).toBe('Tente ajustar sua busca ou filtros.');
    });

    it('deve aceitar customização de mensagem', () => {
      component.message = 'Verifique o termo digitado e tente novamente.';
      fixture.detectChanges();
      
      const message = fixture.nativeElement.querySelector('.message');
      expect(message.textContent).toBe('Verifique o termo digitado e tente novamente.');
    });

    it('deve aceitar mensagem longa', () => {
      const longMessage = 'Esta é uma mensagem muito longa que explica em detalhes o que o usuário pode fazer para encontrar o que está buscando.';
      component.message = longMessage;
      fixture.detectChanges();
      
      const message = fixture.nativeElement.querySelector('.message');
      expect(message.textContent).toBe(longMessage);
    });
  });

  describe('✅ Botão de Ação', () => {
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

    it('deve emitir evento sem argumentos', () => {
      component.actionLabel = 'Ação';
      fixture.detectChanges();
      
      spyOn(component.action, 'emit');
      
      const button = fixture.nativeElement.querySelector('.btn-action');
      button.click();
      
      expect(component.action.emit).toHaveBeenCalledWith();
    });

    it('deve aceitar diferentes labels de botão', () => {
      const labels = ['Tentar novamente', 'Voltar', 'Ver todos', 'Limpar filtros'];
      
      labels.forEach(label => {
        component.actionLabel = label;
        fixture.detectChanges();
        
        const button = fixture.nativeElement.querySelector('.btn-action');
        expect(button.textContent.trim()).toBe(label);
      });
    });

    it('deve emitir múltiplos eventos em cliques consecutivos', () => {
      component.actionLabel = 'Ação';
      fixture.detectChanges();
      
      spyOn(component.action, 'emit');
      
      const button = fixture.nativeElement.querySelector('.btn-action');
      button.click();
      button.click();
      button.click();
      
      expect(component.action.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('✅ Estrutura do Template', () => {
    it('deve ter elemento empty-state', () => {
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('deve ter estrutura correta com todos os elementos', () => {
      component.actionLabel = 'Ação';
      fixture.detectChanges();
      
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      const icon = emptyState.querySelector('.icon');
      const title = emptyState.querySelector('.title');
      const message = emptyState.querySelector('.message');
      const button = emptyState.querySelector('.btn-action');
      
      expect(icon).toBeTruthy();
      expect(title).toBeTruthy();
      expect(message).toBeTruthy();
      expect(button).toBeTruthy();
    });

    it('deve ter estrutura correta sem botão', () => {
      component.actionLabel = '';
      fixture.detectChanges();
      
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      const icon = emptyState.querySelector('.icon');
      const title = emptyState.querySelector('.title');
      const message = emptyState.querySelector('.message');
      const button = emptyState.querySelector('.btn-action');
      
      expect(icon).toBeTruthy();
      expect(title).toBeTruthy();
      expect(message).toBeTruthy();
      expect(button).toBeFalsy();
    });
  });

  describe('✅ Customização Completa', () => {
    it('deve aceitar todas as customizações ao mesmo tempo', () => {
      component.icon = '🔍';
      component.title = 'Produto não encontrado';
      component.message = 'Tente outro termo de busca.';
      component.actionLabel = 'Ver todos os produtos';
      fixture.detectChanges();
      
      const icon = fixture.nativeElement.querySelector('.icon');
      const title = fixture.nativeElement.querySelector('.title');
      const message = fixture.nativeElement.querySelector('.message');
      const button = fixture.nativeElement.querySelector('.btn-action');
      
      expect(icon.textContent).toBe('🔍');
      expect(title.textContent).toBe('Produto não encontrado');
      expect(message.textContent).toBe('Tente outro termo de busca.');
      expect(button.textContent.trim()).toBe('Ver todos os produtos');
    });

    it('deve permitir mudar valores após inicialização', () => {
      // Valores iniciais
      expect(fixture.nativeElement.querySelector('.icon').textContent).toBe('📭');
      
      // Mudar para novos valores
      component.icon = '🛒';
      component.title = 'Carrinho vazio';
      component.message = 'Adicione produtos ao carrinho.';
      fixture.detectChanges();
      
      expect(fixture.nativeElement.querySelector('.icon').textContent).toBe('🛒');
      expect(fixture.nativeElement.querySelector('.title').textContent).toBe('Carrinho vazio');
      expect(fixture.nativeElement.querySelector('.message').textContent).toBe('Adicione produtos ao carrinho.');
    });
  });

  describe('✅ Cenários de Uso', () => {
    it('deve funcionar como estado de busca vazia', () => {
      component.icon = '🔎';
      component.title = 'Nenhum produto encontrado';
      component.message = 'Tente buscar por outro termo.';
      component.actionLabel = 'Limpar busca';
      fixture.detectChanges();
      
      expect(fixture.nativeElement.querySelector('.icon').textContent).toBe('🔎');
      expect(fixture.nativeElement.querySelector('.btn-action')).toBeTruthy();
    });

    it('deve funcionar como estado de carrinho vazio', () => {
      component.icon = '🛒';
      component.title = 'Seu carrinho está vazio';
      component.message = 'Adicione produtos para continuar.';
      component.actionLabel = 'Ver produtos';
      fixture.detectChanges();
      
      expect(fixture.nativeElement.querySelector('.icon').textContent).toBe('🛒');
      expect(fixture.nativeElement.querySelector('.title').textContent).toBe('Seu carrinho está vazio');
    });

    it('deve funcionar como estado de erro', () => {
      component.icon = '❌';
      component.title = 'Erro ao carregar';
      component.message = 'Não foi possível carregar os dados.';
      component.actionLabel = 'Tentar novamente';
      fixture.detectChanges();
      
      expect(fixture.nativeElement.querySelector('.icon').textContent).toBe('❌');
      expect(fixture.nativeElement.querySelector('.title').textContent).toBe('Erro ao carregar');
    });

    it('deve funcionar como estado de favoritos vazios', () => {
      component.icon = '❤️';
      component.title = 'Sem favoritos';
      component.message = 'Adicione produtos aos favoritos.';
      component.actionLabel = '';
      fixture.detectChanges();
      
      expect(fixture.nativeElement.querySelector('.icon').textContent).toBe('❤️');
      expect(fixture.nativeElement.querySelector('.btn-action')).toBeFalsy();
    });
  });
});
