/**
 * 🧪 Currency Pipe Tests
 */

import { CurrencyPipe } from './currency.pipe';

describe('CurrencyPipe', () => {
  let pipe: CurrencyPipe;

  beforeEach(() => {
    pipe = new CurrencyPipe();
  });

  it('deve criar o pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('deve formatar valor positivo', () => {
    expect(pipe.transform(100)).toBe('R$ 100,00');
  });

  it('deve formatar valor com centavos', () => {
    expect(pipe.transform(12.5)).toBe('R$ 12,50');
  });

  it('deve formatar valor grande', () => {
    expect(pipe.transform(1250.75)).toContain('1.250,75');
  });

  it('deve formatar zero', () => {
    expect(pipe.transform(0)).toBe('R$ 0,00');
  });

  it('deve retornar R$ 0,00 para null', () => {
    expect(pipe.transform(null)).toBe('R$ 0,00');
  });

  it('deve retornar R$ 0,00 para undefined', () => {
    expect(pipe.transform(undefined)).toBe('R$ 0,00');
  });

  it('deve formatar valor negativo', () => {
    expect(pipe.transform(-50)).toContain('-R$');
  });

  it('deve formatar valor decimal pequeno', () => {
    expect(pipe.transform(0.99)).toBe('R$ 0,99');
  });
});
