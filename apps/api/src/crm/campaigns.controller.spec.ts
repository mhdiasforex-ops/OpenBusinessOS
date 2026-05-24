import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignsController } from './campaigns.controller';
import { CreateCampaignDto } from './crm.dto';

describe('CampaignsController', () => {
  let controller: CampaignsController;
  let crmService: any;

  beforeEach(() => {
    crmService = {
      createCampaign: vi.fn().mockResolvedValue({ id: 'camp-1', name: 'Test Campaign' }),
    };

    controller = new CampaignsController(crmService);
  });

  describe('createCampaign', () => {
    it('should call crmService.createCampaign with organizationId and dto', async () => {
      const req = { user: { organizationId: 'org-123' } };
      const dto: CreateCampaignDto = {
        name: 'Black Friday',
        channel: 'EMAIL',
        segment: 'ALL',
        recipientCount: 500,
        message: '50% off!',
      };

      const result = await controller.createCampaign(req, dto);

      expect(crmService.createCampaign).toHaveBeenCalledWith('org-123', dto);
      expect(result).toEqual({ id: 'camp-1', name: 'Test Campaign' });
    });

    it('should work with minimal dto (required fields only)', async () => {
      const req = { user: { organizationId: 'org-456' } };
      const dto: CreateCampaignDto = {
        name: 'Flash Sale',
        channel: 'WHATSAPP',
      };

      const result = await controller.createCampaign(req, dto);

      expect(crmService.createCampaign).toHaveBeenCalledWith('org-456', dto);
      expect(result).toBeDefined();
    });
  });

  describe('getCampaigns', () => {
    it('should return empty data with MVP message', async () => {
      const req = { user: { organizationId: 'org-123' } };

      const result = await controller.getCampaigns(req);

      expect(result).toEqual({
        data: [],
        total: 0,
        message: 'Campanhas armazenadas como eventos (MVP)',
      });
    });
  });
});
