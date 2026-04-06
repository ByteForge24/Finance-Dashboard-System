/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toMatch(expected: RegExp): R;
      toContain(expected: any): R;
      toEqual(expected: any): R;
      toBe(expected: any): R;
      toHaveProperty(property: string, value?: any): R;
    }
  }
}

export {};
