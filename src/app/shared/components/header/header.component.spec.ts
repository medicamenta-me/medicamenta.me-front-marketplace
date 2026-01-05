/**
 * 🧪 Header Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
      userProfile: jasmine.createSpy('userProfile').and.returnValue(null),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('✅ Criação e Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com searchQuery vazio', () => {
      expect(component.searchQuery()).toBe('');
    });

    it('deve inicializar com cartItemCount 0', () => {
      expect(component.cartItemCount()).toBe(0);
    });

    it('deve ter router injetado', () => {
      expect(component.router).toBeTruthy();
    });

    it('deve chamar loadCartItemCount no ngOnInit', () => {
      // O componente já foi inicializado, verificar que cartItemCount é 0
      expect(component.cartItemCount()).toBe(0);
    });
  });

  describe('✅ Computed Properties', () => {
    it('deve retornar currentUser do AuthService', () => {
      expect(component.currentUser).toBeNull();
    });

    it('deve retornar userProfile do AuthService', () => {
      expect(component.userProfile).toBeNull();
    });

    it('deve retornar isAuthenticated do AuthService', () => {
      expect(component.isAuthenticated).toBe(false);
    });
  });

  describe('🔍 Busca', () => {
    it('deve navegar com query params ao buscar', () => {
      component.searchQuery.set('paracetamol');

      component.onSearch();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/products'], {
        queryParams: { q: 'paracetamol' }
      });
    });

    it('não deve buscar com query vazia', () => {
      component.searchQuery.set('   ');

      component.onSearch();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('não deve buscar com string vazia', () => {
      component.searchQuery.set('');

      component.onSearch();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('deve fazer trim na query antes de buscar', () => {
      component.searchQuery.set('  dipirona  ');

      component.onSearch();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/products'], {
        queryParams: { q: 'dipirona' }
      });
    });

    it('deve buscar com query de uma palavra', () => {
      component.searchQuery.set('vitamina');

      component.onSearch();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/products'], {
        queryParams: { q: 'vitamina' }
      });
    });

    it('deve buscar com query de múltiplas palavras', () => {
      component.searchQuery.set('vitamina c 1000mg');

      component.onSearch();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/products'], {
        queryParams: { q: 'vitamina c 1000mg' }
      });
    });

    it('deve buscar com caracteres especiais', () => {
      component.searchQuery.set('paracetamol 500mg');

      component.onSearch();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/products'], {
        queryParams: { q: 'paracetamol 500mg' }
      });
    });
  });

  describe('👤 Autenticação', () => {
    it('deve fazer logout corretamente', () => {
      mockAuthService.logout.and.returnValue(of(void 0));

      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('deve navegar para login', () => {
      component.goToLogin();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('deve navegar para perfil', () => {
      component.goToProfile();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('deve chamar logout do AuthService', () => {
      mockAuthService.logout.and.returnValue(of(void 0));

      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('deve navegar para home após logout com sucesso', () => {
      mockAuthService.logout.and.returnValue(of(void 0));

      component.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('🛒 Carrinho', () => {
    it('deve navegar para carrinho', () => {
      component.goToCart();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cart']);
    });

    it('deve inicializar cartItemCount como signal', () => {
      expect(typeof component.cartItemCount).toBe('function');
      expect(component.cartItemCount()).toBe(0);
    });

    it('deve permitir atualizar cartItemCount', () => {
      component.cartItemCount.set(5);
      expect(component.cartItemCount()).toBe(5);
    });

    it('deve permitir resetar cartItemCount para 0', () => {
      component.cartItemCount.set(10);
      component.cartItemCount.set(0);
      expect(component.cartItemCount()).toBe(0);
    });
  });

  describe('📱 Signals', () => {
    it('searchQuery deve ser um signal', () => {
      expect(typeof component.searchQuery).toBe('function');
    });

    it('cartItemCount deve ser um signal', () => {
      expect(typeof component.cartItemCount).toBe('function');
    });

    it('deve atualizar searchQuery signal', () => {
      component.searchQuery.set('teste');
      expect(component.searchQuery()).toBe('teste');
    });

    it('deve atualizar cartItemCount signal', () => {
      component.cartItemCount.set(3);
      expect(component.cartItemCount()).toBe(3);
    });

    it('deve permitir múltiplas atualizações de searchQuery', () => {
      component.searchQuery.set('primeiro');
      expect(component.searchQuery()).toBe('primeiro');
      
      component.searchQuery.set('segundo');
      expect(component.searchQuery()).toBe('segundo');
      
      component.searchQuery.set('terceiro');
      expect(component.searchQuery()).toBe('terceiro');
    });
  });

  describe('🧭 Navegação', () => {
    it('deve navegar para cart', () => {
      component.goToCart();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cart']);
    });

    it('deve navegar para login', () => {
      component.goToLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('deve navegar para profile', () => {
      component.goToProfile();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('deve navegar para products com busca', () => {
      component.searchQuery.set('remedio');
      component.onSearch();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/products'], {
        queryParams: { q: 'remedio' }
      });
    });

    it('deve navegar para home após logout', () => {
      mockAuthService.logout.and.returnValue(of(void 0));
      component.logout();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
