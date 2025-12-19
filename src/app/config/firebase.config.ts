/**
 * 🔥 Firebase Configuration
 * Configuração do Firebase para o Marketplace
 */

export const firebaseConfig = {
  production: {
    apiKey: 'YOUR_PRODUCTION_API_KEY',
    authDomain: 'medicamenta-me.firebaseapp.com',
    projectId: 'medicamenta-me',
    storageBucket: 'medicamenta-me.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID'
  },
  development: {
    apiKey: 'YOUR_DEV_API_KEY',
    authDomain: 'medicamenta-me-dev.firebaseapp.com',
    projectId: 'medicamenta-me-dev',
    storageBucket: 'medicamenta-me-dev.appspot.com',
    messagingSenderId: 'YOUR_DEV_MESSAGING_SENDER_ID',
    appId: 'YOUR_DEV_APP_ID',
    measurementId: 'YOUR_DEV_MEASUREMENT_ID'
  }
};
