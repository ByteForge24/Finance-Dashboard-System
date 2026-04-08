export type DemoRole = 'viewer' | 'analyst' | 'admin';

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const appConfig = Object.freeze({
  frontendBaseURL: trimTrailingSlash(
    process.env.PROD_FRONTEND_URL ?? 'https://finance-dashboard-pro.netlify.app'
  ),
  backendBaseURL: trimTrailingSlash(
    process.env.PROD_BACKEND_URL ?? 'https://finance-dashboard-api-hqjk.onrender.com'
  ),
  allowProductionWrites: process.env.ALLOW_PRODUCTION_WRITES === 'true',
  allowPersistentProdUserTests: process.env.ALLOW_PERSISTENT_PROD_USER_TESTS === 'true',
  enableRateLimitChecks: process.env.ENABLE_RATE_LIMIT_CHECKS === 'true',
});

export const demoAccounts: Record<DemoRole, DemoAccount> = {
  viewer: {
    label: 'Viewer',
    email: 'viewer@finance-dashboard.local',
    password: 'ViewerPassword123',
  },
  analyst: {
    label: 'Analyst',
    email: 'analyst@finance-dashboard.local',
    password: 'AnalystPassword123',
  },
  admin: {
    label: 'Admin',
    email: 'admin@finance-dashboard.local',
    password: 'AdminPassword123',
  },
};

export const inactiveDemoAccount: DemoAccount = {
  label: 'Inactive',
  email: 'inactive@finance-dashboard.local',
  password: 'InactivePassword123',
};

export function apiUrl(path: string): string {
  return `${appConfig.backendBaseURL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function appUrl(hashPath = '/login'): string {
  const normalized = hashPath.startsWith('#')
    ? hashPath
    : `#${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}`;
  return `${appConfig.frontendBaseURL}/${normalized}`;
}

export function uniqueProbeRecord() {
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

  return {
    category: `E2E Probe ${stamp}`,
    notes: `Playwright production probe ${stamp}`,
    amount: '64.20',
    date: new Date().toISOString().split('T')[0],
  };
}
