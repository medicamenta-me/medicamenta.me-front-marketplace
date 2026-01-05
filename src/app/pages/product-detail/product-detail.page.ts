/**
 * 🔍 Product Detail Page
 * Página de detalhes do produto com galeria de imagens e add to cart
 */

import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductService } from '../../core/services/product.service';
import { Product, ProductCategory } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatBadgeModule,
    MatChipsModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    ProductCardComponent
  ],
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss']
})
export class ProductDetailPage implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Expose Object for template
  readonly Object = Object;

  // State
  product = signal<Product | null>(null);
  selectedImage = signal<string>('');
  quantity = signal(1);
  isLoading = signal(false);
  relatedProducts = signal<Product[]>([]);
  
  // Computed
  totalPrice = computed(() => {
    const product = this.product();
    if (!product) return 0;
    return product.price * this.quantity();
  });

  discountedPrice = computed(() => {
    const product = this.product();
    if (!product?.discount) return null;
    return product.price * (1 - product.discount / 100);
  });

  inStock = computed(() => {
    const product = this.product();
    return product ? product.stock > 0 : false;
  });

  canAddToCart = computed(() => {
    const product = this.product();
    if (!product) return false;
    return product.stock >= this.quantity();
  });

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const productId = params['id'];
        if (productId) {
          this.loadProduct(productId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 📦 Carrega produto por ID
   */
  async loadProduct(productId: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const product = await firstValueFrom(
        this.productService.getProductById(productId)
      );

      if (product) {
        this.product.set(product);
        this.selectedImage.set(this.getPrimaryImage(product));
        await this.loadRelatedProducts(product.category);
      } else {
        // Produto não encontrado
        this.router.navigate(['/products']);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      this.router.navigate(['/products']);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * 🔗 Carrega produtos relacionados
   */
  async loadRelatedProducts(category: ProductCategory): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.productService.getProducts({ category }, { field: 'rating', direction: 'desc' }, 6)
      );

      if (result) {
        // Remove o produto atual da lista
        const filtered = result.products.filter(p => p.id !== this.product()?.id);
        this.relatedProducts.set(filtered.slice(0, 4));
      }
    } catch (error) {
      console.error('Erro ao carregar produtos relacionados:', error);
    }
  }

  /**
   * 🖼️ Seleciona imagem da galeria
   */
  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  /**
   * ➕ Incrementa quantidade
   */
  incrementQuantity(): void {
    const product = this.product();
    if (!product) return;

    const newQuantity = this.quantity() + 1;
    if (newQuantity <= product.stock) {
      this.quantity.set(newQuantity);
    }
  }

  /**
   * ➖ Decrementa quantidade
   */
  decrementQuantity(): void {
    const current = this.quantity();
    if (current > 1) {
      this.quantity.set(current - 1);
    }
  }

  /**
   * 🛒 Adiciona ao carrinho
   */
  addToCart(): void {
    const product = this.product();
    if (!product || !this.canAddToCart()) return;

    // TODO: Implementar integração com CartService
    console.log('Add to cart:', {
      productId: product.id,
      quantity: this.quantity(),
      total: this.totalPrice()
    });

    // Mostrar feedback visual
    alert(`${product.name} adicionado ao carrinho!`);
  }

  /**
   * 🛍️ Comprar agora (checkout direto)
   */
  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/cart']);
  }

  /**
   * ⭐ Gera array de estrelas para rating
   */
  getRatingStars(): { filled: boolean }[] {
    const product = this.product();
    if (!product) return [];

    const rating = Math.round(product.rating);
    return Array(5).fill(null).map((_, index) => ({
      filled: index < rating
    }));
  }

  /**
   * 🖼️ Obtém imagem principal
   */
  getPrimaryImage(product: Product): string {
    return product.images[0] || 'assets/placeholder-product.png';
  }

  /**
   * 💰 Formata preço em centavos para reais
   */
  formatPrice(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * 📝 Obtém label da categoria
   */
  getCategoryLabel(category: ProductCategory): string {
    const labels: Record<ProductCategory, string> = {
      [ProductCategory.ANALGESICS]: 'Analgésicos',
      [ProductCategory.ANTIBIOTICS]: 'Antibióticos',
      [ProductCategory.ANTIHISTAMINES]: 'Antialérgicos',
      [ProductCategory.ANTIHYPERTENSIVES]: 'Anti-hipertensivos',
      [ProductCategory.CARDIOVASCULAR]: 'Cardiovasculares',
      [ProductCategory.DERMATOLOGICALS]: 'Dermatológicos',
      [ProductCategory.DIABETES]: 'Diabetes',
      [ProductCategory.DIGESTIVE]: 'Digestivo',
      [ProductCategory.SUPPLEMENTS]: 'Suplementos',
      [ProductCategory.VITAMINS]: 'Vitaminas',
      [ProductCategory.PEDIATRICS]: 'Pediátricos',
      [ProductCategory.WOMEN_HEALTH]: 'Saúde da Mulher',
      [ProductCategory.MEDICAL_DEVICES]: 'Dispositivos Médicos'
    };
    return labels[category] || category;
  }

  /**
   * 🔙 Voltar para lista
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }

  /**
   * 🎯 Navega para produto relacionado
   */
  goToRelatedProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }
}
