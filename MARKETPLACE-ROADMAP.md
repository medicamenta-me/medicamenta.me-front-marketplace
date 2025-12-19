# 🛒 ROADMAP DETALHADO - MARKETPLACE (E-COMMERCE)

**Repositório:** `medicamenta.me-front-marketplace`  
**Stack:** Angular 20 + TypeScript 5.8  
**Plataforma:** Web (Desktop + Mobile Responsive)  
**Data:** 16 de dezembro de 2025  
**Versão:** 1.0  
**Status:** 📋 Plano de Implementação Completa

---

## 📊 ANÁLISE DO ESTADO ATUAL

### Status Atual (Atualizado: 19/12/2025)

| Métrica | Valor | Status |
|---------|-------|--------|
| Implementação | ~25% | 🟡 Fase 1 em progresso |
| Linhas de Código | ~1.750 | 🟢 Modelos completos |
| Features Implementadas | 0 | 🟡 Modelos + Config |
| Testes | 0 | 🔴 Pendente |
| Build | ✅ OK | ✅ Compilando |

### Progresso por Fase

| Fase | Status | Progresso | ETA |
|------|--------|-----------|-----|
| Fase 1: Arquitetura e Base | 🟡 Em Progresso | 60% (14h/24h) | 20/12/2025 |
| Fase 2: Catálogo de Produtos | 🔴 Pendente | 0% | 27/12/2025 |
| Fase 3: Carrinho e Checkout | 🔴 Pendente | 0% | 10/01/2026 |
| Fase 4: Gestão de Pedidos | 🔴 Pendente | 0% | 25/01/2026 |
| Fase 5: Sistema de Avaliações | 🔴 Pendente | 0% | 05/02/2026 |
| Fase 6: Painel de Farmácias | 🔴 Pendente | 0% | 01/03/2026 |

**Ver**: PHASE-1-ARCHITECTURE-REPORT.md para detalhes

### Estrutura Atual

```
medicamenta.me-front-marketplace/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Componente raiz
│   │   ├── app.routes.ts             # Rotas (vazias)
│   │   ├── components/               # (vazio)
│   │   ├── pages/                    # (vazio)
│   │   ├── services/                 # (vazio)
│   │   └── models/                   # (vazio)
│   ├── assets/                       # (vazio)
│   ├── styles/                       # Estilos base
│   └── index.html
├── package.json
├── angular.json
├── tsconfig.json
└── README.md

Total: ~1.000 linhas (apenas estrutura Angular padrão)
```

---

## 🎯 OBJETIVOS DO ROADMAP

### Objetivo Principal
**Implementar marketplace completo de medicamentos conectando pacientes e farmácias.**

### Objetivos Específicos

1. **Catálogo de Produtos** (80h)
   - Busca e filtros avançados
   - 1000+ produtos cadastrados
   - 10+ categorias

2. **E-commerce Completo** (120h)
   - Carrinho de compras
   - Checkout integrado
   - Pagamentos (Stripe + PagSeguro)
   - Rastreamento de pedidos

3. **Painel de Farmácias** (100h)
   - Dashboard com métricas
   - Gestão de produtos
   - Gestão de pedidos
   - Relatórios financeiros

4. **Sistema de Avaliações** (40h)
   - Reviews de produtos
   - Reviews de farmácias
   - Sistema de ratings (1-5 estrelas)

5. **Testes 100%** (104h)
   - Unitários
   - E2E (Cypress)
   - Cobertura completa

---

## 📋 INVENTÁRIO DE FUNCIONALIDADES A IMPLEMENTAR

### FASE 1: ARQUITETURA E BASE (24h)

#### 1.1 Arquitetura e Modelagem de Dados (12h)

**Modelos de Dados:**

