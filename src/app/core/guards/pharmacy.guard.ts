/**
 * 🏪 Pharmacy Guard
 * Guard para proteger rotas exclusivas de farmácias
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { map, switchMap, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const pharmacyGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    switchMap(async user => {
      if (!user) {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      // Verificar se usuário é farmácia
      const pharmacyDoc = await getDoc(doc(firestore, `pharmacies/${user.uid}`));
      
      if (pharmacyDoc.exists()) {
        return true;
      }

      // Não é farmácia, redirecionar
      router.navigate(['/']);
      return false;
    })
  );
};
