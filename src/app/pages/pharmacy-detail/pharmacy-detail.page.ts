/**
 * 🏪 Pharmacy Detail Page
 * Página de detalhes de uma farmácia
 * 
 * Features:
 * - Informações completas da farmácia
 * - Horários de funcionamento
 * - Produtos da farmácia
 * - Avaliações
 * - Mapa de localização
 * - Contato (telefone, WhatsApp, email)
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  PharmacyService, 
  DAY_OF_WEEK_LABELS 
} from '../../services/pharmacy.service';
import { 
  Pharmacy, 
  PharmacyStatus, 
  VerificationStatus,
  PaymentMethod,
  BusinessHours
} from '../../models/pharmacy.model';
import { Product } from '../../models/product.model';
import { Review } from '../../models/review.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

type TabType = 'info' | 'products' | 'reviews';

@Component({
  selector: 'app-pharmacy-detail',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RatingStarsComponent,
    ProductCardComponent
  ],
  template: `
    <div class="pharmacy-detail-container">
      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner />
          <p>Carregando farmácia...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <app-empty-state
          icon="❌"
          title="Erro ao carregar"
          [message]="error()!"
          actionText="Tentar novamente"
          (action)="loadPharmacy()"
        />
      }

      <!-- Pharmacy Content -->
      @if (!loading() && !error() && pharmacy()) {
        <!-- Header/Banner -->
        <header class="pharmacy-header">
          <div class="banner-container">
            @if (pharmacy()!.banner) {
              <img [src]="pharmacy()!.banner" [alt]="pharmacy()!.name" class="banner-image" />
            } @else {
              <div class="banner-placeholder">
                <span class="placeholder-icon">🏪</span>
              </div>
            }
            
            <!-- Back Button -->
            <button class="back-button" (click)="goBack()">
              <span>←</span>
            </button>

            <!-- Badges -->
            <div class="header-badges">
              @if (pharmacy()!.isFeatured) {
                <span class="badge featured">⭐ Destaque</span>
              }
              @if (pharmacy()!.verificationStatus === 'approved') {
                <span class="badge verified">✓ Verificada</span>
              }
            </div>
          </div>

          <!-- Pharmacy Info Overlay -->
          <div class="pharmacy-info-header">
            <div class="logo-container">
              @if (pharmacy()!.logo) {
                <img [src]="pharmacy()!.logo" [alt]="pharmacy()!.name" class="pharmacy-logo" />
              } @else {
                <div class="logo-placeholder">
                  <span>🏥</span>
                </div>
              }
            </div>

            <div class="pharmacy-main-info">
              <h1 class="pharmacy-name">{{ pharmacy()!.name }}</h1>
              
              <div class="pharmacy-rating">
                <app-rating-stars [rating]="pharmacy()!.rating" [count]="pharmacy()!.reviewCount" />
                <span class="rating-text">
                  {{ pharmacy()!.rating.toFixed(1) }} ({{ pharmacy()!.reviewCount }} avaliações)
                </span>
              </div>

              <div class="pharmacy-status">
                @if (isOpen()) {
                  <span class="status open">✓ Aberta agora</span>
                } @else {
                  <span class="status closed">✗ Fechada</span>
                  @if (nextOpenTime()) {
                    <span class="next-open">{{ nextOpenTime() }}</span>
                  }
                }
              </div>

              <p class="pharmacy-address">
                📍 {{ formatAddress() }}
              </p>
            </div>
          </div>
        </header>

        <!-- Quick Actions -->
        <section class="quick-actions">
          <button class="action-btn call" (click)="callPharmacy()">
            <span class="icon">📞</span>
            <span class="label">Ligar</span>
          </button>
          
          @if (pharmacy()!.contact.whatsapp) {
            <button class="action-btn whatsapp" (click)="openWhatsApp()">
              <span class="icon">💬</span>
              <span class="label">WhatsApp</span>
            </button>
          }
          
          <button class="action-btn directions" (click)="openDirections()">
            <span class="icon">🗺️</span>
            <span class="label">Como chegar</span>
          </button>
          
          <button class="action-btn share" (click)="sharePharmacy()">
            <span class="icon">📤</span>
            <span class="label">Compartilhar</span>
          </button>
        </section>

        <!-- Tabs -->
        <nav class="tabs-nav">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'info'"
            (click)="setActiveTab('info')"
          >
            ℹ️ Informações
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'products'"
            (click)="setActiveTab('products')"
          >
            💊 Produtos ({{ productsCount() }})
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'reviews'"
            (click)="setActiveTab('reviews')"
          >
            ⭐ Avaliações ({{ pharmacy()!.reviewCount }})
          </button>
        </nav>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Info Tab -->
          @if (activeTab() === 'info') {
            <div class="info-tab">
              <!-- Description -->
              @if (pharmacy()!.description) {
                <section class="info-section">
                  <h2>Sobre</h2>
                  <p>{{ pharmacy()!.description }}</p>
                </section>
              }

              <!-- Business Hours -->
              <section class="info-section">
                <h2>Horário de Funcionamento</h2>
                <div class="business-hours">
                  @for (hour of formattedBusinessHours(); track $index) {
                    <div class="hour-row" [class.today]="isToday($index)">
                      <span class="day">{{ hour.day }}</span>
                      <span class="time">{{ hour.time }}</span>
                    </div>
                  }
                </div>
              </section>

              <!-- Delivery Options -->
              <section class="info-section">
                <h2>Opções de Entrega</h2>
                <div class="delivery-options">
                  @if (pharmacy()!.deliveryOptions.hasDelivery) {
                    <div class="option">
                      <span class="option-icon">🚚</span>
                      <div class="option-info">
                        <span class="option-title">Delivery</span>
                        <span class="option-detail">
                          {{ pharmacy()!.deliveryOptions.estimatedTime }}
                          @if (pharmacy()!.deliveryOptions.deliveryFee === 0) {
                            - <strong class="free">Grátis</strong>
                          } @else if (pharmacy()!.deliveryOptions.deliveryFee) {
                            - {{ formatCurrency(pharmacy()!.deliveryOptions.deliveryFee!) }}
                          }
                        </span>
                        @if (pharmacy()!.deliveryOptions.freeDeliveryMinimum) {
                          <span class="free-minimum">
                            Grátis acima de {{ formatCurrency(pharmacy()!.deliveryOptions.freeDeliveryMinimum!) }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                  @if (pharmacy()!.deliveryOptions.hasPickup) {
                    <div class="option">
                      <span class="option-icon">🏪</span>
                      <div class="option-info">
                        <span class="option-title">Retirada na Loja</span>
                        <span class="option-detail">Disponível</span>
                      </div>
                    </div>
                  }
                </div>
              </section>

              <!-- Payment Methods -->
              <section class="info-section">
                <h2>Formas de Pagamento</h2>
                <div class="payment-methods">
                  @for (method of pharmacy()!.paymentMethods; track method) {
                    <div class="payment-method">
                      <span class="method-icon">{{ getPaymentMethodIcon(method) }}</span>
                      <span class="method-label">{{ getPaymentMethodLabel(method) }}</span>
                    </div>
                  }
                </div>
              </section>

              <!-- Pharmacist Info -->
              @if (pharmacy()!.responsiblePharmacist) {
                <section class="info-section">
                  <h2>Farmacêutico Responsável</h2>
                  <div class="pharmacist-info">
                    <p><strong>{{ pharmacy()!.responsiblePharmacist.name }}</strong></p>
                    <p>CRF: {{ pharmacy()!.responsiblePharmacist.crf }}</p>
                  </div>
                </section>
              }

              <!-- Legal Info -->
              <section class="info-section legal">
                <h2>Informações Legais</h2>
                <div class="legal-info">
                  <p><strong>Razão Social:</strong> {{ pharmacy()!.legalName }}</p>
                  <p><strong>CNPJ:</strong> {{ pharmacy()!.cnpj }}</p>
                  @if (pharmacy()!.anvisaLicense) {
                    <p><strong>AFE ANVISA:</strong> {{ pharmacy()!.anvisaLicense }}</p>
                  }
                  @if (pharmacy()!.crf) {
                    <p><strong>CRF:</strong> {{ pharmacy()!.crf }}</p>
                  }
                </div>
              </section>

              <!-- Contact Info -->
              <section class="info-section">
                <h2>Contato</h2>
                <div class="contact-info">
                  @if (pharmacy()!.contact.phone) {
                    <a [href]="'tel:' + pharmacy()!.contact.phone" class="contact-item">
                      <span class="contact-icon">📞</span>
                      <span>{{ pharmacy()!.contact.phone }}</span>
                    </a>
                  }
                  @if (pharmacy()!.contact.whatsapp) {
                    <a [href]="getWhatsAppLink()" target="_blank" class="contact-item">
                      <span class="contact-icon">💬</span>
                      <span>{{ pharmacy()!.contact.whatsapp }}</span>
                    </a>
                  }
                  @if (pharmacy()!.contact.email) {
                    <a [href]="'mailto:' + pharmacy()!.contact.email" class="contact-item">
                      <span class="contact-icon">✉️</span>
                      <span>{{ pharmacy()!.contact.email }}</span>
                    </a>
                  }
                  @if (pharmacy()!.contact.website) {
                    <a [href]="pharmacy()!.contact.website" target="_blank" class="contact-item">
                      <span class="contact-icon">🌐</span>
                      <span>{{ pharmacy()!.contact.website }}</span>
                    </a>
                  }
                </div>
              </section>
            </div>
          }

          <!-- Products Tab -->
          @if (activeTab() === 'products') {
            <div class="products-tab">
              @if (loadingProducts()) {
                <div class="loading-container">
                  <app-loading-spinner />
                  <p>Carregando produtos...</p>
                </div>
              } @else if (products().length === 0) {
                <app-empty-state
                  icon="💊"
                  title="Nenhum produto"
                  message="Esta farmácia ainda não cadastrou produtos"
                />
              } @else {
                <div class="products-grid">
                  @for (product of products(); track product.id) {
                    <app-product-card 
                      [product]="product"
                      (click)="viewProduct(product.id)"
                    />
                  }
                </div>
                
                @if (hasMoreProducts()) {
                  <div class="load-more">
                    <button 
                      class="load-more-btn" 
                      (click)="loadMoreProducts()"
                      [disabled]="loadingMoreProducts()"
                    >
                      @if (loadingMoreProducts()) {
                        Carregando...
                      } @else {
                        Carregar mais produtos
                      }
                    </button>
                  </div>
                }
              }
            </div>
          }

          <!-- Reviews Tab -->
          @if (activeTab() === 'reviews') {
            <div class="reviews-tab">
              <!-- Reviews Summary -->
              <div class="reviews-summary">
                <div class="rating-big">
                  <span class="rating-value">{{ pharmacy()!.rating.toFixed(1) }}</span>
                  <app-rating-stars [rating]="pharmacy()!.rating" [showCount]="false" />
                  <span class="rating-count">{{ pharmacy()!.reviewCount }} avaliações</span>
                </div>
              </div>

              @if (loadingReviews()) {
                <div class="loading-container">
                  <app-loading-spinner />
                  <p>Carregando avaliações...</p>
                </div>
              } @else if (reviews().length === 0) {
                <app-empty-state
                  icon="⭐"
                  title="Nenhuma avaliação"
                  message="Seja o primeiro a avaliar esta farmácia"
                  actionText="Avaliar"
                  (action)="writeReview()"
                />
              } @else {
                <div class="reviews-list">
                  @for (review of reviews(); track review.id) {
                    <article class="review-card">
                      <header class="review-header">
                        <div class="reviewer-info">
                          <span class="reviewer-avatar">👤</span>
                          <div class="reviewer-details">
                            <span class="reviewer-name">{{ review.userName || 'Anônimo' }}</span>
                            <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                          </div>
                        </div>
                        <app-rating-stars [rating]="review.rating" [showCount]="false" />
                      </header>
                      
                      @if (review.comment) {
                        <p class="review-comment">{{ review.comment }}</p>
                      }

                      @if (review.pharmacyResponse) {
                        <div class="pharmacy-response">
                          <span class="response-label">Resposta da farmácia:</span>
                          <p>{{ review.pharmacyResponse.comment }}</p>
                        </div>
                      }
                    </article>
                  }
                </div>

                @if (hasMoreReviews()) {
                  <div class="load-more">
                    <button 
                      class="load-more-btn" 
                      (click)="loadMoreReviews()"
                      [disabled]="loadingMoreReviews()"
                    >
                      @if (loadingMoreReviews()) {
                        Carregando...
                      } @else {
                        Carregar mais avaliações
                      }
                    </button>
                  </div>
                }
              }

              <!-- Write Review Button -->
              <div class="write-review-container">
                <button class="write-review-btn" (click)="writeReview()">
                  ✍️ Escrever Avaliação
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Not Found State -->
      @if (!loading() && !error() && !pharmacy()) {
        <app-empty-state
          icon="🔍"
          title="Farmácia não encontrada"
          message="A farmácia que você procura não existe ou foi removida"
          actionText="Voltar"
          (action)="goBack()"
        />
      }
    </div>
  `,
  styles: [`
    .pharmacy-detail-container {
      min-height: 100vh;
      background: #f5f5f5;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: #666;
    }

    /* Header */
    .pharmacy-header {
      position: relative;
      background: white;
      margin-bottom: 1rem;
    }

    .banner-container {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .banner-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .banner-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      .placeholder-icon {
        font-size: 4rem;
        opacity: 0.5;
      }
    }

    .back-button {
      position: absolute;
      top: 1rem;
      left: 1rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.05);
      }
    }

    .header-badges {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.5rem;

      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;

        &.featured {
          background: #ffc107;
          color: #333;
        }

        &.verified {
          background: #4caf50;
          color: white;
        }
      }
    }

    .pharmacy-info-header {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      margin-top: -3rem;
      position: relative;
    }

    .logo-container {
      flex-shrink: 0;
    }

    .pharmacy-logo {
      width: 80px;
      height: 80px;
      border-radius: 1rem;
      object-fit: cover;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .pharmacy-main-info {
      flex: 1;
      min-width: 0;
    }

    .pharmacy-name {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: #333;
    }

    .pharmacy-rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      .rating-text {
        font-size: 0.875rem;
        color: #666;
      }
    }

    .pharmacy-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      .status {
        font-size: 0.875rem;
        font-weight: 600;

        &.open {
          color: #4caf50;
        }

        &.closed {
          color: #f44336;
        }
      }

      .next-open {
        font-size: 0.75rem;
        color: #666;
      }
    }

    .pharmacy-address {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0 1rem;
      margin-bottom: 1rem;
      overflow-x: auto;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 0.75rem;
      background: white;
      cursor: pointer;
      min-width: 70px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .icon {
        font-size: 1.5rem;
      }

      .label {
        font-size: 0.75rem;
        color: #666;
      }

      &.whatsapp {
        background: #25d366;
        
        .icon, .label {
          color: white;
        }
      }
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      overflow-x: auto;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .tab-btn {
      flex: 1;
      min-width: fit-content;
      padding: 1rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      color: #666;
      cursor: pointer;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;

      &:hover {
        color: #333;
        background: #f5f5f5;
      }

      &.active {
        color: #667eea;
        border-bottom-color: #667eea;
        font-weight: 600;
      }
    }

    /* Tab Content */
    .tab-content {
      padding: 1rem;
    }

    /* Info Tab */
    .info-tab {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      h2 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem;
        color: #333;
      }

      p {
        margin: 0;
        color: #666;
        line-height: 1.5;
      }

      &.legal {
        background: #f9f9f9;
      }
    }

    .business-hours {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .hour-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      border-radius: 0.5rem;

      &.today {
        background: #e8f5e9;
        font-weight: 600;
      }

      .day {
        color: #333;
      }

      .time {
        color: #666;
      }
    }

    .delivery-options,
    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .option {
      display: flex;
      gap: 1rem;
      align-items: flex-start;

      .option-icon {
        font-size: 1.5rem;
      }

      .option-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .option-title {
        font-weight: 600;
        color: #333;
      }

      .option-detail {
        font-size: 0.875rem;
        color: #666;

        .free {
          color: #4caf50;
        }
      }

      .free-minimum {
        font-size: 0.75rem;
        color: #4caf50;
      }
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .method-icon {
        font-size: 1.25rem;
      }

      .method-label {
        color: #333;
      }
    }

    .pharmacist-info,
    .legal-info {
      p {
        margin: 0 0 0.5rem;
        font-size: 0.875rem;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;

      &:hover {
        text-decoration: underline;
      }

      .contact-icon {
        font-size: 1.25rem;
      }
    }

    /* Products Tab */
    .products-tab {
      min-height: 300px;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
    }

    /* Reviews Tab */
    .reviews-tab {
      min-height: 300px;
    }

    .reviews-summary {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
      text-align: center;
    }

    .rating-big {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .rating-value {
        font-size: 3rem;
        font-weight: 700;
        color: #333;
      }

      .rating-count {
        font-size: 0.875rem;
        color: #666;
      }
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .reviewer-info {
      display: flex;
      gap: 0.75rem;
    }

    .reviewer-avatar {
      font-size: 1.5rem;
    }

    .reviewer-details {
      display: flex;
      flex-direction: column;
    }

    .reviewer-name {
      font-weight: 600;
      color: #333;
    }

    .review-date {
      font-size: 0.75rem;
      color: #999;
    }

    .review-comment {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }

    .pharmacy-response {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 0.5rem;
      border-left: 3px solid #667eea;

      .response-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #667eea;
        display: block;
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: #666;
      }
    }

    .write-review-container {
      margin-top: 1.5rem;
      text-align: center;
    }

    .write-review-btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }

    /* Load More */
    .load-more {
      margin-top: 1.5rem;
      text-align: center;
    }

    .load-more-btn {
      padding: 0.75rem 2rem;
      border: 2px solid #667eea;
      border-radius: 2rem;
      background: white;
      color: #667eea;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #667eea;
        color: white;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    /* Responsive */
    @media (max-width: 600px) {
      .pharmacy-info-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .pharmacy-rating {
        justify-content: center;
      }

      .pharmacy-status {
        justify-content: center;
      }

      .quick-actions {
        justify-content: center;
      }

      .tabs-nav {
        justify-content: space-around;
      }

      .tab-btn {
        flex: none;
        padding: 0.75rem;
        font-size: 0.75rem;
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class PharmacyDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pharmacyService = inject(PharmacyService);

  // State
  readonly loading = this.pharmacyService.loading;
  readonly error = this.pharmacyService.error;
  readonly pharmacy = signal<Pharmacy | null>(null);
  readonly activeTab = signal<TabType>('info');
  
  // Products state
  readonly products = signal<Product[]>([]);
  readonly loadingProducts = signal(false);
  readonly loadingMoreProducts = signal(false);
  readonly hasMoreProducts = signal(false);
  readonly productsCount = signal(0);
  
  // Reviews state
  readonly reviews = signal<Review[]>([]);
  readonly loadingReviews = signal(false);
  readonly loadingMoreReviews = signal(false);
  readonly hasMoreReviews = signal(false);

  // Computed
  readonly isOpen = computed(() => {
    const p = this.pharmacy();
    return p ? this.pharmacyService.isOpenNow(p) : false;
  });

  readonly nextOpenTime = computed(() => {
    const p = this.pharmacy();
    if (!p || this.isOpen()) return '';
    return this.pharmacyService.getNextOpenTime(p);
  });

  readonly formattedBusinessHours = computed(() => {
    const p = this.pharmacy();
    if (!p?.businessHours) return [];

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    return days.map((day, index) => {
      const hours = p.businessHours.find(h => h.dayOfWeek === index);
      if (!hours || hours.isClosed) {
        return { day, time: 'Fechado' };
      }
      return { day, time: `${hours.openTime} - ${hours.closeTime}` };
    });
  });

  ngOnInit(): void {
    const pharmacyId = this.route.snapshot.paramMap.get('id');
    if (pharmacyId) {
      this.loadPharmacy(pharmacyId);
    }
  }

  loadPharmacy(pharmacyId?: string): void {
    const id = pharmacyId || this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.pharmacyService.getPharmacyById(id).subscribe({
      next: (pharmacy) => {
        this.pharmacy.set(pharmacy);
        if (pharmacy) {
          this.loadProducts();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar farmácia:', err);
      }
    });
  }

  loadProducts(): void {
    const pharmacyId = this.pharmacy()?.id;
    if (!pharmacyId) return;

    this.loadingProducts.set(true);
    this.pharmacyService.getPharmacyProducts(pharmacyId).subscribe({
      next: (products) => {
        this.products.set(products);
        this.productsCount.set(products.length);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
      }
    });
  }

  loadReviews(): void {
    const pharmacyId = this.pharmacy()?.id;
    if (!pharmacyId) return;

    this.loadingReviews.set(true);
    this.pharmacyService.getPharmacyReviews(pharmacyId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loadingReviews.set(false);
      },
      error: () => {
        this.loadingReviews.set(false);
      }
    });
  }

  loadMoreProducts(): void {
    // Implementar paginação de produtos
    this.loadingMoreProducts.set(true);
    setTimeout(() => {
      this.loadingMoreProducts.set(false);
      this.hasMoreProducts.set(false);
    }, 1000);
  }

  loadMoreReviews(): void {
    // Implementar paginação de reviews
    this.loadingMoreReviews.set(true);
    setTimeout(() => {
      this.loadingMoreReviews.set(false);
      this.hasMoreReviews.set(false);
    }, 1000);
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    
    if (tab === 'reviews' && this.reviews().length === 0) {
      this.loadReviews();
    }
  }

  formatAddress(): string {
    const p = this.pharmacy();
    if (!p?.address) return '';
    
    const { street, number, complement, neighborhood, city, state } = p.address;
    let addr = `${street}, ${number}`;
    if (complement) addr += ` - ${complement}`;
    addr += ` - ${neighborhood}, ${city} - ${state}`;
    return addr;
  }

  formatCurrency(value: number): string {
    return this.pharmacyService.formatCurrency(value);
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  isToday(dayIndex: number): boolean {
    return new Date().getDay() === dayIndex;
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
      [PaymentMethod.CREDIT_CARD]: '💳',
      [PaymentMethod.DEBIT_CARD]: '💳',
      [PaymentMethod.PIX]: '📱',
      [PaymentMethod.BOLETO]: '📄',
      [PaymentMethod.CASH]: '💵',
      [PaymentMethod.INSURANCE]: '🏥'
    };
    return icons[method] || '💰';
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    return this.pharmacyService.getPaymentMethodLabel(method);
  }

  getWhatsAppLink(): string {
    const phone = this.pharmacy()?.contact.whatsapp;
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  }

  goBack(): void {
    this.router.navigate(['/pharmacies']);
  }

  callPharmacy(): void {
    const phone = this.pharmacy()?.contact.phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  openWhatsApp(): void {
    const link = this.getWhatsAppLink();
    if (link) {
      window.open(link, '_blank');
    }
  }

  openDirections(): void {
    const p = this.pharmacy();
    if (p?.address?.latitude && p?.address?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${p.address.latitude},${p.address.longitude}`;
      window.open(url, '_blank');
    } else if (p?.address) {
      const addr = encodeURIComponent(this.formatAddress());
      const url = `https://www.google.com/maps/search/?api=1&query=${addr}`;
      window.open(url, '_blank');
    }
  }

  sharePharmacy(): void {
    const p = this.pharmacy();
    if (!p) return;

    const shareData = {
      title: p.name,
      text: `Confira a farmácia ${p.name}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copiado!');
      });
    }
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  writeReview(): void {
    const pharmacyId = this.pharmacy()?.id;
    if (pharmacyId) {
      this.router.navigate(['/pharmacies', pharmacyId, 'review']);
    }
  }
}
