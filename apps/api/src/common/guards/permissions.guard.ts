import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.permissions) {
      throw new ForbiddenException('Acesso negado');
    }

    const hasPermission = requiredPermissions.every((perm) =>
      this.hasPermission(user.permissions, perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Acesso negado: permissão insuficiente');
    }

    return true;
  }

  /**
   * Check if user has a specific permission.
   * "manage" implies "read" — if user has "resource:manage",
   * they also have "resource:read".
   */
  private hasPermission(userPermissions: string[], required: string): boolean {
    if (userPermissions.includes(required)) return true;

    // If required is "resource:read", check if user has "resource:manage"
    const [resource, action] = required.split(':');
    if (action === 'read' && userPermissions.includes(`${resource}:manage`)) {
      return true;
    }

    return false;
  }
}
