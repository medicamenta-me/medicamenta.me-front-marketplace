/**
 * 🧭 Header Component
 * 
 * Cabeçalho da aplicação com:
 * - Logo e navegação
 * - Busca de produtos
 * - Carrinho e autenticação
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  readonly router = inject(Router);

  searchQuery = signal<string>('');
  cartItemCount = signal<number>(0);

  // Computed properties do AuthService
  get currentUser() {
    return this.authService.currentUser();
  }

  get userProfile() {
    return this.authService.userProfile();
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    this.loadCartItemCount();
  }

  /**
   * Realiza busca de produtos
   */
  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/products'], {
        queryParams: { q: query }
      });
    }
  }

  /**
   * Faz logout do usuário
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Carrega quantidade de itens no carrinho
   */
  private loadCartItemCount(): void {
    // TODO: Implementar quando CartService estiver disponível
    this.cartItemCount.set(0);
  }

  /**
   * Navega para o carrinho
   */
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Navega para a página de login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navega para a página de perfil
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
