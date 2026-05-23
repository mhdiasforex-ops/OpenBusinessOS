import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceCouncil, ComplianceRecordStatus, CreateComplianceRecordDto, UpdateComplianceRecordDto } from './compliance.dto';

// ── Council Metadata ───────────────────────────────────────────────────

const COUNCIL_METADATA: Record<ComplianceCouncil, {
  name: string;
  fullName: string;
  requirements: string[];
  priority: 'critical' | 'high' | 'medium';
}> = {
  CRM: {
    name: 'CRM',
    fullName: 'Conselho Regional de Medicina',
    requirements: ['PEP', 'Receita Digital'],
    priority: 'critical',
  },
  CFO: {
    name: 'CFO',
    fullName: 'Conselho Federal de Odontologia',
    requirements: ['PEP Odonto', 'Odontograma FDI'],
    priority: 'high',
  },
  OAB: {
    name: 'OAB',
    fullName: 'Ordem dos Advogados do Brasil',
    requirements: ['Livro Caixa', 'Petição Eletrônica'],
    priority: 'high',
  },
  CREA: {
    name: 'CREA',
    fullName: 'Conselho Regional de Engenharia',
    requirements: ['ART Eletrônica'],
    priority: 'medium',
  },
  CAU: {
    name: 'CAU',
    fullName: 'Conselho de Arquitetura e Urbanismo',
    requirements: ['RRT Eletrônico'],
    priority: 'medium',
  },
  CRC: {
    name: 'CRC',
    fullName: 'Conselho Regional de Contabilidade',
    requirements: ['SPED', 'ECD', 'ECF'],
    priority: 'high',
  },
  CRECI: {
    name: 'CRECI',
    fullName: 'Conselho Regional de Corretores de Imóveis',
    requirements: ['Contratos', 'Recibos'],
    priority: 'medium',
  },
};

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private prisma: PrismaService) {}

  // ── CRUD ─────────────────────────────────────────────────────────────

  async createRecord(orgId: string, dto: CreateComplianceRecordDto) {
    return this.prisma.complianceRecord.create({
      data: {
        organizationId: orgId,
        council: dto.council,
        registrationNumber: dto.registrationNumber,
        professionalName: dto.professionalName,
        specialty: dto.specialty,
        state: dto.state,
        status: ComplianceRecordStatus.PENDING_VERIFICATION,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        documentType: dto.documentType,
        documentUrl: dto.documentUrl,
        notes: dto.notes,
        metadata: dto.metadata ?? {},
      },
    });
  }

  async getRecords(
    orgId: string,
    filters: { council?: string; status?: string; search?: string; page?: number; perPage?: number },
  ) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 50, 100);
    const where: any = { organizationId: orgId };

    if (filters.council) where.council = filters.council;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { professionalName: { contains: filters.search, mode: 'insensitive' } },
        { registrationNumber: { contains: filters.search, mode: 'insensitive' } },
        { specialty: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.complianceRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.complianceRecord.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getRecord(orgId: string, id: string) {
    const record = await this.prisma.complianceRecord.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!record) throw new NotFoundException('Registro de compliance não encontrado');
    return record;
  }

  async updateRecord(orgId: string, id: string, dto: UpdateComplianceRecordDto) {
    await this.getRecord(orgId, id);

    const data: any = {};
    if (dto.professionalName !== undefined) data.professionalName = dto.professionalName;
    if (dto.specialty !== undefined) data.specialty = dto.specialty;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.expiresAt !== undefined) data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.documentType !== undefined) data.documentType = dto.documentType;
    if (dto.documentUrl !== undefined) data.documentUrl = dto.documentUrl;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    return this.prisma.complianceRecord.update({
      where: { id },
      data,
    });
  }

  async deleteRecord(orgId: string, id: string) {
    await this.getRecord(orgId, id);
    return this.prisma.complianceRecord.delete({ where: { id } });
  }

  // ── Verify ───────────────────────────────────────────────────────────

  async verifyRecord(orgId: string, id: string) {
    await this.getRecord(orgId, id);

    return this.prisma.complianceRecord.update({
      where: { id },
      data: {
        status: ComplianceRecordStatus.ACTIVE,
        verifiedAt: new Date(),
      },
    });
  }

  // ── Councils ─────────────────────────────────────────────────────────

  async getCouncils() {
    return Object.values(ComplianceCouncil).map((council) => {
      const meta = COUNCIL_METADATA[council];
      return {
        code: council,
        name: meta.name,
        fullName: meta.fullName,
        requirements: meta.requirements,
        priority: meta.priority,
      };
    });
  }

  // ── Stats ────────────────────────────────────────────────────────────

  async getStats(orgId: string) {
    const byCouncil = await this.prisma.complianceRecord.groupBy({
      by: ['council'],
      where: { organizationId: orgId },
      _count: { id: true },
    });

    const byStatus = await this.prisma.complianceRecord.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { id: true },
    });

    const total = await this.prisma.complianceRecord.count({
      where: { organizationId: orgId },
    });

    return {
      total,
      byCouncil: byCouncil.map((item) => ({
        council: item.council,
        label: COUNCIL_METADATA[item.council as ComplianceCouncil]?.fullName ?? item.council,
        count: item._count.id,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
    };
  }

  // ── Expiring ─────────────────────────────────────────────────────────

  async getExpiring(orgId: string, days: number = 30) {
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    return this.prisma.complianceRecord.findMany({
      where: {
        organizationId: orgId,
        expiresAt: {
          gte: now,
          lte: threshold,
        },
        status: { notIn: [ComplianceRecordStatus.SUSPENDED, ComplianceRecordStatus.EXPIRED] },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }
}
