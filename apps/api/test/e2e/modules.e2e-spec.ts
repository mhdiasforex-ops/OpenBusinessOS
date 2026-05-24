import { describe, it, expect, beforeAll } from 'vitest';
import { getAuthHeaders, getApiUrl, getOrgId } from './setup';

describe('Core Modules E2E', () => {
  let apiUrl: string;
  let headers: Record<string, string>;
  let orgId: string;

  beforeAll(() => {
    apiUrl = getApiUrl();
    headers = getAuthHeaders();
    orgId = getOrgId();
  });

  // ── Users ────────────────────────────────────────────────────
  describe('Users', () => {
    it('GET /users — should list users', async () => {
      const res = await fetch(`${apiUrl}/users`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('GET /users/profile — should return profile with roles', async () => {
      const res = await fetch(`${apiUrl}/users/profile`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.email).toBeDefined();
      expect(data.roles).toBeDefined();
    });
  });

  // ── Organizations ────────────────────────────────────────────
  describe('Organizations', () => {
    it('GET /organizations/:id/stats — should return stats', async () => {
      const res = await fetch(`${apiUrl}/organizations/${orgId}/stats`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.users).toBeDefined();
      expect(data.products).toBeDefined();
    });
  });

  // ── Financial ────────────────────────────────────────────────
  describe('Financial', () => {
    it('GET /financial/transactions — should list transactions', async () => {
      const res = await fetch(`${apiUrl}/financial/transactions?page=1&limit=5`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('POST /financial/transactions — should create transaction', async () => {
      const res = await fetch(`${apiUrl}/financial/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: 'E2E Test Transaction',
          amount: 100.50,
          type: 'INCOME',
          category: 'VENDAS',
          dueDate: '2026-08-01',
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.status).toBe('PENDING');
    });
  });

  // ── CRM ──────────────────────────────────────────────────────
  describe('CRM', () => {
    it('GET /crm/customers — should list customers', async () => {
      const res = await fetch(`${apiUrl}/crm/customers?page=1&limit=5`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });

    it('POST /crm/customers — should create customer', async () => {
      const res = await fetch(`${apiUrl}/crm/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Cliente E2E Test',
          email: `e2e-${Date.now()}@test.com`,
          phone: '11999999999',
          document: '12345678901',
        }),
      });
      expect([200, 201]).toContain(res.status);
      const data = await res.json();
      expect(data.id || data.data?.id).toBeDefined();
    });
  });

  // ── Products ─────────────────────────────────────────────────
  describe('Products', () => {
    it('GET /products — should list products', async () => {
      const res = await fetch(`${apiUrl}/products`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });
  });

  // ── Workflows ────────────────────────────────────────────────
  describe('Workflows', () => {
    it('GET /workflows — should list workflows', async () => {
      const res = await fetch(`${apiUrl}/workflows`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // ── Analytics ────────────────────────────────────────────────
  describe('Analytics', () => {
    it('GET /analytics/metrics — should return metrics', async () => {
      const res = await fetch(`${apiUrl}/analytics/metrics`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.income).toBeDefined();
      expect(data.expense).toBeDefined();
    });
  });

  // ── Notifications ────────────────────────────────────────────
  describe('Notifications', () => {
    it('GET /notifications — should list notifications', async () => {
      const res = await fetch(`${apiUrl}/notifications`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });
  });

  // ── Onboarding ───────────────────────────────────────────────
  describe('Onboarding', () => {
    it('GET /onboarding/config — should return config', async () => {
      const res = await fetch(`${apiUrl}/onboarding/config`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBeDefined();
    });
  });

  // ── Contracts ────────────────────────────────────────────────
  describe('Contracts', () => {
    it('GET /contracts — should list contracts', async () => {
      const res = await fetch(`${apiUrl}/contracts`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });
  });

  // ── Suppliers ────────────────────────────────────────────────
  describe('Suppliers', () => {
    it('GET /suppliers — should list suppliers', async () => {
      const res = await fetch(`${apiUrl}/suppliers`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });
  });

  // ── Reports ──────────────────────────────────────────────────
  describe('Reports', () => {
    it('GET /reports — should return reports', async () => {
      const res = await fetch(`${apiUrl}/reports`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
    });
  });

  // ── LGPD ─────────────────────────────────────────────────────
  describe('LGPD', () => {
    it('GET /lgpd/consent/:customerId — should return consents', async () => {
      const res = await fetch(`${apiUrl}/lgpd/consent/customer-1`, { headers });
      expect(res.status).toBe(200);
    });
  });

  // ── Payment ──────────────────────────────────────────────────
  describe('Payment', () => {
    it('POST /payment — should create payment', async () => {
      const res = await fetch(`${apiUrl}/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          method: 'PIX',
          amount: 42.90,
          description: 'E2E Payment Test',
          dueDate: '2026-09-01',
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.status).toBe('PENDING');
    });

    it('GET /payment/stats — should return payment stats', async () => {
      const res = await fetch(`${apiUrl}/payment/stats`, { headers });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.totalConfirmed).toBeDefined();
    });
  });
});
