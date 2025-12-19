/**
 * 🏷️ Product Card Component
 * 
 * Card de produto com:
 * - Imagem, nome, preço
 * - Avaliação e estoque
 * - Botão adicionar ao carrinho
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  /**
   * Emite evento de adicionar ao carrinho
   */
  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.addToCart.emit(this.product);
  }

  /**
   * Verifica se produto está em estoque
   */
  get isInStock(): boolean {
    return this.product.stock > 0;
  }

  /**
   * Verifica se produto está com estoque baixo
   */
  get isLowStock(): boolean {
    return this.product.stock > 0 && this.product.stock <= 5;
  }

  /**
   * Obtém primeira imagem do produto
   */
  get mainImage(): string {
    return this.product.images?.[0] || 'assets/placeholder.png';
  }

  /**
   * Formata preço
   */
  get formattedPrice(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.product.price);
  }

  /**
   * Cria array para renderizar estrelas
   */
  get ratingStars(): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  /**
   * Verifica se estrela deve ser preenchida
   */
  isStarFilled(star: number): boolean {
    return star <= Math.floor(this.product.rating || 0);
  }
}
