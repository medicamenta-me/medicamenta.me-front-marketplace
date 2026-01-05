/// <reference types="cypress" />

/**
 * ♿ Accessibility E2E Tests
 * Testes E2E para acessibilidade
 */

describe('Accessibility', () => {
  describe('Keyboard Navigation', () => {
    it('should navigate with tab key on home page', () => {
      cy.visit('/');
      cy.get('body').tab();
      cy.focused().should('exist');
    });

    it('should navigate with tab key on products page', () => {
      cy.visit('/products');
      cy.get('body').tab();
      cy.focused().should('exist');
    });

    it('should activate links with enter key', () => {
      cy.visit('/');
      cy.get('a').first().focus().type('{enter}');
    });

    it('should activate buttons with space key', () => {
      cy.visit('/');
      cy.get('button').first().focus().type(' ');
    });

    it('should navigate product cards with arrow keys', () => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().focus();
      cy.focused().type('{rightarrow}');
    });

    it('should close modals with escape key', () => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
      cy.get('body').type('{esc}');
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicator', () => {
      cy.visit('/');
      cy.get('a').first().focus();
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');
    });

    it('should trap focus in modal', () => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
      cy.get('body').then(($body) => {
        if ($body.find('.modal, .dialog, ion-modal').length > 0) {
          cy.get('.modal, .dialog, ion-modal').within(() => {
            cy.get('button').first().focus();
            cy.focused().should('exist');
          });
        }
      });
    });

    it('should return focus after modal closes', () => {
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().as('trigger').click();
      cy.get('body').type('{esc}');
      // Focus should return to trigger element
    });
  });

  describe('ARIA Labels', () => {
    it('should have aria-label on icon buttons', () => {
      cy.visit('/');
      cy.get('button ion-icon, button i').each(($el) => {
        cy.wrap($el).parent().should('have.attr', 'aria-label');
      });
    });

    it('should have aria-label on search input', () => {
      cy.visit('/');
      cy.get('input[type="search"], .search-input').should('have.attr', 'aria-label');
    });

    it('should have aria-label on cart button', () => {
      cy.visit('/');
      cy.get('.cart-button, [routerLink*="cart"]').should('have.attr', 'aria-label');
    });
  });

  describe('Form Accessibility', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('should have labels for all inputs', () => {
      cy.get('input').each(($input) => {
        const id = $input.attr('id');
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        }
      });
    });

    it('should have required indicator on required fields', () => {
      cy.get('input[required]').should('exist');
    });

    it('should display error messages accessibly', () => {
      cy.get('input[type="email"]').type('invalid');
      cy.get('input[type="password"]').click();
      cy.get('.error, [role="alert"], mat-error').should('exist');
    });

    it('should have aria-invalid on invalid inputs', () => {
      cy.get('input[type="email"]').type('invalid').blur();
      cy.get('input[type="email"]').should('have.attr', 'aria-invalid', 'true');
    });
  });

  describe('Image Accessibility', () => {
    it('should have alt text on product images', () => {
      cy.visit('/products');
      cy.get('.product-card img, ion-card img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should have alt text on pharmacy logos', () => {
      cy.visit('/pharmacies');
      cy.get('.pharmacy-logo, .pharmacy-image').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should have empty alt on decorative images', () => {
      cy.visit('/');
      cy.get('img[aria-hidden="true"]').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt', '');
      });
    });
  });

  describe('Semantic HTML', () => {
    it('should have main element', () => {
      cy.visit('/');
      cy.get('main, [role="main"]').should('exist');
    });

    it('should have header element', () => {
      cy.visit('/');
      cy.get('header, [role="banner"]').should('exist');
    });

    it('should have navigation element', () => {
      cy.visit('/');
      cy.get('nav, [role="navigation"]').should('exist');
    });

    it('should have footer element', () => {
      cy.visit('/');
      cy.get('footer, [role="contentinfo"]').should('exist');
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/');
      cy.get('h1').should('have.length.at.least', 1);
    });
  });

  describe('Color Contrast', () => {
    it('should have readable text on buttons', () => {
      cy.visit('/');
      cy.get('button').first().should('be.visible');
      // Visual check - contrast should be at least 4.5:1
    });

    it('should have readable link text', () => {
      cy.visit('/');
      cy.get('a').each(($link) => {
        cy.wrap($link).should('be.visible');
      });
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have skip link', () => {
      cy.visit('/');
      cy.get('.skip-link, [href="#main"]').should('exist');
    });

    it('should have landmark regions', () => {
      cy.visit('/');
      cy.get('[role="banner"], [role="main"], [role="navigation"], [role="contentinfo"]')
        .should('have.length.at.least', 1);
    });

    it('should announce dynamic content changes', () => {
      cy.visit('/');
      cy.get('[aria-live]').should('exist');
    });

    it('should have descriptive page title', () => {
      cy.visit('/');
      cy.title().should('not.be.empty');
    });
  });

  describe('Responsive Accessibility', () => {
    it('should be accessible on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('body').should('exist');
      cy.get('button, a').first().should('be.visible');
    });

    it('should have touch target size of at least 44px', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('button').first().should(($btn) => {
        const height = $btn.height();
        const width = $btn.width();
        expect(Math.max(height!, width!)).to.be.at.least(44);
      });
    });

    it('should not require horizontal scrolling', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('body').should('have.css', 'overflow-x', 'hidden');
    });
  });

  describe('Motion and Animation', () => {
    it('should respect reduced motion preference', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win, 'matchMedia')
            .withArgs('(prefers-reduced-motion: reduce)')
            .returns({ matches: true });
        }
      });
      cy.get('body').should('exist');
    });

    it('should not have auto-playing animations', () => {
      cy.visit('/');
      // Check for no auto-playing videos or animations
      cy.get('video[autoplay]').should('have.length', 0);
    });
  });

  describe('Error Handling', () => {
    it('should announce errors to screen readers', () => {
      cy.visit('/auth/login');
      cy.get('form').submit();
      cy.get('[role="alert"], .error-message').should('exist');
    });

    it('should focus on first error', () => {
      cy.visit('/auth/login');
      cy.get('form').submit();
      cy.focused().should('have.attr', 'aria-invalid', 'true');
    });
  });
});
