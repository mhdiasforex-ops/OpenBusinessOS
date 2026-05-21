# Implementation Plan: OpenBusinessOS — Core Foundation (MVP)

**Branch**: `001-core-foundation` | **Date**: 2025-05-21 | **Spec**: specs/001-core-foundation/spec.md

**Input**: Feature specification from `specs/001-core-foundation/spec.md`

## Summary

O OpenBusinessOS é uma infraestrutura operacional open source para empresas — o "Linux das pequenas empresas". O MVP (Core Foundation) entrega 6 módulos fundamentais: Auth/Organization (multi-tenant), Financeiro, CRM, Workflow Engine e Analytics — conectados por um sistema de eventos e acessíveis via onboarding inteligente guiado por IA. A arquitetura é monorepo com frontend Next.js e backend NestJS, ambos comunicando via REST/GraphQL, com PostgreSQL como banco principal e Redis para filas/cache.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**:
- Frontend: Next.js 14+, React 18+, Tailwind CSS, Shadcn UI
- Backend: NestJS 10+, Fastify, GraphQL (Apollo), REST
- Monorepo: Turborepo ou Nx

**Storage**: PostgreSQL 16 (dados), Redis 7 (cache/filas), Qdrant (busca vetorial — preparatório)

**Testing**: Jest + Playwright (e2e), Vitest (unit frontend), Supertest (contract backend)

**Target Platform**: Web (cloud-first), Docker para deploy local/cloud

**Project Type**: Monorepo web application (frontend + backend + shared packages)

**Performance Goals**: Dashboard <3s carregamento, Workflow <5s reação (p95), API <200ms p95

**Constraints**: Multi-tenant isolation obrigatório, LGPD compliance, audit trail em operações financeiras

**Scale/Scope**: 100+ orgs simultâneas no MVP, ~20 telas, ~30 endpoints API

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Open Source Radical | ✅ PASS | Todo núcleo operacional será open source (MIT/Apache 2.0) |
| II. Modularidade Absoluta | ✅ PASS | Cada módulo (Auth, Financeiro, CRM, etc.) é pacote independente no monorepo |
| III. AI Native | ⚠️ PARTIAL | Onboarding IA no MVP; agentes avançados na Fase 3. Workflow engine preparado para agentes |
| IV. Event-Driven Architecture | ✅ PASS | Event bus central com NestJS EventEmitter + Redis pub/sub |
| V. Community Driven | ⚠️ DEFERRED | SDK de plugins na Fase 3; arquitetura preparada com interface de hooks |
| VI. Test-First | ✅ PASS | TDD enforceado — testes antes de implementação |
| VII. Simplicity First | ✅ PASS | 2 projetos no monorepo: apps/web (frontend) + apps/api (backend) + packages/ compartilhados |
| VIII. Multi-Tenant by Design | ✅ PASS | Tenant ID em todas as queries, Row-Level Security no PostgreSQL |

## Project Structure

### Documentation (this feature)

```text
specs/001-core-foundation/
├── spec.md           # Feature specification
├── plan.md           # This file
├── research.md       # Technology research and trade-offs
├── data-model.md     # Entity schemas and relationships
├── quickstart.md     # Key validation scenarios
├── contracts/        # API endpoints and events
│   ├── auth.md
│   ├── financial.md
│   ├── crm.md
│   ├── workflow.md
│   └── analytics.md
└── tasks.md          # Executable task breakdown
```

### Source Code (repository root)

```text
openbusinessos/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # UI components (Shadcn)
│   │   │   ├── modules/       # Feature modules (auth, financial, crm...)
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── stores/        # Zustand state management
│   │   │   └── lib/           # Utilities, API client
│   │   └── tests/
│   │       ├── e2e/           # Playwright
│   │       └── unit/          # Vitest
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── auth/          # Auth module (RBAC, MFA, SSO)
│       │   ├── organization/  # Multi-tenant org management
│       │   ├── financial/     # Cash flow, CMV, DRE, conciliation
│       │   ├── crm/           # Customers, LTV, campaigns
│       │   ├── workflow/      # Event engine, pipelines, triggers
│       │   ├── analytics/     # Dashboards, metrics, BI
│       │   ├── onboarding/    # AI-guided onboarding
│       │   ├── events/        # Event bus (Redis pub/sub)
│       │   ├── common/        # Shared guards, pipes, filters
│       │   └── prisma/        # Prisma client & schema
│       └── tests/
│           ├── contract/      # Supertest contract tests
│           ├── integration/   # Module integration tests
│           └── unit/          # Jest unit tests
├── packages/
│   ├── shared-types/          # Shared TypeScript types/interfaces
│   ├── event-definitions/     # Event schemas (ORDER_CREATED, etc.)
│   └── utils/                 # Shared utilities
├── infrastructure/
│   ├── docker/                # Docker Compose (Postgres, Redis, Qdrant)
│   └── scripts/               # Setup/migration scripts
├── docs/
├── .specify/
│   └── constitution.md
└── specs/
    └── 001-core-foundation/
```

**Structure Decision**: Monorepo com Turborepo. Frontend (Next.js) e Backend (NestJS) como apps separados com packages compartilhados para tipos e eventos. Essa estrutura suporta modularidade (cada módulo NestJS é independente) e simplicidade (2 apps + packages).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| AI Native parcial no MVP | Onboarding com IA é viável no MVP; agentes completos requerem infraestrutura de LLM que seria over-engineering agora | Agentes completos na Fase 3 após validação do core |
| SDK de Plugins deferido | Interface de hooks existe internamente; SDK público requer estabilidade da API interna que não temos ainda | SDK público na Fase 3 quando a API estiver estável |
