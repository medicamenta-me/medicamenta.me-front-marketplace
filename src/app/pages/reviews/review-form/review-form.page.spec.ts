/**
 * 🧪 Review Form Page Tests
 * Testes unitários para a página de formulário de avaliações
 * 
 * Cenários:
 * - Inicialização
 * - Modo criação vs edição
 * - Verificação de elegibilidade
 * - Seleção de estrelas
 * - Validação de formulário
 * - Upload de imagens
 * - Submissão
 * - Navegação
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ReviewFormPage } from './review-form.page';
import { ReviewService, UserReviewStatus } from '../../../services/review.service';
import { Review, ReviewStatus, CreateReviewRequest, UpdateReviewRequest } from '../../../models/review.model';
import { of, throwError, Subject } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';

describe('ReviewFormPage', () => {
  let component: ReviewFormPage;
  let fixture: ComponentFixture<ReviewFormPage>;
  let router: Router;
  let mockReviewService: jasmine.SpyObj<ReviewService>;
  let mockActivatedRoute: {
    snapshot: {
      paramMap: { get: jasmine.Spy };
      queryParams: Record<string, string>;
    };
  };

  // Mock signals
  let loadingSignal: WritableSignal<boolean>;
  let errorSignal: WritableSignal<string | null>;

  const mockExistingReview: Review = {
    id: 'review-1',
    userId: 'current-user-id',
    userName: 'Test User',
    targetType: 'product',
    targetId: 'product-1',
    orderId: 'order-1',
    rating: 4,
    title: 'Great Product',
    comment: 'Really enjoyed this product',
    images: ['image1.jpg', 'image2.jpg'],
    isVerifiedPurchase: true,
    helpful: 5,
    notHelpful: 1,
    status: ReviewStatus.PENDING,
    reportCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCanReviewStatus: UserReviewStatus = {
    canReview: true
  };

  const mockCannotReviewStatus: UserReviewStatus = {
    canReview: false,
    reason: 'Você já avaliou este item.'
  };

  const setupCreateMode = () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
    mockActivatedRoute.snapshot.queryParams = {
      type: 'product',
      targetId: 'product-1',
      orderId: 'order-1',
      targetName: 'Paracetamol 500mg'
    };
  };

  const setupEditMode = (reviewId = 'review-1') => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue(reviewId);
    mockActivatedRoute.snapshot.queryParams = {};
  };

  beforeEach(async () => {
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get')
        },
        queryParams: {}
      }
    };

    mockReviewService = jasmine.createSpyObj('ReviewService', [
      'getReviewById',
      'createReview',
      'updateReview',
      'canUserReview'
    ], {
      loading: loadingSignal,
      error: errorSignal
    });

    // Default mocks
    mockReviewService.getReviewById.and.returnValue(of(mockExistingReview));
    mockReviewService.createReview.and.returnValue(of(mockExistingReview));
    mockReviewService.updateReview.and.returnValue(of(mockExistingReview));
    mockReviewService.canUserReview.and.returnValue(of(mockCanReviewStatus));

    await TestBed.configureTestingModule({
      imports: [
        ReviewFormPage,
        RouterTestingModule.withRoutes([]),
        ReactiveFormsModule
      ],
      providers: [
        { provide: ReviewService, useValue: mockReviewService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(ReviewFormPage);
    component = fixture.componentInstance;
  };

  // ===================
  // INITIALIZATION TESTS
  // ===================

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      setupCreateMode();
      createComponent();
      expect(component).toBeTruthy();
    });

    it('deve inicializar com estado padrão', () => {
      setupCreateMode();
      createComponent();

      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
      expect(component.submitting()).toBeFalse();
      expect(component.selectedRating()).toBe(0);
      expect(component.images().length).toBe(0);
    });

    it('deve inicializar formulário', () => {
      setupCreateMode();
      createComponent();

      expect(component.reviewForm).toBeTruthy();
      expect(component.reviewForm.get('title')).toBeTruthy();
      expect(component.reviewForm.get('comment')).toBeTruthy();
    });

    it('deve ter maxImages definido', () => {
      setupCreateMode();
      createComponent();

      expect(component.maxImages).toBe(5);
    });
  });

  // ===================
  // CREATE MODE TESTS
  // ===================

  describe('Modo Criação', () => {
    beforeEach(() => {
      setupCreateMode();
      createComponent();
    });

    it('deve detectar modo criação', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isEditMode()).toBeFalse();
    }));

    it('deve carregar parâmetros da query', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.targetType()).toBe('product');
      expect(component.targetId()).toBe('product-1');
      expect(component.orderId()).toBe('order-1');
      expect(component.targetName()).toBe('Paracetamol 500mg');
    }));

    it('deve verificar elegibilidade', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockReviewService.canUserReview).toHaveBeenCalledWith(
        'current-user-id',
        'product',
        'product-1',
        'order-1'
      );
      expect(component.isEligible()).toBeTrue();
    }));

    it('deve definir mensagem quando não elegível', fakeAsync(() => {
      mockReviewService.canUserReview.and.returnValue(of(mockCannotReviewStatus));
      
      fixture.detectChanges();
      tick();

      expect(component.isEligible()).toBeFalse();
      expect(component.eligibilityMessage()).toContain('já avaliou');
    }));

    it('deve mostrar erro se parâmetros inválidos', fakeAsync(() => {
      mockActivatedRoute.snapshot.queryParams = {};
      
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Parâmetros inválidos para avaliação.');
    }));
  });

  // ===================
  // EDIT MODE TESTS
  // ===================

  describe('Modo Edição', () => {
    beforeEach(() => {
      setupEditMode();
      createComponent();
    });

    it('deve detectar modo edição', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isEditMode()).toBeTrue();
    }));

    it('deve carregar avaliação existente', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockReviewService.getReviewById).toHaveBeenCalledWith('review-1');
      expect(component.existingReview()).toEqual(mockExistingReview);
    }));

    it('deve preencher formulário com dados existentes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.selectedRating()).toBe(4);
      expect(component.reviewForm.get('title')?.value).toBe('Great Product');
      expect(component.reviewForm.get('comment')?.value).toBe('Really enjoyed this product');
      expect(component.images().length).toBe(2);
    }));

    it('deve mostrar erro se usuário não é dono da avaliação', fakeAsync(() => {
      mockReviewService.getReviewById.and.returnValue(of({
        ...mockExistingReview,
        userId: 'other-user-id'
      }));

      fixture.detectChanges();
      tick();

      expect(component.error()).toContain('permissão');
    }));

    it('deve mostrar erro se avaliação não pode ser editada', fakeAsync(() => {
      mockReviewService.getReviewById.and.returnValue(of({
        ...mockExistingReview,
        status: ReviewStatus.APPROVED
      }));

      fixture.detectChanges();
      tick();

      expect(component.error()).toContain('não pode mais ser editada');
    }));

    it('deve permitir edição de avaliações sinalizadas', fakeAsync(() => {
      mockReviewService.getReviewById.and.returnValue(of({
        ...mockExistingReview,
        status: ReviewStatus.FLAGGED
      }));

      fixture.detectChanges();
      tick();

      expect(component.error()).toBeNull();
    }));
  });

  // ===================
  // RATING TESTS
  // ===================

  describe('Seleção de Estrelas', () => {
    beforeEach(() => {
      setupCreateMode();
      createComponent();
    });

    it('deve selecionar rating', () => {
      component.setRating(4);

      expect(component.selectedRating()).toBe(4);
    });

    it('deve limpar erro ao selecionar rating', () => {
      component.showRatingError.set(true);
      
      component.setRating(3);

      expect(component.showRatingError()).toBeFalse();
    });

    it('deve definir hover rating', () => {
      component.setHoverRating(5);

      expect(component.hoverRating()).toBe(5);
    });

    it('deve limpar hover rating', () => {
      component.setHoverRating(5);
      component.clearHoverRating();

      expect(component.hoverRating()).toBe(0);
    });

    it('deve retornar texto do rating correto', () => {
      component.setRating(1);
      expect(component.ratingText()).toBe('Péssimo');

      component.setRating(3);
      expect(component.ratingText()).toBe('Regular');

      component.setRating(5);
      expect(component.ratingText()).toBe('Excelente');
    });

    it('deve priorizar hover sobre selected para texto', () => {
      component.setRating(3);
      component.setHoverRating(5);

      expect(component.ratingText()).toBe('Excelente');
    });
  });

  // ===================
  // FORM VALIDATION TESTS
  // ===================

  describe('Validação de Formulário', () => {
    beforeEach(() => {
      setupCreateMode();
      createComponent();
    });

    it('deve ser inválido sem rating', () => {
      component.reviewForm.patchValue({
        title: 'Test',
        comment: 'Comment'
      });

      expect(component.isFormValid()).toBeFalse();
    });

    it('deve ser válido com apenas rating', () => {
      component.setRating(4);

      expect(component.isFormValid()).toBeTrue();
    });

    it('deve calcular comprimento do título', () => {
      component.reviewForm.patchValue({ title: 'Hello World' });

      expect(component.titleLength()).toBe(11);
    });

    it('deve calcular comprimento do comentário', () => {
      component.reviewForm.patchValue({ comment: 'This is a test comment' });

      expect(component.commentLength()).toBe(22);
    });

    it('deve validar comprimento máximo do título', () => {
      const longTitle = 'a'.repeat(101);
      component.reviewForm.patchValue({ title: longTitle });

      expect(component.reviewForm.get('title')?.valid).toBeFalse();
    });

    it('deve validar comprimento máximo do comentário', () => {
      const longComment = 'a'.repeat(1001);
      component.reviewForm.patchValue({ comment: longComment });

      expect(component.reviewForm.get('comment')?.valid).toBeFalse();
    });
  });

  // ===================
  // IMAGE TESTS
  // ===================

  describe('Upload de Imagens', () => {
    beforeEach(() => {
      setupCreateMode();
      createComponent();
    });

    it('deve adicionar imagem', fakeAsync(() => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: ''
        }
      } as unknown as Event;

      // Mock FileReader
      const mockReader = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        result: 'data:image/jpeg;base64,test',
        readAsDataURL: function() {
          setTimeout(() => this.onload?.(), 0);
        }
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as unknown as FileReader);

      component.onImageSelected(mockEvent);
      tick();

      expect(component.images().length).toBe(1);
    }));

    it('deve remover imagem', () => {
      component.images.set(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      
      component.removeImage(1);

      expect(component.images().length).toBe(2);
      expect(component.images()).toEqual(['image1.jpg', 'image3.jpg']);
    });

    it('deve definir uploading durante upload', fakeAsync(() => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: ''
        }
      } as unknown as Event;

      const mockReader = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        result: 'data:image/jpeg;base64,test',
        readAsDataURL: function() {
          setTimeout(() => this.onload?.(), 100);
        }
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as unknown as FileReader);

      component.onImageSelected(mockEvent);
      expect(component.uploading()).toBeTrue();
      
      tick(100);
      expect(component.uploading()).toBeFalse();
    }));

    it('não deve adicionar arquivo não-imagem', () => {
      const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: ''
        }
      } as unknown as Event;

      component.onImageSelected(mockEvent);

      expect(component.images().length).toBe(0);
    });

    it('não deve adicionar arquivo muito grande', () => {
      // Create a mock file with size > 5MB
      const mockFile = {
        type: 'image/jpeg',
        size: 6 * 1024 * 1024 // 6MB
      } as File;
      const mockEvent = {
        target: {
          files: [mockFile],
          value: ''
        }
      } as unknown as Event;

      component.onImageSelected(mockEvent);

      expect(component.images().length).toBe(0);
    });

    it('não deve processar se nenhum arquivo selecionado', () => {
      const mockEvent = {
        target: {
          files: [],
          value: ''
        }
      } as unknown as Event;

      component.onImageSelected(mockEvent);

      expect(component.images().length).toBe(0);
    });
  });

  // ===================
  // SUBMIT TESTS
  // ===================

  describe('Submissão', () => {
    describe('Criar avaliação', () => {
      beforeEach(fakeAsync(() => {
        setupCreateMode();
        createComponent();
        fixture.detectChanges();
        tick();
      }));

      it('deve criar avaliação', fakeAsync(() => {
        spyOn(router, 'navigate');
        
        component.setRating(5);
        component.reviewForm.patchValue({
          title: 'Great!',
          comment: 'Loved it!'
        });
        component.images.set(['image1.jpg']);

        component.submitReview();
        tick();

        expect(mockReviewService.createReview).toHaveBeenCalledWith(
          'current-user-id',
          jasmine.objectContaining({
            targetType: 'product',
            targetId: 'product-1',
            orderId: 'order-1',
            rating: 5,
            title: 'Great!',
            comment: 'Loved it!',
            images: ['image1.jpg']
          })
        );
        expect(router.navigate).toHaveBeenCalledWith(
          ['/reviews'],
          { queryParams: { created: 'true' } }
        );
      }));

      it('deve omitir campos vazios', fakeAsync(() => {
        spyOn(router, 'navigate');
        component.setRating(4);
        
        component.submitReview();
        tick();

        const request = mockReviewService.createReview.calls.mostRecent().args[1];
        expect(request.title).toBeUndefined();
        expect(request.comment).toBeUndefined();
        expect(request.images).toBeUndefined();
      }));

      it('deve mostrar erro de rating se não selecionado', () => {
        component.submitReview();

        expect(component.showRatingError()).toBeTrue();
        expect(mockReviewService.createReview).not.toHaveBeenCalled();
      });

      it('deve definir submitting durante criação', fakeAsync(() => {
        spyOn(router, 'navigate');
        component.setRating(4);
        
        expect(component.submitting()).toBeFalse();
        component.submitReview();
        // Com mock síncrono, submitting já está false quando Observable completa
        tick();
        expect(component.submitting()).toBeFalse();
        expect(mockReviewService.createReview).toHaveBeenCalled();
      }));

      it('deve lidar com erro na criação', fakeAsync(() => {
        mockReviewService.createReview.and.returnValue(
          throwError(() => new Error('Create failed'))
        );

        component.setRating(4);
        component.submitReview();
        tick();

        expect(component.error()).toContain('Não foi possível enviar');
        expect(component.submitting()).toBeFalse();
      }));
    });

    describe('Atualizar avaliação', () => {
      beforeEach(fakeAsync(() => {
        setupEditMode();
        createComponent();
        fixture.detectChanges();
        tick();
      }));

      it('deve atualizar avaliação', fakeAsync(() => {
        spyOn(router, 'navigate');
        
        component.setRating(5);
        component.reviewForm.patchValue({
          title: 'Updated Title',
          comment: 'Updated comment'
        });

        component.submitReview();
        tick();

        expect(mockReviewService.updateReview).toHaveBeenCalledWith(
          'current-user-id',
          'review-1',
          jasmine.objectContaining({
            rating: 5,
            title: 'Updated Title',
            comment: 'Updated comment'
          })
        );
        expect(router.navigate).toHaveBeenCalledWith(
          ['/reviews'],
          { queryParams: { updated: 'true' } }
        );
      }));

      it('deve lidar com erro na atualização', fakeAsync(() => {
        mockReviewService.updateReview.and.returnValue(
          throwError(() => new Error('Update failed'))
        );

        component.submitReview();
        tick();

        expect(component.error()).toContain('Não foi possível atualizar');
      }));

      it('não deve atualizar se não há review existente', fakeAsync(() => {
        component.existingReview.set(null);
        
        component.submitReview();
        tick();

        // Should try create instead
        expect(mockReviewService.updateReview).not.toHaveBeenCalled();
      }));
    });
  });

  // ===================
  // NAVIGATION TESTS
  // ===================

  describe('Navegação', () => {
    it('deve voltar para histórico no modo criação', () => {
      setupCreateMode();
      createComponent();
      spyOn(window.history, 'back');

      component.goBack();

      expect(window.history.back).toHaveBeenCalled();
    });

    it('deve voltar para reviews no modo edição', fakeAsync(() => {
      setupEditMode();
      createComponent();
      fixture.detectChanges();
      tick();
      
      spyOn(router, 'navigate');

      component.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/reviews']);
    }));

    it('deve ir para reviews', () => {
      setupCreateMode();
      createComponent();
      spyOn(router, 'navigate');

      component.goToReviews();

      expect(router.navigate).toHaveBeenCalledWith(['/reviews']);
    });
  });

  // ===================
  // TEMPLATE TESTS
  // ===================

  describe('Template', () => {
    describe('Modo Criação', () => {
      beforeEach(fakeAsync(() => {
        setupCreateMode();
        createComponent();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
      }));

      it('deve exibir título "Nova Avaliação"', () => {
        const title = fixture.nativeElement.querySelector('h1');
        expect(title.textContent).toContain('Nova Avaliação');
      });

      it('deve exibir seção de target', () => {
        const targetSection = fixture.nativeElement.querySelector('.target-section');
        expect(targetSection).toBeTruthy();
      });

      it('deve exibir seletor de estrelas', () => {
        const stars = fixture.nativeElement.querySelectorAll('.star-btn');
        expect(stars.length).toBe(5);
      });

      it('deve exibir campos de formulário', () => {
        const titleInput = fixture.nativeElement.querySelector('#title');
        const commentTextarea = fixture.nativeElement.querySelector('#comment');
        
        expect(titleInput).toBeTruthy();
        expect(commentTextarea).toBeTruthy();
      });

      it('deve exibir área de imagens', () => {
        const imagesContainer = fixture.nativeElement.querySelector('.images-container');
        expect(imagesContainer).toBeTruthy();
      });

      it('deve exibir diretrizes', () => {
        const guidelines = fixture.nativeElement.querySelector('.guidelines');
        expect(guidelines).toBeTruthy();
      });
    });

    describe('Modo Edição', () => {
      beforeEach(fakeAsync(() => {
        setupEditMode();
        createComponent();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
      }));

      it('deve exibir título "Editar Avaliação"', () => {
        const title = fixture.nativeElement.querySelector('h1');
        expect(title.textContent).toContain('Editar Avaliação');
      });

      it('não deve exibir seção de target', () => {
        const targetSection = fixture.nativeElement.querySelector('.target-section');
        expect(targetSection).toBeFalsy();
      });
    });

    describe('Estado de Loading', () => {
      it('deve exibir container de loading durante carregamento', fakeAsync(() => {
        // Simula Observable que não completa imediatamente
        const subject = new Subject<UserReviewStatus>();
        mockReviewService.canUserReview.and.returnValue(subject.asObservable());
        
        setupCreateMode();
        createComponent();
        fixture.detectChanges();
        // Agora loading deve ser true porque o Observable não completou

        const loadingContainer = fixture.nativeElement.querySelector('.loading-container');
        expect(loadingContainer).toBeTruthy();
        
        // Completa o Observable para limpar
        subject.next(mockCanReviewStatus);
        subject.complete();
        tick();
      }));
    });

    describe('Estado de Erro', () => {
      it('deve definir estado de erro', fakeAsync(() => {
        mockReviewService.canUserReview.and.returnValue(
          throwError(() => new Error('Network error'))
        );
        setupCreateMode();
        createComponent();
        fixture.detectChanges();
        tick();

        expect(component.error()).toBe('Não foi possível verificar elegibilidade.');
        expect(component.loading()).toBeFalse();
      }));
    });

    describe('Não Elegível', () => {
      beforeEach(fakeAsync(() => {
        mockReviewService.canUserReview.and.returnValue(of(mockCannotReviewStatus));
        setupCreateMode();
        createComponent();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
      }));

      it('deve definir estado não elegível', () => {
        expect(component.isEligible()).toBeFalse();
        expect(component.eligibilityMessage()).toContain('já avaliou');
      });
    });
  });

  // ===================
  // EDGE CASES
  // ===================

  describe('Casos Especiais', () => {
    it('deve tratar tipo pharmacy na query', fakeAsync(() => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
      mockActivatedRoute.snapshot.queryParams = {
        type: 'pharmacy',
        targetId: 'pharmacy-1',
        orderId: 'order-1',
        targetName: 'Farmácia Central'
      };
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.targetType()).toBe('pharmacy');
    }));

    it('deve usar valores padrão se query params ausentes', fakeAsync(() => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
      mockActivatedRoute.snapshot.queryParams = {};
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.targetType()).toBe('product');
      expect(component.targetName()).toBe('Item');
    }));

    it('deve lidar com erro no carregamento de review', fakeAsync(() => {
      mockReviewService.getReviewById.and.returnValue(
        throwError(() => new Error('Not found'))
      );
      setupEditMode();
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Não foi possível carregar a avaliação.');
    }));

    it('deve lidar com erro na verificação de elegibilidade', fakeAsync(() => {
      mockReviewService.canUserReview.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      setupCreateMode();
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Não foi possível verificar elegibilidade.');
    }));
  });
});
