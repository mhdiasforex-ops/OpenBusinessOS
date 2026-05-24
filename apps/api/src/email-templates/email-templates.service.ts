import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, EmailTemplateType } from './dto/email-template.dto';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, type?: EmailTemplateType) {
    const where: any = { organizationId: orgId };
    if (type) where.type = type;
    return this.prisma.emailTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(orgId: string, id: string) {
    const tpl = await this.prisma.emailTemplate.findFirst({ where: { id, organizationId: orgId } });
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async create(orgId: string, dto: CreateEmailTemplateDto) {
    return this.prisma.emailTemplate.create({
      data: { ...dto, organizationId: orgId, isActive: dto.isActive ?? true },
    });
  }

  async update(orgId: string, id: string, dto: UpdateEmailTemplateDto) {
    await this.findOne(orgId, id);
    return this.prisma.emailTemplate.update({ where: { id }, data: dto });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.emailTemplate.delete({ where: { id } });
  }

  async preview(orgId: string, id: string, variables: Record<string, string> = {}) {
    const tpl = await this.findOne(orgId, id);
    let rendered = tpl.body;
    for (const [key, val] of Object.entries(variables)) {
      rendered = rendered.replaceAll(`{{${key}}}`, val);
    }
    let subject = tpl.subject;
    for (const [key, val] of Object.entries(variables)) {
      subject = subject.replaceAll(`{{${key}}}`, val);
    }
    return { subject, body: rendered, type: tpl.type };
  }

  async seedDefaults(orgId: string) {
    const defaults = [
      {
        name: 'Boas-vindas',
        subject: 'Bem-vindo(a) à {{companyName}}!',
        body: `<h1>Olá {{customerName}}!</h1><p>Bem-vindo(a) à <strong>{{companyName}}</strong>. Estamos felizes em ter você conosco.</p><p>Atenciosamente,<br/>Equipe {{companyName}}</p>`,
        type: EmailTemplateType.WELCOME,
      },
      {
        name: 'Fatura emitida',
        subject: 'Fatura #{{invoiceNumber}} - {{companyName}}',
        body: `<h1>Fatura #{{invoiceNumber}}</h1><p>Olá {{customerName}},</p><p>Sua fatura no valor de <strong>R$ {{amount}}</strong> foi emitida com vencimento em <strong>{{dueDate}}</strong>.</p><p>Atenciosamente,<br/>Equipe {{companyName}}</p>`,
        type: EmailTemplateType.INVOICE,
      },
      {
        name: 'Lembrete de pagamento',
        subject: 'Lembrete: Fatura #{{invoiceNumber}} vencendo',
        body: `<h1>Lembrete de pagamento</h1><p>Olá {{customerName}},</p><p>Sua fatura <strong>#{{invoiceNumber}}</strong> no valor de <strong>R$ {{amount}}</strong> vence em <strong>{{dueDate}}</strong>.</p><p>Por favor, regularize o pagamento.</p>`,
        type: EmailTemplateType.PAYMENT_REMINDER,
      },
      {
        name: 'Redefinição de senha',
        subject: 'Redefina sua senha - {{companyName}}',
        body: `<h1>Redefinição de senha</h1><p>Olá {{userName}},</p><p>Clique no link abaixo para redefinir sua senha:</p><p><a href="{{resetLink}}">Redefinir senha</a></p><p>Este link expira em 24 horas.</p>`,
        type: EmailTemplateType.PASSWORD_RESET,
      },
      {
        name: 'Confirmação de pedido',
        subject: 'Pedido #{{orderNumber}} confirmado!',
        body: `<h1>Pedido confirmado!</h1><p>Olá {{customerName}},</p><p>Seu pedido <strong>#{{orderNumber}}</strong> foi confirmado com sucesso.</p><p>Total: <strong>R$ {{amount}}</strong></p><p>Você receberá atualizações por e-mail.</p>`,
        type: EmailTemplateType.ORDER_CONFIRMATION,
      },
    ];

    let created = 0;
    for (const tpl of defaults) {
      const exists = await this.prisma.emailTemplate.findFirst({
        where: { organizationId: orgId, type: tpl.type },
      });
      if (!exists) {
        await this.prisma.emailTemplate.create({
          data: { ...tpl, organizationId: orgId, isActive: true },
        });
        created++;
      }
    }
    this.logger.log(`Seeded ${created} default templates for org ${orgId}`);
    return { seeded: created };
  }
}
