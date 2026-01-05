/**
 * 🧪 Distance Pipe Tests
 */

import { DistancePipe } from './distance.pipe';

describe('DistancePipe', () => {
  let pipe: DistancePipe;

  beforeEach(() => {
    pipe = new DistancePipe();
  });

  it('deve criar o pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('deve formatar distância em metros (< 1000)', () => {
    expect(pipe.transform(500)).toBe('500 m');
  });

  it('deve formatar distância em km (>= 1000)', () => {
    expect(pipe.transform(1500)).toBe('1.5 km');
  });

  it('deve formatar distância grande', () => {
    expect(pipe.transform(25000)).toBe('25.0 km');
  });

  it('deve arredondar metros', () => {
    expect(pipe.transform(123.7)).toBe('124 m');
  });

  it('deve retornar 0 m para null', () => {
    expect(pipe.transform(null)).toBe('0 m');
  });

  it('deve retornar 0 m para undefined', () => {
    expect(pipe.transform(undefined)).toBe('0 m');
  });

  it('deve retornar 0 m para NaN', () => {
    expect(pipe.transform(NaN)).toBe('0 m');
  });

  it('deve respeitar parâmetro decimals', () => {
    expect(pipe.transform(1234, 2)).toBe('1.23 km');
  });

  it('deve usar 1 decimal por padrão', () => {
    expect(pipe.transform(1234)).toBe('1.2 km');
  });

  it('deve formatar zero', () => {
    expect(pipe.transform(0)).toBe('0 m');
  });

  // ============================================
  // TESTES ADICIONAIS
  // ============================================

  it('deve formatar exatamente 1000 metros como 1.0 km', () => {
    expect(pipe.transform(1000)).toBe('1.0 km');
  });

  it('deve formatar 999 metros como metros', () => {
    expect(pipe.transform(999)).toBe('999 m');
  });

  it('deve formatar 1001 metros como km', () => {
    expect(pipe.transform(1001)).toBe('1.0 km');
  });

  it('deve formatar distância muito grande', () => {
    expect(pipe.transform(100000)).toBe('100.0 km');
  });

  it('deve formatar distância muito pequena', () => {
    expect(pipe.transform(1)).toBe('1 m');
  });

  it('deve usar 0 decimais para km', () => {
    expect(pipe.transform(5000, 0)).toBe('5 km');
  });

  it('deve usar 3 decimais para km', () => {
    expect(pipe.transform(1234.5678, 3)).toBe('1.235 km');
  });

  it('deve arredondar metros para baixo (< 0.5)', () => {
    expect(pipe.transform(100.3)).toBe('100 m');
  });

  it('deve arredondar metros para cima (>= 0.5)', () => {
    expect(pipe.transform(100.5)).toBe('101 m');
  });

  it('deve formatar 1.5 km', () => {
    expect(pipe.transform(1500)).toBe('1.5 km');
  });

  it('deve formatar 10.0 km', () => {
    expect(pipe.transform(10000)).toBe('10.0 km');
  });

  it('deve formatar valor decimal em metros', () => {
    expect(pipe.transform(500.9)).toBe('501 m');
  });

  it('deve formatar valor negativo', () => {
    expect(pipe.transform(-500)).toBe('-500 m');
  });

  it('deve formatar valor negativo em km', () => {
    // Valores negativos são tratados literalmente pela lógica do pipe
    // -5000 < 1000 é true, então exibe em metros
    expect(pipe.transform(-5000)).toBe('-5000 m');
  });

  it('deve manter consistência com diferentes decimals', () => {
    const result1 = pipe.transform(5000, 1);
    const result2 = pipe.transform(5000, 2);
    expect(result1).toBe('5.0 km');
    expect(result2).toBe('5.00 km');
  });
});
