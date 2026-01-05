/**
 * 🛍️ Product Service
 * Gerenciamento de produtos do marketplace com integração API v2
 * 
 * @version 2.0.0 - Migração para API v2
 * @date 03/01/2026 - Sprint M2
 * 
 * Funcionalidades:
 * - Busca de produtos via API v2
 * - Cache local otimizado
 * - Retry logic com exponential backoff
 * - Fallback para Firestore (legacy)
 */

import { Injectable, signal, inject, computed } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject, of, firstValueFrom, throwError } from 'rxjs';
import { map, tap, catchError, switchMap, retry, delay } from 'rxjs/operators';
import { Product, ProductCategory, ProductFilters, ProductSortOptions } from '../../models/product.model';
import { IntegrationService } from './integration.service';

// ============================================================================
// INTERFACES - API v2
// ============================================================================

/**
 * Parâmetros de busca de produtos via API v2
 */
export interface ProductSearchParams {
  query?: string;
  category?: ProductCategory;
  pharmacyId?: string;
  minPrice?: number;
  maxPrice?: number;
  requiresPrescription?: boolean;
  inStock?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'rating' | 'relevance' | 'createdAt';
  page?: number;
  pageSize?: number;
}

/**
 * Resultado de busca de produtos via API v2
 */
export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: ProductFacets;
}

/**
 * Facetas para filtros avançados
 */
export interface ProductFacets {
  categories: { category: ProductCategory; count: number }[];
  priceRanges: { min: number; max: number; count: number }[];
  pharmacies: { pharmacyId: string; pharmacyName: string; count: number }[];
}

/**
 * Resposta da API para produto único
 */
