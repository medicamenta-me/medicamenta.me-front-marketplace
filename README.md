# 🏪 Medicamenta.me - Marketplace

**Versão:** 3.0  
**Última Atualização:** 05 de janeiro de 2026  
**Status:** ✅ Produção  
**URL:** https://marketplace.medicamenta.me

---

## 📋 Visão Geral

E-commerce web para compra de medicamentos e produtos de saúde. Permite que usuários comprem de farmácias cadastradas, com checkout completo, múltiplas formas de pagamento, e acompanhamento de pedidos em tempo real.

---

## 📊 Métricas do Projeto

| Métrica | Valor | Status |
|---------|-------|--------|
| **Testes Unitários** | 3.967 | ✅ 100% passing |
| **Cobertura** | ~90% | ✅ |
| **LOC** | ~31.000 | ✅ |
| **Build Size** | ~700kB | ✅ |
| **Build Errors** | 0 | ✅ |
| **Lint Errors** | 0 | ✅ |
| **Vulnerabilidades** | 3* | ✅ (Cypress dev) |

---

## 🛠️ Stack Tecnológica

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Angular** | 20.x | Framework |
| **TypeScript** | 5.8 | Linguagem |
| **SCSS** | - | Estilos |
| **RxJS** | 7.x | Reactive Programming |
| **Angular Signals** | - | State Management |
| **Firebase** | 11.x | Backend Services |

### Bibliotecas Principais

| Biblioteca | Propósito |
|------------|-----------|
| `@angular/fire` | Firebase SDK |
| `chart.js` | Gráficos (lazy loaded) |
| `ngx-pagination` | Paginação |
| `ngx-mask` | Máscaras de input |

---

## 🏗️ Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MARKETPLACE (Angular 20)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         PRESENTATION LAYER                        │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                      PAGES (Lazy Loaded)                     │  │   │
│  │  │  Home │ Catalog │ Product │ Cart │ Checkout │ Orders        │  │   │
│  │  │  Pharmacy │ PharmacyDashboard │ ProductManagement           │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                   SHARED COMPONENTS                          │  │   │
│  │  │  Header │ Footer │ ProductCard │ CartIcon │ RatingStars     │  │   │
│  │  │  ProductFilters │ LoadingSpinner │ EmptyState │ Pagination  │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                          SERVICE LAYER                            │   │
│  │                                                                    │   │
│  │  ┌───────────────────┐  ┌───────────────────────────────────────┐ │   │
│  │  │   Core Services   │  │        Feature Services               │ │   │
│  │  │  - AuthService    │  │  - ProductService (API v2)            │ │   │
│  │  │  - IntegrationSvc │  │  - PharmacyService (API v2)           │ │   │
│  │  │  - CacheService   │  │  - CartService (local + sync)         │ │   │
│  │  │                   │  │  - CheckoutService (API v2)           │ │   │
│  │  │                   │  │  - OrderRealtimeService (onSnapshot)  │ │   │
│  │  └───────────────────┘  └───────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      INTERCEPTORS & GUARDS                        │   │
│  │  AuthInterceptor │ ErrorInterceptor │ LoadingInterceptor         │   │
│  │  AuthGuard │ PharmacyGuard │ CheckoutGuard                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API v2                                 │
│                                                                          │
│  /v2/products │ /v2/pharmacies │ /v2/orders │ /v2/financial            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              FIREBASE                                    │
│  Firestore (Real-time listeners) │ Auth │ Storage │ Hosting            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Estrutura de Diretórios

```
src/
├── app/
│   ├── app.component.ts
│   ├── app.routes.ts              # Standalone routes (lazy loaded)
│   │
│   ├── components/                # Componentes compartilhados
│   │   ├── header/               # Navbar com busca e carrinho
│   │   ├── footer/               # Rodapé
│   │   ├── product-card/         # Card de produto
│   │   ├── cart-icon/            # Ícone carrinho com badge
│   │   ├── product-filters/      # Filtros de busca
│   │   ├── rating-stars/         # Estrelas de avaliação
│   │   ├── loading-spinner/
│   │   ├── empty-state/
│   │   └── pagination/
│   │
│   ├── pages/                     # Páginas (lazy loaded)
│   │   ├── home/                 # Landing page
│   │   ├── catalog/              # Catálogo de produtos
│   │   ├── product-detail/       # Detalhes do produto
│   │   ├── cart/                 # Carrinho de compras
│   │   ├── checkout/             # Checkout (4 etapas)
│   │   │   ├── address-step/
│   │   │   ├── payment-step/
│   │   │   ├── review-step/
│   │   │   └── confirmation-step/
│   │   ├── order-confirmation/   # Confirmação do pedido
│   │   ├── order-detail/         # Detalhes do pedido
│   │   ├── order-history/        # Histórico de pedidos
│   │   ├── pharmacy-list/        # Lista de farmácias
│   │   ├── pharmacy-detail/      # Perfil da farmácia
│   │   ├── pharmacy-dashboard/   # Dashboard (farmácia logada)
│   │   ├── product-management/   # Gestão de produtos (farmácia)
│   │   ├── review-form/          # Formulário de avaliação
│   │   └── review-list/          # Lista de avaliações
│   │
│   ├── services/                  # Services
│   │   ├── auth.service.ts       # Autenticação
│   │   ├── integration.service.ts # API v2 client
│   │   ├── product.service.ts    # Produtos (API v2)
│   │   ├── pharmacy.service.ts   # Farmácias (API v2)
│   │   ├── cart.service.ts       # Carrinho (local + sync)
│   │   ├── checkout.service.ts   # Checkout (API v2)
│   │   ├── order.service.ts      # Pedidos
│   │   ├── order-realtime.service.ts # Real-time status
│   │   ├── review.service.ts     # Avaliações
│   │   ├── cache.service.ts      # Cache local (IndexedDB)
│   │   └── notification.service.ts
│   │
│   ├── models/                    # Interfaces TypeScript
│   │   ├── product.model.ts
│   │   ├── pharmacy.model.ts
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   └── review.model.ts
│   │
│   ├── guards/                    # Route guards
│   │   ├── auth.guard.ts
│   │   ├── pharmacy.guard.ts
│   │   └── checkout.guard.ts
│   │
│   ├── interceptors/              # HTTP interceptors
│   │   ├── auth.interceptor.ts   # JWT token
│   │   ├── error.interceptor.ts  # Error handling
│   │   └── loading.interceptor.ts
│   │
│   └── directives/
│       └── lazy-load-image/      # Lazy loading de imagens
│
├── assets/
│   ├── images/
│   └── icons/
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── cypress/                       # Testes E2E
    └── e2e/
        ├── product-catalog.cy.ts
        └── order-realtime.cy.ts
```

