/**
 * 🧪 Header Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { of } from 'rxjs';

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

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar com searchQuery vazio', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('deve inicializar com cartItemCount 0', () => {
    expect(component.cartItemCount()).toBe(0);
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
  });

  describe('🛒 Carrinho', () => {
    it('deve navegar para carrinho', () => {
      component.goToCart();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cart']);
    });
  });
});
