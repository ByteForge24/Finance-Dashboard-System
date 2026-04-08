import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { apiUrl, demoAccounts, inactiveDemoAccount, DemoRole } from './env';

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  user: PublicUser;
  token: string;
}

type LoginKey = DemoRole | 'inactive';

export function bearer(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function readJson<T>(response: APIResponse): Promise<T> {
  return (await response.json()) as T;
}

export function expectPublicUserShape(user: Record<string, unknown>) {
  expect(user).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    email: expect.any(String),
    role: expect.any(String),
    status: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  });
  expect(user).not.toHaveProperty('password');
  expect(user).not.toHaveProperty('passwordHash');
}

export async function loginViaApi(
  request: APIRequestContext,
  role: LoginKey
): Promise<AuthPayload> {
  const account = role === 'inactive' ? inactiveDemoAccount : demoAccounts[role];
  const response = await request.post(apiUrl('/api/v1/auth/login'), {
    data: {
      email: account.email,
      password: account.password,
    },
  });

  expect(response.ok(), `Expected demo login to succeed for ${account.email}`).toBeTruthy();

  const payload = await readJson<AuthPayload>(response);
  expect(payload.token).toEqual(expect.any(String));
  expectPublicUserShape(payload.user as unknown as Record<string, unknown>);

  return payload;
}
