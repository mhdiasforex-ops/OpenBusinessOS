import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExchangeRateDto, ConvertDto, SupportedCurrency } from './dto/multi-currency.dto';

interface StoredRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  updatedAt: Date;
}

@Injectable()
export class MultiCurrencyService {
  private readonly logger = new Logger(MultiCurrencyService.name);

  /** In-memory rate store keyed by organizationId -> `${from}-${to}` */
  private readonly rateStore = new Map<string, Map<string, StoredRate>>();

  private readonly supportedCurrencies: { code: SupportedCurrency; name: string; symbol: string }[] = [
    { code: SupportedCurrency.BRL, name: 'Real Brasileiro', symbol: 'R$' },
    { code: SupportedCurrency.USD, name: 'Dólar Americano', symbol: '$' },
    { code: SupportedCurrency.EUR, name: 'Euro', symbol: '€' },
    { code: SupportedCurrency.GBP, name: 'Libra Esterlina', symbol: '£' },
    { code: SupportedCurrency.ARS, name: 'Peso Argentino', symbol: '$' },
    { code: SupportedCurrency.CLP, name: 'Peso Chileno', symbol: '$' },
    { code: SupportedCurrency.MXN, name: 'Peso Mexicano', symbol: '$' },
    { code: SupportedCurrency.COP, name: 'Peso Colombiano', symbol: '$' },
    { code: SupportedCurrency.PEN, name: 'Sol Peruano', symbol: 'S/' },
    { code: SupportedCurrency.UYU, name: 'Peso Uruguaio', symbol: '$U' },
    { code: SupportedCurrency.PYG, name: 'Guarani Paraguaio', symbol: '₲' },
    { code: SupportedCurrency.BOB, name: 'Boliviano', symbol: 'Bs' },
  ];

  /** Default mock rates (BRL as base) used when API sync fails */
  private readonly defaultRates: Record<string, number> = {
    USD: 0.19,
    EUR: 0.17,
    GBP: 0.15,
    ARS: 195.50,
    CLP: 178.20,
    MXN: 3.35,
    COP: 780.00,
    PEN: 0.72,
    UYU: 7.55,
    PYG: 1475.00,
    BOB: 1.32,
    BRL: 1,
  };

  constructor(private prisma: PrismaService) {}

  // ── Exchange Rates CRUD ─────────────────────────────────────────────

  async getRates(orgId: string) {
    const orgRates = this.rateStore.get(orgId);
    if (!orgRates) return [];
    return Array.from(orgRates.values());
  }

  async addRate(orgId: string, dto: CreateExchangeRateDto) {
    if (dto.fromCurrency === dto.toCurrency) {
      throw new BadRequestException('fromCurrency e toCurrency não podem ser iguais');
    }
    if (dto.rate <= 0) {
      throw new BadRequestException('A taxa de câmbio deve ser maior que zero');
    }

    if (!this.rateStore.has(orgId)) {
      this.rateStore.set(orgId, new Map());
    }
    const orgRates = this.rateStore.get(orgId)!;
    const key = `${dto.fromCurrency}-${dto.toCurrency}`;

    const stored: StoredRate = {
      fromCurrency: dto.fromCurrency,
      toCurrency: dto.toCurrency,
      rate: dto.rate,
      source: dto.source || 'manual',
      updatedAt: new Date(),
    };
    orgRates.set(key, stored);

    this.logger.log(`Rate updated for org ${orgId}: ${key} = ${dto.rate}`);
    return stored;
  }

  // ── Conversion ──────────────────────────────────────────────────────

  async convert(orgId: string, dto: ConvertDto) {
    if (dto.fromCurrency === dto.toCurrency) {
      return {
        originalAmount: dto.amount,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        convertedAmount: dto.amount,
        rate: 1,
        source: 'same-currency',
      };
    }

    const rate = this.findRate(orgId, dto.fromCurrency, dto.toCurrency);
    if (!rate) {
      throw new NotFoundException(
        `Taxa de câmbio não encontrada para ${dto.fromCurrency} -> ${dto.toCurrency}. Execute sync primeiro.`,
      );
    }

    const convertedAmount = Number((dto.amount * rate.rate).toFixed(2));

    return {
      originalAmount: dto.amount,
      fromCurrency: dto.fromCurrency,
      toCurrency: dto.toCurrency,
      convertedAmount,
      rate: rate.rate,
      source: rate.source,
      updatedAt: rate.updatedAt,
    };
  }

