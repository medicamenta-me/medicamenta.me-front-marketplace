/**
 * 💾 Cache Service - IndexedDB
 * Serviço de cache persistente para o marketplace usando IndexedDB
 * 
 * Features:
 * - Cache de produtos e farmácias para acesso offline
 * - TTL (Time-To-Live) configurável por item
 * - Compressão automática de dados grandes
 * - Estatísticas de cache hit/miss
 * - Limpeza automática de itens expirados
 * 
 * Stores:
 * - products: Cache de produtos
 * - pharmacies: Cache de farmácias
 * - searches: Cache de resultados de busca
 * - meta: Metadados e configurações
 * 
 * @version 2.0.0 - Sprint M2
 */

import { Injectable, signal } from '@angular/core';

/**
 * Configuração do cache
 */
export interface CacheConfig {
  dbName: string;
  version: number;
  defaultTTL: number; // em milissegundos
  maxItems: number;
  compressionThreshold: number; // em bytes
}

/**
 * Item de cache com metadados
 */
export interface CacheItem<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  compressed: boolean;
  tags?: string[];
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  stores: {
    products: number;
    pharmacies: number;
    searches: number;
  };
}

/**
 * Opções ao salvar item
 */
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  dbName: 'medicamenta-marketplace-cache',
  version: 1,
  defaultTTL: 30 * 60 * 1000, // 30 minutos
  maxItems: 1000,
  compressionThreshold: 10 * 1024 // 10KB
};

