import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../../database/clickhouse.service';

@Injectable()
export class AnalyticsService {
  constructor(private clickhouse: ClickHouseService) {}

  async getDashboardStats(workspaceId: string, days = 30) {
    return this.clickhouse.getDashboardStats(workspaceId, days);
  }

  async getTimeseries(workspaceId: string, days = 30) {
    const sql = `
      SELECT
        toDate(timestamp) AS date,
        count() AS clicks,
        uniq(ip_address) AS unique_visitors
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY date
      ORDER BY date
    `;
    return this.clickhouse.query(sql, { workspaceId, days });
  }

  async getLinkAnalytics(linkId: string, workspaceId: string, days = 30) {
    return this.clickhouse.getLinkAnalytics(linkId, workspaceId, days);
  }

  async getLinkTimeseries(linkId: string, workspaceId: string, hours = 24) {
    return this.clickhouse.getLinkTimeseries(linkId, workspaceId, hours);
  }

  async getTopCountries(workspaceId: string, days = 30) {
    return this.clickhouse.getTopCountries(workspaceId, days);
  }

  async getDeviceBreakdown(workspaceId: string, days = 30) {
    return this.clickhouse.getDeviceBreakdown(workspaceId, 'device', days);
  }

  async getBrowserBreakdown(workspaceId: string, days = 30) {
    return this.clickhouse.getDeviceBreakdown(workspaceId, 'browser', days);
  }

  async getOsBreakdown(workspaceId: string, days = 30) {
    return this.clickhouse.getDeviceBreakdown(workspaceId, 'os', days);
  }

  async getReferrerBreakdown(workspaceId: string, days = 30) {
    return this.clickhouse.getReferrerBreakdown(workspaceId, days);
  }

  async getUtmBreakdown(workspaceId: string, field: string, days = 30) {
    return this.clickhouse.getUtmBreakdown(workspaceId, field, days);
  }

  async getTrafficQuality(workspaceId: string, days = 30) {
    return this.clickhouse.getTrafficQuality(workspaceId, days);
  }

  async getRecentEvents(workspaceId: string, limit = 50) {
    return this.clickhouse.getRecentEvents(workspaceId, limit);
  }
}
