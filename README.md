<div align="center">

  <h1>👁️ LinkLens</h1>
  <h3>Enterprise Link Intelligence Platform & Smart Redirect Engine</h3>

  <p><b>Privacy-First • Sub-5ms Hot-Path Redirects • ClickHouse Forensic Telemetry • Self-Hosted $0 API Overhead</b></p>

  <p>
    <a href="#-quick-start"><strong>Explore the Docs »</strong></a>
    <br />
    <br />
    <a href="http://localhost:3000">View Demo</a>
    ·
    <a href="http://localhost:4000/api/docs">API Specs (Swagger)</a>
    ·
    <a href="https://github.com/Mahbub96/LinkLens/issues">Report Bug</a>
  </p>

  <br />

  <p align="center">
    <img src="https://img.shields.io/badge/NestJS-10.4-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Prisma-5.20-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/ClickHouse-24.8-FFCC00?style=for-the-badge&logo=clickhouse&logoColor=black" alt="ClickHouse" />
    <img src="https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
  </p>

</div>

---

## 💡 Why LinkLens?

Traditional URL shorteners rely on slow transactional relational databases and third-party geolocation APIs that cost thousands per month at high scale. 

**LinkLens** is a next-generation SaaS engine engineered natively for **self-hosted efficiency**:

- ⚡ **Sub-5ms Hot-Path Routing:** Resolves dynamic link rules straight from in-memory **Redis** key-value caches without querying PostgreSQL.
- 📊 **Cold-Path Forensic Analytics:** Click telemetry is written asynchronously to **BullMQ** job queues and stream-inserted into **ClickHouse** columnar storage.
- 🛡️ **Zero-Cost Geo & Device Parsing:** Evaluates local MaxMind `.mmdb` binary datasets in RAM — **$0 recurring external lookup costs**.
- 🔒 **Dynamic Edge SSL (On-Demand TLS):** Automatically issues Let's Encrypt / ZeroSSL TLS certificates via **Caddy Server** webhooks when custom user domains are configured.
- 🕵️‍♂️ **Anti-Evasion & Security Gateway:** Serving optional sub-100ms client-side fingerprinting pages to audit Timezone Mismatches, Hardware Concurrency, and Canvas Hashes to block bot scrapers & proxies.

---

## 🏗️ Architecture & Execution Pipeline

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
                                  |     Engine          |
                                  +----------+----------+
                                            |
                  +-------------------------+-------------------------+
                  |                                                   |
                  v (Hot Path: Fast Lookup <2ms)                      v (Cold Path: Async Event)
       +--------------------+                               +-------------------+
       |   Redis Cluster    |                               |   BullMQ Queue    |
       |  (Link Rules, Sets |                               +---------+---------+
       |   & Rule Engine)   |                                         |
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

## ✨ Features at a Glance

| Category | Capability | Description |
| :--- | :--- | :--- |
| **Routing Engine** | **Smart Dynamic Rules** | Target traffic by Country, OS (iOS/Android/macOS/Win), Browser, Language, or A/B Percentage Weights |
| **Analytics** | **Forensic Dashboards** | Columnar click aggregations, real-time WebSocket live activity feed, UTM parameter attribution |
| **Security** | **Bot & VPN Shield** | Automated detection of headless browsers, scrapers, Tor nodes, and VPN datacenter IPs |
| **Privacy** | **GDPR Mode** | Workspace toggle for instant IP address truncation (`192.168.1.x`) prior to ClickHouse persistence |
| **QR Codes** | **Vector QR Generator** | On-the-fly SVG, PNG, and PDF generation with logo overlays, custom colors, & corner radius styling |
| **Custom Domains** | **On-Demand TLS** | Automatic SSL certificate issuance via Caddy validation webhooks without server restarts |
| **Developer API** | **OpenAPI 3.0 & Webhooks** | Full REST API, SHA-256 hashed API keys with rotation, and HMAC SHA-256 signed webhooks |
| **RBAC** | **Zero-Trust Workspaces** | Workspace isolation with `OWNER`, `ADMIN`, `MANAGER`, and `ANALYST` granular roles |