```typescript
// src/app/models/product.model.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  manufacturer: string;
  activeIngredient: string;
  dosage: string;
  quantity: number;
  packageType: 'box' | 'bottle' | 'blister' | 'tube';
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  pharmacyId: string;
  requiresPrescription: boolean;
  sku: string;
  ean: string;
  anvisaCode?: string;
  ratings: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductCategory {
  ANALGESICS = 'analgesics',
  ANTIBIOTICS = 'antibiotics',
  ANTIHYPERTENSIVES = 'antihypertensives',
  ANTIDIABETICS = 'antidiabetics',
  VITAMINS = 'vitamins',
  DERMATOLOGICS = 'dermatologics',
  GASTROINTESTINAL = 'gastrointestinal',
  CARDIOVASCULAR = 'cardiovascular',
  RESPIRATORY = 'respiratory',
  NEUROLOGIC = 'neurologic',
  GENERIC = 'generic',
  COSMETICS = 'cosmetics',
  SUPPLEMENTS = 'supplements',
  MEDICAL_DEVICES = 'medical_devices'
}

// src/app/models/pharmacy.model.ts
export interface Pharmacy {
  id: string;
  name: string;
  cnpj: string;
  ownerName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  workingHours: {
    monday: TimeRange;
    tuesday: TimeRange;
    wednesday: TimeRange;
    thursday: TimeRange;
    friday: TimeRange;
    saturday: TimeRange;
    sunday: TimeRange;
  };
  deliveryOptions: {
    homeDelivery: boolean;
    storePickup: boolean;
    expressDelivery: boolean;
  };
  deliveryFee: number;
  freeDeliveryMinimum?: number;
  ratings: {
    average: number;
    count: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  verified: boolean;
  licenses: {
    anvisaLicense: string;
    municipalLicense: string;
  };
  createdAt: Date;
}

// src/app/models/order.model.ts
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  pharmacyId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'boleto';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryMethod: 'home_delivery' | 'store_pickup' | 'express';
  deliveryAddress: Address;
  status: OrderStatus;
  prescriptionRequired: boolean;
  prescriptionUrl?: string;
  tracking?: {
    code: string;
    url: string;
    courier: string;
  };
  estimatedDelivery: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PRESCRIPTION_PENDING = 'prescription_pending',
  PRESCRIPTION_APPROVED = 'prescription_approved',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELED = 'canceled'
}

// src/app/models/cart.model.ts
export interface Cart {
  id: string;
  userId: string;
  pharmacyId: string;
  items: CartItem[];
  subtotal: number;
  expiresAt: Date;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

// src/app/models/review.model.ts
export interface Review {
  id: string;
  userId: string;
  userName: string;
  targetType: 'product' | 'pharmacy';
  targetId: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  helpful: number;
  reported: boolean;
  createdAt: Date;
}
```

**Esquema Firestore:**
```
/products/{productId}
/pharmacies/{pharmacyId}
/orders/{orderId}
/carts/{userId}
/reviews/{reviewId}
/categories/{categoryId}
```

---

#### 1.2 Estrutura de Pastas e Arquitetura (6h)

