# OpenBusinessOS Constitution

## Core Principles

### I. Open Source Radical
Todo o núcleo operacional é aberto, auditável, extensível, versionado e documentado. Isso garante transparência, confiança da comunidade, eliminação de lock-in e aceleração da inovação. Nenhuma funcionalidade core pode ser proprietária.

### II. Modularidade Absoluta
Cada módulo possui responsabilidade única, é substituível, comunica via eventos, possui APIs independentes, testes isolados e documentação independente. Nenhum módulo conhece os internos de outro. Módulos são bibliotecas independentes, não acoplamentos monolíticos.

### III. AI Native
A IA não é uma feature adicional — é a camada central. Atua como coordenadora operacional, consultora empresarial, mecanismo de automação e motor de aprendizado coletivo. Toda operação deve ser potencialmente automatizável por IA. Agentes operam sob coordenação de um orquestrador.

### IV. Event-Driven Architecture
Toda operação é baseada em eventos, permitindo integrações e automações desacopladas. Nenhum módulo chama outro diretamente — comunicação via eventos e APIs públicas. Isso garante extensibilidade, observabilidade e desacoplamento.

### V. Community Driven
A comunidade pode criar e publicar plugins, agentes, templates, automações e integrações. O SDK de plugins é a interface canônica de extensão. Governança aberta com fluxo de contribuição estruturado.

### VI. Test-First (NON-NEGOTIABLE)
Toda implementação segue TDD: testes escritos → aprovados → falham → depois implementa. Ciclo Red-Green-Refactor estritamente enforceado. Testes de contrato obrigatórios antes de implementação.

### VII. Simplicity First
Máximo 3 projetos para implementação inicial. Projetos adicionais requerem justificativa documentada. Começar simples, YAGNI. Usar features do framework diretamente, sem wrappers desnecessários.

### VIII. Multi-Tenant by Design
Desde o início, o sistema suporta múltiplas organizações com isolamento de dados. Cada organização opera como tenant independente com seus próprios dados, configurações e agentes.

## Segurança e Compliance

- Autenticação via RBAC, MFA, SSO desde o MVP
- Dados sensíveis criptografados em repouso e trânsito
- Conformidade com LGPD/PDPA brasileiro
- Audit trail em todas as operações financeiras
- Rate limiting e proteção contra abuso em todas as APIs

## Fluxo de Desenvolvimento

- Spec-driven: especificações são a fonte da verdade
- Code review obrigatório para merge
- CI/CD via GitHub Actions
- Versionamento semântico (MAJOR.MINOR.PATCH)
- Branches por feature com prefixo de número de spec

## Governança

A constituição sobrepõe-se a todas as outras práticas. Emendas requerem documentação, aprovação dos maintainers e plano de migração. Toda PR/review deve verificar conformidade. Complexidade deve ser justificada.

**Version**: 1.0.0 | **Ratified**: 2025-05-21 | **Last Amended**: 2025-05-21
