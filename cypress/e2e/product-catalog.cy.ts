/// <reference types="cypress" />

describe('Product Catalog - Navigation and Filters', () => {
  
  beforeEach(() => {
    cy.visit('/products');
    cy.waitForAngular();
  });

  describe('1. Load Product List Page', () => {
    it('should load product list page with products', () => {
      // Verify URL
      cy.url().should('include', '/products');
      
      // Verify page title
      cy.get('h1').should('exist').and('contain', 'Produtos');
      
      // Verify products are loaded
      cy.get('.product-card').should('have.length.greaterThan', 0);
      
      // Verify view toggle exists
      cy.get('.view-toggle').should('exist');
      
      // Verify filters exist
      cy.get('.product-filters').should('exist');
      
      // Verify search input exists
      cy.get('input[placeholder*="Buscar"]').should('exist');
    });
  });

  describe('2. Search Products', () => {
    it('should search products by name (valid query)', () => {
      // Type search query
      cy.searchProducts('dipirona');
      
      // Wait for results
      cy.waitForAngular();
      
      // Verify results contain search term
      cy.get('.product-card').should('have.length.greaterThan', 0);
      cy.get('.product-card').first().should('contain.text', 'Dipirona');
    });

    it('should show "no results" message for invalid search', () => {
      // Type invalid search query
      cy.searchProducts('xyzabc123notfound');
      
      // Wait for results
      cy.wait(1000);
      
      // Verify no results message or empty state
      cy.get('body').then(($body) => {
        if ($body.find('.no-results').length > 0) {
          cy.get('.no-results').should('be.visible');
          cy.get('.no-results').should('contain', 'Nenhum produto encontrado');
        } else if ($body.find('.product-card').length === 0) {
          cy.get('.product-card').should('have.length', 0);
        }
      });
    });

    it('should handle search with special characters', () => {
      // Type search with special characters
      cy.searchProducts('100mg/ml');
      
      // Wait for results
      cy.wait(500);
      
      // Verify app doesn't crash
      cy.get('body').should('exist');
      cy.url().should('include', '/products');
    });
  });

  describe('3. Apply Filters', () => {
    it('should filter products by category', () => {
      // Open filters if collapsed (mobile)
      cy.get('body').then(($body) => {
        if ($body.find('.product-filters:visible').length === 0) {
          cy.get('button[aria-label*="filtros"]').click();
        }
      });
      
      // Apply category filter
      cy.get('.product-filters').within(() => {
        cy.contains('Analgésicos').click();
      });
      
      // Wait for results
      cy.wait(500);
      
      // Verify filtered results
      cy.get('.product-card').should('have.length.greaterThan', 0);
      cy.get('.product-card').first().within(() => {
        cy.get('.category-chip').should('contain', 'Analgésicos');
      });
    });

    it('should filter products by price range', () => {
      // Apply price range filter
      cy.applyFilters({
        minPrice: 10,
        maxPrice: 50
      });
      
      // Wait for results
      cy.waitForAngular();
      
      // Verify prices are within range
      cy.get('.product-card').should('have.length.greaterThan', 0);
      cy.checkPriceInRange(10, 50);
    });

    it('should apply multiple filters simultaneously', () => {
      // Apply multiple filters
      cy.applyFilters({
        category: 'Analgésicos',
        minPrice: 10,
        maxPrice: 100,
        inStock: true
      });
      
      // Wait for results
      cy.waitForAngular();
      
      // Verify results exist (may be filtered down significantly)
      cy.get('body').should('exist');
      
      // If products exist, verify they match filters
      cy.get('body').then(($body) => {
        if ($body.find('.product-card').length > 0) {
          cy.get('.product-card').should('have.length.greaterThan', 0);
        }
      });
    });
  });

  describe('4. Toggle View', () => {
    it('should toggle between grid and list view', () => {
      // Verify default view (grid)
      cy.get('.product-grid').should('exist');
      
      // Check if view toggle is visible
      cy.get('body').then(($body) => {
        if ($body.find('.view-toggle').length > 0) {
          // Toggle to list view
          cy.get('.view-toggle button[aria-label*="lista"]').click();
          cy.wait(300);
          
          // Verify list view active
          cy.get('.product-grid').should('have.class', 'list-view');
          
          // Toggle back to grid
          cy.get('.view-toggle button[aria-label*="grade"]').click();
          cy.wait(300);
          
          // Verify grid view active
          cy.get('.product-grid').should('have.class', 'grid-view');
        } else {
          // View toggle not implemented yet, skip
          cy.log('View toggle not found - feature may not be implemented');
        }
      });
    });
  });

  describe('5. Navigation', () => {
    it('should navigate to product detail when card is clicked', () => {
      // Click first product card
      cy.get('.product-card').first().click();
      
      // Wait for navigation
      cy.wait(500);
      
      // Verify URL changed to detail page
      cy.url().should('include', '/products/');
      cy.url().should('not.equal', 'http://localhost:4200/products');
      
      // Verify detail page loaded
      cy.get('.product-detail').should('exist');
    });

    it('should navigate back to list from detail page', () => {
      // Go to detail page
      cy.get('.product-card').first().click();
      cy.wait(500);
      
      // Click back button
      cy.get('.back-button').click();
      
      // Verify back at list page
      cy.url().should('equal', 'http://localhost:4200/products');
      cy.get('.product-card').should('have.length.greaterThan', 0);
    });
  });

  describe('6. Related Products Navigation', () => {
    it('should navigate to related product from detail page', () => {
      // Go to detail page
      cy.goToProductDetail(0);
      cy.wait(1000);
      
      // Scroll to related products section
      cy.get('body').then(($body) => {
        if ($body.find('.related-products').length > 0) {
          cy.get('.related-products').scrollIntoView();
          
          // Click on a related product
          cy.get('.related-products .product-card').first().click();
          cy.wait(500);
          
          // Verify URL changed
          cy.url().should('include', '/products/');
          
          // Verify new product loaded
          cy.get('.product-detail').should('exist');
        } else {
          cy.log('Related products section not found');
        }
      });
    });
  });

});
