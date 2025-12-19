/**
 * 🧪 Loading Interceptor Tests
 */

import { TestBed } from '@angular/core/testing';
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

  it('deve exibir loading ao iniciar requisição', () => {
    httpClient.get('/api/test').subscribe();

    expect(mockLoadingService.show).toHaveBeenCalledTimes(1);

    const req = httpMock.expectOne('/api/test');
    req.flush({});
  });

  it('deve ocultar loading após requisição bem-sucedida', (done) => {
    httpClient.get('/api/test').subscribe(() => {
      expect(mockLoadingService.hide).toHaveBeenCalledTimes(1);
      done();
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({});
  });

  it('deve ocultar loading após erro na requisição', (done) => {
    httpClient.get('/api/test').subscribe({
      error: () => {
        expect(mockLoadingService.hide).toHaveBeenCalledTimes(1);
        done();
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 500, statusText: 'Server Error' });
  });

  it('deve gerenciar loading em múltiplas requisições paralelas', (done) => {
    httpClient.get('/api/test1').subscribe();
    httpClient.get('/api/test2').subscribe(() => {
      // Show deve ser chamado 2x (uma por requisição)
      expect(mockLoadingService.show).toHaveBeenCalledTimes(2);
      // Hide deve ser chamado 2x (uma por requisição finalizada)
      expect(mockLoadingService.hide).toHaveBeenCalledTimes(2);
      done();
    });

    const req1 = httpMock.expectOne('/api/test1');
    const req2 = httpMock.expectOne('/api/test2');

    req1.flush({});
    req2.flush({});
  });
});
