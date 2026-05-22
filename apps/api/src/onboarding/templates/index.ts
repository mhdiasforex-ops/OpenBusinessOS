import { retailTemplate } from './retail';
import { ecommerceTemplate } from './ecommerce';
import { servicesTemplate } from './services';
import { foodTemplate } from './food';
import { professionalTemplate } from './professional';
import { constructionTemplate } from './construction';
import { healthTemplate } from './health';
import { educationTemplate } from './education';
import { otherTemplate } from './other';

// Re-export each niche template
export * from './retail';
export * from './ecommerce';
export * from './services';
export * from './food';
export * from './professional';
export * from './construction';
export * from './health';
export * from './education';
export * from './other';

// Aggregate all niche templates into a single map keyed by niche constant
export const NICHE_TEMPLATES: Record<string, any> = {
 RETAIL: retailTemplate.RETAIL,
 ECOMMERCE: ecommerceTemplate.ECOMMERCE,
 SERVICES: servicesTemplate.SERVICES,
 FOOD: foodTemplate.FOOD,
 PROFESSIONAL: professionalTemplate.PROFESSIONAL,
 CONSTRUCTION: constructionTemplate.CONSTRUCTION,
 HEALTH: healthTemplate.HEALTH,
 EDUCATION: educationTemplate.EDUCATION,
 OTHER: otherTemplate.OTHER,
};
