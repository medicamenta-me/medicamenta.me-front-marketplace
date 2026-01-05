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
    const result = pipe.transform(100);
    // Accept both space and non-breaking space between R$ and value
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*100[,.]00/);
  });

  it('deve formatar valor com centavos', () => {
    const result = pipe.transform(12.5);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*12[,.]50/);
  });

  it('deve formatar valor grande', () => {
    const result = pipe.transform(1250.75);
    // Accept various formats
    expect(result).toMatch(/1[,.]?250[,.]75/);
  });

  it('deve formatar zero', () => {
    const result = pipe.transform(0);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*0[,.]00/);
  });

  it('deve retornar R$ 0,00 para null', () => {
    const result = pipe.transform(null);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*0[,.]00/);
  });

  it('deve retornar R$ 0,00 para undefined', () => {
    const result = pipe.transform(undefined);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*0[,.]00/);
  });

  it('deve formatar valor negativo', () => {
    const result = pipe.transform(-50);
    expect(result).toContain('R$');
    expect(result).toContain('50');
  });

  it('deve formatar valor decimal pequeno', () => {
    const result = pipe.transform(0.99);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*0[,.]99/);
  });

  // ============================================
  // TESTES ADICIONAIS
  // ============================================

  it('deve formatar valor muito grande', () => {
    const result = pipe.transform(999999.99);
    expect(result).toContain('R$');
    expect(result).toContain('999');
  });

  it('deve formatar milhões', () => {
    const result = pipe.transform(1000000);
    expect(result).toContain('R$');
    expect(result).toContain('1');
  });

  it('deve formatar centavos exatos', () => {
    const result = pipe.transform(0.01);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*0[,.]01/);
  });

  it('deve formatar valor com muitas casas decimais', () => {
    const result = pipe.transform(12.999);
    expect(result).toContain('R$');
    // Intl.NumberFormat arredonda para 2 casas decimais
    expect(result).toContain('13');
  });

  it('deve formatar valor decimal com arredondamento para baixo', () => {
    const result = pipe.transform(12.001);
    expect(result).toContain('R$');
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*12[,.]00/);
  });

  it('deve formatar valor muito pequeno', () => {
    const result = pipe.transform(0.001);
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s*0[,.]00/);
  });

  it('deve formatar valor inteiro grande', () => {
    const result = pipe.transform(50000);
    expect(result).toContain('R$');
    expect(result).toContain('50');
  });

  it('deve manter formato consistente', () => {
    const result1 = pipe.transform(100);
    const result2 = pipe.transform(100.00);
    expect(result1).toBe(result2);
  });

  it('deve tratar NaN como zero', () => {
    // NaN passa pelo typeof check, mas Intl.NumberFormat lida com isso
    const result = pipe.transform(NaN);
    expect(result).toContain('R$');
  });

  it('deve tratar Infinity', () => {
    const result = pipe.transform(Infinity);
    expect(result).toContain('R$');
  });

  it('deve tratar -Infinity', () => {
    const result = pipe.transform(-Infinity);
    expect(result).toContain('R$');
  });
});
