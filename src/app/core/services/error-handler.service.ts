/**
 * 🛡️ Error Handler Service
 * 
 * Manipulador global de erros não capturados.
 * Fornece mensagens amigáveis e integração com monitoramento.
 */

import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoadingService } from './loading.service';

export interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  private readonly router = inject(Router);
  private readonly loadingService = inject(LoadingService);

  /**
   * Manipula erro não capturado
   */
  handleError(error: Error | HttpErrorResponse): void {
    // Sempre esconde loading quando ocorre erro
    this.loadingService.reset();

    const errorLog = this.createErrorLog(error);
    const userMessage = this.getUserFriendlyMessage(error);

    // Log em desenvolvimento
    if (this.isDevelopment()) {
      console.error('❌ Erro capturado:', error);
      console.error('📋 Error Log:', errorLog);
    }

    // Envia para serviço de monitoramento em produção
    if (this.isProduction()) {
      this.sendToMonitoring(errorLog);
    }

    // Exibe mensagem ao usuário (você pode integrar com um ToastService aqui)
    this.showUserMessage(userMessage);

    // Redireciona para página de erro em casos críticos
    if (this.isCriticalError(error)) {
      this.router.navigate(['/error'], {
        queryParams: { message: userMessage }
      });
    }
  }

  /**
   * Cria log estruturado do erro
   */
  private createErrorLog(error: Error | HttpErrorResponse): ErrorLog {
    return {
      message: error.message,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Converte erro técnico em mensagem amigável
   */
  private getUserFriendlyMessage(error: Error | HttpErrorResponse): string {
    // Erro HTTP
    if (error instanceof HttpErrorResponse) {
      return this.getHttpErrorMessage(error);
    }

    // Erro do Firebase
    if (this.isFirebaseError(error)) {
      return this.getFirebaseErrorMessage(error);
    }

    // Erro de rede
    if (this.isNetworkError(error)) {
      return 'Sem conexão com a internet. Verifique sua conexão.';
    }

    // Erro genérico
    return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
  }

  /**
   * Mensagens para erros HTTP
   */
  private getHttpErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400:
        return 'Dados inválidos. Verifique as informações e tente novamente.';
      case 401:
        return 'Sua sessão expirou. Faça login novamente.';
      case 403:
        return 'Você não tem permissão para realizar esta ação.';
      case 404:
        return 'Recurso não encontrado.';
      case 408:
        return 'A requisição demorou muito. Tente novamente.';
      case 409:
        return 'Conflito de dados. O recurso já existe.';
      case 429:
        return 'Muitas requisições. Aguarde um momento e tente novamente.';
      case 500:
        return 'Erro no servidor. Estamos trabalhando para resolver.';
      case 503:
        return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
      default:
        return `Erro ao processar requisição (${error.status}).`;
    }
  }

  /**
   * Mensagens para erros do Firebase
   */
  private getFirebaseErrorMessage(error: Error): string {
    const code = (error as any).code;

    switch (code) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado.';
      case 'auth/wrong-password':
        return 'Senha incorreta.';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'Email inválido.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      case 'permission-denied':
        return 'Você não tem permissão para acessar este recurso.';
      case 'not-found':
        return 'Documento não encontrado.';
      case 'already-exists':
        return 'Documento já existe.';
      case 'resource-exhausted':
        return 'Limite de uso excedido. Tente novamente mais tarde.';
      case 'unauthenticated':
        return 'Você precisa estar autenticado.';
      default:
        return 'Erro ao processar operação.';
    }
  }

  /**
   * Verifica se é erro do Firebase
   */
  private isFirebaseError(error: Error): boolean {
    return !!(error as any).code && (
      (error as any).code.startsWith('auth/') ||
      ['permission-denied', 'not-found', 'already-exists', 'resource-exhausted', 'unauthenticated']
        .includes((error as any).code)
    );
  }

  /**
   * Verifica se é erro de rede
   */
  private isNetworkError(error: Error): boolean {
    return error.message.includes('Network') ||
           error.message.includes('fetch') ||
           error.message.includes('XMLHttpRequest');
  }

  /**
   * Verifica se é erro crítico
   */
  private isCriticalError(error: Error | HttpErrorResponse): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status >= 500;
    }
    return false;
  }

  /**
   * Exibe mensagem ao usuário (mock - integrar com ToastService)
   */
  private showUserMessage(message: string): void {
    // TODO: Integrar com ToastService quando disponível
    console.warn('💬 Mensagem ao usuário:', message);
  }

  /**
   * Envia erro para serviço de monitoramento
   */
  private sendToMonitoring(errorLog: ErrorLog): void {
    // TODO: Integrar com Sentry, LogRocket ou similar
    console.log('📊 Enviando para monitoramento:', errorLog);
  }

  /**
   * Verifica se está em desenvolvimento
   */
  private isDevelopment(): boolean {
    return !this.isProduction();
  }

  /**
   * Verifica se está em produção
   */
  private isProduction(): boolean {
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' &&
           !window.location.hostname.includes('127.0.0.1');
  }
}
