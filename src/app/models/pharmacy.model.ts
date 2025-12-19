/**
 * 🏪 Pharmacy Model
 * Modelo de dados para farmácias do marketplace
 */

export interface Pharmacy {
  id: string;
  name: string;
  legalName: string;                // Razão social
  cnpj: string;
  anvisaLicense: string;            // Licença ANVISA
  crf: string;                      // Conselho Regional de Farmácia
  responsiblePharmacist: {
    name: string;
    crf: string;
    phone: string;
  };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  contact: {
    phone: string;
    whatsapp?: string;
    email: string;
    website?: string;
  };
  businessHours: BusinessHours[];
  logo?: string;
  banner?: string;
  description?: string;
  rating: number;                   // Rating médio (0-5)
  reviewCount: number;              // Número de avaliações
  orderCount: number;               // Total de pedidos atendidos
  deliveryOptions: {
    hasDelivery: boolean;
    deliveryFee: number;            // Taxa fixa em centavos
    freeDeliveryMinimum?: number;   // Valor mínimo para frete grátis
    estimatedTime: string;          // Ex: "30-60 minutos"
    hasPickup: boolean;             // Permite retirada na loja
  };
  paymentMethods: PaymentMethod[];
  policies: {
    returnPolicy?: string;
    privacyPolicy?: string;
    termsOfService?: string;
  };
  status: PharmacyStatus;
  verificationStatus: VerificationStatus;
  verificationDocuments: {
    cnpjDocument?: string;          // URL do documento
    anvisaLicense?: string;
    crfLicense?: string;
    addressProof?: string;
  };
  bankAccount?: {
    bankCode: string;
    agencyNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
    holderName: string;
    holderDocument: string;
  };
  commission: number;               // Comissão da plataforma (0-100%)
  metadata: {
    totalSales: number;             // Total de vendas em centavos
    averageTicket: number;          // Ticket médio
    conversionRate: number;         // Taxa de conversão (0-100)
    responseTime: number;           // Tempo médio de resposta em minutos
  };
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 6 = Sábado
  openTime: string;                 // HH:mm formato (ex: "08:00")
  closeTime: string;                // HH:mm formato (ex: "18:00")
  isClosed: boolean;                // Se fecha neste dia
}

export enum PharmacyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_CHANGES = 'requires_changes'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BOLETO = 'boleto',
  CASH = 'cash',
  INSURANCE = 'insurance'
}

export interface PharmacyFilters {
  city?: string;
  state?: string;
  hasDelivery?: boolean;
  hasPickup?: boolean;
  rating?: number;
  isActive?: boolean;
  verificationStatus?: VerificationStatus;
  searchQuery?: string;
}
