import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MultiCurrencyService } from './multi-currency.service';
import { CreateExchangeRateDto, ConvertDto, SupportedCurrency } from './dto/multi-currency.dto';

describe('MultiCurrencyService', () => {
  let service: MultiCurrencyService;
  let prisma: any;

  beforeEach(() => {
    prisma = {};
    service = new MultiCurrencyService(prisma);
  });

  const orgId = 'org-1';

  // ────────────────────────────────────────────────
  //  getRates
  // ────────────────────────────────────────────────

  describe('getRates', () => {
    it('should return empty array when no rates exist for org', async () => {
      const result = await service.getRates(orgId);

      expect(result).toEqual([]);
    });

    it('should return all rates for the organization', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.25,
        source: 'manual',
      });

      const result = await service.getRates(orgId);

      expect(result).toHaveLength(1);
      expect(result[0].fromCurrency).toBe('USD');
      expect(result[0].toCurrency).toBe('BRL');
      expect(result[0].rate).toBe(5.25);
    });

    it('should isolate rates between organizations', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.25,
      });
      await service.addRate('org-2', {
        fromCurrency: SupportedCurrency.EUR,
        toCurrency: SupportedCurrency.BRL,
        rate: 6.10,
      });

      const org1Rates = await service.getRates(orgId);
      const org2Rates = await service.getRates('org-2');

      expect(org1Rates).toHaveLength(1);
      expect(org1Rates[0].fromCurrency).toBe('USD');
      expect(org2Rates).toHaveLength(1);
      expect(org2Rates[0].fromCurrency).toBe('EUR');
    });
  });

  // ────────────────────────────────────────────────
  //  addRate
  // ────────────────────────────────────────────────

  describe('addRate', () => {
    it('should store a valid exchange rate', async () => {
      const dto: CreateExchangeRateDto = {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.25,
        source: 'manual',
      };

      const result = await service.addRate(orgId, dto);

      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('BRL');
      expect(result.rate).toBe(5.25);
      expect(result.source).toBe('manual');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should default source to manual when not provided', async () => {
      const dto: CreateExchangeRateDto = {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      };

      const result = await service.addRate(orgId, dto);

      expect(result.source).toBe('manual');
    });

    it('should throw BadRequestException when from and to currencies are the same', async () => {
      const dto: CreateExchangeRateDto = {
        fromCurrency: SupportedCurrency.BRL,
        toCurrency: SupportedCurrency.BRL,
        rate: 1,
      };

      await expect(service.addRate(orgId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.addRate(orgId, dto)).rejects.toThrow('fromCurrency e toCurrency não podem ser iguais');
    });

    it('should throw BadRequestException when rate is zero', async () => {
      const dto: CreateExchangeRateDto = {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 0,
      };

      await expect(service.addRate(orgId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.addRate(orgId, dto)).rejects.toThrow('A taxa de câmbio deve ser maior que zero');
    });

    it('should throw BadRequestException when rate is negative', async () => {
      const dto: CreateExchangeRateDto = {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: -1,
      };

      await expect(service.addRate(orgId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should overwrite an existing rate for the same pair', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      });

      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.50,
      });

      const rates = await service.getRates(orgId);
      expect(rates).toHaveLength(1);
      expect(rates[0].rate).toBe(5.50);
    });
  });

  // ────────────────────────────────────────────────
  //  convert
  // ────────────────────────────────────────────────

  describe('convert', () => {
    it('should return original amount when currencies are the same', async () => {
      const dto: ConvertDto = {
        amount: 100,
        fromCurrency: SupportedCurrency.BRL,
        toCurrency: SupportedCurrency.BRL,
      };

      const result = await service.convert(orgId, dto);

      expect(result.originalAmount).toBe(100);
      expect(result.convertedAmount).toBe(100);
      expect(result.rate).toBe(1);
      expect(result.source).toBe('same-currency');
    });

    it('should convert using stored rate', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.25,
      });

      const dto: ConvertDto = {
        amount: 100,
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
      };

      const result = await service.convert(orgId, dto);

      expect(result.originalAmount).toBe(100);
      expect(result.convertedAmount).toBe(525);
      expect(result.rate).toBe(5.25);
      expect(result.source).toBe('manual');
    });

    it('should round converted amount to 2 decimal places', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.3333,
      });

      const result = await service.convert(orgId, { amount: 99.99, fromCurrency: SupportedCurrency.USD, toCurrency: SupportedCurrency.BRL });

      expect(result.convertedAmount).toBe(533.28); // 99.99 * 5.3333 = 533.276667 -> 533.28
    });

    it('should throw NotFoundException when rate is not found', async () => {
      const dto: ConvertDto = {
        amount: 100,
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
      };

      await expect(service.convert(orgId, dto)).rejects.toThrow(NotFoundException);
      await expect(service.convert(orgId, dto)).rejects.toThrow('Taxa de câmbio não encontrada');
    });

    it('should convert via cross-rate through BRL when direct rate missing', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      });
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.BRL,
        toCurrency: SupportedCurrency.EUR,
        rate: 0.20,
      });

      const dto: ConvertDto = {
        amount: 100,
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.EUR,
      };

      const result = await service.convert(orgId, dto);

      // USD -> BRL = 5.00, BRL -> EUR = 0.20, so USD -> EUR = 5.00 * 0.20 = 1.00
      expect(result.convertedAmount).toBe(100);
      expect(result.rate).toBe(1);
      expect(result.source).toBe('cross-rate-via-BRL');
    });

    it('should throw NotFoundException when cross-rate also cannot be computed', async () => {
      const dto: ConvertDto = {
        amount: 100,
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.EUR,
      };

      await expect(service.convert(orgId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────
  //  syncRates
  // ────────────────────────────────────────────────

  describe('syncRates', () => {
    it('should sync rates and return success with count', async () => {
      vi.spyOn(service as any, 'fetchRateFromApi').mockResolvedValue(5.25);

      const result = await service.syncRates(orgId);

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
    });

    it('should use fallback rates when API fails', async () => {
      vi.spyOn(service as any, 'fetchRateFromApi').mockRejectedValue(new Error('API unavailable'));

      const result = await service.syncRates(orgId);

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.message).toContain('fallback');
    });

    it('should generate cross-rates after sync', async () => {
      vi.spyOn(service as any, 'fetchRateFromApi').mockResolvedValue(5.25);

      await service.syncRates(orgId);

      const rates = await service.getRates(orgId);
      // Should have forward + inverse for each non-BRL currency, plus cross-rates
      expect(rates.length).toBeGreaterThan(2);
    });

    it('should have mixed success and fallback message', async () => {
      const mockFetch = vi.spyOn(service as any, 'fetchRateFromApi');
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) return Promise.resolve(5.25);
        return Promise.reject(new Error('fail'));
      });

      const result = await service.syncRates(orgId);

      expect(result.message).toContain('algumas usaram fallback');
    });

    it('should skip BRL currency', async () => {
      vi.spyOn(service as any, 'fetchRateFromApi').mockResolvedValue(5.25);

      await service.syncRates(orgId);

      const brlRate = (service as any).findRate(orgId, 'BRL', 'BRL');
      expect(brlRate).toBeNull();
    });
  });

  // ────────────────────────────────────────────────
  //  getSupportedCurrencies
  // ────────────────────────────────────────────────

  describe('getSupportedCurrencies', () => {
    it('should return list of supported currencies', async () => {
      const result = await service.getSupportedCurrencies();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include BRL as base currency', async () => {
      const result = await service.getSupportedCurrencies();

      expect(result.some(c => c.code === SupportedCurrency.BRL)).toBe(true);
    });

    it('should include USD, EUR, GBP', async () => {
      const result = await service.getSupportedCurrencies();

      const codes = result.map(c => c.code);
      expect(codes).toContain(SupportedCurrency.USD);
      expect(codes).toContain(SupportedCurrency.EUR);
      expect(codes).toContain(SupportedCurrency.GBP);
    });

    it('should return currency objects with code, name, symbol', async () => {
      const result = await service.getSupportedCurrencies();

      for (const currency of result) {
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('symbol');
      }
    });
  });

  // ────────────────────────────────────────────────
  //  findRate (private, tested via convert)
  // ────────────────────────────────────────────────

  describe('findRate', () => {
    it('should return null when org has no rates', () => {
      const result = (service as any).findRate(orgId, 'USD', 'BRL');

      expect(result).toBeNull();
    });

    it('should return direct rate when available', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.25,
      });

      const result = (service as any).findRate(orgId, 'USD', 'BRL');

      expect(result).not.toBeNull();
      expect(result.rate).toBe(5.25);
    });

    it('should return cross-rate via BRL when available', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      });
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.BRL,
        toCurrency: SupportedCurrency.EUR,
        rate: 0.20,
      });

      const result = (service as any).findRate(orgId, 'USD', 'EUR');

      expect(result).not.toBeNull();
      expect(result.rate).toBe(1); // 5.00 * 0.20
      expect(result.source).toBe('cross-rate-via-BRL');
    });

    it('should return null when cross-rate not computable', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      });

      const result = (service as any).findRate(orgId, 'EUR', 'USD');

      expect(result).toBeNull();
    });

    it('should prefer direct rate over cross-rate', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      });
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.50,
      });

      const result = (service as any).findRate(orgId, 'USD', 'BRL');

      expect(result.rate).toBe(5.50);
    });
  });

  // ────────────────────────────────────────────────
  //  fetchRateFromApi (private, tested via sync)
  // ────────────────────────────────────────────────

  describe('fetchRateFromApi', () => {
    it('should fetch rate from external API', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ rates: { USD: 5.25 } }) };
      vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(mockResponse);

      const result = await (service as any).fetchRateFromApi('BRL', 'USD');

      expect(result).toBe(5.25);
    });

    it('should throw when API returns non-ok status', async () => {
      const mockResponse = { ok: false, status: 429 };
      vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(mockResponse);

      await expect((service as any).fetchRateFromApi('BRL', 'USD')).rejects.toThrow('API returned 429');
    });

    it('should throw when rate not found in API response', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ rates: { EUR: 0.90 } }) };
      vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(mockResponse);

      await expect((service as any).fetchRateFromApi('BRL', 'USD')).rejects.toThrow('Rate for USD not found in API response');
    });

    it('should throw on network error', async () => {
      vi.spyOn(globalThis as any, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect((service as any).fetchRateFromApi('BRL', 'USD')).rejects.toThrow('Network error');
    });

    it('should call correct API URL', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ rates: { USD: 5.25 } }) };
      const fetchSpy = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(mockResponse);

      await (service as any).fetchRateFromApi('BRL', 'USD');

      expect(fetchSpy).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/BRL');
    });
  });

  // ────────────────────────────────────────────────
  //  generateCrossRates (private)
  // ────────────────────────────────────────────────

  describe('generateCrossRates', () => {
    it('should generate missing cross-rates', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      });
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.BRL,
        toCurrency: SupportedCurrency.EUR,
        rate: 0.20,
      });

      await (service as any).generateCrossRates(orgId);

      const rates = await service.getRates(orgId);
      const hasUsdToEur = rates.some(r => r.fromCurrency === 'USD' && r.toCurrency === 'EUR');
      expect(hasUsdToEur).toBe(true);
    });

    it('should do nothing when org has no rates', async () => {
      await (service as any).generateCrossRates(orgId);

      const rates = await service.getRates(orgId);
      expect(rates).toEqual([]);
    });

    it('should not overwrite existing direct rates', async () => {
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.00,
      });
      await service.addRate(orgId, {
        fromCurrency: SupportedCurrency.USD,
        toCurrency: SupportedCurrency.BRL,
        rate: 5.50,
      });

      await (service as any).generateCrossRates(orgId);

      const rates = await service.getRates(orgId);
      const usdToBrl = rates.find(r => r.fromCurrency === 'USD' && r.toCurrency === 'BRL');
      expect(usdToBrl!.rate).toBe(5.50); // Should not be overwritten by cross-rate
    });
  });
});
