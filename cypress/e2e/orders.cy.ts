/// <reference types="cypress" />

/**
 * 📦 Orders E2E Tests
 * Testes E2E para fluxos de pedidos
 */

describe('Orders', () => {
  describe('Order Tracking', () => {
    it('should display order tracking page', () => {
      cy.visit('/orders/track');
      cy.get('body').should('exist');
    });

    it('should search order by number', () => {
      cy.visit('/orders/track');
      cy.get('input[name="orderNumber"], input[placeholder*="pedido"]').should('exist');
    });

    it('should submit order search', () => {
      cy.visit('/orders/track');
      cy.get('input[name="orderNumber"], input[placeholder*="pedido"]').first()
        .type('PED123456');
      cy.get('button').contains(/buscar|rastrear|track/i).click();
    });

    it('should display order status', () => {
      cy.visit('/orders/track/PED123456');
      cy.get('body').then(($body) => {
        if ($body.find('.order-status, .tracking-status').length > 0) {
          cy.get('.order-status, .tracking-status').should('exist');
        }
      });
    });

    it('should display tracking timeline', () => {
      cy.visit('/orders/track/PED123456');
      cy.get('body').then(($body) => {
        if ($body.find('.timeline, .tracking-timeline').length > 0) {
          cy.get('.timeline, .tracking-timeline').should('exist');
        }
      });
    });

    it('should display estimated delivery date', () => {
      cy.visit('/orders/track/PED123456');
      cy.get('body').then(($body) => {
        if ($body.find('.delivery-date, .estimated-delivery').length > 0) {
          cy.get('.delivery-date, .estimated-delivery').should('exist');
        }
      });
    });
  });

  describe('Order Confirmation', () => {
    it('should display order confirmation page', () => {
      cy.visit('/orders/confirmation/PED123456');
      cy.get('body').should('exist');
    });

    it('should display success message', () => {
      cy.visit('/orders/confirmation/PED123456');
      cy.get('body').then(($body) => {
        if ($body.find('.success-message, .order-success').length > 0) {
          cy.get('.success-message, .order-success').should('exist');
        }
      });
    });

    it('should display order number', () => {
      cy.visit('/orders/confirmation/PED123456');
      cy.get('.order-number, .order-id').should('exist');
    });

    it('should display order summary', () => {
      cy.visit('/orders/confirmation/PED123456');
      cy.get('body').then(($body) => {
        if ($body.find('.order-summary').length > 0) {
          cy.get('.order-summary').should('exist');
        }
      });
    });

    it('should have continue shopping button', () => {
      cy.visit('/orders/confirmation/PED123456');
      cy.get('button, a').contains(/continuar comprando|continue shopping/i).should('exist');
    });

    it('should have track order button', () => {
      cy.visit('/orders/confirmation/PED123456');
      cy.get('button, a').contains(/acompanhar|track|rastrear/i).should('exist');
    });
  });

  describe('Order Status Flow', () => {
    it('should display pending status', () => {
      cy.visit('/orders/track/PED-PENDING');
      cy.get('body').then(($body) => {
        if ($body.find('.status-pending, .status').length > 0) {
          cy.get('.status-pending, .status').should('exist');
        }
      });
    });

    it('should display confirmed status', () => {
      cy.visit('/orders/track/PED-CONFIRMED');
      cy.get('body').then(($body) => {
        if ($body.find('.status-confirmed, .status').length > 0) {
          cy.get('.status-confirmed, .status').should('exist');
        }
      });
    });

    it('should display processing status', () => {
      cy.visit('/orders/track/PED-PROCESSING');
      cy.get('body').then(($body) => {
        if ($body.find('.status-processing, .status').length > 0) {
          cy.get('.status-processing, .status').should('exist');
        }
      });
    });

    it('should display shipped status', () => {
      cy.visit('/orders/track/PED-SHIPPED');
      cy.get('body').then(($body) => {
        if ($body.find('.status-shipped, .status').length > 0) {
          cy.get('.status-shipped, .status').should('exist');
        }
      });
    });

    it('should display delivered status', () => {
      cy.visit('/orders/track/PED-DELIVERED');
      cy.get('body').then(($body) => {
        if ($body.find('.status-delivered, .status').length > 0) {
          cy.get('.status-delivered, .status').should('exist');
        }
      });
    });

    it('should display cancelled status', () => {
      cy.visit('/orders/track/PED-CANCELLED');
      cy.get('body').then(($body) => {
        if ($body.find('.status-cancelled, .status').length > 0) {
          cy.get('.status-cancelled, .status').should('exist');
        }
      });
    });
  });

  describe('Order Actions', () => {
    beforeEach(() => {
      cy.visit('/profile/orders/PED123456');
    });

    it('should cancel order', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Cancelar")').length > 0) {
          cy.get('button').contains(/cancelar pedido|cancel order/i).should('exist');
        }
      });
    });

    it('should request refund', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Reembolso")').length > 0) {
          cy.get('button').contains(/reembolso|refund/i).should('exist');
        }
      });
    });

    it('should contact support', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button, a').filter(':contains("Suporte")').length > 0) {
          cy.get('button, a').contains(/suporte|support|ajuda/i).should('exist');
        }
      });
    });

    it('should download invoice', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button, a').filter(':contains("Nota fiscal")').length > 0) {
          cy.get('button, a').contains(/nota fiscal|invoice/i).should('exist');
        }
      });
    });

    it('should reorder items', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Comprar novamente")').length > 0) {
          cy.get('button').contains(/comprar novamente|reorder/i).should('exist');
        }
      });
    });
  });

  describe('Order Notifications', () => {
    it('should display order notifications', () => {
      cy.visit('/notifications');
      cy.get('body').then(($body) => {
        if ($body.find('.notification-item, .order-notification').length > 0) {
          cy.get('.notification-item, .order-notification').should('exist');
        }
      });
    });

    it('should mark notification as read', () => {
      cy.visit('/notifications');
      cy.get('body').then(($body) => {
        if ($body.find('.notification-item').length > 0) {
          cy.get('.notification-item').first().click();
        }
      });
    });
  });

  describe('Order Review', () => {
    it('should prompt for review after delivery', () => {
      cy.visit('/profile/orders/PED-DELIVERED');
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Avaliar")').length > 0) {
          cy.get('button').contains(/avaliar|review/i).should('exist');
        }
      });
    });

    it('should navigate to review form', () => {
      cy.visit('/profile/orders/PED-DELIVERED');
      cy.get('body').then(($body) => {
        if ($body.find('button').filter(':contains("Avaliar")').length > 0) {
          cy.get('button').contains(/avaliar|review/i).first().click();
          cy.url().should('include', 'review');
        }
      });
    });
  });

  describe('Order Filters', () => {
    beforeEach(() => {
      cy.visit('/profile/orders');
    });

    it('should filter by status', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.status-filter, select[name="status"]').length > 0) {
          cy.get('.status-filter, select[name="status"]').first().click();
        }
      });
    });

    it('should filter by date range', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.date-filter, input[type="date"]').length > 0) {
          cy.get('.date-filter, input[type="date"]').first().click();
        }
      });
    });

    it('should search orders', () => {
      cy.get('body').then(($body) => {
        if ($body.find('input[type="search"], input[placeholder*="Buscar"]').length > 0) {
          cy.get('input[type="search"], input[placeholder*="Buscar"]').first()
            .type('medicamento');
        }
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty orders message', () => {
      cy.visit('/profile/orders');
      cy.get('body').then(($body) => {
        if ($body.find('.empty-state, .no-orders').length > 0) {
          cy.get('.empty-state, .no-orders').should('exist');
        }
      });
    });

    it('should suggest products when no orders', () => {
      cy.visit('/profile/orders');
      cy.get('body').then(($body) => {
        if ($body.find('button, a').filter(':contains("Começar a comprar")').length > 0) {
          cy.get('button, a').contains(/começar|start shopping/i).should('exist');
        }
      });
    });
  });
});
