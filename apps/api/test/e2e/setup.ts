import { beforeAll, afterAll, expect } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

let authToken: string;
let testOrgId: string;

// Global setup: login and get token
beforeAll(async () => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@openbusinessos.com',
      password: 'demo123',
    }),
  });

  if (!res.ok) {
    throw new Error(`E2E setup failed: API login returned ${res.status}`);
  }

  const data = await res.json();
  authToken = data.accessToken;
  testOrgId = data.user.organizationId;

  // Make auth available globally
  (globalThis as any).__E2E_TOKEN__ = authToken;
  (globalThis as any).__E2E_ORG_ID__ = testOrgId;
  (globalThis as any).__E2E_API_URL__ = API_URL;
});

export function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(globalThis as any).__E2E_TOKEN__}`,
  };
}

export function getApiUrl(): string {
  return (globalThis as any).__E2E_API_URL__;
}

export function getOrgId(): string {
  return (globalThis as any).__E2E_ORG_ID__;
}
