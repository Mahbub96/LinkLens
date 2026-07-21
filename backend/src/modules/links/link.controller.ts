import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LinkService } from './link.service';
import { CreateLinkDto, UpdateLinkDto, CreateMatchRuleDto } from '../../common/dto';
import { CurrentWorkspace } from '../../common/param-decorators';
import { WorkspaceGuard } from '../../common/guards';

@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(WorkspaceGuard)
@Controller('api/v1/workspaces/:workspaceId/links')
export class LinkController {
  constructor(private linkService: LinkService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new link' })
  create(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateLinkDto) {
    return this.linkService.create(workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all links in workspace' })
  findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.linkService.findAll(workspaceId, Number(page) || 1, Number(limit) || 20, search);
  }

  @Get(':linkId')
  @ApiOperation({ summary: 'Get link details' })
  findById(@CurrentWorkspace() workspaceId: string, @Param('linkId') linkId: string) {
    return this.linkService.findById(workspaceId, linkId);
  }

  @Patch(':linkId')
  @ApiOperation({ summary: 'Update a link' })
  update(
    @CurrentWorkspace() workspaceId: string,
    @Param('linkId') linkId: string,
    @Body() dto: UpdateLinkDto,
  ) {
    return this.linkService.update(workspaceId, linkId, dto);
  }

  @Delete(':linkId')
  @ApiOperation({ summary: 'Delete a link' })
  delete(@CurrentWorkspace() workspaceId: string, @Param('linkId') linkId: string) {
    return this.linkService.delete(workspaceId, linkId);
  }

  @Post(':linkId/duplicate')
  @ApiOperation({ summary: 'Duplicate a link' })
  duplicate(@CurrentWorkspace() workspaceId: string, @Param('linkId') linkId: string) {
    return this.linkService.duplicate(workspaceId, linkId);
  }

  @Post(':linkId/rules')
  @ApiOperation({ summary: 'Add a match rule to a link' })
  addRule(
    @CurrentWorkspace() workspaceId: string,
    @Param('linkId') linkId: string,
    @Body() dto: CreateMatchRuleDto,
  ) {
    return this.linkService.addRule(workspaceId, linkId, dto);
  }

  @Delete(':linkId/rules/:ruleId')
  @ApiOperation({ summary: 'Delete a match rule' })
  deleteRule(
    @CurrentWorkspace() workspaceId: string,
    @Param('linkId') linkId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.linkService.deleteRule(workspaceId, linkId, ruleId);
  }
}
