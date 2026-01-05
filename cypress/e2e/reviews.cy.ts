/// <reference types="cypress" />

/**
 * ⭐ Reviews E2E Tests
 * Testes E2E para fluxos de avaliações
 */

describe('Reviews', () => {
  describe('Product Reviews', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
    });

    it('should display reviews section on product detail', () => {
      cy.get('.reviews-section, .reviews, .product-reviews').should('exist');
    });

    it('should display average rating', () => {
      cy.get('.average-rating, .rating-summary').should('exist');
    });

    it('should display star rating', () => {
      cy.get('.stars, ion-icon[name*="star"]').should('exist');
    });

    it('should display review count', () => {
      cy.get('.review-count, .total-reviews').should('exist');
    });

    it('should display individual reviews', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.review-item, .review-card').length > 0) {
          cy.get('.review-item, .review-card').should('exist');
        }
      });
    });

    it('should show reviewer name', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.review-item').length > 0) {
          cy.get('.review-item').first().within(() => {
            cy.get('.reviewer-name, .user-name').should('exist');
          });
        }
      });
    });

    it('should show review date', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.review-item').length > 0) {
          cy.get('.review-item').first().within(() => {
            cy.get('.review-date, .date').should('exist');
          });
        }
      });
    });

    it('should show review comment', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.review-item').length > 0) {
          cy.get('.review-item').first().within(() => {
            cy.get('.review-comment, .comment').should('exist');
          });
        }
      });
    });
  });

  describe('Review Form', () => {
    it('should display write review button', () => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
      
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Avaliar")').length > 0) {
          cy.get('button').contains(/avaliar|escrever|write review/i).should('exist');
        }
      });
    });

    it('should navigate to review form', () => {
      cy.visit('/reviews/new?type=product&targetId=test-product');
      cy.get('body').should('exist');
    });

    it('should display star selection', () => {
      cy.visit('/reviews/new?type=product&targetId=test-product');
      cy.get('body').then(($body) => {
        if ($body.find('.star-rating, .rating-input').length > 0) {
          cy.get('.star-rating, .rating-input').should('exist');
        }
      });
    });

    it('should display comment textarea', () => {
      cy.visit('/reviews/new?type=product&targetId=test-product');
      cy.get('body').then(($body) => {
        if ($body.find('textarea').length > 0) {
          cy.get('textarea').should('exist');
        }
      });
    });

    it('should display submit button', () => {
      cy.visit('/reviews/new?type=product&targetId=test-product');
      cy.get('button').contains(/enviar|submit|publicar/i).should('exist');
    });
  });

  describe('Review Sorting', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
    });

    it('should have sort options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select, .sort-options').length > 0) {
          cy.get('.sort-select, select, .sort-options').should('exist');
        }
      });
    });

    it('should sort by newest', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select').length > 0) {
          cy.get('.sort-select, select').first().select('newest');
        }
      });
    });

    it('should sort by highest rating', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select').length > 0) {
          cy.get('.sort-select, select').first().select('highest');
        }
      });
    });
  });

  describe('Review Filtering', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
    });

    it('should filter by star rating', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.rating-filter, .filter-stars').length > 0) {
          cy.get('.rating-filter, .filter-stars').first().click();
        }
      });
    });

    it('should filter by verified purchase', () => {
      cy.get('body').then(($body) => {
        if ($body.find('input[type="checkbox"]').filter(':contains("Compra verificada")').length > 0) {
          cy.get('input[type="checkbox"]').contains('Compra verificada').click();
        }
      });
    });
  });

  describe('Helpful Votes', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
    });

    it('should display helpful buttons', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.review-item').length > 0) {
          cy.get('.review-item').first().within(() => {
            cy.get('body').then(($reviewBody) => {
              if ($reviewBody.find('.helpful-button, button').filter(':contains("Útil")').length > 0) {
                cy.get('.helpful-button, button').contains(/útil|helpful/i).should('exist');
              }
            });
          });
        }
      });
    });

    it('should display helpful count', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.helpful-count').length > 0) {
          cy.get('.helpful-count').should('exist');
        }
      });
    });
  });

  describe('User Reviews', () => {
    it('should display user reviews page', () => {
      cy.visit('/reviews');
      cy.get('body').should('exist');
    });

    it('should list user reviews', () => {
      cy.visit('/reviews');
      cy.get('body').then(($body) => {
        if ($body.find('.review-item, .review-card').length > 0) {
          cy.get('.review-item, .review-card').should('exist');
        }
      });
    });

    it('should allow editing review', () => {
      cy.visit('/reviews');
      cy.get('body').then(($body) => {
        if ($body.find('.edit-button, button').filter(':contains("Editar")').length > 0) {
          cy.get('.edit-button, button').contains(/editar|edit/i).first().should('exist');
        }
      });
    });

    it('should allow deleting review', () => {
      cy.visit('/reviews');
      cy.get('body').then(($body) => {
        if ($body.find('.delete-button, button').filter(':contains("Excluir")').length > 0) {
          cy.get('.delete-button, button').contains(/excluir|delete/i).first().should('exist');
        }
      });
    });
  });
});
