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
});
