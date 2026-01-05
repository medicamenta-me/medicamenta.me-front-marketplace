/**
 * @file delivery-address.interface.spec.ts
 * @description Testes unitários para a interface DeliveryAddress
 */

import { DeliveryAddress } from '../../order.model';

describe('DeliveryAddress Interface', () => {
  it('should create valid delivery address', () => {
    const address: DeliveryAddress = {
      recipientName: 'João Silva',
      phone: '11999999999',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567'
    };

    expect(address.recipientName).toBe('João Silva');
    expect(address.street).toBe('Rua das Flores');
    expect(address.city).toBe('São Paulo');
  });

  it('should create address with complement', () => {
    const address: DeliveryAddress = {
      recipientName: 'Maria Santos',
      phone: '11988888888',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Apto 101',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100'
    };

    expect(address.complement).toBe('Apto 101');
  });

  it('should create address with coordinates', () => {
    const address: DeliveryAddress = {
      recipientName: 'Pedro Oliveira',
      phone: '11977777777',
      street: 'Rua Augusta',
      number: '500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305000',
      latitude: -23.5505,
      longitude: -46.6333
    };

    expect(address.latitude).toBe(-23.5505);
    expect(address.longitude).toBe(-46.6333);
  });

  it('should create address with delivery instructions', () => {
    const address: DeliveryAddress = {
      recipientName: 'Ana Costa',
      phone: '11966666666',
      street: 'Rua Oscar Freire',
      number: '800',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426000',
      instructions: 'Portaria 24h, deixar com o porteiro se não estiver em casa'
    };

    expect(address.instructions).toContain('porteiro');
  });
});
