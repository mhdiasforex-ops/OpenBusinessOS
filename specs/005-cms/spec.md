# Feature Specification: CMS & Site Content Management

**Feature Branch**: `005-cms`
**Created**: 2026-05-22
**Status**: Implementing

## User Scenarios & Testing

### User Story 1 - Editar conteúdo do site (P1)
Como admin, quero editar textos, imagens e seções do site landing page pelo painel admin, sem precisar redeployar.

### User Story 2 - Gerenciar páginas de nicho (P2)
Como admin, quero criar/editar/excluir páginas de cada nicho (varejo, saúde, etc.) com conteúdo dinâmico.

### User Story 3 - Mídias e uploads (P3)
Como admin, quero fazer upload de imagens/arquivos e referenciá-los no conteúdo do site.

## Requirements

- **FR-001**: API REST CRUD para CmsPage (páginas com slug, title, content JSON, meta)
- **FR-002**: API REST CRUD para CmsBlock (blocos reutilizáveis — hero, feature, testimonial)
- **FR-003**: API REST para CmsMedia (upload + listagem de arquivos)
- **FR-004**: Endpoint público GET /api/v1/cms/pages/:slug (sem auth) para o site consumir
- **FR-005**: Endpoint público GET /api/v1/cms/blocks (sem auth) filtrado por niche
- **FR-006**: Cada CmsPage pertence a um Niche (ou é global com niche=null)
- **FR-007**: Content em formato JSON structured (seções, textos, imagens, CTAs)
- **FR-008**: Draft/Published workflow (status DRAFT | PUBLISHED)

## Key Entities

- **CmsPage**: id, slug, title, niche?, content Json, status, publishedAt, organizationId
- **CmsBlock**: id, key, niche?, type (hero/feature/stat/testimonial/faq), content Json, order, status
- **CmsMedia**: id, url, alt, type, size, niche?

## Success Criteria

- **SC-001**: Admin consegue alterar hero text do site e ver refletido em <1min
- **SC-002**: Site consome conteúdo do CMS via API pública
- **SC-003**: Zero hardcoded content no site — tudo vem do CMS