```
src/app/
├── core/                           # Módulo core
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── pharmacy.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── loading.interceptor.ts
│   └── services/
│       ├── auth.service.ts
│       └── error-handler.service.ts
├── shared/                         # Componentes compartilhados
│   ├── components/
│   │   ├── header/
│   │   ├── footer/
│   │   ├── product-card/
│   │   ├── cart-icon/
│   │   ├── rating-stars/
│   │   ├── loading-spinner/
│   │   └── empty-state/
│   ├── pipes/
│   │   ├── currency.pipe.ts
│   │   └── distance.pipe.ts
│   └── directives/
│       └── lazy-load-image.directive.ts
├── features/                       # Features modulares
│   ├── catalog/
│   │   ├── pages/
│   │   │   ├── product-list/
│   │   │   ├── product-detail/
│   │   │   └── category-list/
│   │   ├── components/
│   │   │   ├── product-filters/
│   │   │   ├── product-search/
│   │   │   └── product-grid/
│   │   └── services/
│   │       └── product.service.ts
│   ├── cart/
│   │   ├── pages/
│   │   │   ├── cart-view/
│   │   │   └── checkout/
│   │   ├── components/
│   │   │   ├── cart-item/
│   │   │   ├── cart-summary/
│   │   │   └── checkout-form/
│   │   └── services/
│   │       └── cart.service.ts
│   ├── orders/
│   │   ├── pages/
│   │   │   ├── order-list/
│   │   │   └── order-detail/
│   │   ├── components/
│   │   │   ├── order-card/
│   │   │   └── order-tracking/
│   │   └── services/
│   │       └── order.service.ts
│   ├── pharmacy/
│   │   ├── pages/
│   │   │   ├── pharmacy-list/
│   │   │   ├── pharmacy-detail/
│   │   │   └── pharmacy-dashboard/
│   │   ├── components/
│   │   │   ├── pharmacy-card/
│   │   │   ├── pharmacy-map/
│   │   │   └── dashboard-widgets/
│   │   └── services/
│   │       └── pharmacy.service.ts
│   ├── reviews/
│   │   ├── components/
│   │   │   ├── review-list/
│   │   │   ├── review-form/
│   │   │   └── rating-summary/
│   │   └── services/
│   │       └── review.service.ts
│   └── auth/
│       ├── pages/
│       │   ├── login/
│       │   ├── signup/
│       │   └── forgot-password/
│       └── services/
│           └── auth.service.ts
└── pharmacy-dashboard/             # Dashboard exclusivo para farmácias
    ├── pages/
    │   ├── overview/
    │   ├── products/
    │   ├── orders/
    │   ├── analytics/
    │   └── settings/
    └── services/
        └── dashboard.service.ts
```

---

