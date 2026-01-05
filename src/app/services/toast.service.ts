/**
 * 🍞 Toast Service
 * Serviço de notificações toast para o Marketplace
 *
 * Features:
 * - Notificações empilháveis
 * - Auto-dismiss configurável
 * - Múltiplos estilos (success, error, warning, info)
 * - Suporte a ações (botões)
 * - Acessibilidade (ARIA)
 *
 * @author Medicamenta.me
 * @version 1.0.0
 */

import { Injectable, signal, computed } from '@angular/core';

/**
 * Opções para exibir um toast
 */
export interface ToastOptions {
  message: string;
  duration?: number;
  color?: 'success' | 'danger' | 'warning' | 'primary' | 'secondary';
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  icon?: string;
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Toast interno com ID para gerenciamento
 */
export interface Toast extends ToastOptions {
  id: string;
  createdAt: Date;
}

/**
 * Configuração global do serviço
 */
export interface ToastConfig {
  maxToasts: number;
  defaultDuration: number;
  defaultPosition: ToastOptions['position'];
}

const DEFAULT_CONFIG: ToastConfig = {
  maxToasts: 5,
  defaultDuration: 4000,
  defaultPosition: 'top'
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  // Configuração
  private config: ToastConfig = { ...DEFAULT_CONFIG };

  // Lista de toasts ativos
  private readonly _toasts = signal<Toast[]>([]);

  // Mapa de timeouts para auto-dismiss
  private readonly dismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // Contador para IDs únicos
  private idCounter = 0;

  // ===== PUBLIC SIGNALS =====

  /** Lista de toasts ativos (readonly) */
  readonly toasts = this._toasts.asReadonly();

  /** Quantidade de toasts ativos */
  readonly count = computed(() => this._toasts().length);

  /** Verifica se há toasts visíveis */
  readonly hasToasts = computed(() => this._toasts().length > 0);

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Configura o serviço de toasts
   *
   * @param config Configuração parcial
   */
  configure(config: Partial<ToastConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Exibe um toast genérico
   *
   * @param options Opções do toast
   * @returns ID do toast criado
   */
  show(options: ToastOptions): string {
    const toast: Toast = {
      id: this.generateId(),
      createdAt: new Date(),
      duration: options.duration ?? this.config.defaultDuration,
      position: options.position ?? this.config.defaultPosition,
      dismissible: options.dismissible ?? true,
      color: options.color ?? 'primary',
      ...options
    };

    // Adiciona toast mantendo limite
    this._toasts.update((current) => {
      const updated = [toast, ...current];
      // Remove excedentes
      if (updated.length > this.config.maxToasts) {
        const removed = updated.splice(this.config.maxToasts);
        removed.forEach((t) => this.clearTimeout(t.id));
      }
      return updated;
    });

    // Configura auto-dismiss se duration > 0
    if (toast.duration && toast.duration > 0) {
      this.scheduleDismiss(toast.id, toast.duration);
    }

    return toast.id;
  }

  /**
   * Exibe toast de sucesso
   *
   * @param message Mensagem
   * @param options Opções adicionais
   * @returns ID do toast
   */
  success(message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      message,
      color: 'success',
      icon: '✅',
      duration: 3000,
      ...options
    });
  }

  /**
   * Exibe toast de erro
   *
   * @param message Mensagem
   * @param options Opções adicionais
   * @returns ID do toast
   */
  error(message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      message,
      color: 'danger',
      icon: '❌',
      duration: 5000,
      ...options
    });
  }

  /**
   * Exibe toast de aviso
   *
   * @param message Mensagem
   * @param options Opções adicionais
   * @returns ID do toast
   */
  warning(message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      message,
      color: 'warning',
      icon: '⚠️',
      duration: 4000,
      ...options
    });
  }

  /**
   * Exibe toast informativo
   *
   * @param message Mensagem
   * @param options Opções adicionais
   * @returns ID do toast
   */
  info(message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      message,
      color: 'primary',
      icon: 'ℹ️',
      duration: 4000,
      ...options
    });
  }

  /**
   * Remove um toast específico
   *
   * @param id ID do toast
   */
  dismiss(id: string): void {
    this.clearTimeout(id);
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }

  /**
   * Remove todos os toasts
   */
  dismissAll(): void {
    this._toasts().forEach((t) => this.clearTimeout(t.id));
    this._toasts.set([]);
  }

  /**
   * Obtém um toast pelo ID
   *
   * @param id ID do toast
   * @returns Toast ou undefined
   */
  getToast(id: string): Toast | undefined {
    return this._toasts().find((t) => t.id === id);
  }

  /**
   * Atualiza a mensagem de um toast existente
   *
   * @param id ID do toast
   * @param message Nova mensagem
   */
  updateMessage(id: string, message: string): void {
    this._toasts.update((current) =>
      current.map((t) => (t.id === id ? { ...t, message } : t))
    );
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Gera ID único para o toast
   */
  private generateId(): string {
    return `toast_${++this.idCounter}_${Date.now()}`;
  }

  /**
   * Agenda auto-dismiss de um toast
   */
  private scheduleDismiss(id: string, duration: number): void {
    const timeout = setTimeout(() => {
      this.dismiss(id);
    }, duration);

    this.dismissTimeouts.set(id, timeout);
  }

  /**
   * Limpa timeout de dismiss
   */
  private clearTimeout(id: string): void {
    const timeout = this.dismissTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.dismissTimeouts.delete(id);
    }
  }
}