---

## 🎯 Funcionalidades

### 🛍️ Catálogo de Produtos

- **Busca avançada** com filtros (categoria, preço, farmácia)
- **Faceted search** com contagem
- **Lazy loading** de imagens
- **Paginação** com cursor
- **Cache** inteligente (IndexedDB)

### 🛒 Carrinho de Compras

- **Persistência local** (localStorage + IndexedDB)
- **Sincronização** com backend quando logado
- **Cálculo automático** de frete
- **Validação de estoque** em tempo real

### 💳 Checkout (4 Etapas)

1. **Endereço** - Seleção/cadastro de endereço
2. **Pagamento** - Cartão, PIX, Boleto
3. **Revisão** - Confirmação do pedido
4. **Confirmação** - Pedido criado

### 📦 Acompanhamento de Pedidos

- **Real-time updates** via Firestore `onSnapshot`
- **Status tracking** (pending → processing → shipped → delivered)
- **Notificações** de mudança de status
- **Histórico** completo de pedidos

### 🏥 Perfil de Farmácias

- **Página pública** com produtos, avaliações
- **Dashboard** para farmácia gerenciar produtos
- **Gestão de pedidos** recebidos
- **Métricas** de vendas

### ⭐ Sistema de Avaliações

- **Avaliação de produtos** (1-5 estrelas)
- **Avaliação de farmácias** (1-5 estrelas)
- **Comentários** com moderação
- **Média** calculada automaticamente

---

## 🚀 Comandos

### Instalação

```bash
# Instalar dependências
npm install
```

### Desenvolvimento

```bash
# Servidor de desenvolvimento
ng serve
# ou
npm start

# Build de desenvolvimento
ng build

# Build de produção
ng build --configuration=production

# Testes unitários
npm test

# Testes com coverage
npm test -- --code-coverage

# Testes E2E
npm run cypress:open
```

### Deploy

```bash
# Build e deploy para Firebase Hosting
ng build --configuration=production
firebase deploy --only hosting:marketplace
```

---

## 🔄 Fluxo de Dados

### Checkout Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Carrinho │───▶│ Endereço │───▶│ Pagamento│───▶│ Revisão  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │ POST /orders │
                                              │   (API v2)   │
                                              └──────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │  Confirmação │
                                              │   + Pedido   │
                                              └──────────────┘
```

### Real-Time Order Status

```
┌──────────────────────────────────────────────────────────────────────┐
│                      OrderRealtimeService                            │
│                                                                      │
│  onSnapshot('orders/{orderId}')                                     │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   pending   │───▶│ processing  │───▶│   shipped   │───▶ ...     │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│       │                   │                   │                     │
│       └───────────────────┴───────────────────┘                     │
│                           │                                          │
│                     UI Update (Signal)                              │
│                           │                                          │
│                     Notification                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  firebase: {
    apiKey: "...",
    authDomain: "medicamenta-me.firebaseapp.com",
    projectId: "medicamenta-me",
    storageBucket: "medicamenta-me.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  },
  apiBaseUrl: "https://us-central1-medicamenta-me.cloudfunctions.net/api",
  stripe: {
    publishableKey: "pk_live_..."
  }
};
```

---

## 🧪 Testes

### Estrutura de Testes

```
src/app/
├── services/
│   ├── product.service.spec.ts      # 80+ testes
│   ├── pharmacy.service.spec.ts     # 70+ testes
│   ├── checkout.service.spec.ts     # 60+ testes
│   ├── order-realtime.service.spec.ts # 50+ testes
│   └── ...
├── components/
│   ├── product-card.component.spec.ts
│   ├── cart-icon.component.spec.ts
│   └── ...
└── pages/
    ├── checkout/checkout.page.spec.ts
    └── ...

cypress/
└── e2e/
    ├── product-catalog.cy.ts        # 226 testes
    └── order-realtime.cy.ts         # 12 testes
```

### Coverage

```bash
# Rodar com coverage
npm test -- --code-coverage --no-watch

# Abrir relatório
open coverage/index.html
```

---

## 📊 Services Principais

| Service | Responsabilidade | API |
|---------|------------------|-----|
| `ProductService` | CRUD produtos, busca, filtros | API v2 |
| `PharmacyService` | Farmácias, nearby, dashboard | API v2 |
| `CartService` | Carrinho local + sync | Local + API |
| `CheckoutService` | Processo de checkout | API v2 |
| `OrderRealtimeService` | Status em tempo real | Firestore |
| `IntegrationService` | Cliente HTTP centralizado | API v2 |

---

## 🔗 Links

- **Produção:** https://marketplace.medicamenta.me
- **Firebase Hosting:** Firebase Console
- **API Docs:** https://us-central1-medicamenta-me.cloudfunctions.net/api/api-docs/

---

*Última atualização: 05/01/2026*
