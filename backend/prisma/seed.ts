import { PrismaClient, Role, InviteStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { createClient } from '@clickhouse/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
const CLICKHOUSE_DB = process.env.CLICKHOUSE_DB || 'linklens';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  console.log('🌱 Starting LinkLens comprehensive database seeding...');

  // ─── 1. Clean existing PostgreSQL data ───
  console.log('🧹 Cleaning existing PostgreSQL records...');
  await prisma.webhookLog.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.matchRule.deleteMany();
  await prisma.link.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.organization.deleteMany();

  // ─── 2. Organizations ───
  console.log('🏢 Creating Organizations...');
  const orgAcme = await prisma.organization.create({
    data: {
      name: 'Acme Enterprise Global',
    },
  });

  const orgNexus = await prisma.organization.create({
    data: {
      name: 'Nexus Cyber Intelligence',
    },
  });

  // ─── 3. Workspaces ───
  console.log('📁 Creating Workspaces...');
  const wsAcmeMain = await prisma.workspace.create({
    data: {
      name: 'Acme Main Hub',
      slug: 'acme-main',
      organizationId: orgAcme.id,
      anonymizeIps: false,
    },
  });

  const wsAcmePrivacy = await prisma.workspace.create({
    data: {
      name: 'Acme Privacy Shield',
      slug: 'acme-privacy',
      organizationId: orgAcme.id,
      anonymizeIps: true,
    },
  });

  const wsNexusLab = await prisma.workspace.create({
    data: {
      name: 'Nexus Security Lab',
      slug: 'nexus-lab',
      organizationId: orgNexus.id,
      anonymizeIps: false,
    },
  });

  // ─── 4. Users (covering all user types & features) ───
  console.log('👤 Creating Users (Owner, Admin, Manager, Analyst, 2FA, Unverified)...');
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const userOwner = await prisma.user.create({
    data: {
      email: 'owner@acme.com',
      password: defaultPasswordHash,
      name: 'Alex Owner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      emailVerified: true,
    },
  });

  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: defaultPasswordHash,
      name: 'Sarah Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      emailVerified: true,
    },
  });

  const userManager = await prisma.user.create({
    data: {
      email: 'manager@acme.com',
      password: defaultPasswordHash,
      name: 'Mike Manager',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      emailVerified: true,
    },
  });

  const userAnalyst = await prisma.user.create({
    data: {
      email: 'analyst@acme.com',
      password: defaultPasswordHash,
      name: 'Anna Analyst',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
      emailVerified: true,
    },
  });

  const userMultiRole = await prisma.user.create({
    data: {
      email: 'multi@acme.com',
      password: defaultPasswordHash,
      name: 'David Multi-Role',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      emailVerified: true,
    },
  });

  const userNexusSec = await prisma.user.create({
    data: {
      email: 'security@nexus.com',
      password: defaultPasswordHash,
      name: 'Elena Security',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      emailVerified: true,
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
    },
  });

  const userUnverified = await prisma.user.create({
    data: {
      email: 'unverified@nexus.com',
      password: defaultPasswordHash,
      name: 'Chris Unverified',
      emailVerified: false,
    },
  });

  // ─── 5. Workspace Members (Every Role: OWNER, ADMIN, MANAGER, ANALYST) ───
  console.log('🔑 Assigning Workspace Members with all Role types...');
  await prisma.member.createMany({
    data: [
      // Acme Main Hub Members
      { userId: userOwner.id, workspaceId: wsAcmeMain.id, role: Role.OWNER },
      { userId: userAdmin.id, workspaceId: wsAcmeMain.id, role: Role.ADMIN },
      { userId: userManager.id, workspaceId: wsAcmeMain.id, role: Role.MANAGER },
      { userId: userAnalyst.id, workspaceId: wsAcmeMain.id, role: Role.ANALYST },
      { userId: userMultiRole.id, workspaceId: wsAcmeMain.id, role: Role.ADMIN },

      // Acme Privacy Shield Members
      { userId: userOwner.id, workspaceId: wsAcmePrivacy.id, role: Role.OWNER },
      { userId: userMultiRole.id, workspaceId: wsAcmePrivacy.id, role: Role.MANAGER },

      // Nexus Security Lab Members
      { userId: userNexusSec.id, workspaceId: wsNexusLab.id, role: Role.OWNER },
      { userId: userUnverified.id, workspaceId: wsNexusLab.id, role: Role.ANALYST },
    ],
  });

  // ─── 6. Workspace Invites (Every InviteStatus: PENDING, ACCEPTED, EXPIRED) ───
  console.log('✉️ Creating Invites with all InviteStatus types...');
  const now = new Date();
  const futureExpiration = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const pastExpiration = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  await prisma.invite.createMany({
    data: [
      {
        email: 'pending.dev@acme.com',
        role: Role.MANAGER,
        token: 'token-pending-invitation-001',
        status: InviteStatus.PENDING,
        workspaceId: wsAcmeMain.id,
        expiresAt: futureExpiration,
      },
      {
        email: 'accepted.designer@acme.com',
        role: Role.ADMIN,
        token: 'token-accepted-invitation-002',
        status: InviteStatus.ACCEPTED,
        workspaceId: wsAcmeMain.id,
        expiresAt: futureExpiration,
      },
      {
        email: 'expired.contractor@acme.com',
        role: Role.ANALYST,
        token: 'token-expired-invitation-003',
        status: InviteStatus.EXPIRED,
        workspaceId: wsAcmePrivacy.id,
        expiresAt: pastExpiration,
      },
      {
        email: 'co-owner@nexuslabs.io',
        role: Role.OWNER,
        token: 'token-pending-invitation-004',
        status: InviteStatus.PENDING,
        workspaceId: wsNexusLab.id,
        expiresAt: futureExpiration,
      },
    ],
  });

  // ─── 7. Custom Domains ───
  console.log('🌐 Creating Custom Domains (Verified and Unverified)...');
  const domainAcmeVerified = await prisma.domain.create({
    data: {
      hostname: 'links.acme.com',
      isVerified: true,
      workspaceId: wsAcmeMain.id,
    },
  });

  const domainAcmeUnverified = await prisma.domain.create({
    data: {
      hostname: 'go.acme.org',
      isVerified: false,
      workspaceId: wsAcmeMain.id,
    },
  });

  const domainNexusVerified = await prisma.domain.create({
    data: {
      hostname: 'track.nexuslabs.io',
      isVerified: true,
      workspaceId: wsNexusLab.id,
    },
  });

  // ─── 8. Campaigns ───
  console.log('🎯 Creating Marketing & Security Campaigns...');
  const campaignSummer = await prisma.campaign.create({
    data: {
      name: 'Summer Marketing Blitz 2026',
      description: 'Global multi-channel product promotion campaign',
      tags: ['marketing', 'summer', 'v2-launch'],
      color: '#6366f1',
      workspaceId: wsAcmeMain.id,
      startDate: new Date('2026-06-01T00:00:00Z'),
      endDate: new Date('2026-08-31T23:59:59Z'),
    },
  });

  const campaignBlackFriday = await prisma.campaign.create({
    data: {
      name: 'Black Friday Deals 2026',
      description: 'High-conversion e-commerce flash discount links',
      tags: ['ecommerce', 'black-friday', 'sale'],
      color: '#ef4444',
      workspaceId: wsAcmeMain.id,
      startDate: new Date('2026-11-20T00:00:00Z'),
      endDate: new Date('2026-11-30T23:59:59Z'),
    },
  });

  const campaignNexusHoneypot = await prisma.campaign.create({
    data: {
      name: 'Cyber Threat Intelligence Honeypot',
      description: 'Bot & VPN forensic tracking for vulnerability research',
      tags: ['security', 'honeypot', 'anti-evasion'],
      color: '#10b981',
      workspaceId: wsNexusLab.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
    },
  });

  // ─── 9. Links ───
  console.log('🔗 Creating Links with dynamic attributes...');
  const linkGoogle = await prisma.link.create({
    data: {
      slug: 'google',
      destinationUrl: 'https://google.com',
      title: 'Google Search Portal',
      workspaceId: wsAcmeMain.id,
      domainHost: 'default',
      isEnabled: true,
      totalClicks: 1420,
    },
  });

  const linkSummerPromo = await prisma.link.create({
    data: {
      slug: 'summer-promo',
      destinationUrl: 'https://acme.com/promo',
      title: 'Summer 2026 Special Offer',
      workspaceId: wsAcmeMain.id,
      domainHost: 'default',
      campaignId: campaignSummer.id,
      isEnabled: true,
      totalClicks: 890,
    },
  });

  const linkVaultProtected = await prisma.link.create({
    data: {
      slug: 'vault',
      destinationUrl: 'https://acme.com/internal-docs',
      title: 'Confidential Executive Brief',
      workspaceId: wsAcmeMain.id,
      domainHost: 'default',
      isProtected: true,
      password: await bcrypt.hash('AcmeSecret2026!', 10),
      isEnabled: true,
      totalClicks: 45,
    },
  });

  const linkAcmeCustomDomain = await prisma.link.create({
    data: {
      slug: 'deal',
      destinationUrl: 'https://acme.com/special-deal',
      title: 'Custom Domain Flash Deal',
      workspaceId: wsAcmeMain.id,
      domainHost: domainAcmeVerified.hostname,
      campaignId: campaignBlackFriday.id,
      isEnabled: true,
      totalClicks: 320,
    },
  });

  const linkExpiredContest = await prisma.link.create({
    data: {
      slug: 'old-contest',
      destinationUrl: 'https://acme.com/contest-closed',
      title: '2025 Closed Giveaway',
      workspaceId: wsAcmeMain.id,
      domainHost: 'default',
      expiresAt: pastExpiration,
      isEnabled: true,
      totalClicks: 512,
    },
  });

  const linkLimitedClicks = await prisma.link.create({
    data: {
      slug: 'limited-100',
      destinationUrl: 'https://acme.com/limited-offer',
      title: 'First 100 Claims Only',
      workspaceId: wsAcmeMain.id,
      domainHost: 'default',
      maxClicks: 100,
      totalClicks: 84,
      isEnabled: true,
    },
  });

  const linkArchivedPrivacy = await prisma.link.create({
    data: {
      slug: 'deprecated-api',
      destinationUrl: 'https://acme.com/v1-docs',
      title: 'Deprecated API V1 Documentation',
      workspaceId: wsAcmePrivacy.id,
      domainHost: 'default',
      isEnabled: false,
      isArchived: true,
      totalClicks: 12,
    },
  });

  const linkNexusTrap = await prisma.link.create({
    data: {
      slug: 'trap-gate',
      destinationUrl: 'https://nexuslabs.io/honeypot',
      title: 'Security Gateway Audit Point',
      workspaceId: wsNexusLab.id,
      domainHost: domainNexusVerified.hostname,
      campaignId: campaignNexusHoneypot.id,
      isEnabled: true,
      totalClicks: 640,
    },
  });

  // ─── 10. MatchRules (Every conditionType) ───
  console.log('🔀 Creating MatchRules covering ALL condition types (GEO, DEVICE, BROWSER, OS, LANGUAGE, TOR, VPN, PROXY, TIME, AB_TEST)...');
  await prisma.matchRule.createMany({
    data: [
      {
        linkId: linkGoogle.id,
        priority: 1,
        conditionType: 'GEO',
        conditionValue: JSON.stringify({ countries: ['US', 'CA', 'GB'] }),
        targetUrl: 'https://google.com/ncr',
      },
      {
        linkId: linkGoogle.id,
        priority: 2,
        conditionType: 'DEVICE',
        conditionValue: JSON.stringify({ devices: ['mobile', 'tablet'] }),
        targetUrl: 'https://m.google.com',
      },
      {
        linkId: linkSummerPromo.id,
        priority: 1,
        conditionType: 'BROWSER',
        conditionValue: JSON.stringify({ browsers: ['Safari', 'Chrome'] }),
        targetUrl: 'https://acme.com/mobile-app-store',
      },
      {
        linkId: linkSummerPromo.id,
        priority: 2,
        conditionType: 'OS',
        conditionValue: JSON.stringify({ os: ['iOS', 'Android'] }),
        targetUrl: 'https://acme.com/download-app',
      },
      {
        linkId: linkSummerPromo.id,
        priority: 3,
        conditionType: 'AB_TEST',
        conditionValue: JSON.stringify({ weights: { urlA: 70, urlB: 30 }, targetB: 'https://acme.com/promo-variant-b' }),
        targetUrl: 'https://acme.com/promo-variant-a',
      },
      {
        linkId: linkAcmeCustomDomain.id,
        priority: 1,
        conditionType: 'LANGUAGE',
        conditionValue: JSON.stringify({ languages: ['es', 'fr', 'de'] }),
        targetUrl: 'https://acme.com/es/deal',
      },
      {
        linkId: linkVaultProtected.id,
        priority: 1,
        conditionType: 'TIME',
        conditionValue: JSON.stringify({ start: '09:00', end: '17:00', timezone: 'UTC' }),
        targetUrl: 'https://acme.com/office-hours-vault',
      },
      {
        linkId: linkNexusTrap.id,
        priority: 1,
        conditionType: 'TOR',
        conditionValue: JSON.stringify({ block: true }),
        targetUrl: 'https://nexuslabs.io/blocked-tor',
      },
      {
        linkId: linkNexusTrap.id,
        priority: 2,
        conditionType: 'VPN',
        conditionValue: JSON.stringify({ block: true }),
        targetUrl: 'https://nexuslabs.io/blocked-vpn',
      },
      {
        linkId: linkNexusTrap.id,
        priority: 3,
        conditionType: 'PROXY',
        conditionValue: JSON.stringify({ block: true }),
        targetUrl: 'https://nexuslabs.io/blocked-proxy',
      },
    ],
  });

  // ─── 11. QrCodes (Every format & errorLevel) ───
  console.log('📱 Creating QrCodes covering all formats (svg, png, pdf) and error levels (L, M, Q, H)...');
  await prisma.qrCode.createMany({
    data: [
      {
        linkId: linkGoogle.id,
        format: 'svg',
        errorLevel: 'L',
        fgColor: '#000000',
        bgColor: '#ffffff',
        cornerRadius: 0,
      },
      {
        linkId: linkSummerPromo.id,
        format: 'png',
        errorLevel: 'M',
        fgColor: '#6366f1',
        bgColor: '#f8fafc',
        cornerRadius: 8,
        logoUrl: 'https://acme.com/brand-logo.png',
      },
      {
        linkId: linkAcmeCustomDomain.id,
        format: 'pdf',
        errorLevel: 'Q',
        fgColor: '#ef4444',
        bgColor: '#ffffff',
        cornerRadius: 12,
      },
      {
        linkId: linkNexusTrap.id,
        format: 'svg',
        errorLevel: 'H',
        fgColor: '#10b981',
        bgColor: '#0f172a',
        cornerRadius: 16,
      },
    ],
  });

  // ─── 12. ApiKeys ───
  console.log('🔑 Creating ApiKeys...');
  const key1Secret = 'lk_live_acme_super_secret_key_12345';
  const key1Hash = crypto.createHash('sha256').update(key1Secret).digest('hex');

  const key2Secret = 'lk_read_acme_analytics_key_67890';
  const key2Hash = crypto.createHash('sha256').update(key2Secret).digest('hex');

  const key3Secret = 'lk_nex_threat_intel_key_99999';
  const key3Hash = crypto.createHash('sha256').update(key3Secret).digest('hex');

  await prisma.apiKey.createMany({
    data: [
      {
        name: 'Acme Production Full Access Key',
        keyHash: key1Hash,
        keyPrefix: 'lk_live_',
        scopes: ['read', 'write', 'admin'],
        workspaceId: wsAcmeMain.id,
        lastUsedAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
      {
        name: 'Acme Read-Only Analytics Ingest',
        keyHash: key2Hash,
        keyPrefix: 'lk_read_',
        scopes: ['read'],
        workspaceId: wsAcmeMain.id,
        lastUsedAt: new Date(now.getTime() - 24 * 3600 * 1000),
      },
      {
        name: 'Nexus Security Automation Key',
        keyHash: key3Hash,
        keyPrefix: 'lk_nex_',
        scopes: ['read', 'write'],
        workspaceId: wsNexusLab.id,
        lastUsedAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    ],
  });

  // ─── 13. Webhooks & WebhookLogs ───
  console.log('⚡ Creating Webhooks and WebhookLogs...');
  const webhookAcme = await prisma.webhook.create({
    data: {
      url: 'https://api.acme.com/v1/webhooks/linklens',
      events: ['link.click', 'link.created', 'link.disabled'],
      secret: 'whsec_acme_hmac_secret_key_007',
      isActive: true,
      workspaceId: wsAcmeMain.id,
    },
  });

  const webhookNexus = await prisma.webhook.create({
    data: {
      url: 'https://security.nexuslabs.io/api/events',
      events: ['link.click', 'campaign.finished'],
      secret: 'whsec_nexus_hmac_secret_key_999',
      isActive: false,
      workspaceId: wsNexusLab.id,
    },
  });

  await prisma.webhookLog.createMany({
    data: [
      {
        webhookId: webhookAcme.id,
        event: 'link.click',
        payload: JSON.stringify({ event: 'link.click', linkId: linkGoogle.id, ip: '198.51.100.1' }),
        statusCode: 200,
        response: JSON.stringify({ status: 'success', processedAt: new Date() }),
        success: true,
      },
      {
        webhookId: webhookAcme.id,
        event: 'link.created',
        payload: JSON.stringify({ event: 'link.created', linkId: linkSummerPromo.id }),
        statusCode: 500,
        response: JSON.stringify({ error: 'Acme endpoint internal error' }),
        success: false,
      },
      {
        webhookId: webhookNexus.id,
        event: 'campaign.finished',
        payload: JSON.stringify({ event: 'campaign.finished', campaignId: campaignNexusHoneypot.id }),
        statusCode: 204,
        response: 'No Content',
        success: true,
      },
    ],
  });

  // ─── 14. ClickHouse Analytics Telemetry ───
  console.log('📊 Seeding ClickHouse click_events telemetry...');
  try {
    const chClient = createClient({
      url: CLICKHOUSE_URL,
    });

    // Ensure Database and Table exist in ClickHouse
    await chClient.command({ query: `CREATE DATABASE IF NOT EXISTS ${CLICKHOUSE_DB}` });
    await chClient.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${CLICKHOUSE_DB}.click_events (
            event_id UUID,
            link_id UUID,
            workspace_id UUID,
            timestamp DateTime64(3, 'UTC'),
            ip_address String,
            country LowCardinality(String),
            region String,
            city String,
            asn UInt32,
            isp String,
            is_vpn UInt8,
            is_tor UInt8,
            is_proxy UInt8,
            user_agent String,
            device LowCardinality(String),
            browser LowCardinality(String),
            browser_version String,
            os LowCardinality(String),
            screen_resolution LowCardinality(String),
            hardware_concurrency UInt8,
            device_memory Float32,
            hardware_signature String,
            timezone String,
            timezone_mismatch UInt8,
            referrer String,
            utm_source String,
            utm_medium String,
            utm_campaign String,
            utm_term String,
            utm_content String,
            traffic_score UInt8,
            is_bot UInt8
        ) ENGINE = MergeTree()
        ORDER BY (workspace_id, link_id, toYYYYMM(timestamp), timestamp)
        TTL toDate(timestamp) + INTERVAL 365 DAY;
      `,
    });

    const chDbClient = createClient({
      url: CLICKHOUSE_URL,
      database: CLICKHOUSE_DB,
    });

    const clickEvents: any[] = [];
    const sampleCountries = [
      { code: 'US', region: 'California', city: 'San Francisco', asn: 15169, isp: 'Google LLC' },
      { code: 'US', region: 'New York', city: 'New York', asn: 7018, isp: 'AT&T Services Services' },
      { code: 'GB', region: 'England', city: 'London', asn: 5607, isp: 'Sky UK' },
      { code: 'DE', region: 'Bavaria', city: 'Munich', asn: 6805, isp: 'Telefonica Germany' },
      { code: 'FR', region: 'Ile-de-France', city: 'Paris', asn: 12322, isp: 'Free SAS' },
      { code: 'JP', region: 'Tokyo', city: 'Tokyo', asn: 2514, isp: 'NTT Communications' },
      { code: 'CA', region: 'Ontario', city: 'Toronto', asn: 577, isp: 'BAHN-1' },
      { code: 'AU', region: 'New South Wales', city: 'Sydney', asn: 1221, isp: 'Telstra' },
      { code: 'BR', region: 'Sao Paulo', city: 'Sao Paulo', asn: 28573, isp: 'Claro Brasil' },
      { code: 'IN', region: 'Maharashtra', city: 'Mumbai', asn: 55836, isp: 'Reliance Jio' },
    ];

    const sampleUserAgents = [
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', browser: 'Chrome', ver: '126.0', os: 'macOS', dev: 'desktop' },
      { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', browser: 'Safari', ver: '17.5', os: 'iOS', dev: 'mobile' },
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0', browser: 'Edge', ver: '125.0', os: 'Windows', dev: 'desktop' },
      { ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36', browser: 'Chrome', ver: '126.0', os: 'Android', dev: 'mobile' },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', browser: 'Safari', ver: '17.4', os: 'macOS', dev: 'desktop' },
    ];

    const sampleReferrers = ['https://twitter.com', 'https://linkedin.com', 'https://google.com', 'https://reddit.com', 'direct'];
    const sampleUtmSources = ['twitter', 'linkedin', 'newsletter', 'google_cpc', 'partner'];
    const sampleUtmMediums = ['social', 'email', 'cpc', 'referral'];

    const linksToSeed = [
      { id: linkGoogle.id, workspaceId: wsAcmeMain.id, count: 120 },
      { id: linkSummerPromo.id, workspaceId: wsAcmeMain.id, count: 90 },
      { id: linkAcmeCustomDomain.id, workspaceId: wsAcmeMain.id, count: 50 },
      { id: linkNexusTrap.id, workspaceId: wsNexusLab.id, count: 70 },
    ];

    for (const item of linksToSeed) {
      for (let i = 0; i < item.count; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minsAgo = Math.floor(Math.random() * 60);
        const timestamp = new Date(now.getTime() - (daysAgo * 24 * 3600 + hoursAgo * 3600 + minsAgo * 60) * 1000);

        const geo = sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
        const ua = sampleUserAgents[Math.floor(Math.random() * sampleUserAgents.length)];
        const isBot = Math.random() < 0.1 ? 1 : 0;
        const isVpn = Math.random() < 0.15 ? 1 : 0;
        const isTor = Math.random() < 0.05 ? 1 : 0;
        const isProxy = Math.random() < 0.08 ? 1 : 0;

        const ipLastOctet = Math.floor(Math.random() * 250) + 1;
        const ipAddress = `198.51.${Math.floor(Math.random() * 100)}.${ipLastOctet}`;

        clickEvents.push({
          event_id: crypto.randomUUID(),
          link_id: item.id,
          workspace_id: item.workspaceId,
          timestamp: timestamp.toISOString().replace('T', ' ').replace('Z', ''),
          ip_address: ipAddress,
          country: geo.code,
          region: geo.region,
          city: geo.city,
          asn: geo.asn,
          isp: geo.isp,
          is_vpn: isVpn,
          is_tor: isTor,
          is_proxy: isProxy,
          user_agent: ua.ua,
          device: ua.dev,
          browser: ua.browser,
          browser_version: ua.ver,
          os: ua.os,
          screen_resolution: ua.dev === 'mobile' ? '390x844' : '1920x1080',
          hardware_concurrency: Math.random() < 0.5 ? 8 : 16,
          device_memory: 16.0,
          hardware_signature: crypto.createHash('md5').update(ipAddress + ua.ua).digest('hex'),
          timezone: geo.code === 'US' ? 'America/New_York' : 'Europe/London',
          timezone_mismatch: 0,
          referrer: sampleReferrers[Math.floor(Math.random() * sampleReferrers.length)],
          utm_source: sampleUtmSources[Math.floor(Math.random() * sampleUtmSources.length)],
          utm_medium: sampleUtmMediums[Math.floor(Math.random() * sampleUtmMediums.length)],
          utm_campaign: 'summer-growth-2026',
          utm_term: 'link-management',
          utm_content: 'banner_top',
          traffic_score: isBot ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 25) + 75,
          is_bot: isBot,
        });
      }
    }

    await chDbClient.insert({
      table: 'click_events',
      values: clickEvents,
      format: 'JSONEachRow',
    });
    console.log(`✅ Inserted ${clickEvents.length} click_events into ClickHouse!`);
  } catch (err: any) {
    console.warn('⚠️ ClickHouse seeding warning:', err.message);
  }

  // ─── 15. Redis Link Cache Warmup ───
  console.log('⚡ Warming up Redis link routing caches...');
  try {
    const redis = new Redis(REDIS_URL);
    await redis.set(
      `link:default:google`,
      JSON.stringify({
        id: linkGoogle.id,
        slug: linkGoogle.slug,
        destinationUrl: linkGoogle.destinationUrl,
        domainHost: linkGoogle.domainHost,
        isEnabled: true,
        rules: [
          { priority: 1, conditionType: 'GEO', conditionValue: JSON.stringify({ countries: ['US', 'CA', 'GB'] }), targetUrl: 'https://google.com/ncr' },
        ],
      }),
      'EX',
      3600
    );

    await redis.set(
      `link:links.acme.com:deal`,
      JSON.stringify({
        id: linkAcmeCustomDomain.id,
        slug: linkAcmeCustomDomain.slug,
        destinationUrl: linkAcmeCustomDomain.destinationUrl,
        domainHost: domainAcmeVerified.hostname,
        isEnabled: true,
        rules: [],
      }),
      'EX',
      3600
    );

    await redis.quit();
    console.log('✅ Redis link cache warmed up successfully!');
  } catch (err: any) {
    console.warn('⚠️ Redis cache warmup warning:', err.message);
  }

  console.log('✨ Seed complete! All tables and enum variants populated with rich sample data.');
  console.log('\n🔐 Test Accounts (Password for all: Password123!):');
  console.log('  - OWNER:      owner@acme.com');
  console.log('  - ADMIN:      admin@acme.com');
  console.log('  - MANAGER:    manager@acme.com');
  console.log('  - ANALYST:    analyst@acme.com');
  console.log('  - MULTI-ROLE: multi@acme.com');
  console.log('  - 2FA USER:   security@nexus.com');
  console.log('  - UNVERIFIED: unverified@nexus.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
