import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto, UpdateWebhookDto } from '../../common/dto';
import { CurrentWorkspace } from '../../common/param-decorators';
import { WorkspaceGuard } from '../../common/guards';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(WorkspaceGuard)
@Controller('api/v1/workspaces/:workspaceId/webhooks')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Create a webhook' })
  create(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateWebhookDto) {
    return this.webhookService.create(workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List webhooks' })
  findAll(@CurrentWorkspace() workspaceId: string) {
    return this.webhookService.findAll(workspaceId);
  }

  @Patch(':webhookId')
  @ApiOperation({ summary: 'Update a webhook' })
  update(@CurrentWorkspace() workspaceId: string, @Param('webhookId') webhookId: string, @Body() dto: UpdateWebhookDto) {
    return this.webhookService.update(workspaceId, webhookId, dto);
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Delete a webhook' })
  delete(@CurrentWorkspace() workspaceId: string, @Param('webhookId') webhookId: string) {
    return this.webhookService.delete(workspaceId, webhookId);
  }

  @Get(':webhookId/logs')
  @ApiOperation({ summary: 'Get webhook delivery logs' })
  getLogs(@CurrentWorkspace() workspaceId: string, @Param('webhookId') webhookId: string) {
    return this.webhookService.getLogs(workspaceId, webhookId);
  }
}
