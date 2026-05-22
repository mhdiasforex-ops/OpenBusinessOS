// ============================================================
// OpenBusinessOS — Shared Utilities
// ============================================================

// --- Currency (BRL) ---

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseCurrency(formatted: string): number {
  const cleaned = formatted.replace(/[^\d,-]/g, '').replace(',', '.');
  return parseFloat(cleaned);
}

// --- Date (pt-BR) ---

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(dueDate: Date | string): boolean {
  return new Date(dueDate) < new Date();
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// --- CNPJ/CPF Validation ---

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/[^\d]/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(cleaned.charAt(size))) return false;

  size++;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(cleaned.charAt(size));
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/[^\d]/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned.charAt(i)) * (10 - i);
  let result = 11 - (sum % 11);
  if (result === 10 || result === 11) result = 0;
  if (result !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i)) * (11 - i);
  result = 11 - (sum % 11);
  if (result === 10 || result === 11) result = 0;
  return result === parseInt(cleaned.charAt(10));
}

export function formatCNPJ(cnpj: string): string {
  const c = cnpj.replace(/[^\d]/g, '');
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatCPF(cpf: string): string {
  const c = cpf.replace(/[^\d]/g, '');
  return c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

// --- Pagination ---

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function createPaginationMeta(total: number, page: number, perPage: number): PaginationMeta {
  return {
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export function getPaginationOffset(page: number, perPage: number): number {
  return (page - 1) * perPage;
}

// --- String ---

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// --- Misc ---

export function generateSlug(name: string): string {
  const base = slugify(name);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
