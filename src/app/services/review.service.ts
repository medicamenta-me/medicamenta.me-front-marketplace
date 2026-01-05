/**
 * ⭐ Review Service
 * Serviço para gerenciamento de avaliações de produtos e farmácias
 * 
 * Funcionalidades:
 * - Listagem de avaliações com filtros
 * - Criação de avaliação
 * - Atualização de avaliação
 * - Exclusão de avaliação
 * - Marcar como útil
 * - Denunciar avaliação
 * - Resposta da farmácia
 * - Estatísticas de avaliações
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  FieldValue
} from '@angular/fire/firestore';
import { Observable, from, of, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { 
  Review, 
  ReviewStatus, 
  ReviewFilters, 
  ReviewSummary,
  CreateReviewRequest,
  UpdateReviewRequest,
  MarkHelpfulRequest,
  ReportReviewRequest
} from '../models/review.model';

// Labels para status
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  [ReviewStatus.PENDING]: 'Pendente',
  [ReviewStatus.APPROVED]: 'Aprovada',
  [ReviewStatus.REJECTED]: 'Rejeitada',
  [ReviewStatus.FLAGGED]: 'Sinalizada'
};

// Opções de ordenação
export type ReviewSortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

export const REVIEW_SORT_LABELS: Record<ReviewSortOption, string> = {
  newest: 'Mais recentes',
  oldest: 'Mais antigas',
  highest: 'Maior nota',
  lowest: 'Menor nota',
  helpful: 'Mais úteis'
};

export interface ReviewListResult {
  reviews: Review[];
  total: number;
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
}

export interface UserReviewStatus {
  canReview: boolean;
  reason?: string;
  existingReviewId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly firestore = inject(Firestore);
  private readonly pageSize = 10;
  
  // Cache
  private reviewCache = new Map<string, Review>();
  private summaryCache = new Map<string, ReviewSummary>();
  private cacheExpiry = new Map<string, number>();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutos
  
  // State
  private lastDocSubject = new BehaviorSubject<DocumentSnapshot | null>(null);
  private userHelpfulVotes = new Map<string, boolean>(); // reviewId -> helpful
  
  // Signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentReview = signal<Review | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly totalReviews = signal(0);
  readonly summary = signal<ReviewSummary | null>(null);
  
  // Computed
  readonly hasReviews = computed(() => this.reviews().length > 0);
  readonly averageRating = computed(() => this.summary()?.averageRating ?? 0);

  /**
   * Lista avaliações com filtros e paginação
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getReviews(
    filters: ReviewFilters = {},
    sortBy: ReviewSortOption = 'newest',
    pageSize: number = this.pageSize,
    lastDoc: DocumentSnapshot | null = null
  ): Observable<ReviewListResult> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const reviewsRef = collection(this.firestore, 'reviews');
      const constraints: QueryConstraint[] = [];

      // Filtros
      if (filters.targetType) {
        constraints.push(where('targetType', '==', filters.targetType));
      }
      if (filters.targetId) {
        constraints.push(where('targetId', '==', filters.targetId));
      }
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }
      if (filters.rating) {
        constraints.push(where('rating', '==', filters.rating));
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.isVerifiedPurchase !== undefined) {
        constraints.push(where('isVerifiedPurchase', '==', filters.isVerifiedPurchase));
      }

      // Ordenação
      const sortConstraint = this.getSortConstraint(sortBy);
      constraints.push(sortConstraint);

      // Paginação
      constraints.push(limit(pageSize));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(reviewsRef, ...constraints);

      return from(getDocs(q)).pipe(
        map(snapshot => {
          const reviews = snapshot.docs.map(docSnapshot => {
            const data = docSnapshot.data();
            const review = this.mapToReview(docSnapshot.id, data);
            
            // Cache individual
            this.reviewCache.set(review.id, review);
            this.cacheExpiry.set(`review_${review.id}`, Date.now() + this.cacheDuration);
            
            return review;
          });

          const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;
          this.lastDocSubject.next(lastDocument);

          this.reviews.set(reviews);

          return {
            reviews,
            total: reviews.length,
            hasMore: snapshot.docs.length === pageSize,
            lastDoc: lastDocument
          };
        }),
        tap(() => this.loading.set(false)),
        catchError(err => {
          this.loading.set(false);
          this.error.set('Erro ao carregar avaliações');
          console.error('Error loading reviews:', err);
          return of({
            reviews: [],
            total: 0,
            hasMore: false,
            lastDoc: null
          });
        })
      );
    } catch (err) {
      this.loading.set(false);
      this.error.set('Erro ao configurar consulta');
      return of({
        reviews: [],
        total: 0,
        hasMore: false,
        lastDoc: null
      });
    }
  }

  /**
   * Obtém uma avaliação específica por ID
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getReviewById(id: string): Observable<Review | null> {
    // Verificar cache
    const cached = this.reviewCache.get(id);
    const expiry = this.cacheExpiry.get(`review_${id}`);
    if (cached && expiry && Date.now() < expiry) {
      this.currentReview.set(cached);
      return of(cached);
    }

    this.loading.set(true);
    this.error.set(null);

    const reviewRef = doc(this.firestore, 'reviews', id);

    return from(getDoc(reviewRef)).pipe(
      map(docSnapshot => {
        if (!docSnapshot.exists()) {
          this.currentReview.set(null);
          return null;
        }

        const data = docSnapshot.data();
        const review = this.mapToReview(docSnapshot.id, data);
        
        // Cache
        this.reviewCache.set(review.id, review);
        this.cacheExpiry.set(`review_${review.id}`, Date.now() + this.cacheDuration);
        
        this.currentReview.set(review);
        return review;
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        this.error.set('Erro ao carregar avaliação');
        console.error('Error loading review:', err);
        return of(null);
      })
    );
  }

  /**
   * Obtém avaliações de um produto
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getProductReviews(
    productId: string,
    sortBy: ReviewSortOption = 'newest',
    pageSize: number = this.pageSize,
    lastDoc: DocumentSnapshot | null = null
  ): Observable<ReviewListResult> {
    return this.getReviews(
      { targetType: 'product', targetId: productId, status: ReviewStatus.APPROVED },
      sortBy,
      pageSize,
      lastDoc
    );
  }

  /**
   * Obtém avaliações de uma farmácia
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getPharmacyReviews(
    pharmacyId: string,
    sortBy: ReviewSortOption = 'newest',
    pageSize: number = this.pageSize,
    lastDoc: DocumentSnapshot | null = null
  ): Observable<ReviewListResult> {
    return this.getReviews(
      { targetType: 'pharmacy', targetId: pharmacyId, status: ReviewStatus.APPROVED },
      sortBy,
      pageSize,
      lastDoc
    );
  }

  /**
   * Obtém avaliações do usuário atual
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getUserReviews(
    userId: string,
    sortBy: ReviewSortOption = 'newest',
    pageSize: number = this.pageSize,
    lastDoc: DocumentSnapshot | null = null
  ): Observable<ReviewListResult> {
    return this.getReviews(
      { userId },
      sortBy,
      pageSize,
      lastDoc
    );
  }

  /**
   * Cria uma nova avaliação
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  createReview(userId: string, request: CreateReviewRequest): Observable<Review> {
    this.loading.set(true);
    this.error.set(null);

    // Validação
    const validationError = this.validateCreateRequest(request);
    if (validationError) {
      this.loading.set(false);
      this.error.set(validationError);
      return throwError(() => new Error(validationError));
    }

    const reviewsRef = collection(this.firestore, 'reviews');
    const reviewData = {
      userId,
      targetType: request.targetType,
      targetId: request.targetId,
      orderId: request.orderId,
      rating: request.rating,
      title: request.title || null,
      comment: request.comment || null,
      images: request.images || [],
      isVerifiedPurchase: true, // Assume compra verificada
      helpful: 0,
      notHelpful: 0,
      status: ReviewStatus.PENDING,
      reportCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    return from(addDoc(reviewsRef, reviewData)).pipe(
      map(docRef => {
        const review: Review = {
          id: docRef.id,
          userId,
          targetType: request.targetType,
          targetId: request.targetId,
          orderId: request.orderId,
          rating: request.rating,
          title: request.title,
          comment: request.comment,
          images: request.images || [],
          isVerifiedPurchase: true,
          helpful: 0,
          notHelpful: 0,
          status: ReviewStatus.PENDING,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Atualizar cache
        this.reviewCache.set(review.id, review);
        this.cacheExpiry.set(`review_${review.id}`, Date.now() + this.cacheDuration);
        
        // Invalidar cache de summary
        this.invalidateSummaryCache(request.targetType, request.targetId);
        
        this.currentReview.set(review);
        return review;
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        this.error.set('Erro ao criar avaliação');
        console.error('Error creating review:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Atualiza uma avaliação existente
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  updateReview(reviewId: string, userId: string, request: UpdateReviewRequest): Observable<Review> {
    this.loading.set(true);
    this.error.set(null);

    // Validação
    if (request.rating !== undefined && (request.rating < 1 || request.rating > 5)) {
      this.loading.set(false);
      this.error.set('Rating deve ser entre 1 e 5');
      return throwError(() => new Error('Rating deve ser entre 1 e 5'));
    }

    return this.getReviewById(reviewId).pipe(
      switchMap(existingReview => {
        if (!existingReview) {
          this.loading.set(false);
          this.error.set('Avaliação não encontrada');
          return throwError(() => new Error('Avaliação não encontrada'));
        }

        if (existingReview.userId !== userId) {
          this.loading.set(false);
          this.error.set('Você não pode editar esta avaliação');
          return throwError(() => new Error('Você não pode editar esta avaliação'));
        }

        const reviewRef = doc(this.firestore, 'reviews', reviewId);
        const updateData: { [key: string]: string | number | string[] | FieldValue | ReviewStatus } = {
          updatedAt: serverTimestamp()
        };

        if (request.rating !== undefined) updateData['rating'] = request.rating;
        if (request.title !== undefined) updateData['title'] = request.title;
        if (request.comment !== undefined) updateData['comment'] = request.comment;
        if (request.images !== undefined) updateData['images'] = request.images;

        // Volta para pendente se editada
        updateData['status'] = ReviewStatus.PENDING;

        return from(updateDoc(reviewRef, updateData)).pipe(
          map(() => {
            const updatedReview: Review = {
              ...existingReview,
              rating: request.rating ?? existingReview.rating,
              title: request.title ?? existingReview.title,
              comment: request.comment ?? existingReview.comment,
              images: request.images ?? existingReview.images,
              status: ReviewStatus.PENDING,
              updatedAt: new Date()
            };

            // Atualizar cache
            this.reviewCache.set(reviewId, updatedReview);
            this.cacheExpiry.set(`review_${reviewId}`, Date.now() + this.cacheDuration);
            
            // Invalidar cache de summary
            this.invalidateSummaryCache(existingReview.targetType, existingReview.targetId);
            
            this.currentReview.set(updatedReview);
            return updatedReview;
          })
        );
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        if (!this.error()) {
          this.error.set('Erro ao atualizar avaliação');
        }
        console.error('Error updating review:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Exclui uma avaliação
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  deleteReview(reviewId: string, userId: string): Observable<boolean> {
    this.loading.set(true);
    this.error.set(null);

    return this.getReviewById(reviewId).pipe(
      switchMap(existingReview => {
        if (!existingReview) {
          this.loading.set(false);
          this.error.set('Avaliação não encontrada');
          return throwError(() => new Error('Avaliação não encontrada'));
        }

        if (existingReview.userId !== userId) {
          this.loading.set(false);
          this.error.set('Você não pode excluir esta avaliação');
          return throwError(() => new Error('Você não pode excluir esta avaliação'));
        }

        const reviewRef = doc(this.firestore, 'reviews', reviewId);

        return from(deleteDoc(reviewRef)).pipe(
          map(() => {
            // Remover do cache
            this.reviewCache.delete(reviewId);
            this.cacheExpiry.delete(`review_${reviewId}`);
            
            // Invalidar cache de summary
            this.invalidateSummaryCache(existingReview.targetType, existingReview.targetId);
            
            // Atualizar lista
            const currentReviews = this.reviews();
            this.reviews.set(currentReviews.filter(r => r.id !== reviewId));
            
            this.currentReview.set(null);
            return true;
          })
        );
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        if (!this.error()) {
          this.error.set('Erro ao excluir avaliação');
        }
        console.error('Error deleting review:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Marca uma avaliação como útil ou não útil
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  markHelpful(reviewId: string, userId: string, request: MarkHelpfulRequest): Observable<Review> {
    this.loading.set(true);
    this.error.set(null);

    // Verificar se usuário já votou
    const voteKey = `${userId}_${reviewId}`;
    const previousVote = this.userHelpfulVotes.get(voteKey);

    return this.getReviewById(reviewId).pipe(
      switchMap(existingReview => {
        if (!existingReview) {
          this.loading.set(false);
          this.error.set('Avaliação não encontrada');
          return throwError(() => new Error('Avaliação não encontrada'));
        }

        const reviewRef = doc(this.firestore, 'reviews', reviewId);
        const updateData: { [key: string]: FieldValue } = {};

        // Se já votou, reverter voto anterior
        if (previousVote !== undefined) {
          if (previousVote) {
            updateData['helpful'] = increment(-1);
          } else {
            updateData['notHelpful'] = increment(-1);
          }
        }

        // Aplicar novo voto
        if (request.helpful) {
          updateData['helpful'] = increment(1);
        } else {
          updateData['notHelpful'] = increment(1);
        }

        return from(updateDoc(reviewRef, updateData)).pipe(
          map(() => {
            // Calcular novos valores
            let helpful = existingReview.helpful;
            let notHelpful = existingReview.notHelpful;

            if (previousVote !== undefined) {
              if (previousVote) helpful--;
              else notHelpful--;
            }

            if (request.helpful) helpful++;
            else notHelpful++;

            const updatedReview: Review = {
              ...existingReview,
              helpful,
              notHelpful
            };

            // Atualizar cache de votos
            this.userHelpfulVotes.set(voteKey, request.helpful);

            // Atualizar cache de review
            this.reviewCache.set(reviewId, updatedReview);
            this.cacheExpiry.set(`review_${reviewId}`, Date.now() + this.cacheDuration);
            
            this.currentReview.set(updatedReview);
            return updatedReview;
          })
        );
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        if (!this.error()) {
          this.error.set('Erro ao marcar avaliação');
        }
        console.error('Error marking review helpful:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Denuncia uma avaliação
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  reportReview(reviewId: string, userId: string, request: ReportReviewRequest): Observable<boolean> {
    this.loading.set(true);
    this.error.set(null);

    // Validação
    if (!request.reason || request.reason.trim().length < 5) {
      this.loading.set(false);
      this.error.set('Motivo da denúncia é obrigatório');
      return throwError(() => new Error('Motivo da denúncia é obrigatório'));
    }

    return this.getReviewById(reviewId).pipe(
      switchMap(existingReview => {
        if (!existingReview) {
          this.loading.set(false);
          this.error.set('Avaliação não encontrada');
          return throwError(() => new Error('Avaliação não encontrada'));
        }

        // Criar registro de denúncia
        const reportsRef = collection(this.firestore, 'review_reports');
        const reportData = {
          reviewId,
          userId,
          reason: request.reason.trim(),
          details: request.details?.trim() || null,
          createdAt: serverTimestamp()
        };

        // Incrementar contador de denúncias na avaliação
        const reviewRef = doc(this.firestore, 'reviews', reviewId);
        const reviewUpdateData: { [key: string]: FieldValue | ReviewStatus } = {
          reportCount: increment(1)
        };

        // Se atingir limite, sinalizar para revisão
        if (existingReview.reportCount >= 2) {
          reviewUpdateData['status'] = ReviewStatus.FLAGGED;
        }

        return from(Promise.all([
          addDoc(reportsRef, reportData),
          updateDoc(reviewRef, reviewUpdateData)
        ])).pipe(
          map(() => {
            // Atualizar cache
            const updatedReview: Review = {
              ...existingReview,
              reportCount: existingReview.reportCount + 1,
              status: existingReview.reportCount >= 2 ? ReviewStatus.FLAGGED : existingReview.status
            };
            this.reviewCache.set(reviewId, updatedReview);
            this.cacheExpiry.set(`review_${reviewId}`, Date.now() + this.cacheDuration);
            
            return true;
          })
        );
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        if (!this.error()) {
          this.error.set('Erro ao denunciar avaliação');
        }
        console.error('Error reporting review:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtém o resumo de avaliações de um produto ou farmácia
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  getReviewSummary(targetType: 'product' | 'pharmacy', targetId: string): Observable<ReviewSummary> {
    // Verificar cache
    const cacheKey = `${targetType}_${targetId}`;
    const cached = this.summaryCache.get(cacheKey);
    const expiry = this.cacheExpiry.get(`summary_${cacheKey}`);
    if (cached && expiry && Date.now() < expiry) {
      this.summary.set(cached);
      return of(cached);
    }

    this.loading.set(true);
    this.error.set(null);

    const reviewsRef = collection(this.firestore, 'reviews');
    const q = query(
      reviewsRef,
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      where('status', '==', ReviewStatus.APPROVED)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const reviews = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return this.mapToReview(docSnapshot.id, data);
        });

        const summary = this.calculateSummary(reviews);
        
        // Cache
        this.summaryCache.set(cacheKey, summary);
        this.cacheExpiry.set(`summary_${cacheKey}`, Date.now() + this.cacheDuration);
        
        this.summary.set(summary);
        this.totalReviews.set(summary.totalReviews);
        return summary;
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        this.error.set('Erro ao carregar resumo de avaliações');
        console.error('Error loading review summary:', err);
        return of(this.getEmptySummary());
      })
    );
  }

  /**
   * Verifica se o usuário pode avaliar um produto/farmácia
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  canUserReview(
    userId: string, 
    targetType: 'product' | 'pharmacy', 
    targetId: string, 
    orderId: string
  ): Observable<UserReviewStatus> {
    this.loading.set(true);
    this.error.set(null);

    const reviewsRef = collection(this.firestore, 'reviews');
    
    // Verificar se já existe avaliação para este pedido
    const q = query(
      reviewsRef,
      where('userId', '==', userId),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      where('orderId', '==', orderId)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          return {
            canReview: true
          };
        }

        const existingReview = snapshot.docs[0];
        return {
          canReview: false,
          reason: 'Você já avaliou este item neste pedido',
          existingReviewId: existingReview.id
        };
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        this.error.set('Erro ao verificar permissão de avaliação');
        console.error('Error checking review permission:', err);
        return of({
          canReview: false,
          reason: 'Erro ao verificar permissão'
        });
      })
    );
  }

  /**
   * Adiciona resposta da farmácia a uma avaliação
   */
  /* istanbul ignore next - Requires Firebase Emulators for testing */
  addPharmacyResponse(
    reviewId: string, 
    pharmacyUserId: string, 
    comment: string
  ): Observable<Review> {
    this.loading.set(true);
    this.error.set(null);

    // Validação
    if (!comment || comment.trim().length < 10) {
      this.loading.set(false);
      this.error.set('Resposta deve ter pelo menos 10 caracteres');
      return throwError(() => new Error('Resposta deve ter pelo menos 10 caracteres'));
    }

    return this.getReviewById(reviewId).pipe(
      switchMap(existingReview => {
        if (!existingReview) {
          this.loading.set(false);
          this.error.set('Avaliação não encontrada');
          return throwError(() => new Error('Avaliação não encontrada'));
        }

        if (existingReview.targetType !== 'pharmacy') {
          this.loading.set(false);
          this.error.set('Apenas avaliações de farmácias podem receber resposta');
          return throwError(() => new Error('Apenas avaliações de farmácias podem receber resposta'));
        }

        const reviewRef = doc(this.firestore, 'reviews', reviewId);
        const pharmacyResponse = {
          comment: comment.trim(),
          respondedAt: serverTimestamp(),
          respondedBy: pharmacyUserId
        };

        return from(updateDoc(reviewRef, { 
          pharmacyResponse,
          updatedAt: serverTimestamp()
        })).pipe(
          map(() => {
            const updatedReview: Review = {
              ...existingReview,
              pharmacyResponse: {
                comment: comment.trim(),
                respondedAt: new Date(),
                respondedBy: pharmacyUserId
              },
              updatedAt: new Date()
            };

            // Atualizar cache
            this.reviewCache.set(reviewId, updatedReview);
            this.cacheExpiry.set(`review_${reviewId}`, Date.now() + this.cacheDuration);
            
            this.currentReview.set(updatedReview);
            return updatedReview;
          })
        );
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        if (!this.error()) {
          this.error.set('Erro ao adicionar resposta');
        }
        console.error('Error adding pharmacy response:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Limpa o estado atual
   */
  clearState(): void {
    this.reviews.set([]);
    this.currentReview.set(null);
    this.totalReviews.set(0);
    this.summary.set(null);
    this.error.set(null);
    this.loading.set(false);
    this.lastDocSubject.next(null);
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.reviewCache.clear();
    this.summaryCache.clear();
    this.cacheExpiry.clear();
    this.userHelpfulVotes.clear();
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Obtém constraint de ordenação
   */
  private getSortConstraint(sortBy: ReviewSortOption): QueryConstraint {
    switch (sortBy) {
      case 'oldest':
        return orderBy('createdAt', 'asc');
      case 'highest':
        return orderBy('rating', 'desc');
      case 'lowest':
        return orderBy('rating', 'asc');
      case 'helpful':
        return orderBy('helpful', 'desc');
      case 'newest':
      default:
        return orderBy('createdAt', 'desc');
    }
  }

  /**
   * Mapeia documento para Review
   */
  private mapToReview(id: string, data: Record<string, unknown>): Review {
    return {
      id,
      userId: data['userId'] as string,
      userName: data['userName'] as string | undefined,
      userAvatar: data['userAvatar'] as string | undefined,
      targetType: data['targetType'] as 'product' | 'pharmacy',
      targetId: data['targetId'] as string,
      orderId: data['orderId'] as string,
      rating: data['rating'] as number,
      title: data['title'] as string | undefined,
      comment: data['comment'] as string | undefined,
      images: (data['images'] as string[]) || [],
      isVerifiedPurchase: (data['isVerifiedPurchase'] as boolean) ?? false,
      helpful: (data['helpful'] as number) ?? 0,
      notHelpful: (data['notHelpful'] as number) ?? 0,
      pharmacyResponse: data['pharmacyResponse'] ? {
        comment: (data['pharmacyResponse'] as Record<string, unknown>)['comment'] as string,
        respondedAt: this.toDate((data['pharmacyResponse'] as Record<string, unknown>)['respondedAt']),
        respondedBy: (data['pharmacyResponse'] as Record<string, unknown>)['respondedBy'] as string
      } : undefined,
      status: (data['status'] as ReviewStatus) || ReviewStatus.PENDING,
      moderationNotes: data['moderationNotes'] as string | undefined,
      reportCount: (data['reportCount'] as number) ?? 0,
      createdAt: this.toDate(data['createdAt']),
      updatedAt: this.toDate(data['updatedAt'])
    };
  }

  /**
   * Converte Timestamp ou Date para Date
   */
  private toDate(value: unknown): Date {
    if (!value) return new Date();
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return new Date();
  }

  /**
   * Valida requisição de criação
   */
  private validateCreateRequest(request: CreateReviewRequest): string | null {
    if (!request.targetType) {
      return 'Tipo de avaliação é obrigatório';
    }
    if (!request.targetId) {
      return 'ID do alvo é obrigatório';
    }
    if (!request.orderId) {
      return 'ID do pedido é obrigatório';
    }
    if (!request.rating || request.rating < 1 || request.rating > 5) {
      return 'Rating deve ser entre 1 e 5';
    }
    return null;
  }

  /**
   * Calcula resumo de avaliações
   */
  private calculateSummary(reviews: Review[]): ReviewSummary {
    if (reviews.length === 0) {
      return this.getEmptySummary();
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let verifiedCount = 0;

    for (const review of reviews) {
      const rating = review.rating as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[rating]++;
      totalRating += review.rating;
      if (review.isVerifiedPurchase) verifiedCount++;
    }

    return {
      averageRating: totalRating / reviews.length,
      totalReviews: reviews.length,
      ratingDistribution,
      verifiedPurchasePercentage: (verifiedCount / reviews.length) * 100
    };
  }

  /**
   * Retorna resumo vazio
   */
  private getEmptySummary(): ReviewSummary {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedPurchasePercentage: 0
    };
  }

  /**
   * Invalida cache de summary
   */
  private invalidateSummaryCache(targetType: 'product' | 'pharmacy', targetId: string): void {
    const cacheKey = `${targetType}_${targetId}`;
    this.summaryCache.delete(cacheKey);
    this.cacheExpiry.delete(`summary_${cacheKey}`);
  }

  // ==================== FORMATADORES ====================

  /**
   * Formata data da avaliação
   */
  formatReviewDate(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'Agora mesmo' : `${minutes} minutos atrás`;
      }
      return hours === 1 ? '1 hora atrás' : `${hours} horas atrás`;
    }
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 semana atrás' : `${weeks} semanas atrás`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 mês atrás' : `${months} meses atrás`;
    }
    
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Formata porcentagem de rating
   */
  formatRatingPercentage(distribution: ReviewSummary['ratingDistribution'], rating: 1 | 2 | 3 | 4 | 5): number {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    return Math.round((distribution[rating] / total) * 100);
  }

  /**
   * Obtém label do status
   */
  getStatusLabel(status: ReviewStatus): string {
    return REVIEW_STATUS_LABELS[status] || status;
  }

  /**
   * Obtém label de ordenação
   */
  getSortLabel(sortBy: ReviewSortOption): string {
    return REVIEW_SORT_LABELS[sortBy] || sortBy;
  }

  /**
   * Gera estrelas para display
   */
  getStarsArray(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    const roundedRating = Math.round(rating * 2) / 2; // Arredondar para 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (roundedRating >= i) {
        stars.push('full');
      } else if (roundedRating >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    
    return stars;
  }
}
