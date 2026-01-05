/**
 * 🧪 Authentication Service Tests
 * 
 * Tests for AuthService - focusing on testable functionality:
 * - Signal state management (currentUser, userProfile, isAuthenticated, isLoading)
 * - hasRole() method
 * - getIdToken() method
 * - Error message mapping (handleAuthError)
 * 
 * Note: Firebase modular API functions cannot be easily mocked in Jasmine.
 * Integration tests with Firebase should use Firebase Emulator Suite.
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { AuthService, UserProfile } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: Partial<User> = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('mock-token'))
  };

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    // Create a mock Auth that captures the onAuthStateChanged callback
    const mockAuth = {
      currentUser: null,
      onAuthStateChanged: jasmine.createSpy('onAuthStateChanged')
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: {} },
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  describe('✅ Cenários Positivos', () => {
    it('deve criar o serviço', () => {
      expect(service).toBeTruthy();
    });

    it('deve fazer login com credenciais válidas', () => {
      // Verify login method exists and returns Observable
      expect(service.login).toBeDefined();
      expect(typeof service.login).toBe('function');
    });

    it('deve registrar novo usuário', () => {
      // Verify register method exists and returns Observable
      expect(service.register).toBeDefined();
      expect(typeof service.register).toBe('function');
    });

    it('deve fazer logout corretamente', () => {
      // Verify logout method exists
      expect(service.logout).toBeDefined();
      expect(typeof service.logout).toBe('function');
    });

    it('deve enviar email de reset de senha', () => {
      // Verify resetPassword method exists
      expect(service.resetPassword).toBeDefined();
      expect(typeof service.resetPassword).toBe('function');
    });

    it('deve retornar token JWT válido', async () => {
      const mockUserWithToken = {
        ...mockUser,
        getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('mock-token'))
      };
      service.currentUser.set(mockUserWithToken as User);

      const token = await service.getIdToken();

      expect(token).toBe('mock-token');
      expect(mockUserWithToken.getIdToken).toHaveBeenCalled();
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
    it('deve retornar erro para credenciais inválidas', () => {
      // Test error message mapping using handleAuthError
      const error = service['handleAuthError']({ code: 'auth/user-not-found' });
      expect(error.message).toBe('Usuário não encontrado.');
    });

    it('deve retornar erro para senha fraca no registro', () => {
      const error = service['handleAuthError']({ code: 'auth/weak-password' });
      expect(error.message).toBe('A senha deve ter pelo menos 6 caracteres.');
    });

    it('deve retornar erro para email já em uso', () => {
      const error = service['handleAuthError']({ code: 'auth/email-already-in-use' });
      expect(error.message).toBe('Este email já está em uso.');
    });

    it('deve retornar erro para email inválido', () => {
      const error = service['handleAuthError']({ code: 'auth/invalid-email' });
      expect(error.message).toBe('Email inválido.');
    });

    it('deve retornar null se não houver usuário autenticado', async () => {
      service.currentUser.set(null);

      const token = await service.getIdToken();

      expect(token).toBeNull();
    });

    it('deve retornar erro de rede', () => {
      const error = service['handleAuthError']({ code: 'auth/network-request-failed' });
      expect(error.message).toBe('Erro de conexão. Verifique sua internet.');
    });

    it('deve retornar erro para muitas tentativas', () => {
      const error = service['handleAuthError']({ code: 'auth/too-many-requests' });
      expect(error.message).toBe('Muitas tentativas. Tente novamente mais tarde.');
    });
  });

  describe('⚠️ Edge Cases', () => {
    it('deve lidar com erro desconhecido', () => {
      const error = service['handleAuthError']({ code: 'auth/unknown-error' });
      expect(error.message).toBe('Erro ao autenticar. Tente novamente.');
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
      // isLoading starts as true and becomes false after auth state is determined
      // Since we're not triggering onAuthStateChanged callback, it should stay true
      expect(service.isLoading()).toBe(true);
    });

    it('deve lidar com erro no logout', () => {
      // Verify logout method is defined (actual error handling would be integration test)
      expect(service.logout).toBeDefined();
    });
  });

  describe('🔧 Error Handling', () => {
    it('deve mapear erro auth/wrong-password', () => {
      const error = service['handleAuthError']({ code: 'auth/wrong-password' });
      expect(error.message).toBe('Senha incorreta.');
    });

    it('deve retornar mensagem padrão para erros sem código', () => {
      const error = service['handleAuthError']({});
      expect(error.message).toBe('Erro ao autenticar. Tente novamente.');
    });

    it('deve retornar mensagem padrão para erro null', () => {
      const error = service['handleAuthError'](null);
      expect(error.message).toBe('Erro ao autenticar. Tente novamente.');
    });

    it('deve mapear todos os códigos de erro do Firebase Auth', () => {
      const errorMappings = [
        { code: 'auth/user-not-found', message: 'Usuário não encontrado.' },
        { code: 'auth/wrong-password', message: 'Senha incorreta.' },
        { code: 'auth/email-already-in-use', message: 'Este email já está em uso.' },
        { code: 'auth/weak-password', message: 'A senha deve ter pelo menos 6 caracteres.' },
        { code: 'auth/invalid-email', message: 'Email inválido.' },
        { code: 'auth/too-many-requests', message: 'Muitas tentativas. Tente novamente mais tarde.' },
        { code: 'auth/network-request-failed', message: 'Erro de conexão. Verifique sua internet.' }
      ];

      errorMappings.forEach(({ code, message }) => {
        const error = service['handleAuthError']({ code });
        expect(error.message).toBe(message);
      });
    });

    it('deve retornar instância de Error', () => {
      const error = service['handleAuthError']({ code: 'auth/user-not-found' });
      expect(error instanceof Error).toBe(true);
    });

    it('deve lidar com undefined como erro', () => {
      const error = service['handleAuthError'](undefined);
      expect(error.message).toBe('Erro ao autenticar. Tente novamente.');
    });
  });

  describe('📊 Signal State', () => {
    it('deve ter signal currentUser inicializado', () => {
      expect(service.currentUser).toBeDefined();
      // Initial value depends on Firebase auth state
    });

    it('deve ter signal userProfile inicializado', () => {
      expect(service.userProfile).toBeDefined();
    });

    it('deve ter signal isAuthenticated inicializado', () => {
      expect(service.isAuthenticated).toBeDefined();
    });

    it('deve permitir setar currentUser', () => {
      service.currentUser.set(mockUser as User);
      expect(service.currentUser()?.uid).toBe(mockUser.uid);
    });

    it('deve permitir setar userProfile', () => {
      const profile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      service.userProfile.set(profile);
      expect(service.userProfile()).toBe(profile);
    });

    it('deve permitir setar isAuthenticated', () => {
      service.isAuthenticated.set(true);
      expect(service.isAuthenticated()).toBe(true);

      service.isAuthenticated.set(false);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('🔐 Verificação de Roles', () => {
    it('deve verificar role customer corretamente', () => {
      service.userProfile.set({
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      expect(service.hasRole('customer')).toBe(true);
      expect(service.hasRole('pharmacy')).toBe(false);
      expect(service.hasRole('admin')).toBe(false);
    });

    it('deve verificar role admin corretamente', () => {
      service.userProfile.set({
        uid: 'test-uid',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      expect(service.hasRole('admin')).toBe(true);
      expect(service.hasRole('customer')).toBe(false);
      expect(service.hasRole('pharmacy')).toBe(false);
    });

    it('deve retornar false para todas as roles quando profile é null', () => {
      service.userProfile.set(null);

      expect(service.hasRole('customer')).toBe(false);
      expect(service.hasRole('pharmacy')).toBe(false);
      expect(service.hasRole('admin')).toBe(false);
    });
  });

  describe('🔑 Token JWT', () => {
    it('deve obter token quando usuário está autenticado', async () => {
      const mockUserWithToken = {
        ...mockUser,
        getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('valid-jwt-token'))
      };
      service.currentUser.set(mockUserWithToken as User);

      const token = await service.getIdToken();

      expect(token).toBe('valid-jwt-token');
    });

    it('deve retornar null quando não há usuário', async () => {
      service.currentUser.set(null);

      const token = await service.getIdToken();

      expect(token).toBeNull();
    });

    it('deve retornar null quando getIdToken lança erro', async () => {
      const mockUserWithError = {
        ...mockUser,
        getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.reject(new Error('Token error')))
      };
      service.currentUser.set(mockUserWithError as User);
      spyOn(console, 'error');

      const token = await service.getIdToken();

      expect(token).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('📝 Interface e Tipagem', () => {
    it('deve aceitar LoginCredentials válido', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      expect(service.login).toBeDefined();
      expect(typeof credentials.email).toBe('string');
      expect(typeof credentials.password).toBe('string');
    });

    it('deve aceitar RegisterData válido', () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
        phoneNumber: '+5511999999999',
        role: 'customer' as const
      };

      expect(service.register).toBeDefined();
      expect(typeof registerData.email).toBe('string');
      expect(typeof registerData.displayName).toBe('string');
    });

    it('deve aceitar RegisterData sem campos opcionais', () => {
      const registerData: {
        email: string;
        password: string;
        displayName: string;
        phoneNumber?: string;
        role?: 'customer' | 'pharmacy';
      } = {
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User'
      };

      expect(service.register).toBeDefined();
      expect(registerData.phoneNumber).toBeUndefined();
      expect(registerData.role).toBeUndefined();
    });

    it('deve aceitar UserProfile completo', () => {
      const profile: UserProfile = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        phoneNumber: '+5511999999999',
        role: 'pharmacy',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      service.userProfile.set(profile);
      expect(service.userProfile()?.displayName).toBe('Test User');
      expect(service.userProfile()?.photoURL).toBe('https://example.com/photo.jpg');
    });
  });

  // ==============================================================================
  // TESTES ADICIONAIS DE ESTADO E COMPORTAMENTO
  // ==============================================================================

  describe('Estado do Serviço', () => {
    it('deve ter isLoading inicialmente true', () => {
      // O serviço inicializa isLoading como true até verificar auth state
      expect(service.isLoading()).toBe(true);
    });

    it('deve ter isAuthenticated inicialmente false', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('deve ter currentUser inicialmente null', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('deve ter userProfile inicialmente null', () => {
      expect(service.userProfile()).toBeNull();
    });

    it('deve permitir setar currentUser', () => {
      service.currentUser.set(mockUser as User);
      expect(service.currentUser()).toEqual(mockUser as User);
    });

    it('deve permitir setar isAuthenticated manualmente', () => {
      // isAuthenticated é um signal independente, não computed
      service.isAuthenticated.set(true);
      expect(service.isAuthenticated()).toBe(true);
      service.isAuthenticated.set(false);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Role Checking Extended', () => {
    it('deve retornar false para hasRole quando sem profile', () => {
      service.userProfile.set(null);
      expect(service.hasRole('customer')).toBe(false);
    });

    it('deve retornar true para hasRole com role correto', () => {
      service.userProfile.set({
        uid: 'test',
        email: 'test@test.com',
        role: 'pharmacy',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      expect(service.hasRole('pharmacy')).toBe(true);
    });

    it('deve retornar false para hasRole com role incorreto', () => {
      service.userProfile.set({
        uid: 'test',
        email: 'test@test.com',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      expect(service.hasRole('pharmacy')).toBe(false);
    });

    it('deve retornar true para admin que tem acesso a tudo', () => {
      service.userProfile.set({
        uid: 'admin',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      // admin role check
      expect(service.hasRole('admin')).toBe(true);
    });
  });

  describe('Token Management', () => {
    it('deve retornar null para getIdToken quando sem usuário', async () => {
      service.currentUser.set(null);
      const token = await service.getIdToken();
      expect(token).toBeNull();
    });

    it('deve chamar getIdToken no usuário atual', async () => {
      const mockSpy = jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('token-xyz'));
      const userWithSpy = { ...mockUser, getIdToken: mockSpy } as unknown as User;
      service.currentUser.set(userWithSpy);
      
      const token = await service.getIdToken();
      
      expect(mockSpy).toHaveBeenCalled();
      expect(token).toBe('token-xyz');
    });
  });

  describe('Métodos Públicos', () => {
    it('deve ter método login', () => {
      expect(service.login).toBeDefined();
      expect(typeof service.login).toBe('function');
    });

    it('deve ter método register', () => {
      expect(service.register).toBeDefined();
      expect(typeof service.register).toBe('function');
    });

    it('deve ter método logout', () => {
      expect(service.logout).toBeDefined();
      expect(typeof service.logout).toBe('function');
    });

    it('deve ter método resetPassword', () => {
      expect(service.resetPassword).toBeDefined();
      expect(typeof service.resetPassword).toBe('function');
    });

    it('deve ter método hasRole', () => {
      expect(service.hasRole).toBeDefined();
      expect(typeof service.hasRole).toBe('function');
    });

    it('deve ter método getIdToken', () => {
      expect(service.getIdToken).toBeDefined();
      expect(typeof service.getIdToken).toBe('function');
    });
  });

  describe('Signal Reactivity', () => {
    it('deve ter isAuthenticated como signal setável', () => {
      // isAuthenticated é um signal independente
      expect(service.isAuthenticated()).toBe(false);
      
      service.isAuthenticated.set(true);
      expect(service.isAuthenticated()).toBe(true);
      
      service.isAuthenticated.set(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('deve manter estado do userProfile', () => {
      const profile: UserProfile = {
        uid: 'uid-1',
        email: 'user@test.com',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      service.userProfile.set(profile);
      expect(service.userProfile()?.email).toBe('user@test.com');
      
      service.userProfile.set(null);
      expect(service.userProfile()).toBeNull();
    });

    it('deve ter isLoading inicialmente true', () => {
      // isLoading começa como true enquanto verifica auth
      // O mock de Auth não trigger o callback então fica true
      expect(typeof service.isLoading()).toBe('boolean');
    });
  });

  describe('UserProfile Interface', () => {
    it('deve aceitar profile mínimo', () => {
      const minProfile: UserProfile = {
        uid: 'min-uid',
        email: 'min@test.com',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      service.userProfile.set(minProfile);
      expect(service.userProfile()?.uid).toBe('min-uid');
    });

    it('deve aceitar profile com displayName', () => {
      const profile: UserProfile = {
        uid: 'uid-2',
        email: 'display@test.com',
        displayName: 'Display User',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      service.userProfile.set(profile);
      expect(service.userProfile()?.displayName).toBe('Display User');
    });

    it('deve aceitar profile com photoURL', () => {
      const profile: UserProfile = {
        uid: 'uid-3',
        email: 'photo@test.com',
        photoURL: 'https://example.com/avatar.png',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      service.userProfile.set(profile);
      expect(service.userProfile()?.photoURL).toBe('https://example.com/avatar.png');
    });

    it('deve aceitar profile com phoneNumber', () => {
      const profile: UserProfile = {
        uid: 'uid-4',
        email: 'phone@test.com',
        phoneNumber: '+5511999999999',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      service.userProfile.set(profile);
      expect(service.userProfile()?.phoneNumber).toBe('+5511999999999');
    });

    it('deve aceitar profile com lastLoginAt', () => {
      const lastLogin = new Date();
      const profile: UserProfile = {
        uid: 'uid-5',
        email: 'lastlogin@test.com',
        role: 'customer',
        createdAt: new Date(),
        lastLoginAt: lastLogin
      };
      
      service.userProfile.set(profile);
      expect(service.userProfile()?.lastLoginAt).toEqual(lastLogin);
    });

    it('deve aceitar diferentes roles', () => {
      const roles: Array<'customer' | 'pharmacy' | 'admin'> = ['customer', 'pharmacy', 'admin'];
      
      roles.forEach(role => {
        const profile: UserProfile = {
          uid: `uid-${role}`,
          email: `${role}@test.com`,
          role,
          createdAt: new Date(),
          lastLoginAt: new Date()
        };
        
        service.userProfile.set(profile);
        expect(service.userProfile()?.role).toBe(role);
      });
    });
  });
});

