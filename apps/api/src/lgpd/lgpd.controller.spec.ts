import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LgpdController } from './lgpd.controller';

describe('LgpdController', () => {
  let controller: LgpdController;
  let lgpdService: any;

  beforeEach(() => {
    lgpdService = {
      registerConsent: vi.fn().mockResolvedValue({ id: 'cons-1' }),
      getConsents: vi.fn().mockResolvedValue([]),
      revokeConsent: vi.fn().mockResolvedValue({ id: 'cons-1', revoked: true }),
      requestDataAccess: vi.fn().mockResolvedValue({ data: {} }),
      exportData: vi.fn().mockResolvedValue({ url: 'https://export.example.com' }),
      deleteData: vi.fn().mockResolvedValue({ deleted: true }),
      anonymizeData: vi.fn().mockResolvedValue({ anonymized: true }),
      getAuditLog: vi.fn().mockResolvedValue([]),
      getAuditLogBySubject: vi.fn().mockResolvedValue([]),
      contactDpo: vi.fn().mockResolvedValue({ ticketId: 'ticket-1' }),
      getPolicies: vi.fn().mockResolvedValue([]),
      updatePolicy: vi.fn().mockResolvedValue({ id: 'pol-1' }),
    };
    controller = new LgpdController(lgpdService);
  });

  it('should call registerConsent with dto and tenantId', async () => {
    const dto = { subjectId: 'subj-1', consentType: 'marketing', granted: true };
    const result = await controller.registerConsent(dto);
    expect(lgpdService.registerConsent).toHaveBeenCalledWith(dto, 'default');
    expect(result).toEqual({ id: 'cons-1' });
  });

  it('should call getConsents with subjectId and tenantId', async () => {
    const result = await controller.getConsents('subj-1');
    expect(lgpdService.getConsents).toHaveBeenCalledWith('subj-1', 'default');
    expect(result).toEqual([]);
  });

  it('should call revokeConsent with id and tenantId', async () => {
    const dto = { revoked: true };
    const result = await controller.revokeConsent('cons-1', dto);
    expect(lgpdService.revokeConsent).toHaveBeenCalledWith('cons-1', 'default');
    expect(result).toEqual({ id: 'cons-1', revoked: true });
  });

  it('should call requestDataAccess with subjectId, requestType, and tenantId', async () => {
    const dto = { subjectId: 'subj-1', requestType: 'full' };
    const result = await controller.requestDataAccess(dto);
    expect(lgpdService.requestDataAccess).toHaveBeenCalledWith('subj-1', 'full', 'default');
    expect(result).toEqual({ data: {} });
  });

  it('should call exportData with dto and tenantId', async () => {
    const dto = { subjectId: 'subj-1', format: 'json' };
    const result = await controller.exportData(dto);
    expect(lgpdService.exportData).toHaveBeenCalledWith(dto, 'default');
    expect(result).toEqual({ url: 'https://export.example.com' });
  });

  it('should call deleteData with dto and tenantId', async () => {
    const dto = { subjectId: 'subj-1' };
    const result = await controller.deleteData(dto);
    expect(lgpdService.deleteData).toHaveBeenCalledWith(dto, 'default');
    expect(result).toEqual({ deleted: true });
  });

  it('should call anonymizeData with dto and tenantId', async () => {
    const dto = { subjectId: 'subj-1' };
    const result = await controller.anonymizeData(dto);
    expect(lgpdService.anonymizeData).toHaveBeenCalledWith(dto, 'default');
    expect(result).toEqual({ anonymized: true });
  });

  it('should call getAuditLog with tenantId and filters', async () => {
    const result = await controller.getAuditLog('subj-1');
    expect(lgpdService.getAuditLog).toHaveBeenCalledWith('default', { subjectId: 'subj-1' });
    expect(result).toEqual([]);
  });

  it('should call getAuditLogBySubject with subjectId and tenantId', async () => {
    const result = await controller.getAuditLogBySubject('subj-1');
    expect(lgpdService.getAuditLogBySubject).toHaveBeenCalledWith('subj-1', 'default');
    expect(result).toEqual([]);
  });

  it('should call contactDpo with dto and tenantId', async () => {
    const dto = { subjectId: 'subj-1', message: 'Question' };
    const result = await controller.contactDpo(dto);
    expect(lgpdService.contactDpo).toHaveBeenCalledWith(dto, 'default');
    expect(result).toEqual({ ticketId: 'ticket-1' });
  });

  it('should call getPolicies with tenantId', async () => {
    const result = await controller.getPolicies();
    expect(lgpdService.getPolicies).toHaveBeenCalledWith('default');
    expect(result).toEqual([]);
  });

  it('should call updatePolicy with id, dto, and tenantId', async () => {
    const dto = { name: 'Updated Policy', content: '...' };
    const result = await controller.updatePolicy('pol-1', dto);
    expect(lgpdService.updatePolicy).toHaveBeenCalledWith('pol-1', dto, 'default');
    expect(result).toEqual({ id: 'pol-1' });
  });
});
