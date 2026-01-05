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

  describe('✅ Cenários Adicionais de Requisições Simultâneas', () => {
    it('deve manter loading true com 1 requisição após reset e show', (done) => {
      service.show();
      service.show();
      service.reset();
      service.show(); // Nova requisição após reset

      service.loading$.subscribe(loading => {
        expect(loading).toBe(true);
        done();
      });
    });

    it('deve sequenciar corretamente show/hide/show/hide', (done) => {
      service.show();
      expect(service.isLoading()).toBe(true);
      
      service.hide();
      expect(service.isLoading()).toBe(false);
      
      service.show();
      expect(service.isLoading()).toBe(true);
      
      service.hide();
      
      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('deve gerenciar 10 requisições simultâneas', (done) => {
      // Inicia 10 requisições
      for (let i = 0; i < 10; i++) {
        service.show();
      }
      expect(service.isLoading()).toBe(true);

      // Finaliza 9 requisições
      for (let i = 0; i < 9; i++) {
        service.hide();
      }
      expect(service.isLoading()).toBe(true); // Ainda tem 1

      // Finaliza última requisição
      service.hide();
      
      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('deve permitir reset durante requisições ativas', (done) => {
      service.show();
      service.show();
      service.show();
      
      expect(service.isLoading()).toBe(true);
      
      service.reset();
      
      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });
  });

  describe('✅ Cenários de Observables', () => {
    it('deve emitir múltiplos valores para subscribers', (done) => {
      const values: boolean[] = [];
      
      const subscription = service.loading$.subscribe(loading => {
        values.push(loading);
        
        if (values.length === 3) {
          expect(values).toEqual([false, true, false]);
          subscription.unsubscribe();
          done();
        }
      });
      
      // Primeiro valor (false) já foi emitido pelo BehaviorSubject
      service.show(); // Emite true
      service.hide(); // Emite false
    });

    it('deve permitir múltiplos subscribers', (done) => {
      let subscriber1Value = false;
      let subscriber2Value = false;

      const sub1 = service.loading$.subscribe(loading => {
        subscriber1Value = loading;
      });

      const sub2 = service.loading$.subscribe(loading => {
        subscriber2Value = loading;
      });

      service.show();

      expect(subscriber1Value).toBe(true);
      expect(subscriber2Value).toBe(true);

      sub1.unsubscribe();
      sub2.unsubscribe();
      done();
    });
  });

  describe('✅ Cenários de Estado', () => {
    it('deve retornar valor atual via isLoading()', () => {
      expect(service.isLoading()).toBe(false);
      
      service.show();
      expect(service.isLoading()).toBe(true);
      
      service.hide();
      expect(service.isLoading()).toBe(false);
    });

    it('deve manter consistência entre isLoading() e loading$', (done) => {
      service.show();
      
      service.loading$.subscribe(loading => {
        expect(loading).toBe(service.isLoading());
        done();
      });
    });

    it('deve resetar contador para zero após reset()', () => {
      service.show();
      service.show();
      service.show();
      
      service.reset();
      
      // Após reset, hide não deve causar problemas
      service.hide();
      expect(service.isLoading()).toBe(false);
    });
  });
});
