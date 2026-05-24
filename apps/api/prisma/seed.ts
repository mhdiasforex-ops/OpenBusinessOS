import { PrismaClient, Niche, TemplateType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ALL_NICHE_TEMPLATES } from '../src/templates/seed-data';
import { HEALTH_CARE_TEMPLATES, EDUCATION_TEMPLATES, CONSTRUCTION_TEMPLATES, OTHER_TEMPLATES } from '../src/templates/seed-data-2';
import { BEAUTY_TEMPLATES, FITNESS_TEMPLATES, LEGAL_TEMPLATES, ACCOUNTING_TEMPLATES } from '../src/templates/seed-data-3';
import { TECH_SERVICES_TEMPLATES, REAL_ESTATE_TEMPLATES, AUTOMOTIVE_TEMPLATES, AGRICULTURE_TEMPLATES } from '../src/templates/seed-data-4';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-empresa' },
    update: {},
    create: {
      name: 'Demo Empresa',
      slug: 'demo-empresa',
      niche: 'RETAIL',
      plan: 'FREE',
      settings: {
        onboarding: { completed: true, completedSteps: ['categories', 'products', 'workflows', 'tips'] },
        categories: {
          income: ['Vendas', 'Serviços', 'Outros'],
          expense: ['Compras', 'Despesas Fixas', 'Impostos', 'Salários'],
        },
      },
    },
  });

  // Create owner role
  const ownerRole = await prisma.role.upsert({
    where: { id: 'role-owner-demo' },
    update: {},
    create: {
      id: 'role-owner-demo',
      name: 'owner',
      organizationId: org.id,
      permissions: {
        create: [
 { resource: 'organization', action: 'manage' },
 { resource: 'users', action: 'manage' },
 { resource: 'users', action: 'read' },
 { resource: 'financial', action: 'manage' },
 { resource: 'crm', action: 'manage' },
 { resource: 'products', action: 'manage' },
 { resource: 'workflows', action: 'manage' },
 { resource: 'analytics', action: 'read' },
 { resource: 'notifications', action: 'read' },
 { resource: 'notifications', action: 'manage' },
 { resource: 'contracts', action: 'read' },
 { resource: 'contracts', action: 'manage' },
 { resource: 'suppliers', action: 'read' },
 { resource: 'suppliers', action: 'manage' },
 { resource: 'inventory', action: 'read' },
 { resource: 'inventory', action: 'manage' },
 { resource: 'sales', action: 'read' },
 { resource: 'sales', action: 'manage' },
 { resource: 'reports', action: 'read' },
 { resource: 'reports', action: 'manage' },
 { resource: 'compliance', action: 'read' },
 { resource: 'compliance', action: 'manage' },
 { resource: 'payment', action: 'read' },
 { resource: 'payment', action: 'manage' },
 { resource: 'lgpd', action: 'read' },
 { resource: 'lgpd', action: 'manage' },
 { resource: 'scheduler', action: 'read' },
 { resource: 'scheduler', action: 'manage' },
 { resource: 'rh', action: 'read' },
 { resource: 'rh', action: 'manage' },
 { resource: 'fiscal', action: 'read' },
 { resource: 'fiscal', action: 'manage' },
 { resource: 'omnichannel', action: 'read' },
 { resource: 'omnichannel', action: 'manage' },
 { resource: 'templates', action: 'read' },
 { resource: 'templates', action: 'manage' },
 { resource: 'cms', action: 'read' },
 { resource: 'cms', action: 'manage' },
 { resource: 'whatsapp', action: 'read' },
 { resource: 'whatsapp', action: 'manage' },
 { resource: 'events', action: 'read' },
 { resource: 'events', action: 'manage' },
 { resource: 'onboarding', action: 'read' },
 { resource: 'onboarding', action: 'manage' },
        ],
      },
    },
  });

  // Create demo user — credentials: demo@businessos.com / demo1234
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { id: 'user-demo-1' },
    update: { passwordHash },
    create: {
      id: 'user-demo-1',
      organizationId: org.id,
      email: 'demo@businessos.com',
      name: 'Demo User',
      passwordHash,
      roles: {
        create: { roleId: ownerRole.id },
      },
    },
  });

 // Create sample products
 const products = await Promise.all([
 prisma.product.upsert({
 where: { organizationId_sku: { organizationId: org.id, sku: 'CAM-001' } },
 update: {},
 create: { organizationId: org.id, name: 'Camiseta Básica', sku: 'CAM-001', category: 'Vendas', costPrice: 15.00, salePrice: 39.90, unit: 'un', stockQuantity: 100, minStock: 10 },
 }),
 prisma.product.upsert({
 where: { organizationId_sku: { organizationId: org.id, sku: 'CAL-001' } },
 update: {},
 create: { organizationId: org.id, name: 'Calça Jeans', sku: 'CAL-001', category: 'Vendas', costPrice: 35.00, salePrice: 89.90, unit: 'un', stockQuantity: 50, minStock: 5 },
 }),
 prisma.product.upsert({
 where: { organizationId_sku: { organizationId: org.id, sku: 'TEN-001' } },
 update: {},
 create: { organizationId: org.id, name: 'Tênis Esportivo', sku: 'TEN-001', category: 'Vendas', costPrice: 80.00, salePrice: 199.90, unit: 'un', stockQuantity: 3, minStock: 5 },
 }),
 ]);

 // Create sample customers (skip if already exist)
 const customers = await Promise.all([
 prisma.customer.upsert({
 where: { organizationId_email: { organizationId: org.id, email: 'joao@email.com' } },
 update: {},
 create: { organizationId: org.id, name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-0001', document: '123.456.789-00', segment: 'REGULAR', ltv: 1500.00, totalOrders: 8, lastOrderAt: new Date('2026-04-15'), tags: ['varejo', 'recorrente'] },
 }),
 prisma.customer.upsert({
 where: { organizationId_email: { organizationId: org.id, email: 'maria@email.com' } },
 update: {},
 create: { organizationId: org.id, name: 'Maria Oliveira', email: 'maria@email.com', phone: '(11) 99999-0002', segment: 'VIP', ltv: 12000.00, totalOrders: 25, lastOrderAt: new Date('2026-05-10'), tags: ['vip', 'atacado'] },
 }),
 prisma.customer.upsert({
 where: { organizationId_email: { organizationId: org.id, email: 'pedro@email.com' } },
 update: {},
 create: { organizationId: org.id, name: 'Pedro Santos', email: 'pedro@email.com', phone: '(11) 99999-0003', segment: 'AT_RISK', ltv: 800.00, totalOrders: 2, lastOrderAt: new Date('2026-02-01'), tags: ['inadimplente'] },
 }),
 ]);

  // Create sample transactions
  const now = new Date();
  const transactions = [];

  for (let i = 0; i < 15; i++) {
    const isIncome = i < 8;
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const tx = await prisma.transaction.create({
      data: {
        organizationId: org.id,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        category: isIncome
          ? ['Vendas', 'Serviços', 'Outros'][Math.floor(Math.random() * 3)]
          : ['Compras', 'Despesas Fixas', 'Impostos', 'Salários'][Math.floor(Math.random() * 4)],
        amount: isIncome
          ? Math.round((Math.random() * 500 + 50) * 100) / 100
          : Math.round((Math.random() * 300 + 20) * 100) / 100,
        description: isIncome
          ? ['Venda de camisetas', 'Venda de calças', 'Serviço de consultoria', 'Venda online'][Math.floor(Math.random() * 4)]
          : ['Compra de estoque', 'Aluguel', 'Conta de luz', 'Pagamento fornecedor'][Math.floor(Math.random() * 4)],
        customerId: isIncome ? customers[Math.floor(Math.random() * customers.length)].id : null,
        dueDate: date,
        paidAt: Math.random() > 0.3 ? date : null,
        status: Math.random() > 0.3 ? 'PAID' : (Math.random() > 0.5 ? 'PENDING' : 'OVERDUE'),
        paymentMethod: Math.random() > 0.3 ? 'PIX' : (Math.random() > 0.5 ? 'CREDIT_CARD' : 'CASH'),
        auditTrail: { createdBy: user.id, createdAt: date.toISOString() },
      },
    });
    transactions.push(tx);
  }

  // Create sample workflow
  const workflow = await prisma.workflow.create({
    data: {
      organization: { connect: { id: org.id } },
      name: 'Lembrete de Pagamento em Atraso',
      trigger: 'PAYMENT_OVERDUE',
      isActive: true,
      steps: {
        create: [
        {
          order: 1,
          type: 'SEND_WHATSAPP',
          organizationId: org.id,
          config: { message: 'Olá! Seu pagamento está em atraso. Pode regularizar?', to: '{{customerPhone}}' },
        },
        {
          order: 2,
          type: 'DELAY',
          organizationId: org.id,
          config: { seconds: 259200 }, // 3 days
        },
        {
          order: 3,
          type: 'SEND_EMAIL',
          organizationId: org.id,
          config: { subject: 'Pagamento em atraso — 2ª cobrança', to: '{{customerEmail}}' },
        },
        ],
      },
    },
  });

  // Create default dashboard
  const dashboard = await prisma.dashboard.create({
    data: {
      organizationId: org.id,
      name: 'Dashboard Principal',
      isDefault: true,
      layout: {
        widgets: [
          { type: 'kpi', title: 'Receita Mensal', position: { x: 0, y: 0, w: 3, h: 2 } },
          { type: 'kpi', title: 'Despesas', position: { x: 3, y: 0, w: 3, h: 2 } },
          { type: 'kpi', title: 'Saldo', position: { x: 6, y: 0, w: 3, h: 2 } },
          { type: 'kpi', title: 'Clientes Ativos', position: { x: 9, y: 0, w: 3, h: 2 } },
          { type: 'chart', title: 'Receita x Despesa', chartType: 'line', position: { x: 0, y: 2, w: 6, h: 4 } },
          { type: 'chart', title: 'Gastos por Categoria', chartType: 'donut', position: { x: 6, y: 2, w: 6, h: 4 } },
          { type: 'table', title: 'Contas a Vencer', position: { x: 0, y: 6, w: 12, h: 4 } },
        ],
      },
    },
  });

 // Seed templates for all 16 niches
 console.log('Seeding templates...');
 const allTemplateArrays = [
   ...Object.values(ALL_NICHE_TEMPLATES),
   HEALTH_CARE_TEMPLATES,
   EDUCATION_TEMPLATES,
   CONSTRUCTION_TEMPLATES,
   OTHER_TEMPLATES,
   BEAUTY_TEMPLATES,
   FITNESS_TEMPLATES,
   LEGAL_TEMPLATES,
   ACCOUNTING_TEMPLATES,
   TECH_SERVICES_TEMPLATES,
   REAL_ESTATE_TEMPLATES,
   AUTOMOTIVE_TEMPLATES,
   AGRICULTURE_TEMPLATES,
 ];

 let templateCount = 0;
 for (const templates of allTemplateArrays) {
   for (const t of templates) {
     const existing = await prisma.template.findFirst({
       where: { organizationId: org.id, niche: t.niche, name: t.name, type: t.type },
     });
     if (!existing) {
       await prisma.template.create({
         data: {
           organizationId: org.id,
           niche: t.niche,
           subniche: null,
           type: t.type,
           name: t.name,
           description: t.description,
           content: t.content as any,
           isActive: true,
           isDefault: t.isDefault,
         },
       });
       templateCount++;
     }
   }
 }

 console.log('Seeding completed!');
 console.log({
 organization: org.slug,
 user: user.email,
 products: products.length,
 customers: customers.length,
 transactions: transactions.length,
 workflow: workflow.id,
 dashboard: dashboard.id,
 templates: templateCount,
 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
