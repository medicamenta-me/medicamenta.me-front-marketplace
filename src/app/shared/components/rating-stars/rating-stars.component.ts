/**
 * ⭐ Rating Stars Component
 * 
 * Exibe avaliação em estrelas
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating-stars">
      @for (star of stars; track star) {
        <span class="star" [class.filled]="star <= filledStars">⭐</span>
      }
      @if (showCount && count > 0) {
        <span class="count">({{ count }})</span>
      }
    </div>
  `,
  styles: [`
    .rating-stars {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      .star {
        opacity: 0.3;
        font-size: 1rem;
        
        &.filled {
          opacity: 1;
        }
      }

      .count {
        margin-left: 0.5rem;
        font-size: 0.875rem;
        color: #666;
      }
    }
  `]
})
export class RatingStarsComponent {
  @Input() rating = 0;
  @Input() count = 0;
  @Input() showCount = true;

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  get filledStars(): number {
    return Math.floor(this.rating);
  }
}
