/// <reference types="cypress" />

// ***********************************************
// This file contains custom Cypress commands
// and overloads of existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to navigate using Tab key
 */
Cypress.Commands.add('tab', () => {
  cy.focused().trigger('keydown', { keyCode: 9, which: 9, key: 'Tab' });
});

/**
 * Custom command to navigate to a product detail page
 * @param index - Index of the product card to click (default: 0)
 */
Cypress.Commands.add('goToProductDetail', (index: number = 0) => {
  cy.visit('/products');
  cy.get('.product-card').eq(index).click();
  cy.url().should('include', '/products/');
});

/**
 * Custom command to wait for Angular to be stable
 */
Cypress.Commands.add('waitForAngular', () => {
  cy.window().then((win: any) => {
    return new Cypress.Promise((resolve) => {
      if (win.getAllAngularTestabilities) {
        win.getAllAngularTestabilities().forEach((testability: any) => {
          testability.whenStable(resolve);
        });
      } else {
        resolve();
      }
    });
  });
});

/**
 * Custom command to apply product filters
 * @param filters - Object with filter options
 */
Cypress.Commands.add('applyFilters', (filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  requiresPrescription?: boolean;
}) => {
  cy.get('.product-filters').within(() => {
    if (filters.category) {
      cy.contains(filters.category).click();
    }
    
    if (filters.minPrice !== undefined) {
      cy.get('input[name="minPrice"]').clear().type(filters.minPrice.toString());
    }
    
    if (filters.maxPrice !== undefined) {
      cy.get('input[name="maxPrice"]').clear().type(filters.maxPrice.toString());
    }
    
    if (filters.inStock !== undefined) {
      cy.contains('Em estoque').click();
    }
    
    if (filters.requiresPrescription !== undefined) {
      cy.contains('Requer receita').click();
    }
  });
  
  cy.wait(500); // Wait for debounce
});

/**
 * Custom command to search for products
 * @param query - Search query string
 */
Cypress.Commands.add('searchProducts', (query: string) => {
  cy.get('mat-form-field.search-field input').clear().type(query);
  cy.wait(500); // Wait for debounce
});

/**
 * Custom command to check if product price is in range
 * @param min - Minimum price
 * @param max - Maximum price
 */
Cypress.Commands.add('checkPriceInRange', (min: number, max: number) => {
  cy.get('.product-card').each(($card) => {
    cy.wrap($card).find('.price').invoke('text').then((priceText) => {
      const price = parseFloat(priceText.replace('R$', '').replace(',', '.').trim());
      expect(price).to.be.at.least(min);
      expect(price).to.be.at.most(max);
    });
  });
});

// TypeScript declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to navigate using Tab key
       * @example cy.tab()
       */
      tab(): Chainable<void>;
      
      /**
       * Custom command to navigate to a product detail page
       * @param index - Index of the product card to click (default: 0)
       * @example cy.goToProductDetail(1)
       */
      goToProductDetail(index?: number): Chainable<void>;
      
      /**
       * Custom command to wait for Angular to be stable
       * @example cy.waitForAngular()
       */
      waitForAngular(): Chainable<void>;
      
      /**
       * Custom command to apply product filters
       * @param filters - Object with filter options
       * @example cy.applyFilters({ category: 'Analgésicos', minPrice: 10, maxPrice: 50 })
       */
      applyFilters(filters: {
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        requiresPrescription?: boolean;
      }): Chainable<void>;
      
      /**
       * Custom command to search for products
       * @param query - Search query string
       * @example cy.searchProducts('dipirona')
       */
      searchProducts(query: string): Chainable<void>;
      
      /**
       * Custom command to check if product price is in range
       * @param min - Minimum price
       * @param max - Maximum price
       * @example cy.checkPriceInRange(10, 50)
       */
      checkPriceInRange(min: number, max: number): Chainable<void>;
    }
  }
}

export {};
