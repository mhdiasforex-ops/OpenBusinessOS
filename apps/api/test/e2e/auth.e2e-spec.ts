import { describe, it, expect, beforeAll } from 'vitest';
import { getAuthHeaders, getApiUrl } from './setup';

describe('Auth E2E', () => {
  let apiUrl: string;
  let headers: Record<string, string>;

  beforeAll(() => {
    apiUrl = getApiUrl();
    headers = getAuthHeaders();
  });

  it('should login with valid credentials', async () => {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@openbusinessos.com', password: 'demo123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accessToken).toBeDefined();
    expect(data.user.email).toBe('demo@openbusinessos.com');
  });

  it('should reject invalid credentials', async () => {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@openbusinessos.com', password: 'wrong' }),
    });
    expect(res.status).toBe(401);
  });

  it('should return current user profile', async () => {
    const res = await fetch(`${apiUrl}/auth/me`, { headers });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe('demo@openbusinessos.com');
    expect(data.organizationId).toBeDefined();
  });
});