  // ── Sync ────────────────────────────────────────────────────────────

  async syncRates(orgId: string) {
    this.logger.log(`Syncing exchange rates for org ${orgId}`);

    let syncedCount = 0;
    const errors: string[] = [];

    for (const currency of this.supportedCurrencies) {
      if (currency.code === SupportedCurrency.BRL) continue; // BRL is the base

      try {
        const rate = await this.fetchRateFromApi(SupportedCurrency.BRL, currency.code);
        await this.addRate(orgId, {
          fromCurrency: SupportedCurrency.BRL,
          toCurrency: currency.code,
          rate,
          source: 'open-er-api',
        });

        // Also store the inverse rate
        const inverseRate = Number((1 / rate).toFixed(6));
        await this.addRate(orgId, {
          fromCurrency: currency.code,
          toCurrency: SupportedCurrency.BRL,
          rate: inverseRate,
          source: 'open-er-api-inverse',
        });

        syncedCount += 2;
      } catch (err) {
        this.logger.warn(`Failed to fetch rate for ${currency.code}, using fallback`);
        const fallbackRate = this.defaultRates[currency.code] || 1;
        await this.addRate(orgId, {
          fromCurrency: SupportedCurrency.BRL,
          toCurrency: currency.code,
          rate: fallbackRate,
          source: 'fallback',
        });
        const inverseRate = Number((1 / fallbackRate).toFixed(6));
        await this.addRate(orgId, {
          fromCurrency: currency.code,
          toCurrency: SupportedCurrency.BRL,
          rate: inverseRate,
          source: 'fallback-inverse',
        });
        syncedCount += 2;
        errors.push(`${currency.code}: using fallback rate`);
      }
    }

    // Generate cross-rates between non-BRL currencies
    await this.generateCrossRates(orgId);

    return {
      success: true,
      syncedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? `${syncedCount} taxas sincronizadas (algumas usaram fallback)`
        : `${syncedCount} taxas sincronizadas com sucesso`,
    };
  }

  // ── Supported Currencies ────────────────────────────────────────────

  async getSupportedCurrencies() {
    return this.supportedCurrencies;
  }

  // ── Private Helpers ─────────────────────────────────────────────────

  private findRate(orgId: string, fromCurrency: string, toCurrency: string): StoredRate | null {
    const orgRates = this.rateStore.get(orgId);
    if (!orgRates) return null;

    const directKey = `${fromCurrency}-${toCurrency}`;
    const direct = orgRates.get(directKey);
    if (direct) return direct;

    // Try via BRL as intermediary
    if (fromCurrency !== 'BRL' && toCurrency !== 'BRL') {
      const fromToBrl = orgRates.get(`${fromCurrency}-BRL`);
      const brlToTo = orgRates.get(`BRL-${toCurrency}`);
      if (fromToBrl && brlToTo) {
        return {
          fromCurrency,
          toCurrency,
          rate: Number((fromToBrl.rate * brlToTo.rate).toFixed(6)),
          source: 'cross-rate-via-BRL',
          updatedAt: new Date(),
        };
      }
    }

    return null;
  }

  private async fetchRateFromApi(base: string, target: string): Promise<number> {
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      if (data.rates && data.rates[target] !== undefined) {
        return data.rates[target];
      }
      throw new Error(`Rate for ${target} not found in API response`);
    } catch (err) {
      this.logger.warn(`Error fetching rate ${base}->${target}: ${err.message}`);
      throw err;
    }
  }

  private async generateCrossRates(orgId: string) {
    const orgRates = this.rateStore.get(orgId);
    if (!orgRates) return;

    const currencies = this.supportedCurrencies.map((c) => c.code);

    for (const from of currencies) {
      for (const to of currencies) {
        if (from === to) continue;
        const key = `${from}-${to}`;
        if (!orgRates.has(key)) {
          const rate = this.findRate(orgId, from, to);
          if (rate) {
            orgRates.set(key, rate);
          }
        }
      }
    }
  }
}
