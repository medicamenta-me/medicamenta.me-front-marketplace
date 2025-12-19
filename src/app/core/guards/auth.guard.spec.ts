/**
 * 🧪 Auth Guard Tests
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authGuard } from './auth.guard';
import { of } from 'rxjs';

describe('authGuard', () => {
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuth = jasmine.createSpyObj('Auth', [], {
      currentUser: null
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('deve permitir acesso se usuário autenticado', (done) => {
    const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
    spyOn(require('@angular/fire/auth'), 'authState').and.returnValue(of(mockUser));

    const result = TestBed.runInInjectionContext(() => 
      authGuard({} as any, { url: '/test' } as any)
    );

    if (result instanceof Observable) {
      result.subscribe(canActivate => {
        expect(canActivate).toBe(true);
        done();
      });
    }
  });

  it('deve redirecionar para login se não autenticado', (done) => {
    spyOn(require('@angular/fire/auth'), 'authState').and.returnValue(of(null));

    const result = TestBed.runInInjectionContext(() => 
      authGuard({} as any, { url: '/products' } as any)
    );

    if (result instanceof Observable) {
      result.subscribe(canActivate => {
        expect(canActivate).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(
          ['/auth/login'],
          { queryParams: { returnUrl: '/products' } }
        );
        done();
      });
    }
  });

  it('deve preservar URL de retorno nos query params', (done) => {
    spyOn(require('@angular/fire/auth'), 'authState').and.returnValue(of(null));

    const result = TestBed.runInInjectionContext(() => 
      authGuard({} as any, { url: '/cart/checkout' } as any)
    );

    if (result instanceof Observable) {
      result.subscribe(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(
          ['/auth/login'],
          { queryParams: { returnUrl: '/cart/checkout' } }
        );
        done();
      });
    }
  });
});
