/**
 * 🧪 Cache Service Tests
 * Testes unitários para o serviço de cache IndexedDB
 * 
 * Cenários:
 * - Inicialização
 * - Utility methods
 * - Memory cache
 * - Statistics
 */

import { TestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService]
    });

    service = TestBed.inject(CacheService);
  });

  // ============================================
  // INITIALIZATION TESTS
  // ============================================

  describe('Initialization', () => {
    it('deve criar o serviço', () => {
      expect(service).toBeTruthy();
    });

    it('deve ter stats iniciais zeradas', () => {
      const stats = service.stats();
      expect(stats.totalItems).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('deve ter signal isReady', () => {
      expect(service.isReady).toBeDefined();
    });

    it('deve ter signal stats', () => {
      expect(service.stats).toBeDefined();
    });
  });

  // ============================================
  // UTILITY METHODS TESTS
  // ============================================

  describe('Utility Methods', () => {
    describe('generateQueryKey()', () => {
      it('deve gerar chave única para mesmos parâmetros', () => {
        const params = { query: 'test', page: 1, limit: 10 };
        const key1 = service.generateQueryKey(params);
        const key2 = service.generateQueryKey(params);
        expect(key1).toBe(key2);
      });

      it('deve gerar chaves diferentes para parâmetros diferentes', () => {
        const params1 = { query: 'test1', page: 1 };
        const params2 = { query: 'test2', page: 1 };
        const key1 = service.generateQueryKey(params1);
        const key2 = service.generateQueryKey(params2);
        expect(key1).not.toBe(key2);
      });

      it('deve ignorar valores undefined', () => {
        const params1 = { query: 'test', extra: undefined };
        const params2 = { query: 'test' };
        const key1 = service.generateQueryKey(params1);
        const key2 = service.generateQueryKey(params2);
        expect(key1).toBe(key2);
      });

      it('deve ignorar valores null', () => {
        const params1 = { query: 'test', extra: null };
        const params2 = { query: 'test' };
        const key1 = service.generateQueryKey(params1);
        const key2 = service.generateQueryKey(params2);
        expect(key1).toBe(key2);
      });

      it('deve ordenar parâmetros para consistência', () => {
        const params1 = { b: 2, a: 1 };
        const params2 = { a: 1, b: 2 };
        const key1 = service.generateQueryKey(params1);
        const key2 = service.generateQueryKey(params2);
        expect(key1).toBe(key2);
      });

      it('deve gerar chave não vazia', () => {
        const params = { query: 'test' };
        const key = service.generateQueryKey(params);
        expect(key.length).toBeGreaterThan(0);
      });

      it('deve gerar chave alfanumérica', () => {
        const params = { query: 'test', special: '@#$%' };
        const key = service.generateQueryKey(params);
        expect(/^[a-zA-Z0-9]+$/.test(key)).toBeTrue();
      });

      it('deve lidar com objeto vazio', () => {
        const key = service.generateQueryKey({});
        expect(key).toBeDefined();
      });

      it('deve lidar com valores complexos', () => {
        const params = { 
          filters: { category: 'medicine', price: { min: 10, max: 100 } },
          page: 1
        };
        const key = service.generateQueryKey(params);
        expect(key.length).toBeGreaterThan(0);
      });
    });

    describe('close()', () => {
      it('deve ter método close', () => {
        expect(service.close).toBeDefined();
        expect(typeof service.close).toBe('function');
      });

      it('deve setar isReady para false após close', () => {
        service.close();
        expect(service.isReady()).toBeFalse();
      });
    });
  });

  // ============================================
  // PUBLIC API TESTS
  // ============================================

  describe('Public API', () => {
    describe('Product Cache Methods', () => {
      it('deve ter método setProduct', () => {
        expect(service.setProduct).toBeDefined();
        expect(typeof service.setProduct).toBe('function');
      });

      it('deve ter método getProduct', () => {
        expect(service.getProduct).toBeDefined();
        expect(typeof service.getProduct).toBe('function');
      });
    });

    describe('Pharmacy Cache Methods', () => {
      it('deve ter método setPharmacy', () => {
        expect(service.setPharmacy).toBeDefined();
        expect(typeof service.setPharmacy).toBe('function');
      });

      it('deve ter método getPharmacy', () => {
        expect(service.getPharmacy).toBeDefined();
        expect(typeof service.getPharmacy).toBe('function');
      });
    });

    describe('Search Cache Methods', () => {
      it('deve ter método setSearchResult', () => {
        expect(service.setSearchResult).toBeDefined();
        expect(typeof service.setSearchResult).toBe('function');
      });

      it('deve ter método getSearchResult', () => {
        expect(service.getSearchResult).toBeDefined();
        expect(typeof service.getSearchResult).toBe('function');
      });
    });

    describe('Generic Methods', () => {
      it('deve ter método set', () => {
        expect(service.set).toBeDefined();
        expect(typeof service.set).toBe('function');
      });

      it('deve ter método get', () => {
        expect(service.get).toBeDefined();
        expect(typeof service.get).toBe('function');
      });

      it('deve ter método delete', () => {
        expect(service.delete).toBeDefined();
        expect(typeof service.delete).toBe('function');
      });

      it('deve ter método clear', () => {
        expect(service.clear).toBeDefined();
        expect(typeof service.clear).toBe('function');
      });

      it('deve ter método clearAll', () => {
        expect(service.clearAll).toBeDefined();
        expect(typeof service.clearAll).toBe('function');
      });

      it('deve ter método cleanExpired', () => {
        expect(service.cleanExpired).toBeDefined();
        expect(typeof service.cleanExpired).toBe('function');
      });
    });
  });

  // ============================================
  // STATS STRUCTURE TESTS
  // ============================================

  describe('Stats Structure', () => {
    it('deve ter totalItems', () => {
      expect(service.stats().totalItems).toBeDefined();
    });

    it('deve ter totalSize', () => {
      expect(service.stats().totalSize).toBeDefined();
    });

    it('deve ter hits', () => {
      expect(service.stats().hits).toBeDefined();
    });

    it('deve ter misses', () => {
      expect(service.stats().misses).toBeDefined();
    });

    it('deve ter hitRate', () => {
      expect(service.stats().hitRate).toBeDefined();
    });

    it('deve ter stores com contadores', () => {
      const stores = service.stats().stores;
      expect(stores.products).toBeDefined();
      expect(stores.pharmacies).toBeDefined();
      expect(stores.searches).toBeDefined();
    });
  });

  // ============================================
  // EDGE CASES TESTS
  // ============================================

  describe('Edge Cases', () => {
    it('getProduct deve retornar null quando cache não está pronto', async () => {
      service.close();
      const result = await service.getProduct('test');
      expect(result).toBeNull();
    });

    it('getPharmacy deve retornar null quando cache não está pronto', async () => {
      service.close();
      const result = await service.getPharmacy('test');
      expect(result).toBeNull();
    });

    it('getSearchResult deve retornar null quando cache não está pronto', async () => {
      service.close();
      const result = await service.getSearchResult('test');
      expect(result).toBeNull();
    });

    it('cleanExpired deve retornar 0 quando cache não está pronto', async () => {
      service.close();
      const result = await service.cleanExpired();
      expect(result).toBe(0);
    });
  });
});

