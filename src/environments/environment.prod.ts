/**
 * 🌍 Environment Configuration - Production
 * Configuração de ambiente de produção para o Marketplace
 */

export const environment = {
  production: true,
  appName: 'Medicamenta.me Marketplace',
  appVersion: '1.0.0',
  subdomain: 'marketplace',
  
  // API URL (para IntegrationService)
  apiUrl: 'https://us-central1-medicamenta-me.cloudfunctions.net/api',
  
  // Firebase (COMPARTILHADO com todos os subdomínios)
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'medicamenta-me.firebaseapp.com',
    projectId: 'medicamenta-me',
    storageBucket: 'medicamenta-me.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID'
  },
  
  // API URLs (Backend Functions)
  api: {
    baseUrl: 'https://us-central1-medicamenta-me.cloudfunctions.net/api',
    timeout: 30000
  },
  
  // Payment Gateways
  stripe: {
    publishableKey: 'pk_live_YOUR_STRIPE_LIVE_KEY',
    apiVersion: '2023-10-16'
  },
  
  pagSeguro: {
    publicKey: 'YOUR_PAGSEGURO_PRODUCTION_KEY',
    sandbox: false
  },
  
  // Google Maps
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
  },
  
  // Features flags
  features: {
    enablePrescriptionUpload: true,
    enableReviews: true,
    enableChat: true,
    enableLoyaltyProgram: true,
    enableInAppPurchases: false
  },
  
  // Limits
  limits: {
    maxCartItems: 50,
    maxPrescriptionImages: 5,
    maxReviewImages: 3,
    prescriptionImageMaxSize: 5 * 1024 * 1024,
    reviewImageMaxSize: 2 * 1024 * 1024,
    cartExpirationDays: 7
  },
  
  // Delivery
  delivery: {
    defaultFee: 500,
    freeDeliveryMinimum: 5000,
    defaultEstimatedTime: '30-60 minutos'
  },
  
  // Commission
  commission: {
    defaultRate: 0.15
  }
};
