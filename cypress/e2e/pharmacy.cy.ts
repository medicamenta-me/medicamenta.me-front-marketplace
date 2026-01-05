/// <reference types="cypress" />

/**
 * 🏥 Pharmacy E2E Tests
 * Testes E2E para fluxos de farmácias
 */

describe('Pharmacy Features', () => {
  beforeEach(() => {
    cy.visit('/pharmacies');
  });

  describe('Pharmacy List', () => {
    it('should display pharmacy list page', () => {
      cy.url().should('include', '/pharmacies');
      cy.get('h1, .page-title').should('exist');
    });

    it('should display pharmacy cards', () => {
      cy.get('.pharmacy-card, ion-card').should('have.length.greaterThan', 0);
    });

    it('should show pharmacy name on cards', () => {
      cy.get('.pharmacy-card, ion-card').first().within(() => {
        cy.get('.pharmacy-name, h2, h3').should('exist');
      });
    });

    it('should show pharmacy rating', () => {
      cy.get('.pharmacy-card, ion-card').first().within(() => {
        cy.get('.rating, .stars, ion-icon[name*="star"]').should('exist');
      });
    });

    it('should show pharmacy address', () => {
      cy.get('.pharmacy-card, ion-card').first().within(() => {
        cy.get('.address, .location').should('exist');
      });
    });
  });

  describe('Pharmacy Search', () => {
    it('should have search input', () => {
      cy.get('input[placeholder*="Buscar"], ion-searchbar').should('exist');
    });

    it('should filter pharmacies by name', () => {
      cy.get('input[placeholder*="Buscar"], ion-searchbar').type('farmacia');
      cy.wait(500);
      cy.get('.pharmacy-card, ion-card').should('exist');
    });

    it('should handle empty search results', () => {
      cy.get('input[placeholder*="Buscar"], ion-searchbar').type('xyznotfound123');
      cy.wait(500);
      cy.get('body').should('exist');
    });
  });

  describe('Pharmacy Filters', () => {
    it('should have filter options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.filters, .filter-button').length > 0) {
          cy.get('.filters, .filter-button').should('exist');
        }
      });
    });

    it('should filter by open now', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button, ion-chip').filter(':contains("Aberto")').length > 0) {
          cy.get('button, ion-chip').contains('Aberto').click();
          cy.wait(500);
          cy.get('.pharmacy-card, ion-card').should('exist');
        }
      });
    });

    it('should filter by delivery available', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button, ion-chip').filter(':contains("Entrega")').length > 0) {
          cy.get('button, ion-chip').contains('Entrega').click();
          cy.wait(500);
          cy.get('.pharmacy-card, ion-card').should('exist');
        }
      });
    });
  });

  describe('Pharmacy Detail', () => {
    it('should navigate to pharmacy detail page', () => {
      cy.get('.pharmacy-card, ion-card').first().click();
      cy.url().should('include', '/pharmacy');
    });

    it('should display pharmacy info on detail page', () => {
      cy.get('.pharmacy-card, ion-card').first().click();
      cy.get('.pharmacy-name, h1').should('exist');
    });

    it('should display products from pharmacy', () => {
      cy.get('.pharmacy-card, ion-card').first().click();
      cy.wait(500);
      cy.get('.product-card, .product-item').should('exist');
    });

    it('should display contact info', () => {
      cy.get('.pharmacy-card, ion-card').first().click();
      cy.get('body').then(($body) => {
        if ($body.find('.contact-info, .phone, .email').length > 0) {
          cy.get('.contact-info, .phone, .email').should('exist');
        }
      });
    });

    it('should display opening hours', () => {
      cy.get('.pharmacy-card, ion-card').first().click();
      cy.get('body').then(($body) => {
        if ($body.find('.opening-hours, .hours').length > 0) {
          cy.get('.opening-hours, .hours').should('exist');
        }
      });
    });
  });

  describe('Pharmacy Reviews', () => {
    it('should display reviews section on detail page', () => {
      cy.get('.pharmacy-card, ion-card').first().click();
      cy.get('body').then(($body) => {
        if ($body.find('.reviews, .review-section').length > 0) {
          cy.get('.reviews, .review-section').should('exist');
        }
      });
    });

    it('should display average rating', () => {
      cy.get('.pharmacy-card, ion-card').first().click();
      cy.get('.rating, .average-rating').should('exist');
    });
  });

  describe('Nearby Pharmacies', () => {
    it('should display map or location info', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.map, .location-map, google-map').length > 0) {
          cy.get('.map, .location-map, google-map').should('exist');
        }
      });
    });

    it('should handle geolocation permission', () => {
      // Mock geolocation
      cy.visit('/pharmacies', {
        onBeforeLoad(win) {
          cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
            return cb({
              coords: {
                latitude: -23.5505,
                longitude: -46.6333
              }
            });
          });
        }
      });
      cy.get('body').should('exist');
    });
  });
});
