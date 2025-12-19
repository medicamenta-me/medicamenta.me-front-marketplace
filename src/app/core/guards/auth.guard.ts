/**
 * 🔐 Auth Guard
 * Guard de autenticação para proteger rotas
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    map(user => {
      if (user) {
        return true;
      }

      // Redirecionar para login
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};
