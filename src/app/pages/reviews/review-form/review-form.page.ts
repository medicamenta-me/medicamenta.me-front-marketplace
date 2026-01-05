/**
 * ⭐ Review Form Page
 * Página de criação e edição de avaliações
 * 
 * Features:
 * - Formulário de avaliação com validação
 * - Seleção de estrelas interativa
 * - Upload de imagens
 * - Preview de imagens
 * - Modo edição
 * - Verificação de elegibilidade
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReviewService, UserReviewStatus } from '../../../services/review.service';
import { Review, ReviewStatus, CreateReviewRequest, UpdateReviewRequest } from '../../../models/review.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type TargetType = 'product' | 'pharmacy';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="review-form-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <button class="back-button" (click)="goBack()">
            <span>←</span>
          </button>
          <h1>{{ isEditMode() ? 'Editar Avaliação' : 'Nova Avaliação' }}</h1>
        </div>
      </header>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner />
          <p>{{ isEditMode() ? 'Carregando avaliação...' : 'Verificando elegibilidade...' }}</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <app-empty-state
          icon="❌"
          title="Erro"
          [message]="error()!"
          actionText="Voltar"
          (action)="goBack()"
        />
      }

      <!-- Not Eligible State -->
      @if (!loading() && !error() && !isEligible() && !isEditMode()) {
        <app-empty-state
          icon="⚠️"
          title="Avaliação não permitida"
          [message]="eligibilityMessage()"
          actionText="Ver minhas avaliações"
          (action)="goToReviews()"
        />
      }

      <!-- Form -->
      @if (!loading() && !error() && (isEligible() || isEditMode())) {
        <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
          <!-- Target Info (only for new reviews) -->
          @if (!isEditMode()) {
            <section class="target-section">
              <div class="target-info">
                <span class="target-type-badge" [class.product]="targetType() === 'product'" [class.pharmacy]="targetType() === 'pharmacy'">
                  {{ targetType() === 'product' ? '💊 Produto' : '🏪 Farmácia' }}
                </span>
                <span class="target-name">{{ targetName() }}</span>
              </div>
            </section>
          }

          <!-- Rating -->
          <section class="form-section">
            <span class="section-label" id="rating-label">Sua avaliação <span class="required">*</span></span>
            <div class="rating-selector" role="radiogroup" aria-labelledby="rating-label">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button 
                  type="button"
                  class="star-btn"
                  [class.filled]="star <= selectedRating()"
                  [class.hover]="star <= hoverRating()"
                  (click)="setRating(star)"
                  (mouseenter)="setHoverRating(star)"
                  (mouseleave)="clearHoverRating()"
                  [attr.aria-label]="star + ' estrelas'"
                >
                  ⭐
                </button>
              }
              <span class="rating-text">{{ ratingText() }}</span>
            </div>
            @if (showRatingError()) {
              <span class="error-message">Selecione uma avaliação de 1 a 5 estrelas</span>
            }
          </section>

          <!-- Title -->
          <section class="form-section">
            <label class="section-label" for="title">Título (opcional)</label>
            <input
              type="text"
              id="title"
              formControlName="title"
              placeholder="Resuma sua experiência em uma frase"
              maxlength="100"
            />
            <span class="char-count">{{ titleLength() }}/100</span>
          </section>

          <!-- Comment -->
          <section class="form-section">
            <label class="section-label" for="comment">Comentário (opcional)</label>
            <textarea
              id="comment"
              formControlName="comment"
              placeholder="Conte mais detalhes sobre sua experiência..."
              rows="5"
              maxlength="1000"
            ></textarea>
            <span class="char-count">{{ commentLength() }}/1000</span>
          </section>

          <!-- Images -->
          <section class="form-section">
            <span class="section-label" id="images-label">Fotos (opcional)</span>
            <div class="images-container" role="group" aria-labelledby="images-label">
              <!-- Image Previews -->
              @for (image of images(); track $index) {
                <div class="image-preview">
                  <img [src]="image" [alt]="'Imagem ' + ($index + 1)" />
                  <button 
                    type="button" 
                    class="remove-image-btn"
                    (click)="removeImage($index)"
                    aria-label="Remover imagem"
                  >
                    ×
                  </button>
                </div>
              }
              
              <!-- Add Image Button -->
              @if (images().length < maxImages) {
                <label class="add-image-btn" [class.disabled]="uploading()">
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onImageSelected($event)"
                    [disabled]="uploading()"
                  />
                  @if (uploading()) {
                    <app-loading-spinner />
                  } @else {
                    <span class="icon">📷</span>
                    <span class="text">Adicionar foto</span>
                  }
                </label>
              }
            </div>
            <p class="hint">Máximo de {{ maxImages }} fotos</p>
          </section>

          <!-- Submit -->
          <section class="form-actions">
            <button 
              type="button" 
              class="btn-cancel" 
              (click)="goBack()"
              [disabled]="submitting()"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn-submit"
              [disabled]="!isFormValid() || submitting()"
            >
              @if (submitting()) {
                <app-loading-spinner />
                {{ isEditMode() ? 'Salvando...' : 'Enviando...' }}
              } @else {
                {{ isEditMode() ? 'Salvar alterações' : 'Enviar avaliação' }}
              }
            </button>
          </section>

          <!-- Guidelines -->
          <section class="guidelines">
            <h3>Diretrizes para avaliações</h3>
            <ul>
              <li>Seja honesto e objetivo sobre sua experiência</li>
              <li>Evite conteúdo ofensivo ou inadequado</li>
              <li>Não inclua informações pessoais</li>
              <li>Fotos devem ser relevantes ao produto/serviço</li>
            </ul>
          </section>
        </form>
      }
    </div>
  `,
  styles: [`
    .review-form-container {
      max-width: 600px;
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

    /* Loading */
    .loading-container {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }

    /* Target Section */
    .target-section {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .target-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .target-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
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

    .target-name {
      font-size: 16px;
      font-weight: 500;
    }

    /* Form Sections */
    .form-section {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }

    .required {
      color: #f44336;
    }

    /* Rating Selector */
    .rating-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .star-btn {
      background: none;
      border: none;
      font-size: 32px;
      cursor: pointer;
      padding: 4px;
      filter: grayscale(100%);
      opacity: 0.4;
      transition: all 0.2s;
    }

    .star-btn.filled,
    .star-btn.hover {
      filter: grayscale(0%);
      opacity: 1;
    }

    .star-btn:hover {
      transform: scale(1.1);
    }

    .rating-text {
      margin-left: 12px;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .error-message {
      display: block;
      margin-top: 8px;
      font-size: 13px;
      color: #f44336;
    }

    /* Inputs */
    input[type="text"],
    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    input[type="text"]:focus,
    textarea:focus {
      outline: none;
      border-color: #1976d2;
    }

    textarea {
      resize: vertical;
      min-height: 120px;
    }

    .char-count {
      display: block;
      text-align: right;
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }

    /* Images */
    .images-container {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .image-preview {
      position: relative;
      width: 100px;
      height: 100px;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }

    .remove-image-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: #f44336;
      color: white;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .add-image-btn {
      width: 100px;
      height: 100px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .add-image-btn:hover {
      border-color: #1976d2;
      background: #f5f5f5;
    }

    .add-image-btn.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .add-image-btn input {
      display: none;
    }

    .add-image-btn .icon {
      font-size: 24px;
    }

    .add-image-btn .text {
      font-size: 11px;
      color: #666;
    }

    .hint {
      font-size: 12px;
      color: #999;
      margin: 8px 0 0;
    }

    /* Actions */
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .btn-cancel,
    .btn-submit {
      flex: 1;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-cancel {
      background: white;
      border: 1px solid #ddd;
      color: #666;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .btn-submit {
      background: #1976d2;
      border: none;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #1565c0;
    }

    .btn-submit:disabled,
    .btn-cancel:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Guidelines */
    .guidelines {
      background: #fff8e1;
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
    }

    .guidelines h3 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px;
      color: #f57c00;
    }

    .guidelines ul {
      margin: 0;
      padding-left: 20px;
    }

    .guidelines li {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .form-actions {
        flex-direction: column;
      }

      .btn-cancel {
        order: 2;
      }

      .btn-submit {
        order: 1;
      }
    }
  `]
})
export class ReviewFormPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly reviewService = inject(ReviewService);

  // State
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly uploading = signal(false);
  readonly isEligible = signal(false);
  readonly eligibilityMessage = signal('');
  
  // Edit mode
  readonly isEditMode = signal(false);
  readonly existingReview = signal<Review | null>(null);

  // Target info (for new reviews)
  readonly targetType = signal<TargetType>('product');
  readonly targetId = signal('');
  readonly targetName = signal('');
  readonly orderId = signal('');

  // Rating
  readonly selectedRating = signal(0);
  readonly hoverRating = signal(0);
  readonly showRatingError = signal(false);

  // Images
  readonly images = signal<string[]>([]);
  readonly maxImages = 5;

  // Form
  reviewForm: FormGroup;

  // Current user ID (in real app, this would come from auth service)
  private readonly currentUserId = 'current-user-id';

  // Rating texts
  private readonly ratingTexts: Record<number, string> = {
    0: '',
    1: 'Péssimo',
    2: 'Ruim',
    3: 'Regular',
    4: 'Bom',
    5: 'Excelente'
  };

  // Computed
  readonly ratingText = computed(() => {
    const hover = this.hoverRating();
    const selected = this.selectedRating();
    return this.ratingTexts[hover || selected] || '';
  });

  readonly titleLength = computed(() => {
    return this.reviewForm?.get('title')?.value?.length || 0;
  });

  readonly commentLength = computed(() => {
    return this.reviewForm?.get('comment')?.value?.length || 0;
  });

  constructor() {
    this.reviewForm = this.fb.group({
      title: ['', [Validators.maxLength(100)]],
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.initializeFromRoute();
  }

  /**
   * Initialize from route params
   */
  private initializeFromRoute(): void {
    const reviewId = this.route.snapshot.paramMap.get('id');
    
    if (reviewId) {
      // Edit mode
      this.isEditMode.set(true);
      this.loadExistingReview(reviewId);
    } else {
      // New review mode
      const queryParams = this.route.snapshot.queryParams;
      this.targetType.set((queryParams['type'] as TargetType) || 'product');
      this.targetId.set(queryParams['targetId'] || '');
      this.orderId.set(queryParams['orderId'] || '');
      this.targetName.set(queryParams['targetName'] || 'Item');
      
      this.checkEligibility();
    }
  }

  /**
   * Load existing review for editing
   */
  private loadExistingReview(reviewId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.reviewService.getReviewById(reviewId).subscribe({
      next: (review) => {
        if (!review) {
          this.error.set('Avaliação não encontrada.');
          this.loading.set(false);
          return;
        }

        if (review.userId !== this.currentUserId) {
          this.error.set('Você não tem permissão para editar esta avaliação.');
          this.loading.set(false);
          return;
        }

        if (review.status !== ReviewStatus.PENDING && review.status !== ReviewStatus.FLAGGED) {
          this.error.set('Esta avaliação não pode mais ser editada.');
          this.loading.set(false);
          return;
        }

        this.existingReview.set(review);
        this.selectedRating.set(review.rating);
        this.images.set(review.images || []);
        this.reviewForm.patchValue({
          title: review.title || '',
          comment: review.comment || ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading review:', err);
        this.error.set('Não foi possível carregar a avaliação.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Check if user can review this target
   */
  private checkEligibility(): void {
    this.loading.set(true);
    this.error.set(null);

    if (!this.targetId() || !this.orderId()) {
      this.error.set('Parâmetros inválidos para avaliação.');
      this.loading.set(false);
      return;
    }

    this.reviewService.canUserReview(
      this.currentUserId,
      this.targetType(),
      this.targetId(),
      this.orderId()
    ).subscribe({
      next: (status: UserReviewStatus) => {
        this.isEligible.set(status.canReview);
        if (!status.canReview) {
          this.eligibilityMessage.set(
            status.reason || 'Você já avaliou este item ou não possui um pedido elegível para avaliação.'
          );
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error checking eligibility:', err);
        this.error.set('Não foi possível verificar elegibilidade.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Set rating
   */
  setRating(rating: number): void {
    this.selectedRating.set(rating);
    this.showRatingError.set(false);
  }

  /**
   * Set hover rating
   */
  setHoverRating(rating: number): void {
    this.hoverRating.set(rating);
  }

  /**
   * Clear hover rating
   */
  clearHoverRating(): void {
    this.hoverRating.set(0);
  }

  /**
   * Handle image selection
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large');
      return;
    }

    this.uploadImage(file);
    input.value = ''; // Reset input
  }

  /**
   * Upload image (mock - in real app, upload to storage)
   */
  private uploadImage(file: File): void {
    this.uploading.set(true);

    // Mock upload - in real app, upload to Firebase Storage
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.images.update(current => [...current, dataUrl]);
      this.uploading.set(false);
    };
    reader.onerror = () => {
      console.error('Error reading file');
      this.uploading.set(false);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove image
   */
  removeImage(index: number): void {
    this.images.update(current => current.filter((_, i) => i !== index));
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.selectedRating() > 0 && this.reviewForm.valid;
  }

  /**
   * Submit review
   */
  submitReview(): void {
    if (!this.isFormValid()) {
      if (this.selectedRating() === 0) {
        this.showRatingError.set(true);
      }
      return;
    }

    this.submitting.set(true);

    if (this.isEditMode()) {
      this.updateReview();
    } else {
      this.createReview();
    }
  }

  /**
   * Create new review
   */
  private createReview(): void {
    const request: CreateReviewRequest = {
      targetType: this.targetType(),
      targetId: this.targetId(),
      orderId: this.orderId(),
      rating: this.selectedRating(),
      title: this.reviewForm.get('title')?.value || undefined,
      comment: this.reviewForm.get('comment')?.value || undefined,
      images: this.images().length > 0 ? this.images() : undefined
    };

    this.reviewService.createReview(this.currentUserId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/reviews'], {
          queryParams: { created: 'true' }
        });
      },
      error: (err) => {
        console.error('Error creating review:', err);
        this.submitting.set(false);
        this.error.set('Não foi possível enviar a avaliação. Tente novamente.');
      }
    });
  }

  /**
   * Update existing review
   */
  private updateReview(): void {
    const review = this.existingReview();
    if (!review) return;

    const request: UpdateReviewRequest = {
      rating: this.selectedRating(),
      title: this.reviewForm.get('title')?.value || undefined,
      comment: this.reviewForm.get('comment')?.value || undefined,
      images: this.images().length > 0 ? this.images() : undefined
    };

    this.reviewService.updateReview(this.currentUserId, review.id, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/reviews'], {
          queryParams: { updated: 'true' }
        });
      },
      error: (err) => {
        console.error('Error updating review:', err);
        this.submitting.set(false);
        this.error.set('Não foi possível atualizar a avaliação. Tente novamente.');
      }
    });
  }

  /**
   * Navigation
   */
  goBack(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/reviews']);
    } else {
      window.history.back();
    }
  }

  goToReviews(): void {
    this.router.navigate(['/reviews']);
  }
}
