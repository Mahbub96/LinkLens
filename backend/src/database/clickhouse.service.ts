import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private client: ClickHouseClient;
  private readonly logger = new Logger(ClickHouseService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      url: this.config.get<string>('CLICKHOUSE_URL', 'http://localhost:8123'),
      database: this.config.get<string>('CLICKHOUSE_DB', 'linklens'),
    });
    this.logger.log('ClickHouse client initialized');
  }

  /** Insert a batch of click events. */
  async insertClickEvents(events: Record<string, any>[]): Promise<void> {
    if (events.length === 0) return;
    await this.client.insert({
      table: 'click_events',
      values: events,
      format: 'JSONEachRow',
    });
  }

  /** Run a SELECT query and return rows. */
  async query<T = Record<string, any>>(sql: string, params?: Record<string, any>): Promise<T[]> {
    const result = await this.client.query({
      query: sql,
      query_params: params,
      format: 'JSONEachRow',
    });
    return result.json<T>();
  }

  /** Get aggregated analytics for a link. */
  async getLinkAnalytics(linkId: string, workspaceId: string, days = 30) {
    const sql = `
      SELECT
        toDate(timestamp) AS date,
        count() AS clicks,
        uniq(ip_address) AS unique_visitors,
        countIf(is_bot = 1) AS bot_clicks
      FROM click_events
      WHERE link_id = {linkId:UUID}
        AND workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY date
      ORDER BY date
    `;
    return this.query(sql, { linkId, workspaceId, days });
  }

  /** Get top countries for a workspace. */
  async getTopCountries(workspaceId: string, days = 30, limit = 10) {
    const sql = `
      SELECT country, count() AS clicks
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
        AND country != ''
      GROUP BY country
      ORDER BY clicks DESC
      LIMIT {limit:UInt32}
    `;
    return this.query(sql, { workspaceId, days, limit });
  }

  /** Get device/browser/OS breakdown. */
  async getDeviceBreakdown(workspaceId: string, field: string, days = 30) {
    const allowedFields = ['device', 'browser', 'os'];
    if (!allowedFields.includes(field)) throw new Error(`Invalid field: ${field}`);
    const sql = `
      SELECT ${field} AS name, count() AS clicks
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY ${field}
      ORDER BY clicks DESC
      LIMIT 10
    `;
    return this.query(sql, { workspaceId, days });
  }

  /** Get referrer breakdown. */
  async getReferrerBreakdown(workspaceId: string, days = 30) {
    const sql = `
      SELECT referrer, count() AS clicks
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
        AND referrer != ''
      GROUP BY referrer
      ORDER BY clicks DESC
      LIMIT 10
    `;
    return this.query(sql, { workspaceId, days });
  }

  /** Get overall dashboard stats. */
  async getDashboardStats(workspaceId: string, days = 30) {
    const sql = `
      SELECT
        count() AS total_clicks,
        uniq(ip_address) AS unique_visitors,
        countIf(toDate(timestamp) = today()) AS today_clicks,
        countIf(is_bot = 1) AS bot_clicks,
        countIf(is_vpn = 1) AS vpn_clicks
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
    `;
    const rows = await this.query(sql, { workspaceId, days });
    return rows[0] || { total_clicks: 0, unique_visitors: 0, today_clicks: 0, bot_clicks: 0, vpn_clicks: 0 };
  }

  /** Get recent click events (for live feed). */
  async getRecentEvents(workspaceId: string, limit = 50) {
    const sql = `
      SELECT *
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32}
    `;
    return this.query(sql, { workspaceId, limit });
  }

  /** Get UTM breakdown. */
  async getUtmBreakdown(workspaceId: string, field: string, days = 30) {
    const allowedFields = ['utm_source', 'utm_medium', 'utm_campaign'];
    if (!allowedFields.includes(field)) throw new Error(`Invalid UTM field: ${field}`);
    const sql = `
      SELECT ${field} AS name, count() AS clicks
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
        AND ${field} != ''
      GROUP BY ${field}
      ORDER BY clicks DESC
      LIMIT 10
    `;
    return this.query(sql, { workspaceId, days });
  }

  /** Timeseries for a specific link (hourly). */
  async getLinkTimeseries(linkId: string, workspaceId: string, hours = 24) {
    const sql = `
      SELECT
        toStartOfHour(timestamp) AS hour,
        count() AS clicks,
        uniq(ip_address) AS unique_visitors
      FROM click_events
      WHERE link_id = {linkId:UUID}
        AND workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {hours:UInt32} HOUR
      GROUP BY hour
      ORDER BY hour
    `;
    return this.query(sql, { linkId, workspaceId, hours });
  }

  /** Get traffic quality stats. */
  async getTrafficQuality(workspaceId: string, days = 30) {
    const sql = `
      SELECT
        avg(traffic_score) AS avg_score,
        countIf(is_bot = 1) AS bot_count,
        countIf(is_vpn = 1) AS vpn_count,
        countIf(is_tor = 1) AS tor_count,
        countIf(is_proxy = 1) AS proxy_count,
        count() AS total
      FROM click_events
      WHERE workspace_id = {workspaceId:UUID}
        AND timestamp >= now() - INTERVAL {days:UInt32} DAY
    `;
    const rows = await this.query(sql, { workspaceId, days });
    return rows[0];
  }
}
