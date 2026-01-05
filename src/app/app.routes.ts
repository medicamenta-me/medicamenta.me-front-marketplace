import { Routes } from '@angular/router';
import { pharmacyGuard } from './core/guards/pharmacy.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/product-list/product-list.page').then(m => m.ProductListPage)
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage)
  },
  {
    path: 'order-confirmation/:orderId',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation.page').then(m => m.OrderConfirmationPage)
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/order-history/order-history.page').then(m => m.OrderHistoryPage)
  },
  {
    path: 'orders/:orderId',
    loadComponent: () => import('./pages/order-detail/order-detail.page').then(m => m.OrderDetailPage)
  },
  // Pharmacies (public)
  {
    path: 'pharmacies',
    loadComponent: () => import('./pages/pharmacy-list/pharmacy-list.page').then(m => m.PharmacyListPage)
  },
  {
    path: 'pharmacies/:id',
    loadComponent: () => import('./pages/pharmacy-detail/pharmacy-detail.page').then(m => m.PharmacyDetailPage)
  },
  // Pharmacy Panel (protected - pharmacy owners only)
  {
    path: 'pharmacy',
    canActivate: [pharmacyGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/pharmacy-dashboard/pharmacy-dashboard.page').then(m => m.PharmacyDashboardPage)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/product-management/product-management.page').then(m => m.ProductManagementPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/order-management/order-management.page').then(m => m.OrderManagementPage)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/pharmacy-analytics/pharmacy-analytics.page').then(m => m.PharmacyAnalyticsPage)
      }
    ]
  },
  // Reviews
  {
    path: 'reviews',
    loadComponent: () => import('./pages/reviews/review-list/review-list.page').then(m => m.ReviewListPage)
  },
  {
    path: 'reviews/new',
    loadComponent: () => import('./pages/reviews/review-form/review-form.page').then(m => m.ReviewFormPage)
  },
  {
    path: 'reviews/edit/:id',
    loadComponent: () => import('./pages/reviews/review-form/review-form.page').then(m => m.ReviewFormPage)
  }
];
