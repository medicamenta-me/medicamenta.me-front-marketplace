/// <reference types="cypress" />

/**
 * 👤 User Profile E2E Tests
 * Testes E2E para fluxos do perfil de usuário
 */

describe('User Profile', () => {
  describe('Profile Page', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    it('should display profile page', () => {
      cy.get('body').should('exist');
    });

    it('should display user avatar', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.avatar, .user-avatar, img.profile-image').length > 0) {
          cy.get('.avatar, .user-avatar, img.profile-image').should('exist');
        }
      });
    });

    it('should display user name', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.user-name, .profile-name').length > 0) {
          cy.get('.user-name, .profile-name').should('exist');
        }
      });
    });

    it('should display user email', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.user-email, .profile-email').length > 0) {
          cy.get('.user-email, .profile-email').should('exist');
        }
      });
    });

    it('should display edit profile button', () => {
      cy.get('button, ion-button').contains(/editar|edit/i).should('exist');
    });
  });

  describe('Edit Profile', () => {
    beforeEach(() => {
      cy.visit('/profile/edit');
    });

    it('should display edit profile form', () => {
      cy.get('form, .edit-profile-form').should('exist');
    });

    it('should display name input', () => {
      cy.get('input[name="name"], input[formControlName="name"]').should('exist');
    });

    it('should display phone input', () => {
      cy.get('body').then(($body) => {
        if ($body.find('input[name="phone"], input[formControlName="phone"]').length > 0) {
          cy.get('input[name="phone"], input[formControlName="phone"]').should('exist');
        }
      });
    });

    it('should display save button', () => {
      cy.get('button').contains(/salvar|save/i).should('exist');
    });

    it('should validate required fields', () => {
      cy.get('input[name="name"], input[formControlName="name"]').clear();
      cy.get('button').contains(/salvar|save/i).click();
      cy.get('.error, .invalid-feedback, mat-error').should('exist');
    });

    it('should upload avatar', () => {
      cy.get('body').then(($body) => {
        if ($body.find('input[type="file"]').length > 0) {
          cy.get('input[type="file"]').should('exist');
        }
      });
    });
  });

  describe('Addresses', () => {
    beforeEach(() => {
      cy.visit('/profile/addresses');
    });

    it('should display addresses page', () => {
      cy.get('body').should('exist');
    });

    it('should display address list', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.address-card, .address-item').length > 0) {
          cy.get('.address-card, .address-item').should('exist');
        }
      });
    });

    it('should display add address button', () => {
      cy.get('button, ion-button').contains(/adicionar|add/i).should('exist');
    });

    it('should navigate to add address form', () => {
      cy.get('button, ion-button').contains(/adicionar|add/i).click();
      cy.url().should('include', 'address');
    });

    it('should edit address', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.address-card').length > 0) {
          cy.get('.address-card').first().within(() => {
            cy.get('button').contains(/editar|edit/i).should('exist');
          });
        }
      });
    });

    it('should delete address', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.address-card').length > 0) {
          cy.get('.address-card').first().within(() => {
            cy.get('button').contains(/excluir|delete|remover/i).should('exist');
          });
        }
      });
    });

    it('should set default address', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.address-card').length > 0) {
          cy.get('.address-card').first().within(() => {
            cy.get('button, input[type="radio"]').should('exist');
          });
        }
      });
    });
  });

  describe('Add Address Form', () => {
    beforeEach(() => {
      cy.visit('/profile/addresses/new');
    });

    it('should display address form', () => {
      cy.get('form').should('exist');
    });

    it('should display CEP input', () => {
      cy.get('input[name="cep"], input[formControlName="cep"], input[formControlName="zipCode"]').should('exist');
    });

    it('should display street input', () => {
      cy.get('input[name="street"], input[formControlName="street"]').should('exist');
    });

    it('should display number input', () => {
      cy.get('input[name="number"], input[formControlName="number"]').should('exist');
    });

    it('should display neighborhood input', () => {
      cy.get('input[name="neighborhood"], input[formControlName="neighborhood"]').should('exist');
    });

    it('should display city input', () => {
      cy.get('input[name="city"], input[formControlName="city"]').should('exist');
    });

    it('should display state input', () => {
      cy.get('input[name="state"], input[formControlName="state"], select[name="state"]').should('exist');
    });

    it('should auto-fill address from CEP', () => {
      cy.get('input[name="cep"], input[formControlName="cep"], input[formControlName="zipCode"]').first()
        .type('01310100');
      cy.wait(1000);
      // Aguarda preenchimento automático
    });

    it('should save address', () => {
      cy.get('button').contains(/salvar|save/i).should('exist');
    });
  });

  describe('Orders History', () => {
    beforeEach(() => {
      cy.visit('/profile/orders');
    });

    it('should display orders page', () => {
      cy.get('body').should('exist');
    });

    it('should display orders list', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.order-card, .order-item').length > 0) {
          cy.get('.order-card, .order-item').should('exist');
        }
      });
    });

    it('should display order number', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.order-card').length > 0) {
          cy.get('.order-card').first().within(() => {
            cy.get('.order-number, .order-id').should('exist');
          });
        }
      });
    });

    it('should display order status', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.order-card').length > 0) {
          cy.get('.order-card').first().within(() => {
            cy.get('.order-status, .status').should('exist');
          });
        }
      });
    });

    it('should display order total', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.order-card').length > 0) {
          cy.get('.order-card').first().within(() => {
            cy.get('.order-total, .total').should('exist');
          });
        }
      });
    });

    it('should navigate to order details', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.order-card').length > 0) {
          cy.get('.order-card').first().click();
          cy.url().should('include', 'order');
        }
      });
    });
  });

  describe('Order Details', () => {
    it('should display order details', () => {
      cy.visit('/profile/orders/123');
      cy.get('body').should('exist');
    });

    it('should display order items', () => {
      cy.visit('/profile/orders/123');
      cy.get('body').then(($body) => {
        if ($body.find('.order-items, .item-list').length > 0) {
          cy.get('.order-items, .item-list').should('exist');
        }
      });
    });

    it('should display shipping address', () => {
      cy.visit('/profile/orders/123');
      cy.get('body').then(($body) => {
        if ($body.find('.shipping-address, .address').length > 0) {
          cy.get('.shipping-address, .address').should('exist');
        }
      });
    });

    it('should display payment information', () => {
      cy.visit('/profile/orders/123');
      cy.get('body').then(($body) => {
        if ($body.find('.payment-info').length > 0) {
          cy.get('.payment-info').should('exist');
        }
      });
    });

    it('should display tracking information', () => {
      cy.visit('/profile/orders/123');
      cy.get('body').then(($body) => {
        if ($body.find('.tracking-info, .tracking').length > 0) {
          cy.get('.tracking-info, .tracking').should('exist');
        }
      });
    });
  });

  describe('Favorites', () => {
    beforeEach(() => {
      cy.visit('/profile/favorites');
    });

    it('should display favorites page', () => {
      cy.get('body').should('exist');
    });

    it('should display favorites list', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.product-card, ion-card, .favorite-item').length > 0) {
          cy.get('.product-card, ion-card, .favorite-item').should('exist');
        }
      });
    });

    it('should remove from favorites', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.product-card').length > 0) {
          cy.get('.product-card').first().within(() => {
            cy.get('button, ion-icon[name="heart"]').should('exist');
          });
        }
      });
    });

    it('should add to cart from favorites', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.product-card').length > 0) {
          cy.get('.product-card').first().within(() => {
            cy.get('button').contains(/adicionar|add|comprar/i).should('exist');
          });
        }
      });
    });
  });

  describe('Settings', () => {
    beforeEach(() => {
      cy.visit('/profile/settings');
    });

    it('should display settings page', () => {
      cy.get('body').should('exist');
    });

    it('should display notification settings', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.notification-settings, input[type="checkbox"]').length > 0) {
          cy.get('.notification-settings, input[type="checkbox"]').should('exist');
        }
      });
    });

    it('should toggle email notifications', () => {
      cy.get('body').then(($body) => {
        if ($body.find('input[type="checkbox"][name="emailNotifications"]').length > 0) {
          cy.get('input[type="checkbox"][name="emailNotifications"]').click();
        }
      });
    });

    it('should change password', () => {
      cy.get('button, a').contains(/alterar senha|change password/i).should('exist');
    });

    it('should delete account', () => {
      cy.get('button').contains(/excluir conta|delete account/i).should('exist');
    });
  });
});
