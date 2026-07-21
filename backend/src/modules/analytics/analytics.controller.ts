import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentWorkspace } from '../../common/param-decorators';
import { WorkspaceGuard } from '../../common/guards';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(WorkspaceGuard)
@Controller('api/v1/workspaces/:workspaceId/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  getDashboard(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getDashboardStats(workspaceId, Number(days) || 30);
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Get click timeseries data' })
  getTimeseries(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getTimeseries(workspaceId, Number(days) || 30);
  }

  @Get('links/:linkId')
  @ApiOperation({ summary: 'Get analytics for a specific link' })
  getLinkAnalytics(
    @CurrentWorkspace() workspaceId: string,
    @Param('linkId') linkId: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getLinkAnalytics(linkId, workspaceId, Number(days) || 30);
  }

  @Get('links/:linkId/timeseries')
  @ApiOperation({ summary: 'Get hourly timeseries for a link' })
  getLinkTimeseries(
    @CurrentWorkspace() workspaceId: string,
    @Param('linkId') linkId: string,
    @Query('hours') hours?: number,
  ) {
    return this.analyticsService.getLinkTimeseries(linkId, workspaceId, Number(hours) || 24);
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get top countries' })
  getCountries(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getTopCountries(workspaceId, Number(days) || 30);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get device breakdown' })
  getDevices(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getDeviceBreakdown(workspaceId, Number(days) || 30);
  }

  @Get('browsers')
  @ApiOperation({ summary: 'Get browser breakdown' })
  getBrowsers(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getBrowserBreakdown(workspaceId, Number(days) || 30);
  }

  @Get('os')
  @ApiOperation({ summary: 'Get OS breakdown' })
  getOs(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getOsBreakdown(workspaceId, Number(days) || 30);
  }

  @Get('referrers')
  @ApiOperation({ summary: 'Get referrer breakdown' })
  getReferrers(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getReferrerBreakdown(workspaceId, Number(days) || 30);
  }

  @Get('utm/:field')
  @ApiOperation({ summary: 'Get UTM parameter breakdown' })
  getUtm(
    @CurrentWorkspace() workspaceId: string,
    @Param('field') field: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getUtmBreakdown(workspaceId, field, Number(days) || 30);
  }

  @Get('traffic-quality')
  @ApiOperation({ summary: 'Get traffic quality stats' })
  getTrafficQuality(@CurrentWorkspace() workspaceId: string, @Query('days') days?: number) {
    return this.analyticsService.getTrafficQuality(workspaceId, Number(days) || 30);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get recent click events' })
  getLive(@CurrentWorkspace() workspaceId: string, @Query('limit') limit?: number) {
    return this.analyticsService.getRecentEvents(workspaceId, Number(limit) || 50);
  }
}
