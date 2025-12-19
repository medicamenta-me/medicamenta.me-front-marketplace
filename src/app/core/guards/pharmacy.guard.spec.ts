/**
 * 🧪 Pharmacy Guard Tests
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { pharmacyGuard } from './pharmacy.guard';
import { of } from 'rxjs';

describe('pharmacyGuard', () => {
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuth = jasmine.createSpyObj('Auth', []);
    mockFirestore = jasmine.createSpyObj('Firestore', []);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('deve permitir acesso se usuário é farmácia', (done) => {
    const mockUser = { uid: 'pharmacy-123' };
    spyOn(require('@angular/fire/auth'), 'authState').and.returnValue(of(mockUser));
    spyOn(require('@angular/fire/firestore'), 'getDoc').and.returnValue(
      Promise.resolve({ exists: () => true })
    );

    const result = TestBed.runInInjectionContext(() => 
      pharmacyGuard({} as any, { url: '/dashboard' } as any)
    );

    if (result instanceof Promise) {
      result.then(canActivate => {
        expect(canActivate).toBe(true);
        done();
      });
    }
  });

  it('deve redirecionar para home se não é farmácia', (done) => {
    const mockUser = { uid: 'regular-user-123' };
    spyOn(require('@angular/fire/auth'), 'authState').and.returnValue(of(mockUser));
    spyOn(require('@angular/fire/firestore'), 'getDoc').and.returnValue(
      Promise.resolve({ exists: () => false })
    );

    const result = TestBed.runInInjectionContext(() => 
      pharmacyGuard({} as any, { url: '/dashboard' } as any)
    );

    if (result instanceof Promise) {
      result.then(canActivate => {
        expect(canActivate).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
        done();
      });
    }
  });

  it('deve redirecionar para login se não autenticado', (done) => {
    spyOn(require('@angular/fire/auth'), 'authState').and.returnValue(of(null));

    const result = TestBed.runInInjectionContext(() => 
      pharmacyGuard({} as any, { url: '/dashboard' } as any)
    );

    if (result instanceof Promise) {
      result.then(canActivate => {
        expect(canActivate).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(
          ['/auth/login'],
          { queryParams: { returnUrl: '/dashboard' } }
        );
        done();
      });
    }
  });
});
