import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkspaceDto, InviteMemberDto } from '../../common/dto';
import { sanitizeSlug, generateToken, paginate } from '../../common/utils';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug = sanitizeSlug(dto.slug || dto.name);

    // Check slug uniqueness
    const existing = await this.prisma.workspace.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Workspace slug already taken');

    // Create or find org
    let org = await this.prisma.organization.findFirst({ where: { name: dto.organizationName } });
    if (!org) {
      org = await this.prisma.organization.create({ data: { name: dto.organizationName } });
    }

    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        organizationId: org.id,
        members: { create: { userId, role: Role.OWNER } },
      },
      include: { members: true },
    });
  }

  async getUserWorkspaces(userId: string) {
    const members = await this.prisma.member.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            organization: true,
            _count: { select: { links: true, members: true, domains: true } },
          },
        },
      },
    });
    return members.map((m) => ({ ...m.workspace, role: m.role }));
  }

  async getById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        organization: true,
        _count: { select: { links: true, members: true, domains: true } },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async getMembers(workspaceId: string) {
    return this.prisma.member.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async inviteMember(workspaceId: string, dto: InviteMemberDto) {
    // Check if already a member
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      const existingMember = await this.prisma.member.findUnique({
        where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
      });
      if (existingMember) throw new ConflictException('User is already a member');
    }

    const token = generateToken();
    const role = (dto.role as Role) || Role.MANAGER;

    return this.prisma.invite.create({
      data: {
        email: dto.email,
        role,
        token,
        workspaceId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.status !== 'PENDING') throw new NotFoundException('Invalid invitation');
    if (new Date(invite.expiresAt) < new Date()) throw new ForbiddenException('Invitation expired');

    await this.prisma.$transaction([
      this.prisma.member.create({
        data: { userId, workspaceId: invite.workspaceId, role: invite.role },
      }),
      this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return { message: 'Invitation accepted' };
  }

  async removeMember(workspaceId: string, memberId: string) {
    return this.prisma.member.delete({ where: { id: memberId } });
  }

  async updateMemberRole(workspaceId: string, memberId: string, role: Role) {
    return this.prisma.member.update({
      where: { id: memberId },
      data: { role },
    });
  }
}
