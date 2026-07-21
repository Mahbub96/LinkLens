import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * WorkspaceGuard – Ensures the authenticated user is a member of the target workspace.
 * Sets request.workspaceId for downstream use.
 * Workspace ID is extracted from route params or x-workspace-id header.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const workspaceId = request.params?.workspaceId || request.headers['x-workspace-id'];

    if (!userId) throw new ForbiddenException('Authentication required');
    if (!workspaceId) throw new ForbiddenException('Workspace ID required');

    const member = await this.prisma.member.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    request.workspaceId = workspaceId;
    request.memberRole = member.role;
    return true;
  }
}
