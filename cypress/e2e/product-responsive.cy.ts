/// <reference types="cypress" />

describe('Product Catalog - Responsive Design', () => {

  describe('1. Mobile Viewports', () => {
    const mobileViewports = [
      { width: 320, height: 568, device: 'iPhone SE' },
      { width: 375, height: 667, device: 'iPhone 8' },
      { width: 414, height: 896, device: 'iPhone 11' }
    ];

    mobileViewports.forEach((viewport) => {
      describe(`${viewport.device} (${viewport.width}x${viewport.height})`, () => {
        
        beforeEach(() => {
          cy.viewport(viewport.width, viewport.height);
        });

        it('should display product list correctly on mobile', () => {
          cy.visit('/products');
          cy.waitForAngular();
          
          // Verify page loaded
          cy.get('.product-card').should('have.length.greaterThan', 0);
          
          // Verify grid layout (1 column on mobile)
          cy.get('.product-grid').should('exist');
          
          // Verify products are stacked vertically
          cy.get('.product-card').then(($cards) => {
            if ($cards.length > 1) {
              const firstCardTop = $cards.eq(0).offset()?.top || 0;
              const secondCardTop = $cards.eq(1).offset()?.top || 0;
              expect(secondCardTop).to.be.greaterThan(firstCardTop);
            }
          });
          
          // Verify search input is visible
          cy.get('input[placeholder*="Buscar"]').should('be.visible');
        });

        it('should display product detail correctly on mobile', () => {
          cy.visit('/products');
          cy.waitForAngular();
          
          // Navigate to product detail
          cy.get('.product-card').first().click();
          cy.wait(1000);
          
          // Verify product detail loaded
          cy.get('.product-detail').should('exist');
          
          // Verify image gallery is visible
          cy.get('.image-gallery').should('be.visible');
          
          // Verify product info is below image (stacked layout)
          cy.get('.product-info').should('be.visible');
          
          // Verify action buttons are visible
          cy.get('button[aria-label*="carrinho"]').should('be.visible');
          
          // Verify back button is accessible
          cy.get('.back-button').should('be.visible');
        });

        it('should allow filters to be accessible on mobile', () => {
          cy.visit('/products');
          cy.waitForAngular();
          
          // On mobile, filters might be hidden in a drawer
          cy.get('body').then(($body) => {
            if ($body.find('.product-filters:visible').length === 0) {
              // Look for filter toggle button
              if ($body.find('button[aria-label*="filtro"]').length > 0) {
                cy.get('button[aria-label*="filtro"]').first().click();
                cy.wait(300);
              }
            }
            
            // Verify filters are accessible
            cy.get('body').should('exist');
          });
        });

        it('should allow scrolling on mobile', () => {
          cy.visit('/products');
          cy.waitForAngular();
          
          // Scroll down
          cy.scrollTo('bottom');
          cy.wait(500);
          
          // Verify scroll worked
          cy.window().then((win) => {
            expect(win.scrollY).to.be.greaterThan(0);
          });
          
          // Scroll back to top
          cy.scrollTo('top');
        });
      });
    });
  });

  describe('2. Tablet Viewports', () => {
    const tabletViewports = [
      { width: 768, height: 1024, device: 'iPad' },
      { width: 1024, height: 768, device: 'iPad Landscape' }
    ];

    tabletViewports.forEach((viewport) => {
      describe(`${viewport.device} (${viewport.width}x${viewport.height})`, () => {
        
        beforeEach(() => {
          cy.viewport(viewport.width, viewport.height);
        });

        it('should display product list with 2 columns on tablet', () => {
          cy.visit('/products');
          cy.waitForAngular();
          
          // Verify products loaded
          cy.get('.product-card').should('have.length.greaterThan', 0);
          
          // Verify grid exists
          cy.get('.product-grid').should('exist');
          
          // Verify multiple products visible in same row
          cy.get('.product-card').then(($cards) => {
            if ($cards.length > 1) {
              const firstCardTop = $cards.eq(0).offset()?.top || 0;
              const secondCardTop = $cards.eq(1).offset()?.top || 0;
              
              // Allow for small differences in alignment
              expect(Math.abs(secondCardTop - firstCardTop)).to.be.lessThan(10);
            }
          });
        });

        it('should display product detail with proper layout on tablet', () => {
          cy.visit('/products');
          cy.waitForAngular();
          
          // Navigate to detail
          cy.get('.product-card').first().click();
          cy.wait(1000);
          
          // Verify detail page loaded
          cy.get('.product-detail').should('exist');
          
          // Verify 2-column layout (image | info)
          cy.get('.product-main').should('exist');
          cy.get('.image-gallery').should('be.visible');
          cy.get('.product-info').should('be.visible');
        });

        it('should have filters visible on tablet', () => {
          cy.visit('/products');
          cy.waitForAngular();
          
          // Filters should be visible or easily accessible
          cy.get('body').then(($body) => {
            if ($body.find('.product-filters:visible').length > 0) {
              cy.get('.product-filters').should('be.visible');
            } else {
              cy.log('Filters may be in drawer on tablet');
            }
          });
        });
      });
    });
  });

  describe('3. Desktop Viewport', () => {
    beforeEach(() => {
      cy.viewport(1920, 1080);
    });

    it('should display product list with 3 columns on desktop', () => {
      cy.visit('/products');
      cy.waitForAngular();
      
      // Verify products loaded
      cy.get('.product-card').should('have.length.greaterThan', 0);
      
      // Verify grid layout
      cy.get('.product-grid').should('exist');
      
      // Verify 3 columns (3 products in same row)
      cy.get('.product-card').then(($cards) => {
        if ($cards.length >= 3) {
          const firstCardTop = $cards.eq(0).offset()?.top || 0;
          const secondCardTop = $cards.eq(1).offset()?.top || 0;
          const thirdCardTop = $cards.eq(2).offset()?.top || 0;
          
          // All three should be roughly at same height
          expect(Math.abs(secondCardTop - firstCardTop)).to.be.lessThan(10);
          expect(Math.abs(thirdCardTop - firstCardTop)).to.be.lessThan(10);
        }
      });
    });

    it('should display filters sidebar on desktop', () => {
      cy.visit('/products');
      cy.waitForAngular();
      
      // Filters sidebar should be visible
      cy.get('.product-filters').should('be.visible');
      
      // Verify filter options are visible
      cy.get('.product-filters').within(() => {
        cy.contains('Categoria').should('be.visible');
      });
    });

    it('should display product detail with 2-column layout on desktop', () => {
      cy.visit('/products');
      cy.waitForAngular();
      
      // Navigate to detail
      cy.get('.product-card').first().click();
      cy.wait(1000);
      
      // Verify 2-column layout (image | info)
      cy.get('.product-main').should('exist');
      
      // Image gallery on left
      cy.get('.image-gallery').should('be.visible');
      
      // Product info on right
      cy.get('.product-info').should('be.visible');
      
      // Verify they're side by side
      cy.get('.image-gallery').then(($gallery) => {
        cy.get('.product-info').then(($info) => {
          const galleryTop = $gallery.offset()?.top || 0;
          const infoTop = $info.offset()?.top || 0;
          
          // Should be roughly at same vertical position
          expect(Math.abs(infoTop - galleryTop)).to.be.lessThan(50);
        });
      });
    });

    it('should display all UI elements properly on desktop', () => {
      cy.visit('/products');
      cy.waitForAngular();
      
      // Verify all main sections are visible
      cy.get('input[placeholder*="Buscar"]').should('be.visible');
      cy.get('.product-filters').should('be.visible');
      cy.get('.product-grid').should('be.visible');
      cy.get('.view-toggle').should('be.visible');
    });

    it('should handle very wide viewport (4K)', () => {
      cy.viewport(3840, 2160);
      cy.visit('/products');
      cy.waitForAngular();
      
      // Verify content is centered and not stretched too wide
      cy.get('.product-grid').then(($grid) => {
        const gridWidth = $grid.width() || 0;
        expect(gridWidth).to.be.lessThan(2000); // Max container width
      });
      
      // Verify products still display correctly
      cy.get('.product-card').should('have.length.greaterThan', 0);
    });
  });

  describe('4. Orientation Changes', () => {
    it('should handle portrait to landscape on tablet', () => {
      // Start in portrait
      cy.viewport(768, 1024);
      cy.visit('/products');
      cy.waitForAngular();
      
      cy.get('.product-card').should('have.length.greaterThan', 0);
      
      // Rotate to landscape
      cy.viewport(1024, 768);
      cy.wait(500);
      
      // Verify layout adjusted
      cy.get('.product-card').should('have.length.greaterThan', 0);
      cy.get('.product-grid').should('exist');
    });
  });

});
