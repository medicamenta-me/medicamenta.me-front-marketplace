/**
 * ⏳ Loading Spinner Component
 * 
 * Spinner de carregamento global
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-spinner" [class.overlay]="overlay">
      <div class="spinner"></div>
      @if (message) {
        <p class="message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;

      &.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 9999;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e0e0e0;
        border-top-color: #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .message {
        margin-top: 1rem;
        color: #666;
        font-size: 0.875rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() message = '';
}
