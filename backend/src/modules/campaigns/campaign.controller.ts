import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from '../../common/dto';
import { CurrentWorkspace } from '../../common/param-decorators';
import { WorkspaceGuard } from '../../common/guards';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(WorkspaceGuard)
@Controller('api/v1/workspaces/:workspaceId/campaigns')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Create a campaign' })
  create(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignService.create(workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  findAll(@CurrentWorkspace() workspaceId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.campaignService.findAll(workspaceId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':campaignId')
  @ApiOperation({ summary: 'Get campaign details' })
  findById(@CurrentWorkspace() workspaceId: string, @Param('campaignId') campaignId: string) {
    return this.campaignService.findById(workspaceId, campaignId);
  }

  @Patch(':campaignId')
  @ApiOperation({ summary: 'Update a campaign' })
  update(@CurrentWorkspace() workspaceId: string, @Param('campaignId') campaignId: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(workspaceId, campaignId, dto);
  }

  @Delete(':campaignId')
  @ApiOperation({ summary: 'Delete a campaign' })
  delete(@CurrentWorkspace() workspaceId: string, @Param('campaignId') campaignId: string) {
    return this.campaignService.delete(workspaceId, campaignId);
  }
}
