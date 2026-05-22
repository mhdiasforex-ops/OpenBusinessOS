import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { ConfigGeneratorService } from './config-generator.service';

@Injectable()
export class OnboardingService {
 private readonly logger = new Logger(OnboardingService.name);

 constructor(
 private prisma: PrismaService,
 private eventBus: EventBusService,
 private configGenerator: ConfigGeneratorService,
 ) {}

 async getConfig(niche: string) {
 return this.configGenerator.getConfig(niche);
 }

 async startOnboarding(orgId: string, niche: string) {
 const config = this.configGenerator.getConfig(niche);

 // Update organization niche
 await this.prisma.organization.update({
 where: { id: orgId },
 data: { niche: niche as any },
 });

 return {
 niche: config.name,
 steps: [
 { id: 'categories', title: 'Categorias Financeiras', description: 'Configure as categorias de receita e despesa', preconfigured: config.categories },
 { id: 'products', title: 'Produtos/Serviços', description: 'Cadastre seus principais produtos e serviços', templates: config.defaultProducts },
 { id: 'workflows', title: 'Automações', description: 'Configure automações para seu negócio', templates: config.defaultWorkflows },
 { id: 'tips', title: 'Dicas', description: 'Dicas específicas para seu nicho', tips: config.tips },
 ],
 };
 }

 async completeStep(orgId: string, stepId: string, data: Record<string, any>) {
 // Store onboarding progress in organization settings
 const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
 if (!org) throw new NotFoundException('Organização não encontrada');

 const settings = (org.settings as Record<string, any>) || {};
 const onboarding = settings.onboarding || { completedSteps: [] };

 if (!onboarding.completedSteps.includes(stepId)) {
 onboarding.completedSteps.push(stepId);
 }

 if (stepId === 'categories' && data.categories) {
 onboarding.categories = data.categories;
 }

 if (stepId === 'products' && data.products) {
 for (const product of data.products) {
 await this.prisma.product.create({
 data: {
 organizationId: orgId,
 name: product.name,
 sku: product.sku || `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
 category: product.category,
 costPrice: product.costPrice || 0,
 salePrice: product.salePrice || 0,
 unit: product.unit || 'un',
 minStock: product.minStock || 5,
 },
 });
 }
 }

 if (stepId === 'workflows' && data.workflows) {
 for (const wf of data.workflows) {
 await this.prisma.workflow.create({
 data: {
 organizationId: orgId,
 name: wf.name,
 trigger: wf.trigger,
 isActive: true,
 steps: {
 create: (wf.steps || []).map((step: any, index: number) => ({
 organizationId: orgId,
 order: index + 1,
 type: step.type,
 config: step.config,
 fallback: step.fallback,
 })),
 },
 },
 });
 }
 }

 await this.prisma.organization.update({
 where: { id: orgId },
 data: { settings: { ...settings, onboarding } },
 });

 return { stepId, completed: true, totalSteps: 4, completedSteps: onboarding.completedSteps.length };
 }

 async completeOnboarding(orgId: string) {
 const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
 if (!org) throw new NotFoundException('Organização não encontrada');

 const settings = (org.settings as Record<string, any>) || {};
 const onboarding = settings.onboarding || {};

 await this.prisma.organization.update({
 where: { id: orgId },
 data: { settings: { ...settings, onboarding: { ...onboarding, completed: true, completedAt: new Date().toISOString() } } },
 });

 await this.eventBus.emit({
 organizationId: orgId,
 type: EventTypes.ONBOARDING_COMPLETED,
 source: 'onboarding-service',
 payload: {
 organizationId: orgId,
 niche: org.niche,
 completedSteps: onboarding.completedSteps || [],
 },
 });

 this.logger.log(`Onboarding completed for org ${orgId}`);
 return { message: 'Onboarding concluído!', niche: org.niche };
 }
}
