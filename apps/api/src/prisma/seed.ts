import { PrismaClient, Niche, Plan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'organization:manage', 'users:manage', 'users:read',
    'financial:manage', 'financial:read',
    'crm:manage', 'crm:read',
    'products:manage', 'products:read',
    'workflows:manage', 'workflows:read',
    'analytics:read', 'settings:manage',
  ],
  admin: [
    'users:manage', 'users:read',
    'financial:manage', 'financial:read',
    'crm:manage', 'crm:read',
    'products:manage', 'products:read',
    'workflows:manage', 'workflows:read',
    'analytics:read',
  ],
  manager: [
    'users:read', 'financial:read',
    'crm:manage', 'crm:read',
    'products:manage', 'products:read',
    'workflows:read', 'analytics:read',
  ],
  viewer: [
    'users:read', 'financial:read',
    'crm:read', 'products:read',
    'workflows:read', 'analytics:read',
  ],
};

async function main() {
  console.log('Seeding database...');

  const org = await prisma.organization.upsert({
    where: { slug: 'demo-businessos' },
    update: {},
    create: {
      name: 'Demo BusinessOS',
      slug: 'demo-businessos',
      niche: Niche.PROFESSIONAL_SERVICES,
      plan: Plan.PRO,
      settings: JSON.stringify({ currency: 'BRL', timezone: 'America/Sao_Paulo' }),
    },
  });

  console.log(`Organization: ${org.name} (${org.id})`);

  for (const [roleName, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
    const existing = await prisma.role.findFirst({
      where: { name: roleName, organizationId: org.id },
    });
    if (!existing) {
      await prisma.role.create({
        data: {
          name: roleName,
          organizationId: org.id,
          permissions: {
            create: perms.map((p) => {
              const [resource, action] = p.split(':');
              return { resource, action };
            }),
          },
        },
      });
      console.log(`  Role created: ${roleName}`);
    }
  }

  const ownerRole = await prisma.role.findFirst({
    where: { name: 'owner', organizationId: org.id },
  });

  const passwordHash = await bcrypt.hash('demo123', 12);
  const user = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'demo@businessos.com' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Demo User',
      email: 'demo@businessos.com',
      passwordHash,
      roles: { create: { roleId: ownerRole!.id } },
    },
  });
  console.log(`  User: ${user.email} (${user.id})`);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        organizationId: org.id, name: 'Consultoria Estrategica', sku: 'CONS-001',
        category: 'Servicos', costPrice: 0, salePrice: 500, unit: 'h',
      },
    }),
    prisma.product.create({
      data: {
        organizationId: org.id, name: 'Plano Mensal', sku: 'PLAN-001',
        category: 'Assinatura', costPrice: 50, salePrice: 299, unit: 'un',
      },
    }),
  ]);
  console.log(`  Products: ${products.length} created`);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: org.id, name: 'Empresa Alpha', email: 'contato@alpha.com',
        phone: '(11) 99999-0001', segment: 'VIP', ltv: 15000, totalOrders: 12,
        tags: ['premium', 'recorrente'],
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: org.id, name: 'Startup Beta', email: 'contato@beta.com',
        phone: '(11) 99999-0002', segment: 'NEW', ltv: 0, totalOrders: 0,
        tags: ['novo'],
      },
    }),
  ]);
  console.log(`  Customers: ${customers.length} created`);

  const now = new Date();
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        organizationId: org.id, type: 'INCOME', category: 'Servicos', amount: 5000,
        description: 'Consultoria - Empresa Alpha', customerId: customers[0].id,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        paidAt: new Date(now.getFullYear(), now.getMonth(), 3),
        status: 'PAID', paymentMethod: 'PIX',
      },
    }),
    prisma.transaction.create({
      data: {
        organizationId: org.id, type: 'EXPENSE', category: 'Software', amount: 299,
        description: 'Assinatura Ferramenta X',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        paidAt: new Date(now.getFullYear(), now.getMonth(), 10),
        status: 'PAID', paymentMethod: 'CREDIT_CARD',
      },
    }),
    prisma.transaction.create({
      data: {
        organizationId: org.id, type: 'INCOME', category: 'Assinatura', amount: 299,
        description: 'Plano Mensal - Startup Beta', customerId: customers[1].id,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        status: 'PENDING',
      },
    }),
  ]);
  console.log(`  Transactions: ${transactions.length} created`);

  await prisma.dashboard.create({
    data: {
      organizationId: org.id, name: 'Dashboard Principal',
      layout: JSON.stringify({
        widgets: [
          { type: 'revenue', position: { x: 0, y: 0, w: 6, h: 4 } },
          { type: 'expenses', position: { x: 6, y: 0, w: 6, h: 4 } },
          { type: 'cashflow', position: { x: 0, y: 4, w: 12, h: 4 } },
        ],
      }),
      isDefault: true,
    },
  });
  console.log('  Default dashboard created');

  console.log('\nSeed completed successfully!');
  console.log('\nLogin: demo@businessos.com / demo123');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
