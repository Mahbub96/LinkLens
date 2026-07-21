import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto, InviteMemberDto } from '../../common/dto';
import { CurrentUser } from '../../common/param-decorators';
import { Roles, Public } from '../../common/decorators';
import { WorkspaceGuard, RolesGuard } from '../../common/guards';
import { Role } from '@prisma/client';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('api/v1/workspaces')
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  getUserWorkspaces(@CurrentUser('sub') userId: string) {
    return this.workspaceService.getUserWorkspaces(userId);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Get workspace details' })
  getById(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.getById(workspaceId);
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Get workspace members' })
  getMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.getMembers(workspaceId);
  }

  @Post(':workspaceId/invites')
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Invite a member to workspace' })
  inviteMember(@Param('workspaceId') workspaceId: string, @Body() dto: InviteMemberDto) {
    return this.workspaceService.inviteMember(workspaceId, dto);
  }

  @Public()
  @Post('invites/:token/accept')
  @ApiOperation({ summary: 'Accept a workspace invitation' })
  acceptInvite(@Param('token') token: string, @CurrentUser('sub') userId: string) {
    return this.workspaceService.acceptInvite(token, userId);
  }

  @Delete(':workspaceId/members/:memberId')
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Remove a member from workspace' })
  removeMember(@Param('workspaceId') workspaceId: string, @Param('memberId') memberId: string) {
    return this.workspaceService.removeMember(workspaceId, memberId);
  }

  @Patch(':workspaceId/members/:memberId/role')
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Update member role' })
  updateRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: Role,
  ) {
    return this.workspaceService.updateMemberRole(workspaceId, memberId, role);
  }
}
