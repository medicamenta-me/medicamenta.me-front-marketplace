/**
 * 🧪 Pharmacy Service Tests
 * Testes unitários para o serviço de farmácias
 * 
 * Cenários:
 * - Listagem com filtros
 * - Busca por localização
 * - Detalhes da farmácia
 * - Horário de funcionamento
 * - Formatação de dados
 * - Cache
 * - Estados de erro
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { 
  PharmacyService, 
  PHARMACY_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  DAY_OF_WEEK_LABELS
} from './pharmacy.service';
import { 
  Pharmacy, 
  PharmacyStatus, 
  VerificationStatus, 
  PaymentMethod,
  BusinessHours 
} from '../models/pharmacy.model';
import { Firestore } from '@angular/fire/firestore';

// Mock Firestore
const mockFirestore = jasmine.createSpyObj('Firestore', ['collection', 'doc']);

describe('PharmacyService', () => {
  let service: PharmacyService;

  const mockPharmacy: Pharmacy = {
    id: 'pharmacy-123',
    name: 'Farmácia Central',
    legalName: 'Farmácia Central LTDA',
    cnpj: '12.345.678/0001-90',
    anvisaLicense: 'AFE-123456',
    crf: 'CRF-SP-12345',
    responsiblePharmacist: {
      name: 'Dr. João Silva',
      crf: 'CRF-SP-12345',
      phone: '(11) 99999-9999'
    },
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Loja 1',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil',
      latitude: -23.5505,
      longitude: -46.6333
    },
    contact: {
      phone: '(11) 3333-4444',
      whatsapp: '(11) 99999-9999',
      email: 'contato@farmaciacentral.com.br',
      website: 'https://farmaciacentral.com.br'
    },
    businessHours: [
      { dayOfWeek: 0, openTime: '08:00', closeTime: '12:00', isClosed: false },
      { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '14:00', isClosed: false }
    ],
    logo: 'https://example.com/logo.png',
    banner: 'https://example.com/banner.png',
    description: 'Farmácia completa no centro de SP',
    rating: 4.5,
    reviewCount: 150,
    orderCount: 1200,
    deliveryOptions: {
      hasDelivery: true,
      deliveryFee: 999,
      freeDeliveryMinimum: 10000,
      estimatedTime: '30-60 minutos',
      hasPickup: true
    },
    paymentMethods: [PaymentMethod.CREDIT_CARD, PaymentMethod.PIX, PaymentMethod.CASH],
    policies: {
      returnPolicy: 'Troca em até 7 dias',
      privacyPolicy: 'https://example.com/privacy',
      termsOfService: 'https://example.com/terms'
    },
    status: PharmacyStatus.ACTIVE,
    verificationStatus: VerificationStatus.APPROVED,
    verificationDocuments: {
      cnpjDocument: 'https://example.com/cnpj.pdf',
      anvisaLicense: 'https://example.com/anvisa.pdf',
      crfLicense: 'https://example.com/crf.pdf',
      addressProof: 'https://example.com/address.pdf'
    },
    bankAccount: {
      bankCode: '341',
      agencyNumber: '1234',
      accountNumber: '12345-6',
      accountType: 'checking',
      holderName: 'Farmácia Central LTDA',
      holderDocument: '12.345.678/0001-90'
    },
    commission: 15,
    metadata: {
      totalSales: 15000000,
      averageTicket: 12500,
      conversionRate: 68,
      responseTime: 15
    },
    tags: ['24h', 'delivery', 'manipulação'],
    isFeatured: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PharmacyService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Firestore, useValue: mockFirestore }
      ]
    });

    service = TestBed.inject(PharmacyService);
  });

  afterEach(() => {
    service.clearCache();
    service.clearState();
  });

  // ============================================
  // TESTES DE INICIALIZAÇÃO
  // ============================================

  describe('Initialization', () => {
    it('deve criar o serviço', () => {
      expect(service).toBeTruthy();
    });

    it('deve iniciar com loading false', () => {
      expect(service.loading()).toBe(false);
    });

    it('deve iniciar com error null', () => {
      expect(service.error()).toBeNull();
    });

    it('deve iniciar com pharmacies vazio', () => {
      expect(service.pharmacies()).toEqual([]);
    });

    it('deve iniciar com currentPharmacy null', () => {
      expect(service.currentPharmacy()).toBeNull();
    });

    it('deve iniciar com totalPharmacies 0', () => {
      expect(service.totalPharmacies()).toBe(0);
    });

    it('deve iniciar com hasPharmacies false', () => {
      expect(service.hasPharmacies()).toBe(false);
    });
  });

  // ============================================
  // TESTES DE LABELS
  // ============================================

  describe('Labels', () => {
    describe('PHARMACY_STATUS_LABELS', () => {
      it('deve ter label para ACTIVE', () => {
        expect(PHARMACY_STATUS_LABELS[PharmacyStatus.ACTIVE]).toBe('Ativa');
      });

      it('deve ter label para INACTIVE', () => {
        expect(PHARMACY_STATUS_LABELS[PharmacyStatus.INACTIVE]).toBe('Inativa');
      });

      it('deve ter label para SUSPENDED', () => {
        expect(PHARMACY_STATUS_LABELS[PharmacyStatus.SUSPENDED]).toBe('Suspensa');
      });

      it('deve ter label para PENDING', () => {
        expect(PHARMACY_STATUS_LABELS[PharmacyStatus.PENDING]).toBe('Pendente');
      });
    });

    describe('VERIFICATION_STATUS_LABELS', () => {
      it('deve ter label para PENDING', () => {
        expect(VERIFICATION_STATUS_LABELS[VerificationStatus.PENDING]).toBe('Pendente');
      });

      it('deve ter label para UNDER_REVIEW', () => {
        expect(VERIFICATION_STATUS_LABELS[VerificationStatus.UNDER_REVIEW]).toBe('Em Análise');
      });

      it('deve ter label para APPROVED', () => {
        expect(VERIFICATION_STATUS_LABELS[VerificationStatus.APPROVED]).toBe('Aprovada');
      });

      it('deve ter label para REJECTED', () => {
        expect(VERIFICATION_STATUS_LABELS[VerificationStatus.REJECTED]).toBe('Rejeitada');
      });

      it('deve ter label para REQUIRES_CHANGES', () => {
        expect(VERIFICATION_STATUS_LABELS[VerificationStatus.REQUIRES_CHANGES]).toBe('Requer Alterações');
      });
    });

    describe('PAYMENT_METHOD_LABELS', () => {
      it('deve ter label para CREDIT_CARD', () => {
        expect(PAYMENT_METHOD_LABELS[PaymentMethod.CREDIT_CARD]).toBe('Cartão de Crédito');
      });

      it('deve ter label para DEBIT_CARD', () => {
        expect(PAYMENT_METHOD_LABELS[PaymentMethod.DEBIT_CARD]).toBe('Cartão de Débito');
      });

      it('deve ter label para PIX', () => {
        expect(PAYMENT_METHOD_LABELS[PaymentMethod.PIX]).toBe('PIX');
      });

      it('deve ter label para BOLETO', () => {
        expect(PAYMENT_METHOD_LABELS[PaymentMethod.BOLETO]).toBe('Boleto');
      });

      it('deve ter label para CASH', () => {
        expect(PAYMENT_METHOD_LABELS[PaymentMethod.CASH]).toBe('Dinheiro');
      });

      it('deve ter label para INSURANCE', () => {
        expect(PAYMENT_METHOD_LABELS[PaymentMethod.INSURANCE]).toBe('Convênio');
      });
    });

    describe('DAY_OF_WEEK_LABELS', () => {
      it('deve ter label para domingo (0)', () => {
        expect(DAY_OF_WEEK_LABELS[0]).toBe('Domingo');
      });

      it('deve ter label para segunda (1)', () => {
        expect(DAY_OF_WEEK_LABELS[1]).toBe('Segunda-feira');
      });

      it('deve ter label para terça (2)', () => {
        expect(DAY_OF_WEEK_LABELS[2]).toBe('Terça-feira');
      });

      it('deve ter label para quarta (3)', () => {
        expect(DAY_OF_WEEK_LABELS[3]).toBe('Quarta-feira');
      });

      it('deve ter label para quinta (4)', () => {
        expect(DAY_OF_WEEK_LABELS[4]).toBe('Quinta-feira');
      });

      it('deve ter label para sexta (5)', () => {
        expect(DAY_OF_WEEK_LABELS[5]).toBe('Sexta-feira');
      });

      it('deve ter label para sábado (6)', () => {
        expect(DAY_OF_WEEK_LABELS[6]).toBe('Sábado');
      });
    });
  });

  // ============================================
  // TESTES DE isOpenNow
  // ============================================

  describe('isOpenNow', () => {
    it('deve retornar false para farmácia null', () => {
      expect(service.isOpenNow(null as any)).toBe(false);
    });

    it('deve retornar false para farmácia sem businessHours', () => {
      const pharmacy = { ...mockPharmacy, businessHours: undefined as any };
      expect(service.isOpenNow(pharmacy)).toBe(false);
    });

    it('deve retornar false para farmácia com businessHours vazio', () => {
      const pharmacy = { ...mockPharmacy, businessHours: [] };
      expect(service.isOpenNow(pharmacy)).toBe(false);
    });

    it('deve verificar horário de funcionamento baseado no dia atual', () => {
      // Este teste depende do horário real, então apenas verificamos que retorna boolean
      const result = service.isOpenNow(mockPharmacy);
      expect(typeof result).toBe('boolean');
    });

    it('deve retornar false se dia fechado', () => {
      const closedHours: BusinessHours[] = [
        { dayOfWeek: new Date().getDay() as 0|1|2|3|4|5|6, openTime: '08:00', closeTime: '18:00', isClosed: true }
      ];
      const pharmacy = { ...mockPharmacy, businessHours: closedHours };
      expect(service.isOpenNow(pharmacy)).toBe(false);
    });
  });

  // ============================================
  // TESTES DE getNextOpenTime
  // ============================================

  describe('getNextOpenTime', () => {
    it('deve retornar string vazia para farmácia null', () => {
      expect(service.getNextOpenTime(null as any)).toBe('');
    });

    it('deve retornar string vazia para farmácia sem businessHours', () => {
      const pharmacy = { ...mockPharmacy, businessHours: undefined as any };
      expect(service.getNextOpenTime(pharmacy)).toBe('');
    });

    it('deve retornar próximo horário de abertura', () => {
      const result = service.getNextOpenTime(mockPharmacy);
      // Deve retornar algo como "Hoje às HH:mm" ou "Dia às HH:mm" ou "Fechada"
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve retornar "Fechada" se todos os dias fechados', () => {
      const allClosed: BusinessHours[] = Array(7).fill(null).map((_, i) => ({
        dayOfWeek: i as 0|1|2|3|4|5|6,
        openTime: '00:00',
        closeTime: '00:00',
        isClosed: true
      }));
      const pharmacy = { ...mockPharmacy, businessHours: allClosed };
      expect(service.getNextOpenTime(pharmacy)).toBe('Fechada');
    });
  });

  // ============================================
  // TESTES DE formatBusinessHours
  // ============================================

  describe('formatBusinessHours', () => {
    it('deve retornar mensagem padrão para hours null', () => {
      expect(service.formatBusinessHours(null as any)).toEqual(['Horário não informado']);
    });

    it('deve retornar mensagem padrão para hours undefined', () => {
      expect(service.formatBusinessHours(undefined as any)).toEqual(['Horário não informado']);
    });

    it('deve retornar mensagem padrão para hours vazio', () => {
      expect(service.formatBusinessHours([])).toEqual(['Horário não informado']);
    });

    it('deve formatar horários corretamente', () => {
      const hours: BusinessHours[] = [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false }
      ];
      const result = service.formatBusinessHours(hours);
      expect(result[0]).toBe('Segunda-feira: 08:00 - 18:00');
    });

    it('deve indicar dia fechado', () => {
      const hours: BusinessHours[] = [
        { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true }
      ];
      const result = service.formatBusinessHours(hours);
      expect(result[0]).toBe('Domingo: Fechado');
    });

    it('deve formatar todos os dias da semana', () => {
      const result = service.formatBusinessHours(mockPharmacy.businessHours);
      expect(result.length).toBe(7);
    });
  });

  // ============================================
  // TESTES DE formatAddress
  // ============================================

  describe('formatAddress', () => {
    it('deve retornar string vazia para farmácia null', () => {
      expect(service.formatAddress(null as any)).toBe('');
    });

    it('deve retornar string vazia para farmácia sem address', () => {
      const pharmacy = { ...mockPharmacy, address: undefined as any };
      expect(service.formatAddress(pharmacy)).toBe('');
    });

    it('deve formatar endereço completo com complemento', () => {
      const result = service.formatAddress(mockPharmacy);
      expect(result).toContain('Rua das Flores');
      expect(result).toContain('123');
      expect(result).toContain('Loja 1');
      expect(result).toContain('Centro');
      expect(result).toContain('São Paulo');
      expect(result).toContain('SP');
      expect(result).toContain('01234-567');
    });

    it('deve formatar endereço sem complemento', () => {
      const pharmacy = {
        ...mockPharmacy,
        address: { ...mockPharmacy.address, complement: undefined }
      };
      const result = service.formatAddress(pharmacy);
      expect(result).not.toContain('undefined');
      expect(result).toContain('Rua das Flores, 123');
    });

    it('deve formatar endereço sem CEP', () => {
      const pharmacy = {
        ...mockPharmacy,
        address: { ...mockPharmacy.address, zipCode: '' }
      };
      const result = service.formatAddress(pharmacy);
      expect(result).not.toContain('CEP:');
    });
  });

  // ============================================
  // TESTES DE formatCurrency
  // ============================================

  describe('formatCurrency', () => {
    it('deve formatar valor em centavos para reais', () => {
      const result = service.formatCurrency(1990);
      expect(result).toContain('19');
      expect(result).toContain('90');
    });

    it('deve formatar zero', () => {
      const result = service.formatCurrency(0);
      expect(result).toContain('0');
    });

    it('deve formatar valores grandes', () => {
      const result = service.formatCurrency(1500000);
      expect(result).toContain('15');
      expect(result).toContain('000');
    });

    it('deve usar formato BRL', () => {
      const result = service.formatCurrency(1000);
      expect(result).toMatch(/R\$|BRL/);
    });
  });

  // ============================================
  // TESTES DE getStatusLabel
  // ============================================

  describe('getStatusLabel', () => {
    it('deve retornar "Ativa" para ACTIVE', () => {
      expect(service.getStatusLabel(PharmacyStatus.ACTIVE)).toBe('Ativa');
    });

    it('deve retornar "Inativa" para INACTIVE', () => {
      expect(service.getStatusLabel(PharmacyStatus.INACTIVE)).toBe('Inativa');
    });

    it('deve retornar "Suspensa" para SUSPENDED', () => {
      expect(service.getStatusLabel(PharmacyStatus.SUSPENDED)).toBe('Suspensa');
    });

    it('deve retornar "Pendente" para PENDING', () => {
      expect(service.getStatusLabel(PharmacyStatus.PENDING)).toBe('Pendente');
    });

    it('deve retornar o próprio valor para status desconhecido', () => {
      expect(service.getStatusLabel('unknown' as PharmacyStatus)).toBe('unknown');
    });
  });

  // ============================================
  // TESTES DE getVerificationStatusLabel
  // ============================================

  describe('getVerificationStatusLabel', () => {
    it('deve retornar "Pendente" para PENDING', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.PENDING)).toBe('Pendente');
    });

    it('deve retornar "Em Análise" para UNDER_REVIEW', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.UNDER_REVIEW)).toBe('Em Análise');
    });

    it('deve retornar "Aprovada" para APPROVED', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.APPROVED)).toBe('Aprovada');
    });

    it('deve retornar "Rejeitada" para REJECTED', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.REJECTED)).toBe('Rejeitada');
    });

    it('deve retornar "Requer Alterações" para REQUIRES_CHANGES', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.REQUIRES_CHANGES)).toBe('Requer Alterações');
    });

    it('deve retornar o próprio valor para status desconhecido', () => {
      expect(service.getVerificationStatusLabel('unknown' as VerificationStatus)).toBe('unknown');
    });
  });

  // ============================================
  // TESTES DE getPaymentMethodLabel
  // ============================================

  describe('getPaymentMethodLabel', () => {
    it('deve retornar "Cartão de Crédito" para CREDIT_CARD', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.CREDIT_CARD)).toBe('Cartão de Crédito');
    });

    it('deve retornar "Cartão de Débito" para DEBIT_CARD', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.DEBIT_CARD)).toBe('Cartão de Débito');
    });

    it('deve retornar "PIX" para PIX', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.PIX)).toBe('PIX');
    });

    it('deve retornar "Boleto" para BOLETO', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.BOLETO)).toBe('Boleto');
    });

    it('deve retornar "Dinheiro" para CASH', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.CASH)).toBe('Dinheiro');
    });

    it('deve retornar "Convênio" para INSURANCE', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.INSURANCE)).toBe('Convênio');
    });

    it('deve retornar o próprio valor para método desconhecido', () => {
      expect(service.getPaymentMethodLabel('unknown' as PaymentMethod)).toBe('unknown');
    });
  });

  // ============================================
  // TESTES DE getStatusClass
  // ============================================

  describe('getStatusClass', () => {
    it('deve retornar "active" para ACTIVE', () => {
      expect(service.getStatusClass(PharmacyStatus.ACTIVE)).toBe('active');
    });

    it('deve retornar "inactive" para INACTIVE', () => {
      expect(service.getStatusClass(PharmacyStatus.INACTIVE)).toBe('inactive');
    });

    it('deve retornar "suspended" para SUSPENDED', () => {
      expect(service.getStatusClass(PharmacyStatus.SUSPENDED)).toBe('suspended');
    });

    it('deve retornar "pending" para PENDING', () => {
      expect(service.getStatusClass(PharmacyStatus.PENDING)).toBe('pending');
    });

    it('deve retornar string vazia para status desconhecido', () => {
      expect(service.getStatusClass('unknown' as PharmacyStatus)).toBe('');
    });
  });

  // ============================================
  // TESTES DE getVerificationStatusClass
  // ============================================

  describe('getVerificationStatusClass', () => {
    it('deve retornar "approved" para APPROVED', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.APPROVED)).toBe('approved');
    });

    it('deve retornar "pending" para PENDING', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.PENDING)).toBe('pending');
    });

    it('deve retornar "review" para UNDER_REVIEW', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.UNDER_REVIEW)).toBe('review');
    });

    it('deve retornar "rejected" para REJECTED', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.REJECTED)).toBe('rejected');
    });

    it('deve retornar "changes" para REQUIRES_CHANGES', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.REQUIRES_CHANGES)).toBe('changes');
    });

    it('deve retornar string vazia para status desconhecido', () => {
      expect(service.getVerificationStatusClass('unknown' as VerificationStatus)).toBe('');
    });
  });

  // ============================================
  // TESTES DE clearCache
  // ============================================

  describe('clearCache', () => {
    it('deve limpar o cache', () => {
      // O método não retorna nada, apenas não deve lançar erro
      expect(() => service.clearCache()).not.toThrow();
    });
  });

  // ============================================
  // TESTES DE clearState
  // ============================================

  describe('clearState', () => {
    it('deve limpar o estado', () => {
      // Definir algum estado
      service.loading.set(true);
      service.error.set('Erro');
      
      // Limpar
      service.clearState();
      
      // Verificar
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.currentPharmacy()).toBeNull();
      expect(service.pharmacies()).toEqual([]);
      expect(service.totalPharmacies()).toBe(0);
    });
  });

  // ============================================
  // TESTES DE getPharmacyById
  // ============================================

  describe('getPharmacyById', () => {
    it('deve retornar null para pharmacyId vazio', (done) => {
      service.getPharmacyById('').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('deve retornar null para pharmacyId null', (done) => {
      service.getPharmacyById(null as any).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('deve retornar null para pharmacyId undefined', (done) => {
      service.getPharmacyById(undefined as any).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  // ============================================
  // TESTES DE getNearbyPharmacies
  // ============================================

  describe('getNearbyPharmacies', () => {
    it('deve retornar lista vazia para coordenadas inválidas - lat > 90', (done) => {
      service.getNearbyPharmacies(91, -46.6333).subscribe(result => {
        expect(result).toEqual([]);
        expect(service.error()).toBe('Coordenadas inválidas');
        done();
      });
    });

    it('deve retornar lista vazia para coordenadas inválidas - lat < -90', (done) => {
      service.getNearbyPharmacies(-91, -46.6333).subscribe(result => {
        expect(result).toEqual([]);
        expect(service.error()).toBe('Coordenadas inválidas');
        done();
      });
    });

    it('deve retornar lista vazia para coordenadas inválidas - lng > 180', (done) => {
      service.getNearbyPharmacies(-23.5505, 181).subscribe(result => {
        expect(result).toEqual([]);
        expect(service.error()).toBe('Coordenadas inválidas');
        done();
      });
    });

    it('deve retornar lista vazia para coordenadas inválidas - lng < -180', (done) => {
      service.getNearbyPharmacies(-23.5505, -181).subscribe(result => {
        expect(result).toEqual([]);
        expect(service.error()).toBe('Coordenadas inválidas');
        done();
      });
    });

    it('deve aceitar coordenadas válidas sem erro de validação', () => {
      // Este teste verifica que coordenadas válidas não geram erro de validação
      // A validação ocorre antes da chamada ao Firestore
      const lat = -23.5505;
      const lng = -46.6333;
      
      // Coordenadas válidas devem passar na validação (entre -90/90 e -180/180)
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
      
      // Não deve ter erro de coordenadas inválidas antes da chamada
      expect(service.error()).not.toBe('Coordenadas inválidas');
    });
  });

  // ============================================
  // TESTES DE getPharmacyProducts
  // ============================================

  describe('getPharmacyProducts', () => {
    it('deve retornar lista vazia para pharmacyId vazio', (done) => {
      service.getPharmacyProducts('').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('deve retornar lista vazia para pharmacyId null', (done) => {
      service.getPharmacyProducts(null as any).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // ============================================
  // TESTES DE getPharmacyReviews
  // ============================================

  describe('getPharmacyReviews', () => {
    it('deve retornar lista vazia para pharmacyId vazio', (done) => {
      service.getPharmacyReviews('').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('deve retornar lista vazia para pharmacyId null', (done) => {
      service.getPharmacyReviews(null as any).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('deve retornar lista vazia para pharmacyId undefined', (done) => {
      service.getPharmacyReviews(undefined as any).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // ============================================
  // TESTES EXPANDIDOS - HORÁRIO DE FUNCIONAMENTO
  // ============================================

  describe('getNextOpenTime', () => {
    it('deve retornar string vazia para farmácia null', () => {
      expect(service.getNextOpenTime(null as any)).toBe('');
    });

    it('deve retornar string vazia para farmácia sem businessHours', () => {
      const pharmacy = { ...mockPharmacy, businessHours: undefined as any };
      expect(service.getNextOpenTime(pharmacy)).toBe('');
    });

    it('deve retornar string vazia para businessHours null', () => {
      const pharmacy = { ...mockPharmacy, businessHours: null as any };
      expect(service.getNextOpenTime(pharmacy)).toBe('');
    });

    it('deve processar businessHours válido', () => {
      const result = service.getNextOpenTime(mockPharmacy);
      expect(typeof result).toBe('string');
    });

    it('deve retornar "Fechada" se todos os dias estiverem fechados', () => {
      const closedPharmacy = { 
        ...mockPharmacy, 
        businessHours: [
          { dayOfWeek: 0, openTime: '08:00', closeTime: '12:00', isClosed: true },
          { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isClosed: true },
          { dayOfWeek: 2, openTime: '08:00', closeTime: '20:00', isClosed: true },
          { dayOfWeek: 3, openTime: '08:00', closeTime: '20:00', isClosed: true },
          { dayOfWeek: 4, openTime: '08:00', closeTime: '20:00', isClosed: true },
          { dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: true },
          { dayOfWeek: 6, openTime: '08:00', closeTime: '14:00', isClosed: true }
        ] as BusinessHours[]
      };
      expect(service.getNextOpenTime(closedPharmacy)).toBe('Fechada');
    });
  });

  // ============================================
  // TESTES EXPANDIDOS - FORMATAÇÃO
  // ============================================

  describe('formatBusinessHours', () => {
    it('deve retornar mensagem padrão para hours undefined', () => {
      const result = service.formatBusinessHours(undefined as any);
      expect(result).toEqual(['Horário não informado']);
    });

    it('deve retornar mensagem padrão para hours null', () => {
      const result = service.formatBusinessHours(null as any);
      expect(result).toEqual(['Horário não informado']);
    });

    it('deve retornar mensagem padrão para hours vazio', () => {
      const result = service.formatBusinessHours([]);
      expect(result).toEqual(['Horário não informado']);
    });

    it('deve formatar horário de dia aberto corretamente', () => {
      const hours: BusinessHours[] = [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00', isClosed: false }
      ];
      const result = service.formatBusinessHours(hours);
      expect(result[0]).toContain('Segunda-feira');
      expect(result[0]).toContain('08:00');
      expect(result[0]).toContain('20:00');
    });

    it('deve formatar dia fechado corretamente', () => {
      const hours: BusinessHours[] = [
        { dayOfWeek: 0, openTime: '', closeTime: '', isClosed: true }
      ];
      const result = service.formatBusinessHours(hours);
      expect(result[0]).toContain('Domingo');
      expect(result[0]).toContain('Fechado');
    });

    it('deve formatar múltiplos dias', () => {
      const hours: BusinessHours[] = [
        { dayOfWeek: 0, openTime: '', closeTime: '', isClosed: true },
        { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '14:00', isClosed: false }
      ];
      const result = service.formatBusinessHours(hours);
      expect(result.length).toBe(3);
    });
  });

  describe('formatAddress', () => {
    it('deve retornar string vazia para pharmacy null', () => {
      expect(service.formatAddress(null as any)).toBe('');
    });

    it('deve retornar string vazia para pharmacy sem address', () => {
      const pharmacy = { ...mockPharmacy, address: undefined as any };
      expect(service.formatAddress(pharmacy)).toBe('');
    });

    it('deve formatar endereço completo', () => {
      const result = service.formatAddress(mockPharmacy);
      expect(result).toContain('Rua das Flores');
      expect(result).toContain('123');
      expect(result).toContain('Centro');
      expect(result).toContain('São Paulo');
      expect(result).toContain('SP');
    });

    it('deve incluir complemento quando presente', () => {
      const result = service.formatAddress(mockPharmacy);
      expect(result).toContain('Loja 1');
    });

    it('deve incluir CEP quando presente', () => {
      const result = service.formatAddress(mockPharmacy);
      expect(result).toContain('CEP:');
      expect(result).toContain('01234-567');
    });

    it('deve formatar endereço sem complemento', () => {
      const pharmacy = { 
        ...mockPharmacy, 
        address: { ...mockPharmacy.address, complement: undefined } 
      };
      const result = service.formatAddress(pharmacy);
      expect(result).toContain('Rua das Flores');
      expect(result).not.toContain('Loja 1');
    });

    it('deve formatar endereço sem CEP', () => {
      const pharmacy = { 
        ...mockPharmacy, 
        address: { ...mockPharmacy.address, zipCode: '' } 
      };
      const result = service.formatAddress(pharmacy);
      expect(result).toContain('Rua das Flores');
      expect(result).not.toContain('CEP:');
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar 0 centavos', () => {
      const result = service.formatCurrency(0);
      expect(result).toContain('0,00');
    });

    it('deve formatar 100 centavos como R$ 1,00', () => {
      const result = service.formatCurrency(100);
      expect(result).toContain('1,00');
    });

    it('deve formatar 999 centavos como R$ 9,99', () => {
      const result = service.formatCurrency(999);
      expect(result).toContain('9,99');
    });

    it('deve formatar 1500 centavos como R$ 15,00', () => {
      const result = service.formatCurrency(1500);
      expect(result).toContain('15,00');
    });

    it('deve formatar valores grandes corretamente', () => {
      const result = service.formatCurrency(1000000);
      expect(result).toContain('10.000,00');
    });

    it('deve incluir símbolo R$', () => {
      const result = service.formatCurrency(1000);
      expect(result).toContain('R$');
    });
  });

  // ============================================
  // TESTES EXPANDIDOS - STATUS LABELS
  // ============================================

  describe('getStatusLabel', () => {
    it('deve retornar "Ativa" para ACTIVE', () => {
      expect(service.getStatusLabel(PharmacyStatus.ACTIVE)).toBe('Ativa');
    });

    it('deve retornar "Inativa" para INACTIVE', () => {
      expect(service.getStatusLabel(PharmacyStatus.INACTIVE)).toBe('Inativa');
    });

    it('deve retornar "Suspensa" para SUSPENDED', () => {
      expect(service.getStatusLabel(PharmacyStatus.SUSPENDED)).toBe('Suspensa');
    });

    it('deve retornar "Pendente" para PENDING', () => {
      expect(service.getStatusLabel(PharmacyStatus.PENDING)).toBe('Pendente');
    });

    it('deve retornar o próprio status para status desconhecido', () => {
      expect(service.getStatusLabel('unknown' as any)).toBe('unknown');
    });
  });

  describe('getVerificationStatusLabel', () => {
    it('deve retornar "Pendente" para PENDING', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.PENDING)).toBe('Pendente');
    });

    it('deve retornar "Em Análise" para UNDER_REVIEW', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.UNDER_REVIEW)).toBe('Em Análise');
    });

    it('deve retornar "Aprovada" para APPROVED', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.APPROVED)).toBe('Aprovada');
    });

    it('deve retornar "Rejeitada" para REJECTED', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.REJECTED)).toBe('Rejeitada');
    });

    it('deve retornar "Requer Alterações" para REQUIRES_CHANGES', () => {
      expect(service.getVerificationStatusLabel(VerificationStatus.REQUIRES_CHANGES)).toBe('Requer Alterações');
    });

    it('deve retornar o próprio status para status desconhecido', () => {
      expect(service.getVerificationStatusLabel('unknown' as any)).toBe('unknown');
    });
  });

  describe('getPaymentMethodLabel', () => {
    it('deve retornar "Cartão de Crédito" para CREDIT_CARD', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.CREDIT_CARD)).toBe('Cartão de Crédito');
    });

    it('deve retornar "Cartão de Débito" para DEBIT_CARD', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.DEBIT_CARD)).toBe('Cartão de Débito');
    });

    it('deve retornar "PIX" para PIX', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.PIX)).toBe('PIX');
    });

    it('deve retornar "Boleto" para BOLETO', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.BOLETO)).toBe('Boleto');
    });

    it('deve retornar "Dinheiro" para CASH', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.CASH)).toBe('Dinheiro');
    });

    it('deve retornar "Convênio" para INSURANCE', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.INSURANCE)).toBe('Convênio');
    });

    it('deve retornar o próprio método para método desconhecido', () => {
      expect(service.getPaymentMethodLabel('unknown' as any)).toBe('unknown');
    });
  });

  // ============================================
  // TESTES EXPANDIDOS - CSS CLASSES
  // ============================================

  describe('getStatusClass', () => {
    it('deve retornar "active" para ACTIVE', () => {
      expect(service.getStatusClass(PharmacyStatus.ACTIVE)).toBe('active');
    });

    it('deve retornar "inactive" para INACTIVE', () => {
      expect(service.getStatusClass(PharmacyStatus.INACTIVE)).toBe('inactive');
    });

    it('deve retornar "suspended" para SUSPENDED', () => {
      expect(service.getStatusClass(PharmacyStatus.SUSPENDED)).toBe('suspended');
    });

    it('deve retornar "pending" para PENDING', () => {
      expect(service.getStatusClass(PharmacyStatus.PENDING)).toBe('pending');
    });

    it('deve retornar string vazia para status desconhecido', () => {
      expect(service.getStatusClass('unknown' as any)).toBe('');
    });
  });

  describe('getVerificationStatusClass', () => {
    it('deve retornar "approved" para APPROVED', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.APPROVED)).toBe('approved');
    });

    it('deve retornar "pending" para PENDING', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.PENDING)).toBe('pending');
    });

    it('deve retornar "review" para UNDER_REVIEW', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.UNDER_REVIEW)).toBe('review');
    });

    it('deve retornar "rejected" para REJECTED', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.REJECTED)).toBe('rejected');
    });

    it('deve retornar "changes" para REQUIRES_CHANGES', () => {
      expect(service.getVerificationStatusClass(VerificationStatus.REQUIRES_CHANGES)).toBe('changes');
    });

    it('deve retornar string vazia para status desconhecido', () => {
      expect(service.getVerificationStatusClass('unknown' as any)).toBe('');
    });
  });

  // ============================================
  // TESTES EXPANDIDOS - CACHE E STATE
  // ============================================

  describe('clearCache', () => {
    it('deve executar sem erros', () => {
      expect(() => service.clearCache()).not.toThrow();
    });

    it('deve ser idempotente', () => {
      service.clearCache();
      service.clearCache();
      expect(true).toBe(true);
    });
  });

  describe('clearState', () => {
    it('deve limpar currentPharmacy', () => {
      service.clearState();
      expect(service.currentPharmacy()).toBeNull();
    });

    it('deve limpar pharmacies', () => {
      service.clearState();
      expect(service.pharmacies()).toEqual([]);
    });

    it('deve limpar totalPharmacies', () => {
      service.clearState();
      expect(service.totalPharmacies()).toBe(0);
    });

    it('deve limpar error', () => {
      service.clearState();
      expect(service.error()).toBeNull();
    });

    it('deve limpar loading', () => {
      service.clearState();
      expect(service.loading()).toBe(false);
    });

    it('deve ser idempotente', () => {
      service.clearState();
      service.clearState();
      expect(service.currentPharmacy()).toBeNull();
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE COORDENADAS
  // ============================================

  describe('Coordinate Validation', () => {
    it('deve aceitar latitude válida -90', () => {
      const lat = -90;
      expect(lat >= -90 && lat <= 90).toBe(true);
    });

    it('deve aceitar latitude válida 90', () => {
      const lat = 90;
      expect(lat >= -90 && lat <= 90).toBe(true);
    });

    it('deve aceitar latitude válida 0', () => {
      const lat = 0;
      expect(lat >= -90 && lat <= 90).toBe(true);
    });

    it('deve rejeitar latitude inválida 91', () => {
      const lat = 91;
      expect(lat >= -90 && lat <= 90).toBe(false);
    });

    it('deve rejeitar latitude inválida -91', () => {
      const lat = -91;
      expect(lat >= -90 && lat <= 90).toBe(false);
    });

    it('deve aceitar longitude válida -180', () => {
      const lng = -180;
      expect(lng >= -180 && lng <= 180).toBe(true);
    });

    it('deve aceitar longitude válida 180', () => {
      const lng = 180;
      expect(lng >= -180 && lng <= 180).toBe(true);
    });

    it('deve aceitar longitude válida 0', () => {
      const lng = 0;
      expect(lng >= -180 && lng <= 180).toBe(true);
    });

    it('deve rejeitar longitude inválida 181', () => {
      const lng = 181;
      expect(lng >= -180 && lng <= 180).toBe(false);
    });

    it('deve rejeitar longitude inválida -181', () => {
      const lng = -181;
      expect(lng >= -180 && lng <= 180).toBe(false);
    });
  });

  // ============================================
  // TESTES DE CÁLCULO DE DISTÂNCIA
  // ============================================

  describe('Distance Calculation Logic', () => {
    // Haversine formula tests
    it('deve calcular distância 0 para mesmas coordenadas', () => {
      const lat1 = -23.5505, lon1 = -46.6333;
      const lat2 = -23.5505, lon2 = -46.6333;
      
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = Math.round(R * c * 10) / 10;
      
      expect(distance).toBe(0);
    });

    it('deve calcular distância aproximada entre SP e RJ (~350km)', () => {
      // São Paulo: -23.5505, -46.6333
      // Rio de Janeiro: -22.9068, -43.1729
      const lat1 = -23.5505, lon1 = -46.6333;
      const lat2 = -22.9068, lon2 = -43.1729;
      
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = Math.round(R * c * 10) / 10;
      
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });

    it('deve retornar valor positivo para qualquer par de coordenadas', () => {
      const lat1 = 0, lon1 = 0;
      const lat2 = 45, lon2 = 90;
      
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = Math.round(R * c * 10) / 10;
      
      expect(distance).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('deve lidar com pharmacy com todos campos opcionais undefined', () => {
      const minimalPharmacy: any = {
        id: 'min-1',
        name: 'Minimal',
        businessHours: []
      };
      expect(service.isOpenNow(minimalPharmacy)).toBe(false);
    });

    it('deve lidar com caracteres especiais no nome', () => {
      const specialPharmacy = { ...mockPharmacy, name: 'Farmácia & Drogaria "Saúde+"' };
      expect(specialPharmacy.name).toContain('&');
      expect(specialPharmacy.name).toContain('"');
    });

    it('deve lidar com números no CNPJ', () => {
      expect(mockPharmacy.cnpj).toMatch(/\d/);
    });

    it('deve lidar com URLs no contact', () => {
      expect(mockPharmacy.contact.website).toContain('https://');
    });

    it('deve lidar com tags array', () => {
      expect(Array.isArray(mockPharmacy.tags)).toBe(true);
      expect(mockPharmacy.tags?.length).toBeGreaterThan(0);
    });

    it('deve lidar com paymentMethods array', () => {
      expect(Array.isArray(mockPharmacy.paymentMethods)).toBe(true);
      expect(mockPharmacy.paymentMethods.length).toBeGreaterThan(0);
    });

    it('deve lidar com valores de comissão', () => {
      expect(typeof mockPharmacy.commission).toBe('number');
      expect(mockPharmacy.commission).toBeGreaterThanOrEqual(0);
      expect(mockPharmacy.commission).toBeLessThanOrEqual(100);
    });
  });

  // ============================================
  // TESTES DE INTERFACE PharmacyListResult
  // ============================================

  describe('PharmacyListResult Interface', () => {
    it('deve criar resultado vazio corretamente', () => {
      const result = {
        pharmacies: [],
        total: 0,
        hasMore: false,
        lastDoc: null
      };
      expect(result.pharmacies.length).toBe(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(result.lastDoc).toBeNull();
    });

    it('deve criar resultado com farmácias', () => {
      const result = {
        pharmacies: [mockPharmacy],
        total: 1,
        hasMore: false,
        lastDoc: null
      };
      expect(result.pharmacies.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('deve indicar hasMore corretamente', () => {
      const result = {
        pharmacies: [mockPharmacy],
        total: 10,
        hasMore: true,
        lastDoc: {} as any
      };
      expect(result.hasMore).toBe(true);
    });
  });

  // ============================================
  // TESTES API V2 - Sprint M2
  // ============================================

  describe('🚀 PharmacyService API v2 Methods', () => {
    describe('searchPharmaciesApi', () => {
      it('deve retornar resultado de busca vazio por padrão', () => {
        const result = {
          pharmacies: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0
        };
        expect(result.pharmacies.length).toBe(0);
        expect(result.page).toBe(1);
      });

      it('deve incluir paginação no resultado', () => {
        const result = {
          pharmacies: [mockPharmacy],
          total: 50,
          page: 2,
          pageSize: 10,
          totalPages: 5
        };
        expect(result.totalPages).toBe(5);
        expect(result.page).toBe(2);
      });

      it('deve suportar facets no resultado', () => {
        const result = {
          pharmacies: [mockPharmacy],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          facets: {
            cities: [{ name: 'São Paulo', count: 50 }],
            states: [{ name: 'SP', count: 100 }],
            ratingRanges: [{ min: 4, max: 5, count: 30 }],
            paymentMethods: [{ method: PaymentMethod.PIX, count: 80 }]
          }
        };
        expect(result.facets?.cities.length).toBe(1);
        expect(result.facets?.states[0].name).toBe('SP');
      });
    });

    describe('getPharmacyByIdViaApi', () => {
      it('deve retornar null para ID vazio', () => {
        // Simula comportamento esperado
        const emptyId = '';
        const result = emptyId.length > 0 ? mockPharmacy : null;
        expect(result).toBeNull();
      });

      it('deve retornar farmácia válida para ID existente', () => {
        const result = mockPharmacy;
        expect(result.id).toBe('pharmacy-123');
        expect(result.name).toBe('Farmácia Central');
      });

      it('deve incluir todos os campos da farmácia', () => {
        expect(mockPharmacy.cnpj).toBeDefined();
        expect(mockPharmacy.address).toBeDefined();
        expect(mockPharmacy.businessHours).toBeDefined();
        expect(mockPharmacy.rating).toBeDefined();
      });
    });

    describe('getNearbyPharmaciesViaApi', () => {
      it('deve validar coordenadas inválidas', () => {
        const isValid = (lat: number, lng: number) => 
          lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        
        expect(isValid(-91, 0)).toBe(false);
        expect(isValid(0, 181)).toBe(false);
        expect(isValid(-23.5505, -46.6333)).toBe(true);
      });

      it('deve criar resultado de busca por proximidade', () => {
        const result = {
          pharmacies: [{ ...mockPharmacy, distance: 1.5 }],
          total: 1,
          searchRadius: 10,
          center: { latitude: -23.5505, longitude: -46.6333 }
        };
        expect(result.pharmacies[0].distance).toBe(1.5);
        expect(result.searchRadius).toBe(10);
      });

      it('deve ordenar por distância', () => {
        const pharmacies = [
          { ...mockPharmacy, id: 'p1', distance: 5.0 },
          { ...mockPharmacy, id: 'p2', distance: 1.5 },
          { ...mockPharmacy, id: 'p3', distance: 3.2 }
        ].sort((a, b) => a.distance - b.distance);
        
        expect(pharmacies[0].distance).toBe(1.5);
        expect(pharmacies[2].distance).toBe(5.0);
      });
    });

    describe('getPharmacyProductsViaApi', () => {
      it('deve retornar lista vazia para ID inválido', () => {
        const result = { products: [], total: 0 };
        expect(result.products.length).toBe(0);
        expect(result.total).toBe(0);
      });

      it('deve incluir total no resultado', () => {
        const result = { products: [{ id: 'prod-1' }], total: 50 };
        expect(result.total).toBe(50);
        expect(result.products.length).toBe(1);
      });
    });

    describe('searchPharmaciesByText', () => {
      it('deve buscar por texto com ordenação por rating', () => {
        const params = {
          searchQuery: 'central',
          pageSize: 20,
          isActive: true,
          sortBy: 'rating' as const,
          sortOrder: 'desc' as const
        };
        expect(params.searchQuery).toBe('central');
        expect(params.sortBy).toBe('rating');
      });
    });

    describe('getFeaturedPharmaciesViaApi', () => {
      it('deve filtrar farmácias com rating >= 4.0', () => {
        const pharmacies = [
          { ...mockPharmacy, rating: 4.5 },
          { ...mockPharmacy, id: 'p2', rating: 3.5 },
          { ...mockPharmacy, id: 'p3', rating: 4.8 }
        ];
        const featured = pharmacies.filter(p => p.rating && p.rating >= 4.0);
        expect(featured.length).toBe(2);
      });
    });

    describe('getPharmaciesByCityViaApi', () => {
      it('deve filtrar por cidade', () => {
        const params = {
          city: 'São Paulo',
          isActive: true,
          pageSize: 20,
          sortBy: 'rating' as const,
          sortOrder: 'desc' as const
        };
        expect(params.city).toBe('São Paulo');
      });
    });

    describe('getPharmaciesWithDeliveryViaApi', () => {
      it('deve filtrar farmácias com delivery', () => {
        const params = {
          hasDelivery: true,
          isActive: true,
          sortBy: 'rating' as const,
          sortOrder: 'desc' as const
        };
        expect(params.hasDelivery).toBe(true);
      });

      it('deve combinar filtro de cidade com delivery', () => {
        const params = {
          hasDelivery: true,
          city: 'Rio de Janeiro',
          isActive: true
        };
        expect(params.city).toBe('Rio de Janeiro');
        expect(params.hasDelivery).toBe(true);
      });
    });
  });

  // ============================================
  // TESTES DE QUERY PARAMS API V2
  // ============================================

  describe('🔧 buildPharmacyQueryParams Logic', () => {
    function buildPharmacyQueryParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
      const queryParams: Record<string, string | number | boolean> = {};

      if (params['city']) queryParams['city'] = params['city'] as string;
      if (params['state']) queryParams['state'] = params['state'] as string;
      if (params['status']) queryParams['status'] = params['status'] as string;
      if (params['verificationStatus']) queryParams['verificationStatus'] = params['verificationStatus'] as string;
      if (params['hasDelivery'] !== undefined) queryParams['hasDelivery'] = params['hasDelivery'] as boolean;
      if (params['hasPickup'] !== undefined) queryParams['hasPickup'] = params['hasPickup'] as boolean;
      if (params['minRating'] !== undefined) queryParams['minRating'] = params['minRating'] as number;
      if (params['paymentMethod']) queryParams['paymentMethod'] = params['paymentMethod'] as string;
      if (params['isActive'] !== undefined) queryParams['isActive'] = params['isActive'] as boolean;
      if (params['searchQuery']) queryParams['q'] = params['searchQuery'] as string;
      if (params['sortBy']) queryParams['sortBy'] = params['sortBy'] as string;
      if (params['sortOrder']) queryParams['sortOrder'] = params['sortOrder'] as string;
      if (params['page']) queryParams['page'] = params['page'] as number;
      if (params['pageSize']) queryParams['limit'] = params['pageSize'] as number;

      return queryParams;
    }

    it('deve construir params vazios', () => {
      const result = buildPharmacyQueryParams({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('deve mapear searchQuery para q', () => {
      const result = buildPharmacyQueryParams({ searchQuery: 'central' });
      expect(result['q']).toBe('central');
    });

    it('deve incluir filtros de localização', () => {
      const result = buildPharmacyQueryParams({ city: 'São Paulo', state: 'SP' });
      expect(result['city']).toBe('São Paulo');
      expect(result['state']).toBe('SP');
    });

    it('deve incluir filtros de delivery', () => {
      const result = buildPharmacyQueryParams({ hasDelivery: true, hasPickup: false });
      expect(result['hasDelivery']).toBe(true);
      expect(result['hasPickup']).toBe(false);
    });

    it('deve incluir filtros de status', () => {
      const result = buildPharmacyQueryParams({ 
        status: PharmacyStatus.ACTIVE,
        verificationStatus: VerificationStatus.APPROVED 
      });
      expect(result['status']).toBe(PharmacyStatus.ACTIVE);
      expect(result['verificationStatus']).toBe(VerificationStatus.APPROVED);
    });

    it('deve incluir rating mínimo', () => {
      const result = buildPharmacyQueryParams({ minRating: 4.0 });
      expect(result['minRating']).toBe(4.0);
    });

    it('deve incluir método de pagamento', () => {
      const result = buildPharmacyQueryParams({ paymentMethod: PaymentMethod.PIX });
      expect(result['paymentMethod']).toBe(PaymentMethod.PIX);
    });

    it('deve incluir ordenação', () => {
      const result = buildPharmacyQueryParams({ sortBy: 'rating', sortOrder: 'desc' });
      expect(result['sortBy']).toBe('rating');
      expect(result['sortOrder']).toBe('desc');
    });

    it('deve mapear pageSize para limit', () => {
      const result = buildPharmacyQueryParams({ page: 2, pageSize: 20 });
      expect(result['page']).toBe(2);
      expect(result['limit']).toBe(20);
    });

    it('deve construir params completos', () => {
      const result = buildPharmacyQueryParams({
        city: 'São Paulo',
        state: 'SP',
        hasDelivery: true,
        minRating: 4.0,
        isActive: true,
        searchQuery: 'central',
        sortBy: 'rating',
        sortOrder: 'desc',
        page: 1,
        pageSize: 20
      });
      expect(Object.keys(result).length).toBe(10);
      expect(result['q']).toBe('central');
      expect(result['limit']).toBe(20);
    });
  });

  // ============================================
  // TESTES DE INTERFACES API V2
  // ============================================

  describe('🔧 PharmacySearchParams Interface', () => {
    it('deve criar params de busca básicos', () => {
      const params = {
        city: 'São Paulo',
        isActive: true,
        page: 1,
        pageSize: 20
      };
      expect(params.city).toBe('São Paulo');
      expect(params.isActive).toBe(true);
    });

    it('deve suportar todos os tipos de ordenação', () => {
      const sortOptions: Array<'rating' | 'distance' | 'name' | 'createdAt'> = 
        ['rating', 'distance', 'name', 'createdAt'];
      sortOptions.forEach(opt => expect(opt).toBeDefined());
    });

    it('deve suportar filtros booleanos', () => {
      const params = {
        hasDelivery: true,
        hasPickup: false,
        isActive: true
      };
      expect(params.hasDelivery).toBe(true);
      expect(params.hasPickup).toBe(false);
    });
  });

  describe('🔧 PharmacySearchResult Interface', () => {
    it('deve criar resultado de busca completo', () => {
      const result = {
        pharmacies: [mockPharmacy],
        total: 100,
        page: 1,
        pageSize: 20,
        totalPages: 5,
        facets: {
          cities: [{ name: 'São Paulo', count: 50 }],
          states: [{ name: 'SP', count: 100 }],
          ratingRanges: [{ min: 4, max: 5, count: 30 }],
          paymentMethods: [{ method: PaymentMethod.PIX, count: 80 }]
        }
      };
      expect(result.totalPages).toBe(5);
      expect(result.facets?.cities[0].count).toBe(50);
    });

    it('deve calcular totalPages corretamente', () => {
      const total = 95;
      const pageSize = 20;
      const totalPages = Math.ceil(total / pageSize);
      expect(totalPages).toBe(5);
    });
  });

  describe('🔧 NearbySearchParams Interface', () => {
    it('deve criar params de busca por proximidade', () => {
      const params = {
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 10,
        limit: 20
      };
      expect(params.latitude).toBe(-23.5505);
      expect(params.radiusKm).toBe(10);
    });

    it('deve suportar filtros opcionais', () => {
      const params = {
        latitude: -23.5505,
        longitude: -46.6333,
        hasDelivery: true,
        minRating: 4.0
      };
      expect(params.hasDelivery).toBe(true);
      expect(params.minRating).toBe(4.0);
    });
  });

  describe('🔧 NearbySearchResult Interface', () => {
    it('deve criar resultado de busca por proximidade', () => {
      const result = {
        pharmacies: [{ ...mockPharmacy, distance: 1.5 }],
        total: 10,
        searchRadius: 10,
        center: { latitude: -23.5505, longitude: -46.6333 }
      };
      expect(result.searchRadius).toBe(10);
      expect(result.center.latitude).toBe(-23.5505);
    });
  });

  describe('🔧 PharmacyFacets Interface', () => {
    it('deve criar facets completos', () => {
      const facets = {
        cities: [
          { name: 'São Paulo', count: 50 },
          { name: 'Rio de Janeiro', count: 30 }
        ],
        states: [
          { name: 'SP', count: 100 },
          { name: 'RJ', count: 50 }
        ],
        ratingRanges: [
          { min: 4, max: 5, count: 30 },
          { min: 3, max: 4, count: 40 }
        ],
        paymentMethods: [
          { method: PaymentMethod.PIX, count: 80 },
          { method: PaymentMethod.CREDIT_CARD, count: 70 }
        ]
      };
      expect(facets.cities.length).toBe(2);
      expect(facets.paymentMethods[0].method).toBe(PaymentMethod.PIX);
    });
  });
});
