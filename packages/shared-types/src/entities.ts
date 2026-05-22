// ============================================================
// Entity Interfaces — Todas as entidades do domínio OpenBusinessOS
// ============================================================

import type {
  Niche,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  WorkflowStepType,
  WorkflowStatus,
  WorkflowExecutionStatus,
  WorkflowStepStatus,
  EventSeverity,
  EventStatus,
  UserRole,
  PermissionAction,
  PermissionResource,
  CustomerStatus,
  ProductStatus,
  DashboardType,
  OnboardingStatus,
} from './enums';

// ── Base ──────────────────────────────────────────────────────

/** Campos comuns a todas as entidades */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Organization ───────────────────────────────────────────────

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  cnpj: string | null;
  niche: Niche;
  description: string | null;
  logoUrl: string | null;
  email: string;
  phone: string | null;
  address: Address | null;
  isActive: boolean;
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt: Date | null;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  currency: string;
  locale: string;
  timezone: string;
  fiscalRegime: FiscalRegime;
  invoiceEnabled: boolean;
  pixEnabled: boolean;
  notificationsEnabled: boolean;
}

export type FiscalRegime = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI';

export interface Address {
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ── User ───────────────────────────────────────────────────────

export interface User extends BaseEntity {
  organizationId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  emailVerifiedAt: Date | null;
}

export interface UserWithOrganization extends User {
  organization: Organization;
}

// ── Role & Permission ──────────────────────────────────────────

export interface Role extends BaseEntity {
  organizationId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface Permission extends BaseEntity {
  roleId: string;
  action: PermissionAction;
  resource: PermissionResource;
  conditions: Record<string, unknown> | null;
}

// ── Product ────────────────────────────────────────────────────

export interface Product extends BaseEntity {
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  unitPrice: number;
  costPrice: number | null;
  stockQuantity: number;
  minStockQuantity: number;
  unit: string;
  status: ProductStatus;
  imageUrl: string | null;
  metadata: Record<string, unknown> | null;
}

// ── Customer ───────────────────────────────────────────────────

export interface Customer extends BaseEntity {
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  documentType: 'CPF' | 'CNPJ' | null;
  address: Address | null;
  status: CustomerStatus;
  tags: string[];
  notes: string | null;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseAt: Date | null;
  metadata: Record<string, unknown> | null;
}

// ── Transaction & TransactionItem ──────────────────────────────

export interface Transaction extends BaseEntity {
  organizationId: string;
  customerId: string | null;
  type: TransactionType;
  status: TransactionStatus;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paymentMethod: PaymentMethod | null;
  dueDate: Date | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  description: string | null;
  externalId: string | null;
  items: TransactionItem[];
  metadata: Record<string, unknown> | null;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: Date;
}

// ── Workflow ───────────────────────────────────────────────────

export interface Workflow extends BaseEntity {
  organizationId: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  triggerEvent: string | null;
  steps: WorkflowStep[];
  executionCount: number;
  lastExecutionAt: Date | null;
  metadata: Record<string, unknown> | null;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  type: WorkflowStepType;
  status: WorkflowStepStatus;
  order: number;
  config: Record<string, unknown>;
  nextStepId: string | null;
  onFailureStepId: string | null;
  timeoutMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution extends BaseEntity {
  workflowId: string;
  organizationId: string;
  status: WorkflowExecutionStatus;
  triggeredBy: string;
  currentStepIndex: number;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
  stepExecutions: WorkflowStepExecution[];
}

export interface WorkflowStepExecution {
  id: string;
  executionId: string;
  stepId: string;
  status: WorkflowStepStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

// ── Event ──────────────────────────────────────────────────────

export interface Event extends BaseEntity {
  organizationId: string;
  eventType: string;
  severity: EventSeverity;
  status: EventStatus;
  source: string;
  payload: Record<string, unknown>;
  processedAt: Date | null;
  error: string | null;
  correlationId: string | null;
}

// ── Dashboard ──────────────────────────────────────────────────

export interface Dashboard extends BaseEntity {
  organizationId: string;
  name: string;
  type: DashboardType;
  isDefault: boolean;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  gap: number;
}

// ── API Types ──────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details: Record<string, unknown> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: Record<string, unknown> | null;
}
