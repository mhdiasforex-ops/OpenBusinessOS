# Data Model: OpenBusinessOS Core Foundation

## Entity Relationship Overview

```
Organization 1──N User
Organization 1──N Product
Organization 1──N Customer
Organization 1──N Transaction
Organization 1──N Workflow
Organization 1──N Dashboard
Organization 1──N Event
Organization 1──N Plugin

Customer 1──N Transaction
Product 1──N TransactionItem
Transaction 1──N TransactionItem

Workflow 1──N WorkflowStep
Workflow N──N EventDefinition

User N──N Role
Role N──N Permission
```

## Entities

### Organization

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador único |
| name | String(255) | Nome da organização |
| slug | String(100) | URL-friendly identifier (único) |
| niche | Enum | Nicho empresarial (RESTAURANT, RETAIL, SERVICE, etc.) |
| settings | JSONB | Configurações específicas do nicho |
| isActive | Boolean | Organização ativa/inativa |
| plan | Enum | FREE, STARTER, PRO, ENTERPRISE |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Última atualização |

### User

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador único |
| organizationId | UUID (FK) | Tenant da organização |
| email | String(255) | Email (único por organização) |
| name | String(255) | Nome completo |
| passwordHash | String(255) | Hash bcrypt/argon2 |
| mfaEnabled | Boolean | MFA ativo |
| mfaSecret | String? | Secret TOTP (nullable se não habilitado) |
| isActive | Boolean | Usuário ativo |
| lastLoginAt | DateTime? | Último login |
| createdAt | DateTime | Data de criação |

### Role / Permission

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador |
| name | String(50) | ADMIN, MANAGER, OPERATOR, VIEWER |
| organizationId | UUID (FK) | Tenant (roles por organização) |

Permission: resource + action (ex: `financial:read`, `financial:write`, `crm:admin`)

### Product

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador único |
| organizationId | UUID (FK) | Tenant |
| name | String(255) | Nome do produto/serviço |
| sku | String(50) | Código interno |
| category | String(100) | Categoria |
| costPrice | Decimal(10,2) | Preço de custo |
| salePrice | Decimal(10,2) | Preço de venda |
| unit | String(20) | Unidade (un, kg, lt, h) |
| stockQuantity | Decimal(10,2) | Quantidade em estoque |
| minStock | Decimal(10,2) | Estoque mínimo para alerta |
| isActive | Boolean | Produto ativo |
| metadata | JSONB | Campos específicos do nicho |

### Customer

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador único |
| organizationId | UUID (FK) | Tenant |
| name | String(255) | Nome |
| email | String(255) | Email |
| phone | String(20) | Telefone |
| document | String(20) | CPF/CNPJ |
| segment | String(50) | Segmento auto-calculado |
| ltv | Decimal(10,2) | Lifetime Value (calculado) |
| totalOrders | Integer | Total de pedidos |
| lastOrderAt | DateTime? | Data do último pedido |
| tags | String[] | Tags livres |
| metadata | JSONB | Campos específicos do nicho |

### Transaction

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador único |
| organizationId | UUID (FK) | Tenant |
| type | Enum | INCOME, EXPENSE, TRANSFER |
| category | String(100) | Categoria (venda, custo, imposto, etc.) |
| amount | Decimal(12,2) | Valor |
| description | String(500) | Descrição |
| customerId | UUID (FK)? | Cliente relacionado (se renda) |
| dueDate | Date | Data de vencimento |
| paidAt | DateTime? | Data de pagamento |
| status | Enum | PENDING, PAID, OVERDUE, CANCELLED |
| paymentMethod | Enum | PIX, CREDIT_CARD, CASH, BANK_TRANSFER, OTHER |
| conciliationId | String? | ID da conciliação bancária |
| createdAt | DateTime | Data de criação |
| auditTrail | JSONB | Histórico de alterações |

### TransactionItem

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador |
| transactionId | UUID (FK) | Transação pai |
| productId | UUID (FK) | Produto |
| quantity | Decimal(10,2) | Quantidade |
| unitPrice | Decimal(10,2) | Preço unitário |
| total | Decimal(10,2) | Total (quantity * unitPrice) |

### Workflow

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador |
| organizationId | UUID (FK) | Tenant |
| name | String(255) | Nome do workflow |
| trigger | String(100) | Evento trigger (ex: STOCK_LOW) |
| conditions | JSONB | Condições para execução |
| isActive | Boolean | Workflow ativo |
| createdAt | DateTime | Data de criação |

### WorkflowStep

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador |
| workflowId | UUID (FK) | Workflow pai |
| order | Integer | Ordem de execução |
| type | Enum | NOTIFY, CALL_API, CREATE_TRANSACTION, UPDATE_STOCK, WEBHOOK |
| config | JSONB | Configuração da ação |
| fallback | JSONB? | Ação de fallback em caso de falha |

### Event

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador |
| organizationId | UUID (FK) | Tenant |
| type | String(100) | Tipo (ORDER_CREATED, STOCK_LOW, etc.) |
| source | String(50) | Módulo de origem |
| payload | JSONB | Dados do evento |
| processedAt | DateTime? | Quando foi processado |
| createdAt | DateTime | Data de criação |

### Dashboard

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID (PK) | Identificador |
| organizationId | UUID (FK) | Tenant |
| name | String(255) | Nome do dashboard |
| layout | JSONB | Configuração de layout e widgets |
| isDefault | Boolean | Dashboard padrão da org |
| createdAt | DateTime | Data de criação |

## Indexes

```sql
-- Multi-tenant isolation (todas as tabelas)
CREATE INDEX idx_*_organization_id ON * (organization_id);

-- Performance crítica
CREATE INDEX idx_transactions_org_status ON transactions (organization_id, status, due_date);
CREATE INDEX idx_events_org_type ON events (organization_id, type, created_at);
CREATE INDEX idx_customers_org_segment ON customers (organization_id, segment);

-- RLS Policy template
ALTER TABLE * ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON * USING (organization_id = current_setting('app.tenant_id')::uuid);
```
