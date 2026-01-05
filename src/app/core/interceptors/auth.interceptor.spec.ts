/**
 * 🧪 Auth Interceptor Tests
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuth: any;

  beforeEach(() => {
    mockAuth = {
      currentUser: null
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: mockAuth }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('✅ Usuário Não Autenticado', () => {
    it('deve prosseguir sem token se usuário não logado', () => {
      mockAuth.currentUser = null;

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('não deve ter header Authorization quando currentUser é null', () => {
      mockAuth.currentUser = null;

      httpClient.get('/api/public').subscribe();

      const req = httpMock.expectOne('/api/public');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('deve funcionar com diferentes endpoints sem autenticação', () => {
      mockAuth.currentUser = null;

      httpClient.get('/api/products').subscribe();
      httpClient.get('/api/pharmacies').subscribe();

      const req1 = httpMock.expectOne('/api/products');
      const req2 = httpMock.expectOne('/api/pharmacies');

      expect(req1.request.headers.has('Authorization')).toBe(false);
      expect(req2.request.headers.has('Authorization')).toBe(false);

      req1.flush({});
      req2.flush({});
    });

    it('deve manter outros headers quando não autenticado', () => {
      mockAuth.currentUser = null;

      httpClient.get('/api/test', {
        headers: { 'Custom-Header': 'value' }
      }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Custom-Header')).toBe('value');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('✅ Usuário Autenticado', () => {
    it('deve adicionar token de autenticação se usuário logado', fakeAsync(() => {
      const mockToken = 'mock-firebase-token-12345';
      mockAuth.currentUser = {
        uid: 'test-user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      let completed = false;
      httpClient.get('/api/test').subscribe(() => {
        completed = true;
      });

      tick(); // Resolve the Promise from getIdToken

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});

      tick();
      expect(completed).toBe(true);
    }));

    it('deve adicionar token em múltiplas requisições', fakeAsync(() => {
      const mockToken = 'mock-token-abc';
      mockAuth.currentUser = {
        uid: 'test-user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      let count = 0;
      httpClient.get('/api/products').subscribe(() => count++);
      httpClient.get('/api/cart').subscribe(() => count++);

      tick(); // Resolve getIdToken promises

      const req1 = httpMock.expectOne('/api/products');
      const req2 = httpMock.expectOne('/api/cart');

      expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

      req1.flush({});
      req2.flush({});

      tick();
      expect(count).toBe(2);
    }));

    it('deve formatar token com Bearer prefix', fakeAsync(() => {
      const mockToken = 'simple-token';
      mockAuth.currentUser = {
        uid: 'user-123',
        getIdToken: () => Promise.resolve(mockToken)
      };

      httpClient.get('/api/data').subscribe();

      tick();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toContain('Bearer ');
      expect(req.request.headers.get('Authorization')).toBe('Bearer simple-token');
      req.flush({});
    }));

    it('deve manter headers existentes ao adicionar Authorization', fakeAsync(() => {
      const mockToken = 'auth-token';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      httpClient.get('/api/test', {
        headers: { 'Content-Type': 'application/json' }
      }).subscribe();

      tick();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer auth-token');
      req.flush({});
    }));
  });

  describe('✅ Diferentes Métodos HTTP', () => {
    it('deve adicionar token para requisição POST', fakeAsync(() => {
      const mockToken = 'post-token';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      httpClient.post('/api/create', { data: 'test' }).subscribe();

      tick();

      const req = httpMock.expectOne('/api/create');
      expect(req.request.headers.get('Authorization')).toBe('Bearer post-token');
      req.flush({});
    }));

    it('deve adicionar token para requisição PUT', fakeAsync(() => {
      const mockToken = 'put-token';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      httpClient.put('/api/update/1', { data: 'updated' }).subscribe();

      tick();

      const req = httpMock.expectOne('/api/update/1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer put-token');
      req.flush({});
    }));

    it('deve adicionar token para requisição DELETE', fakeAsync(() => {
      const mockToken = 'delete-token';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      httpClient.delete('/api/delete/1').subscribe();

      tick();

      const req = httpMock.expectOne('/api/delete/1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer delete-token');
      req.flush({});
    }));

    it('deve adicionar token para requisição PATCH', fakeAsync(() => {
      const mockToken = 'patch-token';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      httpClient.patch('/api/partial/1', { field: 'value' }).subscribe();

      tick();

      const req = httpMock.expectOne('/api/partial/1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer patch-token');
      req.flush({});
    }));
  });

  describe('✅ Diferentes Tokens', () => {
    it('deve funcionar com tokens curtos', fakeAsync(() => {
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve('abc')
      };

      httpClient.get('/api/test').subscribe();

      tick();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
      req.flush({});
    }));

    it('deve funcionar com tokens longos', fakeAsync(() => {
      const longToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbWVkaWNhbWVudGEtbWUiLCJhdWQiOiJtZWRpY2FtZW50YS1tZSIsImF1dGhfdGltZSI6MTYzNjAwMDAwMCwidXNlcl9pZCI6InRlc3QtdXNlci1pZCIsInN1YiI6InRlc3QtdXNlci1pZCIsImlhdCI6MTYzNjAwMDAwMCwiZXhwIjoxNjM2MDAzNjAwfQ.signature';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(longToken)
      };

      httpClient.get('/api/test').subscribe();

      tick();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${longToken}`);
      req.flush({});
    }));
  });

  describe('✅ Respostas e Erros', () => {
    it('deve processar resposta de sucesso após adicionar token', fakeAsync(() => {
      const mockToken = 'token';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      let response: any;
      httpClient.get('/api/data').subscribe({
        next: (data) => { response = data; }
      });

      tick();

      httpMock.expectOne('/api/data').flush({ success: true });
      tick();

      expect(response).toEqual({ success: true });
    }));

    it('deve processar erro após adicionar token', fakeAsync(() => {
      const mockToken = 'token';
      mockAuth.currentUser = {
        uid: 'user',
        getIdToken: () => Promise.resolve(mockToken)
      };

      let errorStatus = 0;
      httpClient.get('/api/protected').subscribe({
        error: (err) => { errorStatus = err.status; }
      });

      tick();

      httpMock.expectOne('/api/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
      tick();

      expect(errorStatus).toBe(401);
    }));
  });
});
