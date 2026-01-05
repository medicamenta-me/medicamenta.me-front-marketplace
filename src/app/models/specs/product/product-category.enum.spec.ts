/**
 * @file product-category.enum.spec.ts
 * @description Testes unitários para o enum ProductCategory e CATEGORY_LABELS
 */

import { ProductCategory, CATEGORY_LABELS } from '../../product.model';

describe('ProductCategory Enum', () => {
  it('should have ANALGESICS category', () => {
    expect(ProductCategory.ANALGESICS).toBe('analgesics');
  });

  it('should have ANTIBIOTICS category', () => {
    expect(ProductCategory.ANTIBIOTICS).toBe('antibiotics');
  });

  it('should have ANTIHISTAMINES category', () => {
    expect(ProductCategory.ANTIHISTAMINES).toBe('antihistamines');
  });

  it('should have ANTIHYPERTENSIVES category', () => {
    expect(ProductCategory.ANTIHYPERTENSIVES).toBe('antihypertensives');
  });

  it('should have CARDIOVASCULAR category', () => {
    expect(ProductCategory.CARDIOVASCULAR).toBe('cardiovascular');
  });

  it('should have DERMATOLOGICALS category', () => {
    expect(ProductCategory.DERMATOLOGICALS).toBe('dermatologicals');
  });

  it('should have DIABETES category', () => {
    expect(ProductCategory.DIABETES).toBe('diabetes');
  });

  it('should have DIGESTIVE category', () => {
    expect(ProductCategory.DIGESTIVE).toBe('digestive');
  });

  it('should have SUPPLEMENTS category', () => {
    expect(ProductCategory.SUPPLEMENTS).toBe('supplements');
  });

  it('should have VITAMINS category', () => {
    expect(ProductCategory.VITAMINS).toBe('vitamins');
  });

  it('should have PEDIATRICS category', () => {
    expect(ProductCategory.PEDIATRICS).toBe('pediatrics');
  });

  it('should have WOMEN_HEALTH category', () => {
    expect(ProductCategory.WOMEN_HEALTH).toBe('women_health');
  });

  it('should have MEDICAL_DEVICES category', () => {
    expect(ProductCategory.MEDICAL_DEVICES).toBe('medical_devices');
  });

  it('should have 13 total categories', () => {
    const categoryCount = Object.keys(ProductCategory).length;
    expect(categoryCount).toBe(13);
  });
});

describe('CATEGORY_LABELS', () => {
  it('should have label for ANALGESICS', () => {
    expect(CATEGORY_LABELS[ProductCategory.ANALGESICS]).toBe('Analgésicos e Antitérmicos');
  });

  it('should have label for ANTIBIOTICS', () => {
    expect(CATEGORY_LABELS[ProductCategory.ANTIBIOTICS]).toBe('Antibióticos');
  });

  it('should have label for ANTIHISTAMINES', () => {
    expect(CATEGORY_LABELS[ProductCategory.ANTIHISTAMINES]).toBe('Antialérgicos');
  });

  it('should have label for ANTIHYPERTENSIVES', () => {
    expect(CATEGORY_LABELS[ProductCategory.ANTIHYPERTENSIVES]).toBe('Anti-hipertensivos');
  });

  it('should have label for CARDIOVASCULAR', () => {
    expect(CATEGORY_LABELS[ProductCategory.CARDIOVASCULAR]).toBe('Cardiovasculares');
  });

  it('should have label for DERMATOLOGICALS', () => {
    expect(CATEGORY_LABELS[ProductCategory.DERMATOLOGICALS]).toBe('Dermatológicos');
  });

  it('should have label for DIABETES', () => {
    expect(CATEGORY_LABELS[ProductCategory.DIABETES]).toBe('Diabetes');
  });

  it('should have label for DIGESTIVE', () => {
    expect(CATEGORY_LABELS[ProductCategory.DIGESTIVE]).toBe('Sistema Digestivo');
  });

  it('should have label for SUPPLEMENTS', () => {
    expect(CATEGORY_LABELS[ProductCategory.SUPPLEMENTS]).toBe('Suplementos');
  });

  it('should have label for VITAMINS', () => {
    expect(CATEGORY_LABELS[ProductCategory.VITAMINS]).toBe('Vitaminas e Minerais');
  });

  it('should have label for PEDIATRICS', () => {
    expect(CATEGORY_LABELS[ProductCategory.PEDIATRICS]).toBe('Pediatria');
  });

  it('should have label for WOMEN_HEALTH', () => {
    expect(CATEGORY_LABELS[ProductCategory.WOMEN_HEALTH]).toBe('Saúde da Mulher');
  });

  it('should have label for MEDICAL_DEVICES', () => {
    expect(CATEGORY_LABELS[ProductCategory.MEDICAL_DEVICES]).toBe('Dispositivos Médicos');
  });

  it('should have labels for all categories', () => {
    Object.values(ProductCategory).forEach(category => {
      expect(CATEGORY_LABELS[category]).toBeDefined();
      expect(typeof CATEGORY_LABELS[category]).toBe('string');
      expect(CATEGORY_LABELS[category].length).toBeGreaterThan(0);
    });
  });

  it('should have Portuguese labels', () => {
    // Check that labels are in Portuguese (no English words)
    const labels = Object.values(CATEGORY_LABELS);
    const englishWords = ['and', 'the', 'of', 'for', 'with'];
    
    labels.forEach(label => {
      englishWords.forEach(word => {
        expect(label.toLowerCase()).not.toContain(` ${word} `);
      });
    });
  });
});
