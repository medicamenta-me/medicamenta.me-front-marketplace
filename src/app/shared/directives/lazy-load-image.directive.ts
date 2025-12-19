/**
 * 🖼️ Lazy Load Image Directive
 * 
 * Carrega imagens de forma lazy usando Intersection Observer
 */

import { Directive, ElementRef, Input, OnInit, inject, OnDestroy } from '@angular/core';

@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad = '';
  @Input() fallbackImage = 'assets/placeholder.png';

  private readonly el = inject(ElementRef);
  private intersectionObserver?: IntersectionObserver;

  ngOnInit(): void {
    // Define imagem placeholder
    this.el.nativeElement.src = this.fallbackImage;

    // Cria Intersection Observer
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage();
        }
      });
    });

    // Observa o elemento
    this.intersectionObserver.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  /**
   * Carrega a imagem real
   */
  private loadImage(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    const src = this.appLazyLoad || this.fallbackImage;

    // Cria nova imagem para pré-carregar
    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      this.disconnectObserver();
    };

    tempImg.onerror = () => {
      img.src = this.fallbackImage;
      img.classList.add('error');
      this.disconnectObserver();
    };

    tempImg.src = src;
  }

  /**
   * Desconecta observer após carregar
   */
  private disconnectObserver(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }
}
