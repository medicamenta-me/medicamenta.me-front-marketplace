/**
 * ⭐ Review List Page
 * Página de listagem de avaliações do usuário
 * 
 * Features:
 * - Listagem das avaliações do usuário
 * - Filtros por tipo (produto/farmácia)
 * - Filtros por status (pendente/aprovada/rejeitada)
 * - Ordenação (recentes, antigas, melhor avaliação)
 * - Paginação com infinite scroll
 * - Ações: editar, excluir
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { ReviewService, REVIEW_STATUS_LABELS, REVIEW_SORT_LABELS, ReviewSortOption } from '../../../services/review.service';
import { Review, ReviewStatus, ReviewFilters } from '../../../models/review.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';

type TargetTypeFilter = 'all' | 'product' | 'pharmacy';
type StatusFilter = 'all' | ReviewStatus;

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RatingStarsComponent
  ],
  template: `
    <div class="review-list-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <button class="back-button" (click)="goBack()">
            <span>←</span>
          </button>
          <h1>Minhas Avaliações</h1>
        </div>
        <p class="subtitle">{{ totalReviews() }} avaliações</p>
      </header>

      <!-- Filters -->
      <section class="filters-section">
        <div class="filters-row">
          <!-- Target Type Filter -->
          <div class="filter-group">
            <label for="targetType">Tipo</label>
            <select 
              id="targetType" 
              [(ngModel)]="selectedTargetType"
              (ngModelChange)="onFilterChange()"
            >
              <option value="all">Todos</option>
              <option value="product">Produtos</option>
              <option value="pharmacy">Farmácias</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="filter-group">
            <label for="status">Status</label>
            <select 
              id="status" 
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
            >
              <option value="all">Todos</option>
              @for (status of statusOptions; track status.value) {
                <option [value]="status.value">{{ status.label }}</option>
              }
            </select>
          </div>

          <!-- Sort -->
          <div class="filter-group">
            <label for="sort">Ordenar por</label>
            <select 
              id="sort" 
              [(ngModel)]="selectedSort"
              (ngModelChange)="onFilterChange()"
            >
              @for (sort of sortOptions; track sort.value) {
                <option [value]="sort.value">{{ sort.label }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Active Filters -->
        @if (hasActiveFilters()) {
          <div class="active-filters">
            <span class="label">Filtros ativos:</span>
            @if (selectedTargetType !== 'all') {
              <span class="filter-tag">
                {{ selectedTargetType === 'product' ? 'Produtos' : 'Farmácias' }}
                <button (click)="clearTargetTypeFilter()">×</button>
              </span>
            }
            @if (selectedStatus !== 'all') {
              <span class="filter-tag">
                {{ getStatusLabel(selectedStatus) }}
                <button (click)="clearStatusFilter()">×</button>
              </span>
            }
            <button class="clear-all" (click)="clearAllFilters()">
              Limpar tudo
            </button>
          </div>
        }
      </section>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner />
          <p>Carregando avaliações...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <app-empty-state
          icon="❌"
          title="Erro ao carregar"
          [message]="error()!"
          actionText="Tentar novamente"
          (action)="loadReviews()"
        />
      }

      <!-- Empty State -->
      @if (!loading() && !error() && reviews().length === 0) {
        <app-empty-state
          icon="⭐"
          title="Nenhuma avaliação encontrada"
          [message]="emptyMessage()"
          actionText="Fazer uma compra"
          (action)="goToProducts()"
        />
      }

      <!-- Reviews List -->
      @if (!loading() && !error() && reviews().length > 0) {
        <section class="reviews-list">
          @for (review of reviews(); track review.id) {
            <article class="review-card" [class.pending]="review.status === 'pending'" [class.rejected]="review.status === 'rejected'">
              <!-- Review Header -->
              <header class="review-header">
                <div class="target-info">
                  <span class="target-type-badge" [class.product]="review.targetType === 'product'" [class.pharmacy]="review.targetType === 'pharmacy'">
                    {{ review.targetType === 'product' ? '💊' : '🏪' }}
                    {{ review.targetType === 'product' ? 'Produto' : 'Farmácia' }}
                  </span>
                  <span class="status-badge" [class]="'status-' + review.status">
                    {{ getStatusLabel(review.status) }}
                  </span>
                </div>
                <span class="review-date">{{ formatDate(review.createdAt) }}</span>
              </header>

              <!-- Rating -->
              <div class="review-rating">
                <app-rating-stars [rating]="review.rating" />
                <span class="rating-value">{{ review.rating.toFixed(1) }}</span>
              </div>

              <!-- Content -->
              @if (review.title) {
                <h3 class="review-title">{{ review.title }}</h3>
              }
              @if (review.comment) {
                <p class="review-comment">{{ review.comment }}</p>
              }

              <!-- Images -->
              @if (review.images && review.images.length > 0) {
                <div class="review-images">
                  @for (image of review.images; track $index) {
                    <img [src]="image" [alt]="'Imagem ' + ($index + 1)" class="review-image" />
                  }
                </div>
              }

              <!-- Stats -->
              <div class="review-stats">
                <span class="stat">
                  👍 {{ review.helpful }} útil
                </span>
                <span class="stat">
                  👎 {{ review.notHelpful }} não útil
                </span>
                @if (review.isVerifiedPurchase) {
                  <span class="verified-badge">✓ Compra verificada</span>
                }
              </div>

              <!-- Pharmacy Response -->
              @if (review.pharmacyResponse) {
                <div class="pharmacy-response">
                  <div class="response-header">
                    <span class="response-icon">🏪</span>
                    <span class="response-label">Resposta da farmácia</span>
                    <span class="response-date">{{ formatDate(review.pharmacyResponse.respondedAt) }}</span>
                  </div>
                  <p class="response-text">{{ review.pharmacyResponse.comment }}</p>
                </div>
              }

              <!-- Moderation Notes (if rejected) -->
              @if (review.status === 'rejected' && review.moderationNotes) {
                <div class="moderation-notes">
                  <span class="notes-icon">⚠️</span>
                  <span class="notes-label">Motivo da rejeição:</span>
                  <p class="notes-text">{{ review.moderationNotes }}</p>
                </div>
              }

              <!-- Actions -->
              <footer class="review-actions">
                @if (canEdit(review)) {
                  <button class="btn-action edit" (click)="editReview(review)">
                    ✏️ Editar
                  </button>
                }
                <button class="btn-action delete" (click)="confirmDelete(review)">
                  🗑️ Excluir
                </button>
              </footer>
            </article>
          }

          <!-- Load More -->
          @if (hasMoreReviews()) {
            <div class="load-more-container">
              @if (loadingMore()) {
                <app-loading-spinner />
              } @else {
                <button class="btn-load-more" (click)="loadMoreReviews()">
                  Carregar mais avaliações
                </button>
              }
            </div>
          }
        </section>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div 
          class="modal-overlay" 
          (click)="cancelDelete()"
          (keyup.escape)="cancelDelete()"
          tabindex="0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            class="modal-content" 
            (click)="$event.stopPropagation()"
            (keyup.escape)="$event.stopPropagation()"
            tabindex="-1"
          >
            <h2 id="modal-title">Excluir Avaliação</h2>
            <p>Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.</p>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="cancelDelete()">Cancelar</button>
              <button class="btn-confirm-delete" (click)="deleteReview()" [disabled]="deleting()">
                @if (deleting()) {
                  Excluindo...
                } @else {
                  Excluir
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .review-list-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
      padding-bottom: 80px;
    }

    /* Header */
    .page-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: #f5f5f5;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .back-button:hover {
      background: #e0e0e0;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }

    .subtitle {
      color: #666;
      margin: 4px 0 0 56px;
      font-size: 14px;
    }

    /* Filters */
    .filters-section {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filters-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 120px;
    }

    .filter-group label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .filter-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      cursor: pointer;
    }

    .active-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
      flex-wrap: wrap;
    }

    .active-filters .label {
      font-size: 12px;
      color: #666;
    }

    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 16px;
      font-size: 12px;
    }

    .filter-tag button {
      background: none;
      border: none;
      color: #1976d2;
      cursor: pointer;
      font-size: 14px;
      padding: 0;
      line-height: 1;
    }

    .clear-all {
      background: none;
      border: none;
      color: #f44336;
      cursor: pointer;
      font-size: 12px;
      padding: 4px 8px;
    }

    /* Loading */
    .loading-container {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }

    /* Reviews List */
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .review-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .review-card.pending {
      border-left: 4px solid #ff9800;
    }

    .review-card.rejected {
      border-left: 4px solid #f44336;
      opacity: 0.8;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .target-info {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .target-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .target-type-badge.product {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .target-type-badge.pharmacy {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-pending {
      background: #fff3e0;
      color: #e65100;
    }

    .status-approved {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-rejected {
      background: #ffebee;
      color: #c62828;
    }

    .status-flagged {
      background: #fce4ec;
      color: #ad1457;
    }

    .review-date {
      font-size: 12px;
      color: #999;
    }

    .review-rating {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .rating-value {
      font-size: 16px;
      font-weight: 600;
      color: #ff9800;
    }

    .review-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px;
    }

    .review-comment {
      color: #333;
      line-height: 1.5;
      margin: 0 0 12px;
    }

    .review-images {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      overflow-x: auto;
    }

    .review-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
    }

    .review-stats {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 12px 0;
      border-top: 1px solid #eee;
      margin-top: 12px;
    }

    .stat {
      font-size: 13px;
      color: #666;
    }

    .verified-badge {
      font-size: 12px;
      color: #2e7d32;
      font-weight: 500;
    }

    .pharmacy-response {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
    }

    .response-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .response-icon {
      font-size: 16px;
    }

    .response-label {
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }

    .response-date {
      font-size: 12px;
      color: #999;
      margin-left: auto;
    }

    .response-text {
      font-size: 14px;
      color: #555;
      margin: 0;
      line-height: 1.5;
    }

    .moderation-notes {
      background: #fff3e0;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
    }

    .notes-icon {
      font-size: 16px;
    }

    .notes-label {
      font-size: 13px;
      font-weight: 600;
      color: #e65100;
    }

    .notes-text {
      width: 100%;
      font-size: 14px;
      color: #333;
      margin: 0;
    }

    .review-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-action:hover {
      background: #f5f5f5;
    }

    .btn-action.edit:hover {
      border-color: #1976d2;
      color: #1976d2;
    }

    .btn-action.delete:hover {
      border-color: #f44336;
      color: #f44336;
    }

    /* Load More */
    .load-more-container {
      text-align: center;
      padding: 24px;
    }

    .btn-load-more {
      padding: 12px 32px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-load-more:hover {
      background: #1565c0;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
    }

    .modal-content h2 {
      margin: 0 0 12px;
      font-size: 20px;
    }

    .modal-content p {
      color: #666;
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 10px 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-confirm-delete {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #f44336;
      color: white;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-confirm-delete:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .filters-row {
        flex-direction: column;
      }

      .filter-group {
        min-width: 100%;
      }
    }
  `]
})
export class ReviewListPage implements OnInit {
  private readonly router = inject(Router);
  private readonly reviewService = inject(ReviewService);

  // State
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly totalReviews = signal(0);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly showDeleteModal = signal(false);
  readonly deleting = signal(false);
  readonly reviewToDelete = signal<Review | null>(null);

  // Filters
  selectedTargetType: TargetTypeFilter = 'all';
  selectedStatus: StatusFilter = 'all';
  selectedSort: ReviewSortOption = 'newest';

  // Current user ID (in real app, this would come from auth service)
  private readonly currentUserId = 'current-user-id';

  // Last document for pagination
  private lastDoc: DocumentSnapshot | null = null;
  private readonly pageSize = 10;

  // Options
  readonly statusOptions = [
    { value: ReviewStatus.PENDING, label: REVIEW_STATUS_LABELS[ReviewStatus.PENDING] },
    { value: ReviewStatus.APPROVED, label: REVIEW_STATUS_LABELS[ReviewStatus.APPROVED] },
    { value: ReviewStatus.REJECTED, label: REVIEW_STATUS_LABELS[ReviewStatus.REJECTED] },
    { value: ReviewStatus.FLAGGED, label: REVIEW_STATUS_LABELS[ReviewStatus.FLAGGED] }
  ];

  readonly sortOptions = [
    { value: 'newest' as ReviewSortOption, label: REVIEW_SORT_LABELS['newest'] },
    { value: 'oldest' as ReviewSortOption, label: REVIEW_SORT_LABELS['oldest'] },
    { value: 'highest' as ReviewSortOption, label: REVIEW_SORT_LABELS['highest'] },
    { value: 'lowest' as ReviewSortOption, label: REVIEW_SORT_LABELS['lowest'] },
    { value: 'helpful' as ReviewSortOption, label: REVIEW_SORT_LABELS['helpful'] }
  ];

  // Computed
  readonly emptyMessage = computed(() => {
    if (this.selectedTargetType !== 'all' || this.selectedStatus !== 'all') {
      return 'Nenhuma avaliação encontrada com os filtros selecionados.';
    }
    return 'Você ainda não fez nenhuma avaliação. Faça uma compra e avalie sua experiência!';
  });

  readonly hasMoreReviews = computed(() => this.hasMore());

  ngOnInit(): void {
    this.loadReviews();
  }

  /**
   * Load reviews
   */
  loadReviews(): void {
    this.loading.set(true);
    this.error.set(null);
    this.lastDoc = null;

    const filters = this.buildFilters();

    this.reviewService.getReviews(filters, this.selectedSort, this.pageSize).subscribe({
      next: (result) => {
        this.reviews.set(result.reviews);
        this.totalReviews.set(result.total);
        this.hasMore.set(result.hasMore);
        this.lastDoc = result.lastDoc;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.error.set('Não foi possível carregar as avaliações. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load more reviews (pagination)
   */
  loadMoreReviews(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    const filters = this.buildFilters();

    this.reviewService.getReviews(filters, this.selectedSort, this.pageSize, this.lastDoc).subscribe({
      next: (result) => {
        this.reviews.update(current => [...current, ...result.reviews]);
        this.hasMore.set(result.hasMore);
        this.lastDoc = result.lastDoc;
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('Error loading more reviews:', err);
        this.loadingMore.set(false);
      }
    });
  }

  /**
   * Build filters from selections
   */
  private buildFilters(): ReviewFilters {
    const filters: ReviewFilters = {
      userId: this.currentUserId
    };

    if (this.selectedTargetType !== 'all') {
      filters.targetType = this.selectedTargetType;
    }

    if (this.selectedStatus !== 'all') {
      filters.status = this.selectedStatus;
    }

    return filters;
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.loadReviews();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return this.selectedTargetType !== 'all' || this.selectedStatus !== 'all';
  }

  /**
   * Clear target type filter
   */
  clearTargetTypeFilter(): void {
    this.selectedTargetType = 'all';
    this.loadReviews();
  }

  /**
   * Clear status filter
   */
  clearStatusFilter(): void {
    this.selectedStatus = 'all';
    this.loadReviews();
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.selectedTargetType = 'all';
    this.selectedStatus = 'all';
    this.selectedSort = 'newest';
    this.loadReviews();
  }

  /**
   * Get status label
   */
  getStatusLabel(status: ReviewStatus | StatusFilter): string {
    if (status === 'all') return 'Todos';
    return this.reviewService.getStatusLabel(status);
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return this.reviewService.formatReviewDate(date);
  }

  /**
   * Check if review can be edited
   */
  canEdit(review: Review): boolean {
    // Can only edit pending or flagged reviews
    return review.status === ReviewStatus.PENDING || review.status === ReviewStatus.FLAGGED;
  }

  /**
   * Navigate to edit review
   */
  editReview(review: Review): void {
    this.router.navigate(['/reviews/edit', review.id]);
  }

  /**
   * Show delete confirmation modal
   */
  confirmDelete(review: Review): void {
    this.reviewToDelete.set(review);
    this.showDeleteModal.set(true);
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.reviewToDelete.set(null);
  }

  /**
   * Delete review
   */
  deleteReview(): void {
    const review = this.reviewToDelete();
    if (!review) return;

    this.deleting.set(true);

    this.reviewService.deleteReview(this.currentUserId, review.id).subscribe({
      next: () => {
        this.reviews.update(current => current.filter(r => r.id !== review.id));
        this.totalReviews.update(count => count - 1);
        this.showDeleteModal.set(false);
        this.reviewToDelete.set(null);
        this.deleting.set(false);
      },
      error: (err) => {
        console.error('Error deleting review:', err);
        this.deleting.set(false);
        // In a real app, show error toast
      }
    });
  }

  /**
   * Navigation
   */
  goBack(): void {
    this.router.navigate(['/account']);
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }
}
