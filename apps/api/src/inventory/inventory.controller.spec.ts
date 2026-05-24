import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryController } from './inventory.controller';

describe('InventoryController', () => {
  let controller: InventoryController;
  let inventoryService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    inventoryService = {
      createMovement: vi.fn().mockResolvedValue({ id: 'mov-1' }),
      getMovements: vi.fn().mockResolvedValue([]),
      getLowStock: vi.fn().mockResolvedValue([]),
      createSupplier: vi.fn().mockResolvedValue({ id: 'sup-1' }),
      getSuppliers: vi.fn().mockResolvedValue([]),
      getSupplier: vi.fn().mockResolvedValue({ id: 'sup-1' }),
      updateSupplier: vi.fn().mockResolvedValue({ id: 'sup-1' }),
      deleteSupplier: vi.fn().mockResolvedValue({ success: true }),
      createPurchaseOrder: vi.fn().mockResolvedValue({ id: 'po-1' }),
      getPurchaseOrders: vi.fn().mockResolvedValue([]),
      updatePurchaseOrderStatus: vi.fn().mockResolvedValue({ id: 'po-1', status: 'approved' }),
    };
    controller = new InventoryController(inventoryService);
  });

  it('should call createMovement with organizationId, dto, and userId', async () => {
    const dto = { productId: 'prod-1', quantity: 10, type: 'in' };
    const result = await controller.createMovement(req, dto);
    expect(inventoryService.createMovement).toHaveBeenCalledWith('org-123', dto, 'user-1');
    expect(result).toEqual({ id: 'mov-1' });
  });

  it('should call getMovements with organizationId and filters', async () => {
    const filters = { type: 'in' };
    const result = await controller.getMovements(req, filters);
    expect(inventoryService.getMovements).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual([]);
  });

  it('should call getLowStock with organizationId', async () => {
    const result = await controller.getLowStock(req);
    expect(inventoryService.getLowStock).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([]);
  });

  it('should call createSupplier with organizationId and dto', async () => {
    const dto = { name: 'Supplier A' };
    const result = await controller.createSupplier(req, dto);
    expect(inventoryService.createSupplier).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'sup-1' });
  });

  it('should call getSuppliers with organizationId and filters', async () => {
    const filters = { name: 'A' };
    const result = await controller.getSuppliers(req, filters);
    expect(inventoryService.getSuppliers).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual([]);
  });

  it('should call getSupplier with organizationId and id', async () => {
    const result = await controller.getSupplier(req, 'sup-1');
    expect(inventoryService.getSupplier).toHaveBeenCalledWith('org-123', 'sup-1');
    expect(result).toEqual({ id: 'sup-1' });
  });

  it('should call updateSupplier with organizationId, id, and dto', async () => {
    const dto = { name: 'Supplier B' };
    const result = await controller.updateSupplier(req, 'sup-1', dto);
    expect(inventoryService.updateSupplier).toHaveBeenCalledWith('org-123', 'sup-1', dto);
    expect(result).toEqual({ id: 'sup-1' });
  });

  it('should call deleteSupplier with organizationId and id', async () => {
    const result = await controller.deleteSupplier(req, 'sup-1');
    expect(inventoryService.deleteSupplier).toHaveBeenCalledWith('org-123', 'sup-1');
    expect(result).toEqual({ success: true });
  });

  it('should call createPurchaseOrder with organizationId and dto', async () => {
    const dto = { supplierId: 'sup-1', items: [] };
    const result = await controller.createPurchaseOrder(req, dto);
    expect(inventoryService.createPurchaseOrder).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'po-1' });
  });

  it('should call getPurchaseOrders with organizationId and filters', async () => {
    const filters = { status: 'pending' };
    const result = await controller.getPurchaseOrders(req, filters);
    expect(inventoryService.getPurchaseOrders).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual([]);
  });

  it('should call updatePurchaseOrderStatus with organizationId, id, and status', async () => {
    const result = await controller.updatePurchaseOrderStatus(req, 'po-1', 'approved');
    expect(inventoryService.updatePurchaseOrderStatus).toHaveBeenCalledWith('org-123', 'po-1', 'approved');
    expect(result).toEqual({ id: 'po-1', status: 'approved' });
  });
});
