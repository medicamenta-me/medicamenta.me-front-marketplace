/**
 * 🧪 Footer Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter o ano atual', () => {
    const currentYear = new Date().getFullYear();
    expect(component.currentYear).toBe(currentYear);
  });

  it('deve ter links da empresa', () => {
    expect(component.footerLinks.company.length).toBeGreaterThan(0);
    expect(component.footerLinks.company[0].label).toBe('Sobre nós');
  });

  it('deve ter links de suporte', () => {
    expect(component.footerLinks.support.length).toBeGreaterThan(0);
    expect(component.footerLinks.support[0].label).toBe('Central de Ajuda');
  });

  it('deve ter links para farmácias', () => {
    expect(component.footerLinks.pharmacy.length).toBeGreaterThan(0);
    expect(component.footerLinks.pharmacy[0].label).toBe('Seja um Parceiro');
  });

  it('deve ter links de redes sociais', () => {
    expect(component.socialLinks.length).toBe(3);
    expect(component.socialLinks[0].name).toBe('Instagram');
  });
});
