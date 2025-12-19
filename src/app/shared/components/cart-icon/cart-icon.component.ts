/**
 * 🛒 Cart Icon Component
 * 
 * Ícone do carrinho com badge de quantidade
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cart-icon">
      <span class="icon">🛒</span>
      @if (itemCount > 0) {
        <span class="badge">{{ itemCount }}</span>
      }
    </div>
  `,
  styles: [`
    .cart-icon {
      position: relative;
      display: inline-block;
      font-size: 1.5rem;
      cursor: pointer;

      .icon {
        display: block;
      }

      .badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #dc3545;
        color: #fff;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 0.75rem;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
      }
    }
  `]
})
export class CartIconComponent {
  @Input() itemCount = 0;
}
