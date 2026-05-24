# OpenBusinessOS

Plataforma open-source de gestão empresarial para pequenas e médias empresas brasileiras. Monorepo full-stack com NestJS, Next.js, Prisma, Redis e Docker.

## Visão Geral

OpenBusinessOS é um ERP/CRM brasileiro que integra em uma única plataforma:

- **Financeiro** — Transações, DRE, conciliação bancária, pagamentos (PIX/boleto/cartão)
- **CRM** — Clientes, contatos, segmentação automática, campanhas de marketing
- **Produtos & Estoque** — Catálogo, controle de inventário, alertas de reposição
- **Automações** — Workflows baseados em eventos (ex: notificar ao criar transação)
- **Analytics** — Métricas em tempo real, dashboard com KPIs
- **Fiscal** — NFS-e, NFe (estrutura preparada)
- **LGPD** — Gestão de consentimentos e dados pessoais
- **Contratos & Fornecedores** — Ciclo completo de procurement
- **Omnichannel** — WhatsApp, chat, multi-canal
- **IA Agent** — Assistente inteligente para automações
- **RH** — Gestão de colaboradores
- **Relatórios** — Geração e exportação

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| API | NestJS 10, TypeScript, Prisma 5 |
| Frontend | Next.js 14 (App Router), React Query, TailwindCSS |
| Banco | PostgreSQL 16 + Redis 7 |
| Storage | MinIO (S3-compatible) |
| Auth | JWT + NextAuth.js |
| Eventos | Redis Pub/Sub (event bus) |
| Testes | Vitest (unit + e2e) |
| CI/CD | GitHub Actions |
| Deploy | Docker Compose |

## Início Rápido

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Opção 1: Docker Compose (recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/openbusinessos.git
cd openbusinessos

# Suba todos os serviços
docker compose up -d

# Aguarde ~60s e acesse:
# Frontend:  http://localhost:3000
# API:       http://localhost:3001/api/v1/docs
# MinIO:     http://localhost:9001
```

Login padrão: `demo@openbusinessos.com` / `demo123`

### Opção 2: Desenvolvimento Local

```bash
# Instale dependências
pnpm install

# Suba apenas o banco e Redis
docker compose up -d postgres redis minio

# Gere o client Prisma e sincronize o schema
cd apps/api
npx prisma generate
npx prisma db push
npx prisma db seed

# Compile os pacotes compartilhados
cd ../../packages/shared-types && npx tsc
cd ../event-definitions && npx tsc
cd ../utils && npx tsc

# Inicie a API (porta 3001)
cd ../../apps/api && pnpm dev

# Em outro terminal, inicie o frontend (porta 3000)
cd apps/web && pnpm dev
```

## Estrutura do Projeto

```
openbusinessos/
├── apps/
│   ├── api/                    # NestJS API
│   │   ├── src/
│   │   │   ├── auth/           # Autenticação JWT + roles
│   │   │   ├── users/          # Gestão de usuários
│   │   │   ├── organization/   # Multi-tenant
│   │   │   ├── financial/      # Transações, categorias
│   │   │   ├── crm/            # Clientes, segmentação
│   │   │   ├── products/       # Catálogo de produtos
│   │   │   ├── workflow/       # Motor de automações
│   │   │   ├── analytics/      # Métricas e KPIs
│   │   │   ├── payment/        # PIX, boleto, cartão
│   │   │   ├── contracts/      # Gestão de contratos
│   │   │   ├── suppliers/      # Fornecedores
│   │   │   ├── reports/        # Relatórios
│   │   │   ├── lgpd/           # Conformidade LGPD
│   │   │   ├── notifications/  # Notificações
│   │   │   ├── onboarding/     # Onboarding wizard
│   │   │   ├── events/         # Redis event bus
│   │   │   └── common/         # Guards, filters, tenant
│   │   ├── prisma/
│   │   │   └── schema.prisma   # 40+ models
│   │   └── test/e2e/           # E2E tests
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/            # 30+ páginas (App Router)
│           ├── components/     # UI components (shadcn/ui)
│           ├── stores/         # Zustand auth store
│           ├── lib/            # API client, auth config
│           └── hooks/          # Custom hooks
├── packages/
│   ├── shared-types/           # Tipos compartilhados
│   ├── event-definitions/      # Definição de eventos
│   └── utils/                  # Utilitários (formatCurrency, etc)
├── docker-compose.yml
├── .github/workflows/ci.yml
└── pnpm-workspace.yaml
```

## API Endpoints

Todos os endpoints sob `/api/v1/`:

| Endpoint | Descrição |
|----------|-----------|
| `POST /auth/login` | Login (retorna JWT) |
| `POST /auth/register` | Registro + cria organização |
| `GET /auth/me` | Perfil do usuário logado |
| `GET /users` | Lista usuários da org |
| `GET /users/profile` | Perfil com roles |
| `GET /organizations/:id/stats` | Estatísticas da organização |
| `GET /financial/transactions` | Lista transações |
| `POST /financial/transactions` | Cria transação |
| `GET /crm/customers` | Lista clientes |
| `POST /crm/customers` | Cria cliente |
| `POST /crm/segment` | Roda segmentação automática |
| `GET /products` | Lista produtos |
| `POST /products` | Cria produto |
| `GET /workflows` | Lista workflows |
| `POST /workflows` | Cria workflow |
| `GET /analytics/metrics` | Métricas do dashboard |
| `POST /payment` | Cria cobrança |
| `GET /payment/stats` | Estatísticas de pagamento |
| `GET /contracts` | Lista contratos |
| `GET /suppliers` | Lista fornecedores |
| `GET /reports` | Gera relatórios |
| `GET /lgpd/consent/:id` | Consulta consentimentos |
| `GET /notifications` | Lista notificações |
| `GET /onboarding/config` | Config de onboarding |

Swagger interativo: `http://localhost:3001/api/v1/docs`

## Testes

```bash
# Testes unitários (97 tests, ~5s)
cd apps/api && pnpm test

# Testes e2e (21 tests, ~3s) — requer API rodando
cd apps/api && pnpm test:e2e
```

## Docker

```bash
# Subir tudo
docker compose up -d

# Status
docker compose ps

# Logs
docker compose logs api -f

# Parar
docker compose down

# Reconstruir (após mudanças)
docker compose build api web
docker compose up -d
```

| Serviço | Porta | URL |
|---------|-------|-----|
| Web (Next.js) | 3000 | http://localhost:3000 |
| API (NestJS) | 3001 | http://localhost:3001/api/v1/docs |
| PostgreSQL | 5433 | localhost:5433 |
| Redis | 6380 | localhost:6380 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |

## Variáveis de Ambiente

### API (`apps/api/.env`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/businessos
REDIS_URL=redis://localhost:6380
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=24h
PORT=3001
```

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Multi-tenancy

Todas as consultas são isoladas por organização. O middleware `TenantInterceptor` injeta automaticamente o `organizationId` do JWT em todas as queries Prisma. Roles e permissões são gerenciadas via `RolesGuard`.

## Arquitetura de Eventos

O sistema usa um event bus baseado em Redis:

1. Módulos emitem eventos (ex: `TRANSACTION_CREATED`)
2. `RedisEventBusService` publica no canal `obos:events:*`
3. Workflows inscritos reagem automaticamente
4. Se Redis indisponível, eventos são processados localmente (graceful degradation)

## Licença

MIT
