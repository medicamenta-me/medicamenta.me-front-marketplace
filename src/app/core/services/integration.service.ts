/**
 * 🔗 Integration Service
 * Serviço para integração com Backend API v2
 * Centraliza todas as chamadas HTTP para o backend
 * 
 * @version 1.0.0
 * @date 02/01/2026
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer, BehaviorSubject, of, EMPTY } from 'rxjs';
import { catchError, tap, finalize, map, timeout, retry, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * Erro da API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Metadados da resposta
 */
export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
}

/**
 * Parâmetros de paginação
 */
export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Opções de requisição
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
}

/**
 * Status de conexão
 */
export type ConnectionStatus = 'online' | 'offline' | 'checking';

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 segundos
const DEFAULT_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const MAX_RETRY_DELAY = 10000; // 10 segundos

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private readonly http = inject(HttpClient);

  // Base URL da API
  private readonly baseUrl = environment.apiUrl || 'https://us-central1-medicamenta-me.cloudfunctions.net/api';

  // Estado interno
  private pendingRequests = 0;
  private readonly connectionStatus$ = new BehaviorSubject<ConnectionStatus>('online');

  // Signals públicos
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<ApiError | null>(null);
  readonly pendingCount = signal<number>(0);
  readonly connectionStatus = signal<ConnectionStatus>('online');

  // Computed
  readonly hasError = computed(() => this.error() !== null);
  readonly isOnline = computed(() => this.connectionStatus() === 'online');

  // Token de autenticação (será injetado externamente)
  private authToken: string | null = null;

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  /**
   * Define o token de autenticação
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Retorna o token atual
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Limpa o token de autenticação
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Define o status de conexão
   */
  setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus.set(status);
    this.connectionStatus$.next(status);
  }

  // ============================================================================
  // MÉTODOS HTTP PÚBLICOS
  // ============================================================================

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // ============================================================================
  // API V2 ESPECÍFICOS
  // ============================================================================

  /**
   * GET paginado
   */
  getPaginated<T>(
    endpoint: string,
    pagination?: PaginatedRequest,
    options?: RequestOptions
  ): Observable<PaginatedResult<T>> {
    const params: Record<string, string | number> = {};
    
    if (pagination?.page !== undefined) params['page'] = pagination.page;
    if (pagination?.pageSize !== undefined) params['pageSize'] = pagination.pageSize;
    if (pagination?.sortBy) params['sortBy'] = pagination.sortBy;
    if (pagination?.sortOrder) params['sortOrder'] = pagination.sortOrder;

    return this.get<PaginatedResult<T>>(endpoint, {
      ...options,
      params: { ...options?.params, ...params }
    });
  }

  // ============================================================================
  // MÉTODOS INTERNOS
  // ============================================================================

  /**
   * Executa uma requisição HTTP
   */
  private request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Observable<T> {
    // Verificar conexão
    if (this.connectionStatus() === 'offline') {
      return throwError(() => this.createError('OFFLINE', 'Sem conexão com a internet'));
    }

    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options);
    const params = this.buildParams(options?.params);
    const requestTimeout = options?.timeout || DEFAULT_TIMEOUT;
    const maxRetries = options?.retries ?? DEFAULT_RETRIES;

    this.incrementPending();

    const request$ = this.executeRequest<T>(method, url, body, headers, params);

    return request$.pipe(
      timeout(requestTimeout),
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          // Não faz retry para certos erros
          if (this.shouldNotRetry(error)) {
            return throwError(() => error);
          }
          // Calcula delay exponencial
          const delay = Math.min(RETRY_DELAY * Math.pow(2, retryCount - 1), MAX_RETRY_DELAY);
          return timer(delay);
        }
      }),
      map(response => this.extractData<T>(response)),
      catchError(error => this.handleError(error)),
      tap({
        next: () => this.error.set(null),
        error: (err) => this.error.set(err)
      }),
      finalize(() => this.decrementPending())
    );
  }

  /**
   * Executa a requisição HTTP baseada no método
   */
  private executeRequest<T>(
    method: string,
    url: string,
    body: unknown,
    headers: HttpHeaders,
    params: HttpParams
  ): Observable<ApiResponse<T> | T> {
    const httpOptions = { headers, params };

    switch (method) {
      case 'GET':
        return this.http.get<ApiResponse<T> | T>(url, httpOptions);
      case 'POST':
        return this.http.post<ApiResponse<T> | T>(url, body, httpOptions);
      case 'PUT':
        return this.http.put<ApiResponse<T> | T>(url, body, httpOptions);
      case 'PATCH':
        return this.http.patch<ApiResponse<T> | T>(url, body, httpOptions);
      case 'DELETE':
        return this.http.delete<ApiResponse<T> | T>(url, httpOptions);
      default:
        return throwError(() => this.createError('INVALID_METHOD', `Método HTTP inválido: ${method}`));
    }
  }

  /**
   * Constrói a URL completa
   */
  private buildUrl(endpoint: string): string {
    // Se já é uma URL completa, retorna
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Remove barra inicial se existir
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Remove barra final do baseUrl se existir
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Constrói os headers da requisição
   */
  private buildHeaders(options?: RequestOptions): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Adiciona token de autenticação se disponível e não for skipAuth
    if (this.authToken && !options?.skipAuth) {
      headers = headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    // Adiciona headers customizados
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Constrói os parâmetros da requisição
   */
  private buildParams(params?: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return httpParams;
  }

  /**
   * Extrai dados da resposta
   */
  private extractData<T>(response: ApiResponse<T> | T): T {
    // Se a resposta tem a estrutura padrão da API
    if (this.isApiResponse(response)) {
      if (!response.success && response.error) {
        throw response.error;
      }
      return response.data as T;
    }
    
    // Retorna diretamente se não seguir o padrão
    return response;
  }

  /**
   * Verifica se é uma ApiResponse
   */
  private isApiResponse<T>(response: unknown): response is ApiResponse<T> {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response
    );
  }

  /**
   * Trata erros da requisição
   */
  private handleError(error: unknown): Observable<never> {
    let apiError: ApiError;

    if (error instanceof HttpErrorResponse) {
      // Erro HTTP
      apiError = this.extractHttpError(error);
    } else if (this.isApiError(error)) {
      // Erro da API
      apiError = error;
    } else if (error instanceof Error) {
      // Erro de timeout ou outro
      if (error.name === 'TimeoutError') {
        apiError = this.createError('TIMEOUT', 'Tempo limite da requisição excedido');
      } else {
        apiError = this.createError('UNKNOWN', error.message);
      }
    } else {
      // Erro desconhecido
      apiError = this.createError('UNKNOWN', 'Erro desconhecido');
    }

    return throwError(() => apiError);
  }

  /**
   * Extrai erro de HttpErrorResponse
   */
  private extractHttpError(error: HttpErrorResponse): ApiError {
    // Tenta extrair erro do body
    if (error.error?.error) {
      return error.error.error as ApiError;
    }

    // Mapeia códigos HTTP para erros
    const errorMap: Record<number, { code: string; message: string }> = {
      400: { code: 'BAD_REQUEST', message: 'Requisição inválida' },
      401: { code: 'UNAUTHORIZED', message: 'Não autorizado' },
      403: { code: 'FORBIDDEN', message: 'Acesso negado' },
      404: { code: 'NOT_FOUND', message: 'Recurso não encontrado' },
      409: { code: 'CONFLICT', message: 'Conflito de dados' },
      422: { code: 'VALIDATION_ERROR', message: 'Erro de validação' },
      429: { code: 'RATE_LIMITED', message: 'Muitas requisições' },
      500: { code: 'SERVER_ERROR', message: 'Erro interno do servidor' },
      502: { code: 'BAD_GATEWAY', message: 'Gateway inválido' },
      503: { code: 'SERVICE_UNAVAILABLE', message: 'Serviço indisponível' },
      504: { code: 'GATEWAY_TIMEOUT', message: 'Timeout do gateway' }
    };

    const mapped = errorMap[error.status];
    if (mapped) {
      return this.createError(mapped.code, error.error?.message || mapped.message);
    }

    return this.createError(
      'HTTP_ERROR',
      error.error?.message || error.message || 'Erro de comunicação'
    );
  }

  /**
   * Verifica se é um ApiError
   */
  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }

  /**
   * Cria um ApiError
   */
  private createError(code: string, message: string, details?: Record<string, unknown>): ApiError {
    return {
      code,
      message,
      details,
      requestId: this.generateRequestId()
    };
  }

  /**
   * Gera um ID único para a requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica se não deve fazer retry
   */
  private shouldNotRetry(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      // Não faz retry para erros 4xx (exceto 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        return true;
      }
    }

    if (this.isApiError(error)) {
      const noRetryErrors = ['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION_ERROR', 'BAD_REQUEST'];
      return noRetryErrors.includes(error.code);
    }

    return false;
  }

  // ============================================================================
  // CONTROLE DE PENDING
  // ============================================================================

  /**
   * Incrementa contador de requisições pendentes
   */
  private incrementPending(): void {
    this.pendingRequests++;
    this.pendingCount.set(this.pendingRequests);
    this.isLoading.set(true);
  }

  /**
   * Decrementa contador de requisições pendentes
   */
  private decrementPending(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    this.pendingCount.set(this.pendingRequests);
    if (this.pendingRequests === 0) {
      this.isLoading.set(false);
    }
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  /**
   * Limpa erro atual
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Verifica se há requisições pendentes
   */
  hasPendingRequests(): boolean {
    return this.pendingRequests > 0;
  }

  /**
   * Retorna a URL base configurada
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
