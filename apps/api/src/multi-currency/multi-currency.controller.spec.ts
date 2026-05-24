import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiCurrencyController } from './multi-currency.controller';

describe('MultiCurrencyController', () => {
  let controller: MultiCurrencyController;
  let multiCurrencyService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    multiCurrencyService = {
      getRates: vi.fn().mockResolvedValue([{ from: 'USD', to: 'BRL', rate: 5.0 }]),
      addRate: vi.fn().mockResolvedValue({ from: 'USD', to: 'BRL', rate: 5.0 }),
      convert: vi.fn().mockResolvedValue({ from: 'USD', to: 'BRL', amount: 100, result: 500 }),
      syncRates: vi.fn().mockResolvedValue({ synced: true }),
      getSupportedCurrencies: vi.fn().mockResolvedValue(['USD', 'BRL', 'EUR']),
    };
    controller = new MultiCurrencyController(multiCurrencyService);
  });

  it('should call getRates with organizationId', async () => {
    const result = await controller.getRates(req);
    expect(multiCurrencyService.getRates).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([{ from: 'USD', to: 'BRL', rate: 5.0 }]);
  });

  it('should call addRate with organizationId and dto', async () => {
    const dto = { from: 'USD', to: 'BRL', rate: 5.0 };
    const result = await controller.addRate(req, dto);
    expect(multiCurrencyService.addRate).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ from: 'USD', to: 'BRL', rate: 5.0 });
  });

  it('should call convert with organizationId and dto', async () => {
    const dto = { from: 'USD', to: 'BRL', amount: 100 };
    const result = await controller.convert(req, dto);
    expect(multiCurrencyService.convert).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ from: 'USD', to: 'BRL', amount: 100, result: 500 });
  });

  it('should call syncRates with organizationId', async () => {
    const result = await controller.syncRates(req);
    expect(multiCurrencyService.syncRates).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ synced: true });
  });

  it('should call getSupportedCurrencies', async () => {
    const result = await controller.getSupportedCurrencies();
    expect(multiCurrencyService.getSupportedCurrencies).toHaveBeenCalled();
    expect(result).toEqual(['USD', 'BRL', 'EUR']);
  });
});
