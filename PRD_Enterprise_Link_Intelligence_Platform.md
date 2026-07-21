# Product Requirement Document (PRD): Enterprise Link Intelligence Platform

**Document Status:** Final / Draft  
**Version:** 2.0-ENT  
**Author:** Software Architecture Team  
**Date:** July 2026  

---

## 1. Executive Summary & Vision

### 1.1 Vision Statement
The **Enterprise Link Intelligence Platform** is a next-generation, high-performance SaaS ecosystem designed to replace legacy URL shorteners with a modular, enterprise-grade data suite. It unifies high-speed dynamic link routing, real-time forensic traffic analytics, automated white-label domain provisioning, campaign lifecycle management, dynamic QR generation, and developer API pipelines into a single high-scale architecture.

### 1.2 Core Philosophy: Zero-Cost Self-Hosted Architecture
Unlike consumer platforms that bill users based on data retention, monthly click volumes, or third-party API lookups, this platform is architected natively for self-hosted efficiency. By coupling high-speed memory lookup systems (**Redis**) with offline binary intelligence datasets (**MaxMind / DB-IP**), dynamic edge SSL automation (**Caddy On-Demand TLS**), and high-density columnar analytics (**ClickHouse**), the system delivers sub-millisecond dynamic routing and unlimited forensic analysis at absolute zero recurring external API cost.

---

## 2. System Architecture & High-Level Flow

### 2.1 The Two-Path Architectural Paradigm
To handle millions of requests while avoiding transactional database bottlenecks, the platform cleanly segregates concerns into two execution pipelines:

1. **The Hot Path (Redirect & Routing Engine):** Optimized strictly for ultra-low latency (<5ms). Every incoming click request bypasses relational database layer lookups by utilizing in-memory Redis cluster key-value evaluations.
2. **The Cold/Analytic Path (Ingestion & Forensics):** Operates completely asynchronously. Click events are written to high-speed Redis job queues (BullMQ) and ingested into ClickHouse via batch streaming workers, preventing analytical writes from delaying user HTTP redirects.

```
                                  +-------------------+
                                  |  Incoming Click   |
                                  +---------+---------+
                                            |
                                            v
                                 +---------------------+
                                 | Caddy Reverse Proxy |
                                 |  (On-Demand TLS)    |
                                 +----------+----------+
                                            |
                                            v
                                 +---------------------+
                                 |  NestJS Redirect    |
                                 |     Service         |
                                 +----------+----------+
                                            |
                  +-------------------------+-------------------------+
                  |                                                   |
                  v (Fast Lookup <2ms)                                v (Async Event Event)
       +--------------------+                               +-------------------+
       |   Redis Cluster    |                               |   BullMQ Queue    |
       |  (Link Rules, Sets |                               +---------+---------+
       |   & MaxMind MMDB)  |                                         |
       +---------+----------+                                         v
                 |                                          +-------------------+
                 v                                          |   Worker Pool     |
       +--------------------+                               +---------+---------+
       |  301 / 302 / HTML  |                                         |
       | Dynamic Redirect   |                                         v
       +--------------------+                               +-------------------+
                                                            |    ClickHouse     |
                                                            | (Analytics Store) |
                                                            +-------------------+
```

---

## 3. Detailed Functional Modules & Requirements

### Module 1: Workspace & Multi-Tenancy (RBAC)
* **Organizations & Workspaces:** Logical boundary isolation. Workspaces contain projects, links, custom domains, and campaign configurations.
* **Role-Based Access Control (RBAC):** Native support for granular roles:
  * `Owner`: Full access including billing, workspace deletion, and member roles.
  * `Admin`: Can manage workspace domains, API keys, and team invites.
  * `Manager`: Can configure links, campaigns, and smart rules.
  * `Analyst`: Read-only access to ClickHouse dashboards, exportable reports, and real-time streams.
* **Member Invites:** Token-based email invitation flow with time-bound expiration.

### Module 2: Smart Links & Dynamic Routing Engine
* **Basic & Expiry Controls:** Time-bound link activation/expiration, maximum click caps, password protection, and one-time destination links.
* **Dynamic Rule Builder (If/Then Execution Engine):**
  * **Geo-Routing:** Route by country, region, or city using local `.mmdb` binary reads.
  * **Device & OS:** Route specifically for iOS, Android, macOS, Windows, Linux, or specific mobile models.
  * **Language & Browser:** Header evaluation for `Accept-Language` and user-agent string matches.
  * **Security Status Routing:** Route traffic identified as Tor, VPN, or datacenter proxies to specific honeypots or challenge pages.
  * **A/B Testing & Weighted Splitting:** Distribute traffic dynamically across multiple destination URLs based on target percentage weightings.

