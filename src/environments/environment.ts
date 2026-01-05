/**
 * 🌍 Environment Configuration - Development
 * Configuração de ambiente de desenvolvimento para o Marketplace
 */

export const environment = {
  production: false,
  appName: 'Medicamenta.me Marketplace',
  appVersion: '1.0.0',
  subdomain: 'marketplace',
  
  // API URL (para IntegrationService)
  apiUrl: 'http://localhost:5001/medicamenta-me/us-central1/api',
  
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
    baseUrl: 'http://localhost:5001/medicamenta-me/us-central1/api',
    timeout: 30000
  },
  
  // Payment Gateways
  stripe: {
    publishableKey: 'pk_test_YOUR_STRIPE_TEST_KEY',
    apiVersion: '2023-10-16'
  },
  
  pagSeguro: {
    publicKey: 'YOUR_PAGSEGURO_SANDBOX_KEY',
    sandbox: true
  },
  
  // Google Maps (para geolocalização)
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
  },
  
  // Features flags
  features: {
    enablePrescriptionUpload: true,
    enableReviews: true,
    enableChat: false,
    enableLoyaltyProgram: false,
    enableInAppPurchases: false
  },
  
  // Limits
  limits: {
    maxCartItems: 50,
    maxPrescriptionImages: 5,
    maxReviewImages: 3,
    prescriptionImageMaxSize: 5 * 1024 * 1024, // 5MB
    reviewImageMaxSize: 2 * 1024 * 1024,       // 2MB
    cartExpirationDays: 7
  },
  
  // Delivery
  delivery: {
    defaultFee: 500,                    // R$ 5,00
    freeDeliveryMinimum: 5000,          // R$ 50,00
    defaultEstimatedTime: '30-60 minutos'
  },
  
  // Commission
  commission: {
    defaultRate: 0.15                   // 15% comissão padrão
  }
};
