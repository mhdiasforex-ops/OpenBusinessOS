import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { NotificationFiltersDto } from './notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // ──────────────────────────────────────────────
  // LIST (with filters + pagination)
  // ──────────────────────────────────────────────

  @Get()
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Listar notificações com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de notificações' })
  async list(@Request() req: any, @Query() filters: NotificationFiltersDto) {
    return this.notificationsService.list(
      req.user.organizationId,
      req.user.id,
      filters,
    );
  }

  // ──────────────────────────────────────────────
  // MARK ALL AS READ
  // ──────────────────────────────────────────────

  @Patch('read-all')
  @Permissions('notifications:manage')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Todas as notificações foram marcadas como lidas' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(
      req.user.organizationId,
      req.user.id,
    );
  }

  // ──────────────────────────────────────────────
  // MARK AS READ (single)
  // ──────────────────────────────────────────────

  @Patch(':id')
  @Permissions('notifications:manage')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiParam({ name: 'id', description: 'ID da notificação (cuid)' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(
      id,
      req.user.organizationId,
      req.user.id,
    );
  }

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────

  @Delete(':id')
  @Permissions('notifications:manage')
  @ApiOperation({ summary: 'Remover notificação' })
  @ApiParam({ name: 'id', description: 'ID da notificação (cuid)' })
  @ApiResponse({ status: 200, description: 'Notificação removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.remove(
      id,
      req.user.organizationId,
      req.user.id,
    );
  }
}
