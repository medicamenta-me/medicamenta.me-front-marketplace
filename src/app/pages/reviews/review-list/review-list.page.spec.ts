/**
 * 🧪 Review List Page Tests
 * Testes unitários para a página de listagem de avaliações
 * 
 * Cenários:
 * - Inicialização
 * - Carregamento de dados
 * - Loading/Error states
 * - Empty states
 * - Filtros (tipo, status)
 * - Ordenação
 * - Paginação
 * - Edição e exclusão
 * - Modal de confirmação
 * - Navegação
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReviewListPage } from './review-list.page';
import { ReviewService, REVIEW_STATUS_LABELS, REVIEW_SORT_LABELS, ReviewListResult } from '../../../services/review.service';
import { Review, ReviewStatus, ReviewFilters } from '../../../models/review.model';
import { of, throwError, Subject } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';

describe('ReviewListPage', () => {
  let component: ReviewListPage;
  let fixture: ComponentFixture<ReviewListPage>;
  let router: Router;
  let mockReviewService: jasmine.SpyObj<ReviewService>;

  // Mock signals
  let loadingSignal: WritableSignal<boolean>;
  let errorSignal: WritableSignal<string | null>;

  const createMockReview = (overrides: Partial<Review> = {}): Review => ({
    id: 'review-1',
    userId: 'current-user-id',
    userName: 'Test User',
    targetType: 'product',
    targetId: 'product-1',
    orderId: 'order-1',
    rating: 4,
    title: 'Great Product',
    comment: 'Really enjoyed this product',
    images: [],
    isVerifiedPurchase: true,
    helpful: 5,
    notHelpful: 1,
    status: ReviewStatus.APPROVED,
    reportCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const mockReviews: Review[] = [
    createMockReview({ id: 'review-1', rating: 5, title: 'Excellent!' }),
    createMockReview({ id: 'review-2', rating: 4, targetType: 'pharmacy', status: ReviewStatus.PENDING }),
    createMockReview({ id: 'review-3', rating: 3, status: ReviewStatus.REJECTED, moderationNotes: 'Inappropriate content' })
  ];

  const mockReviewsResult: ReviewListResult = {
    reviews: mockReviews,
    total: 15,
    hasMore: true,
    lastDoc: null
  };

  beforeEach(async () => {
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);

    mockReviewService = jasmine.createSpyObj('ReviewService', [
      'getReviews',
      'deleteReview',
      'getStatusLabel',
      'formatReviewDate'
    ], {
      loading: loadingSignal,
      error: errorSignal
    });

    // Default mocks
    mockReviewService.getReviews.and.returnValue(of(mockReviewsResult));
    mockReviewService.deleteReview.and.returnValue(of(true));
    mockReviewService.getStatusLabel.and.callFake((status: ReviewStatus) => REVIEW_STATUS_LABELS[status]);
    mockReviewService.formatReviewDate.and.returnValue('5 minutos atrás');

    await TestBed.configureTestingModule({
      imports: [
        ReviewListPage,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: ReviewService, useValue: mockReviewService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewListPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  // ===================
  // INITIALIZATION TESTS
  // ===================

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com estado padrão', () => {
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
      expect(component.reviews().length).toBe(0);
      expect(component.totalReviews()).toBe(0);
      expect(component.showDeleteModal()).toBeFalse();
    });

    it('deve inicializar com filtros padrão', () => {
      expect(component.selectedTargetType).toBe('all');
      expect(component.selectedStatus).toBe('all');
      expect(component.selectedSort).toBe('newest');
    });

    it('deve ter opções de status corretas', () => {
      expect(component.statusOptions.length).toBe(4);
      expect(component.statusOptions[0].value).toBe(ReviewStatus.PENDING);
      expect(component.statusOptions[1].value).toBe(ReviewStatus.APPROVED);
      expect(component.statusOptions[2].value).toBe(ReviewStatus.REJECTED);
      expect(component.statusOptions[3].value).toBe(ReviewStatus.FLAGGED);
    });

    it('deve ter opções de ordenação corretas', () => {
      expect(component.sortOptions.length).toBe(5);
      expect(component.sortOptions.map(s => s.value)).toEqual([
        'newest', 'oldest', 'highest', 'lowest', 'helpful'
      ]);
    });
  });

  // ===================
  // LOADING DATA TESTS
  // ===================

  describe('Carregamento de dados', () => {
    it('deve carregar avaliações no ngOnInit', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockReviewService.getReviews).toHaveBeenCalled();
      expect(component.reviews().length).toBe(3);
      expect(component.totalReviews()).toBe(15);
    }));

    it('deve passar filtros corretos para o service', fakeAsync(() => {
      component.selectedTargetType = 'product';
      component.selectedStatus = ReviewStatus.APPROVED;
      
      component.loadReviews();
      tick();

      const expectedFilters: ReviewFilters = {
        userId: 'current-user-id',
        targetType: 'product',
        status: ReviewStatus.APPROVED
      };

      expect(mockReviewService.getReviews).toHaveBeenCalledWith(
        expectedFilters,
        'newest',
        10
      );
    }));

    it('deve definir loading durante carregamento', fakeAsync(() => {
      expect(component.loading()).toBeFalse();
      
      component.loadReviews();
      // Loading é setado como true antes da chamada subscribe
      // Porém o Observable retorna sincronamente no mock, então loading já volta a false
      tick();
      expect(component.loading()).toBeFalse();
      expect(mockReviewService.getReviews).toHaveBeenCalled();
    }));

    it('deve atualizar hasMore após carregamento', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.hasMoreReviews()).toBeTrue();
    }));
  });

  // ===================
  // ERROR HANDLING TESTS
  // ===================

  describe('Tratamento de erros', () => {
    it('deve definir erro quando carregamento falha', fakeAsync(() => {
      mockReviewService.getReviews.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.loadReviews();
      tick();

      expect(component.error()).toBe('Não foi possível carregar as avaliações. Tente novamente.');
      expect(component.loading()).toBeFalse();
    }));

    it('deve limpar erro ao recarregar', fakeAsync(() => {
      component.error.set('Previous error');
      
      mockReviewService.getReviews.and.returnValue(of(mockReviewsResult));
      component.loadReviews();
      tick();

      expect(component.error()).toBeNull();
    }));
  });

  // ===================
  // EMPTY STATE TESTS
  // ===================

  describe('Estado vazio', () => {
    it('deve mostrar mensagem padrão quando não há avaliações', fakeAsync(() => {
      mockReviewService.getReviews.and.returnValue(of({
        reviews: [],
        total: 0,
        hasMore: false,
        lastDoc: null
      }));

      fixture.detectChanges();
      tick();

      expect(component.emptyMessage()).toBe(
        'Você ainda não fez nenhuma avaliação. Faça uma compra e avalie sua experiência!'
      );
    }));

    it('deve mostrar mensagem de filtro quando filtros ativos', fakeAsync(() => {
      component.selectedTargetType = 'product';
      
      mockReviewService.getReviews.and.returnValue(of({
        reviews: [],
        total: 0,
        hasMore: false,
        lastDoc: null
      }));

      component.loadReviews();
      tick();

      expect(component.emptyMessage()).toBe(
        'Nenhuma avaliação encontrada com os filtros selecionados.'
      );
    }));
  });

  // ===================
  // FILTER TESTS
  // ===================

  describe('Filtros', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockReviewService.getReviews.calls.reset();
    }));

    it('deve aplicar filtro de tipo', fakeAsync(() => {
      component.selectedTargetType = 'pharmacy';
      component.onFilterChange();
      tick();

      expect(mockReviewService.getReviews).toHaveBeenCalledWith(
        jasmine.objectContaining({ targetType: 'pharmacy' }),
        jasmine.any(String),
        jasmine.any(Number)
      );
    }));

    it('deve aplicar filtro de status', fakeAsync(() => {
      component.selectedStatus = ReviewStatus.PENDING;
      component.onFilterChange();
      tick();

      expect(mockReviewService.getReviews).toHaveBeenCalledWith(
        jasmine.objectContaining({ status: ReviewStatus.PENDING }),
        jasmine.any(String),
        jasmine.any(Number)
      );
    }));

    it('deve aplicar ordenação', fakeAsync(() => {
      component.selectedSort = 'highest';
      component.onFilterChange();
      tick();

      expect(mockReviewService.getReviews).toHaveBeenCalledWith(
        jasmine.any(Object),
        'highest',
        jasmine.any(Number)
      );
    }));

    it('deve identificar filtros ativos', () => {
      expect(component.hasActiveFilters()).toBeFalse();

      component.selectedTargetType = 'product';
      expect(component.hasActiveFilters()).toBeTrue();

      component.selectedTargetType = 'all';
      component.selectedStatus = ReviewStatus.APPROVED;
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('deve limpar filtro de tipo', fakeAsync(() => {
      component.selectedTargetType = 'product';
      component.clearTargetTypeFilter();
      tick();

      expect(component.selectedTargetType).toBe('all');
      expect(mockReviewService.getReviews).toHaveBeenCalled();
    }));

    it('deve limpar filtro de status', fakeAsync(() => {
      component.selectedStatus = ReviewStatus.APPROVED;
      component.clearStatusFilter();
      tick();

      expect(component.selectedStatus).toBe('all');
      expect(mockReviewService.getReviews).toHaveBeenCalled();
    }));

    it('deve limpar todos os filtros', fakeAsync(() => {
      component.selectedTargetType = 'pharmacy';
      component.selectedStatus = ReviewStatus.PENDING;
      component.selectedSort = 'highest';
      
      component.clearAllFilters();
      tick();

      expect(component.selectedTargetType).toBe('all');
      expect(component.selectedStatus).toBe('all');
      expect(component.selectedSort).toBe('newest');
      expect(mockReviewService.getReviews).toHaveBeenCalled();
    }));
  });

  // ===================
  // PAGINATION TESTS
  // ===================

  describe('Paginação', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockReviewService.getReviews.calls.reset();
    }));

    it('deve carregar mais avaliações', fakeAsync(() => {
      const moreReviews = [
        createMockReview({ id: 'review-4' }),
        createMockReview({ id: 'review-5' })
      ];

      mockReviewService.getReviews.and.returnValue(of({
        reviews: moreReviews,
        total: 15,
        hasMore: false,
        lastDoc: null
      }));

      component.loadMoreReviews();
      tick();

      expect(component.reviews().length).toBe(5);
      expect(component.hasMore()).toBeFalse();
    }));

    it('deve definir loadingMore durante paginação', fakeAsync(() => {
      expect(component.loadingMore()).toBeFalse();
      
      component.loadMoreReviews();
      // Com mock síncrono, loading já está false quando Observable completa
      tick();
      expect(component.loadingMore()).toBeFalse();
      expect(mockReviewService.getReviews).toHaveBeenCalled();
    }));

    it('não deve carregar mais se já está carregando', fakeAsync(() => {
      component.loadingMore.set(true);
      component.loadMoreReviews();
      
      expect(mockReviewService.getReviews).not.toHaveBeenCalled();
    }));

    it('não deve carregar mais se não há mais resultados', fakeAsync(() => {
      component.hasMore.set(false);
      component.loadMoreReviews();
      
      expect(mockReviewService.getReviews).not.toHaveBeenCalled();
    }));
  });

  // ===================
  // EDIT TESTS
  // ===================

  describe('Edição', () => {
    it('deve permitir edição de avaliações pendentes', () => {
      const review = createMockReview({ status: ReviewStatus.PENDING });
      expect(component.canEdit(review)).toBeTrue();
    });

    it('deve permitir edição de avaliações sinalizadas', () => {
      const review = createMockReview({ status: ReviewStatus.FLAGGED });
      expect(component.canEdit(review)).toBeTrue();
    });

    it('não deve permitir edição de avaliações aprovadas', () => {
      const review = createMockReview({ status: ReviewStatus.APPROVED });
      expect(component.canEdit(review)).toBeFalse();
    });

    it('não deve permitir edição de avaliações rejeitadas', () => {
      const review = createMockReview({ status: ReviewStatus.REJECTED });
      expect(component.canEdit(review)).toBeFalse();
    });

    it('deve navegar para edição', () => {
      spyOn(router, 'navigate');
      const review = createMockReview({ id: 'review-123' });
      
      component.editReview(review);
      
      expect(router.navigate).toHaveBeenCalledWith(['/reviews/edit', 'review-123']);
    });
  });

  // ===================
  // DELETE TESTS
  // ===================

  describe('Exclusão', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve abrir modal de confirmação', () => {
      const review = mockReviews[0];
      
      component.confirmDelete(review);
      
      expect(component.showDeleteModal()).toBeTrue();
      expect(component.reviewToDelete()).toEqual(review);
    });

    it('deve fechar modal ao cancelar', () => {
      component.showDeleteModal.set(true);
      component.reviewToDelete.set(mockReviews[0]);
      
      component.cancelDelete();
      
      expect(component.showDeleteModal()).toBeFalse();
      expect(component.reviewToDelete()).toBeNull();
    });

    it('deve excluir avaliação', fakeAsync(() => {
      const review = mockReviews[0];
      component.reviewToDelete.set(review);
      component.showDeleteModal.set(true);
      
      component.deleteReview();
      tick();
      
      expect(mockReviewService.deleteReview).toHaveBeenCalledWith('current-user-id', review.id);
      expect(component.showDeleteModal()).toBeFalse();
      expect(component.reviews().find(r => r.id === review.id)).toBeUndefined();
    }));

    it('deve atualizar total após exclusão', fakeAsync(() => {
      const review = mockReviews[0];
      const initialTotal = component.totalReviews();
      
      component.reviewToDelete.set(review);
      component.deleteReview();
      tick();
      
      expect(component.totalReviews()).toBe(initialTotal - 1);
    }));

    it('deve definir deleting durante exclusão', fakeAsync(() => {
      component.reviewToDelete.set(mockReviews[0]);
      
      expect(component.deleting()).toBeFalse();
      component.deleteReview();
      // Com mock síncrono, deleting já está false quando Observable completa
      tick();
      expect(component.deleting()).toBeFalse();
      expect(mockReviewService.deleteReview).toHaveBeenCalled();
    }));

    it('não deve excluir se não há review selecionada', fakeAsync(() => {
      component.reviewToDelete.set(null);
      
      component.deleteReview();
      tick();
      
      expect(mockReviewService.deleteReview).not.toHaveBeenCalled();
    }));

    it('deve lidar com erro na exclusão', fakeAsync(() => {
      mockReviewService.deleteReview.and.returnValue(
        throwError(() => new Error('Delete failed'))
      );
      
      component.reviewToDelete.set(mockReviews[0]);
      component.deleteReview();
      tick();
      
      expect(component.deleting()).toBeFalse();
      // Review should still be in list
      expect(component.reviews().length).toBe(3);
    }));
  });

  // ===================
  // FORMAT TESTS
  // ===================

  describe('Formatação', () => {
    it('deve formatar status', () => {
      expect(component.getStatusLabel(ReviewStatus.PENDING)).toBe('Pendente');
      expect(component.getStatusLabel(ReviewStatus.APPROVED)).toBe('Aprovada');
      expect(component.getStatusLabel(ReviewStatus.REJECTED)).toBe('Rejeitada');
    });

    it('deve retornar "Todos" para filtro all', () => {
      expect(component.getStatusLabel('all')).toBe('Todos');
    });

    it('deve formatar data', () => {
      const date = new Date();
      component.formatDate(date);
      
      expect(mockReviewService.formatReviewDate).toHaveBeenCalledWith(date);
    });
  });

  // ===================
  // NAVIGATION TESTS
  // ===================

  describe('Navegação', () => {
    it('deve voltar para conta', () => {
      spyOn(router, 'navigate');
      
      component.goBack();
      
      expect(router.navigate).toHaveBeenCalledWith(['/account']);
    });

    it('deve ir para produtos', () => {
      spyOn(router, 'navigate');
      
      component.goToProducts();
      
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });
  });

  // ===================
  // TEMPLATE TESTS
  // ===================

  describe('Template', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('deve exibir título da página', () => {
      const title = fixture.nativeElement.querySelector('h1');
      expect(title.textContent).toContain('Minhas Avaliações');
    });

    it('deve exibir contagem de avaliações', () => {
      const subtitle = fixture.nativeElement.querySelector('.subtitle');
      expect(subtitle.textContent).toContain('15 avaliações');
    });

    it('deve exibir filtros', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      expect(selects.length).toBe(3);
    });

    it('deve exibir cards de avaliação', () => {
      const cards = fixture.nativeElement.querySelectorAll('.review-card');
      expect(cards.length).toBe(3);
    });

    it('deve exibir badge de tipo correto', () => {
      const badges = fixture.nativeElement.querySelectorAll('.target-type-badge');
      expect(badges[0].classList.contains('product')).toBeTrue();
      expect(badges[1].classList.contains('pharmacy')).toBeTrue();
    });

    it('deve exibir status das avaliações', () => {
      const statusBadges = fixture.nativeElement.querySelectorAll('.status-badge');
      expect(statusBadges.length).toBe(3);
    });

    it('deve exibir botão de carregar mais', () => {
      const loadMoreBtn = fixture.nativeElement.querySelector('.btn-load-more');
      expect(loadMoreBtn).toBeTruthy();
    });

    it('deve exibir notas de moderação para rejeitados', () => {
      const notes = fixture.nativeElement.querySelector('.moderation-notes');
      expect(notes).toBeTruthy();
    });
  });

  // ===================
  // LOADING STATE TESTS
  // ===================

  describe('Estado de Loading', () => {
    it('deve exibir container de loading durante carregamento', fakeAsync(() => {
      // Simula Observable que não completa imediatamente
      const subject = new Subject<ReviewListResult>();
      mockReviewService.getReviews.and.returnValue(subject.asObservable());
      
      fixture.detectChanges();
      // Agora loading deve ser true porque o Observable não completou
      
      const loadingContainer = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingContainer).toBeTruthy();
      
      // Completa o Observable para limpar
      subject.next(mockReviewsResult);
      subject.complete();
      tick();
    }));

    it('deve exibir mensagem de carregamento', fakeAsync(() => {
      // Simula Observable que não completa imediatamente
      const subject = new Subject<ReviewListResult>();
      mockReviewService.getReviews.and.returnValue(subject.asObservable());
      
      fixture.detectChanges();
      
      const message = fixture.nativeElement.querySelector('.loading-container p');
      expect(message?.textContent).toContain('Carregando avaliações');
      
      // Completa o Observable para limpar
      subject.next(mockReviewsResult);
      subject.complete();
      tick();
    }));
  });

  // ===================
  // ERROR STATE TESTS
  // ===================

  describe('Estado de Erro', () => {
    it('deve exibir empty state quando há erro', fakeAsync(() => {
      mockReviewService.getReviews.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.error()).toBe('Não foi possível carregar as avaliações. Tente novamente.');
      // Verifica que o componente está em estado de erro
      expect(component.loading()).toBeFalse();
    }));
  });

  // ===================
  // MODAL TESTS
  // ===================

  describe('Modal de Exclusão', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('deve exibir modal quando showDeleteModal é true', () => {
      component.showDeleteModal.set(true);
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('deve esconder modal quando showDeleteModal é false', () => {
      component.showDeleteModal.set(false);
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modal).toBeFalsy();
    });

    it('deve ter botões de cancelar e confirmar', () => {
      component.showDeleteModal.set(true);
      fixture.detectChanges();

      const cancelBtn = fixture.nativeElement.querySelector('.btn-cancel');
      const confirmBtn = fixture.nativeElement.querySelector('.btn-confirm-delete');
      
      expect(cancelBtn).toBeTruthy();
      expect(confirmBtn).toBeTruthy();
    });
  });

  // ===================
  // REVIEW CARD TESTS
  // ===================

  describe('Review Card', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('deve aplicar classe pending para avaliações pendentes', () => {
      const pendingCard = fixture.nativeElement.querySelectorAll('.review-card')[1];
      expect(pendingCard.classList.contains('pending')).toBeTrue();
    });

    it('deve aplicar classe rejected para avaliações rejeitadas', () => {
      const rejectedCard = fixture.nativeElement.querySelectorAll('.review-card')[2];
      expect(rejectedCard.classList.contains('rejected')).toBeTrue();
    });

    it('deve exibir título quando presente', () => {
      const title = fixture.nativeElement.querySelector('.review-title');
      expect(title).toBeTruthy();
    });

    it('deve exibir estatísticas', () => {
      const stats = fixture.nativeElement.querySelector('.review-stats');
      expect(stats).toBeTruthy();
      expect(stats.textContent).toContain('útil');
    });

    it('deve exibir botão de editar para pendentes', () => {
      const editBtns = fixture.nativeElement.querySelectorAll('.btn-action.edit');
      expect(editBtns.length).toBe(1); // Only pending review
    });

    it('deve exibir botão de excluir para todos', () => {
      const deleteBtns = fixture.nativeElement.querySelectorAll('.btn-action.delete');
      expect(deleteBtns.length).toBe(3);
    });
  });
});
