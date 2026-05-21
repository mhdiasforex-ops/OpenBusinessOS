---

description: "Task list for OpenBusinessOS Core Foundation MVP implementation"
---

# Tasks: OpenBusinessOS — Core Foundation (MVP)

**Input**: Design documents from `/specs/001-core-foundation/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo initialization and basic structure

- [ ] T001 Create monorepo structure with Turborepo: root `package.json`, `turbo.json`, `apps/`, `packages/`
- [ ] T002 [P] Initialize Next.js app in `apps/web/` with Tailwind CSS + Shadcn UI
- [ ] T003 [P] Initialize NestJS app in `apps/api/` with Fastify adapter + Prisma
- [ ] T004 [P] Create `packages/shared-types/` with TypeScript interfaces for all entities (Organization, User, Product, Customer, Transaction, Workflow, Event)
- [ ] T005 [P] Create `packages/event-definitions/` with event type constants and payload schemas
- [ ] T006 [P] Create `packages/utils/` with shared utilities (date formatting, currency, validation)
- [ ] T007 Setup Docker Compose in `infrastructure/docker/` — PostgreSQL 16, Redis 7, Qdrant
- [ ] T008 [P] Configure ESLint + Prettier at monorepo root
- [ ] T009 [P] Configure GitHub Actions CI pipeline (lint, type-check, test)
- [ ] T010 Create `.env.example` with all required environment variables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 Create Prisma schema in `apps/api/prisma/schema.prisma` with all entities from data-model.md (Organization, User, Role, Permission, Product, Customer, Transaction, TransactionItem, Workflow, WorkflowStep, Event, Dashboard)
- [ ] T012 Run initial Prisma migration and verify database structure
- [ ] T013 Implement multi-tenant Prisma middleware in `apps/api/src/common/tenant.middleware.ts` — auto-inject organizationId in all queries
- [ ] T014 [P] Implement Auth module in `apps/api/src/auth/` — register, login, MFA (TOTP), JWT generation/validation
- [ ] T015 [P] Implement RBAC guards in `apps/api/src/common/guards/` — RolesGuard, PermissionsGuard
- [ ] T016 [P] Implement Organization module in `apps/api/src/organization/` — CRUD, settings, member management
- [ ] T017 Implement Event Bus in `apps/api/src/events/` — NestJS EventEmitter + Redis Pub/Sub adapter for cross-instance events
- [ ] T018 Implement base event definitions: ORG_CREATED, USER_REGISTERED, TRANSACTION_CREATED, STOCK_LOW, etc. in `packages/event-definitions/`
- [ ] T019 [P] Setup Auth.js v5 in `apps/web/` — NextAuth configuration, session management, MFA flow
- [ ] T020 [P] Create API client in `apps/web/src/lib/api-client.ts` — Axios/fetch wrapper with auth headers and tenant injection
- [ ] T021 [P] Create base layout in `apps/web/src/app/` — sidebar navigation, header with org selector, auth guard
- [ ] T022 Configure Row-Level Security policies on PostgreSQL for all tables

**Checkpoint**: Foundation ready — multi-tenant auth works, event bus operational, API and web apps boot

---

## Phase 3: User Story 6 — Auth e Organização Multi-Tenant (Priority: P1) 🎯 MVP

**Goal**: Múltiplas organizações coexistem com isolamento completo. RBAC, MFA, SSO funcional.

**Independent Test**: Criar duas orgs, registrar dados em cada uma, verificar isolamento

### Implementation for User Story 6

- [ ] T023 [US6] Implement organization CRUD endpoints in `apps/api/src/organization/organization.controller.ts`
- [ ] T024 [P] [US6] Implement member management endpoints in `apps/api/src/organization/members.controller.ts`
- [ ] T025 [P] [US6] Implement role/permission seeding in `apps/api/src/auth/roles.seeder.ts` — default roles: ADMIN, MANAGER, OPERATOR, VIEWER
- [ ] T026 [US6] Implement tenant isolation integration test in `apps/api/tests/integration/tenant-isolation.spec.ts`
- [ ] T027 [US6] Implement org settings page in `apps/web/src/modules/organization/`
- [ ] T028 [US6] Implement member management UI in `apps/web/src/modules/organization/members/`

**Checkpoint**: Auth completo, multi-tenant funcional, isolamento verificado

---

## Phase 4: User Story 1 — Onboarding Inteligente (Priority: P1) 🎯 MVP

**Goal**: Empreendedor configura empresa via onboarding IA em <15 minutos

**Independent Test**: Criar nova org via onboarding, responder perguntas, verificar auto-configuração

### Implementation for User Story 1

- [ ] T029 [US1] Create Onboarding module in `apps/api/src/onboarding/` — AI question generation based on niche, answer processing
- [ ] T030 [US1] Implement onboarding config generator in `apps/api/src/onboarding/config-generator.ts` — auto-create categories, permissions, dashboards, workflows from answers
- [ ] T031 [US1] Implement onboarding endpoints: POST /start, POST /answer, GET /status in `apps/api/src/onboarding/onboarding.controller.ts`
- [ ] T032 [P] [US1] Create niche-specific templates in `apps/api/src/onboarding/templates/restaurant.ts` — default categories, products, workflows
- [ ] T033 [US1] Implement onboarding flow UI in `apps/web/src/modules/onboarding/` — multi-step wizard with AI questions
- [ ] T034 [US1] Fire ONBOARDING_COMPLETED event and trigger post-onboarding workflows

**Checkpoint**: Onboarding funcional — nova empresa operacional em <15 min

---

## Phase 5: User Story 2 — Gestão Financeira (Priority: P1) 🎯 MVP

**Goal**: Controle financeiro completo — fluxo de caixa, CMV, DRE, contas, conciliação

**Independent Test**: Registrar transações, calcular CMV, gerar DRE, verificar alertas

### Implementation for User Story 2

- [ ] T035 [US2] Create Financial module in `apps/api/src/financial/` — transactions service, cash flow service, CMV service
- [ ] T036 [P] [US2] Implement transaction CRUD endpoints in `apps/api/src/financial/transactions.controller.ts`
- [ ] T037 [P] [US2] Implement cash flow endpoint in `apps/api/src/financial/cash-flow.controller.ts`
- [ ] T038 [P] [US2] Implement CMV calculation in `apps/api/src/financial/cmv.service.ts`
- [ ] T039 [P] [US2] Implement DRE generator in `apps/api/src/financial/dre.service.ts`
- [ ] T040 [US2] Implement overdue payment detection + PAYMENT_OVERDUE event in `apps/api/src/financial/overdue-detector.ts`
- [ ] T041 [US2] Implement OFX conciliation in `apps/api/src/financial/conciliation.service.ts`
- [ ] T042 [US2] Implement audit trail on all financial operations (Prisma middleware hook)
- [ ] T043 [US2] Create Financial dashboard UI in `apps/web/src/modules/financial/` — cash flow chart, CMV table, DRE view
- [ ] T044 [P] [US2] Create transaction management UI in `apps/web/src/modules/financial/transactions/`

**Checkpoint**: Financeiro funcional — fluxo de caixa, CMV e DRE operacionais

---

## Phase 6: User Story 3 — CRM (Priority: P2)

**Goal**: Gestão de clientes, histórico, LTV, segmentação, campanhas

**Independent Test**: Cadastrar clientes, verificar segmentação, criar campanha

### Implementation for User Story 3

- [ ] T045 [US3] Create CRM module in `apps/api/src/crm/` — customers service, segments service, campaigns service
- [ ] T046 [P] [US3] Implement customer CRUD + search endpoints in `apps/api/src/crm/customers.controller.ts`
- [ ] T047 [P] [US3] Implement LTV calculation in `apps/api/src/crm/ltv.service.ts`
- [ ] T048 [P] [US3] Implement auto-segmentation in `apps/api/src/crm/segmentation.service.ts` — high-ltv, churn-risk, new, inactive
- [ ] T049 [P] [US3] Implement campaign CRUD endpoints in `apps/api/src/crm/campaigns.controller.ts`
- [ ] T050 [US3] Implement CUSTOMER_CHURN_RISK event in `apps/api/src/crm/churn-detector.ts`
- [ ] T051 [US3] Create CRM UI in `apps/web/src/modules/crm/` — customer list, profile, segments, campaigns

**Checkpoint**: CRM funcional — clientes segmentados, LTV calculado, campanhas criáveis

---

## Phase 7: User Story 4 — Workflow Engine (Priority: P2)

**Goal**: Automações reativas a eventos — triggers, pipelines, filas

**Independent Test**: Criar workflow "estoque baixo → notificar", disparar evento, verificar execução

### Implementation for User Story 4

- [ ] T052 [US4] Create Workflow module in `apps/api/src/workflow/` — workflow service, executor service, step handlers
- [ ] T053 [US4] Implement workflow CRUD endpoints in `apps/api/src/workflow/workflow.controller.ts`
- [ ] T054 [US4] Implement workflow engine/executor in `apps/api/src/workflow/engine.ts` — listens to events, evaluates conditions, executes steps in order
- [ ] T055 [P] [US4] Implement step handlers in `apps/api/src/workflow/steps/` — NotifyStep, ApiCallStep, CreateTransactionStep, UpdateStockStep, WebhookStep
- [ ] T056 [US4] Implement workflow execution tracking in `apps/api/src/workflow/execution-log.ts`
- [ ] T057 [US4] Implement fallback handling in `apps/api/src/workflow/engine.ts` — on step failure, try fallback or fire WORKFLOW_FAILED
- [ ] T058 [US4] Create Workflow builder UI in `apps/web/src/modules/workflow/` — visual editor with trigger selection, condition config, step list

**Checkpoint**: Workflows funcionais — eventos disparam automações com fallback

---

## Phase 8: User Story 5 — Analytics e Dashboards (Priority: P2)

**Goal**: Métricas em tempo real, dashboards customizáveis, BI cross-module

**Independent Test**: Gerar dados operacionais, verificar dashboards atualizados

### Implementation for User Story 5

- [ ] T059 [US5] Create Analytics module in `apps/api/src/analytics/` — metrics aggregator, dashboard service, cross-module service
- [ ] T060 [P] [US5] Implement metrics aggregation in `apps/api/src/analytics/metrics.service.ts` — financial KPIs, CRM KPIs, operational KPIs
- [ ] T061 [P] [US5] Implement cross-module queries in `apps/api/src/analytics/cross-module.service.ts` — sales vs stock, customer behavior vs revenue
- [ ] T062 [P] [US5] Implement anomaly detection in `apps/api/src/analytics/anomaly-detector.ts` — fire ANOMALY_DETECTED events
- [ ] T063 [US5] Implement dashboard CRUD + data endpoints in `apps/api/src/analytics/dashboard.controller.ts`
- [ ] T064 [US5] Create Dashboard UI in `apps/web/src/modules/analytics/` — widget grid, KPI cards, charts (Recharts), cross-module view

**Checkpoint**: Analytics funcional — dashboards com dados em tempo real

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T065 [P] Add Sentry error tracking integration in `apps/api/` and `apps/web/`
- [ ] T066 [P] Add i18n foundation — Portuguese (BR) as default, English as secondary
- [ ] T067 [P] Add OpenTelemetry tracing setup in `apps/api/`
- [ ] T068 Add LGPD compliance — data export endpoint, data deletion endpoint, consent tracking
- [ ] T069 [P] Write comprehensive README.md with setup instructions, architecture overview, contributing guide
- [ ] T070 Run quickstart.md validation — all 4 scenarios pass end-to-end
- [ ] T071 [P] Performance audit — verify dashboard <3s, workflow <5s, API <200ms
- [ ] T072 [P] Security audit — tenant isolation verified, RBAC tested, MFA tested, no data leakage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US6 - Auth/Multi-Tenant (Phase 3)**: Depends on Phase 2 — core auth infrastructure
- **US1 - Onboarding (Phase 4)**: Depends on Phase 3 — needs auth and org structure
- **US2 - Financeiro (Phase 5)**: Depends on Phase 2 — uses event bus and tenant isolation
- **US3 - CRM (Phase 6)**: Depends on Phase 2 — uses event bus and tenant isolation
- **US4 - Workflow (Phase 7)**: Depends on Phase 2 — uses event bus
- **US5 - Analytics (Phase 8)**: Depends on Phases 5,6 — needs data from financial and CRM
- **Polish (Phase 9)**: Depends on all user stories

### Parallel Opportunities

- Phases 5, 6, 7 can run in parallel after Phase 4 (different modules, different files)
- Within Phase 5: T036, T037, T038, T039 can run in parallel
- Within Phase 6: T046, T047, T048, T049 can run in parallel
- Within Phase 7: T055 step handlers can run in parallel
- Within Phase 8: T060, T061, T062 can run in parallel

### Critical Path

```
T001-T010 → T011-T022 → T023-T028 → T029-T034 → T035-T044
                                              ↘ T045-T051 (parallel)
                                              ↘ T052-T058 (parallel)
                                              ↘ T059-T064 (after 5+6)
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: Auth/Multi-Tenant (US6)
4. Complete Phase 4: Onboarding (US1)
5. Complete Phase 5: Financeiro (US2)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. + Auth/Multi-Tenant → Organizations functional
3. + Onboarding → New companies can onboard
4. + Financeiro → Core business value (MVP complete!)
5. + CRM → Customer management
6. + Workflow → Automation
7. + Analytics → Business intelligence
8. + Polish → Production-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All events fire through the central Event Bus (Redis Pub/Sub)
- Multi-tenant isolation is enforced at Prisma middleware level + PostgreSQL RLS
