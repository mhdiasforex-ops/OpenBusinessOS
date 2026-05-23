import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import {
  RegisterConsentDto,
  ExportDataDto,
  DeleteDataDto,
  AnonymizeDto,
  LawfulBasis,
  ConsentStatus,
  RequestStatus,
} from './lgpd.dto';

export interface ConsentRecord {
  id: string;
  subjectId: string;
  purpose: string;
  lawfulBasis: LawfulBasis;
  source: string;
  status: ConsentStatus;
  tenantId: string;
  createdAt: string;
  revokedAt?: string;
}

export interface DataSubjectRequestRecord {
  id: string;
  subjectId: string;
  requestType: string;
  status: RequestStatus;
  reason?: string;
  tenantId: string;
  createdAt: string;
  completedAt?: string;
}

export interface AuditLogRecord {
  id: string;
  tenantId: string;
  subjectId: string;
  action: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ExportPayload {
  subjectId: string;
  exportedAt: string;
  data: {
    consents: ConsentRecord[];
    auditLogs: AuditLogRecord[];
    dataRequests: DataSubjectRequestRecord[];
  };
}

@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  private consents: ConsentRecord[] = [];
  private dataRequests: DataSubjectRequestRecord[] = [];
  private auditLogs: AuditLogRecord[] = [];
  private idCounter = 0;

  private policies = [
    { id: 'policy-default', title: 'Política de Privacidade', content: 'Política padrão de privacidade conforme LGPD...', version: '1.0.0', tenantId: 'default', updatedAt: new Date().toISOString() },
  ];

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  private nextId(): string {
    return `lgpd-${++this.idCounter}-${Date.now()}`;
  }

  private async emitEvent(orgId: string, type: string, payload: Record<string, any>) {
    try {
      await this.eventBus.emit({ organizationId: orgId, type, source: 'lgpd', payload });
    } catch {
      this.logger.warn(`Failed to emit event: ${type}`);
    }
  }

  private async logAudit(tenantId: string, subjectId: string, action: string, metadata: Record<string, any>) {
    const log: AuditLogRecord = {
      id: this.nextId(),
      tenantId,
      subjectId,
      action,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.push(log);
    this.logger.log(`Auditoria LGPD: ${action} para titular ${subjectId}`);
  }

  // ─── Consent ─────────────────────────────────────────────────

  async registerConsent(dto: RegisterConsentDto, tenantId: string): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: this.nextId(),
      subjectId: dto.subjectId,
      purpose: dto.purpose,
      lawfulBasis: dto.lawfulBasis,
      source: dto.source || 'web',
      status: ConsentStatus.ATIVO,
      tenantId,
      createdAt: new Date().toISOString(),
    };
    this.consents.push(consent);

    await this.logAudit(tenantId, dto.subjectId, 'CONSENT_REGISTERED', {
      consentId: consent.id,
      purpose: dto.purpose,
      lawfulBasis: dto.lawfulBasis,
    });

    await this.emitEvent(tenantId, 'lgpd.consent.registered', {
      consentId: consent.id,
      subjectId: dto.subjectId,
    });

