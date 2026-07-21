import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DomainService } from './domain.service';
import { CreateDomainDto } from '../../common/dto';
import { CurrentWorkspace } from '../../common/param-decorators';
import { WorkspaceGuard } from '../../common/guards';
import { Public } from '../../common/decorators';

@ApiTags('Domains')
@Controller()
export class DomainController {
  constructor(private domainService: DomainService) {}

  @ApiBearerAuth()
  @UseGuards(WorkspaceGuard)
  @Post('api/v1/workspaces/:workspaceId/domains')
  @ApiOperation({ summary: 'Add a custom domain' })
  create(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateDomainDto) {
    return this.domainService.create(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(WorkspaceGuard)
  @Get('api/v1/workspaces/:workspaceId/domains')
  @ApiOperation({ summary: 'List custom domains' })
  findAll(@CurrentWorkspace() workspaceId: string) {
    return this.domainService.findAll(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(WorkspaceGuard)
  @Post('api/v1/workspaces/:workspaceId/domains/:domainId/verify')
  @ApiOperation({ summary: 'Verify a custom domain' })
  verify(@CurrentWorkspace() workspaceId: string, @Param('domainId') domainId: string) {
    return this.domainService.verify(workspaceId, domainId);
  }

  @ApiBearerAuth()
  @UseGuards(WorkspaceGuard)
  @Delete('api/v1/workspaces/:workspaceId/domains/:domainId')
  @ApiOperation({ summary: 'Delete a custom domain' })
  delete(@CurrentWorkspace() workspaceId: string, @Param('domainId') domainId: string) {
    return this.domainService.delete(workspaceId, domainId);
  }

  /**
   * Caddy On-Demand TLS validation endpoint.
   * Caddy calls this to verify if a domain should get SSL.
   */
  @Public()
  @Get('api/v1/domains/validate')
  @ApiOperation({ summary: 'Caddy On-Demand TLS domain validation' })
  async caddyValidation(@Query('domain') domain: string, @Res() res: Response) {
    const isValid = await this.domainService.validateForCaddy(domain);
    return res.status(isValid ? HttpStatus.OK : HttpStatus.NOT_FOUND).send();
  }
}
