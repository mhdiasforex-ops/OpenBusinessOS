# OpenBusinessOS

> Ecossistema de Gestão Empresarial Open Source para Micro e Pequenas Empresas Brasileiras

## Visão Geral

OpenBusinessOS é um monorepo full-stack que oferece gestão financeira, CRM, automações (workflows), analytics e onboarding adaptativo — tudo multi-tenant e orientado a eventos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Frontend | Next.js 14 (App Router), Zustand, TanStack Query, TailwindCSS |
| Backend | NestJS 10 (Fastify), Prisma 5, PostgreSQL 16 |
| Eventos | Redis Pub/Sub (EventBus) |
| Auth | next-auth v4 + JWT |
| Multi-Tenant | AsyncLocalStorage + isolamento por organizationId |

## Estrutura

```
openbusinessos/
├── apps/
│   ├── api/          # NestJS backend (Prisma, guards, event-driven)
│   └── web/          # Next.js frontend (App Router, Zustand stores)
├── packages/
│   ├── event-definitions/  # Tipos de eventos (EventBus)
│   ├── shared-types/       # Interfaces compartilhadas
│   └── utils/              # formatCurrency, formatDate, etc.
├── turbo.json
└── package.json
```

## Módulos

| Módulo | Backend | Frontend | Descrição |
|--------|---------|----------|-----------|
| **Auth** | JWT + Guards | next-auth, Zustand store | Login, registro, proteção de rotas |
| **Organization** | CRUD + switch | Header switcher | Multi-tenant com isolamento de dados |
| **Onboarding** | Niche config + steps | Wizard 4 passos | Configuração adaptativa por nicho |
| **Financial** | DRE, Cash Flow, Conciliação | Dashboard + tabelas | Gestão financeira completa |
| **CRM** | Clientes, Segmentação, Campanhas | Listagem + detail + LTV | Gestão de clientes e retenção |
| **Products** | CRUD de inventário | (via financial) | Produtos e serviços |
| **Workflows** | CRUD + executor + EventBus | Builder visual | Automações event-driven |
| **Analytics** | Metrics, Revenue Series, Category Breakdown | Dashboard com gráficos | KPIs e visualizações |

## Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco
cp apps/api/.env.example apps/api/.env
# Edite DATABASE_URL, JWT_SECRET, REDIS_HOST

# 3. Migrations + Seed
npm run db:migrate
npm run db:seed

# 4. Desenvolvimento
npm run dev

# 5. Build
npm run build
```

## Variáveis de Ambiente

```env
# apps/api/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/businessos"
JWT_SECRET="your-secret-key"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

## Arquitetura Multi-Tenant

Cada request é isolada por `organizationId` via:
1. JWT decode no guard de autenticação
2. `AsyncLocalStorage` para propagação de contexto
3. Prisma middleware que injeta `organizationId` em todas as queries
4. Guards de permissão por módulo (`@Permissions('module:action')`)

## Event-Driven

Todos os módulos publicam eventos via `EventBus` (Redis Pub/Sub):
- `TRANSACTION_CREATED`, `TRANSACTION_PAID`, `PAYMENT_OVERDUE`
- `CUSTOMER_CREATED`, `CUSTOMER_CHURN_RISK`
- `STOCK_LOW`, `ONBOARDING_COMPLETED`
- `WORKFLOW_TRIGGERED`, `WORKFLOW_COMPLETED`, `CAMPAIGN_SENT`

Workflows reagem a esses gatilhos e executam steps configuráveis (email, WhatsApp, webhook, IA, delay, condição).

## Nichos Suportados

Varejo, E-commerce, Serviços, Alimentação, Profissional Liberal, Construção, Saúde, Educação.

Cada nicho define categorias financeiras, templates de produtos e workflows sugeridos automaticamente no onboarding.

## LGPD

- Dados pessoais são isolados por organização
- Consentimento registrado no onboarding
- Direito de acesso e exclusão via API (`DELETE /crm/customers/:id`)
- Logs de auditoria via EventBus
- Veja [PRIVACY.md](./PRIVACY.md) para detalhes

## Licença

MIT
