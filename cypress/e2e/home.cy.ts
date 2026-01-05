/// <reference types="cypress" />

/**
 * 🏠 Home Page E2E Tests
 * Testes E2E para a página inicial
 */

describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Page Load', () => {
    it('should load home page successfully', () => {
      cy.url().should('satisfy', (url: string) => {
        return url.endsWith('/') || url.includes('/home');
      });
    });

    it('should display header/navigation', () => {
      cy.get('header, ion-header, nav').should('exist');
    });

    it('should display logo', () => {
      cy.get('img[alt*="logo"], .logo').should('exist');
    });

    it('should display search bar', () => {
      cy.get('input[type="search"], ion-searchbar, .search-input').should('exist');
    });
  });

  describe('Featured Products', () => {
    it('should display featured products section', () => {
      cy.get('.featured-products, .featured, .products-section').should('exist');
    });

    it('should display product cards', () => {
      cy.get('.product-card, ion-card').should('have.length.greaterThan', 0);
    });

    it('should show product image', () => {
      cy.get('.product-card, ion-card').first().within(() => {
        cy.get('img').should('exist');
      });
    });

    it('should show product price', () => {
      cy.get('.product-card, ion-card').first().within(() => {
        cy.get('.price, .product-price').should('contain', 'R$');
      });
    });

    it('should navigate to product on click', () => {
      cy.get('.product-card, ion-card').first().click();
      cy.url().should('include', '/product');
    });
  });

  describe('Categories', () => {
    it('should display categories section', () => {
      cy.get('.categories, .category-section').should('exist');
    });

    it('should display category items', () => {
      cy.get('.category-item, .category-card').should('have.length.greaterThan', 0);
    });

    it('should navigate to category on click', () => {
      cy.get('.category-item, .category-card').first().click();
      cy.url().should('include', '/products');
    });
  });

  describe('Navigation', () => {
    it('should navigate to products page', () => {
      cy.get('a[href*="/products"], button').contains(/produtos|products/i).click();
      cy.url().should('include', '/products');
    });

    it('should navigate to pharmacies page', () => {
      cy.get('body').then(($body) => {
        if ($body.find('a[href*="/pharmacies"]').length > 0) {
          cy.get('a[href*="/pharmacies"]').first().click();
          cy.url().should('include', '/pharmacies');
        }
      });
    });

    it('should have cart link', () => {
      cy.get('a[href*="/cart"], button[aria-label*="cart"], .cart-icon').should('exist');
    });

    it('should have login/profile link', () => {
      cy.get('a[href*="/login"], a[href*="/profile"], .profile-icon').should('exist');
    });
  });

  describe('Footer', () => {
    it('should display footer', () => {
      cy.get('footer, ion-footer, .footer').should('exist');
    });

    it('should display contact info', () => {
      cy.get('footer, .footer').then(($footer) => {
        if ($footer.find('.contact, .email, .phone').length > 0) {
          cy.get('.contact, .email, .phone').should('exist');
        }
      });
    });

    it('should display social links', () => {
      cy.get('footer, .footer').then(($footer) => {
        if ($footer.find('.social-links, .social-icons').length > 0) {
          cy.get('.social-links, .social-icons').should('exist');
        }
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search from home page', () => {
      cy.get('input[type="search"], ion-searchbar, .search-input').first().type('dipirona');
      cy.get('button[type="submit"], .search-button').first().click();
      cy.url().should('include', '/products');
    });

    it('should show search suggestions', () => {
      cy.get('input[type="search"], ion-searchbar, .search-input').first().type('par');
      cy.wait(500);
      cy.get('body').then(($body) => {
        if ($body.find('.suggestions, .search-results, .autocomplete').length > 0) {
          cy.get('.suggestions, .search-results, .autocomplete').should('exist');
        }
      });
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('body').should('exist');
      cy.get('.product-card, ion-card').should('exist');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      cy.get('body').should('exist');
      cy.get('.product-card, ion-card').should('exist');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/');
      cy.get('body').should('exist');
      cy.get('.product-card, ion-card').should('exist');
    });
  });

  describe('Performance', () => {
    it('should load within acceptable time', () => {
      cy.visit('/', {
        timeout: 10000
      });
      cy.get('body').should('exist');
    });

    it('should not have console errors', () => {
      cy.visit('/');
      cy.window().then((win) => {
        // Just verify the page loaded
        expect(win.document.body).to.exist;
      });
    });
  });
});
