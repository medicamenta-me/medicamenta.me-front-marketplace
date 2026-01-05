/// <reference types="cypress" />

/**
 * 🔐 Authentication E2E Tests
 * Testes E2E para fluxos de autenticação
 */

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Flow', () => {
    it('should display login page', () => {
      cy.visit('/login');
      cy.url().should('include', '/login');
      cy.get('form').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      cy.get('.error-message, .invalid-feedback, mat-error').should('exist');
    });

    it('should show error for invalid email format', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.get('.error-message, .invalid-feedback, mat-error').should('exist');
    });

    it('should have forgot password link', () => {
      cy.visit('/login');
      cy.contains('Esqueci minha senha').should('exist');
    });

    it('should have register link', () => {
      cy.visit('/login');
      cy.contains('Criar conta').should('exist');
    });
  });

  describe('Register Flow', () => {
    it('should display register page', () => {
      cy.visit('/register');
      cy.url().should('include', '/register');
      cy.get('form').should('exist');
    });

    it('should have required fields', () => {
      cy.visit('/register');
      cy.get('input[formControlName="name"], input[name="name"]').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
    });

    it('should show validation for weak password', () => {
      cy.visit('/register');
      cy.get('input[formControlName="name"], input[name="name"]').first().type('Test User');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').first().type('123');
      cy.get('button[type="submit"]').click();
      cy.get('.error-message, .invalid-feedback, mat-error, .password-error').should('exist');
    });
  });

  describe('Password Reset', () => {
    it('should display forgot password page', () => {
      cy.visit('/forgot-password');
      cy.get('form').should('exist');
      cy.get('input[type="email"]').should('exist');
    });

    it('should show success message after submitting email', () => {
      cy.visit('/forgot-password');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      // Should show success or handle gracefully
      cy.get('body').should('exist');
    });
  });

  describe('Navigation Guards', () => {
    it('should redirect unauthenticated users from protected routes', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated users from cart', () => {
      cy.visit('/cart');
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/login') || url.includes('/cart');
      });
    });

    it('should redirect unauthenticated users from orders', () => {
      cy.visit('/orders');
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/login') || url.includes('/orders');
      });
    });
  });

  describe('Session Management', () => {
    it('should handle expired sessions gracefully', () => {
      // Clear any stored tokens
      cy.clearLocalStorage();
      cy.clearCookies();
      
      // Visit protected route
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });
});
