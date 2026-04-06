import { startOfDay, endOfDay } from '../../src/shared/utils/date.js';

describe('Date Utilities', () => {
  it('should set time to start of day (00:00:00)', () => {
    const date = new Date('2024-01-15T14:30:45');
    const result = startOfDay(date);

    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('should set time to end of day (23:59:59)', () => {
    const date = new Date('2024-01-15T14:30:45');
    const result = endOfDay(date);

    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
  });

  it('should preserve the date when converting to start of day', () => {
    const date = new Date('2024-01-15T14:30:45');
    const result = startOfDay(date);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
  });

  it('should preserve the date when converting to end of day', () => {
    const date = new Date('2024-01-15T14:30:45');
    const result = endOfDay(date);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
  });
});
