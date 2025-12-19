/**
 * 📏 Distance Pipe
 * 
 * Formata distância em km ou m
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'distance',
  standalone: true
})
export class DistancePipe implements PipeTransform {
  /**
   * Transforma distância em metros para formato legível
   * @param value Distância em metros
   * @param decimals Número de casas decimais (padrão: 1)
   */
  transform(value: number | null | undefined, decimals: number = 1): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0 m';
    }

    // Menos de 1 km: exibe em metros
    if (value < 1000) {
      return `${Math.round(value)} m`;
    }

    // 1 km ou mais: exibe em km
    const km = value / 1000;
    return `${km.toFixed(decimals)} km`;
  }
}
