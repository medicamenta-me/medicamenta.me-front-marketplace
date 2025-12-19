/**
 * 📭 Empty State Component
 * 
 * Estado vazio com mensagem e ação
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="icon">{{ icon }}</div>
      <h3 class="title">{{ title }}</h3>
      <p class="message">{{ message }}</p>
      @if (actionLabel) {
        <button class="btn-action" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;

      .icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
        color: #333;
      }

      .message {
        font-size: 1rem;
        color: #666;
        margin: 0 0 1.5rem;
        max-width: 400px;
      }

      .btn-action {
        padding: 0.75rem 2rem;
        background: #007bff;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #0056b3;
        }
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Nenhum resultado encontrado';
  @Input() message = 'Tente ajustar sua busca ou filtros.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
