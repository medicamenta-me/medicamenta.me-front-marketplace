/**
 * 🔐 Auth Interceptor
 * Adiciona token de autenticação em todas as requisições
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  // Se não há usuário, prosseguir sem token
  if (!auth.currentUser) {
    return next(req);
  }

  // Obter token e adicionar no header
  return from(auth.currentUser.getIdToken()).pipe(
    switchMap(token => {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(clonedReq);
    })
  );
};