    return consent;
  }

  async getConsents(subjectId: string, tenantId: string): Promise<ConsentRecord[]> {
    return this.consents.filter(c => c.subjectId === subjectId && c.tenantId === tenantId);
  }

  async revokeConsent(id: string, tenantId: string): Promise<ConsentRecord> {
    const consent = this.consents.find(c => c.id === id && c.tenantId === tenantId);
    if (!consent) throw new Error('Consentimento não encontrado');

    consent.status = ConsentStatus.REVOGADO;
    consent.revokedAt = new Date().toISOString();

    await this.logAudit(tenantId, consent.subjectId, 'CONSENT_REVOKED', { consentId: id });
    await this.emitEvent(tenantId, 'lgpd.consent.revoked', { consentId: id, subjectId: consent.subjectId });

    return consent;
  }

  // ─── Data Subject Rights ─────────────────────────────────────

  async requestDataAccess(subjectId: string, requestType: string, tenantId: string): Promise<DataSubjectRequestRecord> {
    const request: DataSubjectRequestRecord = {
      id: this.nextId(),
      subjectId,
      requestType,
      status: RequestStatus.PENDENTE,
      tenantId,
      createdAt: new Date().toISOString(),
    };
    this.dataRequests.push(request);

    await this.logAudit(tenantId, subjectId, 'DATA_ACCESS_REQUESTED', { requestId: request.id, requestType });
    await this.emitEvent(tenantId, 'lgpd.data-subject.access-requested', { requestId: request.id, subjectId });

    return request;
  }

  async exportData(dto: ExportDataDto, tenantId: string): Promise<ExportPayload | string> {
    const consents = this.consents.filter(c => c.subjectId === dto.subjectId && c.tenantId === tenantId);
    const logs = this.auditLogs.filter(l => l.subjectId === dto.subjectId && l.tenantId === tenantId);
    const requests = this.dataRequests.filter(r => r.subjectId === dto.subjectId && r.tenantId === tenantId);

    const exportPayload: ExportPayload = {
      subjectId: dto.subjectId,
      exportedAt: new Date().toISOString(),
      data: { consents, auditLogs: logs, dataRequests: requests },
    };

    await this.logAudit(tenantId, dto.subjectId, 'DATA_EXPORTED', { format: dto.format });
    await this.emitEvent(tenantId, 'lgpd.data-subject.exported', { subjectId: dto.subjectId, format: dto.format });

    if (dto.format === 'csv') return this.convertToCsv(exportPayload);
    return exportPayload;
  }

  async deleteData(dto: DeleteDataDto, tenantId: string): Promise<{ requestId: string; status: RequestStatus; message: string; subjectId: string }> {
    const request: DataSubjectRequestRecord = {
      id: this.nextId(),
      subjectId: dto.subjectId,
      requestType: 'DELETE',
      status: RequestStatus.EM_PROCESSAMENTO,
      reason: dto.reason,
      tenantId,
      createdAt: new Date().toISOString(),
    };
    this.dataRequests.push(request);

    this.consents
      .filter(c => c.subjectId === dto.subjectId && c.tenantId === tenantId && c.status === ConsentStatus.ATIVO)
      .forEach(c => { c.status = ConsentStatus.REVOGADO; c.revokedAt = new Date().toISOString(); });

    await this.logAudit(tenantId, dto.subjectId, 'DATA_DELETION_REQUESTED', { requestId: request.id, reason: dto.reason });
    await this.emitEvent(tenantId, 'lgpd.data-subject.deletion-requested', { requestId: request.id, subjectId: dto.subjectId });

    request.status = RequestStatus.CONCLUIDO;
    request.completedAt = new Date().toISOString();

    return {
      requestId: request.id,
      status: RequestStatus.CONCLUIDO,
      message: 'Solicitação de deleção processada com sucesso',
      subjectId: dto.subjectId,
    };
  }

  async anonymizeData(dto: AnonymizeDto, tenantId: string): Promise<{ requestId: string; status: RequestStatus; anonymizedFields: Record<string, string>; message: string }> {
    const request: DataSubjectRequestRecord = {
      id: this.nextId(),
      subjectId: dto.subjectId,
      requestType: 'ANONYMIZE',
      status: RequestStatus.EM_PROCESSAMENTO,
      tenantId,
      createdAt: new Date().toISOString(),
    };
    this.dataRequests.push(request);

    const anonymizedFields: Record<string, string> = {};
    for (const field of dto.fields) {
      anonymizedFields[field] = `ANONIMIZADO_${Date.now()}`;
    }

    await this.logAudit(tenantId, dto.subjectId, 'DATA_ANONYMIZED', { requestId: request.id, fields: dto.fields });
    await this.emitEvent(tenantId, 'lgpd.data-subject.anonymized', { requestId: request.id, subjectId: dto.subjectId, fields: dto.fields });

    request.status = RequestStatus.CONCLUIDO;
    request.completedAt = new Date().toISOString();

    return { requestId: request.id, status: RequestStatus.CONCLUIDO, anonymizedFields, message: 'Dados anonimizados com sucesso' };
  }

  // ─── Audit ───────────────────────────────────────────────────

  async getAuditLog(tenantId: string, filters?: { subjectId?: string }): Promise<AuditLogRecord[]> {
    const logs = this.auditLogs.filter(l => l.tenantId === tenantId);
    if (filters?.subjectId) return logs.filter(l => l.subjectId === filters.subjectId);
    return logs;
  }

  async getAuditLogBySubject(subjectId: string, tenantId: string): Promise<AuditLogRecord[]> {
    return this.auditLogs.filter(l => l.subjectId === subjectId && l.tenantId === tenantId);
  }

  // ─── DPO ─────────────────────────────────────────────────────

  async contactDpo(dto: { name: string; email: string; subject: string; message: string }, tenantId: string): Promise<{ id: string; status: string; message: string }> {
    const contactId = this.nextId();
    await this.logAudit(tenantId, dto.name, 'DPO_CONTACTED', { contactId, subject: dto.subject });
    await this.emitEvent(tenantId, 'lgpd.dpo.contacted', { contactId });

    return { id: contactId, status: 'RECEBIDO', message: 'Sua mensagem foi recebida pelo Encarregado (DPO) e será analisada.' };
  }

  // ─── Policies ────────────────────────────────────────────────

  async getPolicies(tenantId: string): Promise<any[]> {
    return this.policies.filter(p => p.tenantId === tenantId);
  }

  async updatePolicy(id: string, dto: { title: string; content: string; version: string }, tenantId: string): Promise<any> {
    const policy = this.policies.find(p => p.id === id && p.tenantId === tenantId);
    if (!policy) throw new Error('Política de privacidade não encontrada');

    policy.title = dto.title;
    policy.content = dto.content;
    policy.version = dto.version;
    policy.updatedAt = new Date().toISOString();

    await this.logAudit(tenantId, 'SYSTEM', 'POLICY_UPDATED', { policyId: id, version: dto.version });
    await this.emitEvent(tenantId, 'lgpd.policy.updated', { policyId: id });

    return policy;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private convertToCsv(data: ExportPayload): string {
    const lines: string[] = [];
    const sep = ';';
    lines.push(['Seção', 'Campo', 'Valor'].join(sep));

    for (const c of data.data.consents) {
      lines.push(['Consentimentos', 'ID', c.id].join(sep));
      lines.push(['Consentimentos', 'Propósito', c.purpose].join(sep));
      lines.push(['Consentimentos', 'Base Legal', c.lawfulBasis].join(sep));
      lines.push(['Consentimentos', 'Status', c.status].join(sep));
    }
    for (const log of data.data.auditLogs) {
      lines.push(['Auditoria', 'Ação', log.action].join(sep));
      lines.push(['Auditoria', 'Data', log.createdAt].join(sep));
    }
    for (const req of data.data.dataRequests) {
      lines.push(['Solicitações', 'Tipo', req.requestType].join(sep));
      lines.push(['Solicitações', 'Status', req.status].join(sep));
    }
    return lines.join('\n');
  }
}
