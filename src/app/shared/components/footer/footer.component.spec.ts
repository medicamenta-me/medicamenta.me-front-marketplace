/**
 * 🧪 Footer Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('✅ Criação e Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter o ano atual', () => {
      const currentYear = new Date().getFullYear();
      expect(component.currentYear).toBe(currentYear);
    });
  });

  describe('✅ Links da Empresa', () => {
    it('deve ter links da empresa', () => {
      expect(component.footerLinks.company.length).toBeGreaterThan(0);
      expect(component.footerLinks.company[0].label).toBe('Sobre nós');
    });

    it('deve ter link "Sobre nós" com rota correta', () => {
      const aboutLink = component.footerLinks.company[0];
      expect(aboutLink.label).toBe('Sobre nós');
      expect(aboutLink.route).toBe('/about');
    });

    it('deve ter link "Como funciona" com rota correta', () => {
      const howItWorksLink = component.footerLinks.company[1];
      expect(howItWorksLink.label).toBe('Como funciona');
      expect(howItWorksLink.route).toBe('/how-it-works');
    });

    it('deve ter link "Contato" com rota correta', () => {
      const contactLink = component.footerLinks.company[2];
      expect(contactLink.label).toBe('Contato');
      expect(contactLink.route).toBe('/contact');
    });

    it('deve ter exatamente 3 links de empresa', () => {
      expect(component.footerLinks.company.length).toBe(3);
    });
  });

  describe('✅ Links de Suporte', () => {
    it('deve ter links de suporte', () => {
      expect(component.footerLinks.support.length).toBeGreaterThan(0);
      expect(component.footerLinks.support[0].label).toBe('Central de Ajuda');
    });

    it('deve ter link "Central de Ajuda" com rota correta', () => {
      const helpLink = component.footerLinks.support[0];
      expect(helpLink.label).toBe('Central de Ajuda');
      expect(helpLink.route).toBe('/help');
    });

    it('deve ter link "Perguntas Frequentes" com rota correta', () => {
      const faqLink = component.footerLinks.support[1];
      expect(faqLink.label).toBe('Perguntas Frequentes');
      expect(faqLink.route).toBe('/faq');
    });

    it('deve ter link "Termos de Uso" com rota correta', () => {
      const termsLink = component.footerLinks.support[2];
      expect(termsLink.label).toBe('Termos de Uso');
      expect(termsLink.route).toBe('/terms');
    });

    it('deve ter link "Política de Privacidade" com rota correta', () => {
      const privacyLink = component.footerLinks.support[3];
      expect(privacyLink.label).toBe('Política de Privacidade');
      expect(privacyLink.route).toBe('/privacy');
    });

    it('deve ter exatamente 4 links de suporte', () => {
      expect(component.footerLinks.support.length).toBe(4);
    });
  });

  describe('✅ Links para Farmácias', () => {
    it('deve ter links para farmácias', () => {
      expect(component.footerLinks.pharmacy.length).toBeGreaterThan(0);
      expect(component.footerLinks.pharmacy[0].label).toBe('Seja um Parceiro');
    });

    it('deve ter link "Seja um Parceiro" com rota correta', () => {
      const partnerLink = component.footerLinks.pharmacy[0];
      expect(partnerLink.label).toBe('Seja um Parceiro');
      expect(partnerLink.route).toBe('/partner');
    });

    it('deve ter link "Para Farmácias" com rota correta', () => {
      const forPharmaciesLink = component.footerLinks.pharmacy[1];
      expect(forPharmaciesLink.label).toBe('Para Farmácias');
      expect(forPharmaciesLink.route).toBe('/for-pharmacies');
    });

    it('deve ter exatamente 2 links de farmácia', () => {
      expect(component.footerLinks.pharmacy.length).toBe(2);
    });
  });

  describe('✅ Redes Sociais', () => {
    it('deve ter links de redes sociais', () => {
      expect(component.socialLinks.length).toBe(3);
      expect(component.socialLinks[0].name).toBe('Instagram');
    });

    it('deve ter link do Instagram com URL e ícone', () => {
      const instagramLink = component.socialLinks[0];
      expect(instagramLink.name).toBe('Instagram');
      expect(instagramLink.url).toBe('https://instagram.com/medicamenta.me');
      expect(instagramLink.icon).toBe('📷');
    });

    it('deve ter link do Facebook com URL e ícone', () => {
      const facebookLink = component.socialLinks[1];
      expect(facebookLink.name).toBe('Facebook');
      expect(facebookLink.url).toBe('https://facebook.com/medicamenta.me');
      expect(facebookLink.icon).toBe('📘');
    });

    it('deve ter link do Twitter com URL e ícone', () => {
      const twitterLink = component.socialLinks[2];
      expect(twitterLink.name).toBe('Twitter');
      expect(twitterLink.url).toBe('https://twitter.com/medicamenta_me');
      expect(twitterLink.icon).toBe('🐦');
    });

    it('deve ter exatamente 3 links de redes sociais', () => {
      expect(component.socialLinks.length).toBe(3);
    });

    it('todos os links sociais devem ter URL com https', () => {
      component.socialLinks.forEach(link => {
        expect(link.url.startsWith('https://')).toBe(true);
      });
    });
  });

  describe('✅ Renderização', () => {
    it('deve renderizar o componente', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled).toBeTruthy();
    });

    it('deve ter estrutura de footerLinks correta', () => {
      expect(component.footerLinks).toBeDefined();
      expect(component.footerLinks.company).toBeDefined();
      expect(component.footerLinks.support).toBeDefined();
      expect(component.footerLinks.pharmacy).toBeDefined();
    });

    it('deve ter socialLinks definido', () => {
      expect(component.socialLinks).toBeDefined();
      expect(Array.isArray(component.socialLinks)).toBe(true);
    });
  });
});
