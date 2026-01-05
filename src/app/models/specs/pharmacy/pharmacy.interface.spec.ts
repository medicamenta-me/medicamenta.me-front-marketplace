/**
 * @file pharmacy.interface.spec.ts
 * @description Testes unitários para a interface Pharmacy
 */

import { Pharmacy, PharmacyStatus, VerificationStatus, PaymentMethod } from '../../pharmacy.model';

describe('Pharmacy Interface', () => {
  it('should create basic pharmacy', () => {
    const pharmacy: Pharmacy = {
      id: 'pharma-123',
      name: 'Farmácia São Paulo',
      legalName: 'Farmácia São Paulo LTDA',
      cnpj: '12.345.678/0001-90',
      anvisaLicense: 'AFE123456',
      crf: 'CRF-SP 12345',
      responsiblePharmacist: {
        name: 'Dr. João Silva',
        crf: 'CRF-SP 54321',
        phone: '11999999999'
      },
      address: {
        street: 'Rua das Flores',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
        country: 'Brasil'
      },
      contact: {
        phone: '1133334444',
        email: 'contato@farmasp.com.br'
      },
      businessHours: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false }
      ],
      rating: 4.5,
      reviewCount: 150,
      orderCount: 500,
      deliveryOptions: {
        hasDelivery: true,
        deliveryFee: 500,
        estimatedTime: '30-60 minutos',
        hasPickup: true
      },
      paymentMethods: [PaymentMethod.CREDIT_CARD, PaymentMethod.PIX],
      policies: {},
      status: PharmacyStatus.ACTIVE,
      verificationStatus: VerificationStatus.APPROVED,
      verificationDocuments: {},
      commission: 15,
      metadata: {
        totalSales: 50000000,
        averageTicket: 8500,
        conversionRate: 65,
        responseTime: 15
      },
      tags: ['24h', 'delivery'],
      isFeatured: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(pharmacy.name).toBe('Farmácia São Paulo');
    expect(pharmacy.cnpj).toBe('12.345.678/0001-90');
    expect(pharmacy.rating).toBe(4.5);
    expect(pharmacy.status).toBe(PharmacyStatus.ACTIVE);
  });

  it('should create pharmacy with all optional fields', () => {
    const pharmacy: Pharmacy = {
      id: 'pharma-456',
      name: 'Drogaria Express',
      legalName: 'Drogaria Express S.A.',
      cnpj: '98.765.432/0001-10',
      anvisaLicense: 'AFE654321',
      crf: 'CRF-SP 67890',
      responsiblePharmacist: {
        name: 'Dra. Maria Santos',
        crf: 'CRF-SP 09876',
        phone: '11988888888'
      },
      address: {
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Loja 10',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310100',
        country: 'Brasil',
        latitude: -23.5505,
        longitude: -46.6333
      },
      contact: {
        phone: '1133335555',
        whatsapp: '11999998888',
        email: 'contato@drogaexpress.com.br',
        website: 'https://drogaexpress.com.br'
      },
      businessHours: [],
      logo: 'logo.png',
      banner: 'banner.jpg',
      description: 'A maior rede de farmácias de SP',
      rating: 4.8,
      reviewCount: 1000,
      orderCount: 5000,
      deliveryOptions: {
        hasDelivery: true,
        deliveryFee: 800,
        freeDeliveryMinimum: 10000,
        estimatedTime: '20-40 minutos',
        hasPickup: true
      },
      paymentMethods: Object.values(PaymentMethod),
      policies: {
        returnPolicy: 'Devolução em até 7 dias',
        privacyPolicy: 'Política de privacidade',
        termsOfService: 'Termos de uso'
      },
      status: PharmacyStatus.ACTIVE,
      verificationStatus: VerificationStatus.APPROVED,
      verificationDocuments: {
        cnpjDocument: 'cnpj.pdf',
        anvisaLicense: 'anvisa.pdf',
        crfLicense: 'crf.pdf',
        addressProof: 'comprovante.pdf'
      },
      bankAccount: {
        bankCode: '001',
        agencyNumber: '1234',
        accountNumber: '12345678',
        accountType: 'checking',
        holderName: 'Drogaria Express S.A.',
        holderDocument: '98765432000110'
      },
      commission: 12,
      metadata: {
        totalSales: 100000000,
        averageTicket: 12000,
        conversionRate: 75,
        responseTime: 10
      },
      tags: ['24h', 'delivery', 'express', 'popular'],
      isFeatured: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(pharmacy.address.complement).toBe('Loja 10');
    expect(pharmacy.address.latitude).toBe(-23.5505);
    expect(pharmacy.contact.whatsapp).toBe('11999998888');
    expect(pharmacy.contact.website).toBeDefined();
    expect(pharmacy.logo).toBe('logo.png');
    expect(pharmacy.bankAccount).toBeDefined();
    expect(pharmacy.deliveryOptions.freeDeliveryMinimum).toBe(10000);
  });

  it('should create pharmacy with delivery only', () => {
    const pharmacy: Pharmacy = {
      id: 'delivery-only',
      name: 'Farmácia Delivery',
      legalName: 'Delivery LTDA',
      cnpj: '11.111.111/0001-11',
      anvisaLicense: 'AFE111111',
      crf: 'CRF-SP 11111',
      responsiblePharmacist: {
        name: 'Dr. Test',
        crf: 'CRF-SP 11111',
        phone: '11111111111'
      },
      address: {
        street: 'Rua A',
        number: '1',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234567',
        country: 'Brasil'
      },
      contact: {
        phone: '1111111111',
        email: 'test@test.com'
      },
      businessHours: [],
      rating: 4.0,
      reviewCount: 50,
      orderCount: 200,
      deliveryOptions: {
        hasDelivery: true,
        deliveryFee: 1000,
        estimatedTime: '60-90 minutos',
        hasPickup: false
      },
      paymentMethods: [PaymentMethod.PIX, PaymentMethod.CREDIT_CARD],
      policies: {},
      status: PharmacyStatus.ACTIVE,
      verificationStatus: VerificationStatus.APPROVED,
      verificationDocuments: {},
      commission: 15,
      metadata: {
        totalSales: 10000000,
        averageTicket: 5000,
        conversionRate: 50,
        responseTime: 20
      },
      tags: [],
      isFeatured: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(pharmacy.deliveryOptions.hasDelivery).toBe(true);
    expect(pharmacy.deliveryOptions.hasPickup).toBe(false);
  });

  it('should create pharmacy with pickup only', () => {
    const pharmacy: Pharmacy = {
      id: 'pickup-only',
      name: 'Farmácia Local',
      legalName: 'Local LTDA',
      cnpj: '22.222.222/0001-22',
      anvisaLicense: 'AFE222222',
      crf: 'CRF-SP 22222',
      responsiblePharmacist: {
        name: 'Dra. Local',
        crf: 'CRF-SP 22222',
        phone: '22222222222'
      },
      address: {
        street: 'Rua B',
        number: '2',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234568',
        country: 'Brasil'
      },
      contact: {
        phone: '2222222222',
        email: 'local@test.com'
      },
      businessHours: [],
      rating: 4.2,
      reviewCount: 30,
      orderCount: 100,
      deliveryOptions: {
        hasDelivery: false,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        hasPickup: true
      },
      paymentMethods: [PaymentMethod.CASH, PaymentMethod.DEBIT_CARD],
      policies: {},
      status: PharmacyStatus.ACTIVE,
      verificationStatus: VerificationStatus.APPROVED,
      verificationDocuments: {},
      commission: 10,
      metadata: {
        totalSales: 5000000,
        averageTicket: 3500,
        conversionRate: 80,
        responseTime: 5
      },
      tags: ['local'],
      isFeatured: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(pharmacy.deliveryOptions.hasDelivery).toBe(false);
    expect(pharmacy.deliveryOptions.hasPickup).toBe(true);
  });

  it('should create pending pharmacy', () => {
    const pharmacy: Pharmacy = {
      id: 'pending',
      name: 'Nova Farmácia',
      legalName: 'Nova LTDA',
      cnpj: '33.333.333/0001-33',
      anvisaLicense: 'AFE333333',
      crf: 'CRF-SP 33333',
      responsiblePharmacist: {
        name: 'Dr. Novo',
        crf: 'CRF-SP 33333',
        phone: '33333333333'
      },
      address: {
        street: 'Rua C',
        number: '3',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234569',
        country: 'Brasil'
      },
      contact: {
        phone: '3333333333',
        email: 'nova@test.com'
      },
      businessHours: [],
      rating: 0,
      reviewCount: 0,
      orderCount: 0,
      deliveryOptions: {
        hasDelivery: true,
        deliveryFee: 500,
        estimatedTime: '30-60 minutos',
        hasPickup: true
      },
      paymentMethods: [],
      policies: {},
      status: PharmacyStatus.PENDING,
      verificationStatus: VerificationStatus.PENDING,
      verificationDocuments: {},
      commission: 15,
      metadata: {
        totalSales: 0,
        averageTicket: 0,
        conversionRate: 0,
        responseTime: 0
      },
      tags: [],
      isFeatured: false,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(pharmacy.status).toBe(PharmacyStatus.PENDING);
    expect(pharmacy.verificationStatus).toBe(VerificationStatus.PENDING);
    expect(pharmacy.isActive).toBe(false);
    expect(pharmacy.rating).toBe(0);
  });

  it('should create suspended pharmacy', () => {
    const pharmacy: Pharmacy = {
      id: 'suspended',
      name: 'Farmácia Suspensa',
      legalName: 'Suspensa LTDA',
      cnpj: '44.444.444/0001-44',
      anvisaLicense: 'AFE444444',
      crf: 'CRF-SP 44444',
      responsiblePharmacist: {
        name: 'Dr. Suspenso',
        crf: 'CRF-SP 44444',
        phone: '44444444444'
      },
      address: {
        street: 'Rua D',
        number: '4',
        neighborhood: 'Bairro',
        city: 'SP',
        state: 'SP',
        zipCode: '01234570',
        country: 'Brasil'
      },
      contact: {
        phone: '4444444444',
        email: 'suspensa@test.com'
      },
      businessHours: [],
      rating: 2.5,
      reviewCount: 100,
      orderCount: 50,
      deliveryOptions: {
        hasDelivery: false,
        deliveryFee: 0,
        estimatedTime: '',
        hasPickup: false
      },
      paymentMethods: [],
      policies: {},
      status: PharmacyStatus.SUSPENDED,
      verificationStatus: VerificationStatus.APPROVED,
      verificationDocuments: {},
      commission: 20,
      metadata: {
        totalSales: 1000000,
        averageTicket: 2000,
        conversionRate: 30,
        responseTime: 60
      },
      tags: [],
      isFeatured: false,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(pharmacy.status).toBe(PharmacyStatus.SUSPENDED);
    expect(pharmacy.isActive).toBe(false);
  });
});
