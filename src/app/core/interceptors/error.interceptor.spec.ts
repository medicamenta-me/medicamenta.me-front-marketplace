/**
 * 🧪 Error Interceptor Tests
 */

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve tratar erro 400 (Bad Request)', (done) => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.message).toBe('Requisição inválida');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 400, statusText: 'Bad Request' });
  });

  it('deve tratar erro 401 e redirecionar para login', (done) => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.message).toBe('Sessão expirada. Faça login novamente');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('deve tratar erro 403 (Forbidden)', (done) => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.message).toBe('Você não tem permissão para acessar este recurso');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 403, statusText: 'Forbidden' });
  });

  it('deve tratar erro 404 (Not Found)', (done) => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.message).toBe('Recurso não encontrado');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 404, statusText: 'Not Found' });
  });

  it('deve tratar erro 500 (Internal Server Error)', (done) => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.message).toBe('Erro interno do servidor');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 500, statusText: 'Internal Server Error' });
  });

  it('deve tratar erro de rede (status 0)', (done) => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.message).toBe('Sem conexão com o servidor');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 0, statusText: 'Unknown Error' });
  });

  it('deve tratar erro desconhecido', (done) => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Erro 418');
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 418, statusText: "I'm a teapot" });
  });
});
