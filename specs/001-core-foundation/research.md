# Research: OpenBusinessOS Core Foundation

## 1. Monorepo Tooling

### Turborepo vs Nx

| Aspecto | Turborepo | Nx |
|---------|-----------|-----|
| Curva de aprendizado | Baixa | Alta |
| Cache de builds | Nativo, simples | Nativo, avançado |
| Task pipeline | Declarativo simples | Mais configurável |
| Community | Vercel ecosystem | Google ecosystem |
| Overhead | Mínimo | Moderado |

**Decisão**: Turborepo. Alinha com "Simplicity First" (Artigo VII). Next.js é Vercel ecosystem, Turborepo é a escolha natural. Nx é overkill para 2 apps + packages.

## 2. Backend Framework

### NestJS vs Fastify (standalone) vs Express

| Aspecto | NestJS | Fastify standalone | Express |
|---------|--------|-------------------|---------|
| Modularidade | Módulos nativos | Manual | Manual |
| DI Container | Nativo | Manual | Manual |
| GraphQL | Apollo integration nativa | Plugin | Plugin |
| Event-driven | EventEmitter nativo | Manual | Manual |
| Performance | Boa (usa Fastify por baixo) | Melhor | Menor |
| Estrutura opinativa | Sim — acelera padronização | Não | Não |

**Decisão**: NestJS com Fastify adapter. Modularidade nativa (AuthModule, FinancialModule, etc.), DI container para desacoplamento, EventEmitter para event-driven, e GraphQL nativo. Fastify como HTTP adapter para performance. Alinha com "Modularidade Absoluta" (Artigo II).

## 3. ORM / Database Access

### Prisma vs TypeORM vs Drizzle

| Aspecto | Prisma | TypeORM | Drizzle |
|---------|--------|---------|---------|
| Type safety | Excelente (gerado) | Moderado | Excelente |
| Migrations | Nativo | Nativo | Nativo |
| Multi-tenant | Via middleware/filter | Via schemas | Manual |
| Relations | Declarativo no schema | Decorators | SQL-like |
| Community | Muito ativa | Estável | Crescente |
| Row-Level Security | Suportado com raw SQL | Suportado | Suportado |

**Decisão**: Prisma 5. Melhor type safety, schema declarativo, migrations automáticas, e suporte a multi-tenancy via tenant ID em todas as queries (Prisma middleware para auto-filter). Nota: já temos experiência com Prisma no GovFlow — reusar padrões.

### Multi-Tenancy Strategy

| Estratégia | Isolamento | Complexidade | Custo |
|------------|------------|-------------|-------|
| Schema per tenant | Alto | Alta | Alto |
| Database per tenant | Máximo | Muito alta | Muito alto |
| Row-Level (tenant_id) | Adequado | Baixa | Baixo |

**Decisão**: Row-Level com `organizationId` em todas as tabelas + Prisma middleware para auto-inject em queries. Para MVP, é a estratégia mais simples e barata. RLS no PostgreSQL como segunda camada de segurança.

## 4. Event Bus

### NestJS EventEmitter vs Redis Streams vs Kafka

| Aspecto | NestJS EventEmitter | Redis Streams | Kafka |
|---------|---------------------|---------------|-------|
| Complexidade | Baixa | Média | Alta |
| Persistência | In-memory | Configurável | Alta |
| Ordenação | Por processo | Por stream | Por partition |
| Replay | Não | Sim | Sim |
| Escala | Single instance | Multi-instance | Multi-cluster |
| Setup | Zero | Redis (já temos) | Infra dedicada |

**Decisão**: NestJS EventEmitter para eventos in-process + Redis Pub/Sub para eventos cross-instance. Para MVP, não precisamos de Kafka — é over-engineering. Redis Pub/Sub dá ordenação e distribuição. Replay pode ser adicionado com Redis Streams na Fase 2 se necessário.

## 5. Frontend State Management

### Zustand vs Redux Toolkit vs Jotai

| Aspecto | Zustand | Redux Toolkit | Jotai |
|---------|---------|---------------|-------|
| Boilerplate | Mínimo | Moderado | Mínimo |
| DevTools | Sim | Excelente | Sim |
| TypeScript | Nativo | Bom | Nativo |
| Curva | Baixa | Média | Baixa |
| Multi-tenant | Fácil (store por org) | Middleware | Atoms |

**Decisão**: Zustand. Alinha com simplicidade. Store por organização para isolamento de estado no frontend. React Query (TanStack Query) para cache de API.

## 6. Auth Strategy

### NextAuth vs Auth.js vs Keycloak vs Supabase Auth

| Aspecto | Auth.js (NextAuth v5) | Keycloak | Supabase Auth |
|---------|----------------------|----------|---------------|
| Self-hosted | Sim | Sim | Parcial |
| MFA | Nativo | Nativo | Nativo |
| SSO (SAML/OIDC) | OIDC nativo | Tudo | Limitado |
| RBAC | Custom | Nativo | Custom |
| Multi-tenant | Custom | Nativo | Custom |
| Overhead | Baixo | Alto | Médio |

**Decisão**: Auth.js v5 (NextAuth) para o frontend + NestJS custom guards para API. Auth.js lida com sessões/OAuth/MFA. Guards no NestJS enforce RBAC e tenant isolation. Keycloak seria overkill no MVP.

## 7. Payment Gateway (PIX)

### Mercado Pago vs PagSeguro vs Asaas vs Stripe Brasil

| Aspecto | Mercado Pago | PagSeguro | Asaas | Stripe BR |
|---------|-------------|-----------|-------|-----------|
| PIX | Nativo | Nativo | Nativo | Nativo |
| Webhook | Sim | Sim | Sim | Sim |
| API Quality | Boa | Regular | Excelente | Excelente |
| Taxas | Moderadas | Altas | Baixas | Altas |
| Split | Sim | Não | Sim | Sim |

**Decisão**: [NEEDS CLARIFICATION] Candidato principal: Asaas (melhor API, taxas baixas, PIX nativo, webhooks robustos). Fallback: Mercado Pago (maior adoção no Brasil). A arquitetura deve abstrair via interface (PaymentGateway) para permitir múltiplos provedores.

## 8. Observability

| Ferramenta | Uso |
|-----------|-----|
| Prometheus | Métricas de aplicação |
| Grafana | Dashboards de infra |
| Sentry | Error tracking |
| OpenTelemetry | Distributed tracing |

**Decisão**: Sentry para error tracking (imediato) + OpenTelemetry para tracing (preparar infra). Prometheus/Grafana na Fase 2 quando tivermos métricas operacionais relevantes.
