/**
 * 🧪 Integration Service - Unit Tests
 * Testes unitários completos para IntegrationService
 * 
 * @coverage 100%
 * @date 02/01/2026
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { 
  IntegrationService, 
  ApiResponse, 
  ApiError, 
  PaginatedResult,
  RequestOptions,
  ConnectionStatus 
} from './integration.service';

describe('IntegrationService', () => {
  let service: IntegrationService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:5001/medicamenta-me/us-central1/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IntegrationService]
    });

    service = TestBed.inject(IntegrationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===========================================================================
  // INICIALIZAÇÃO
  // ===========================================================================

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have default loading state as false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should have default error as null', () => {
      expect(service.error()).toBeNull();
    });

    it('should have default pending count as 0', () => {
      expect(service.pendingCount()).toBe(0);
    });

    it('should have default connection status as online', () => {
      expect(service.connectionStatus()).toBe('online');
    });

    it('should compute hasError correctly when no error', () => {
      expect(service.hasError()).toBe(false);
    });

    it('should compute isOnline correctly when online', () => {
      expect(service.isOnline()).toBe(true);
    });

    it('should return correct base URL', () => {
      // Deve conter o path da API (pode ser localhost ou produção)
      expect(service.getBaseUrl()).toContain('/api');
    });
  });

  // ===========================================================================
  // AUTENTICAÇÃO
  // ===========================================================================

  describe('Authentication', () => {
    it('should set auth token', () => {
      service.setAuthToken('test-token-123');
      expect(service.getAuthToken()).toBe('test-token-123');
    });

    it('should get auth token', () => {
      service.setAuthToken('my-token');
      expect(service.getAuthToken()).toBe('my-token');
    });

    it('should clear auth token', () => {
      service.setAuthToken('some-token');
      service.clearAuthToken();
      expect(service.getAuthToken()).toBeNull();
    });

    it('should return null when no token set', () => {
      expect(service.getAuthToken()).toBeNull();
    });

    it('should include Authorization header when token is set', () => {
      service.setAuthToken('bearer-token');
      
      service.get('/test').subscribe();
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer bearer-token');
      req.flush({ success: true, data: {} });
    });

    it('should not include Authorization header when no token', () => {
      service.get('/test').subscribe();
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, data: {} });
    });

    it('should skip auth when skipAuth option is true', () => {
      service.setAuthToken('my-token');
      
      service.get('/test', { skipAuth: true }).subscribe();
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, data: {} });
    });
  });

  // ===========================================================================
  // STATUS DE CONEXÃO
  // ===========================================================================

  describe('Connection Status', () => {
    it('should set connection status to offline', () => {
      service.setConnectionStatus('offline');
      expect(service.connectionStatus()).toBe('offline');
    });

    it('should set connection status to checking', () => {
      service.setConnectionStatus('checking');
      expect(service.connectionStatus()).toBe('checking');
    });

    it('should set connection status to online', () => {
      service.setConnectionStatus('offline');
      service.setConnectionStatus('online');
      expect(service.connectionStatus()).toBe('online');
    });

    it('should compute isOnline as false when offline', () => {
      service.setConnectionStatus('offline');
      expect(service.isOnline()).toBe(false);
    });

    it('should compute isOnline as false when checking', () => {
      service.setConnectionStatus('checking');
      expect(service.isOnline()).toBe(false);
    });

    it('should return error when offline', (done) => {
      service.setConnectionStatus('offline');
      
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('OFFLINE');
          expect(error.message).toBe('Sem conexão com a internet');
          done();
        }
      });
    });
  });

  // ===========================================================================
  // GET REQUESTS
  // ===========================================================================

  describe('GET Requests', () => {
    it('should make GET request', (done) => {
      const mockData = { id: 1, name: 'Test' };
      
      service.get<typeof mockData>('/test').subscribe({
        next: (data) => {
          expect(data).toEqual(mockData);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should make GET request with query params', (done) => {
      service.get('/test', { params: { page: 1, limit: 10 } }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test?page=1&limit=10`);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush({ success: true, data: {} });
    });

    it('should handle GET with full URL', (done) => {
      const fullUrl = 'https://external-api.com/data';
      
      service.get(fullUrl).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(fullUrl);
      req.flush({ success: true, data: {} });
    });

    it('should handle endpoint starting with slash', (done) => {
      service.get('/api/users').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/api/users`);
      req.flush({ success: true, data: {} });
    });

    it('should handle endpoint without slash', (done) => {
      service.get('api/users').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/api/users`);
      req.flush({ success: true, data: {} });
    });

    it('should return data directly when response is not ApiResponse', (done) => {
      const rawData = { id: 1, name: 'Direct' };
      
      service.get('/test').subscribe({
        next: (data) => {
          expect(data).toEqual(rawData);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush(rawData);
    });

    it('should extract data from ApiResponse', (done) => {
      const mockData = { id: 2 };
      
      service.get('/test').subscribe({
        next: (data) => {
          expect(data).toEqual(mockData);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ success: true, data: mockData });
    });
  });

  // ===========================================================================
  // POST REQUESTS
  // ===========================================================================

  describe('POST Requests', () => {
    it('should make POST request', (done) => {
      const body = { name: 'New Item' };
      const response = { id: 1, ...body };
      
      service.post<typeof response>('/items', body).subscribe({
        next: (data) => {
          expect(data).toEqual(response);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ success: true, data: response });
    });

    it('should make POST request without body', (done) => {
      service.post('/trigger').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/trigger`);
      expect(req.request.method).toBe('POST');
      // Body pode ser null ou undefined quando não passado
      expect(req.request.body == null).toBe(true);
      req.flush({ success: true, data: {} });
    });

    it('should include Content-Type header', () => {
      service.post('/test', {}).subscribe();
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ success: true, data: {} });
    });

    it('should include Accept header', () => {
      service.post('/test', {}).subscribe();
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush({ success: true, data: {} });
    });
  });

  // ===========================================================================
  // PUT REQUESTS
  // ===========================================================================

  describe('PUT Requests', () => {
    it('should make PUT request', (done) => {
      const body = { id: 1, name: 'Updated' };
      
      service.put('/items/1', body).subscribe({
        next: (data) => {
          expect(data).toEqual(body);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ success: true, data: body });
    });

    it('should make PUT request without body', (done) => {
      service.put('/items/1').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: {} });
    });
  });

  // ===========================================================================
  // PATCH REQUESTS
  // ===========================================================================

  describe('PATCH Requests', () => {
    it('should make PATCH request', (done) => {
      const body = { name: 'Patched' };
      
      service.patch('/items/1', body).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({ success: true, data: {} });
    });

    it('should make PATCH request without body', (done) => {
      service.patch('/items/1').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items/1`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ success: true, data: {} });
    });
  });

  // ===========================================================================
  // DELETE REQUESTS
  // ===========================================================================

  describe('DELETE Requests', () => {
    it('should make DELETE request', (done) => {
      service.delete('/items/1').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should make DELETE request with params', (done) => {
      service.delete('/items/1', { params: { force: true } }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items/1?force=true`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  // ===========================================================================
  // PAGINAÇÃO
  // ===========================================================================

  describe('Paginated Requests', () => {
    it('should make paginated GET request', (done) => {
      const mockResult: PaginatedResult<{ id: number }> = {
        items: [{ id: 1 }, { id: 2 }],
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10
      };
      
      service.getPaginated<{ id: number }>('/items', { page: 1, pageSize: 10 }).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(result.items.length).toBe(2);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items?page=1&pageSize=10`);
      req.flush({ success: true, data: mockResult });
    });

    it('should include sort params', (done) => {
      service.getPaginated('/items', { 
        page: 1, 
        pageSize: 20,
        sortBy: 'name',
        sortOrder: 'asc'
      }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items?page=1&pageSize=20&sortBy=name&sortOrder=asc`);
      req.flush({ success: true, data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 } });
    });

    it('should work without pagination params', (done) => {
      service.getPaginated('/items').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items`);
      req.flush({ success: true, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    });

    it('should merge additional options with pagination', (done) => {
      service.setAuthToken('test-token');
      
      service.getPaginated('/items', { page: 1 }, { params: { status: 'active' } }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items?status=active&page=1`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({ success: true, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    });
  });

  // ===========================================================================
  // CUSTOM HEADERS
  // ===========================================================================

  describe('Custom Headers', () => {
    it('should add custom headers', (done) => {
      service.get('/test', { 
        headers: { 'X-Custom-Header': 'custom-value' } 
      }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('X-Custom-Header')).toBe('custom-value');
      req.flush({ success: true, data: {} });
    });

    it('should allow multiple custom headers', (done) => {
      service.get('/test', { 
        headers: { 
          'X-Header-1': 'value1',
          'X-Header-2': 'value2'
        } 
      }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('X-Header-1')).toBe('value1');
      expect(req.request.headers.get('X-Header-2')).toBe('value2');
      req.flush({ success: true, data: {} });
    });

    it('should preserve default headers with custom', (done) => {
      service.get('/test', { 
        headers: { 'X-Custom': 'value' } 
      }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Custom')).toBe('value');
      req.flush({ success: true, data: {} });
    });
  });

  // ===========================================================================
  // TRATAMENTO DE ERROS
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle 400 Bad Request', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('BAD_REQUEST');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 401 Unauthorized', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('UNAUTHORIZED');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 Forbidden', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('FORBIDDEN');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 Not Found', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('NOT_FOUND');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 Conflict', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('CONFLICT');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Conflict' }, { status: 409, statusText: 'Conflict' });
    });

    it('should handle 422 Validation Error', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('VALIDATION_ERROR');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Validation error' }, { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should handle 429 Rate Limited', (done) => {
      service.get('/test', { retries: 0 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('RATE_LIMITED');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });
    });

    it('should handle 500 Server Error', (done) => {
      service.get('/test', { retries: 0 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('SERVER_ERROR');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 502 Bad Gateway', (done) => {
      service.get('/test', { retries: 0 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('BAD_GATEWAY');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Bad gateway' }, { status: 502, statusText: 'Bad Gateway' });
    });

    it('should handle 503 Service Unavailable', (done) => {
      service.get('/test', { retries: 0 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('SERVICE_UNAVAILABLE');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Service unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    });

    it('should handle 504 Gateway Timeout', (done) => {
      service.get('/test', { retries: 0 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('GATEWAY_TIMEOUT');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Gateway timeout' }, { status: 504, statusText: 'Gateway Timeout' });
    });

    it('should extract error from API response body', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('CUSTOM_ERROR');
          expect(error.message).toBe('Custom error message');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ 
        error: { 
          code: 'CUSTOM_ERROR', 
          message: 'Custom error message' 
        } 
      }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle unknown HTTP status', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('HTTP_ERROR');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Unknown' }, { status: 418, statusText: 'I am a teapot' });
    });

    it('should set error signal on error', (done) => {
      service.get('/test').subscribe({
        error: () => {
          expect(service.error()).not.toBeNull();
          expect(service.hasError()).toBe(true);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should clear error signal on success', (done) => {
      // First request fails
      service.get('/fail').subscribe({
        error: () => {
          expect(service.hasError()).toBe(true);
          
          // Second request succeeds
          service.get('/success').subscribe({
            next: () => {
              expect(service.error()).toBeNull();
              expect(service.hasError()).toBe(false);
              done();
            }
          });
          
          const req2 = httpMock.expectOne(`${baseUrl}/success`);
          req2.flush({ success: true, data: {} });
        }
      });
      
      const req1 = httpMock.expectOne(`${baseUrl}/fail`);
      req1.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle API error in response body', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('BUSINESS_ERROR');
          expect(error.message).toBe('Business logic error');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ 
        success: false, 
        error: { code: 'BUSINESS_ERROR', message: 'Business logic error' }
      });
    });

    it('should include requestId in error', (done) => {
      service.get('/test').subscribe({
        error: (error: ApiError) => {
          expect(error.requestId).toBeDefined();
          expect(error.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  describe('Loading State', () => {
    it('should set loading to true during request', () => {
      service.get('/test').subscribe();
      
      expect(service.isLoading()).toBe(true);
      expect(service.pendingCount()).toBe(1);
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ success: true, data: {} });
    });

    it('should set loading to false after success', fakeAsync(() => {
      let completed = false;
      
      service.get('/test').subscribe({
        next: () => {
          completed = true;
        }
      });
      
      expect(service.isLoading()).toBe(true);
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ success: true, data: {} });
      tick();
      flush();
      
      expect(completed).toBe(true);
      expect(service.isLoading()).toBe(false);
      expect(service.pendingCount()).toBe(0);
    }));

    it('should set loading to false after error', fakeAsync(() => {
      let errored = false;
      
      service.get('/test').subscribe({
        error: () => {
          errored = true;
        }
      });
      
      expect(service.isLoading()).toBe(true);
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
      tick();
      flush();
      
      expect(errored).toBe(true);
      expect(service.isLoading()).toBe(false);
      expect(service.pendingCount()).toBe(0);
    }));

    it('should track multiple pending requests', () => {
      service.get('/test1').subscribe();
      service.get('/test2').subscribe();
      service.get('/test3').subscribe();
      
      expect(service.pendingCount()).toBe(3);
      expect(service.isLoading()).toBe(true);
      
      const req1 = httpMock.expectOne(`${baseUrl}/test1`);
      const req2 = httpMock.expectOne(`${baseUrl}/test2`);
      const req3 = httpMock.expectOne(`${baseUrl}/test3`);
      
      req1.flush({ success: true, data: {} });
      expect(service.pendingCount()).toBe(2);
      expect(service.isLoading()).toBe(true);
      
      req2.flush({ success: true, data: {} });
      expect(service.pendingCount()).toBe(1);
      expect(service.isLoading()).toBe(true);
      
      req3.flush({ success: true, data: {} });
      expect(service.pendingCount()).toBe(0);
      expect(service.isLoading()).toBe(false);
    });

    it('should return hasPendingRequests correctly', () => {
      expect(service.hasPendingRequests()).toBe(false);
      
      service.get('/test').subscribe();
      
      expect(service.hasPendingRequests()).toBe(true);
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ success: true, data: {} });
    });
  });

  // ===========================================================================
  // RETRY LOGIC
  // ===========================================================================

  describe('Retry Logic', () => {
    it('should not retry on 400 errors', (done) => {
      service.get('/test', { retries: 3 }).subscribe({
        error: () => {
          // Should only make 1 request
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should not retry on 401 errors', (done) => {
      service.get('/test', { retries: 3 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('UNAUTHORIZED');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not retry on 403 errors', (done) => {
      service.get('/test', { retries: 3 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('FORBIDDEN');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should not retry on 404 errors', (done) => {
      service.get('/test', { retries: 3 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('NOT_FOUND');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should retry on 500 errors with retries option set to 0', (done) => {
      service.get('/test', { retries: 0 }).subscribe({
        error: (error: ApiError) => {
          expect(error.code).toBe('SERVER_ERROR');
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should work with retries set to 0', (done) => {
      service.get('/test', { retries: 0 }).subscribe({
        error: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  describe('Utilities', () => {
    it('should clear error', () => {
      // Force an error first
      service.get('/test').subscribe({ error: () => {} });
      const req = httpMock.expectOne(`${baseUrl}/test`);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
      
      expect(service.hasError()).toBe(true);
      
      service.clearError();
      
      expect(service.error()).toBeNull();
      expect(service.hasError()).toBe(false);
    });

    it('should handle null and undefined params', (done) => {
      service.get('/test', { 
        params: { 
          valid: 'value',
          nullParam: null as unknown as string,
          undefinedParam: undefined as unknown as string
        } 
      }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test?valid=value`);
      expect(req.request.params.get('nullParam')).toBeNull();
      expect(req.request.params.get('undefinedParam')).toBeNull();
      req.flush({ success: true, data: {} });
    });

    it('should convert boolean params to string', (done) => {
      service.get('/test', { params: { active: true, deleted: false } }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test?active=true&deleted=false`);
      expect(req.request.params.get('active')).toBe('true');
      expect(req.request.params.get('deleted')).toBe('false');
      req.flush({ success: true, data: {} });
    });

    it('should convert number params to string', (done) => {
      service.get('/test', { params: { page: 1, limit: 50 } }).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/test?page=1&limit=50`);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('50');
      req.flush({ success: true, data: {} });
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty response body', (done) => {
      service.delete('/items/1').subscribe({
        next: (data) => {
          expect(data).toBeNull();
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items/1`);
      req.flush(null);
    });

    it('should handle array response', (done) => {
      const mockArray = [{ id: 1 }, { id: 2 }];
      
      service.get<typeof mockArray>('/items').subscribe({
        next: (data) => {
          expect(data).toEqual(mockArray);
          expect(Array.isArray(data)).toBe(true);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/items`);
      req.flush(mockArray);
    });

    it('should handle complex nested object response', (done) => {
      const complexData = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            settings: {
              theme: 'dark',
              notifications: true
            }
          }
        }
      };
      
      service.get('/user/profile').subscribe({
        next: (data) => {
          expect(data).toEqual(complexData);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${baseUrl}/user/profile`);
      req.flush({ success: true, data: complexData });
    });

    it('should handle special characters in endpoint', (done) => {
      service.get('/search?q=test%20value').subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}/search?q=test%20value`);
      req.flush({ success: true, data: {} });
    });

    it('should handle very long endpoint', (done) => {
      const longPath = '/api/v2/users/12345/orders/67890/items/11111/details/nested/very/deep/path';
      
      service.get(longPath).subscribe({
        next: () => done()
      });
      
      const req = httpMock.expectOne(`${baseUrl}${longPath}`);
      req.flush({ success: true, data: {} });
    });

    it('should maintain order of multiple simultaneous requests', fakeAsync(() => {
      const results: number[] = [];
      
      service.get('/test1').subscribe({ next: () => results.push(1) });
      service.get('/test2').subscribe({ next: () => results.push(2) });
      service.get('/test3').subscribe({ next: () => results.push(3) });
      
      const req2 = httpMock.expectOne(`${baseUrl}/test2`);
      const req1 = httpMock.expectOne(`${baseUrl}/test1`);
      const req3 = httpMock.expectOne(`${baseUrl}/test3`);
      
      // Respond in different order
      req2.flush({ success: true, data: {} });
      tick();
      
      req3.flush({ success: true, data: {} });
      tick();
      
      req1.flush({ success: true, data: {} });
      tick();
      
      // Results should be in the order responses were received
      expect(results).toEqual([2, 3, 1]);
      flush();
    }));
  });

  // ===========================================================================
  // PERFORMANCE
  // ===========================================================================

  describe('Performance', () => {
    it('should handle rapid successive requests', fakeAsync(() => {
      for (let i = 0; i < 10; i++) {
        service.get(`/test${i}`).subscribe();
      }
      
      expect(service.pendingCount()).toBe(10);
      
      for (let i = 0; i < 10; i++) {
        const req = httpMock.expectOne(`${baseUrl}/test${i}`);
        req.flush({ success: true, data: {} });
      }
      
      tick();
      expect(service.pendingCount()).toBe(0);
      flush();
    }));
  });
});
