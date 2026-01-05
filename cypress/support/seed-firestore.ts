/**
 * Firestore Test Data Seeding Script
 * 
 * This script seeds Firestore with test product data for Cypress E2E tests.
 * Run this before executing Cypress tests to ensure data exists.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { ProductCategory } from '../../src/app/models/product.model';

// Firebase configuration from environment variables
// Set these in your terminal before running the script:
// $env:FIREBASE_API_KEY="your-key"
// $env:FIREBASE_AUTH_DOMAIN="your-domain"
// $env:FIREBASE_PROJECT_ID="your-project-id"
// $env:FIREBASE_STORAGE_BUCKET="your-bucket"
// $env:FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
// $env:FIREBASE_APP_ID="your-app-id"

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Validate configuration
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.error('❌ ERROR: Firebase configuration not set!');
  console.error('Please set environment variables or update firebaseConfig in this file.');
  console.error('See FIREBASE-SETUP-GUIDE.md for instructions.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test products matching cypress/fixtures/products.json
const testProducts = [
  {
    id: 'dipirona-500mg',
    name: 'Dipirona Sódica 500mg',
    manufacturer: 'EMS',
    category: ProductCategory.ANALGESICS,
    price: 12.50,
    originalPrice: 13.89,
    discountPercentage: 10,
    stock: 100,
    description: 'Medicamento analgésico e antipirético para alívio de dores leves a moderadas e febre.',
    longDescription: 'A Dipirona Sódica 500mg é um medicamento amplamente utilizado para o tratamento de dores de cabeça, dores musculares, cólicas, dor de dente e febre. Seu princípio ativo age inibindo a produção de substâncias responsáveis pela dor e pela febre no organismo.',
    activeIngredient: 'Dipirona Sódica',
    dosage: '500mg',
    presentation: 'Caixa com 20 comprimidos',
    sku: 'DIP-500-EMS-20',
    ean: '7896004700123',
    requiresPrescription: false,
    anvisaRegistration: '1.0123.4567',
    images: [
      'https://via.placeholder.com/400x400/4CAF50/FFFFFF?text=Dipirona+500mg',
      'https://via.placeholder.com/400x400/66BB6A/FFFFFF?text=Dipirona+Bula'
    ],
    pharmacyId: 'pharmacy-001',
    pharmacyName: 'Farmácia Central',
    ratings: {
      average: 4.5,
      count: 124
    },
    tags: ['analgésico', 'antipirético', 'dor de cabeça', 'febre'],
    isActive: true,
    isFeatured: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: 'paracetamol-750mg',
    name: 'Paracetamol 750mg',
    manufacturer: 'Genérico',
    category: ProductCategory.ANALGESICS,
    price: 8.90,
    originalPrice: 8.90,
    discountPercentage: 0,
    stock: 50,
    description: 'Analgésico e antitérmico indicado para dores e febre.',
    longDescription: 'O Paracetamol 750mg é um medicamento analgésico e antitérmico eficaz no tratamento de dores leves a moderadas e febre. É bem tolerado e pode ser utilizado por adultos e crianças acima de 12 anos.',
    activeIngredient: 'Paracetamol',
    dosage: '750mg',
    presentation: 'Caixa com 10 comprimidos',
    sku: 'PAR-750-GEN-10',
    ean: '7896004700234',
    requiresPrescription: false,
    anvisaRegistration: '1.0234.5678',
    images: [
      'https://via.placeholder.com/400x400/2196F3/FFFFFF?text=Paracetamol+750mg'
    ],
    pharmacyId: 'pharmacy-001',
    pharmacyName: 'Farmácia Central',
    ratings: {
      average: 4.2,
      count: 87
    },
    tags: ['analgésico', 'antitérmico', 'genérico'],
    isActive: true,
    isFeatured: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: 'amoxicilina-500mg',
    name: 'Amoxicilina 500mg',
    manufacturer: 'Medley',
    category: ProductCategory.ANTIBIOTICS,
    price: 35.00,
    originalPrice: 41.18,
    discountPercentage: 15,
    stock: 30,
    description: 'Antibiótico de amplo espectro para infecções bacterianas.',
    longDescription: 'A Amoxicilina 500mg é um antibiótico da classe das penicilinas, eficaz no tratamento de diversas infecções bacterianas, incluindo infecções respiratórias, urinárias, de pele e otites. Deve ser utilizado conforme prescrição médica.',
    activeIngredient: 'Amoxicilina',
    dosage: '500mg',
    presentation: 'Caixa com 21 cápsulas',
    sku: 'AMO-500-MED-21',
    ean: '7896004700345',
    requiresPrescription: true,
    anvisaRegistration: '1.0345.6789',
    images: [
      'https://via.placeholder.com/400x400/FF9800/FFFFFF?text=Amoxicilina+500mg',
      'https://via.placeholder.com/400x400/FFB74D/FFFFFF?text=Amoxicilina+Bula'
    ],
    pharmacyId: 'pharmacy-002',
    pharmacyName: 'Drogaria Popular',
    ratings: {
      average: 4.7,
      count: 156
    },
    tags: ['antibiótico', 'infecção', 'prescrição obrigatória'],
    isActive: true,
    isFeatured: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: 'losartana-50mg',
    name: 'Losartana Potássica 50mg',
    manufacturer: 'Eurofarma',
    category: ProductCategory.ANTIHYPERTENSIVES,
    price: 28.00,
    originalPrice: 35.00,
    discountPercentage: 20,
    stock: 75,
    description: 'Medicamento anti-hipertensivo para controle da pressão arterial.',
    longDescription: 'A Losartana Potássica 50mg é um medicamento indicado para o tratamento da hipertensão arterial (pressão alta). Age bloqueando a ação da angiotensina II, substância que causa constrição dos vasos sanguíneos, resultando na redução da pressão arterial.',
    activeIngredient: 'Losartana Potássica',
    dosage: '50mg',
    presentation: 'Caixa com 30 comprimidos',
    sku: 'LOS-50-EUR-30',
    ean: '7896004700456',
    requiresPrescription: true,
    anvisaRegistration: '1.0456.7890',
    images: [
      'https://via.placeholder.com/400x400/E91E63/FFFFFF?text=Losartana+50mg'
    ],
    pharmacyId: 'pharmacy-001',
    pharmacyName: 'Farmácia Central',
    ratings: {
      average: 4.6,
      count: 203
    },
    tags: ['anti-hipertensivo', 'pressão alta', 'controle', 'prescrição obrigatória'],
    isActive: true,
    isFeatured: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: 'metformina-850mg',
    name: 'Metformina 850mg',
    manufacturer: 'Glenmark',
    category: ProductCategory.DIABETES,
    price: 18.90,
    originalPrice: 18.90,
    discountPercentage: 0,
    stock: 60,
    description: 'Antidiabético oral para controle da glicemia em diabetes tipo 2.',
    longDescription: 'A Metformina 850mg é um medicamento antidiabético oral utilizado no tratamento do diabetes mellitus tipo 2. Age reduzindo a produção de glicose pelo fígado e melhorando a sensibilidade à insulina, auxiliando no controle dos níveis de açúcar no sangue.',
    activeIngredient: 'Cloridrato de Metformina',
    dosage: '850mg',
    presentation: 'Caixa com 60 comprimidos',
    sku: 'MET-850-GLE-60',
    ean: '7896004700567',
    requiresPrescription: true,
    anvisaRegistration: '1.0567.8901',
    images: [
      'https://via.placeholder.com/400x400/9C27B0/FFFFFF?text=Metformina+850mg',
      'https://via.placeholder.com/400x400/BA68C8/FFFFFF?text=Metformina+Bula'
    ],
    pharmacyId: 'pharmacy-003',
    pharmacyName: 'Farmácia Vida',
    ratings: {
      average: 4.4,
      count: 142
    },
    tags: ['antidiabético', 'diabetes', 'glicemia', 'prescrição obrigatória'],
    isActive: true,
    isFeatured: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: 'vitamina-c-1g',
    name: 'Vitamina C 1g',
    manufacturer: 'Natulab',
    category: ProductCategory.VITAMINS,
    price: 25.00,
    originalPrice: 33.33,
    discountPercentage: 25,
    stock: 200,
    description: 'Suplemento vitamínico para reforço da imunidade.',
    longDescription: 'A Vitamina C 1g é um suplemento vitamínico que auxilia no fortalecimento do sistema imunológico, na formação do colágeno e possui ação antioxidante. Ideal para períodos de baixa imunidade, resfriados e gripes.',
    activeIngredient: 'Ácido Ascórbico',
    dosage: '1g (1000mg)',
    presentation: 'Caixa com 30 comprimidos efervescentes',
    sku: 'VIT-C-1G-NAT-30',
    ean: '7896004700678',
    requiresPrescription: false,
    anvisaRegistration: '1.0678.9012',
    images: [
      'https://via.placeholder.com/400x400/FFC107/FFFFFF?text=Vitamina+C+1g',
      'https://via.placeholder.com/400x400/FFD54F/FFFFFF?text=Vitamina+C+Efervescente'
    ],
    pharmacyId: 'pharmacy-002',
    pharmacyName: 'Drogaria Popular',
    ratings: {
      average: 4.8,
      count: 287
    },
    tags: ['vitamina', 'imunidade', 'suplemento', 'efervescente'],
    isActive: true,
    isFeatured: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: 'out-of-stock-product',
    name: 'Produto Sem Estoque',
    manufacturer: 'Teste',
    category: ProductCategory.ANALGESICS,
    price: 10.00,
    originalPrice: 10.00,
    discountPercentage: 0,
    stock: 0,
    description: 'Produto para teste de cenários sem estoque.',
    longDescription: 'Este é um produto de teste utilizado para validar comportamentos quando um item está fora de estoque.',
    activeIngredient: 'Teste',
    dosage: '100mg',
    presentation: 'Caixa com 10 comprimidos',
    sku: 'TEST-OUT-STOCK',
    ean: '7896004700999',
    requiresPrescription: false,
    anvisaRegistration: '1.0999.9999',
    images: [
      'https://via.placeholder.com/400x400/9E9E9E/FFFFFF?text=Sem+Estoque'
    ],
    pharmacyId: 'pharmacy-001',
    pharmacyName: 'Farmácia Central',
    ratings: {
      average: 0,
      count: 0
    },
    tags: ['teste', 'sem estoque'],
    isActive: true,
    isFeatured: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

/**
 * Seeds Firestore with test product data
 */
