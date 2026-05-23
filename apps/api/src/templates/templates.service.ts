import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './templates.dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private prisma: PrismaService) {}

  async getTemplatesByNiche(niche: string) {
    const templates = await this.prisma.template.findMany({
      where: { niche: niche as any, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    return templates;
  }

  async getTemplatesByNicheAndType(niche: string, type: string) {
    const templates = await this.prisma.template.findMany({
      where: { niche: niche as any, type: type as any, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    return templates;
  }

  async createTemplate(orgId: string, dto: CreateTemplateDto) {
    const template = await this.prisma.template.create({
      data: {
        organizationId: orgId,
        niche: dto.niche as any,
        subniche: (dto.subniche as any) || null,
        type: dto.type as any,
        name: dto.name,
        description: dto.description || '',
        content: dto.content as any,
        isActive: dto.isActive !== false,
        isDefault: dto.isDefault || false,
      },
    });

    this.logger.log(`Template created: ${template.id} (${template.name}) for org ${orgId}`);
    return template;
  }

  async updateTemplate(orgId: string, id: string, dto: UpdateTemplateDto) {
    const existing = await this.prisma.template.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Template não encontrado');

    const data: any = {};
    if (dto.niche !== undefined) data.niche = dto.niche;
    if (dto.subniche !== undefined) data.subniche = dto.subniche || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.content !== undefined) data.content = dto.content as any;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isDefault !== undefined) data.isDefault = dto.isDefault;

    return this.prisma.template.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(orgId: string, id: string) {
    const template = await this.prisma.template.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!template) throw new NotFoundException('Template não encontrado');

    await this.prisma.template.delete({ where: { id } });
    return { message: 'Template removido' };
  }
}
