# API Contracts: OpenBusinessOS Core Foundation

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.openbusinessos.com/v1
```

## Common Headers

```
Authorization: Bearer <jwt_token>
X-Organization-Id: <org_uuid>
Content-Type: application/json
```

---

## Auth Module

### POST /auth/register
Cria novo usuário e organização (primeiro passo do onboarding).

**Request**:
```json
{
  "email": "owner@restaurante.com",
  "password": "securePassword123",
  "name": "João Silva",
  "organizationName": "Restaurante Sabor"
}
```

**Response 201**:
```json
{
  "user": { "id": "uuid", "email": "owner@restaurante.com", "name": "João Silva" },
  "organization": { "id": "uuid", "name": "Restaurante Sabor", "slug": "restaurante-sabor" },
  "token": "jwt_token",
  "onboardingState": "IN_PROGRESS"
}
```

### POST /auth/login
**Request**: `{ "email": "...", "password": "..." }`
**Response 200**: `{ "token": "jwt", "user": {...}, "organization": {...}, "mfaRequired": false }`

### POST /auth/mfa/verify
**Request**: `{ "code": "123456" }`
**Response 200**: `{ "token": "jwt_with_mfa" }`

### GET /auth/me
**Response 200**: Usuário atual com roles e permissões

---

## Organization Module

### GET /organizations/:id
**Response 200**: Organização com settings e módulos habilitados

### PATCH /organizations/:id
**Request**: `{ "name": "...", "settings": {...} }`
**Response 200**: Organização atualizada

### GET /organizations/:id/members
**Response 200**: Lista de membros com roles

---

## Financial Module

### GET /financial/cash-flow
**Query**: `?from=2025-01-01&to=2025-01-31`
**Response 200**:
```json
{
  "period": { "from": "2025-01-01", "to": "2025-01-31" },
  "income": 45000.00,
  "expense": 32000.00,
  "balance": 13000.00,
  "projectedBalance": 15000.00,
  "dailyBreakdown": [...]
}
```

### GET /financial/cmv
**Response 200**: `{ "products": [{ "id": "uuid", "name": "...", "costPrice": 10, "salePrice": 25, "margin": 0.60 }] }`

### GET /financial/dre
**Query**: `?from=2025-01-01&to=2025-01-31`
**Response 200**: DRE simplificado com receita, CMV, margem bruta, despesas operacionais, lucro líquido

### GET /financial/transactions
**Query**: `?type=INCOME&status=PENDING&page=1&limit=20`
**Response 200**: Lista paginada de transações

### POST /financial/transactions
**Request**: `{ "type": "EXPENSE", "category": "compras", "amount": 500, "dueDate": "2025-02-01" }`
**Response 201**: Transação criada

### PATCH /financial/transactions/:id
**Request**: `{ "status": "PAID", "paidAt": "2025-01-28" }`
**Response 200**: Transação atualizada

### POST /financial/conciliate
**Request**: Upload OFX file
**Response 200**: `{ "matched": 15, "unmatched": 3, "created": 2 }`

---

## CRM Module

### GET /crm/customers
**Query**: `?segment=high-ltv&search=joao&page=1&limit=20`
**Response 200**: Lista paginada de clientes com LTV e segmento

### POST /crm/customers
**Request**: `{ "name": "...", "email": "...", "phone": "...", "document": "..." }`
**Response 201**: Cliente criado

### GET /crm/customers/:id
**Response 200**: Perfil completo com histórico, LTV, interações e recomendações

### POST /crm/customers/:id/interactions
**Request**: `{ "type": "CALL", "notes": "Cliente interessado em combo" }`
**Response 201**: Interação registrada

### GET /crm/segments
**Response 200**: Lista de segmentos com contagem e métricas

### POST /crm/campaigns
**Request**: `{ "name": "...", "segmentId": "uuid", "channel": "whatsapp", "message": "..." }`
**Response 201**: Campanha criada

---

## Workflow Module

### GET /workflows
**Response 200**: Lista de workflows da organização

### POST /workflows
**Request**:
```json
{
  "name": "Estoque Baixo - Notificar Gerente",
  "trigger": "STOCK_LOW",
  "conditions": { "minStock": true },
  "steps": [
    { "order": 1, "type": "NOTIFY", "config": { "target": "manager", "channel": "push" } },
    { "order": 2, "type": "CALL_API", "config": { "url": "/stock/auto-reorder" } }
  ]
}
```
**Response 201**: Workflow criado

### PATCH /workflows/:id
**Request**: `{ "isActive": true }`
**Response 200**: Workflow atualizado

### POST /workflows/:id/trigger
**Request**: `{ "payload": { "productId": "uuid", "currentStock": 5 } }`
**Response 200**: `{ "executionId": "uuid", "status": "RUNNING" }`

### GET /workflows/:id/executions
**Response 200**: Histórico de execuções do workflow

---

## Analytics Module

### GET /analytics/dashboard
**Query**: `?dashboardId=uuid`
**Response 200**: `{ "widgets": [...], "data": {...}, "lastUpdated": "..." }`

### GET /analytics/metrics
**Query**: `?from=2025-01-01&to=2025-01-31&modules=financial,crm`
**Response 200**: `{ "financial": {...}, "crm": {...} }`

### GET /analytics/cross-module
**Query**: `?metric=sales_vs_stock&period=30d`
**Response 200**: Dados cruzados entre módulos com insights

---

## Onboarding Module

### POST /onboarding/start
**Request**: `{ "organizationId": "uuid" }`
**Response 200**: `{ "questions": [...], "currentStep": 1, "totalSteps": 3 }`

### POST /onboarding/answer
**Request**: `{ "organizationId": "uuid", "step": 1, "answers": {...} }`
**Response 200**: Próxima etapa ou configuração gerada

### GET /onboarding/status
**Query**: `?organizationId=uuid`
**Response 200**: `{ "currentStep": 2, "completed": false, "generatedConfig": {...} }`

---

## Event Definitions

| Event | Source Module | Payload |
|-------|-------------|---------|
| `ORG_CREATED` | auth | `{ organizationId, niche, name }` |
| `USER_REGISTERED` | auth | `{ userId, organizationId, role }` |
| `TRANSACTION_CREATED` | financial | `{ transactionId, type, amount, customerId? }` |
| `TRANSACTION_PAID` | financial | `{ transactionId, paidAt, paymentMethod }` |
| `PAYMENT_OVERDUE` | financial | `{ transactionId, daysOverdue, amount }` |
| `STOCK_LOW` | product | `{ productId, currentStock, minStock }` |
| `CUSTOMER_CREATED` | crm | `{ customerId, segment }` |
| `CUSTOMER_CHURN_RISK` | crm | `{ customerId, riskScore, reason }` |
| `CAMPAIGN_SENT` | crm | `{ campaignId, segmentId, recipientCount }` |
| `WORKFLOW_TRIGGERED` | workflow | `{ workflowId, trigger, payload }` |
| `WORKFLOW_COMPLETED` | workflow | `{ workflowId, executionId, result }` |
| `WORKFLOW_FAILED` | workflow | `{ workflowId, executionId, error }` |
| `ONBOARDING_COMPLETED` | onboarding | `{ organizationId, config }` |
| `ANOMALY_DETECTED` | analytics | `{ type, module, description, severity }` |
