import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceCouncil, ComplianceRecordStatus, CreateComplianceRecordDto, UpdateComplianceRecordDto } from './compliance.dto';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let prisma: any;

  const orgId = 'org-123';

  beforeEach(() => {
    prisma = {
      complianceRecord: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
      },
    };
    service = new ComplianceService(prisma);
  });

  // ──────────────────────────────────────────────
  // CREATE RECORD
  // ──────────────────────────────────────────────

  describe('createRecord', () => {
    it('should create a record with all fields', async () => {
      const dto: CreateComplianceRecordDto = {
        council: ComplianceCouncil.CRC,
        registrationNumber: 'CRC-SP-123456',
        professionalName: 'João Silva',
        specialty: 'Contabilidade Geral',
        state: 'SP',
        expiresAt: '2027-12-31T23:59:59Z',
        documentType: 'Certidão',
        documentUrl: 'https://s3.example.com/doc.pdf',
        notes: 'Documento verificado',
        metadata: { origem: 'upload' },
      };

      const createdRecord = { id: 'rec-1', organizationId: orgId, ...dto, status: ComplianceRecordStatus.PENDING_VERIFICATION, expiresAt: new Date('2027-12-31T23:59:59Z') };
      prisma.complianceRecord.create.mockResolvedValue(createdRecord);

      const result = await service.createRecord(orgId, dto);

      expect(prisma.complianceRecord.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          council: ComplianceCouncil.CRC,
          registrationNumber: 'CRC-SP-123456',
          professionalName: 'João Silva',
          specialty: 'Contabilidade Geral',
          state: 'SP',
          status: ComplianceRecordStatus.PENDING_VERIFICATION,
          expiresAt: new Date('2027-12-31T23:59:59Z'),
          documentType: 'Certidão',
          documentUrl: 'https://s3.example.com/doc.pdf',
          notes: 'Documento verificado',
          metadata: { origem: 'upload' },
        },
      });
      expect(result).toEqual(createdRecord);
    });

    it('should create a record with minimal fields', async () => {
      const dto: CreateComplianceRecordDto = {
        council: ComplianceCouncil.CRM,
        registrationNumber: 'CRM-123',
        professionalName: 'Dr. Maria',
      };

      prisma.complianceRecord.create.mockResolvedValue({ id: 'rec-2', organizationId: orgId, ...dto, status: ComplianceRecordStatus.PENDING_VERIFICATION });

      const result = await service.createRecord(orgId, dto);

      expect(prisma.complianceRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          council: ComplianceCouncil.CRM,
          registrationNumber: 'CRM-123',
          professionalName: 'Dr. Maria',
          status: ComplianceRecordStatus.PENDING_VERIFICATION,
        }),
      });
      expect(result).toBeDefined();
    });

    it('should default expiresAt to null when not provided', async () => {
      const dto: CreateComplianceRecordDto = {
        council: ComplianceCouncil.OAB,
        registrationNumber: 'OAB-123',
        professionalName: 'Dr. Ana',
      };

      prisma.complianceRecord.create.mockResolvedValue({ id: 'rec-3' });

      await service.createRecord(orgId, dto);

      expect(prisma.complianceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expiresAt: null }),
        }),
      );
    });

    it('should default metadata to empty object when not provided', async () => {
      const dto: CreateComplianceRecordDto = {
        council: ComplianceCouncil.CREA,
        registrationNumber: 'CREA-123',
        professionalName: 'Eng. Pedro',
      };

      prisma.complianceRecord.create.mockResolvedValue({ id: 'rec-4' });

      await service.createRecord(orgId, dto);

      expect(prisma.complianceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: {} }),
        }),
      );
    });

    it('should set status to PENDING_VERIFICATION on creation', async () => {
      const dto: CreateComplianceRecordDto = {
        council: ComplianceCouncil.CAU,
        registrationNumber: 'CAU-123',
        professionalName: 'Arq. Lucas',
      };

      prisma.complianceRecord.create.mockResolvedValue({ id: 'rec-5' });

      await service.createRecord(orgId, dto);

      expect(prisma.complianceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ComplianceRecordStatus.PENDING_VERIFICATION }),
        }),
      );
    });

    it('should parse expiresAt string to Date object', async () => {
      const dto: CreateComplianceRecordDto = {
        council: ComplianceCouncil.CRC,
        registrationNumber: 'CRC-123',
        professionalName: 'Cont. Carlos',
        expiresAt: '2028-06-01T00:00:00Z',
      };

      prisma.complianceRecord.create.mockResolvedValue({ id: 'rec-6' });

      await service.createRecord(orgId, dto);

      expect(prisma.complianceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: new Date('2028-06-01T00:00:00Z'),
          }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // GET RECORDS (paginated)
  // ──────────────────────────────────────────────

  describe('getRecords', () => {
    it('should return paginated records with defaults', async () => {
      const records = [{ id: 'rec-1' }, { id: 'rec-2' }];
      prisma.complianceRecord.findMany.mockResolvedValue(records);
      prisma.complianceRecord.count.mockResolvedValue(25);

      const result = await service.getRecords(orgId, {});

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
      expect(prisma.complianceRecord.count).toHaveBeenCalledWith({ where: { organizationId: orgId } });
      expect(result.data).toEqual(records);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(50);
    });

    it('should apply custom pagination', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(100);

      const result = await service.getRecords(orgId, { page: 3, perPage: 20 });

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
      expect(result.page).toBe(3);
      expect(result.perPage).toBe(20);
    });

    it('should not exceed max perPage of 100', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(500);

      const result = await service.getRecords(orgId, { perPage: 200 });

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
      expect(result.perPage).toBe(100);
    });

    it('should filter by council', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      await service.getRecords(orgId, { council: 'CRC' });

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ council: 'CRC' }),
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      await service.getRecords(orgId, { status: 'ACTIVE' });

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should search by professionalName, registrationNumber, and specialty', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      await service.getRecords(orgId, { search: 'João' });

      const callWhere = prisma.complianceRecord.findMany.mock.calls[0][0].where;
      expect(callWhere.OR).toBeDefined();
      expect(callWhere.OR).toEqual([
        { professionalName: { contains: 'João', mode: 'insensitive' } },
        { registrationNumber: { contains: 'João', mode: 'insensitive' } },
        { specialty: { contains: 'João', mode: 'insensitive' } },
      ]);
    });

    it('should combine council, status, and search filters', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      await service.getRecords(orgId, {
        council: 'CRC',
        status: 'ACTIVE',
        search: 'João',
      });

      const callWhere = prisma.complianceRecord.findMany.mock.calls[0][0].where;
      expect(callWhere.council).toBe('CRC');
      expect(callWhere.status).toBe('ACTIVE');
      expect(callWhere.OR).toBeDefined();
    });

    it('should not include OR condition when search is empty', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      await service.getRecords(orgId, { council: 'CRC' });

      const callWhere = prisma.complianceRecord.findMany.mock.calls[0][0].where;
      expect(callWhere.council).toBe('CRC');
      expect(callWhere.OR).toBeUndefined();
    });

    it('should return records in descending creation order', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      await service.getRecords(orgId, {});

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // GET RECORD
  // ──────────────────────────────────────────────

  describe('getRecord', () => {
    it('should return a record when found', async () => {
      const mockRecord = { id: 'rec-1', organizationId: orgId, council: 'CRC', professionalName: 'João Silva' };
      prisma.complianceRecord.findFirst.mockResolvedValue(mockRecord);

      const result = await service.getRecord(orgId, 'rec-1');

      expect(prisma.complianceRecord.findFirst).toHaveBeenCalledWith({
        where: { id: 'rec-1', organizationId: orgId },
      });
      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException when record does not exist', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue(null);

      await expect(service.getRecord(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getRecord(orgId, 'nonexistent')).rejects.toThrow(
        'Registro de compliance não encontrado',
      );
    });

    it('should throw NotFoundException when record belongs to another org', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue(null);

      await expect(service.getRecord('other-org', 'rec-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────
  // UPDATE RECORD
  // ──────────────────────────────────────────────

  describe('updateRecord', () => {
    it('should update a record partially', async () => {
      const existing = { id: 'rec-1', organizationId: orgId, professionalName: 'Old Name' };
      const updated = { ...existing, professionalName: 'New Name' };

      prisma.complianceRecord.findFirst.mockResolvedValue(existing);
      prisma.complianceRecord.update.mockResolvedValue(updated);

      const dto: UpdateComplianceRecordDto = { professionalName: 'New Name' };
      const result = await service.updateRecord(orgId, 'rec-1', dto);

      expect(prisma.complianceRecord.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: { professionalName: 'New Name' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when record does not exist', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRecord(orgId, 'nonexistent', {} as UpdateComplianceRecordDto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.complianceRecord.update).not.toHaveBeenCalled();
    });

    it('should update multiple fields at once', async () => {
      const existing = { id: 'rec-1', organizationId: orgId };
      prisma.complianceRecord.findFirst.mockResolvedValue(existing);
      prisma.complianceRecord.update.mockResolvedValue({ id: 'rec-1' });

      await service.updateRecord(orgId, 'rec-1', {
        professionalName: 'Dr. João',
        specialty: 'Auditoria',
        state: 'RJ',
        status: ComplianceRecordStatus.ACTIVE,
      } as UpdateComplianceRecordDto);

      expect(prisma.complianceRecord.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          professionalName: 'Dr. João',
          specialty: 'Auditoria',
          state: 'RJ',
          status: ComplianceRecordStatus.ACTIVE,
        },
      });
    });

    it('should parse expiresAt date string when updating', async () => {
      const existing = { id: 'rec-1', organizationId: orgId };
      prisma.complianceRecord.findFirst.mockResolvedValue(existing);
      prisma.complianceRecord.update.mockResolvedValue({ id: 'rec-1' });

      await service.updateRecord(orgId, 'rec-1', {
        expiresAt: '2028-12-31T23:59:59Z',
      } as UpdateComplianceRecordDto);

      expect(prisma.complianceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: new Date('2028-12-31T23:59:59Z'),
          }),
        }),
      );
    });

    it('should set expiresAt to null when explicitly passed null', async () => {
      const existing = { id: 'rec-1', organizationId: orgId };
      prisma.complianceRecord.findFirst.mockResolvedValue(existing);
      prisma.complianceRecord.update.mockResolvedValue({ id: 'rec-1' });

      await service.updateRecord(orgId, 'rec-1', {
        expiresAt: null,
      } as UpdateComplianceRecordDto);

      expect(prisma.complianceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expiresAt: null }),
        }),
      );
    });

    it('should update document fields', async () => {
      const existing = { id: 'rec-1', organizationId: orgId };
      prisma.complianceRecord.findFirst.mockResolvedValue(existing);
      prisma.complianceRecord.update.mockResolvedValue({ id: 'rec-1' });

      await service.updateRecord(orgId, 'rec-1', {
        documentType: 'Certidão Atualizada',
        documentUrl: 'https://s3.example.com/new.pdf',
      } as UpdateComplianceRecordDto);

      expect(prisma.complianceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentType: 'Certidão Atualizada',
            documentUrl: 'https://s3.example.com/new.pdf',
          }),
        }),
      );
    });

    it('should update notes and metadata', async () => {
      const existing = { id: 'rec-1', organizationId: orgId };
      prisma.complianceRecord.findFirst.mockResolvedValue(existing);
      prisma.complianceRecord.update.mockResolvedValue({ id: 'rec-1' });

      await service.updateRecord(orgId, 'rec-1', {
        notes: 'Revisado',
        metadata: { revisadoEm: '2026-01-15' },
      } as UpdateComplianceRecordDto);

      expect(prisma.complianceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: 'Revisado',
            metadata: { revisadoEm: '2026-01-15' },
          }),
        }),
      );
    });

    it('should not include undefined fields in update data', async () => {
      const existing = { id: 'rec-1', organizationId: orgId };
      prisma.complianceRecord.findFirst.mockResolvedValue(existing);
      prisma.complianceRecord.update.mockResolvedValue({ id: 'rec-1' });

      const dto: UpdateComplianceRecordDto = { professionalName: 'Only This' };
      await service.updateRecord(orgId, 'rec-1', dto);

      const updateData = prisma.complianceRecord.update.mock.calls[0][0].data;
      expect(Object.keys(updateData)).toEqual(['professionalName']);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE RECORD
  // ──────────────────────────────────────────────

  describe('deleteRecord', () => {
    it('should delete an existing record', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue({ id: 'rec-1', organizationId: orgId });
      prisma.complianceRecord.delete.mockResolvedValue({ id: 'rec-1' });

      const result = await service.deleteRecord(orgId, 'rec-1');

      expect(prisma.complianceRecord.findFirst).toHaveBeenCalledWith({
        where: { id: 'rec-1', organizationId: orgId },
      });
      expect(prisma.complianceRecord.delete).toHaveBeenCalledWith({ where: { id: 'rec-1' } });
      expect(result).toEqual({ id: 'rec-1' });
    });

    it('should throw NotFoundException when record does not exist', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue(null);

      await expect(service.deleteRecord(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.complianceRecord.delete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // VERIFY RECORD
  // ──────────────────────────────────────────────

  describe('verifyRecord', () => {
    it('should set status to ACTIVE and set verifiedAt date', async () => {
      const existing = { id: 'rec-1', organizationId: orgId, status: ComplianceRecordStatus.PENDING_VERIFICATION };
      prisma.complianceRecord.findFirst.mockResolvedValue(existing);

      const verifiedRecord = { ...existing, status: ComplianceRecordStatus.ACTIVE, verifiedAt: new Date() };
      prisma.complianceRecord.update.mockResolvedValue(verifiedRecord);

      const result = await service.verifyRecord(orgId, 'rec-1');

      expect(prisma.complianceRecord.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          status: ComplianceRecordStatus.ACTIVE,
          verifiedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe(ComplianceRecordStatus.ACTIVE);
      expect(result.verifiedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when record does not exist', async () => {
      prisma.complianceRecord.findFirst.mockResolvedValue(null);

      await expect(service.verifyRecord(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.complianceRecord.update).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // GET COUNCILS
  // ──────────────────────────────────────────────

  describe('getCouncils', () => {
    it('should return metadata for all councils', async () => {
      const councils = await service.getCouncils();

      expect(councils).toHaveLength(7);
      expect(councils.map((c) => c.code)).toEqual([
        ComplianceCouncil.CRM,
        ComplianceCouncil.CFO,
        ComplianceCouncil.OAB,
        ComplianceCouncil.CREA,
        ComplianceCouncil.CAU,
        ComplianceCouncil.CRC,
        ComplianceCouncil.CRECI,
      ]);
    });

    it('should return full metadata for each council', async () => {
      const councils = await service.getCouncils();
      const crc = councils.find((c) => c.code === ComplianceCouncil.CRC);

      expect(crc).toEqual({
        code: ComplianceCouncil.CRC,
        name: 'CRC',
        fullName: 'Conselho Regional de Contabilidade',
        requirements: ['SPED', 'ECD', 'ECF'],
        priority: 'high',
      });
    });

    it('should return priority ratings correctly', async () => {
      const councils = await service.getCouncils();
      const crm = councils.find((c) => c.code === ComplianceCouncil.CRM);
      const crea = councils.find((c) => c.code === ComplianceCouncil.CREA);

      expect(crm!.priority).toBe('critical');
      expect(crea!.priority).toBe('medium');
    });
  });

  // ──────────────────────────────────────────────
  // GET STATS
  // ──────────────────────────────────────────────

  describe('getStats', () => {
    it('should return aggregated stats by council and status', async () => {
      prisma.complianceRecord.groupBy
        .mockResolvedValueOnce([
          { council: 'CRC', _count: { id: 5 } },
          { council: 'OAB', _count: { id: 3 } },
        ])
        .mockResolvedValueOnce([
          { status: 'ACTIVE', _count: { id: 6 } },
          { status: 'PENDING_VERIFICATION', _count: { id: 2 } },
        ]);
      prisma.complianceRecord.count.mockResolvedValue(8);

      const result = await service.getStats(orgId);

      expect(prisma.complianceRecord.groupBy).toHaveBeenCalledWith({
        by: ['council'],
        where: { organizationId: orgId },
        _count: { id: true },
      });
      expect(prisma.complianceRecord.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      });
      expect(prisma.complianceRecord.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });

      expect(result).toEqual({
        total: 8,
        byCouncil: [
          { council: 'CRC', label: 'Conselho Regional de Contabilidade', count: 5 },
          { council: 'OAB', label: 'Ordem dos Advogados do Brasil', count: 3 },
        ],
        byStatus: [
          { status: 'ACTIVE', count: 6 },
          { status: 'PENDING_VERIFICATION', count: 2 },
        ],
      });
    });

    it('should return empty arrays when no records exist', async () => {
      prisma.complianceRecord.groupBy.mockResolvedValue([]).mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      const result = await service.getStats(orgId);

      expect(result.total).toBe(0);
      expect(result.byCouncil).toEqual([]);
      expect(result.byStatus).toEqual([]);
    });

    it('should map council labels correctly for unknown councils', async () => {
      prisma.complianceRecord.groupBy
        .mockResolvedValueOnce([
          { council: 'UNKNOWN_COUNCIL', _count: { id: 1 } },
        ])
        .mockResolvedValueOnce([]);
      prisma.complianceRecord.count.mockResolvedValue(1);

      const result = await service.getStats(orgId);

      expect(result.byCouncil[0].label).toBe('UNKNOWN_COUNCIL');
    });

    it('should verify groupBy is called with correct where clause', async () => {
      prisma.complianceRecord.groupBy.mockResolvedValue([]).mockResolvedValue([]);
      prisma.complianceRecord.count.mockResolvedValue(0);

      await service.getStats(orgId);

      expect(prisma.complianceRecord.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: orgId } }),
      );
      expect(prisma.complianceRecord.groupBy).toHaveBeenCalledTimes(2);
    });
  });

  // ──────────────────────────────────────────────
  // GET EXPIRING
  // ──────────────────────────────────────────────

  describe('getExpiring', () => {
    it('should find records expiring within default 30 days', async () => {
      const mockRecords = [{ id: 'rec-1', expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) }];
      prisma.complianceRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.getExpiring(orgId);

      const findManyCall = prisma.complianceRecord.findMany.mock.calls[0][0];
      expect(findManyCall.where.organizationId).toBe(orgId);
      expect(findManyCall.where.expiresAt).toBeDefined();
      expect(findManyCall.where.expiresAt.gte).toBeInstanceOf(Date);
      expect(findManyCall.where.expiresAt.lte).toBeInstanceOf(Date);
      expect(findManyCall.where.status).toEqual({
        notIn: [ComplianceRecordStatus.SUSPENDED, ComplianceRecordStatus.EXPIRED],
      });
      expect(findManyCall.orderBy).toEqual({ expiresAt: 'asc' });
      expect(result).toEqual(mockRecords);
    });

    it('should find records expiring within custom number of days', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);

      await service.getExpiring(orgId, 60);

      const findManyCall = prisma.complianceRecord.findMany.mock.calls[0][0];
      expect(findManyCall.where.expiresAt.lte).toBeInstanceOf(Date);
      const now = Date.now();
      const diff = findManyCall.where.expiresAt.lte.getTime() - now;
      expect(diff).toBeGreaterThan(59 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(61 * 24 * 60 * 60 * 1000);
    });

    it('should exclude SUSPENDED records', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);

      await service.getExpiring(orgId, 30);

      const findManyCall = prisma.complianceRecord.findMany.mock.calls[0][0];
      expect(findManyCall.where.status.notIn).toContain(ComplianceRecordStatus.SUSPENDED);
    });

    it('should exclude EXPIRED records', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);

      await service.getExpiring(orgId, 30);

      const findManyCall = prisma.complianceRecord.findMany.mock.calls[0][0];
      expect(findManyCall.where.status.notIn).toContain(ComplianceRecordStatus.EXPIRED);
    });

    it('should order results by expiresAt ascending', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);

      await service.getExpiring(orgId, 30);

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { expiresAt: 'asc' } }),
      );
    });

    it('should return empty array when no records expiring soon', async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);

      const result = await service.getExpiring(orgId, 30);

      expect(result).toEqual([]);
    });
  });
});
