import { AuthConfig } from '../../config/auth-config.js';

export function extractBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }

  const trimmed = headerValue.trim();

  if (!trimmed.startsWith(AuthConfig.bearerPrefix + ' ')) {
    return null;
  }

  const token = trimmed.slice(AuthConfig.bearerPrefix.length + 1);

  if (!token) {
    return null;
  }

  return token;
}

export function hasBearerToken(headerValue: string | undefined): boolean {
  return extractBearerToken(headerValue) !== null;
}
