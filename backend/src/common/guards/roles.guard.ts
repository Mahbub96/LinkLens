import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const workspaceId = request.params?.workspaceId || request.headers['x-workspace-id'];

    if (!userId || !workspaceId) {
      throw new ForbiddenException('Missing user or workspace context');
    }

    const member = await this.prisma.member.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member || !requiredRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.workspaceId = workspaceId;
    request.memberRole = member.role;
    return true;
  }
}
