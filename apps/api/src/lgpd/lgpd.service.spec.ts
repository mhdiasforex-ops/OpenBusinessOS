import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LgpdService } from './lgpd.service';
import { RegisterConsentDto, LawfulBasis, ConsentStatus, RequestStatus, ExportDataDto, DeleteDataDto, AnonymizeDto } from './lgpd.dto';

describe('LgpdService', () => {
  let service: LgpdService;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {};
    eventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };
    service = new LgpdService(prisma, eventBus);
  });

  const tenantId = 'tenant-1';
  const subjectId = 'subject-1';

  // ────────────────────────────────────────────────
  //  registerConsent
  // ────────────────────────────────────────────────

  describe('registerConsent', () => {
    it('should create consent record with ATIVO status and default source', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Marketing',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };

      const result = await service.registerConsent(dto, tenantId);

      expect(result.subjectId).toBe(subjectId);
      expect(result.purpose).toBe('Marketing');
      expect(result.lawfulBasis).toBe(LawfulBasis.CONSENTIMENTO);
      expect(result.status).toBe(ConsentStatus.ATIVO);
      expect(result.source).toBe('web');
      expect(result.tenantId).toBe(tenantId);
      expect(result.id).toMatch(/^lgpd-/);
      expect(result.createdAt).toBeDefined();
    });

    it('should use provided source when given', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Email',
        lawfulBasis: LawfulBasis.CONTRATO,
        source: 'mobile',
      };

      const result = await service.registerConsent(dto, tenantId);

      expect(result.source).toBe('mobile');
    });

    it('should log audit with consentId and purpose', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Analytics',
        lawfulBasis: LawfulBasis.INTERESSE_LEGITIMO,
      };

      await service.registerConsent(dto, tenantId);

      expect(service['auditLogs'].length).toBe(1);
      const log = service['auditLogs'][0];
      expect(log.action).toBe('CONSENT_REGISTERED');
      expect(log.subjectId).toBe(subjectId);
      expect(log.tenantId).toBe(tenantId);
      expect(log.metadata.purpose).toBe('Analytics');
    });

    it('should emit lgpd.consent.registered event', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Newsletter',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };

      const result = await service.registerConsent(dto, tenantId);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: tenantId,
        type: 'lgpd.consent.registered',
        source: 'lgpd',
        payload: {
          consentId: result.id,
          subjectId,
        },
      });
    });

    it('should handle event emission failure gracefully', async () => {
      eventBus.emit.mockRejectedValue(new Error('Event bus down'));

      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Test',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };

      await expect(service.registerConsent(dto, tenantId)).resolves.toBeDefined();
    });

    it('should generate unique IDs for each consent', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Test',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };

      const r1 = await service.registerConsent(dto, tenantId);
      const r2 = await service.registerConsent(dto, tenantId);

      expect(r1.id).not.toBe(r2.id);
    });
  });

  // ────────────────────────────────────────────────
  //  getConsents
  // ────────────────────────────────────────────────

  describe('getConsents', () => {
    it('should return consents filtered by subjectId and tenantId', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Email',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };
      await service.registerConsent(dto, tenantId);
      await service.registerConsent({ ...dto, purpose: 'SMS' }, tenantId);
      await service.registerConsent(dto, 'other-tenant');

      const result = await service.getConsents(subjectId, tenantId);

      expect(result).toHaveLength(2);
      expect(result.every(c => c.subjectId === subjectId && c.tenantId === tenantId)).toBe(true);
    });

    it('should return empty array when no consents match', async () => {
      const result = await service.getConsents('nonexistent', tenantId);

      expect(result).toEqual([]);
    });

    it('should not return consents from other tenants', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Test',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };
      await service.registerConsent(dto, 'other-tenant');

      const result = await service.getConsents(subjectId, tenantId);

      expect(result).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────
  //  revokeConsent
  // ────────────────────────────────────────────────

  describe('revokeConsent', () => {
    it('should set status to REVOGADO and set revokedAt', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Email',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };
      const consent = await service.registerConsent(dto, tenantId);

      const result = await service.revokeConsent(consent.id, tenantId);

      expect(result.status).toBe(ConsentStatus.REVOGADO);
      expect(result.revokedAt).toBeDefined();
    });

    it('should throw Error when consent is not found', async () => {
      await expect(service.revokeConsent('nonexistent', tenantId)).rejects.toThrow('Consentimento não encontrado');
    });

    it('should throw Error when consent exists but in different tenant', async () => {
      const dto: RegisterConsentDto = {
        subjectId,
        purpose: 'Email',
        lawfulBasis: LawfulBasis.CONSENTIMENTO,
      };
      const consent = await service.registerConsent(dto, tenantId);

      await expect(service.revokeConsent(consent.id, 'different-tenant')).rejects.toThrow('Consentimento não encontrado');
    });

    it('should log audit on revocation', async () => {
      const consent = await service.registerConsent({ subjectId, purpose: 'Test', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      const auditCountBefore = service['auditLogs'].length;

      await service.revokeConsent(consent.id, tenantId);

      expect(service['auditLogs'].length).toBe(auditCountBefore + 1);
      expect(service['auditLogs'][auditCountBefore].action).toBe('CONSENT_REVOKED');
    });

    it('should emit event on revocation', async () => {
      const consent = await service.registerConsent({ subjectId, purpose: 'Test', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);

      await service.revokeConsent(consent.id, tenantId);

      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'lgpd.consent.revoked',
        organizationId: tenantId,
      }));
    });

    it('should return the updated consent record', async () => {
      const consent = await service.registerConsent({ subjectId, purpose: 'Test', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);

      const result = await service.revokeConsent(consent.id, tenantId);

      expect(result.id).toBe(consent.id);
      expect(result.status).toBe(ConsentStatus.REVOGADO);
    });
  });

  // ────────────────────────────────────────────────
  //  requestDataAccess
  // ────────────────────────────────────────────────

  describe('requestDataAccess', () => {
    it('should create pending data request', async () => {
      const result = await service.requestDataAccess(subjectId, 'ACCESS', tenantId);

      expect(result.subjectId).toBe(subjectId);
      expect(result.requestType).toBe('ACCESS');
      expect(result.status).toBe(RequestStatus.PENDENTE);
      expect(result.tenantId).toBe(tenantId);
      expect(result.id).toMatch(/^lgpd-/);
      expect(result.createdAt).toBeDefined();
    });

    it('should log audit and emit event', async () => {
      await service.requestDataAccess(subjectId, 'ACCESS', tenantId);

      expect(service['auditLogs'].some(l => l.action === 'DATA_ACCESS_REQUESTED')).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'lgpd.data-subject.access-requested',
      }));
    });
  });

  // ────────────────────────────────────────────────
  //  exportData
  // ────────────────────────────────────────────────

  describe('exportData', () => {
    it('should export data as JSON by default', async () => {
      await service.registerConsent({ subjectId, purpose: 'Email', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      const dto: ExportDataDto = { subjectId, format: 'json' };

      const result = await service.exportData(dto, tenantId);

      expect(typeof result).toBe('object');
      if (typeof result !== 'string') {
        expect(result.subjectId).toBe(subjectId);
        expect(result.data.consents).toHaveLength(1);
        expect(result.data.auditLogs).toBeDefined();
        expect(result.data.dataRequests).toBeDefined();
        expect(result.exportedAt).toBeDefined();
      }
    });

    it('should export data as CSV format', async () => {
      await service.registerConsent({ subjectId, purpose: 'Email', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      const dto: ExportDataDto = { subjectId, format: 'csv' };

      const result = await service.exportData(dto, tenantId);

      expect(typeof result).toBe('string');
      expect(result).toContain('Seção;Campo;Valor');
      expect(result).toContain('Consentimentos');
    });

    it('should filter data by subjectId and tenantId', async () => {
      await service.registerConsent({ subjectId, purpose: 'Mine', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      await service.registerConsent({ subjectId: 'other', purpose: 'Not mine', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      const dto: ExportDataDto = { subjectId, format: 'json' };

      const result = await service.exportData(dto, tenantId);

      if (typeof result !== 'string') {
        expect(result.data.consents).toHaveLength(1);
        expect(result.data.consents[0].purpose).toBe('Mine');
      }
    });

    it('should log audit on export', async () => {
      const dto: ExportDataDto = { subjectId, format: 'json' };

      await service.exportData(dto, tenantId);

      expect(service['auditLogs'].some(l => l.action === 'DATA_EXPORTED')).toBe(true);
    });

    it('should emit event on export', async () => {
      const dto: ExportDataDto = { subjectId, format: 'json' };

      await service.exportData(dto, tenantId);

      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'lgpd.data-subject.exported',
      }));
    });

    it('should include data requests in CSV output', async () => {
      await service.requestDataAccess(subjectId, 'ACCESS', tenantId);
      const dto: ExportDataDto = { subjectId, format: 'csv' };

      const result = await service.exportData(dto, tenantId);

      expect(typeof result).toBe('string');
      expect(result).toContain('Solicitações');
      expect(result).toContain('Tipo');
      expect(result).toContain('Status');
      expect(result).toContain('ACCESS');
    });
  });

  // ────────────────────────────────────────────────
  //  deleteData
  // ────────────────────────────────────────────────

  describe('deleteData', () => {
    it('should create deletion request with EM_PROCESSAMENTO status', async () => {
      const dto: DeleteDataDto = { subjectId, reason: 'User request' };

      const result = await service.deleteData(dto, tenantId);

      expect(result.requestId).toMatch(/^lgpd-/);
      expect(result.status).toBe(RequestStatus.CONCLUIDO);
      expect(result.subjectId).toBe(subjectId);
      expect(result.message).toContain('deleção');
    });

    it('should revoke all active consents for the subject', async () => {
      await service.registerConsent({ subjectId, purpose: 'A', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      await service.registerConsent({ subjectId, purpose: 'B', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      const dto: DeleteDataDto = { subjectId, reason: 'Request' };

      await service.deleteData(dto, tenantId);

      expect(service['consents'].filter(c => c.subjectId === subjectId).every(c => c.status === ConsentStatus.REVOGADO)).toBe(true);
    });

    it('should not revoke consents from other subjects', async () => {
      await service.registerConsent({ subjectId: 'other', purpose: 'A', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      const dto: DeleteDataDto = { subjectId, reason: 'Request' };

      await service.deleteData(dto, tenantId);

      expect(service['consents'].find(c => c.subjectId === 'other')?.status).toBe(ConsentStatus.ATIVO);
    });

    it('should emit deletion event', async () => {
      const dto: DeleteDataDto = { subjectId, reason: 'Request' };

      await service.deleteData(dto, tenantId);

      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'lgpd.data-subject.deletion-requested',
      }));
    });

    it('should log audit for deletion', async () => {
      const dto: DeleteDataDto = { subjectId, reason: 'Request' };

      await service.deleteData(dto, tenantId);

      expect(service['auditLogs'].some(l => l.action === 'DATA_DELETION_REQUESTED')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────
  //  anonymizeData
  // ────────────────────────────────────────────────

  describe('anonymizeData', () => {
    it('should anonymize specified fields', async () => {
      const dto: AnonymizeDto = { subjectId, fields: ['name', 'email', 'phone'] };

      const result = await service.anonymizeData(dto, tenantId);

      expect(result.status).toBe(RequestStatus.CONCLUIDO);
      expect(result.anonymizedFields).toBeDefined();
      expect(result.anonymizedFields.name).toMatch(/^ANONIMIZADO_/);
      expect(result.anonymizedFields.email).toMatch(/^ANONIMIZADO_/);
      expect(result.anonymizedFields.phone).toMatch(/^ANONIMIZADO_/);
      expect(Object.keys(result.anonymizedFields)).toEqual(['name', 'email', 'phone']);
    });

    it('should handle empty fields array', async () => {
      const dto: AnonymizeDto = { subjectId, fields: [] };

      const result = await service.anonymizeData(dto, tenantId);

      expect(result.status).toBe(RequestStatus.CONCLUIDO);
      expect(result.anonymizedFields).toEqual({});
    });

    it('should generate anonymized values with ANONIMIZADO_ prefix', async () => {
      const dto: AnonymizeDto = { subjectId, fields: ['name'] };

      const result = await service.anonymizeData(dto, tenantId);

      expect(result.anonymizedFields.name).toMatch(/^ANONIMIZADO_\d+$/);
    });

    it('should log audit and emit event', async () => {
      const dto: AnonymizeDto = { subjectId, fields: ['email'] };

      await service.anonymizeData(dto, tenantId);

      expect(service['auditLogs'].some(l => l.action === 'DATA_ANONYMIZED')).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'lgpd.data-subject.anonymized',
      }));
    });

    it('should return success message', async () => {
      const dto: AnonymizeDto = { subjectId, fields: ['name'] };

      const result = await service.anonymizeData(dto, tenantId);

      expect(result.message).toBe('Dados anonimizados com sucesso');
    });
  });

  // ────────────────────────────────────────────────
  //  getAuditLog
  // ────────────────────────────────────────────────

  describe('getAuditLog', () => {
    it('should return all audit logs for tenant', async () => {
      await service.registerConsent({ subjectId, purpose: 'A', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      await service.registerConsent({ subjectId: 'sub-2', purpose: 'B', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);

      const result = await service.getAuditLog(tenantId);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.every(l => l.tenantId === tenantId)).toBe(true);
    });

    it('should filter by subjectId when provided', async () => {
      await service.registerConsent({ subjectId, purpose: 'A', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      await service.registerConsent({ subjectId: 'other', purpose: 'B', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);

      const result = await service.getAuditLog(tenantId, { subjectId });

      expect(result.every(l => l.subjectId === subjectId)).toBe(true);
    });

    it('should return empty array for tenant with no logs', async () => {
      const result = await service.getAuditLog('nonexistent-tenant');

      expect(result).toEqual([]);
    });

    it('should not include logs from other tenants', async () => {
      await service.registerConsent({ subjectId, purpose: 'A', lawfulBasis: LawfulBasis.CONSENTIMENTO }, 'other-tenant');

      const result = await service.getAuditLog(tenantId);

      expect(result).toHaveLength(0);
    });

    it('should return all logs when filter is empty', async () => {
      await service.registerConsent({ subjectId, purpose: 'A', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);

      const result = await service.getAuditLog(tenantId, {});

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ────────────────────────────────────────────────
  //  getAuditLogBySubject
  // ────────────────────────────────────────────────

  describe('getAuditLogBySubject', () => {
    it('should return audit logs filtered by subjectId and tenantId', async () => {
      await service.registerConsent({ subjectId, purpose: 'A', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);
      await service.registerConsent({ subjectId: 'other', purpose: 'B', lawfulBasis: LawfulBasis.CONSENTIMENTO }, tenantId);

      const result = await service.getAuditLogBySubject(subjectId, tenantId);

      expect(result.every(l => l.subjectId === subjectId && l.tenantId === tenantId)).toBe(true);
    });

    it('should return empty array for subject with no logs', async () => {
      const result = await service.getAuditLogBySubject('nonexistent', tenantId);

      expect(result).toEqual([]);
    });
  });

  // ────────────────────────────────────────────────
  //  contactDpo
  // ────────────────────────────────────────────────

  describe('contactDpo', () => {
    it('should record DPO contact and return received status', async () => {
      const dto = { name: 'John Doe', email: 'john@example.com', subject: 'Data Request', message: 'Please delete my data' };

      const result = await service.contactDpo(dto, tenantId);

      expect(result.status).toBe('RECEBIDO');
      expect(result.id).toMatch(/^lgpd-/);
      expect(result.message).toContain('Encarregado');
    });

    it('should log DPO_CONTACTED audit', async () => {
      const dto = { name: 'Jane Doe', email: 'jane@example.com', subject: 'Question', message: 'How to opt out?' };

      await service.contactDpo(dto, tenantId);

      expect(service['auditLogs'].some(l => l.action === 'DPO_CONTACTED')).toBe(true);
    });

    it('should emit dpo.contacted event', async () => {
      const dto = { name: 'John', email: 'john@test.com', subject: 'Info', message: 'Hello' };

      await service.contactDpo(dto, tenantId);

      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'lgpd.dpo.contacted',
      }));
    });
  });

  // ────────────────────────────────────────────────
  //  getPolicies
  // ────────────────────────────────────────────────

  describe('getPolicies', () => {
    it('should return policies for given tenantId', async () => {
      const result = await service.getPolicies('default');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('policy-default');
      expect(result[0].tenantId).toBe('default');
    });

    it('should return empty array for tenant without policies', async () => {
      const result = await service.getPolicies('nonexistent');

      expect(result).toEqual([]);
    });
  });

  // ────────────────────────────────────────────────
  //  updatePolicy
  // ────────────────────────────────────────────────

  describe('updatePolicy', () => {
    it('should update existing policy', async () => {
      const dto = { title: 'New Title', content: 'New content', version: '2.0.0' };

      const result = await service.updatePolicy('policy-default', dto, 'default');

      expect(result.title).toBe('New Title');
      expect(result.content).toBe('New content');
      expect(result.version).toBe('2.0.0');
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw Error when policy not found', async () => {
      const dto = { title: 'Test', content: 'Test', version: '1.0.0' };

      await expect(service.updatePolicy('nonexistent', dto, 'default')).rejects.toThrow('Política de privacidade não encontrada');
    });

    it('should throw Error when policy exists but for different tenant', async () => {
      const dto = { title: 'Test', content: 'Test', version: '1.0.0' };

      await expect(service.updatePolicy('policy-default', dto, 'wrong-tenant')).rejects.toThrow('Política de privacidade não encontrada');
    });

    it('should log audit on policy update', async () => {
      const dto = { title: 'Updated', content: 'Updated', version: '2.0.0' };

      await service.updatePolicy('policy-default', dto, 'default');

      expect(service['auditLogs'].some(l => l.action === 'POLICY_UPDATED')).toBe(true);
    });

    it('should emit policy.updated event', async () => {
      const dto = { title: 'Updated', content: 'Updated', version: '2.0.0' };

      await service.updatePolicy('policy-default', dto, 'default');

      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'lgpd.policy.updated',
      }));
    });
  });
});
