/**
 * 🧪 Loading Service Tests
 */

import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('deve iniciar com loading = false', (done) => {
    service.loading$.subscribe(loading => {
      expect(loading).toBe(false);
      expect(service.isLoading()).toBe(false);
      done();
    });
  });

  it('deve exibir loading ao chamar show()', (done) => {
    service.show();

    service.loading$.subscribe(loading => {
      expect(loading).toBe(true);
      expect(service.isLoading()).toBe(true);
      done();
    });
  });

  it('deve ocultar loading ao chamar hide()', (done) => {
    service.show();
    service.hide();

    service.loading$.subscribe(loading => {
      expect(loading).toBe(false);
      expect(service.isLoading()).toBe(false);
      done();
    });
  });

  it('deve gerenciar múltiplas requisições (contador)', (done) => {
    // Simula 3 requisições simultâneas
    service.show();
    service.show();
    service.show();

    expect(service.isLoading()).toBe(true);

    // Finaliza 2 requisições
    service.hide();
    service.hide();
    expect(service.isLoading()).toBe(true); // Ainda tem 1 ativa

    // Finaliza última requisição
    service.hide();
    
    service.loading$.subscribe(loading => {
      expect(loading).toBe(false);
      done();
    });
  });

  it('deve resetar loading ao chamar reset()', (done) => {
    service.show();
    service.show();
    service.show(); // 3 requisições ativas

    service.reset();

    service.loading$.subscribe(loading => {
      expect(loading).toBe(false);
      expect(service.isLoading()).toBe(false);
      done();
    });
  });

  it('não deve permitir contador negativo', (done) => {
    service.hide(); // Tenta decrementar sem show()
    service.hide();

    service.loading$.subscribe(loading => {
      expect(loading).toBe(false);
      expect(service.isLoading()).toBe(false);
      done();
    });
  });
});
