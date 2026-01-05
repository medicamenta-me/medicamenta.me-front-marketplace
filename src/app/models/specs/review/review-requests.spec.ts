/**
 * @file review-requests.spec.ts
 * @description Testes unitários para as interfaces de requisição de Review
 */

import { CreateReviewRequest, UpdateReviewRequest } from '../../review.model';

describe('CreateReviewRequest Interface', () => {
  it('should create minimal review request', () => {
    const request: CreateReviewRequest = {
      targetType: 'product',
      targetId: 'prod-123',
      orderId: 'order-123',
      rating: 5
    };

    expect(request.targetType).toBe('product');
    expect(request.targetId).toBe('prod-123');
    expect(request.rating).toBe(5);
  });

  it('should create review request with title', () => {
    const request: CreateReviewRequest = {
      targetType: 'product',
      targetId: 'prod-456',
      orderId: 'order-456',
      rating: 4,
      title: 'Bom produto!'
    };

    expect(request.title).toBe('Bom produto!');
  });

  it('should create review request with comment', () => {
    const request: CreateReviewRequest = {
      targetType: 'pharmacy',
      targetId: 'pharma-789',
      orderId: 'order-789',
      rating: 5,
      comment: 'Atendimento excelente, entrega rápida!'
    };

    expect(request.comment).toContain('Atendimento');
  });

  it('should create review request with images', () => {
    const request: CreateReviewRequest = {
      targetType: 'product',
      targetId: 'prod-img',
      orderId: 'order-img',
      rating: 5,
      images: ['foto1.jpg', 'foto2.jpg', 'foto3.jpg']
    };

    expect(request.images).toBeDefined();
    expect(request.images!.length).toBe(3);
  });

  it('should create complete review request', () => {
    const request: CreateReviewRequest = {
      targetType: 'product',
      targetId: 'prod-complete',
      orderId: 'order-complete',
      rating: 5,
      title: 'Perfeito!',
      comment: 'Melhor produto que já comprei. Super recomendo!',
      images: ['produto.jpg']
    };

    expect(request.title).toBe('Perfeito!');
    expect(request.comment).toContain('Melhor');
    expect(request.images!.length).toBe(1);
  });
});

describe('UpdateReviewRequest Interface', () => {
  it('should create update with new rating', () => {
    const request: UpdateReviewRequest = {
      rating: 4
    };

    expect(request.rating).toBe(4);
  });

  it('should create update with new title', () => {
    const request: UpdateReviewRequest = {
      title: 'Título atualizado'
    };

    expect(request.title).toBe('Título atualizado');
  });

  it('should create update with new comment', () => {
    const request: UpdateReviewRequest = {
      comment: 'Comentário atualizado após uso prolongado'
    };

    expect(request.comment).toContain('atualizado');
  });

  it('should create update with new images', () => {
    const request: UpdateReviewRequest = {
      images: ['nova_foto.jpg']
    };

    expect(request.images!.length).toBe(1);
  });

  it('should create complete update request', () => {
    const request: UpdateReviewRequest = {
      rating: 5,
      title: 'Título revisado',
      comment: 'Comentário revisado',
      images: ['img1.jpg', 'img2.jpg']
    };

    expect(request.rating).toBe(5);
    expect(request.title).toBe('Título revisado');
    expect(request.comment).toBe('Comentário revisado');
    expect(request.images!.length).toBe(2);
  });
});
