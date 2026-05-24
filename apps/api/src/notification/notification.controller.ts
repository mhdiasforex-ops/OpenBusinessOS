import { Controller, Get, Patch, Delete, Query, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationFiltersDto } from './notification.dto';
import { Permissions } from '../common/guards/decorators';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @Permissions('notifications:read')
  list(@Req() req: any, @Query() filters: NotificationFiltersDto) {
    return this.service.list(req.user.organizationId, req.user.id, filters);
  }

  @Patch('read-all')
  @Permissions('notifications:manage')
  markAllAsRead(@Req() req: any) {
    return this.service.markAllAsRead(req.user.organizationId, req.user.id);
  }

  @Patch(':id')
  @Permissions('notifications:manage')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.service.markAsRead(id, req.user.organizationId);
  }

  @Delete(':id')
  @Permissions('notifications:manage')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user.organizationId);
  }
}