async function seedFirestore() {
  try {
    console.log('🌱 Starting Firestore seed...');
    
    for (const product of testProducts) {
      const productRef = doc(db, 'products', product.id);
      await setDoc(productRef, product);
      console.log(`✅ Seeded product: ${product.name} (${product.id})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${testProducts.length} products!`);
    console.log('\n📊 Summary:');
    console.log(`   - ${testProducts.filter(p => p.category === ProductCategory.ANALGESICS).length} Analgésicos`);
    console.log(`   - ${testProducts.filter(p => p.category === ProductCategory.ANTIBIOTICS).length} Antibiótico`);
    console.log(`   - ${testProducts.filter(p => p.category === ProductCategory.ANTIHYPERTENSIVES).length} Anti-hipertensivo`);
    console.log(`   - ${testProducts.filter(p => p.category === ProductCategory.DIABETES).length} Antidiabético`);
    console.log(`   - ${testProducts.filter(p => p.category === ProductCategory.VITAMINS).length} Vitamina`);
    console.log(`   - ${testProducts.filter(p => p.requiresPrescription).length} Requerem prescrição`);
    console.log(`   - ${testProducts.filter(p => p.stock === 0).length} Sem estoque`);
    console.log(`   - ${testProducts.filter(p => p.discountPercentage > 0).length} Com desconto`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    process.exit(1);
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedFirestore();
}

export { seedFirestore, testProducts };
