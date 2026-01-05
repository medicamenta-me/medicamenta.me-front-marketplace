/**
 * 🧪 Checkout Page Tests
 * Testes unitários para a página de checkout
 * 
 * Cenários:
 * - Navegação de steps
 * - Validação de endereço
 * - Seleção de pagamento
 * - Upload de receita
 * - Confirmação de pedido
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { CheckoutPage } from './checkout.page';
import { CartService } from '../../core/services/cart.service';
import { CheckoutService, CHECKOUT_CONFIG, PAYMENT_METHODS, CheckoutResult } from '../../core/services/checkout.service';
import { Cart, CartSummary } from '../../models/cart.model';

describe('CheckoutPage', () => {
  let component: CheckoutPage;
  let fixture: ComponentFixture<CheckoutPage>;
  let router: Router;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockCheckoutService: jasmine.SpyObj<CheckoutService>;

  // Signals
  let cartSignal: WritableSignal<Cart | null>;
  let processingSignal: WritableSignal<boolean>;

  const mockCart: Cart = {
    id: 'cart-123',
    userId: 'user-456',
    pharmacyId: 'pharmacy-789',
    items: [
      {
        productId: 'prod-1',
        product: { name: 'Dipirona 500mg', prescriptionRequired: false },
        quantity: 2,
        unitPrice: 1990,
        subtotal: 3980,
        total: 3980
      }
    ],
    subtotal: 3980,
    deliveryFee: 999,
    discount: 0,
    total: 4979,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCartWithPrescription: Cart = {
    ...mockCart,
    items: [
      {
        productId: 'prod-1',
        product: { name: 'Antibiótico', prescriptionRequired: true },
        quantity: 1,
        unitPrice: 5990,
        subtotal: 5990,
        total: 5990
      }
    ]
  };

  const mockSuccessResult: CheckoutResult = {
    success: true,
    orderId: 'order-123',
    orderNumber: 'ORD-2025-000001'
  };

  beforeEach(async () => {
    cartSignal = signal<Cart | null>(mockCart);
    processingSignal = signal<boolean>(false);

    const cartSummarySignal = signal<CartSummary | null>({
      itemCount: 2,
      subtotal: 3980,
      deliveryFee: 999,
      discount: 0,
      total: 4979,
      hasFreeDelivery: false
    });

    mockCartService = jasmine.createSpyObj('CartService', ['loadCart', 'clearCart'], {
      cart: cartSignal.asReadonly(),
      cartSummary: cartSummarySignal.asReadonly()
    });

    mockCheckoutService = jasmine.createSpyObj('CheckoutService', ['processCheckout', 'validateCheckout'], {
      processing: processingSignal.asReadonly()
    });

    mockCheckoutService.processCheckout.and.returnValue(of(mockSuccessResult));

    await TestBed.configureTestingModule({
      imports: [CheckoutPage, RouterTestingModule, ReactiveFormsModule, FormsModule]
    })
    .overrideComponent(CheckoutPage, {
      set: {
        providers: [
          { provide: CartService, useValue: mockCartService },
          { provide: CheckoutService, useValue: mockCheckoutService }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  // ============================================
  // TESTES DE INICIALIZAÇÃO
  // ============================================

  describe('Initialization', () => {
    it('deve criar o componente', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('deve iniciar no step 1', () => {
      fixture.detectChanges();
      expect(component.currentStep()).toBe(1);
    });

    it('deve iniciar com delivery type "delivery"', () => {
      fixture.detectChanges();
      expect(component.deliveryType()).toBe('delivery');
    });

    it('deve iniciar sem método de pagamento selecionado', () => {
      fixture.detectChanges();
      expect(component.selectedPaymentMethod()).toBeNull();
    });

    it('deve ter 4 steps definidos', () => {
      expect(component.steps.length).toBe(4);
    });

    it('deve ter 4 métodos de pagamento', () => {
      expect(component.paymentMethods.length).toBe(4);
    });

    it('deve redirecionar se carrinho vazio', () => {
      cartSignal.set(null);
      spyOn(router, 'navigate');
      fixture.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/cart']);
    });

    it('deve redirecionar se carrinho sem items', () => {
      cartSignal.set({ ...mockCart, items: [] });
      spyOn(router, 'navigate');
      fixture.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/cart']);
    });
  });

  // ============================================
  // TESTES DE NAVEGAÇÃO DE STEPS
  // ============================================

  describe('Step Navigation', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('deve avançar para próximo step', () => {
      component.deliveryType.set('pickup'); // Para não precisar validar form
      component.nextStep();
      expect(component.currentStep()).toBe(2);
    });

    it('não deve avançar além do step 4', () => {
      component.currentStep.set(4);
      component.nextStep();
      expect(component.currentStep()).toBe(4);
    });

    it('deve voltar para step anterior', () => {
      component.currentStep.set(3);
      component.previousStep();
      expect(component.currentStep()).toBe(2);
    });

    it('não deve voltar antes do step 1', () => {
      component.currentStep.set(1);
      component.previousStep();
      expect(component.currentStep()).toBe(1);
    });
  });

  // ============================================
  // TESTES DE TIPO DE ENTREGA
  // ============================================

  describe('Delivery Type', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('deve alternar para pickup', () => {
      component.setDeliveryType('pickup');
      expect(component.deliveryType()).toBe('pickup');
    });

    it('deve alternar para delivery', () => {
      component.setDeliveryType('pickup');
      component.setDeliveryType('delivery');
      expect(component.deliveryType()).toBe('delivery');
    });

    it('deve permitir avançar com pickup sem form válido', () => {
      component.setDeliveryType('pickup');
      expect(component.canProceedToStep2()).toBe(true);
    });

    it('não deve permitir avançar com delivery sem form válido', () => {
      component.setDeliveryType('delivery');
      expect(component.canProceedToStep2()).toBe(false);
    });
  });

  // ============================================
  // TESTES DE FORMULÁRIO DE ENDEREÇO
  // ============================================

  describe('Address Form', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('deve inicializar form vazio', () => {
      expect(component.addressForm.valid).toBe(false);
    });

    it('deve validar campos obrigatórios', () => {
      const controls = component.addressForm.controls;
      expect(controls['recipientName'].hasError('required')).toBe(true);
      expect(controls['phone'].hasError('required')).toBe(true);
      expect(controls['zipCode'].hasError('required')).toBe(true);
      expect(controls['street'].hasError('required')).toBe(true);
      expect(controls['number'].hasError('required')).toBe(true);
    });

    it('deve aceitar form válido', () => {
      component.addressForm.patchValue({
        recipientName: 'João Silva',
        phone: '11987654321',
        zipCode: '01234567',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
      });
      expect(component.addressForm.valid).toBe(true);
    });

    it('deve rejeitar nome curto', () => {
      component.addressForm.patchValue({ recipientName: 'AB' });
      expect(component.addressForm.controls['recipientName'].hasError('minlength')).toBe(true);
    });

    it('deve rejeitar CEP inválido', () => {
      component.addressForm.patchValue({ zipCode: '123' });
      expect(component.addressForm.controls['zipCode'].hasError('pattern')).toBe(true);
    });

    it('deve aceitar CEP com hífen', () => {
      component.addressForm.patchValue({ zipCode: '01234-567' });
      expect(component.addressForm.controls['zipCode'].hasError('pattern')).toBe(false);
    });

    it('deve rejeitar estado com 3 letras', () => {
      component.addressForm.patchValue({ state: 'SPA' });
      expect(component.addressForm.controls['state'].hasError('pattern')).toBe(true);
    });

    it('deve aceitar estado com 2 letras', () => {
      component.addressForm.patchValue({ state: 'SP' });
      expect(component.addressForm.controls['state'].hasError('pattern')).toBe(false);
    });

    it('getAddressData deve retornar null se form inválido', () => {
      expect(component.getAddressData()).toBeNull();
    });

    it('getAddressData deve retornar dados se form válido', () => {
      component.addressForm.patchValue({
        recipientName: 'João Silva',
        phone: '11987654321',
        zipCode: '01234567',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
      });
      const data = component.getAddressData();
      expect(data).toBeTruthy();
      expect(data?.recipientName).toBe('João Silva');
    });
  });

  // ============================================
  // TESTES DE MÉTODO DE PAGAMENTO
  // ============================================

  describe('Payment Method', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('deve selecionar método de pagamento', () => {
      component.selectPaymentMethod(PAYMENT_METHODS.PIX);
      expect(component.selectedPaymentMethod()).toBe('pix');
    });

    it('deve trocar método de pagamento', () => {
      component.selectPaymentMethod(PAYMENT_METHODS.PIX);
      component.selectPaymentMethod(PAYMENT_METHODS.CREDIT_CARD);
      expect(component.selectedPaymentMethod()).toBe('credit_card');
    });

    it('getSelectedPaymentMethodName deve retornar nome correto', () => {
      component.selectPaymentMethod(PAYMENT_METHODS.BOLETO);
      expect(component.getSelectedPaymentMethodName()).toBe('Boleto');
    });

    it('getSelectedPaymentMethodName deve retornar vazio se não selecionado', () => {
      expect(component.getSelectedPaymentMethodName()).toBe('');
    });
  });

  // ============================================
  // TESTES DE RECEITA MÉDICA
  // ============================================

  describe('Prescription', () => {
    it('requiresPrescription deve ser false sem itens com receita', () => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
      expect(component.requiresPrescription()).toBe(false);
    });

    it('requiresPrescription deve ser true com itens com receita', () => {
      cartSignal.set(mockCartWithPrescription);
      fixture.detectChanges();
      expect(component.requiresPrescription()).toBe(true);
    });

    it('deve iniciar sem imagens de receita', () => {
      fixture.detectChanges();
      expect(component.prescriptionImages().length).toBe(0);
    });

    it('deve remover imagem de receita', () => {
      fixture.detectChanges();
      component.prescriptionImages.set(['img1', 'img2', 'img3']);
      component.removePrescriptionImage(1);
      expect(component.prescriptionImages()).toEqual(['img1', 'img3']);
    });

    it('deve ignorar upload sem arquivos selecionados', () => {
      cartSignal.set(mockCartWithPrescription);
      fixture.detectChanges();
      
      const event = { target: { files: null } } as unknown as Event;
      component.onPrescriptionUpload(event);
      
      expect(component.prescriptionImages().length).toBe(0);
    });

    it('deve limitar número de imagens ao máximo configurado', () => {
      cartSignal.set(mockCartWithPrescription);
      fixture.detectChanges();
      
      const maxImages = component.CHECKOUT_CONFIG.MAX_PRESCRIPTION_IMAGES;
      
      // Adicionar imagens até o limite
      const images: string[] = [];
      for (let i = 0; i < maxImages; i++) {
        images.push(`img${i + 1}`);
      }
      component.prescriptionImages.set(images);
      
      // Verificar que está no limite
      expect(component.prescriptionImages().length).toBe(maxImages);
      
      // Ao tentar fazer upload quando já está no limite, o método calcula remaining = 0
      // e files.slice(0, 0) retorna array vazio, então nenhuma imagem é adicionada
      const mockFile = new File([''], 'prescription.jpg', { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      
      const event = { target: { files: dataTransfer.files } } as unknown as Event;
      component.onPrescriptionUpload(event);
      
      // Deve continuar no limite
      expect(component.prescriptionImages().length).toBe(maxImages);
    });

    it('deve remover primeira imagem corretamente', () => {
      fixture.detectChanges();
      component.prescriptionImages.set(['img1', 'img2', 'img3']);
      component.removePrescriptionImage(0);
      expect(component.prescriptionImages()).toEqual(['img2', 'img3']);
    });

    it('deve remover última imagem corretamente', () => {
      fixture.detectChanges();
      component.prescriptionImages.set(['img1', 'img2', 'img3']);
      component.removePrescriptionImage(2);
      expect(component.prescriptionImages()).toEqual(['img1', 'img2']);
    });

    it('requiresPrescription deve retornar false quando cart é null', () => {
      cartSignal.set(null);
      fixture.detectChanges();
      expect(component.requiresPrescription()).toBe(false);
    });
  });

  // ============================================
  // TESTES DE CONFIRMAÇÃO
  // ============================================

  describe('Order Confirmation', () => {
    beforeEach(() => {
      // Garantir que o carrinho tem dados
      cartSignal.set(mockCart);
      fixture.detectChanges();
      // Setup para chegar ao step 4
      component.setDeliveryType('pickup');
      component.selectPaymentMethod(PAYMENT_METHODS.PIX);
      component.currentStep.set(4);
    });

    it('deve chamar processCheckout ao confirmar', fakeAsync(() => {
      // Verificar que o cart está disponível
      expect(component.cart()).toBeTruthy();
      spyOn(router, 'navigate');
      component.confirmOrder();
      tick();
      expect(mockCheckoutService.processCheckout).toHaveBeenCalled();
    }));

    it('deve navegar para confirmação em caso de sucesso', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.confirmOrder();
      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/order-confirmation', 'order-123']);
    }));

    it('deve alertar em caso de erro', fakeAsync(() => {
      mockCheckoutService.processCheckout.and.returnValue(of({
        success: false,
        errorMessage: 'Erro de teste'
      }));
      spyOn(window, 'alert');
      component.confirmOrder();
      tick();
      expect(window.alert).toHaveBeenCalledWith('Erro de teste');
    }));

    it('deve alertar em caso de exception', fakeAsync(() => {
      mockCheckoutService.processCheckout.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(window, 'alert');
      component.confirmOrder();
      tick();
      expect(window.alert).toHaveBeenCalledWith('Erro ao processar pedido. Tente novamente.');
    }));

    it('deve incluir endereço quando delivery', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.setDeliveryType('delivery');
      component.addressForm.patchValue({
        recipientName: 'João Silva',
        phone: '11987654321',
        zipCode: '01234567',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
      });
      component.confirmOrder();
      tick();
      
      const callArgs = mockCheckoutService.processCheckout.calls.mostRecent().args;
      expect(callArgs[1].deliveryAddress).toBeTruthy();
    }));

    it('não deve incluir endereço quando pickup', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.setDeliveryType('pickup');
      component.confirmOrder();
      tick();
      
      const callArgs = mockCheckoutService.processCheckout.calls.mostRecent().args;
      expect(callArgs[1].deliveryAddress).toBeUndefined();
    }));

    it('deve incluir notas quando preenchidas', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.orderNotes = 'Entregar na portaria';
      component.confirmOrder();
      tick();
      
      const callArgs = mockCheckoutService.processCheckout.calls.mostRecent().args;
      expect(callArgs[1].notes).toBe('Entregar na portaria');
    }));

    it('deve alertar quando carrinho vazio ao confirmar', fakeAsync(() => {
      spyOn(window, 'alert');
      cartSignal.set(null);
      fixture.detectChanges();
      component.confirmOrder();
      tick();
      expect(window.alert).toHaveBeenCalledWith('Carrinho vazio');
      expect(mockCheckoutService.processCheckout).not.toHaveBeenCalled();
    }));

    it('deve alertar erro genérico quando result.errorMessage é undefined', fakeAsync(() => {
      mockCheckoutService.processCheckout.and.returnValue(of({
        success: false
      }));
      spyOn(window, 'alert');
      component.confirmOrder();
      tick();
      expect(window.alert).toHaveBeenCalledWith('Erro ao processar pedido');
    }));

    it('deve logar erro no console em caso de exception', fakeAsync(() => {
      mockCheckoutService.processCheckout.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');
      spyOn(window, 'alert');
      component.confirmOrder();
      tick();
      expect(console.error).toHaveBeenCalled();
    }));

    it('deve não incluir notes quando vazio', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.orderNotes = '';
      component.confirmOrder();
      tick();
      
      const callArgs = mockCheckoutService.processCheckout.calls.mostRecent().args;
      expect(callArgs[1].notes).toBeUndefined();
    }));
  });

  // ============================================
  // TESTES DE FORMATAÇÃO
  // ============================================

  describe('Currency Formatting', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('deve formatar valor em centavos', () => {
      const result = component.formatCurrency(1990);
      expect(result).toContain('19,90');
      expect(result).toContain('R$');
    });

    it('deve formatar zero', () => {
      const result = component.formatCurrency(0);
      expect(result).toContain('0,00');
    });
  });

  // ============================================
  // TESTES DE UI
  // ============================================

  describe('UI Elements', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('deve exibir header com título', () => {
      const header = fixture.nativeElement.querySelector('.checkout-header h1');
      expect(header.textContent).toContain('Finalizar Compra');
    });

    it('deve exibir link para voltar ao carrinho', () => {
      const backLink = fixture.nativeElement.querySelector('.back-link');
      expect(backLink).toBeTruthy();
    });

    it('deve exibir indicador de steps', () => {
      const steps = fixture.nativeElement.querySelectorAll('.step');
      expect(steps.length).toBe(4);
    });

    it('deve marcar step atual como ativo', () => {
      const activeStep = fixture.nativeElement.querySelector('.step.active');
      expect(activeStep).toBeTruthy();
    });

    it('deve exibir sidebar com resumo', () => {
      const sidebar = fixture.nativeElement.querySelector('.order-summary');
      expect(sidebar).toBeTruthy();
    });

    it('deve exibir itens no resumo', () => {
      const items = fixture.nativeElement.querySelectorAll('.summary-item');
      expect(items.length).toBe(1);
    });
  });

  // ============================================
  // TESTES DE ESTADO DE LOADING
  // ============================================

  describe('Loading State', () => {
    it('deve mostrar loading quando processing', () => {
      processingSignal.set(true);
      fixture.detectChanges();
      
      const loading = fixture.nativeElement.querySelector('app-loading-spinner');
      expect(loading).toBeTruthy();
    });

    it('não deve mostrar loading quando não processing', () => {
      processingSignal.set(false);
      fixture.detectChanges();
      
      const loading = fixture.nativeElement.querySelector('app-loading-spinner');
      expect(loading).toBeFalsy();
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO
  // ============================================

  describe('Validation', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('canProceedToStep2 deve verificar form para delivery', () => {
      component.setDeliveryType('delivery');
      expect(component.canProceedToStep2()).toBe(false);
      
      component.addressForm.patchValue({
        recipientName: 'João Silva',
        phone: '11987654321',
        zipCode: '01234567',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
      });
      expect(component.canProceedToStep2()).toBe(true);
    });

    it('canProceedToStep2 deve retornar true para pickup', () => {
      component.setDeliveryType('pickup');
      expect(component.canProceedToStep2()).toBe(true);
    });
  });

  // ============================================
  // TESTES DE EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    beforeEach(() => {
      cartSignal.set(mockCart);
      fixture.detectChanges();
    });

    it('deve lidar com múltiplos itens no carrinho', () => {
      const cartWithMultipleItems: Cart = {
        ...mockCart,
        items: [
          mockCart.items[0],
          {
            productId: 'prod-2',
            product: { name: 'Paracetamol 750mg', prescriptionRequired: false },
            quantity: 3,
            unitPrice: 590,
            subtotal: 1770,
            total: 1770
          }
        ]
      };
      cartSignal.set(cartWithMultipleItems);
      fixture.detectChanges();
      expect(component.cart()?.items.length).toBe(2);
    });

    it('deve formatar valores grandes de moeda', () => {
      const result = component.formatCurrency(10000000); // R$ 100.000,00
      expect(result).toContain('100.000');
    });

    it('deve formatar valores pequenos de moeda', () => {
      const result = component.formatCurrency(1); // R$ 0,01
      expect(result).toContain('0,01');
    });

    it('deve lidar com form parcialmente preenchido', () => {
      component.addressForm.patchValue({
        recipientName: 'João',
        phone: '11987654321'
      });
      expect(component.addressForm.valid).toBe(false);
      expect(component.getAddressData()).toBeNull();
    });

    it('deve selecionar todos os métodos de pagamento', () => {
      component.selectPaymentMethod(PAYMENT_METHODS.PIX);
      expect(component.selectedPaymentMethod()).toBe('pix');
      
      component.selectPaymentMethod(PAYMENT_METHODS.CREDIT_CARD);
      expect(component.selectedPaymentMethod()).toBe('credit_card');
      
      component.selectPaymentMethod(PAYMENT_METHODS.DEBIT_CARD);
      expect(component.selectedPaymentMethod()).toBe('debit_card');
      
      component.selectPaymentMethod(PAYMENT_METHODS.BOLETO);
      expect(component.selectedPaymentMethod()).toBe('boleto');
    });

    it('deve ter acesso ao CHECKOUT_CONFIG', () => {
      expect(component.CHECKOUT_CONFIG).toBeTruthy();
      expect(component.CHECKOUT_CONFIG.MAX_PRESCRIPTION_IMAGES).toBeDefined();
      expect(component.CHECKOUT_CONFIG.ALLOWED_IMAGE_TYPES).toBeDefined();
    });

    it('deve lidar com complemento no endereço', () => {
      component.addressForm.patchValue({
        recipientName: 'João Silva',
        phone: '11987654321',
        zipCode: '01234567',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
      });
      const data = component.getAddressData();
      expect(data?.complement).toBe('Apto 101');
    });

    it('deve validar telefone com diferentes formatos', () => {
      // Formato com parênteses e hífen
      component.addressForm.patchValue({ phone: '(11) 98765-4321' });
      expect(component.addressForm.controls['phone'].valid).toBe(true);
      
      // Formato sem formatação
      component.addressForm.patchValue({ phone: '11987654321' });
      expect(component.addressForm.controls['phone'].valid).toBe(true);
    });

    it('deve marcar step como completado após avançar', () => {
      component.setDeliveryType('pickup');
      component.nextStep();
      expect(component.currentStep()).toBe(2);
      // Step 1 deve estar completado (currentStep > 1)
    });

    it('deve permitir voltar e avançar novamente', () => {
      component.setDeliveryType('pickup');
      component.nextStep();
      component.nextStep();
      expect(component.currentStep()).toBe(3);
      
      component.previousStep();
      expect(component.currentStep()).toBe(2);
      
      component.nextStep();
      expect(component.currentStep()).toBe(3);
    });

    it('não deve avançar se delivery sem endereço válido', () => {
      component.setDeliveryType('delivery');
      expect(component.canProceedToStep2()).toBe(false);
    });
  });
});
