import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
          { resource: 'financial', action: 'manage' },
          { resource: 'crm', action: 'manage' },
          { resource: 'products', action: 'manage' },
          { resource: 'workflows', action: 'manage' },
          { resource: 'analytics', action: 'read' },
        ],
      },
    },
  });

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 12);
  const user = await prisma.user.upsert({
    where: { id: 'user-demo-1' },
    update: {},
    create: {
      id: 'user-demo-1',
      organizationId: org.id,
      email: 'demo@openbusinessos.com',
      name: 'Demo User',
      passwordHash,
      roles: {
        create: { roleId: ownerRole.id },
      },
    },
  });

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'Camiseta Básica',
        sku: 'CAM-001',
        category: 'Vendas',
        costPrice: 15.00,
        salePrice: 39.90,
        unit: 'un',
        stockQuantity: 100,
        minStock: 10,
      },
    }),
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'Calça Jeans',
        sku: 'CAL-001',
        category: 'Vendas',
        costPrice: 35.00,
        salePrice: 89.90,
        unit: 'un',
        stockQuantity: 50,
        minStock: 5,
      },
    }),
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'Tênis Esportivo',
        sku: 'TEN-001',
        category: 'Vendas',
        costPrice: 80.00,
        salePrice: 199.90,
        unit: 'un',
        stockQuantity: 3,
        minStock: 5,
      },
    }),
  ]);

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-0001',
        document: '123.456.789-00',
        segment: 'REGULAR',
        ltv: 1500.00,
        totalOrders: 8,
        lastOrderAt: new Date('2026-04-15'),
        tags: ['varejo', 'recorrente'],
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Maria Oliveira',
        email: 'maria@email.com',
        phone: '(11) 99999-0002',
        segment: 'VIP',
        ltv: 12000.00,
        totalOrders: 25,
        lastOrderAt: new Date('2026-05-10'),
        tags: ['vip', 'atacado'],
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id,
        name: 'Pedro Santos',
        email: 'pedro@email.com',
        phone: '(11) 99999-0003',
        segment: 'AT_RISK',
        ltv: 800.00,
        totalOrders: 2,
        lastOrderAt: new Date('2026-02-01'),
        tags: ['inadimplente'],
      },
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
            config: { message: 'Olá! Seu pagamento está em atraso. Pode regularizar?', to: '{{customerPhone}}' },
          },
          {
            order: 2,
            type: 'DELAY',
            config: { seconds: 259200 }, // 3 days
          },
          {
            order: 3,
            type: 'SEND_EMAIL',
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

  console.log('Seeding completed!');
  console.log({
    organization: org.slug,
    user: user.email,
    products: products.length,
    customers: customers.length,
    transactions: transactions.length,
    workflow: workflow.id,
    dashboard: dashboard.id,
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
