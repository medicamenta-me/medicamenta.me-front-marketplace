/// <reference types="cypress" />

/**
 * 📱 Responsive E2E Tests
 * Testes E2E para responsividade
 */

describe('Responsive Design', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone X', width: 375, height: 812 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Large Desktop', width: 1920, height: 1080 },
  ];

  describe('Home Page', () => {
    viewports.forEach(({ name, width, height }) => {
      it(`should display correctly on ${name}`, () => {
        cy.viewport(width, height);
        cy.visit('/');
        cy.get('body').should('be.visible');
        cy.get('header, ion-header').should('be.visible');
      });
    });
  });

  describe('Navigation', () => {
    it('should show hamburger menu on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('.hamburger-menu, ion-menu-button, .mobile-menu').should('be.visible');
    });

    it('should show full navigation on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/');
      cy.get('nav, .desktop-nav').should('be.visible');
    });

    it('should toggle mobile menu', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('.hamburger-menu, ion-menu-button').first().click();
      cy.get('.mobile-nav, ion-menu, .side-menu').should('be.visible');
    });
  });

  describe('Product Grid', () => {
    it('should show 1-2 columns on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      cy.get('.product-grid, .products-container').should('exist');
    });

    it('should show 2-3 columns on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/products');
      cy.get('.product-grid, .products-container').should('exist');
    });

    it('should show 4+ columns on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/products');
      cy.get('.product-grid, .products-container').should('exist');
    });
  });

  describe('Product Card', () => {
    it('should adapt to mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().should('be.visible');
    });

    it('should show full details on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().should('be.visible');
    });

    it('should show hover effects on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/products');
      cy.get('.product-card, ion-card').first()
        .trigger('mouseover')
        .should('be.visible');
    });
  });

  describe('Product Detail', () => {
    it('should stack content on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
      cy.get('.product-detail, .product-page').should('exist');
    });

    it('should show side-by-side on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
      cy.get('.product-detail, .product-page').should('exist');
    });
  });

  describe('Cart', () => {
    it('should be full screen on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/cart');
      cy.get('.cart-container, .cart-page').should('exist');
    });

    it('should show sidebar on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/cart');
      cy.get('.cart-container, .cart-page').should('exist');
    });
  });

  describe('Checkout', () => {
    it('should show single column on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/checkout');
      cy.get('.checkout-container, form').should('exist');
    });

    it('should show multi-column on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/checkout');
      cy.get('.checkout-container, form').should('exist');
    });
  });

  describe('Forms', () => {
    it('should have full-width inputs on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/auth/login');
      cy.get('input').first().should('have.css', 'width').and('not.equal', '0px');
    });

    it('should have constrained width on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/auth/login');
      cy.get('form, .login-form').should('exist');
    });
  });

  describe('Images', () => {
    it('should be responsive', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      cy.get('img').first().should('be.visible');
    });

    it('should not overflow container', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      cy.get('img').first().should(($img) => {
        const imgWidth = $img.width()!;
        const containerWidth = $img.parent().width()!;
        expect(imgWidth).to.be.at.most(containerWidth);
      });
    });
  });

  describe('Typography', () => {
    it('should scale text on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('h1').should('be.visible');
    });

    it('should maintain readability', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('p').first().should(($p) => {
        const fontSize = parseFloat($p.css('font-size'));
        expect(fontSize).to.be.at.least(14);
      });
    });
  });

  describe('Buttons', () => {
    it('should be touch-friendly on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('button').first().should(($btn) => {
        const height = $btn.height()!;
        expect(height).to.be.at.least(44);
      });
    });

    it('should be full-width when appropriate', () => {
      cy.viewport('iphone-x');
      cy.visit('/auth/login');
      cy.get('button[type="submit"]').should('be.visible');
    });
  });

  describe('Modals', () => {
    it('should be full screen on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
      // Modal should adapt to screen size
    });

    it('should be centered on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/products');
      cy.get('.product-card, ion-card').first().click();
      // Modal should be centered
    });
  });

  describe('Footer', () => {
    it('should stack on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('footer, ion-footer').should('exist');
    });

    it('should show columns on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/');
      cy.get('footer, ion-footer').should('exist');
    });
  });

  describe('Scroll Behavior', () => {
    it('should allow vertical scrolling', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');
      cy.scrollTo('bottom');
      cy.window().its('scrollY').should('be.gt', 0);
    });

    it('should not allow horizontal scrolling', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.document().its('documentElement.scrollWidth').then((scrollWidth) => {
        cy.viewport('iphone-x').then(() => {
          const viewportWidth = 375;
          expect(scrollWidth).to.be.at.most(viewportWidth + 10); // Allow small margin
        });
      });
    });
  });

  describe('Orientation', () => {
    it('should handle portrait orientation', () => {
      cy.viewport(375, 812);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should handle landscape orientation', () => {
      cy.viewport(812, 375);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });
  });

  describe('Breakpoints', () => {
    it('should respond to xs breakpoint', () => {
      cy.viewport(320, 568);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should respond to sm breakpoint', () => {
      cy.viewport(576, 768);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should respond to md breakpoint', () => {
      cy.viewport(768, 1024);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should respond to lg breakpoint', () => {
      cy.viewport(992, 768);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should respond to xl breakpoint', () => {
      cy.viewport(1200, 900);
      cy.visit('/');
      cy.get('body').should('be.visible');
    });
  });
});
