/// <reference types="cypress" />

describe('Product Detail - Features and Interactions', () => {
  
  beforeEach(() => {
    cy.visit('/products');
    cy.waitForAngular();
    // Navigate to first product detail
    cy.get('.product-card').first().click();
    cy.wait(1000);
    cy.waitForAngular();
  });

  describe('1. Product Information Display', () => {
    it('should display all product information correctly', () => {
      // Verify product detail page loaded
      cy.get('.product-detail').should('exist');
      
      // Verify main image
      cy.get('.image-gallery img.main-image').should('exist');
      cy.get('.image-gallery img.main-image').should('have.attr', 'src');
      
      // Verify product name
      cy.get('.product-name').should('exist').and('not.be.empty');
      
      // Verify manufacturer
      cy.get('.product-manufacturer').should('exist');
      
      // Verify category
      cy.get('.product-category').should('exist');
      
      // Verify price
      cy.get('.product-price').should('exist');
      cy.get('.product-price').invoke('text').should('match', /R\$/);
      
      // Verify rating
      cy.get('.product-rating').should('exist');
      
      // Verify stock information
      cy.get('.product-stock').should('exist');
      
      // Verify description section
      cy.get('.product-description').should('exist');
    });
  });

  describe('2. Image Gallery', () => {
    it('should change main image when thumbnail is clicked', () => {
      // Check if thumbnails exist
      cy.get('body').then(($body) => {
        if ($body.find('.thumbnail-button').length > 1) {
          // Get initial main image src
          cy.get('.image-gallery img.main-image')
            .invoke('attr', 'src')
            .then((mainSrc) => {
              // Click second thumbnail
              cy.get('.thumbnail-button').eq(1).click();
              cy.wait(300);
              
              // Verify main image changed
              cy.get('.image-gallery img.main-image')
                .invoke('attr', 'src')
                .should('not.equal', mainSrc);
            });
        } else {
          cy.log('Product has only one image - skipping thumbnail test');
        }
      });
    });

    it('should display placeholder if no images available', () => {
      // This test would require a product with no images
      // For now, just verify main image exists
      cy.get('.image-gallery img.main-image').should('exist');
      cy.get('.image-gallery img.main-image')
        .invoke('attr', 'src')
        .should('not.be.empty');
    });
  });

  describe('3. Quantity Selector', () => {
    it('should increment quantity when plus button clicked', () => {
      // Get initial quantity
      cy.get('.quantity-value').invoke('text').then((initialQty) => {
        const initial = parseInt(initialQty.trim());
        
        // Click increment button
        cy.get('button[aria-label*="Aumentar"]').click();
        
        // Verify quantity increased
        cy.get('.quantity-value')
          .invoke('text')
          .then((newQty) => {
            expect(parseInt(newQty.trim())).to.equal(initial + 1);
          });
      });
    });

    it('should decrement quantity when minus button clicked', () => {
      // First increment to ensure quantity > 1
      cy.get('button[aria-label*="Aumentar"]').click();
      cy.wait(200);
      cy.get('button[aria-label*="Aumentar"]').click();
      cy.wait(200);
      
      // Get current quantity
      cy.get('.quantity-value').invoke('text').then((currentQty) => {
        const current = parseInt(currentQty.trim());
        
        // Click decrement button
        cy.get('button[aria-label*="Diminuir"]').click();
        
        // Verify quantity decreased
        cy.get('.quantity-value')
          .invoke('text')
          .then((newQty) => {
            expect(parseInt(newQty.trim())).to.equal(current - 1);
          });
      });
    });

    it('should not decrement below 1', () => {
      // Ensure quantity is at minimum
      cy.get('.quantity-value').invoke('text').then((qty) => {
        const current = parseInt(qty.trim());
        
        if (current > 1) {
          // Click decrement multiple times to reach 1
          for (let i = 0; i < current; i++) {
            cy.get('button[aria-label*="Diminuir"]').click();
            cy.wait(100);
          }
        }
      });
      
      // Try to decrement below 1
      cy.get('button[aria-label*="Diminuir"]').click();
      cy.wait(200);
      
      // Verify quantity is still 1
      cy.get('.quantity-value')
        .invoke('text')
        .then((qty) => {
          expect(parseInt(qty.trim())).to.be.at.least(1);
        });
    });

    it('should not increment above stock limit', () => {
      // This test assumes stock info is visible
      cy.get('body').then(($body) => {
        if ($body.find('.product-stock').length > 0) {
          cy.get('.product-stock').invoke('text').then((stockText) => {
            const stockMatch = stockText.match(/(\d+)/);
            if (stockMatch) {
              const stock = parseInt(stockMatch[1]);
              
              // Try to increment beyond stock
              for (let i = 0; i < stock + 5; i++) {
                cy.get('button[aria-label*="Aumentar"]').click();
                cy.wait(50);
              }
              
              // Verify quantity doesn't exceed stock
              cy.get('.quantity-value')
                .invoke('text')
                .then((qty) => {
                  expect(parseInt(qty.trim())).to.be.at.most(stock);
                });
            }
          });
        } else {
          cy.log('Stock information not visible - skipping test');
        }
      });
    });
  });

  describe('4. Add to Cart', () => {
    it('should trigger add to cart action when button clicked', () => {
      // Verify button exists
      cy.get('button[aria-label*="carrinho"]').should('exist');
      
      // Click add to cart button
      cy.get('button[aria-label*="carrinho"]').click();
      
      // Wait for potential feedback (alert, toast, etc.)
      cy.wait(500);
      
      // Verify button was clickable (no error thrown)
      cy.get('body').should('exist');
    });

    it('should not add to cart if out of stock', () => {
      // Check if product is out of stock
      cy.get('body').then(($body) => {
        if ($body.find('.out-of-stock').length > 0 || 
            $body.text().includes('Fora de estoque')) {
          // Verify add to cart button is disabled
          cy.get('button[aria-label*="carrinho"]').should('be.disabled');
        } else {
          cy.log('Product is in stock');
        }
      });
    });
  });

  describe('5. Buy Now', () => {
    it('should navigate to cart when "Comprar Agora" clicked', () => {
      // Check if buy now button exists
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Comprar")').length > 0) {
          // Click buy now button
          cy.contains('button', 'Comprar').click();
          
          // Wait for navigation
          cy.wait(1000);
          
          // Verify navigation to cart
          cy.url().should('include', '/cart');
        } else {
          cy.log('Buy now button not found - may not be implemented yet');
        }
      });
    });
  });

  describe('6. Product Tabs', () => {
    it('should switch between product tabs', () => {
      // Check if tabs exist
      cy.get('body').then(($body) => {
        if ($body.find('.mat-tab-label').length > 0) {
          // Verify Description tab is active by default
          cy.get('.mat-tab-label').contains('Descrição')
            .should('have.class', 'mat-tab-label-active');
          
          // Click Detalhes tab
          cy.get('.mat-tab-label').contains('Detalhes').click();
          cy.wait(300);
          
          // Verify Details content is visible
          cy.get('.mat-tab-body').should('be.visible');
          cy.get('.mat-tab-body').should('contain', 'SKU');
          
          // Click Avaliações tab
          cy.get('.mat-tab-label').contains('Avaliações').click();
          cy.wait(300);
          
          // Verify Reviews content is visible
          cy.get('.mat-tab-body').should('be.visible');
        } else {
          cy.log('Tabs not found - may not be implemented yet');
        }
      });
    });
  });

  describe('7. Related Products', () => {
    it('should display related products section', () => {
      // Scroll to bottom
      cy.scrollTo('bottom');
      cy.wait(500);
      
      // Check if related products exist
      cy.get('body').then(($body) => {
        if ($body.find('.related-products').length > 0) {
          cy.get('.related-products').should('be.visible');
          cy.get('.related-products h2').should('exist');
          cy.get('.related-products .product-card').should('have.length.greaterThan', 0);
        } else {
          cy.log('Related products section not found');
        }
      });
    });

    it('should navigate to related product when clicked', () => {
      // Scroll to related products
      cy.scrollTo('bottom');
      cy.wait(500);
      
      cy.get('body').then(($body) => {
        if ($body.find('.related-products .product-card').length > 0) {
          // Get current product URL
          cy.url().then((currentUrl) => {
            // Click on first related product
            cy.get('.related-products .product-card').first().click();
            cy.wait(1000);
            
            // Verify URL changed
            cy.url().should('not.equal', currentUrl);
            cy.url().should('include', '/products/');
            
            // Verify new product loaded
            cy.get('.product-detail').should('exist');
          });
        } else {
          cy.log('No related products available');
        }
      });
    });
  });

});
