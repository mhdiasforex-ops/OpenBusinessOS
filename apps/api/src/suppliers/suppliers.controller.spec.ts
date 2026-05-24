import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuppliersController } from './suppliers.controller';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      createSupplier: vi.fn().mockResolvedValue({ id: 'sup-1' }),
      getSuppliers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getSupplier: vi.fn().mockResolvedValue({ id: 'sup-1' }),
      updateSupplier: vi.fn().mockResolvedValue({ id: 'sup-1' }),
      deleteSupplier: vi.fn().mockResolvedValue({ success: true }),
      toggleActive: vi.fn().mockResolvedValue({ id: 'sup-1', isActive: false }),
    };
    controller = new SuppliersController(service);
  });

  it('should create supplier', async () => {
    const dto = { name: 'Distribuidora ABC' } as any;
    const result = await controller.createSupplier(req, dto);
    expect(result).toEqual({ id: 'sup-1' });
    expect(service.createSupplier).toHaveBeenCalledWith('org-123', dto);
  });

  it('should list suppliers', async () => {
    const filters = { search: 'ABC' } as any;
    const result = await controller.getSuppliers(req, filters);
    expect(result).toEqual({ items: [], total: 0 });
    expect(service.getSuppliers).toHaveBeenCalledWith('org-123', filters);
  });

  it('should get supplier by id', async () => {
    const result = await controller.getSupplier(req, 'sup-1');
    expect(result).toEqual({ id: 'sup-1' });
    expect(service.getSupplier).toHaveBeenCalledWith('org-123', 'sup-1');
  });

  it('should update supplier', async () => {
    const dto = { name: 'Distribuidora ABC S.A.' } as any;
    const result = await controller.updateSupplier(req, 'sup-1', dto);
    expect(result).toEqual({ id: 'sup-1' });
    expect(service.updateSupplier).toHaveBeenCalledWith('org-123', 'sup-1', dto);
  });

  it('should delete supplier', async () => {
    const result = await controller.deleteSupplier(req, 'sup-1');
    expect(result).toEqual({ success: true });
    expect(service.deleteSupplier).toHaveBeenCalledWith('org-123', 'sup-1');
  });

  it('should toggle active', async () => {
    const result = await controller.toggleActive(req, 'sup-1');
    expect(result).toEqual({ id: 'sup-1', isActive: false });
    expect(service.toggleActive).toHaveBeenCalledWith('org-123', 'sup-1');
  });
});
