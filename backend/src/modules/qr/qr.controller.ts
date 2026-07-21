import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QrService } from './qr.service';
import { CreateQrCodeDto } from '../../common/dto';
import { CurrentWorkspace } from '../../common/param-decorators';
import { WorkspaceGuard } from '../../common/guards';

@ApiTags('QR Codes')
@ApiBearerAuth()
@UseGuards(WorkspaceGuard)
@Controller('api/v1/workspaces/:workspaceId/qr')
export class QrController {
  constructor(private qrService: QrService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a QR code for a link' })
  generate(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateQrCodeDto) {
    return this.qrService.generate(workspaceId, dto);
  }

  @Get('link/:linkId')
  @ApiOperation({ summary: 'Get QR codes for a link' })
  findByLink(@CurrentWorkspace() workspaceId: string, @Param('linkId') linkId: string) {
    return this.qrService.findByLink(workspaceId, linkId);
  }

  @Delete(':qrId')
  @ApiOperation({ summary: 'Delete a QR code' })
  delete(@CurrentWorkspace() workspaceId: string, @Param('qrId') qrId: string) {
    return this.qrService.delete(workspaceId, qrId);
  }
}
