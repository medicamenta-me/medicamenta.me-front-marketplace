/**
 * 🔄 Loading Service
 * 
 * Gerencia estado global de loading (spinner)
 * Usa BehaviorSubject para permitir múltiplas subscrições
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private requestCount = 0;

  /**
   * Incrementa contador e exibe loading
   */
  show(): void {
    this.requestCount++;
    this.loadingSubject.next(true);
  }

  /**
   * Decrementa contador e oculta loading se não houver mais requisições
   */
  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Força loading off (útil para reset em caso de erro)
   */
  reset(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Retorna estado atual do loading (sem subscrever)
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
