/**
 * 🏷️ Product Model
 * Modelo de dados para produtos do marketplace
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  activeIngredient?: string;        // Princípio ativo (ex: "Dipirona Sódica")
  dosage?: string;                  // Dosagem (ex: "500mg")
  manufacturer: string;             // Fabricante
  category: ProductCategory;
  subcategory?: string;
  images: string[];                 // URLs das imagens
  price: number;                    // Preço em centavos (ex: 1990 = R$ 19,90)
  originalPrice?: number;           // Preço original (se houver desconto)
  discount?: number;                // Percentual de desconto (0-100)
  stock: number;                    // Quantidade em estoque
  minStock: number;                 // Estoque mínimo para alerta
  requiresPrescription: boolean;    // Exige receita médica
  prescriptionType?: 'simple' | 'controlled' | 'special'; // Tipo de receita
  pharmacyId: string;               // ID da farmácia proprietária
  sku: string;                      // Código SKU único
  ean?: string;                     // Código de barras EAN
  anvisaRegistry?: string;          // Registro ANVISA
  packageSize?: string;             // Tamanho da embalagem (ex: "20 comprimidos")
  specifications: {
    [key: string]: string;          // Especificações extras (peso, volume, etc)
  };
  rating: number;                   // Rating médio (0-5)
  reviewCount: number;              // Número de avaliações
  soldCount: number;                // Número de vendas
  isFeatured: boolean;              // Produto em destaque
  isActive: boolean;                // Produto ativo/inativo
  tags: string[];                   // Tags para busca
  seoTitle?: string;                // Título SEO
  seoDescription?: string;          // Descrição SEO
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductCategory {
  ANALGESICS = 'analgesics',
  ANTIBIOTICS = 'antibiotics',
  ANTIHISTAMINES = 'antihistamines',
  ANTIHYPERTENSIVES = 'antihypertensives',
  CARDIOVASCULAR = 'cardiovascular',
  DERMATOLOGICALS = 'dermatologicals',
  DIABETES = 'diabetes',
  DIGESTIVE = 'digestive',
  SUPPLEMENTS = 'supplements',
  VITAMINS = 'vitamins',
  PEDIATRICS = 'pediatrics',
  WOMEN_HEALTH = 'women_health',
  MEDICAL_DEVICES = 'medical_devices'
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.ANALGESICS]: 'Analgésicos e Antitérmicos',
  [ProductCategory.ANTIBIOTICS]: 'Antibióticos',
  [ProductCategory.ANTIHISTAMINES]: 'Antialérgicos',
  [ProductCategory.ANTIHYPERTENSIVES]: 'Anti-hipertensivos',
  [ProductCategory.CARDIOVASCULAR]: 'Cardiovasculares',
  [ProductCategory.DERMATOLOGICALS]: 'Dermatológicos',
  [ProductCategory.DIABETES]: 'Diabetes',
  [ProductCategory.DIGESTIVE]: 'Sistema Digestivo',
  [ProductCategory.SUPPLEMENTS]: 'Suplementos',
  [ProductCategory.VITAMINS]: 'Vitaminas e Minerais',
  [ProductCategory.PEDIATRICS]: 'Pediatria',
  [ProductCategory.WOMEN_HEALTH]: 'Saúde da Mulher',
  [ProductCategory.MEDICAL_DEVICES]: 'Dispositivos Médicos'
};

export interface ProductFilters {
  category?: ProductCategory;
  subcategory?: string;
  priceMin?: number;
  priceMax?: number;
  pharmacyId?: string;
  rating?: number;
  inStock?: boolean;
  requiresPrescription?: boolean;
  searchQuery?: string;
  tags?: string[];
  isFeatured?: boolean;
}

export interface ProductSortOptions {
  field: 'price' | 'rating' | 'soldCount' | 'createdAt' | 'name';
  direction: 'asc' | 'desc';
}