#### 1.3 Configuração de Ambiente e Firebase (6h)

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "...",
    authDomain: "medicamenta-marketplace.firebaseapp.com",
    projectId: "medicamenta-marketplace",
    storageBucket: "medicamenta-marketplace.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  },
  stripe: {
    publishableKey: "pk_test_..."
  },
  pagseguro: {
    sessionUrl: "https://sandbox.pagseguro.uol.com.br/..."
  },
  api: {
    baseUrl: "https://api.medicamenta.me"
  },
  googleMaps: {
    apiKey: "..."
  }
};
```

---

### FASE 2: CATÁLOGO DE PRODUTOS (60h)

#### 2.1 ProductService (10h)

```typescript
// src/app/features/catalog/services/product.service.ts
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  
  async getProducts(filters: ProductFilters): Promise<Product[]> {
    // Busca com filtros
  }
  
  async getProduct(id: string): Promise<Product> {
    // Obter produto específico
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    // Busca textual (Algolia ou similar)
  }
  
  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    // Filtrar por categoria
  }
  
  async getProductsByPharmacy(pharmacyId: string): Promise<Product[]> {
    // Produtos de uma farmácia
  }
  
  async uploadProductImage(file: File): Promise<string> {
    // Upload de imagem para Storage
  }
}
```

**Cenários de Teste (25):**

**Positivos (15):**
1. ✅ Deve listar produtos com paginação
2. ✅ Deve filtrar por categoria
3. ✅ Deve filtrar por faixa de preço
4. ✅ Deve filtrar por farmácia
5. ✅ Deve ordenar por preço (menor/maior)
6. ✅ Deve ordenar por rating
7. ✅ Deve buscar por nome
8. ✅ Deve buscar por princípio ativo
9. ✅ Deve obter detalhes do produto
10. ✅ Deve listar produtos relacionados
11. ✅ Deve filtrar produtos com desconto
12. ✅ Deve filtrar produtos em estoque
13. ✅ Deve upload de imagem
14. ✅ Deve cachear resultados
15. ✅ Deve retornar produtos similares

**Negativos (5):**
16. ❌ Deve retornar erro se produto não existe
17. ❌ Deve retornar erro se categoria inválida
18. ❌ Deve retornar erro se imagem muito grande
19. ❌ Deve retornar array vazio se sem resultados
20. ❌ Deve retornar erro se Firestore offline

**Edge Cases (5):**
21. ⚠️ Deve lidar com busca com caracteres especiais
22. ⚠️ Deve lidar com múltiplos filtros simultâneos
23. ⚠️ Deve lidar com produtos sem imagem
24. ⚠️ Deve lidar com produtos fora de estoque
25. ⚠️ Deve lidar com preços muito altos/baixos

**Tempo:** 10h

---

#### 2.2 Páginas de Catálogo (30h)

**ProductListPage (15h):**
- Grid responsivo de produtos (3 cols desktop, 2 mobile)
- Filtros laterais (categoria, preço, farmácia, rating)
- Busca com autocomplete
- Paginação ou scroll infinito
- Ordenação (relevância, preço, rating, novidades)

**ProductDetailPage (10h):**
- Galeria de imagens (zoom)
- Informações detalhadas
- Bula/instruções
- Botão "Adicionar ao Carrinho"
- Produtos relacionados
- Reviews

**CategoryListPage (5h):**
- Grid de categorias
- Ícones customizados
- Contagem de produtos

---

#### 2.3 Componentes de Catálogo (20h)

**ProductCard (6h):**
- Imagem
- Nome e dosagem
- Preço (com/sem desconto)
- Rating
- Badge "Receita obrigatória"
- Botão quick add

**ProductFilters (8h):**
- Filtro por categoria (checkboxes)
- Range de preço (slider)
- Filtro por farmácia
- Filtro por rating
- Limpar filtros

**ProductSearch (6h):**
- Input com autocomplete
- Sugestões de busca
- Histórico de buscas
- Busca por voz (opcional)

---

### FASE 3: CARRINHO E CHECKOUT (48h)

#### 3.1 CartService (10h)

```typescript
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly cart = signal<Cart | null>(null);
  public readonly cart$ = this.cart.asReadonly();
  
  async addItem(productId: string, quantity: number): Promise<void> {
    // Adicionar item ao carrinho
    // Validar estoque
    // Validar farmácia (só produtos da mesma farmácia)
  }
  
  async updateQuantity(productId: string, quantity: number): Promise<void> {
    // Atualizar quantidade
  }
  
  async removeItem(productId: string): Promise<void> {
    // Remover item
  }
  
  async clearCart(): Promise<void> {
    // Limpar carrinho
  }
  
  calculateSubtotal(): number {
    // Calcular subtotal
  }
  
  calculateDeliveryFee(zipCode: string): Promise<number> {
    // Calcular frete
  }
  
  calculateTotal(): number {
    // Calcular total
  }
}
```

**Cenários de Teste (20):**

**Positivos (12):**
1. ✅ Deve adicionar produto ao carrinho
2. ✅ Deve atualizar quantidade
3. ✅ Deve remover item
4. ✅ Deve limpar carrinho
5. ✅ Deve calcular subtotal corretamente
6. ✅ Deve calcular frete
7. ✅ Deve calcular total com frete
8. ✅ Deve aplicar frete grátis (mínimo atingido)
9. ✅ Deve persistir carrinho no Firestore
10. ✅ Deve restaurar carrinho ao reabrir app
11. ✅ Deve expirar carrinho após 7 dias
12. ✅ Deve sincronizar carrinho entre devices

**Negativos (5):**
13. ❌ Deve retornar erro se produto fora de estoque
14. ❌ Deve retornar erro se quantidade > estoque
15. ❌ Deve retornar erro se tentar misturar farmácias
16. ❌ Deve retornar erro se produto não existe
17. ❌ Deve retornar erro se CEP inválido

**Edge Cases (3):**
18. ⚠️ Deve lidar com alteração de preço durante checkout
19. ⚠️ Deve lidar com produto removido do catálogo
20. ⚠️ Deve lidar com farmácia fechada

**Tempo:** 10h

---

#### 3.2 CheckoutPage (20h)

**Etapas do Checkout:**

1. **Endereço de Entrega** (5h)
   - Form de endereço
   - Validação de CEP (ViaCEP API)
   - Salvar endereços favoritos
   - Opção "Retirar na farmácia"

2. **Método de Pagamento** (8h)
   - Cartão de crédito/débito (Stripe)
   - PIX (PagSeguro)
   - Boleto (PagSeguro)
   - Salvar cartões

3. **Revisão do Pedido** (4h)
   - Resumo de items
   - Endereço de entrega
   - Método de pagamento
   - Subtotal + frete + total
   - Upload de receita (se necessário)

4. **Confirmação** (3h)
   - Processar pagamento
   - Criar pedido
   - Enviar confirmação por email
   - Redirecionar para página de sucesso

---

#### 3.3 Payment Integration (18h)

**StripeService (10h):**
- Criar payment intent
- Confirmar pagamento
- Salvar payment method
- Listar payment methods
- 3D Secure support

**PagSeguroService (8h):**
- Gerar PIX (QR Code)
- Gerar Boleto (PDF)
- Processar notificações
- Consultar status

---

### FASE 4: GESTÃO DE PEDIDOS (40h)

#### 4.1 OrderService (12h)

```typescript
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  async createOrder(cart: Cart, delivery: DeliveryInfo, payment: PaymentInfo): Promise<Order> {
    // Criar pedido
    // Enviar para farmácia
    // Enviar confirmação para cliente
  }
  
  async getOrders(userId: string): Promise<Order[]> {
    // Listar pedidos do usuário
  }
  
  async getOrder(orderId: string): Promise<Order> {
    // Obter detalhes do pedido
  }
  
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    // Cancelar pedido
    // Processar reembolso
  }
  
  async trackOrder(orderId: string): Promise<TrackingInfo> {
    // Rastreamento (Correios, Loggi, etc.)
  }
  
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    // Atualizar status (farmácia)
  }
}
```

**Cenários de Teste (25):**

**Positivos (15):**
1. ✅ Deve criar pedido com pagamento aprovado
2. ✅ Deve gerar número de pedido único
3. ✅ Deve enviar email de confirmação
4. ✅ Deve notificar farmácia
5. ✅ Deve listar pedidos do usuário
6. ✅ Deve filtrar pedidos por status
7. ✅ Deve obter detalhes do pedido
8. ✅ Deve atualizar status (preparando)
9. ✅ Deve atualizar status (enviado)
10. ✅ Deve atualizar status (entregue)
11. ✅ Deve cancelar pedido (antes do envio)
12. ✅ Deve processar reembolso
13. ✅ Deve rastrear pedido
14. ✅ Deve calcular tempo estimado de entrega
15. ✅ Deve enviar notificação de status

**Negativos (6):**
16. ❌ Deve retornar erro se pagamento falhar
17. ❌ Deve retornar erro se pedido não encontrado
18. ❌ Deve retornar erro ao cancelar pedido já enviado
19. ❌ Deve retornar erro se farmácia fechada
20. ❌ Deve retornar erro se receita não aprovada
21. ❌ Deve retornar erro se estoque insuficiente

**Edge Cases (4):**
22. ⚠️ Deve lidar com mudança de endereço após criação
23. ⚠️ Deve lidar com pedido sem rastreamento
24. ⚠️ Deve lidar com pedido atrasado
25. ⚠️ Deve lidar com múltiplos pedidos simultâneos

**Tempo:** 12h

---

#### 4.2 Páginas de Pedidos (18h)

**OrderListPage (8h):**
- Lista de pedidos
- Filtros (status, data)
- Busca por número
- Cards de pedido com status visual

**OrderDetailPage (10h):**
- Detalhes completos
- Timeline de status
- Rastreamento
- Opção de cancelamento
- Download de nota fiscal
- Deixar review

---

#### 4.3 Order Tracking (10h)

- Integração com Correios API
- Integração com Loggi API
- Mapa de rastreamento
- Notificações push

---

### FASE 5: PAINEL DE FARMÁCIAS (80h)

#### 5.1 PharmacyDashboardPage (30h)

**Widgets (15h):**
- Total de vendas (dia, semana, mês)
- Pedidos pendentes
- Produtos mais vendidos
- Rating médio
- Gráfico de vendas (Chart.js)

**Menu Lateral (5h):**
- Overview
- Produtos
- Pedidos
- Analytics
- Configurações

**Responsividade (5h):**
- Desktop (sidebar)
- Mobile (bottom tabs)

**Permissions (5h):**
- Guard de farmácia
- Verificação de ownership

---

#### 5.2 Gestão de Produtos (Farmácia) (25h)

**ProductManagementPage (15h):**
- Lista de produtos da farmácia
- CRUD completo
- Upload de múltiplas imagens
- Edição em lote
- Ativar/desativar produtos
- Controle de estoque
- Alertas de estoque baixo

**ProductFormPage (10h):**
- Form completo com validações
- Upload de imagens (drag & drop)
- Autocomplete de medicamentos (base ANVISA)
- Preview do produto

---

#### 5.3 Gestão de Pedidos (Farmácia) (15h)

**OrderManagementPage (10h):**
- Lista de pedidos recebidos
- Filtros (status, data, valor)
- Atualização de status
- Impressão de etiquetas
- Validação de receitas

**OrderPharmacyDetailPage (5h):**
- Detalhes completos
- Aprovar/rejeitar receita
- Atualizar status
- Comunicação com cliente

---

#### 5.4 Analytics (10h)

**AnalyticsPage:**
- Gráfico de vendas (linha)
- Produtos mais vendidos (barras)
- Categorias mais vendidas (pizza)
- Ticket médio
- Taxa de conversão
- Pedidos por período
- Clientes recorrentes

---

### FASE 6: SISTEMA DE AVALIAÇÕES (32h)

#### 6.1 ReviewService (8h)

```typescript
@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  async createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    // Criar review
    // Validar se usuário comprou produto/usou farmácia
    // Atualizar rating médio
  }
  
  async getReviews(targetType: 'product' | 'pharmacy', targetId: string): Promise<Review[]> {
    // Listar reviews
  }
  
  async deleteReview(reviewId: string): Promise<void> {
    // Deletar review (moderação)
  }
  
  async markHelpful(reviewId: string): Promise<void> {
    // Marcar como útil
  }
  
  async reportReview(reviewId: string, reason: string): Promise<void> {
    // Reportar review (spam, ofensivo, etc.)
  }
}
```

**Cenários de Teste (15):**

**Positivos (10):**
1. ✅ Deve criar review de produto
2. ✅ Deve criar review de farmácia
3. ✅ Deve listar reviews do produto
4. ✅ Deve listar reviews da farmácia
5. ✅ Deve calcular rating médio
6. ✅ Deve ordenar por mais recentes
7. ✅ Deve ordenar por mais úteis
8. ✅ Deve marcar como útil
9. ✅ Deve filtrar por rating (5 estrelas, 4 estrelas, etc.)
10. ✅ Deve atualizar rating do produto/farmácia

**Negativos (3):**
11. ❌ Deve retornar erro se não comprou produto
12. ❌ Deve retornar erro se já deixou review
13. ❌ Deve retornar erro se rating inválido (<1 ou >5)

**Edge Cases (2):**
14. ⚠️ Deve lidar com review muito longo (limite 500 chars)
15. ⚠️ Deve detectar palavras ofensivas (moderação)

**Tempo:** 8h

---

#### 6.2 Componentes de Review (14h)

**ReviewList (6h):**
- Lista de reviews
- Ordenação
- Filtros por rating
- Paginação

**ReviewForm (5h):**
- Rating com estrelas
- Título e comentário
- Validações
- Preview

**RatingSummary (3h):**
- Rating médio (grande)
- Distribuição (barras)
- Total de reviews

---

#### 6.3 Moderação de Reviews (10h)

**Admin Dashboard:**
- Lista de reviews reportados
- Aprovar/deletar
- Blacklist de usuários
- Estatísticas

---

### FASE 7: FEATURES ADICIONAIS (40h)

#### 7.1 Sistema de Busca Avançada (12h)

- Integração com Algolia
- Busca fuzzy
- Autocomplete inteligente
- Filtros avançados
- Histórico de buscas
- Sugestões personalizadas

---

#### 7.2 Sistema de Cupons e Descontos (10h)

```typescript
export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  applicableTo: 'all' | 'category' | 'product' | 'pharmacy';
  targetIds?: string[];
}
```

---

#### 7.3 Wishlist (8h)

- Adicionar/remover da wishlist
- Lista de desejos
- Notificação de desconto
- Compartilhar wishlist

---

#### 7.4 Comparação de Produtos (10h)

- Selecionar até 4 produtos
- Tabela comparativa
- Destaque de diferenças
- Melhor preço

---

### FASE 8: TESTES (104h)

#### 8.1 Testes Unitários (60h)

| Serviço/Componente | Cenários | Tempo |
|-------------------|----------|-------|
| ProductService | 25 | 10h |
| CartService | 20 | 8h |
| OrderService | 25 | 12h |
| PharmacyService | 15 | 6h |
| ReviewService | 15 | 8h |
| PaymentServices | 20 | 10h |
| Componentes Críticos | 30+ | 12h |

---

#### 8.2 Testes E2E (Cypress) (44h)

**Fluxos Críticos:**

1. **Buscar e Adicionar ao Carrinho (6h)**
   - Buscar produto
   - Ver detalhes
   - Adicionar ao carrinho
   - Ver carrinho

2. **Checkout Completo (10h)**
   - Preencher endereço
   - Selecionar pagamento
   - Upload de receita
   - Confirmar pedido
   - Ver confirmação

3. **Rastreamento de Pedido (5h)**
   - Ver lista de pedidos
   - Ver detalhes
   - Rastrear pedido

4. **Farmácia: Gerenciar Produtos (8h)**
   - Login farmácia
   - Adicionar produto
   - Editar produto
   - Desativar produto

5. **Farmácia: Processar Pedido (8h)**
   - Receber pedido
   - Validar receita
   - Atualizar status
   - Finalizar pedido

6. **Reviews (4h)**
   - Deixar review de produto
   - Deixar review de farmácia
   - Ver reviews

7. **Cupons (3h)**
   - Aplicar cupom
   - Ver desconto aplicado

**Total E2E:** 44h

---

## 📊 CRONOGRAMA CONSOLIDADO

### Timeline de 11 Semanas (444 horas)

| Sprint | Fase | Horas | Tarefas Principais |
|--------|------|-------|-------------------|
| Sprint 1 (Sem 1) | Arquitetura | 24h | Modelagem, estrutura, Firebase |
| Sprint 2-3 (Sem 2-3) | Catálogo | 60h | ProductService, páginas, componentes |
| Sprint 4 (Sem 4) | Carrinho | 48h | CartService, Checkout, Payment |
| Sprint 5 (Sem 5) | Pedidos | 40h | OrderService, páginas, tracking |
| Sprint 6-7 (Sem 6-7) | Painel Farmácia | 80h | Dashboard, gestão produtos/pedidos |
| Sprint 8 (Sem 8) | Reviews | 32h | ReviewService, componentes, moderação |
| Sprint 9 (Sem 9) | Features Extras | 40h | Busca, cupons, wishlist |
| Sprint 10-11 (Sem 10-11) | Testes | 104h | Unit tests + E2E |
| **TOTAL** | | **444h** | **11 semanas (1 dev)** |

---

## ✅ MÉTRICAS DE SUCESSO

### Funcionalidade
- [ ] 1000+ produtos cadastrados
- [ ] 10+ farmácias ativas
- [ ] 100% features implementadas
- [ ] Checkout funcional (pagamento real)

### Qualidade
- [ ] 100% cobertura de testes
- [ ] 0 warnings de lint
- [ ] 0 erros de build
- [ ] Lighthouse Score >90

### Negócio
- [ ] 50+ pedidos processados (teste)
- [ ] <2s tempo de carregamento
- [ ] Taxa de conversão >3%
- [ ] NPS >50

---

## 📄 CONCLUSÃO

Este roadmap detalha a implementação COMPLETA do marketplace, transformando os 10% atuais em uma plataforma 100% funcional de e-commerce de medicamentos em **444 horas** (~11 semanas com 1 desenvolvedor full-time).

---

**Próximo Documento:** `BACKOFFICE-ROADMAP.md`

---

**Documento criado por:** Product Owner AI  
**Data:** 16 de dezembro de 2025  
**Versão:** 1.0  
**Status:** 📋 PRONTO PARA EXECUÇÃO