// Store names
const STORES = {
  PRODUCTS: 'products',
  PHARMACIES: 'pharmacies',
  SEARCHES: 'searches',
  META: 'meta'
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private db: IDBDatabase | null = null;
  private config: CacheConfig = DEFAULT_CONFIG;
  
  // Signals
  private readonly _isReady = signal(false);
  public readonly isReady = this._isReady.asReadonly();
  
  private readonly _stats = signal<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    stores: { products: 0, pharmacies: 0, searches: 0 }
  });
  public readonly stats = this._stats.asReadonly();

  // In-memory cache for hot items
  private memoryCache = new Map<string, CacheItem>();
  private readonly MEMORY_CACHE_SIZE = 100;

  constructor() {
    this.init();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Inicializa o IndexedDB
   */
  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.warn('[CacheService] IndexedDB not available');
      return;
    }

    try {
      this.db = await this.openDatabase();
      this._isReady.set(true);
      await this.cleanExpired();
      await this.updateStats();
      console.log('[CacheService] Initialized successfully');
    } catch (error) {
      console.error('[CacheService] Init error:', error);
    }
  }

  /**
   * Abre conexão com IndexedDB
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar stores se não existirem
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productsStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'key' });
          productsStore.createIndex('timestamp', 'timestamp', { unique: false });
          productsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        if (!db.objectStoreNames.contains(STORES.PHARMACIES)) {
          const pharmaciesStore = db.createObjectStore(STORES.PHARMACIES, { keyPath: 'key' });
          pharmaciesStore.createIndex('timestamp', 'timestamp', { unique: false });
          pharmaciesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        if (!db.objectStoreNames.contains(STORES.SEARCHES)) {
          const searchesStore = db.createObjectStore(STORES.SEARCHES, { keyPath: 'key' });
          searchesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Salva item no cache
   */
  async set<T>(store: StoreName, key: string, data: T, options: CacheOptions = {}): Promise<void> {
    if (!this.db) return;

    const ttl = options.ttl ?? this.config.defaultTTL;
    const size = this.calculateSize(data);
    const shouldCompress = options.compress ?? (size > this.config.compressionThreshold);

    const item: CacheItem<T> = {
      key,
      data: shouldCompress ? this.compress(data) : data,
      timestamp: Date.now(),
      ttl,
      size,
      compressed: shouldCompress,
      tags: options.tags
    };

    // Salvar em memória para acesso rápido
    this.setMemoryCache(store + ':' + key, item);

    // Salvar no IndexedDB
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(item);

      request.onsuccess = () => {
        this.updateStats();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtém item do cache
   */
  async get<T>(store: StoreName, key: string): Promise<T | null> {
    // Verificar memória primeiro
    const memoryKey = store + ':' + key;
    const memoryItem = this.memoryCache.get(memoryKey);
    
    if (memoryItem && !this.isExpired(memoryItem)) {
      this.incrementHits();
      const data = memoryItem.compressed ? this.decompress(memoryItem.data) : memoryItem.data;
      return data as T;
    }

    if (!this.db) {
      this.incrementMisses();
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const item = request.result as CacheItem<T> | undefined;
        
        if (!item || this.isExpired(item)) {
          this.incrementMisses();
          if (item) this.delete(store, key); // Limpar item expirado
          resolve(null);
          return;
        }

        this.incrementHits();
        this.setMemoryCache(memoryKey, item); // Cache em memória
        
        const data = item.compressed ? this.decompress(item.data) : item.data;
        resolve(data as T);
      };
      request.onerror = () => {
        this.incrementMisses();
        reject(request.error);
      };
    });
  }

  /**
   * Remove item do cache
   */
  async delete(store: StoreName, key: string): Promise<void> {
    // Remover da memória
    this.memoryCache.delete(store + ':' + key);

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);

      request.onsuccess = () => {
        this.updateStats();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpa todos os itens de uma store
   */
  async clear(store: StoreName): Promise<void> {
    // Limpar memória
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(store + ':')) {
        this.memoryCache.delete(key);
      }
    }

    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onsuccess = () => {
        this.updateStats();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpa todo o cache
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    
    await Promise.all([
      this.clear(STORES.PRODUCTS),
      this.clear(STORES.PHARMACIES),
      this.clear(STORES.SEARCHES)
    ]);
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Salva produto no cache
   */
  async setProduct<T>(productId: string, data: T, ttl?: number): Promise<void> {
    return this.set(STORES.PRODUCTS, productId, data, { 
      ttl, 
      tags: ['product'] 
    });
  }

  /**
   * Obtém produto do cache
   */
  async getProduct<T>(productId: string): Promise<T | null> {
    return this.get<T>(STORES.PRODUCTS, productId);
  }

  /**
   * Salva farmácia no cache
   */
  async setPharmacy<T>(pharmacyId: string, data: T, ttl?: number): Promise<void> {
    return this.set(STORES.PHARMACIES, pharmacyId, data, { 
      ttl, 
      tags: ['pharmacy'] 
    });
  }

  /**
   * Obtém farmácia do cache
   */
  async getPharmacy<T>(pharmacyId: string): Promise<T | null> {
    return this.get<T>(STORES.PHARMACIES, pharmacyId);
  }

  /**
   * Salva resultado de busca no cache
   * @param queryKey Hash ou identificador da query
   */
  async setSearchResult<T>(queryKey: string, data: T, ttl?: number): Promise<void> {
    return this.set(STORES.SEARCHES, queryKey, data, { 
      ttl: ttl ?? 5 * 60 * 1000, // 5 minutos por padrão para buscas
      tags: ['search'] 
    });
  }

  /**
   * Obtém resultado de busca do cache
   */
  async getSearchResult<T>(queryKey: string): Promise<T | null> {
    return this.get<T>(STORES.SEARCHES, queryKey);
  }

  // ============================================================================
  // CACHE MAINTENANCE
  // ============================================================================

  /**
   * Remove itens expirados
   */
  async cleanExpired(): Promise<number> {
    if (!this.db) return 0;

    let cleaned = 0;
    const stores = [STORES.PRODUCTS, STORES.PHARMACIES, STORES.SEARCHES];

    for (const store of stores) {
      const expired = await this.getExpiredKeys(store);
      for (const key of expired) {
        await this.delete(store, key);
        cleaned++;
      }
    }

    console.log(`[CacheService] Cleaned ${cleaned} expired items`);
    return cleaned;
  }

  /**
   * Obtém chaves de itens expirados
   */
  private getExpiredKeys(store: StoreName): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.openCursor();
      const expiredKeys: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value as CacheItem;
          if (this.isExpired(item)) {
            expiredKeys.push(item.key);
          }
          cursor.continue();
        } else {
          resolve(expiredKeys);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove itens por tag
   */
  async deleteByTag(store: StoreName, tag: string): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const index = objectStore.index('tags');
      const request = index.openCursor(IDBKeyRange.only(tag));
      let deleted = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          this.memoryCache.delete(store + ':' + cursor.value.key);
          deleted++;
          cursor.continue();
        } else {
          this.updateStats();
          resolve(deleted);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Verifica se item expirou
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.timestamp + item.ttl;
  }

  /**
   * Calcula tamanho aproximado do dado
   */
  private calculateSize(data: unknown): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Comprime dado (usa JSON stringify + base64 simples)
   */
  private compress<T>(data: T): T {
    // Implementação simples - em produção usar LZ-String ou similar
    try {
      const json = JSON.stringify(data);
      return btoa(json) as unknown as T;
    } catch {
      return data;
    }
  }

  /**
   * Descomprime dado
   */
  private decompress<T>(data: T): T {
    try {
      const json = atob(data as unknown as string);
      return JSON.parse(json) as T;
    } catch {
      return data;
    }
  }

  /**
   * Gerencia cache em memória
   */
  private setMemoryCache(key: string, item: CacheItem): void {
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      // Remove o item mais antigo
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
    this.memoryCache.set(key, item);
  }

  /**
   * Incrementa contador de hits
   */
  private incrementHits(): void {
    this._stats.update(s => ({
      ...s,
      hits: s.hits + 1,
      hitRate: (s.hits + 1) / (s.hits + s.misses + 1) * 100
    }));
  }

  /**
   * Incrementa contador de misses
   */
  private incrementMisses(): void {
    this._stats.update(s => ({
      ...s,
      misses: s.misses + 1,
      hitRate: s.hits / (s.hits + s.misses + 1) * 100
    }));
  }

  /**
   * Atualiza estatísticas
   */
  private async updateStats(): Promise<void> {
    if (!this.db) return;

    const stats: CacheStats = {
      totalItems: 0,
      totalSize: 0,
      hits: this._stats().hits,
      misses: this._stats().misses,
      hitRate: this._stats().hitRate,
      stores: { products: 0, pharmacies: 0, searches: 0 }
    };

    const countStore = (store: StoreName): Promise<{ count: number; size: number }> => {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(store, 'readonly');
        const objectStore = transaction.objectStore(store);
        
        let count = 0;
        let size = 0;
        
        const request = objectStore.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            count++;
            size += (cursor.value as CacheItem).size || 0;
            cursor.continue();
          } else {
            resolve({ count, size });
          }
        };
        request.onerror = () => resolve({ count: 0, size: 0 });
      });
    };

    const [products, pharmacies, searches] = await Promise.all([
      countStore(STORES.PRODUCTS),
      countStore(STORES.PHARMACIES),
      countStore(STORES.SEARCHES)
    ]);

    stats.stores.products = products.count;
    stats.stores.pharmacies = pharmacies.count;
    stats.stores.searches = searches.count;
    stats.totalItems = products.count + pharmacies.count + searches.count;
    stats.totalSize = products.size + pharmacies.size + searches.size;

    this._stats.set(stats);
  }

  /**
   * Gera chave de hash para queries
   */
  generateQueryKey(params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {} as Record<string, unknown>);
    
    return btoa(JSON.stringify(sorted)).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Fecha conexão com o banco
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this._isReady.set(false);
    }
  }
}
