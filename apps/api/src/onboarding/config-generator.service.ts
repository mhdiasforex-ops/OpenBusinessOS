import { Injectable, Logger } from '@nestjs/common';
import { NICHE_TEMPLATES } from './templates';

@Injectable()
export class ConfigGeneratorService {
  private readonly logger = new Logger(ConfigGeneratorService.name);

  /**
   * Returns the full configuration object for a given niche.
   * Falls back to OTHER if the niche is not found.
   */
  getConfig(niche: string) {
    const config = NICHE_TEMPLATES[niche] || NICHE_TEMPLATES.OTHER;
    this.logger.debug(`getConfig("${niche}") => ${config.name}`);
    return config;
  }

  /**
   * Returns the financial categories for a given niche.
   */
  generateCategories(niche: string): string[] {
    const config = this.getConfig(niche);
    this.logger.debug(`generateCategories("${niche}") => ${config.categories.length} categories`);
    return config.categories;
  }

  /**
   * Returns the default products for a given niche.
   */
  generateProducts(niche: string): any[] {
    const config = this.getConfig(niche);
    this.logger.debug(`generateProducts("${niche}") => ${config.defaultProducts.length} products`);
    return config.defaultProducts;
  }

  /**
   * Returns the default workflows for a given niche.
   */
  generateWorkflows(niche: string): any[] {
    const config = this.getConfig(niche);
    this.logger.debug(`generateWorkflows("${niche}") => ${config.defaultWorkflows.length} workflows`);
    return config.defaultWorkflows;
  }

  /**
   * Returns the tips for a given niche.
   */
  getTips(niche: string): string[] {
    const config = this.getConfig(niche);
    this.logger.debug(`getTips("${niche}") => ${config.tips.length} tips`);
    return config.tips;
  }
}
