// ============================================================
// Enums — Todos os tipos enum do domínio OpenBusinessOS
// ============================================================

/** Nichos de mercado suportados pelo sistema */
export enum Niche {
  RETAIL = 'RETAIL',
  FOOD_SERVICE = 'FOOD_SERVICE',
  PROFESSIONAL_SERVICES = 'PROFESSIONAL_SERVICES',
  ECOMMERCE = 'ECOMMERCE',
  HEALTH_CARE = 'HEALTH_CARE',
  EDUCATION = 'EDUCATION',
  CONSTRUCTION = 'CONSTRUCTION',
  BEAUTY = 'BEAUTY',
  FITNESS = 'FITNESS',
  LEGAL = 'LEGAL',
  ACCOUNTING = 'ACCOUNTING',
  TECH_SERVICES = 'TECH_SERVICES',
  REAL_ESTATE = 'REAL_ESTATE',
  AUTOMOTIVE = 'AUTOMOTIVE',
  AGRICULTURE = 'AGRICULTURE',
  OTHER = 'OTHER',
}

/** Tipos de transação financeira */
export enum TransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  EXPENSE = 'EXPENSE',
  RECEIVABLE = 'RECEIVABLE',
  PAYABLE = 'PAYABLE',
  TRANSFER = 'TRANSFER',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

/** Status de uma transação */
export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

/** Métodos de pagamento aceitos */
export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  OTHER = 'OTHER',
}

/** Tipos de passo em um workflow */
export enum WorkflowStepType {
  TRIGGER = 'TRIGGER',
  CONDITION = 'CONDITION',
  ACTION = 'ACTION',
  DELAY = 'DELAY',
  NOTIFICATION = 'NOTIFICATION',
  WEBHOOK = 'WEBHOOK',
  LOOP = 'LOOP',
  PARALLEL = 'PARALLEL',
}

/** Status de um workflow */
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

/** Status de uma execução de workflow */
export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  TIMED_OUT = 'TIMED_OUT',
}

/** Status de um passo do workflow */
export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

/** Níveis de severidade de eventos */
export enum EventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/** Status de um evento */
export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

/** Papéis de usuário no sistema */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  VIEWER = 'VIEWER',
}

/** Tipos de permissão */
export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
  APPROVE = 'APPROVE',
}

/** Recursos do sistema que podem ser alvo de permissões */
export enum PermissionResource {
  ORGANIZATION = 'ORGANIZATION',
  USER = 'USER',
  ROLE = 'ROLE',
  FINANCIAL = 'FINANCIAL',
  PRODUCT = 'PRODUCT',
  CUSTOMER = 'CUSTOMER',
  WORKFLOW = 'WORKFLOW',
  ANALYTICS = 'ANALYTICS',
  ONBOARDING = 'ONBOARDING',
  EVENT = 'EVENT',
  DASHBOARD = 'DASHBOARD',
}

/** Status de um cliente */
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LEAD = 'LEAD',
  CHURNED = 'CHURNED',
  PROSPECT = 'PROSPECT',
}

/** Status de um produto */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

/** Tipos de dashboard */
export enum DashboardType {
  FINANCIAL = 'FINANCIAL',
  SALES = 'SALES',
  CRM = 'CRM',
  OPERATIONS = 'OPERATIONS',
  CUSTOM = 'CUSTOM',
}

/** Status de onboarding */
export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}
