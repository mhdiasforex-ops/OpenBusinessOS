import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    productsService = {
      createProduct: vi.fn().mockResolvedValue({ id: 'prod-1' }),
      getProducts: vi.fn().mockResolvedValue([]),
      getProduct: vi.fn().mockResolvedValue({ id: 'prod-1' }),
      updateProduct: vi.fn().mockResolvedValue({ id: 'prod-1' }),
      deleteProduct: vi.fn().mockResolvedValue({ success: true }),
      adjustStock: vi.fn().mockResolvedValue({ id: 'prod-1', stock: 50 }),
    };
    controller = new ProductsController(productsService);
  });

  it('should call createProduct with organizationId and dto', async () => {
    const dto = { name: 'Product A', price: 100 };
    const result = await controller.createProduct(req, dto);
    expect(productsService.createProduct).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'prod-1' });
  });

  it('should call getProducts with organizationId and filters', async () => {
    const filters = { category: 'food' };
    const result = await controller.getProducts(req, filters);
    expect(productsService.getProducts).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual([]);
  });

  it('should call getProduct with organizationId and id', async () => {
    const result = await controller.getProduct(req, 'prod-1');
    expect(productsService.getProduct).toHaveBeenCalledWith('org-123', 'prod-1');
    expect(result).toEqual({ id: 'prod-1' });
  });

  it('should call updateProduct with organizationId, id, and dto', async () => {
    const dto = { name: 'Product A Updated' };
    const result = await controller.updateProduct(req, 'prod-1', dto);
    expect(productsService.updateProduct).toHaveBeenCalledWith('org-123', 'prod-1', dto);
    expect(result).toEqual({ id: 'prod-1' });
  });

  it('should call deleteProduct with organizationId and id', async () => {
    const result = await controller.deleteProduct(req, 'prod-1');
    expect(productsService.deleteProduct).toHaveBeenCalledWith('org-123', 'prod-1');
    expect(result).toEqual({ success: true });
  });

  it('should call adjustStock with organizationId, id, quantity, and reason', async () => {
    const body = { quantity: 10, reason: 'restock' };
    const result = await controller.adjustStock(req, 'prod-1', body);
    expect(productsService.adjustStock).toHaveBeenCalledWith('org-123', 'prod-1', 10, 'restock');
    expect(result).toEqual({ id: 'prod-1', stock: 50 });
  });
});
