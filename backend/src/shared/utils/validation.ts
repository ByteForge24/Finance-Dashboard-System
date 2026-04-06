export function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined;
}

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidEnum<T extends Record<string, string>>(value: unknown, enumObj: T): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

export function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && value > 0;
}

export function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && value >= 0;
}

export function isValidDate(date: unknown): boolean {
  if (!(date instanceof Date)) {
    return false;
  }
  return !isNaN(date.getTime());
}
