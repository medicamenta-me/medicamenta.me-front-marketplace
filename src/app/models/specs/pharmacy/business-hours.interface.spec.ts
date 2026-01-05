/**
 * @file business-hours.interface.spec.ts
 * @description Testes unitários para a interface BusinessHours
 */

import { BusinessHours } from '../../pharmacy.model';

describe('BusinessHours Interface', () => {
  it('should create weekday hours', () => {
    const hours: BusinessHours = {
      dayOfWeek: 1, // Monday
      openTime: '08:00',
      closeTime: '18:00',
      isClosed: false
    };

    expect(hours.dayOfWeek).toBe(1);
    expect(hours.openTime).toBe('08:00');
    expect(hours.closeTime).toBe('18:00');
    expect(hours.isClosed).toBe(false);
  });

  it('should create Sunday hours (closed)', () => {
    const hours: BusinessHours = {
      dayOfWeek: 0, // Sunday
      openTime: '',
      closeTime: '',
      isClosed: true
    };

    expect(hours.dayOfWeek).toBe(0);
    expect(hours.isClosed).toBe(true);
  });

  it('should create Saturday hours', () => {
    const hours: BusinessHours = {
      dayOfWeek: 6, // Saturday
      openTime: '09:00',
      closeTime: '13:00',
      isClosed: false
    };

    expect(hours.dayOfWeek).toBe(6);
    expect(hours.openTime).toBe('09:00');
    expect(hours.closeTime).toBe('13:00');
  });

  it('should handle 24h pharmacy', () => {
    const hours: BusinessHours = {
      dayOfWeek: 3, // Wednesday
      openTime: '00:00',
      closeTime: '23:59',
      isClosed: false
    };

    expect(hours.openTime).toBe('00:00');
    expect(hours.closeTime).toBe('23:59');
  });

  it('should create full week schedule', () => {
    const weekSchedule: BusinessHours[] = [
      { dayOfWeek: 0, openTime: '', closeTime: '', isClosed: true }, // Sunday
      { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', isClosed: false } // Saturday
    ];

    expect(weekSchedule.length).toBe(7);
    expect(weekSchedule[0].isClosed).toBe(true); // Sunday closed
    expect(weekSchedule[6].closeTime).toBe('13:00'); // Saturday early close
  });
});
