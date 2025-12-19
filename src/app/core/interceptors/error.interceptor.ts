/**
 * 🛡️ Error Interceptor
 * 
 * Intercepta erros HTTP e exibe mensagens amigáveis
 * Mapeia status codes para mensagens em português
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Erro desconhecido';

      if (error.error instanceof ErrorEvent) {
        // Erro do cliente (rede, etc)
        errorMessage = `Erro de conexão: ${error.error.message}`;
      } else {
        // Erro do servidor
        switch (error.status) {
          case 0:
            errorMessage = 'Sem conexão com o servidor';
            break;
          case 400:
            errorMessage = 'Requisição inválida';
            break;
          case 401:
            errorMessage = 'Sessão expirada. Faça login novamente';
            router.navigate(['/auth/login']);
            break;
          case 403:
            errorMessage = 'Você não tem permissão para acessar este recurso';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado';
            break;
          case 409:
            errorMessage = 'Conflito: recurso já existe';
            break;
          case 422:
            errorMessage = 'Dados inválidos';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor';
            break;
          case 503:
            errorMessage = 'Serviço temporariamente indisponível';
            break;
          default:
            errorMessage = `Erro ${error.status}: ${error.message}`;
        }
      }

      // Log para debugging (em produção, enviar para serviço de monitoramento)
      console.error('HTTP Error:', {
        message: errorMessage,
        status: error.status,
        url: req.url,
        error: error
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};