### Module 3: Client-Side Fingerprinting & Anti-Evasion
* **Active Security Gateway:** For links flagged with *Advanced Threat Telemetry*, the engine serves a zero-dependency, sub-100ms HTML loading page prior to destination forwarding.
* **Browser API Telemetry Harvesting:**
  * **Timezone Verification:** Compares client `Intl.DateTimeFormat().resolvedOptions().timeZone` with the IP's physical location to detect spoofed connections.
  * **Hardware Signature:** Captures `navigator.hardwareConcurrency`, `navigator.deviceMemory`, and screen resolution metrics.
  * **Canvas Fingerprinting:** Executes silent background WebGL/Canvas rendering calculations to produce an immutable client hash for bot classification.

### Module 4: Real-Time Forensic Analytics Engine
* **Real-time Live Stream:** Sub-second UI updates via WebSockets connected directly to the ingestion bus.
* **Forensic Click Logs:**
  * Complete IP mapping, reverse DNS, ISP, and Autonomous System Number (ASN) details.
  * Traffic quality scoring: Automatic detection and tagging of scraping bots, headless browsers, and datacenter traffic.
  * Referrer analysis and full UTM parameter breakdown (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`).

### Module 5: Dynamic QR Code Platform
* **Vector Output Engine:** On-the-fly rendering in SVG, PNG, and PDF formats.
* **Customization:** Dynamic logo uploads, custom color palettes, corner radius controls, and finder pattern customization.
* **Dynamic Destination:** Modifying the destination URL of a printed QR code without changing the physical vector graphic.

### Module 6: Automation & Webhook Infrastructure
* **Threshold Alerts:** User-defined triggers (e.g., *Alert via Slack if link hits 10,000 clicks within 1 hour* or *Alert on >15% VPN traffic spike*).
* **Outgoing Webhooks:** Real-time event streaming payload delivered via signed HTTP POST requests (`X-Signature-256`) to user-configured endpoints.

### Module 7: Developer API & Ecosystem
* **REST API:** Complete OpenAPI 3.0 / Swagger spec covering all CRUD operations.
* **API Key Management:** Hash-stored token authentication, custom scope permissions, and automated key rotation mechanisms.
* **Rate Limiting Engine:** Dual-layer rate limiting backed by Redis token bucket algorithms (differentiating between management API calls and public dynamic redirects).

### Module 8: White-Label Custom Domains (On-Demand TLS)
* **Automated SSL Provisioning:** Integration with Caddy Server's On-Demand TLS feature.
* **Verification Webhook:** Caddy queries the backend (`/api/v1/domains/validate`) upon first request; if verified in PostgreSQL, an SSL certificate is automatically issued via Let's Encrypt / ZeroSSL without server restart.

---

## 4. Technical Stack & Architecture

| Component | Selected Technology | Technical Justification |
| :--- | :--- | :--- |
| **Backend Core** | NestJS (TypeScript) | Modular architecture, strict typing, native microservice support. |
| **Relational Database** | PostgreSQL 16 | Handles application state, users, RBAC, workspaces, and domains. |
| **ORM** | Prisma | Schema-first declarative modeling with safe migrations. |
| **In-Memory Cache** | Redis Cluster | Ultra-fast routing lookup (<1ms), active rate-limiting, job queue backing. |
| **Task Queue** | BullMQ | Asynchronous job processing, batching, and scheduled worker runs. |
| **Analytical Database** | ClickHouse | Columnar time-series store; fast aggregations over billions of rows. |
| **Edge Proxy** | Caddy Server | Native On-Demand TLS for dynamic user domain SSL management. |
| **Frontend Framework** | Next.js 14 (App Router) | Server-side rendering, fast dashboard UI, static layout optimization. |
| **Styling Engine** | Tailwind CSS / shadcn/ui | Modern, responsive dark-mode high-density SaaS dashboard visual design. |
| **Offline IP Engine** | MaxMind GeoLite2 / DB-IP | Local `.mmdb` binary file execution in memory; $0 runtime cost. |

---

## 5. Database Schema & Data Models

### 5.1 PostgreSQL Schema (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  OWNER
  ADMIN
  MANAGER
  ANALYST
}

model Organization {
  id         String      @id @default(uuid())
  name       String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  workspaces Workspace[]
}

model Workspace {
  id             String       @id @default(uuid())
  name           String
  slug           String       @unique
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  members        Member[]
  links          Link[]
  domains        Domain[]
  apiKeys        ApiKey[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  members   Member[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Member {
  id          String    @id @default(uuid())
  role        Role      @default(MANAGER)
  userId      String
  workspaceId String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
}

model Domain {
  id          String    @id @default(uuid())
  hostname    String    @unique
  isVerified  Boolean   @default(false)
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Link {
  id             String      @id @default(uuid())
  slug           String
  destinationUrl String
  workspaceId    String
  workspace      Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  domainHost     String      @default("default")
  isEnabled      Boolean     @default(true)
  isProtected    Boolean     @default(false)
  password       String?
  expiresAt      DateTime?
  maxClicks      Int?
  rules          MatchRule[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@unique([domainHost, slug])
}

model MatchRule {
  id             String   @id @default(uuid())
  linkId         String
  link           Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
  priority       Int      @default(0)
  conditionType  String   // GEO, DEVICE, BROWSER, TOR, PROXY, TIME
  conditionValue String   // JSON string containing criteria
  targetUrl      String
  createdAt      DateTime @default(now())
}

model ApiKey {
  id          String    @id @default(uuid())
  name        String
  keyHash     String    @unique
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
}
```

### 5.2 ClickHouse Columnar Schema (Event Streaming)

```sql
CREATE TABLE IF NOT EXISTS click_events (
    event_id UUID,
    link_id UUID,
    workspace_id UUID,
    timestamp DateTime64(3, 'UTC'),
    
    -- Network Telemetry
    ip_address String,
    country LowCardinality(String),
    city String,
    asn UInt32,
    isp String,
    is_vpn UInt8,
    is_tor UInt8,
    is_proxy UInt8,
    
    -- Hardware & Client
    user_agent String,
    device LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    screen_resolution LowCardinality(String),
    hardware_signature String,
    timezone_mismatch UInt8,
    
    -- Attribution & Context
    referrer String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    
    -- Quality Score
    traffic_score UInt8,
    is_bot UInt8
) ENGINE = MergeTree()
ORDER BY (workspace_id, link_id, toYYYYMM(timestamp), timestamp)
TTL timestamp + INTERVAL 365 DAY;
```

---

## 6. Implementation Roadmap

```
[Phase 1: Foundation] ──> [Phase 2: Scale & Rules] ──> [Phase 3: Deep Forensics] ──> [Phase 4: Hardening]
```

### Phase 1: Core Foundation (Weeks 1–4)
* Implement PostgreSQL multi-tenant schema via Prisma.
* Build the core NestJS HTTP engine and Redis caching system.
* Set up standard link creation, dynamic slug generation, and $O(1)$ fast redirects.
* Configure Caddy Server reverse proxy with local Docker setup.

### Phase 2: Scale, Rules & Edge SSL (Weeks 5–8)
* Build Caddy On-Demand TLS domain validation webhook integration.
* Implement the dynamic MatchRule engine (Geo, Device, OS parsing).
* Integrate MaxMind `.mmdb` reader microservice loading datasets directly into memory.
* Set up dynamic vector QR code generator module.

### Phase 3: ClickHouse Streaming & Deep Forensics (Weeks 9–12)
* Deploy ClickHouse instance and establish schema.
* Build asynchronous BullMQ worker batch pipeline for zero-loss ingestion.
* Implement client-side active fingerprinting script (canvas, hardware, timezone check).
* Build full real-time forensic analytics dashboard in Next.js 14.

### Phase 4: Enterprise Hardening & Observability (Weeks 13–16)
* Build OpenTelemetry instrumentation across all services.
* Expose Grafana system health metrics dashboard (Redis latencies, ClickHouse write rates, Caddy P99 response times).
* Conduct complete security audit, token rotation implementation, and stress testing under load (>50,000 requests/sec).

---

## 7. Security, Compliance & Observability

### 7.1 Security Architecture
* **Zero Trust Multi-Tenancy:** Hardened Prisma client extension ensuring every database read/write query explicitly includes a validated `workspace_id`.
* **API Security:** All outgoing webhooks signed with HMAC SHA-256 keys. API keys stored strictly as SHA-256 hashes.
* **Data Anonymization Options:** Native workspace config toggle for GDPR compliance: IP address truncations (`192.168.x.x`) prior to ClickHouse persistence.

### 7.2 Observability Metrics
* **P99 Redirect Latency Goal:** $< 5	ext{ms}$.
* **Queue Ingestion Retention:** Max 0 dropped event records during burst scenarios up to 100,000 clicks/minute.
* **Health Endpoint:** Exposed internal endpoint (`/healthz`) auditing Redis cluster connectivity, PostgreSQL pool states, and ClickHouse ingestion queue backpressure.
