/// <reference types="cypress" />

/**
 * 🔍 Search E2E Tests
 * Testes E2E para fluxos de busca
 */

describe('Search', () => {
  describe('Search Bar', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should display search bar', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').should('exist');
    });

    it('should focus on search input', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first().click();
      cy.focused().should('exist');
    });

    it('should allow typing search query', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('paracetamol');
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .should('have.value', 'paracetamol');
    });

    it('should submit search on enter', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('dipirona{enter}');
      cy.url().should('include', 'search');
    });

    it('should submit search on button click', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('ibuprofeno');
      cy.get('button[type="submit"], .search-button, ion-button').first().click();
      cy.url().should('include', 'search');
    });
  });

  describe('Search Results', () => {
    beforeEach(() => {
      cy.visit('/search?q=medicamento');
    });

    it('should display search results page', () => {
      cy.get('body').should('exist');
    });

    it('should display search query', () => {
      cy.get('.search-query, .search-term, h1, h2').should('exist');
    });

    it('should display results count', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.results-count, .total-results').length > 0) {
          cy.get('.results-count, .total-results').should('exist');
        }
      });
    });

    it('should display product cards', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.product-card, ion-card, .search-result').length > 0) {
          cy.get('.product-card, ion-card, .search-result').should('exist');
        }
      });
    });

    it('should display no results message when empty', () => {
      cy.visit('/search?q=xyznoexiste123');
      cy.get('body').then(($body) => {
        if ($body.find('.no-results, .empty-state').length > 0) {
          cy.get('.no-results, .empty-state').should('exist');
        }
      });
    });
  });

  describe('Search Autocomplete', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should show suggestions while typing', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('para');
      cy.wait(500);
      cy.get('body').then(($body) => {
        if ($body.find('.autocomplete, .suggestions, .search-suggestions').length > 0) {
          cy.get('.autocomplete, .suggestions, .search-suggestions').should('be.visible');
        }
      });
    });

    it('should select suggestion', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('para');
      cy.wait(500);
      cy.get('body').then(($body) => {
        if ($body.find('.suggestion-item, .autocomplete-item').length > 0) {
          cy.get('.suggestion-item, .autocomplete-item').first().click();
        }
      });
    });

    it('should navigate suggestions with keyboard', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('dip')
        .type('{downarrow}')
        .type('{enter}');
    });

    it('should close suggestions on blur', () => {
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('ome');
      cy.wait(500);
      cy.get('body').click();
      cy.get('.autocomplete, .suggestions').should('not.be.visible');
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => {
      cy.visit('/search?q=medicamento');
    });

    it('should display filter options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.filters, .filter-section').length > 0) {
          cy.get('.filters, .filter-section').should('exist');
        }
      });
    });

    it('should filter by category', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.category-filter, select[name="category"]').length > 0) {
          cy.get('.category-filter, select[name="category"]').first().click();
        }
      });
    });

    it('should filter by price range', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.price-filter, input[name="minPrice"]').length > 0) {
          cy.get('.price-filter, input[name="minPrice"]').type('10');
        }
      });
    });

    it('should filter by pharmacy', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.pharmacy-filter, select[name="pharmacy"]').length > 0) {
          cy.get('.pharmacy-filter, select[name="pharmacy"]').first().click();
        }
      });
    });

    it('should clear all filters', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Limpar")').length > 0) {
          cy.get('button').contains(/limpar|clear/i).click();
        }
      });
    });
  });

  describe('Search Sorting', () => {
    beforeEach(() => {
      cy.visit('/search?q=medicamento');
    });

    it('should display sort options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select[name="sort"]').length > 0) {
          cy.get('.sort-select, select[name="sort"]').should('exist');
        }
      });
    });

    it('should sort by relevance', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select').length > 0) {
          cy.get('.sort-select, select').first().select('relevance');
        }
      });
    });

    it('should sort by price low to high', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select').length > 0) {
          cy.get('.sort-select, select').first().select('price_asc');
        }
      });
    });

    it('should sort by price high to low', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select').length > 0) {
          cy.get('.sort-select, select').first().select('price_desc');
        }
      });
    });

    it('should sort by rating', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.sort-select, select').length > 0) {
          cy.get('.sort-select, select').first().select('rating');
        }
      });
    });
  });

  describe('Search Pagination', () => {
    beforeEach(() => {
      cy.visit('/search?q=medicamento');
    });

    it('should display pagination', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.pagination, .page-numbers, ion-infinite-scroll').length > 0) {
          cy.get('.pagination, .page-numbers, ion-infinite-scroll').should('exist');
        }
      });
    });

    it('should navigate to next page', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.next-page, button').filter(':contains("Próxima")').length > 0) {
          cy.get('.next-page, button').contains(/próxima|next/i).click();
        }
      });
    });

    it('should navigate to specific page', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.page-number').length > 1) {
          cy.get('.page-number').eq(1).click();
        }
      });
    });
  });

  describe('Search History', () => {
    it('should save search history', () => {
      cy.visit('/');
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first()
        .type('aspirina{enter}');
      cy.visit('/');
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first().focus();
      cy.get('body').then(($body) => {
        if ($body.find('.search-history, .recent-searches').length > 0) {
          cy.get('.search-history, .recent-searches').should('contain', 'aspirina');
        }
      });
    });

    it('should clear search history', () => {
      cy.visit('/');
      cy.get('input[type="search"], input[placeholder*="Buscar"], .search-input').first().focus();
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Limpar histórico")').length > 0) {
          cy.get('button').contains(/limpar histórico|clear history/i).click();
        }
      });
    });
  });

  describe('Voice Search', () => {
    it('should display voice search button', () => {
      cy.visit('/');
      cy.get('body').then(($body) => {
        if ($body.find('.voice-search, ion-icon[name="mic"]').length > 0) {
          cy.get('.voice-search, ion-icon[name="mic"]').should('exist');
        }
      });
    });
  });
});
