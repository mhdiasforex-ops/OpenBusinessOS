# Quickstart: OpenBusinessOS Core Foundation

## Cenários de Validação Chave

Os seguintes cenários validam que o MVP está funcional end-to-end. Execute-os manualmente ou via Playwright após setup.

---

### Cenário 1: Onboarding de Nova Empresa (End-to-End)

```bash
# 1. Acessar o sistema pela primeira vez
GET http://localhost:3000 → Redireciona para /onboarding

# 2. Registrar conta
POST /api/v1/auth/register
{ "email": "joao@sabor.com", "password": "senha123", "name": "João", "organizationName": "Restaurante Sabor" }
→ 201 Created, token JWT recebido

# 3. Iniciar onboarding
POST /api/v1/onboarding/start
→ 200, recebe perguntas da IA

# 4. Responder perguntas (nicho: restaurante, canais: delivery+salão, ticket: R$45, funcionários: 8)
POST /api/v1/onboarding/answer
→ 200, próxima etapa

# 5. Completar onboarding
POST /api/v1/onboarding/answer (step 3)
→ 200, ONBOARDING_COMPLETED event fired

# VALIDAÇÃO:
- Dashboard carrega com widgets relevantes ao nicho
- Catálogo tem categorias padrão de restaurante
- Permissões criadas (owner, manager, operator)
- Fluxo de caixa inicial com zero
- Workflow padrão "estoque baixo" criado
```

### Cenário 2: Operação Financeira Completa

```bash
# 1. Registrar venda
POST /api/v1/financial/transactions
{ "type": "INCOME", "category": "venda", "amount": 150, "customerId": "uuid" }
→ 201, TRANSACTION_CREATED event fired

# 2. Registrar despesa
POST /api/v1/financial/transactions
{ "type": "EXPENSE", "category": "compras", "amount": 80, "dueDate": "2025-02-01" }
→ 201

# 3. Verificar fluxo de caixa
GET /api/v1/financial/cash-flow?from=2025-01-01&to=2025-01-31
→ 200, income: 150, expense: 80, balance: 70

# 4. Verificar CMV
GET /api/v1/financial/cmv
→ 200, lista de produtos com margem

# VALIDAÇÃO:
- Saldo reflete transações
- CMV calculado corretamente
- Dashboard financeiro atualizado
```

### Cenário 3: Workflow de Estoque Baixo

```bash
# 1. Criar produto com estoque mínimo = 10
POST /api/v1/products (ou via onboarding)
{ "name": "Arroz", "stockQuantity": 12, "minStock": 10 }

# 2. Workflow já existe (criado no onboarding): STOCK_LOW → NOTIFY manager

# 3. Reduzir estoque abaixo do mínimo
PATCH /api/v1/products/:id
{ "stockQuantity": 8 }
→ STOCK_LOW event fired
→ Workflow triggered
→ Notificação enviada

# VALIDAÇÃO:
- Evento STOCK_LOW registrado na tabela events
- Workflow executado (execution log existe)
- Gerente recebeu notificação
```

### Cenário 4: Isolamento Multi-Tenant

```bash
# 1. Criar Org A e Org B
# 2. Registrar transação na Org A
POST /api/v1/financial/transactions (header: X-Organization-Id: orgA)
{ "type": "INCOME", "amount": 1000 }

# 3. Consultar como Org B
GET /api/v1/financial/transactions (header: X-Organization-Id: orgB)
→ 200, lista VAZIA (sem dados da Org A)

# VALIDAÇÃO:
- Zero vazamento de dados entre tenants
- Tentativa de acesso cross-tenant retorna 403
```

---

## Setup Local

```bash
# 1. Clonar e instalar
git clone https://github.com/openbusinessos/openbusinessos.git
cd openbusinessos
npm install

# 2. Subir infraestrutura
docker compose up -d  # PostgreSQL, Redis, Qdrant

# 3. Configurar ambiente
cp .env.example .env
# Editar .env com DATABASE_URL, REDIS_URL, etc.

# 4. Rodar migrations
npm run db:migrate

# 5. Seed (dados de demonstração)
npm run db:seed

# 6. Iniciar desenvolvimento
npm run dev  # Turborepo: web (3000) + api (3001)

# 7. Testar
npm run test        # Unit + Contract
npm run test:e2e    # Playwright
```
