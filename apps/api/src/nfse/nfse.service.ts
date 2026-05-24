import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNfseDto, CancelNfseDto } from './dto/nfse.dto';

@Injectable()
export class NfseService {
  private readonly logger = new Logger(NfseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.nfse.findMany({
        where: { organizationId: orgId },
        include: { customer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.nfse.count({ where: { organizationId: orgId } }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(orgId: string, id: string) {
    const nfse = await this.prisma.nfse.findFirst({
      where: { id, organizationId: orgId },
      include: { customer: true },
    });
    if (!nfse) throw new NotFoundException('NFS-e not found');
    return nfse;
  }

  async getStats(orgId: string) {
    const [issued, cancelled] = await Promise.all([
      this.prisma.nfse.aggregate({ where: { organizationId: orgId, status: 'ISSUED' }, _sum: { amount: true, totalTaxes: true, netAmount: true }, _count: true }),
      this.prisma.nfse.aggregate({ where: { organizationId: orgId, status: 'CANCELLED' }, _sum: { amount: true }, _count: true }),
    ]);
    return {
      totalIssued: issued._count,
      totalCancelled: cancelled._count,
      totalRevenue: issued._sum.amount || 0,
      totalTaxes: issued._sum.totalTaxes || 0,
      netRevenue: issued._sum.netAmount || 0,
    };
  }

  async create(orgId: string, dto: CreateNfseDto) {
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, organizationId: orgId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const count = await this.prisma.nfse.count({ where: { organizationId: orgId } });
    const numero = String(count + 1).padStart(8, '0');
    const codigoVerificacao = Math.random().toString(36).substring(2, 10).toUpperCase();

    const issRate = dto.issRate ?? 5;
    const pisRate = dto.pisRate ?? 0.65;
    const cofinsRate = dto.cofinsRate ?? 3;
    const csllRate = dto.csllRate ?? 1;
    const irRate = dto.irRate ?? 1.5;

    const issAmount = +(dto.amount * (issRate / 100)).toFixed(2);
    const pisAmount = +(dto.amount * (pisRate / 100)).toFixed(2);
    const cofinsAmount = +(dto.amount * (cofinsRate / 100)).toFixed(2);
    const csllAmount = +(dto.amount * (csllRate / 100)).toFixed(2);
    const irAmount = +(dto.amount * (irRate / 100)).toFixed(2);
    const totalTaxes = +(issAmount + pisAmount + cofinsAmount + csllAmount + irAmount).toFixed(2);
    const netAmount = +(dto.amount - totalTaxes).toFixed(2);

    const nfse = await this.prisma.nfse.create({
      data: {
        organizationId: orgId,
        customerId: dto.customerId,
        numero,
        codigoVerificacao,
        serviceDescription: dto.serviceDescription,
        serviceCode: dto.serviceCode,
        amount: dto.amount,
        issRate, pisAmount, cofinsAmount, csllAmount, irAmount, issAmount, totalTaxes, netAmount,
        cityCode: dto.cityCode,
        deductions: dto.deductions,
        issueDate: new Date(),
      },
    });

    this.logger.log(`NFS-e ${numero} issued for org ${orgId}`);
    return nfse;
  }

  async cancel(orgId: string, id: string, dto: CancelNfseDto) {
    const nfse = await this.prisma.nfse.findFirst({ where: { id, organizationId: orgId } });
    if (!nfse) throw new NotFoundException('NFS-e not found');
    if (nfse.status === 'CANCELLED') throw new BadRequestException('NFS-e already cancelled');

    const cancelled = await this.prisma.nfse.update({
      where: { id },
      data: { status: 'CANCELLED', cancellationReason: dto.reason, cancelledAt: new Date() },
    });

    this.logger.log(`NFS-e ${nfse.numero} cancelled for org ${orgId}`);
    return cancelled;
  }

  getCities() {
    return [
      { code: '3550308', name: 'Sao Paulo', state: 'SP' },
      { code: '3304557', name: 'Rio de Janeiro', state: 'RJ' },
      { code: '2927408', name: 'Salvador', state: 'BA' },
      { code: '3106200', name: 'Belo Horizonte', state: 'MG' },
      { code: '4106902', name: 'Curitiba', state: 'PR' },
      { code: '1302603', name: 'Manaus', state: 'AM' },
      { code: '5300108', name: 'Brasilia', state: 'DF' },
      { code: '2304400', name: 'Fortaleza', state: 'CE' },
      { code: '2507507', name: 'Recife', state: 'PE' },
      { code: '2704302', name: 'Maceio', state: 'AL' },
      { code: '5208707', name: 'Goiania', state: 'GO' },
      { code: '2211001', name: 'Teresina', state: 'PI' },
      { code: '1721000', name: 'Palmas', state: 'TO' },
      { code: '5002704', name: 'Campo Grande', state: 'MS' },
      { code: '4205407', name: 'Florianopolis', state: 'SC' },
      { code: '4314902', name: 'Porto Alegre', state: 'RS' },
      { code: '1400100', name: 'Boa Vista', state: 'RR' },
      { code: '1600303', name: 'Macapa', state: 'AP' },
      { code: '2408102', name: 'Natal', state: 'RN' },
      { code: '2800308', name: 'Aracaju', state: 'SE' },
      { code: '1100205', name: 'Porto Velho', state: 'RO' },
      { code: '1501402', name: 'Belem', state: 'PA' },
      { code: '2101400', name: 'Sao Luis', state: 'MA' },
      { code: '5103403', name: 'Cuiaba', state: 'MT' },
      { code: '1200401', name: 'Rio Branco', state: 'AC' },
      { code: '2611606', name: 'Recife', state: 'PE' },
      { code: '3518800', name: 'Guarulhos', state: 'SP' },
      { code: '3509502', name: 'Campinas', state: 'SP' },
    ];
  }
}
