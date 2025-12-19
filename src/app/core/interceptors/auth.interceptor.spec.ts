/**
 * 🧪 Auth Interceptor Tests
 */

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    mockAuth = jasmine.createSpyObj('Auth', [], {
      currentUser: null
    });

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

  it('deve adicionar token de autenticação se usuário logado', (done) => {
    const mockToken = 'mock-firebase-token-12345';
    const mockUser = {
      uid: 'test-user',
      getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve(mockToken))
    };

    (mockAuth as any).currentUser = mockUser;

    httpClient.get('/api/test').subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush({});
  });

  it('deve prosseguir sem token se usuário não logado', () => {
    (mockAuth as any).currentUser = null;

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('deve adicionar token em múltiplas requisições', (done) => {
    const mockToken = 'mock-token-abc';
    const mockUser = {
      uid: 'test-user',
      getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve(mockToken))
    };

    (mockAuth as any).currentUser = mockUser;

    httpClient.get('/api/products').subscribe();
    httpClient.get('/api/cart').subscribe(() => done());

    const req1 = httpMock.expectOne('/api/products');
    const req2 = httpMock.expectOne('/api/cart');

    expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req1.flush({});
    req2.flush({});
  });
});
