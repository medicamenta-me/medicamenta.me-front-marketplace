/**
 * 🦶 Footer Component
 * 
 * Rodapé com:
 * - Links importantes
 * - Redes sociais
 * - Informações legais
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  footerLinks = {
    company: [
      { label: 'Sobre nós', route: '/about' },
      { label: 'Como funciona', route: '/how-it-works' },
      { label: 'Contato', route: '/contact' }
    ],
    support: [
      { label: 'Central de Ajuda', route: '/help' },
      { label: 'Perguntas Frequentes', route: '/faq' },
      { label: 'Termos de Uso', route: '/terms' },
      { label: 'Política de Privacidade', route: '/privacy' }
    ],
    pharmacy: [
      { label: 'Seja um Parceiro', route: '/partner' },
      { label: 'Para Farmácias', route: '/for-pharmacies' }
    ]
  };

  socialLinks = [
    { name: 'Instagram', url: 'https://instagram.com/medicamenta.me', icon: '📷' },
    { name: 'Facebook', url: 'https://facebook.com/medicamenta.me', icon: '📘' },
    { name: 'Twitter', url: 'https://twitter.com/medicamenta_me', icon: '🐦' }
  ];
}