---

## 🛠️ Tech Stack Matrix

- **Backend:** NestJS, TypeScript, Passport.js (JWT/OAuth), MaxMind GeoIP2, ua-parser-js, QRCode
- **Databases:** PostgreSQL 16 (Prisma ORM), Redis 7 (ioredis), ClickHouse 24 (`@clickhouse/client`)
- **Queue & Background Jobs:** BullMQ with concurrency workers
- **Edge Reverse Proxy:** Caddy 2 Server (On-Demand TLS)
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, TanStack Query, Zustand, Recharts, Lucide Icons

---

## 🚀 Quick Start

### Prerequisites
Make sure you have installed:
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 18+ & npm](https://nodejs.org/)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/Mahbub96/LinkLens.git
cd LinkLens
cp .env.example .env
```

### 2. Launch Infrastructure (Postgres, Redis, ClickHouse, Caddy)
```bash
docker-compose up -d
```
*Wait 10 seconds for databases to initialize.*

### 3. Spin up NestJS Backend Engine
```bash
cd backend
npm install
npm run prisma:push
npm run dev
```
> 🚀 Backend API running on `http://localhost:4000`  
> 📚 Swagger API Interactive Spec on `http://localhost:4000/api/docs`

### 4. Spin up Next.js Dashboard
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> 🌐 Web Dashboard running on `http://localhost:3000`

---

## 📊 Analytics & Telemetry Schema (ClickHouse)

ClickLens stores event telemetry in ClickHouse using an optimized columnar structure:

```sql
CREATE TABLE IF NOT EXISTS click_events (
    event_id UUID,
    link_id UUID,
    workspace_id UUID,
    timestamp DateTime64(3, 'UTC'),
    ip_address String,
    country LowCardinality(String),
    city String,
    device LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    traffic_score UInt8,
    is_bot UInt8
) ENGINE = MergeTree()
ORDER BY (workspace_id, link_id, toYYYYMM(timestamp), timestamp)
TTL timestamp + INTERVAL 365 DAY;
```

---

## 🔑 REST API Overview

All API endpoints are documented via Swagger OpenAPI 3.0:

```http
POST   /api/v1/auth/register                   # User Registration & Workspace Creation
POST   /api/v1/auth/login                      # Authentication & JWT Issuance
GET    /api/v1/workspaces/:wsId/links          # List Links with Search & Pagination
POST   /api/v1/workspaces/:wsId/links          # Create Smart Link with Dynamic Match Rules
GET    /api/v1/workspaces/:wsId/analytics/dashboard # ClickHouse Summary Stats
POST   /api/v1/workspaces/:wsId/qr             # Generate Vector QR Codes
POST   /api/v1/workspaces/:wsId/webhooks       # Configure Signed Event Webhooks
GET    /api/v1/domains/validate                # Caddy On-Demand TLS Validation Webhook
```

---

## 📂 Project Monorepo Structure

```
LinkLens/
├── backend/                  # NestJS Core Backend & Microservices
│   ├── prisma/               # Database Schema & Migrations
│   └── src/
│       ├── common/           # Shared Utils, DTOs, Guards, Exception Filters
│       ├── database/         # Prisma, Redis & ClickHouse Clients
│       ├── modules/          # Auth, Links, Redirect, Analytics, QR, Webhooks...
│       └── main.ts           # Main Application Bootstrap
├── frontend/                 # Next.js 14 Enterprise SaaS Dashboard
│   └── src/
│       ├── app/              # App Router Layouts, Dashboard & Pages
│       ├── components/       # UI Components & Recharts Wrappers
│       └── lib/              # API Client, Zustand Stores & Utilities
├── Caddyfile                 # Edge On-Demand TLS SSL Configuration
├── docker-compose.yml        # Docker Multi-Service Infrastructure
└── README.md
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

Developed with ❤️ by **[Mahbub Alam](https://github.com/Mahbub96)**.