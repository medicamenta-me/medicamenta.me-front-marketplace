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
});
