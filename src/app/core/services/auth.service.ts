/**
 * 🔐 Authentication Service
 * Serviço de autenticação com Firebase Auth
 */

import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role: 'customer' | 'pharmacy' | 'admin';
  createdAt: Date;
  lastLoginAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  role?: 'customer' | 'pharmacy';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  // Signals
  currentUser = signal<User | null>(null);
  userProfile = signal<UserProfile | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  /* istanbul ignore next - Requires Firebase Auth for testing */
  constructor() {
    this.initAuthListener();
  }

  /**
   * Inicializa listener de estado de autenticação
   */
  /* istanbul ignore next - Requires Firebase Auth for testing */
  private initAuthListener(): void {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(!!user);

      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfile.set(null);
      }

      this.isLoading.set(false);
    });
  }

  /**
   * Login com email e senha
   */
  /* istanbul ignore next - Requires Firebase Auth for testing */
  login(credentials: LoginCredentials): Observable<User> {
    return from(
      signInWithEmailAndPassword(this.auth, credentials.email, credentials.password)
    ).pipe(
      map((userCredential) => {
        this.updateLastLogin(userCredential.user.uid);
        return userCredential.user;
      }),
      catchError((error) => {
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Registro de novo usuário
   */
  /* istanbul ignore next - Requires Firebase Auth for testing */
  register(data: RegisterData): Observable<User> {
    return from(
      createUserWithEmailAndPassword(this.auth, data.email, data.password)
    ).pipe(
      map(async (userCredential) => {
        const user = userCredential.user;

        // Atualizar profile no Auth
        if (data.displayName) {
          await updateProfile(user, { displayName: data.displayName });
        }

        // Criar profile no Firestore
        await this.createUserProfile({
          uid: user.uid,
          email: user.email!,
          displayName: data.displayName,
          phoneNumber: data.phoneNumber,
          role: data.role || 'customer',
          createdAt: new Date(),
          lastLoginAt: new Date()
        });

        return user;
      }),
      map((promise) => promise as any),
      catchError((error) => {
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Logout
   */
  /* istanbul ignore next - Requires Firebase Auth for testing */
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => {
        this.currentUser.set(null);
        this.userProfile.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        console.error('Logout error:', error);
        throw error;
      })
    );
  }

  /**
   * Reset de senha
   */
  /* istanbul ignore next - Requires Firebase Auth for testing */
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      catchError((error) => {
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Carrega profile do Firestore
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDoc = doc(this.firestore, `users/${uid}`);
      const snapshot = await getDoc(userDoc);

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        this.userProfile.set({
          ...data,
          createdAt: (data.createdAt as any).toDate(),
          lastLoginAt: (data.lastLoginAt as any).toDate()
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  /**
   * Cria profile no Firestore
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  private async createUserProfile(profile: UserProfile): Promise<void> {
    const userDoc = doc(this.firestore, `users/${profile.uid}`);
    await setDoc(userDoc, profile);
    this.userProfile.set(profile);
  }

  /**
   * Atualiza último login
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userDoc = doc(this.firestore, `users/${uid}`);
      await updateDoc(userDoc, { lastLoginAt: new Date() });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Trata erros de autenticação
   */
  private handleAuthError(error: any): Error {
    let message = 'Erro ao autenticar. Tente novamente.';

    switch (error?.code) {
      case 'auth/user-not-found':
        message = 'Usuário não encontrado.';
        break;
      case 'auth/wrong-password':
        message = 'Senha incorreta.';
        break;
      case 'auth/email-already-in-use':
        message = 'Este email já está em uso.';
        break;
      case 'auth/weak-password':
        message = 'A senha deve ter pelo menos 6 caracteres.';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido.';
        break;
      case 'auth/too-many-requests':
        message = 'Muitas tentativas. Tente novamente mais tarde.';
        break;
      case 'auth/network-request-failed':
        message = 'Erro de conexão. Verifique sua internet.';
        break;
    }

    return new Error(message);
  }

  /**
   * Verifica se usuário tem role específica
   */
  hasRole(role: 'customer' | 'pharmacy' | 'admin'): boolean {
    return this.userProfile()?.role === role;
  }

  /**
   * Obtém token JWT
   */
  /* istanbul ignore next - Requires Firebase Auth for testing */
  async getIdToken(): Promise<string | null> {
    const user = this.currentUser();
    if (!user) return null;

    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }
}
