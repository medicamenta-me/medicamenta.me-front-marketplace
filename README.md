# Medicamenta.me - Marketplace Frontend

## 📋 Descrição

Marketplace web para farmácias e usuários comprarem medicamentos e produtos de saúde.

**URL:** https://www.medicamenta.me

## 🛠️ Tecnologias

- **Framework:** Angular 20+
- **Linguagem:** TypeScript 5.x
- **Estilos:** SCSS
- **Build:** Angular CLI

## 🚀 Começando

### Pré-requisitos

```bash
node >= 18.0.0
npm >= 9.0.0
@angular/cli
```

### Instalação

```bash
# Instalar dependências
npm install
```

### Desenvolvimento

```bash
# Servidor de desenvolvimento
ng serve
# Aplicação disponível em http://localhost:4200

# Build de desenvolvimento
ng build

# Build de produção
ng build --configuration production
```

## 📁 Estrutura do Projeto

```
medicamenta.me-front-marketplace/
├── src/
│   ├── app/
│   │   ├── core/              # Serviços core, guards, interceptors
│   │   ├── shared/            # Componentes e módulos compartilhados
│   │   ├── features/          # Features do marketplace
│   │   │   ├── home/          # Página inicial
│   │   │   ├── catalog/       # Catálogo de produtos
│   │   │   ├── product/       # Detalhes do produto
│   │   │   ├── cart/          # Carrinho de compras
│   │   │   ├── checkout/      # Processo de checkout
│   │   │   ├── pharmacy/      # Perfis de farmácias
│   │   │   └── api-docs/      # Documentação da API pública
│   │   └── layouts/           # Layouts da aplicação
│   ├── assets/                # Imagens, ícones, etc.
│   └── environments/          # Configurações de ambiente
├── angular.json
├── package.json
└── tsconfig.json
```

## 🎯 Funcionalidades Principais

### Para Usuários
- ✅ Catálogo de produtos e medicamentos
- ✅ Sistema de busca avançada
- ✅ Filtros por categoria, preço, localização
- ✅ Carrinho de compras
- ✅ Checkout integrado
- ✅ Rastreamento de pedidos
- ✅ Sistema de avaliações

### Para Farmácias
- ✅ Dashboard de vendas
- ✅ Gestão de produtos
- ✅ Controle de estoque
- ✅ Relatórios e analytics
- ✅ API de integração

## 🔌 API Pública

O marketplace oferece uma API REST para integração de farmácias.

**Documentação:** `/api-docs`

**Exemplo de integração:**
```typescript
// Autenticação
POST /api/v1/auth/pharmacy/login

// Listar produtos
GET /api/v1/products

// Criar produto
POST /api/v1/products
```

## 🌐 Ambientes

- **Desenvolvimento:** http://localhost:4200
- **Homologação:** https://staging.medicamenta.me
- **Produção:** https://www.medicamenta.me

## 📝 Scripts Disponíveis

- `npm start` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm test` - Executa testes unitários
- `npm run lint` - Verifica código com ESLint

## 🔗 Projetos Relacionados

- [medicamenta.me-back-functions](../medicamenta.me-back-functions) - Backend Functions
- [medicamenta.me-front-app](../medicamenta.me-front-app) - Aplicativo Mobile
- [medicamenta.me-front-backoffice](../medicamenta.me-front-backoffice) - Painel Administrativo

## 📄 Licença

Proprietary - Todos os direitos reservados