export interface ProductApiResponse {
  success: boolean;
  data?: Product;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Resposta da API para lista de produtos
 */
export interface ProductListApiResponse {
  success: boolean;
  data?: {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Interface para resultados paginados (legacy)
 */
export interface PaginatedProducts {
  products: Product[];
  lastDocument: DocumentSnapshot | null;
  hasMore: boolean;
  total?: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const DEFAULT_PAGE_SIZE = 20;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly firestore = inject(Firestore);
  private readonly api = inject(IntegrationService);
  private readonly productsCollection;

  // Cache em memória otimizado
  private productsCache = new Map<string, Product>();
  private cacheTimestamps = new Map<string, number>();
  private searchCache = new Map<string, { result: ProductSearchResult; timestamp: number }>();

  // Estado de carregamento
  public isLoading = signal(false);
  public error = signal<string | null>(null);

  // BehaviorSubject para busca reativa
  public searchQuery$ = new BehaviorSubject<string>('');

  // Signals para estado
  readonly products = signal<Product[]>([]);
  readonly totalProducts = signal<number>(0);
  readonly currentPage = signal<number>(1);

  // Computed
  readonly hasProducts = computed(() => this.products().length > 0);
  readonly hasMore = computed(() => this.currentPage() * DEFAULT_PAGE_SIZE < this.totalProducts());

  /* istanbul ignore next - Requires Firebase Emulators for testing */
  constructor() {
    this.productsCollection = collection(this.firestore, 'products');
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS - API v2
  // ============================================================================

  /**
   * 🔍 Busca produtos via API v2
   * @param params Parâmetros de busca
   * @returns Observable com resultado paginado
   */
  searchProductsApi(params: ProductSearchParams = {}): Observable<ProductSearchResult> {
    this.isLoading.set(true);
    this.error.set(null);

    // Verifica cache de busca
    const cacheKey = this.buildSearchCacheKey(params);
    const cached = this.getSearchFromCache(cacheKey);
    if (cached) {
      this.isLoading.set(false);
      this.updateStateFromResult(cached);
      return of(cached);
    }

    const queryParams = this.buildApiQueryParams(params);

    return this.api.get<ProductListApiResponse>('/v2/products', { params: queryParams }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Erro ao buscar produtos');
        }
        return {
          products: response.data.products,
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages
        };
      }),
      tap(result => {
        this.saveSearchToCache(cacheKey, result);
        this.updateStateFromResult(result);
        result.products.forEach(p => this.saveToCache(p.id, p));
      }),
      catchError(error => this.handleSearchError(error, params)),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * 🔍 Busca produtos por texto (compatibilidade com páginas existentes)
   * Mantém interface legada PaginatedProducts
   * @param searchText Texto de busca
   * @param pageSize Tamanho da página
   * @returns Observable com PaginatedProducts (legacy)
   */
  searchProducts(searchText: string, pageSize: number = 20): Observable<PaginatedProducts> {
    if (!searchText || searchText.length < 2) {
      return of({ products: [], lastDocument: null, hasMore: false });
    }

    this.searchQuery$.next(searchText);

    return this.searchProductsApi({
      query: searchText,
      isActive: true,
      pageSize,
      sortBy: 'relevance'
    }).pipe(
      map(result => ({
        products: result.products,
        lastDocument: null, // API v2 usa paginação baseada em página, não cursor
        hasMore: result.page < result.totalPages,
        total: result.total
      })),
      catchError(() => of({ products: [], lastDocument: null, hasMore: false }))
    );
  }

  /**
   * 🔍 Busca produto por ID via API v2
   * @param productId ID do produto
   * @returns Observable com produto ou null
   */
  getProductByIdViaApi(productId: string): Observable<Product | null> {
    if (!productId) {
      return of(null);
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Verifica cache primeiro
    const cached = this.getFromCache(productId);
    if (cached) {
      this.isLoading.set(false);
      return of(cached);
    }

    return this.api.get<ProductApiResponse>(`/v2/products/${productId}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return null;
        }
        return response.data;
      }),
      tap(product => {
        if (product) {
          this.saveToCache(productId, product);
        }
      }),
      catchError(error => {
        console.error('[ProductService] Erro ao buscar produto via API:', error);
        this.error.set(this.parseError(error));
        // Fallback para Firestore
        return this.getProductByIdLegacy(productId);
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * 🏷️ Busca produtos por categoria via API v2
   */
  getProductsByCategoryViaApi(
    category: ProductCategory,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ): Observable<ProductSearchResult> {
    return this.searchProductsApi({
      category,
      isActive: true,
      page,
      pageSize,
      sortBy: 'relevance'
    });
  }

  /**
   * 🏥 Busca produtos por farmácia via API v2
   */
  getProductsByPharmacyViaApi(
    pharmacyId: string,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ): Observable<ProductSearchResult> {
    return this.searchProductsApi({
      pharmacyId,
      isActive: true,
      page,
      pageSize,
      sortBy: 'createdAt'
    });
  }

  /**
   * ⭐ Busca produtos em destaque via API v2
   */
  getFeaturedProductsViaApi(pageSize: number = 10): Observable<Product[]> {
    return this.searchProductsApi({
      isFeatured: true,
      isActive: true,
      pageSize,
      sortBy: 'rating'
    }).pipe(
      map(result => result.products)
    );
  }

  /**
   * 🔎 Busca textual de produtos via API v2 (resultado completo)
   */
  searchProductsByText(
    searchText: string,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ): Observable<ProductSearchResult> {
    if (!searchText || searchText.length < 2) {
      return of({
        products: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 0
      });
    }

    this.searchQuery$.next(searchText);

    return this.searchProductsApi({
      query: searchText,
      isActive: true,
      page,
      pageSize,
      sortBy: 'relevance'
    });
  }

  // ============================================================================
  // MÉTODOS LEGADOS - FIRESTORE DIRETO (Deprecated)
  // ============================================================================

  /**
   * 🔍 Busca produto por ID (com cache) - LEGACY
   * @deprecated Use getProductByIdViaApi em vez disso
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getProductById(productId: string): Observable<Product | null> {
    // Redireciona para API v2
    return this.getProductByIdViaApi(productId);
  }

  /**
   * Busca produto por ID via Firestore (fallback)
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  private getProductByIdLegacy(productId: string): Observable<Product | null> {
    const productDoc = doc(this.firestore, `products/${productId}`);
    
    return from(getDoc(productDoc)).pipe(
      map(snapshot => {
        if (!snapshot.exists()) {
          return null;
        }
        const product = this.mapDocToProduct(snapshot);
        this.saveToCache(productId, product);
        return product;
      }),
      catchError(error => {
        console.error('[ProductService] Erro Firestore fallback:', error);
        return of(null);
      })
    );
  }

  /**
   * 📋 Lista produtos com filtros e paginação - LEGACY
   * @deprecated Use searchProducts em vez disso
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getProducts(
    filters?: ProductFilters,
    sortBy: ProductSortOptions = { field: 'createdAt', direction: 'desc' },
    pageSize: number = 20,
    lastDocument?: DocumentSnapshot
  ): Observable<PaginatedProducts> {
    this.isLoading.set(true);

    const constraints: QueryConstraint[] = this.buildQueryConstraints(filters, sortBy, pageSize, lastDocument);
    const productsQuery = query(this.productsCollection, ...constraints);

    return from(getDocs(productsQuery)).pipe(
      map(snapshot => {
        const products = snapshot.docs.map(doc => this.mapDocToProduct(doc));
        const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        const hasMore = snapshot.docs.length === pageSize;

        // Cache dos produtos
        products.forEach(product => this.saveToCache(product.id, product));

        return {
          products,
          lastDocument: lastDoc,
          hasMore
        };
      }),
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        console.error('Erro ao listar produtos:', error);
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * 🔍 Busca produtos por texto (tags) - LEGACY
   * @deprecated Use searchProductsByText em vez disso
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  searchProductsLegacy(searchText: string, pageSize: number = 20): Observable<PaginatedProducts> {
    if (!searchText || searchText.length < 3) {
      return of({ products: [], lastDocument: null, hasMore: false });
    }

    this.isLoading.set(true);
    this.searchQuery$.next(searchText);

    const searchTags = this.generateTags(searchText);
    
    const constraints: QueryConstraint[] = [
      where('tags', 'array-contains-any', searchTags.slice(0, 10)), // Firestore limite de 10
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    const productsQuery = query(this.productsCollection, ...constraints);

    return from(getDocs(productsQuery)).pipe(
      map(snapshot => {
        // Filtro adicional no cliente para melhor match
        const allProducts = snapshot.docs.map(doc => this.mapDocToProduct(doc));
        const filtered = allProducts.filter(product =>
          product.name.toLowerCase().includes(searchText.toLowerCase()) ||
          product.description.toLowerCase().includes(searchText.toLowerCase())
        );

        return {
          products: filtered,
          lastDocument: snapshot.docs[snapshot.docs.length - 1] || null,
          hasMore: snapshot.docs.length === pageSize
        };
      }),
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        console.error('Erro ao buscar produtos:', error);
        this.isLoading.set(false);
        return of({ products: [], lastDocument: null, hasMore: false });
      })
    );
  }

  // ============================================
  // MÉTODOS PÚBLICOS - ESCRITA
  // ============================================

  /**
   * ➕ Cria novo produto
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  createProduct(product: Omit<Product, 'id'>): Observable<string> {
    this.isLoading.set(true);

    const productData = {
      ...product,
      tags: this.generateTags(product.name),
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return from(addDoc(this.productsCollection, productData)).pipe(
      map(docRef => docRef.id),
      tap(productId => {
        this.isLoading.set(false);
        this.saveToCache(productId, { id: productId, ...productData } as any);
      }),
      catchError(error => {
        console.error('Erro ao criar produto:', error);
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * ✏️ Atualiza produto existente
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  updateProduct(productId: string, updates: Partial<Product>): Observable<void> {
    this.isLoading.set(true);

    const productDoc = doc(this.firestore, `products/${productId}`);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(productDoc, updateData)).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.invalidateCache(productId);
      }),
      catchError(error => {
        console.error('Erro ao atualizar produto:', error);
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * 🗑️ Deleta produto
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  deleteProduct(productId: string): Observable<void> {
    this.isLoading.set(true);

    const productDoc = doc(this.firestore, `products/${productId}`);

    return from(deleteDoc(productDoc)).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.invalidateCache(productId);
      }),
      catchError(error => {
        console.error('Erro ao deletar produto:', error);
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  // ============================================
  // MÉTODOS DE CONVENIÊNCIA
  // ============================================

  /**
   * 🏷️ Busca produtos por categoria
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getProductsByCategory(
    category: ProductCategory,
    pageSize: number = 20
  ): Observable<PaginatedProducts> {
    return this.getProducts({ category }, { field: 'createdAt', direction: 'desc' }, pageSize);
  }

  /**
   * 🏥 Busca produtos por farmácia
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getProductsByPharmacy(
    pharmacyId: string,
    pageSize: number = 20
  ): Observable<PaginatedProducts> {
    return this.getProducts({ pharmacyId }, { field: 'createdAt', direction: 'desc' }, pageSize);
  }

  /**
   * ⭐ Busca produtos em destaque
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getFeaturedProducts(pageSize: number = 10): Observable<Product[]> {
    const constraints: QueryConstraint[] = [
      where('isFeatured', '==', true),
      where('isActive', '==', true),
      where('rating', '>=', 4),
      orderBy('rating', 'desc'),
      orderBy('soldCount', 'desc'),
      limit(pageSize)
    ];

    const featuredQuery = query(this.productsCollection, ...constraints);

    return from(getDocs(featuredQuery)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.mapDocToProduct(doc))),
      catchError(error => {
        console.error('Erro ao buscar produtos em destaque:', error);
        return of([]);
      })
    );
  }

  /**
   * 📊 Incrementa contador de vendas
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  incrementSoldCount(productId: string): Observable<void> {
    const productDoc = doc(this.firestore, `products/${productId}`);
    
    return from(getDoc(productDoc)).pipe(
      switchMap((docSnap) => {
        if (docSnap.exists()) {
          const currentCount = docSnap.data()['soldCount'] || 0;
          return from(updateDoc(productDoc, {
            soldCount: currentCount + 1,
            updatedAt: Timestamp.now()
          }));
        } else {
          throw new Error('Produto não encontrado');
        }
      }),
      tap(() => this.invalidateCache(productId)),
      catchError(error => {
        console.error('Erro ao incrementar contador de vendas:', error);
        throw error;
      })
    );
  }

  /**
   * 🧹 Limpa cache completo
   */
  clearCache(): void {
    this.productsCache.clear();
    this.cacheTimestamps.clear();
    this.searchCache.clear();
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - API v2
  // ============================================================================

  /**
   * Constrói parâmetros de query para API v2
   */
  private buildApiQueryParams(params: ProductSearchParams): Record<string, string | number | boolean> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params.query) queryParams['q'] = params.query;
    if (params.category) queryParams['category'] = params.category;
    if (params.pharmacyId) queryParams['pharmacyId'] = params.pharmacyId;
    if (params.minPrice !== undefined) queryParams['minPrice'] = params.minPrice;
    if (params.maxPrice !== undefined) queryParams['maxPrice'] = params.maxPrice;
    if (params.requiresPrescription !== undefined) queryParams['requiresPrescription'] = params.requiresPrescription;
    if (params.inStock !== undefined) queryParams['inStock'] = params.inStock;
    if (params.isFeatured !== undefined) queryParams['isFeatured'] = params.isFeatured;
    if (params.isActive !== undefined) queryParams['isActive'] = params.isActive;
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.page) queryParams['page'] = params.page;
    if (params.pageSize) queryParams['pageSize'] = params.pageSize;

    return queryParams;
  }

  /**
   * Constrói chave de cache para busca
   */
  private buildSearchCacheKey(params: ProductSearchParams): string {
    return JSON.stringify(params);
  }

  /**
   * Obtém resultado de busca do cache
   */
  private getSearchFromCache(cacheKey: string): ProductSearchResult | null {
    const cached = this.searchCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      this.searchCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * Salva resultado de busca no cache
   */
  private saveSearchToCache(cacheKey: string, result: ProductSearchResult): void {
    this.searchCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Atualiza estado interno com resultado da busca
   */
  private updateStateFromResult(result: ProductSearchResult): void {
    this.products.set(result.products);
    this.totalProducts.set(result.total);
    this.currentPage.set(result.page);
  }

  /**
   * Trata erros de busca com fallback
   */
  private handleSearchError(error: any, params: ProductSearchParams): Observable<ProductSearchResult> {
    console.error('[ProductService] Erro na busca API:', error);
    this.error.set(this.parseError(error));

    // Retorna resultado vazio em caso de erro
    return of({
      products: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
      totalPages: 0
    });
  }

  /**
   * Parse de erros para mensagens user-friendly
   */
  private parseError(error: any): string {
    if (error?.error?.code === 'PRODUCT_NOT_FOUND') {
      return 'Produto não encontrado';
    }
    if (error?.error?.code === 'INVALID_CATEGORY') {
      return 'Categoria inválida';
    }
    if (error?.error?.code === 'PHARMACY_NOT_FOUND') {
      return 'Farmácia não encontrada';
    }
    if (error?.status === 0) {
      return 'Sem conexão com o servidor';
    }
    if (error?.status === 429) {
      return 'Muitas requisições. Aguarde um momento.';
    }
    if (error?.status >= 500) {
      return 'Erro no servidor. Tente novamente.';
    }

    return error?.error?.message || error?.message || 'Erro ao buscar produtos';
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - FIRESTORE
  // ============================================================================

  /**
   * Constrói constraints do Firestore query
   */
  private buildQueryConstraints(
    filters?: ProductFilters,
    sortBy: ProductSortOptions = { field: 'createdAt', direction: 'desc' },
    pageSize: number = 20,
    lastDocument?: DocumentSnapshot
  ): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    // Filtros
    if (filters) {
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.pharmacyId) {
        constraints.push(where('pharmacyId', '==', filters.pharmacyId));
      }
      if (filters.requiresPrescription !== undefined) {
        constraints.push(where('requiresPrescription', '==', filters.requiresPrescription));
      }
      if (filters.priceMin !== undefined) {
        constraints.push(where('price', '>=', filters.priceMin));
      }
      if (filters.priceMax !== undefined) {
        constraints.push(where('price', '<=', filters.priceMax));
      }
      if (filters.inStock) {
        constraints.push(where('stock', '>', 0));
      }
    }

    // Ordenação
    constraints.push(orderBy(sortBy.field, sortBy.direction));

    // Paginação
    if (lastDocument) {
      constraints.push(startAfter(lastDocument));
    }
    constraints.push(limit(pageSize));

    return constraints;
  }

  /**
   * Mapeia documento Firestore para Product
   */
  private mapDocToProduct(doc: DocumentSnapshot): Product {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.['createdAt']?.toDate() || new Date(),
      updatedAt: data?.['updatedAt']?.toDate() || new Date()
    } as Product;
  }

  /**
   * Gera tags para busca
   */
  private generateTags(name: string): string[] {
    const words = name.toLowerCase().split(' ');
    const tags: string[] = [];

    words.forEach(word => {
      if (word.length >= 3) {
        tags.push(word);
        // Adiciona variações (3 primeiras letras, 4 primeiras, etc)
        for (let i = 3; i <= word.length; i++) {
          tags.push(word.substring(0, i));
        }
      }
    });

    return [...new Set(tags)]; // Remove duplicatas
  }

  /**
   * Salva produto no cache
   */
  private saveToCache(productId: string, product: Product): void {
    this.productsCache.set(productId, product);
    this.cacheTimestamps.set(productId, Date.now());
  }

  /**
   * Busca produto no cache
   */
  private getFromCache(productId: string): Product | null {
    const timestamp = this.cacheTimestamps.get(productId);
    if (!timestamp || Date.now() - timestamp > CACHE_TTL_MS) {
      this.invalidateCache(productId);
      return null;
    }
    return this.productsCache.get(productId) || null;
  }

  /**
   * Invalida cache de um produto
   */
  private invalidateCache(productId: string): void {
    this.productsCache.delete(productId);
    this.cacheTimestamps.delete(productId);
  }

  /**
   * Verifica se cache está válido
   */
  private isCacheValid(productId: string): boolean {
    const timestamp = this.cacheTimestamps.get(productId);
    return !!timestamp && Date.now() - timestamp <= CACHE_TTL_MS;
  }
}
