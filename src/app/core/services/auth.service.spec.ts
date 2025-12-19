/**
 * 🧪 Authentication Service Tests
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService, LoginCredentials, RegisterData } from './auth.service';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: Partial<User> = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('mock-token'))
  };

  beforeEach(() => {
    mockAuth = jasmine.createSpyObj('Auth', [], { currentUser: null });
    mockFirestore = jasmine.createSpyObj('Firestore', []);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore },
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  describe('✅ Cenários Positivos', () => {
    it('deve criar o serviço', () => {
      expect(service).toBeTruthy();
    });

    it('deve fazer login com credenciais válidas', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      spyOn<any>(service as any, 'updateLastLogin').and.returnValue(Promise.resolve());
      
      const mockUserCredential = { user: mockUser };
      spyOn(window as any, 'signInWithEmailAndPassword').and.returnValue(Promise.resolve(mockUserCredential));

      service.login(credentials).subscribe({
        next: (user) => {
          expect(user).toBe(mockUser as User);
          done();
        },
        error: done.fail
      });
    });

    it('deve registrar novo usuário', (done) => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        role: 'customer'
      };

      const mockUserCredential = { user: mockUser };
      spyOn(window as any, 'createUserWithEmailAndPassword').and.returnValue(Promise.resolve(mockUserCredential));
      spyOn<any>(service as any, 'createUserProfile').and.returnValue(Promise.resolve());

      service.register(registerData).subscribe({
        next: (user) => {
          expect(user).toBeDefined();
          done();
        },
        error: done.fail
      });
    });

    it('deve fazer logout corretamente', (done) => {
      spyOn(window as any, 'signOut').and.returnValue(Promise.resolve());

      service.logout().subscribe({
        next: () => {
          expect(service.currentUser()).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
        error: done.fail
      });
    });

    it('deve enviar email de reset de senha', (done) => {
      const email = 'test@example.com';
      spyOn(window as any, 'sendPasswordResetEmail').and.returnValue(Promise.resolve());

      service.resetPassword(email).subscribe({
        next: () => {
          done();
        },
        error: done.fail
      });
    });

    it('deve retornar token JWT válido', async () => {
      service.currentUser.set(mockUser as User);

      const token = await service.getIdToken();

      expect(token).toBe('mock-token');
      expect(mockUser.getIdToken).toHaveBeenCalled();
    });

    it('deve verificar role do usuário', () => {
      service.userProfile.set({
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'pharmacy',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      expect(service.hasRole('pharmacy')).toBe(true);
      expect(service.hasRole('customer')).toBe(false);
      expect(service.hasRole('admin')).toBe(false);
    });
  });

  describe('❌ Cenários Negativos', () => {
    it('deve retornar erro para credenciais inválidas', (done) => {
      const credentials: LoginCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpass'
      };

      const error = { code: 'auth/user-not-found' };
      spyOn(window as any, 'signInWithEmailAndPassword').and.returnValue(Promise.reject(error));

      service.login(credentials).subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err.message).toBe('Usuário não encontrado.');
          done();
        }
      });
    });

    it('deve retornar erro para senha fraca no registro', (done) => {
      const registerData: RegisterData = {
        email: 'test@example.com',
        password: '123',
        displayName: 'Test'
      };

      const error = { code: 'auth/weak-password' };
      spyOn(window as any, 'createUserWithEmailAndPassword').and.returnValue(Promise.reject(error));

      service.register(registerData).subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err.message).toBe('A senha deve ter pelo menos 6 caracteres.');
          done();
        }
      });
    });

    it('deve retornar erro para email já em uso', (done) => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        password: 'password123',
        displayName: 'Test'
      };

      const error = { code: 'auth/email-already-in-use' };
      spyOn(window as any, 'createUserWithEmailAndPassword').and.returnValue(Promise.reject(error));

      service.register(registerData).subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err.message).toBe('Este email já está em uso.');
          done();
        }
      });
    });

    it('deve retornar erro para email inválido', (done) => {
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      const error = { code: 'auth/invalid-email' };
      spyOn(window as any, 'signInWithEmailAndPassword').and.returnValue(Promise.reject(error));

      service.login(credentials).subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err.message).toBe('Email inválido.');
          done();
        }
      });
    });

    it('deve retornar null se não houver usuário autenticado', async () => {
      service.currentUser.set(null);

      const token = await service.getIdToken();

      expect(token).toBeNull();
    });

    it('deve retornar erro de rede', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const error = { code: 'auth/network-request-failed' };
      spyOn(window as any, 'signInWithEmailAndPassword').and.returnValue(Promise.reject(error));

      service.login(credentials).subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err.message).toBe('Erro de conexão. Verifique sua internet.');
          done();
        }
      });
    });

    it('deve retornar erro para muitas tentativas', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const error = { code: 'auth/too-many-requests' };
      spyOn(window as any, 'signInWithEmailAndPassword').and.returnValue(Promise.reject(error));

      service.login(credentials).subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err.message).toBe('Muitas tentativas. Tente novamente mais tarde.');
          done();
        }
      });
    });
  });

  describe('⚠️ Edge Cases', () => {
    it('deve lidar com erro desconhecido', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const error = { code: 'auth/unknown-error' };
      spyOn(window as any, 'signInWithEmailAndPassword').and.returnValue(Promise.reject(error));

      service.login(credentials).subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err.message).toBe('Erro ao autenticar. Tente novamente.');
          done();
        }
      });
    });

    it('deve retornar null se getIdToken falhar', async () => {
      const mockUserWithError = {
        ...mockUser,
        getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.reject('error'))
      };
      service.currentUser.set(mockUserWithError as User);

      const token = await service.getIdToken();

      expect(token).toBeNull();
    });

    it('deve retornar false para role se não houver profile', () => {
      service.userProfile.set(null);

      expect(service.hasRole('customer')).toBe(false);
    });

    it('deve inicializar com isLoading true', () => {
      expect(service.isLoading()).toBe(true);
    });

    it('deve lidar com erro no logout', (done) => {
      const error = new Error('Logout failed');
      spyOn(window as any, 'signOut').and.returnValue(Promise.reject(error));

      service.logout().subscribe({
        next: () => done.fail('Deveria ter retornado erro'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });
});
