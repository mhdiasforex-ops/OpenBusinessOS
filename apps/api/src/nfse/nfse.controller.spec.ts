import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NfseController } from './nfse.controller';

describe('NfseController', () => {
  let controller: NfseController;
  let nfseService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    nfseService = {
      findAll: vi.fn().mockResolvedValue([{ id: 'nfse-1' }]),
      getStats: vi.fn().mockResolvedValue({ total: 10, issued: 8 }),
      getCities: vi.fn().mockResolvedValue(['São Paulo', 'Rio de Janeiro']),
      findOne: vi.fn().mockResolvedValue({ id: 'nfse-1' }),
      create: vi.fn().mockResolvedValue({ id: 'nfse-1' }),
      cancel: vi.fn().mockResolvedValue({ id: 'nfse-1', status: 'cancelled' }),
    };
    controller = new NfseController(nfseService);
  });

  it('should call findAll with organizationId, page, and limit', async () => {
    const result = await controller.findAll(req, '2', '10');
    expect(nfseService.findAll).toHaveBeenCalledWith('org-123', 2, 10);
    expect(result).toEqual([{ id: 'nfse-1' }]);
  });

  it('should call findAll with defaults when page and limit are undefined', async () => {
    const result = await controller.findAll(req, undefined, undefined);
    expect(nfseService.findAll).toHaveBeenCalledWith('org-123', 1, 20);
    expect(result).toEqual([{ id: 'nfse-1' }]);
  });

  it('should call getStats with organizationId', async () => {
    const result = await controller.getStats(req);
    expect(nfseService.getStats).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ total: 10, issued: 8 });
  });

  it('should call getCities', async () => {
    const result = await controller.getCities();
    expect(nfseService.getCities).toHaveBeenCalled();
    expect(result).toEqual(['São Paulo', 'Rio de Janeiro']);
  });

  it('should call findOne with organizationId and id', async () => {
    const result = await controller.findOne(req, 'nfse-1');
    expect(nfseService.findOne).toHaveBeenCalledWith('org-123', 'nfse-1');
    expect(result).toEqual({ id: 'nfse-1' });
  });

  it('should call create with organizationId and dto', async () => {
    const dto = { customerId: 'cust-1', amount: 1000 };
    const result = await controller.create(req, dto);
    expect(nfseService.create).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'nfse-1' });
  });

  it('should call cancel with organizationId, id, and dto', async () => {
    const dto = { reason: 'Erro na emissão' };
    const result = await controller.cancel(req, 'nfse-1', dto);
    expect(nfseService.cancel).toHaveBeenCalledWith('org-123', 'nfse-1', dto);
    expect(result).toEqual({ id: 'nfse-1', status: 'cancelled' });
  });
});
