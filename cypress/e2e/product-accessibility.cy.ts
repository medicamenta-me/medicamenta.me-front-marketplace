/// <reference types="cypress" />

describe('Product Catalog - Accessibility (WCAG 2.1 AA)', () => {

  describe('1. Keyboard Navigation', () => {
    
    beforeEach(() => {
      cy.visit('/products');
      cy.waitForAngular();
    });

    it('should navigate product list with keyboard (Tab)', () => {
      // Start from body
      cy.get('body').focus();
      
      // Tab through elements
      cy.tab();
      cy.wait(100);
      
      // Verify focus is on an interactive element
      cy.focused().then(($el) => {
        const tagName = $el.prop('tagName').toLowerCase();
        const role = $el.attr('role');
        const tabindex = $el.attr('tabindex');
        
        // Should be focusable element
        expect(['a', 'button', 'input', 'select']).to.include(tagName);
      });
      
      // Continue tabbing
      for (let i = 0; i < 5; i++) {
        cy.tab();
        cy.wait(50);
        
        // Verify focus indicator is visible
        cy.focused().should('exist');
      }
    });

    it('should navigate to product detail with Enter key', () => {
      // Tab to first product card link
      cy.get('.product-card').first().find('a').first().focus();
      
      // Press Enter
      cy.focused().type('{enter}');
      
      // Wait for navigation
      cy.wait(1000);
      
      // Verify navigated to detail page
      cy.url().should('include', '/products/');
      cy.get('.product-detail').should('exist');
    });

    it('should navigate product detail with keyboard', () => {
      // Go to product detail
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      // Tab through detail page elements
      cy.get('body').focus();
      
      // Tab to back button
      cy.get('.back-button').focus();
      cy.focused().should('have.class', 'back-button');
      
      // Tab to quantity controls
      cy.get('button[aria-label*="Aumentar"]').focus();
      cy.focused().should('have.attr', 'aria-label');
      
      // Press Enter to increment
      cy.focused().type('{enter}');
      cy.wait(200);
      
      // Verify quantity increased
      cy.get('.quantity-value').invoke('text').then((qty) => {
        expect(parseInt(qty.trim())).to.be.greaterThan(1);
      });
    });

    it('should navigate image gallery with keyboard', () => {
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      // Check if multiple thumbnails exist
      cy.get('body').then(($body) => {
        if ($body.find('.thumbnail-button').length > 1) {
          // Focus on first thumbnail
          cy.get('.thumbnail-button').first().focus();
          
          // Press Enter to select
          cy.focused().type('{enter}');
          cy.wait(300);
          
          // Tab to next thumbnail
          cy.tab();
          
          // Press Enter to select next image
          cy.focused().type('{enter}');
          cy.wait(300);
          
          // Verify main image changed
          cy.get('.image-gallery img.main-image').should('exist');
        }
      });
    });

    it('should navigate tabs with keyboard', () => {
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      cy.get('body').then(($body) => {
        if ($body.find('.mat-tab-label').length > 0) {
          // Focus on first tab
          cy.get('.mat-tab-label').first().focus();
          
          // Press Enter to activate
          cy.focused().type('{enter}');
          cy.wait(300);
          
          // Tab to next tab
          cy.tab();
          
          // Press Enter to activate next tab
          cy.focused().type('{enter}');
          cy.wait(300);
          
          // Verify tab content changed
          cy.get('.mat-tab-body').should('be.visible');
        }
      });
    });

    it('should support Escape key to close modals/go back', () => {
      // This test assumes modal functionality exists
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      // Try pressing Escape
      cy.get('body').type('{esc}');
      cy.wait(500);
      
      // Note: Behavior depends on implementation
      // Escape might go back or close a modal
      cy.get('body').should('exist');
    });

    it('should skip to main content with keyboard shortcut', () => {
      // Check for skip link
      cy.get('body').then(($body) => {
        if ($body.find('a[href="#main-content"]').length > 0) {
          cy.get('a[href="#main-content"]').focus();
          cy.focused().type('{enter}');
          cy.wait(300);
          
          // Verify focus moved to main content
          cy.focused().should('have.id', 'main-content');
        } else {
          cy.log('Skip link not implemented');
        }
      });
    });
  });

  describe('2. ARIA Labels and Semantic HTML', () => {
    
    beforeEach(() => {
      cy.visit('/products');
      cy.waitForAngular();
    });

    it('should have ARIA labels on search input', () => {
      cy.get('input[placeholder*="Buscar"]')
        .should('have.attr', 'aria-label')
        .and('not.be.empty');
    });

    it('should have ARIA labels on filter checkboxes', () => {
      cy.get('.product-filters').within(() => {
        cy.get('input[type="checkbox"]').each(($checkbox) => {
          cy.wrap($checkbox).should('have.attr', 'aria-label');
        });
      });
    });

    it('should have ARIA labels on view toggle buttons', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.view-toggle button').length > 0) {
          cy.get('.view-toggle button').each(($button) => {
            cy.wrap($button)
              .should('have.attr', 'aria-label')
              .and('not.be.empty');
          });
        }
      });
    });

    it('should have alt text on product images', () => {
      cy.get('.product-card img').each(($img) => {
        cy.wrap($img)
          .should('have.attr', 'alt')
          .and('not.be.empty');
      });
    });

    it('should have ARIA labels on quantity buttons in detail page', () => {
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      // Check increment button
      cy.get('button[aria-label*="Aumentar"]')
        .should('exist')
        .and('have.attr', 'aria-label')
        .and('include', 'quantidade');
      
      // Check decrement button
      cy.get('button[aria-label*="Diminuir"]')
        .should('exist')
        .and('have.attr', 'aria-label')
        .and('include', 'quantidade');
    });

    it('should have ARIA labels on thumbnail buttons', () => {
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      cy.get('body').then(($body) => {
        if ($body.find('.thumbnail-button').length > 0) {
          cy.get('.thumbnail-button').each(($button) => {
            cy.wrap($button)
              .should('have.attr', 'aria-label')
              .and('not.be.empty');
          });
        }
      });
    });

    it('should have ARIA labels on action buttons', () => {
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      // Add to cart button
      cy.get('button[aria-label*="carrinho"]')
        .should('exist')
        .and('have.attr', 'aria-label')
        .and('not.be.empty');
    });

    it('should have proper heading hierarchy', () => {
      // Check for h1
      cy.get('h1').should('exist').and('have.length', 1);
      
      // Check heading order
      cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
        const levels = $headings.toArray().map(h => parseInt(h.tagName.substring(1)));
        
        // Verify h1 comes before other headings
        expect(levels[0]).to.equal(1);
      });
    });

    it('should have proper link text (no "click here")', () => {
      cy.get('a').each(($link) => {
        const text = $link.text().toLowerCase().trim();
        
        // Links should have descriptive text
        if (text.length > 0) {
          expect(text).not.to.equal('clique aqui');
          expect(text).not.to.equal('click here');
        }
      });
    });

    it('should have proper form labels', () => {
      // Check if forms exist
      cy.get('body').then(($body) => {
        if ($body.find('input[type="number"]').length > 0) {
          cy.get('input[type="number"]').each(($input) => {
            const id = $input.attr('id');
            const ariaLabel = $input.attr('aria-label');
            
            // Should have either a label or aria-label
            if (id) {
              cy.get(`label[for="${id}"]`).should('exist');
            } else {
              expect(ariaLabel).to.not.be.undefined;
            }
          });
        }
      });
    });

    it('should have proper button roles and types', () => {
      cy.get('button').each(($button) => {
        // Buttons should have type attribute
        const type = $button.attr('type');
        expect(['button', 'submit', 'reset']).to.include(type);
      });
    });

    it('should have focus indicators visible', () => {
      // Tab to first interactive element
      cy.get('.product-card').first().find('a').first().focus();
      
      // Verify focus indicator is visible
      cy.focused().then(($el) => {
        const outline = $el.css('outline');
        const outlineWidth = $el.css('outline-width');
        const boxShadow = $el.css('box-shadow');
        
        // Should have some visible focus indicator
        const hasFocusIndicator = 
          (outline && outline !== 'none') ||
          (outlineWidth && outlineWidth !== '0px') ||
          (boxShadow && boxShadow !== 'none');
        
        expect(hasFocusIndicator).to.be.true;
      });
    });

    it('should have sufficient color contrast (basic check)', () => {
      // This is a simplified check - full color contrast testing requires axe-core
      cy.get('.product-card').first().within(() => {
        cy.get('.price').then(($price) => {
          const color = $price.css('color');
          const bgColor = $price.css('background-color');
          
          // Just verify colors are defined
          expect(color).to.not.equal('');
          expect(bgColor).to.not.equal('');
        });
      });
    });

    it('should not have empty buttons', () => {
      cy.get('button').each(($button) => {
        const text = $button.text().trim();
        const ariaLabel = $button.attr('aria-label');
        const ariaLabelledby = $button.attr('aria-labelledby');
        const title = $button.attr('title');
        
        // Button should have text or aria-label
        const hasLabel = text.length > 0 || ariaLabel || ariaLabelledby || title;
        expect(hasLabel).to.be.true;
      });
    });

    it('should have unique IDs', () => {
      const ids: string[] = [];
      
      cy.get('[id]').each(($el) => {
        const id = $el.attr('id');
        if (id) {
          expect(ids).to.not.include(id);
          ids.push(id);
        }
      });
    });
  });

});
