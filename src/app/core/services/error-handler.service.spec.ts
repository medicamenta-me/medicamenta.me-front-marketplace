/**
 * 🧪 Error Handler Service Tests
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from './error-handler.service';
import { LoadingService } from './loading.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLoadingService = jasmine.createSpyObj('LoadingService', ['reset']);

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: Router, useValue: mockRouter },
        { provide: LoadingService, useValue: mockLoadingService }
      ]
    });

    service = TestBed.inject(ErrorHandlerService);
    spyOn(console, 'error');
    spyOn(console, 'warn');
  });

  describe('✅ Cenários de Erros HTTP', () => {
    it('deve processar erro 400 Bad Request', () => {
      const error = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request'
      });

      service.handleError(error);

      expect(mockLoadingService.reset).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Dados inválidos. Verifique as informações e tente novamente.'
      );
    });

    it('deve processar erro 401 Unauthorized', () => {
      const error = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized'
      });

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Sua sessão expirou. Faça login novamente.'
      );
    });

    it('deve processar erro 403 Forbidden', () => {
      const error = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden'
      });

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Você não tem permissão para realizar esta ação.'
      );
    });

    it('deve processar erro 404 Not Found', () => {
      const error = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found'
      });

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Recurso não encontrado.'
      );
    });

    it('deve processar erro 429 Too Many Requests', () => {
      const error = new HttpErrorResponse({
        status: 429,
        statusText: 'Too Many Requests'
      });

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Muitas requisições. Aguarde um momento e tente novamente.'
      );
    });

    it('deve processar erro 500 Internal Server Error e redirecionar', () => {
      const error = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });

      service.handleError(error);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: { message: 'Erro no servidor. Estamos trabalhando para resolver.' }
      });
    });

    it('deve processar erro 503 Service Unavailable e redirecionar', () => {
      const error = new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable'
      });

      service.handleError(error);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: { message: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.' }
      });
    });
  });

  describe('✅ Cenários de Erros do Firebase', () => {
    it('deve processar erro auth/user-not-found', () => {
      const error = {
        message: 'User not found',
        code: 'auth/user-not-found'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Usuário não encontrado.'
      );
    });

    it('deve processar erro permission-denied', () => {
      const error = {
        message: 'Permission denied',
        code: 'permission-denied'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Você não tem permissão para acessar este recurso.'
      );
    });

    it('deve processar erro resource-exhausted', () => {
      const error = {
        message: 'Resource exhausted',
        code: 'resource-exhausted'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Limite de uso excedido. Tente novamente mais tarde.'
      );
    });
  });

  describe('✅ Cenários de Erros Genéricos', () => {
    it('deve processar erro de rede', () => {
      const error = new Error('Network request failed');

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Sem conexão com a internet. Verifique sua conexão.'
      );
    });

    it('deve processar erro desconhecido', () => {
      const error = new Error('Unknown error');

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Ocorreu um erro inesperado. Por favor, tente novamente.'
      );
    });
  });

  describe('⚠️ Comportamentos Críticos', () => {
    it('deve sempre resetar loading service', () => {
      const error = new Error('Test error');

      service.handleError(error);

      expect(mockLoadingService.reset).toHaveBeenCalled();
    });

    it('deve logar erro em desenvolvimento', () => {
      const error = new Error('Test error');

      service.handleError(error);

      expect(console.error).toHaveBeenCalledWith('❌ Erro capturado:', error);
    });

    it('não deve redirecionar para /error em erros não críticos', () => {
      const error = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request'
      });

      service.handleError(error);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('✅ Cenários HTTP Adicionais', () => {
    it('deve processar erro 408 Request Timeout', () => {
      const error = new HttpErrorResponse({
        status: 408,
        statusText: 'Request Timeout'
      });

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'A requisição demorou muito. Tente novamente.'
      );
    });

    it('deve processar erro 409 Conflict', () => {
      const error = new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict'
      });

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Conflito de dados. O recurso já existe.'
      );
    });

    it('deve processar erro HTTP desconhecido com status 418', () => {
      const error = new HttpErrorResponse({
        status: 418,
        statusText: "I'm a teapot"
      });

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Erro ao processar requisição (418).'
      );
    });

    it('deve redirecionar para /error em todos os erros 5xx', () => {
      const error = new HttpErrorResponse({
        status: 502,
        statusText: 'Bad Gateway'
      });

      service.handleError(error);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: { message: jasmine.any(String) }
      });
    });
  });

  describe('✅ Cenários Firebase Adicionais', () => {
    it('deve processar erro auth/wrong-password', () => {
      const error = {
        message: 'Wrong password',
        code: 'auth/wrong-password'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Senha incorreta.'
      );
    });

    it('deve processar erro auth/email-already-in-use', () => {
      const error = {
        message: 'Email already in use',
        code: 'auth/email-already-in-use'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Este email já está em uso.'
      );
    });

    it('deve processar erro auth/weak-password', () => {
      const error = {
        message: 'Weak password',
        code: 'auth/weak-password'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'A senha deve ter pelo menos 6 caracteres.'
      );
    });

    it('deve processar erro auth/invalid-email', () => {
      const error = {
        message: 'Invalid email',
        code: 'auth/invalid-email'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Email inválido.'
      );
    });

    it('deve processar erro auth/too-many-requests', () => {
      const error = {
        message: 'Too many requests',
        code: 'auth/too-many-requests'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Muitas tentativas. Tente novamente mais tarde.'
      );
    });

    it('deve processar erro not-found', () => {
      const error = {
        message: 'Not found',
        code: 'not-found'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Documento não encontrado.'
      );
    });

    it('deve processar erro already-exists', () => {
      const error = {
        message: 'Already exists',
        code: 'already-exists'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Documento já existe.'
      );
    });

    it('deve processar erro unauthenticated', () => {
      const error = {
        message: 'Unauthenticated',
        code: 'unauthenticated'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Você precisa estar autenticado.'
      );
    });

    it('deve processar erro Firebase desconhecido', () => {
      const error = {
        message: 'Unknown Firebase error',
        code: 'auth/unknown-error'
      } as any;

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Erro ao processar operação.'
      );
    });
  });

  describe('✅ Cenários de Rede', () => {
    it('deve processar erro de fetch', () => {
      const error = new Error('fetch failed');

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Sem conexão com a internet. Verifique sua conexão.'
      );
    });

    it('deve processar erro de XMLHttpRequest', () => {
      const error = new Error('XMLHttpRequest error');

      service.handleError(error);

      expect(console.warn).toHaveBeenCalledWith(
        '💬 Mensagem ao usuário:',
        'Sem conexão com a internet. Verifique sua conexão.'
      );
    });
  });

  describe('✅ Cenários de Log', () => {
    it('deve criar ErrorLog com todas as propriedades', () => {
      const error = new Error('Test error');

      service.handleError(error);

      // Verifica que console.error foi chamado com o log
      expect(console.error).toHaveBeenCalledWith('📋 Error Log:', jasmine.objectContaining({
        message: 'Test error',
        timestamp: jasmine.any(Date),
        url: jasmine.any(String),
        userAgent: jasmine.any(String)
      }));
    });

    it('deve incluir stack trace para erros Error', () => {
      const error = new Error('Test error with stack');

      service.handleError(error);

      expect(console.error).toHaveBeenCalledWith('📋 Error Log:', jasmine.objectContaining({
        stack: jasmine.any(String)
      }));
    });

    it('deve ter stack undefined para HttpErrorResponse', () => {
      const error = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request'
      });

      service.handleError(error);

      expect(console.error).toHaveBeenCalledWith('📋 Error Log:', jasmine.objectContaining({
        stack: undefined
      }));
    });
  });
});
