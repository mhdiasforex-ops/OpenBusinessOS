import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigGeneratorService } from './config-generator.service';
import { NICHE_TEMPLATES } from './templates';

vi.mock('./templates', () => ({
  NICHE_TEMPLATES: {
    RETAIL: {
      name: 'Varejo',
      categories: ['Vendas', 'Compras', 'Estoque', 'Despesas Fixas', 'Impostos'],
      defaultProducts: [{ name: 'Produto A', unit: 'un', category: 'Vendas' }],
      defaultWorkflows: [
        {
          name: 'Alerta de estoque baixo',
          trigger: 'STOCK_LOW',
          steps: [{ order: 1, type: 'SEND_EMAIL', config: { subject: 'Estoque baixo', to: 'owner' } }],
        },
      ],
      tips: ['Cadastre seus produtos com custo e preço de venda'],
    },
    SERVICES: {
      name: 'Serviços',
      categories: ['Serviços Prestados', 'Materiais', 'Despesas Fixas', 'Impostos'],
      defaultProducts: [{ name: 'Serviço A', unit: 'h', category: 'Serviços Prestados' }],
      defaultWorkflows: [],
      tips: ['Configure horas trabalhadas como unidade de medida'],
    },
    OTHER: {
      name: 'Outro',
      categories: ['Receitas', 'Despesas', 'Impostos'],
      defaultProducts: [],
      defaultWorkflows: [],
      tips: ['Personalize as categorias financeiras nas configurações'],
    },
  },
}));

describe('ConfigGeneratorService', () => {
  let service: ConfigGeneratorService;

  beforeEach(() => {
    service = new ConfigGeneratorService();
  });

  describe('getConfig', () => {
    it('should return config for known niche RETAIL', () => {
      const result = service.getConfig('RETAIL');
      expect(result).toEqual(NICHE_TEMPLATES.RETAIL);
      expect(result.name).toBe('Varejo');
    });

    it('should return config for known niche SERVICES', () => {
      const result = service.getConfig('SERVICES');
      expect(result).toEqual(NICHE_TEMPLATES.SERVICES);
      expect(result.name).toBe('Serviços');
    });

    it('should fall back to OTHER for unknown niche', () => {
      const result = service.getConfig('UNKNOWN_NICHE');
      expect(result).toEqual(NICHE_TEMPLATES.OTHER);
      expect(result.name).toBe('Outro');
    });

    it('should fall back to OTHER for empty string', () => {
      const result = service.getConfig('');
      expect(result).toEqual(NICHE_TEMPLATES.OTHER);
    });

    it('should fall back to OTHER for undefined-like input', () => {
      const result = service.getConfig('undefined');
      expect(result).toEqual(NICHE_TEMPLATES.OTHER);
    });

    it('should return the same object reference for the same niche', () => {
      const first = service.getConfig('RETAIL');
      const second = service.getConfig('RETAIL');
      expect(first).toBe(second);
    });
  });

  describe('generateCategories', () => {
    it('should return categories for known niche', () => {
      const result = service.generateCategories('RETAIL');
      expect(result).toEqual(['Vendas', 'Compras', 'Estoque', 'Despesas Fixas', 'Impostos']);
    });

    it('should return fallback categories for unknown niche', () => {
      const result = service.generateCategories('UNKNOWN');
      expect(result).toEqual(['Receitas', 'Despesas', 'Impostos']);
    });

    it('should delegate to getConfig', () => {
      const spy = vi.spyOn(service, 'getConfig');
      service.generateCategories('SERVICES');
      expect(spy).toHaveBeenCalledWith('SERVICES');
    });
  });

  describe('generateProducts', () => {
    it('should return products for known niche', () => {
      const result = service.generateProducts('RETAIL');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Produto A');
    });

    it('should return empty products for niche with no defaults', () => {
      const result = service.generateProducts('UNKNOWN');
      expect(result).toEqual([]);
    });

    it('should delegate to getConfig', () => {
      const spy = vi.spyOn(service, 'getConfig');
      service.generateProducts('RETAIL');
      expect(spy).toHaveBeenCalledWith('RETAIL');
    });
  });

  describe('generateWorkflows', () => {
    it('should return workflows for known niche', () => {
      const result = service.generateWorkflows('RETAIL');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alerta de estoque baixo');
    });

    it('should return empty workflows for niche with no defaults', () => {
      const result = service.generateWorkflows('UNKNOWN');
      expect(result).toEqual([]);
    });

    it('should delegate to getConfig', () => {
      const spy = vi.spyOn(service, 'getConfig');
      service.generateWorkflows('RETAIL');
      expect(spy).toHaveBeenCalledWith('RETAIL');
    });
  });

  describe('getTips', () => {
    it('should return tips for known niche', () => {
      const result = service.getTips('RETAIL');
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Cadastre');
    });

    it('should return fallback tips for unknown niche', () => {
      const result = service.getTips('UNKNOWN');
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Personalize');
    });

    it('should delegate to getConfig', () => {
      const spy = vi.spyOn(service, 'getConfig');
      service.getTips('RETAIL');
      expect(spy).toHaveBeenCalledWith('RETAIL');
    });
  });
});
