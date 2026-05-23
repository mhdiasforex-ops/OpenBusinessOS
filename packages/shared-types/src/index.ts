// ============================================================
// OpenBusinessOS — Shared Types
// ============================================================

// Re-export all enums from the dedicated module
export {
  Niche,
  SubNiche,
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
  CustomerSegment,
  ProductStatus,
  DashboardType,
  OnboardingStatus,
} from './enums';

import type {
  Niche,
  SubNiche,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  WorkflowStepType,
  EventStatus,
  CustomerSegment,
} from './enums';

export enum Plan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

// --- Base Entity ---

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Organization ---

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  niche: Niche;
  subniche?: SubNiche;
  settings: Record<string, any>;
  isActive: boolean;
  plan: Plan;
}

// --- User ---

export interface User extends BaseEntity {
  organizationId: string;
  email: string;
  name: string;
  mfaEnabled: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  roles?: Role[];
}

// --- Role & Permission ---

export interface Role extends BaseEntity {
  name: string;
  organizationId: string;
  permissions?: Permission[];
}

export interface Permission extends BaseEntity {
  resource: string;
  action: string;
  roleId: string;
}

// --- Product ---

export interface Product extends BaseEntity {
  organizationId: string;
  name: string;
  sku: string;
  category?: string;
  costPrice: number;
  salePrice: number;
  unit: string;
  stockQuantity: number;
  minStock: number;
  isActive: boolean;
  metadata: Record<string, any>;
}

// --- Customer ---

export interface Customer extends BaseEntity {
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  segment: CustomerSegment;
  ltv: number;
  totalOrders: number;
  lastOrderAt?: Date;
  tags: string[];
  metadata: Record<string, any>;
}

// --- Transaction ---

export interface Transaction extends BaseEntity {
  organizationId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  customerId?: string;
  dueDate: Date;
  paidAt?: Date;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  conciliationId?: string;
  auditTrail: Record<string, any>;
  items?: TransactionItem[];
}

// --- TransactionItem ---

export interface TransactionItem extends BaseEntity {
  transactionId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// --- Workflow ---

export interface Workflow extends BaseEntity {
  organizationId: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  isActive: boolean;
  steps?: WorkflowStep[];
}

// --- WorkflowStep ---

export interface WorkflowStep extends BaseEntity {
  workflowId: string;
  order: number;
  type: WorkflowStepType;
  config: Record<string, any>;
  fallback?: Record<string, any>;
}

// --- Event ---

export interface Event extends BaseEntity {
  organizationId: string;
  type: string;
  source: string;
  payload: Record<string, any>;
  processedAt?: Date;
  status: EventStatus;
}

// --- Dashboard ---

export interface Dashboard extends BaseEntity {
  organizationId: string;
  name: string;
  layout: Record<string, any>;
  isDefault: boolean;
}

// --- API Types ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// --- Auth Types ---

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  roles: string[];
  iat: number;
  exp: number;
}

// --- Financial Types ---

export interface CashFlowEntry {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface DRECategory {
  name: string;
  value: number;
  percentage: number;
}

export interface DREReport {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  costOfGoods: number;
  grossMargin: number;
  operatingExpenses: DRECategory[];
  ebitda: number;
  netIncome: number;
}

// --- Analytics Types ---

export interface DashboardMetrics {
  income: number;
  expense: number;
  profit: number;
  activeCustomers: number;
  totalProducts: number;
  averageMargin: number;
  overdueCount: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}
