import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LgpdService } from './lgpd.service';
import {
  RegisterConsentDto,
  UpdateConsentDto,
  DataAccessDto,
  ExportDataDto,
  DeleteDataDto,
  AnonymizeDto,
  ContactDpoDto,
  UpdatePolicyDto,
} from './lgpd.dto';

@ApiTags('lgpd')
@Controller('lgpd')
@ApiBearerAuth()
export class LgpdController {
  constructor(private readonly lgpdService: LgpdService) {}

  // ─── Consent ─────────────────────────────────────────────────

  @Post('consent')
  async registerConsent(@Body() dto: RegisterConsentDto) {
    // TODO: extrair tenantId do request (jwt/tenant guard)
    const tenantId = 'default';
    return this.lgpdService.registerConsent(dto, tenantId);
  }

  @Get('consent/:subjectId')
  async getConsents(@Param('subjectId') subjectId: string) {
    const tenantId = 'default';
    return this.lgpdService.getConsents(subjectId, tenantId);
  }

  @Put('consent/:id')
  async revokeConsent(@Param('id') id: string, @Body() dto: UpdateConsentDto) {
    const tenantId = 'default';
    return this.lgpdService.revokeConsent(id, tenantId);
  }

  // ─── Data Subject ────────────────────────────────────────────

  @Post('data-subject/access')
  async requestDataAccess(@Body() dto: DataAccessDto) {
    const tenantId = 'default';
    return this.lgpdService.requestDataAccess(dto.subjectId, dto.requestType, tenantId);
  }

  @Post('data-subject/export')
  async exportData(@Body() dto: ExportDataDto) {
    const tenantId = 'default';
    return this.lgpdService.exportData(dto, tenantId);
  }

  @Post('data-subject/delete')
  async deleteData(@Body() dto: DeleteDataDto) {
    const tenantId = 'default';
    return this.lgpdService.deleteData(dto, tenantId);
  }

  @Post('data-subject/anonymize')
  async anonymizeData(@Body() dto: AnonymizeDto) {
    const tenantId = 'default';
    return this.lgpdService.anonymizeData(dto, tenantId);
  }

  // ─── Audit ───────────────────────────────────────────────────

  @Get('audit')
  async getAuditLog(@Query('subjectId') subjectId?: string) {
    const tenantId = 'default';
    return this.lgpdService.getAuditLog(tenantId, { subjectId });
  }

  @Get('audit/:subjectId')
  async getAuditLogBySubject(@Param('subjectId') subjectId: string) {
    const tenantId = 'default';
    return this.lgpdService.getAuditLogBySubject(subjectId, tenantId);
  }

  // ─── DPO ─────────────────────────────────────────────────────

  @Post('dpo/contact')
  async contactDpo(@Body() dto: ContactDpoDto) {
    const tenantId = 'default';
    return this.lgpdService.contactDpo(dto, tenantId);
  }

  // ─── Policies ────────────────────────────────────────────────

  @Get('policies')
  async getPolicies() {
    const tenantId = 'default';
    return this.lgpdService.getPolicies(tenantId);
  }

  @Put('policies/:id')
  async updatePolicy(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    const tenantId = 'default';
    return this.lgpdService.updatePolicy(id, dto, tenantId);
  }
}
