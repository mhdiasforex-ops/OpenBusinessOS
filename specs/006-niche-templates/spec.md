# Feature Specification: 25+ Templates por Nicho

**Feature Branch**: `006-niche-templates`
**Created**: 2026-05-22
**Status**: Implementing

## User Scenarios & Testing

### User Story 1 - Templates de onboarding por nicho (P1)
Como novo usuário de um nicho (ex: varejo), quero ver templates específicos do meu setor ao me cadastrar — workflows, categorias, produtos, dashboards.

### User Story 2 - Biblioteca de templates (P2)
Como admin, quero gerenciar a biblioteca de templates — criar, editar, ativar/desativar templates por nicho.

### User Story 3 - Templates por sub-nicho (P3)
Como usuário de um sub-nicho (ex: RETAIL_CLOTHING), quero templates ainda mais específicos.

## Requirements

- **FR-001**: Modelo Template no Prisma (id, niche, subniche?, type, name, content Json, isActive, isDefault)
- **FR-002**: Template types: ONBOARDING, WORKFLOW, DASHBOARD, EMAIL, REPORT, INVOICE, PRODUCT_CATALOG
- **FR-003**: Mínimo 25 templates por nicho principal (8 nichos = 200+ templates)
- **FR-004**: API CRUD /api/v1/templates (admin)
- **FR-005**: API pública GET /api/v1/templates/:niche (para onboarding)
- **FR-006**: Seed com todos os templates pré-definidos
- **FR-007**: Templates cobrem: workflows, categorias financeiras, produtos padrão, dashboards, relatórios, e-mails transacionais, modelos de NF

## Template Distribution por Nicho (25+ cada)

Para CADA um dos 8 nichos:
- 5 workflow templates (ex: cobrança, onboarding cliente, follow-up, estoque baixo, agendamento)
- 3 dashboard templates (ex: financeiro, operacional, vendas)
- 4 e-mail templates (ex: boas-vindas, cobrança, follow-up, relatório mensal)
- 3 relatório templates (ex: DRE, fluxo caixa, vendas)
- 2 invoice/NF templates (ex: NF-e, NFS-e layout)
- 3 product catalog templates (ex: categorias, unidades, margens padrão)
- 2 onboarding config templates (ex: setup inicial, migração)
- 3 niche-specific templates (ex: prontuário p/ saúde, cardápio p/ alimentação)

## Success Criteria

- **SC-001**: Cada nicho tem >= 25 templates no seed
- **SC-002**: Onboarding carrega templates automaticamente pelo niche
- **SC-003**: Admin consegue criar novos templates via API
