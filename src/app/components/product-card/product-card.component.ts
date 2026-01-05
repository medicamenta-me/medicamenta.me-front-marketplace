import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  
  @Output() productClick = new EventEmitter<string>();

  /**
   * Formata preço para exibição
   */
  formatPrice(price: number): string {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Calcula preço com desconto
   */
  getDiscountedPrice(): number | null {
    if (!this.product.discount) return null;
    return this.product.price * (1 - this.product.discount / 100);
  }

  /**
   * Verifica se produto está em estoque
   */
  isInStock(): boolean {
    return this.product.stock > 0;
  }

  /**
   * Gera array de estrelas para rating
   */
  getRatingStars(): { filled: boolean }[] {
    const stars: { filled: boolean }[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push({ filled: i <= Math.round(this.product.rating) });
    }
    return stars;
  }

  /**
   * Imagem principal do produto
   */
  getPrimaryImage(): string {
    return this.product.images[0] || '/assets/placeholder-product.png';
  }

  /**
   * Emite evento de clique no produto
   */
  onProductClick(): void {
    this.productClick.emit(this.product.id);
  }
}
