import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from '../../common/dto';
import { CurrentWorkspace } from '../../common/param-decorators';
import { WorkspaceGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(WorkspaceGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN)
@Controller('api/v1/workspaces/:workspaceId/api-keys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  create(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateApiKeyDto) {
    return this.apiKeyService.create(workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List API keys (prefix only)' })
  findAll(@CurrentWorkspace() workspaceId: string) {
    return this.apiKeyService.findAll(workspaceId);
  }

  @Delete(':keyId')
  @ApiOperation({ summary: 'Delete an API key' })
  delete(@CurrentWorkspace() workspaceId: string, @Param('keyId') keyId: string) {
    return this.apiKeyService.delete(workspaceId, keyId);
  }

  @Post(':keyId/rotate')
  @ApiOperation({ summary: 'Rotate an API key' })
  rotate(@CurrentWorkspace() workspaceId: string, @Param('keyId') keyId: string) {
    return this.apiKeyService.rotate(workspaceId, keyId);
  }
}
