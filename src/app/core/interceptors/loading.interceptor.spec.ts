/**
 * 🧪 Loading Interceptor Tests
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { LoadingService } from '../services/loading.service';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  beforeEach(() => {
    mockLoadingService = jasmine.createSpyObj('LoadingService', ['show', 'hide']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        { provide: LoadingService, useValue: mockLoadingService }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('✅ Comportamento Básico', () => {
    it('deve exibir loading ao iniciar requisição', () => {
      httpClient.get('/api/test').subscribe();

      expect(mockLoadingService.show).toHaveBeenCalledTimes(1);

      const req = httpMock.expectOne('/api/test');
      req.flush({});
    });

    it('deve ocultar loading após requisição bem-sucedida', fakeAsync(() => {
      let completed = false;
      httpClient.get('/api/test').subscribe({
        next: () => { completed = true; }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({});
      tick();

      expect(completed).toBe(true);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve ocultar loading após erro na requisição', fakeAsync(() => {
      let errorCaught = false;
      httpClient.get('/api/test').subscribe({
        error: () => { errorCaught = true; }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      tick();

      expect(errorCaught).toBe(true);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));
  });

  describe('✅ Requisições Paralelas', () => {
    it('deve gerenciar loading em múltiplas requisições paralelas', fakeAsync(() => {
      let count = 0;
      httpClient.get('/api/test1').subscribe({ next: () => count++ });
      httpClient.get('/api/test2').subscribe({ next: () => count++ });

      const req1 = httpMock.expectOne('/api/test1');
      const req2 = httpMock.expectOne('/api/test2');

      // Show deve ter sido chamado 2x
      expect(mockLoadingService.show).toHaveBeenCalledTimes(2);

      req1.flush({});
      req2.flush({});
      tick();

      expect(count).toBe(2);
      // Hide pode ser chamado de 1 a 2 vezes dependendo da implementação
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve chamar show para cada requisição', fakeAsync(() => {
      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();
      httpClient.get('/api/test3').subscribe();

      expect(mockLoadingService.show).toHaveBeenCalledTimes(3);

      httpMock.expectOne('/api/test1').flush({});
      httpMock.expectOne('/api/test2').flush({});
      httpMock.expectOne('/api/test3').flush({});
      tick();
    }));
  });

  describe('✅ Diferentes Métodos HTTP', () => {
    it('deve exibir loading para requisição GET', fakeAsync(() => {
      httpClient.get('/api/data').subscribe();

      expect(mockLoadingService.show).toHaveBeenCalled();

      httpMock.expectOne('/api/data').flush({});
      tick();
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve exibir loading para requisição POST', fakeAsync(() => {
      httpClient.post('/api/data', { name: 'test' }).subscribe();

      expect(mockLoadingService.show).toHaveBeenCalled();

      httpMock.expectOne('/api/data').flush({});
      tick();
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve exibir loading para requisição PUT', fakeAsync(() => {
      httpClient.put('/api/data/1', { name: 'test' }).subscribe();

      expect(mockLoadingService.show).toHaveBeenCalled();

      httpMock.expectOne('/api/data/1').flush({});
      tick();
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve exibir loading para requisição DELETE', fakeAsync(() => {
      httpClient.delete('/api/data/1').subscribe();

      expect(mockLoadingService.show).toHaveBeenCalled();

      httpMock.expectOne('/api/data/1').flush({});
      tick();
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve exibir loading para requisição PATCH', fakeAsync(() => {
      httpClient.patch('/api/data/1', { name: 'updated' }).subscribe();

      expect(mockLoadingService.show).toHaveBeenCalled();

      httpMock.expectOne('/api/data/1').flush({});
      tick();
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));
  });

  describe('✅ Diferentes Códigos de Erro', () => {
    it('deve ocultar loading após erro 400', fakeAsync(() => {
      let errorCode = 0;
      httpClient.get('/api/test').subscribe({
        error: (err) => { errorCode = err.status; }
      });

      httpMock.expectOne('/api/test').flush({}, { status: 400, statusText: 'Bad Request' });
      tick();

      expect(errorCode).toBe(400);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve ocultar loading após erro 401', fakeAsync(() => {
      let errorCode = 0;
      httpClient.get('/api/test').subscribe({
        error: (err) => { errorCode = err.status; }
      });

      httpMock.expectOne('/api/test').flush({}, { status: 401, statusText: 'Unauthorized' });
      tick();

      expect(errorCode).toBe(401);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve ocultar loading após erro 403', fakeAsync(() => {
      let errorCode = 0;
      httpClient.get('/api/test').subscribe({
        error: (err) => { errorCode = err.status; }
      });

      httpMock.expectOne('/api/test').flush({}, { status: 403, statusText: 'Forbidden' });
      tick();

      expect(errorCode).toBe(403);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve ocultar loading após erro 404', fakeAsync(() => {
      let errorCode = 0;
      httpClient.get('/api/test').subscribe({
        error: (err) => { errorCode = err.status; }
      });

      httpMock.expectOne('/api/test').flush({}, { status: 404, statusText: 'Not Found' });
      tick();

      expect(errorCode).toBe(404);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve ocultar loading após erro 500', fakeAsync(() => {
      let errorCode = 0;
      httpClient.get('/api/test').subscribe({
        error: (err) => { errorCode = err.status; }
      });

      httpMock.expectOne('/api/test').flush({}, { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(errorCode).toBe(500);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve ocultar loading após erro 502', fakeAsync(() => {
      let errorCode = 0;
      httpClient.get('/api/test').subscribe({
        error: (err) => { errorCode = err.status; }
      });

      httpMock.expectOne('/api/test').flush({}, { status: 502, statusText: 'Bad Gateway' });
      tick();

      expect(errorCode).toBe(502);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve ocultar loading após erro 503', fakeAsync(() => {
      let errorCode = 0;
      httpClient.get('/api/test').subscribe({
        error: (err) => { errorCode = err.status; }
      });

      httpMock.expectOne('/api/test').flush({}, { status: 503, statusText: 'Service Unavailable' });
      tick();

      expect(errorCode).toBe(503);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));
  });

  describe('✅ Cenários de Sucesso', () => {
    it('deve funcionar com resposta JSON', fakeAsync(() => {
      let response: any;
      httpClient.get('/api/data').subscribe({
        next: (data) => { response = data; }
      });

      httpMock.expectOne('/api/data').flush({ id: 1, name: 'Test' });
      tick();

      expect(response).toEqual({ id: 1, name: 'Test' });
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve funcionar com resposta array', fakeAsync(() => {
      let response: any;
      httpClient.get('/api/list').subscribe({
        next: (data) => { response = data; }
      });

      httpMock.expectOne('/api/list').flush([1, 2, 3]);
      tick();

      expect(response).toEqual([1, 2, 3]);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));

    it('deve funcionar com resposta vazia', fakeAsync(() => {
      let completed = false;
      httpClient.get('/api/empty').subscribe({
        next: () => { completed = true; }
      });

      httpMock.expectOne('/api/empty').flush(null);
      tick();

      expect(completed).toBe(true);
      expect(mockLoadingService.hide).toHaveBeenCalled();
    }));
  });
});
