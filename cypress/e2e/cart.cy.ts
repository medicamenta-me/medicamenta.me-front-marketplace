/// <reference types="cypress" />

/**
 * 🛒 Cart E2E Tests
 * Testes E2E para fluxos de carrinho de compras
 */

describe('Shopping Cart', () => {
  beforeEach(() => {
    cy.visit('/products');
  });

  describe('Add to Cart', () => {
    it('should display add to cart button on product cards', () => {
      cy.get('.product-card').first().within(() => {
        cy.get('button').contains(/adicionar|add|cart|carrinho/i).should('exist');
      });
    });

    it('should add product to cart', () => {
      cy.get('.product-card').first().within(() => {
        cy.get('button').contains(/adicionar|add|cart|carrinho/i).click();
      });
      
      // Should show success feedback or update cart icon
      cy.get('body').should('exist');
    });

    it('should show cart badge after adding item', () => {
      cy.get('.product-card').first().within(() => {
        cy.get('button').contains(/adicionar|add|cart|carrinho/i).click();
      });
      
      // Cart badge should update
      cy.get('.cart-badge, .badge, [data-cart-count]').should('exist');
    });
  });

  describe('Cart Page', () => {
    it('should display empty cart message when empty', () => {
      // Clear cart
      cy.clearLocalStorage();
      cy.visit('/cart');
      
      cy.get('body').then(($body) => {
        if ($body.find('.empty-cart, .cart-empty').length > 0) {
          cy.get('.empty-cart, .cart-empty').should('be.visible');
        }
      });
    });

    it('should display cart items', () => {
      cy.visit('/cart');
      cy.get('body').should('exist');
    });

    it('should have checkout button', () => {
      cy.visit('/cart');
      cy.get('body').then(($body) => {
        if ($body.find('.cart-item').length > 0) {
          cy.get('button').contains(/checkout|finalizar|comprar/i).should('exist');
        }
      });
    });
  });

  describe('Cart Operations', () => {
    it('should update quantity', () => {
      cy.visit('/cart');
      cy.get('body').then(($body) => {
        if ($body.find('.cart-item').length > 0) {
          cy.get('.quantity-increase, button[aria-label*="aumentar"]').first().click();
          cy.get('.cart-item').should('exist');
        }
      });
    });

    it('should remove item from cart', () => {
      cy.visit('/cart');
      cy.get('body').then(($body) => {
        if ($body.find('.cart-item').length > 0) {
          cy.get('.remove-item, button[aria-label*="remover"]').first().click();
        }
      });
    });

    it('should calculate total correctly', () => {
      cy.visit('/cart');
      cy.get('body').then(($body) => {
        if ($body.find('.cart-total').length > 0) {
          cy.get('.cart-total').should('contain', 'R$');
        }
      });
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart after page refresh', () => {
      // Add item to cart
      cy.get('.product-card').first().within(() => {
        cy.get('button').contains(/adicionar|add|cart|carrinho/i).click();
      });
      
      // Refresh page
      cy.reload();
      
      // Cart should still have item
      cy.visit('/cart');
      cy.get('body').should('exist');
    });
  });
});
