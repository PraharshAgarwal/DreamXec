# DreamXec Production & Load Balancer Architecture Handbook

This document specifies the production infrastructure, load balancer configuration, database connection pooling strategy, and edge acceleration setup for the DreamXec platform.

---

## 🏛️ 1. High-Level Production Architecture

```mermaid
flowchart TD
    Users([Global Users / Students / Donors])
    Cloudflare[Cloudflare CDN & Edge WAF]
    FrontendS3[AWS S3 + CloudFront<br/>React SPA Static Dist]
    ALB[AWS Application Load Balancer<br/>or Render Ingress]
    
    subgraph ComputeCluster ["Backend Multi-Instance Cluster"]
        Instance1[Node.js API Instance 1<br/>Express + Prisma]
        Instance2[Node.js API Instance 2<br/>Express + Prisma]
        InstanceN[Node.js API Instance N<br/>Express + Prisma]
    end

    subgraph CacheAndLocks ["Cache & Lock Layer"]
        Redis[(Upstash / AWS ElastiCache Redis<br/>Rate Limiting, OTPs, Cron Locks)]
    end

    subgraph DataLayer ["Database & Storage Layer"]
        Supavisor[Supabase Supavisor / PgBouncer<br/>Port 6543 - Transaction Pool]
        Postgres[(Supabase PostgreSQL 15+<br/>14 Domain Multi-Schemas)]
        S3Bucket[(AWS S3 Bucket<br/>Document Vault & Media Uploads)]
        SendGrid[SendGrid Web API<br/>Transactional Email]
        Razorpay[Razorpay API & Webhooks<br/>Payment Gateway]
    end

    Users -->|HTTPS Requests| Cloudflare
    Cloudflare -->|Static Assets /*.js, /*.css, /*.webp| FrontendS3
    Cloudflare -->|API Traffic /api/* & /health| ALB
    
    ALB -->|Round-Robin / Least Outstanding| Instance1
    ALB -->|Round-Robin / Least Outstanding| Instance2
    ALB -->|Round-Robin / Least Outstanding| InstanceN

    Instance1 & Instance2 & InstanceN <--> Redis
    Instance1 & Instance2 & InstanceN -->|Connection Pool M| Supavisor
    Supavisor --> Postgres
    Instance1 & Instance2 & InstanceN --> S3Bucket
    Instance1 & Instance2 & InstanceN --> SendGrid
    Instance1 & Instance2 & InstanceN <--> Razorpay
```

---

## ⚖️ 2. Load Balancer Configuration Specification

### 2.1 Target Group & Health Check Settings

| Parameter | AWS ALB Recommended Value | Description |
| :--- | :--- | :--- |
| **Protocol & Port** | `HTTP:5000` (Internal Target) | Traffic from ALB to container instances. |
| **Health Check Path** | `/health/ready` or `/health` | Probes both Node process and Database connectivity (`SELECT 1`). |
| **Health Check Port** | `traffic-port` (5000) | Port where Express is listening. |
| **Success Status Codes** | `200` | Indicates instance is healthy and ready to serve. |
| **Interval** | `15 seconds` | Frequency of health probes. |
| **Timeout** | `5 seconds` | Maximum wait time for probe response. |
| **Healthy Threshold** | `2 consecutive successes` | Time to put a new instance into service. |
| **Unhealthy Threshold** | `3 consecutive failures` | Time to drain and evict an unhealthy instance. |

### 2.2 Health Check Probes Provided by DreamXec Backend

1. **Liveness Probe (`GET /health/live` or `GET /api/health/live`)**:
   * **Purpose**: Verifies that the Node process is running and accepting TCP socket connections.
   * **Status**: Returns `200 OK` `{ "status": "alive" }`.
2. **Readiness Probe (`GET /health/ready` or `GET /api/health/ready`)**:
   * **Purpose**: Verifies that database connectivity is active before the ALB starts routing customer traffic.
   * **Status**: Returns `200 OK` `{ "status": "ready", "database": "connected" }` or `503 Service Unavailable`.
3. **Comprehensive Diagnostics (`GET /health` or `GET /api/health`)**:
   * **Purpose**: Full operational check returning DB latency, Redis connectivity, process uptime, and memory consumption.

### 2.3 HTTP Keep-Alive Configuration (Preventing 502 Bad Gateway)

Under high concurrency, load balancers maintain persistent HTTP keep-alive connections. If the Node.js HTTP server closes a connection before the ALB, the ALB will attempt to reuse the closed socket, generating random `502 Bad Gateway` errors.

* **DreamXec Server Settings**:
  ```javascript
  server.keepAliveTimeout = 65000; // 65 seconds (exceeds standard 60s ALB idle timeout)
  server.headersTimeout = 66000;   // 66 seconds
  ```

### 2.4 Session Stickiness vs Stateless Architecture

* **Sticky Sessions (Session Affinity)**: **NOT REQUIRED**.
* **Reason**: DreamXec uses stateless Bearer JWT authentication in the `Authorization` header, and OTPs / rate-limit counters are shared globally across all instances via Redis.
* **Benefit**: Pure stateless round-robin or least-outstanding-requests routing distributes traffic evenly without single-instance hot spotting.

---

## 🗄️ 3. Database Connection Pooling Strategy

When scaling to $N$ load-balanced instances, each instance maintains a Prisma connection pool.

### 3.1 Sizing Formula
$$\text{Total Active DB Connections} = N \times \text{connection\_limit}$$

* Sized with generous headroom at **`connection_limit=15`** per container instance to ensure instantaneous query execution without connection starvation or latency degradation.
* **Recommended Connection URLs**:
  * **`DATABASE_URL` (Runtime App Traffic)**: Connect to Supabase Supavisor/PgBouncer port `6543`:
    ```text
    DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15&pool_timeout=15&connect_timeout=10"
    ```
  * **`DIRECT_URL` (Prisma Migrations)**: Connect directly to session port `5432`:
    ```text
    DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
    ```


---

## 🔒 4. Production Security & Edge Optimization Checklist

### 4.1 Cloudflare / AWS WAF (Web Application Firewall)
- [x] **SSL/TLS**: Full (Strict) mode with automatic HTTPS redirects (`http://` -> `https://`).
- [x] **Rate Limiting at Edge**: Configure Cloudflare WAF rule for `/api/auth/*` (max 50 requests/min per IP) as first line of defense before hitting backend.
- [x] **DDoS Mitigation**: Enable Cloudflare Under Attack Mode or AWS Shield Standard.

### 4.2 Static Asset Caching
- [x] **Frontend S3 / CloudFront**:
  * `index.html`: `Cache-Control: no-cache, no-store, must-revalidate` (ensures users always fetch latest release).
  * `assets/*.js`, `assets/*.css`, images: `Cache-Control: public, max-age=31536000, immutable`.
- [x] **Direct Uploads**: AWS S3 presigned PUT URLs with CORS pre-configured in `scripts/aws-setup.sh`.

---

## 📈 5. Centralized Structured Logging & Observability

### 5.1 Architecture & Flow

Every log entry across all Express controllers, services, repositories, and HTTP access middleware is normalized into single-line structured JSON with auto-injected trace context:

```json
{
  "level": "info",
  "message": "HTTP Access",
  "service": "dreamxec-api",
  "environment": "production",
  "requestId": "req_1789574400_abc123",
  "method": "POST",
  "path": "/api/donations/create-order",
  "status": 200,
  "responseTimeMs": 32.4,
  "ip": "203.0.113.195",
  "timestamp": "2026-09-16T21:18:00.000Z"
}
```

### 5.2 Direct Ingestion Options (Zero Local Disk Writes)
1. **Container stdout (Default)**: Render, AWS CloudWatch Logs, and Datadog automatically capture and index stdout JSON logs without needing local disk files.
2. **Direct Cloud Stream Transport**: Provide `LOG_HTTP_ENDPOINT` (e.g. BetterStack / Logtail / Axiom) in `.env` to stream logs directly over HTTPS without agent sidecars.

---

## 💾 6. Automated Database Backups & PITR Disaster Recovery

### 6.1 Point-In-Time Recovery (PITR) via Supabase
* **Mechanism**: Continuous Write-Ahead Log (WAL) archiving via Supabase / AWS RDS.
* **Granularity**: Allows rolling back the database to any specific second in time (e.g. 5 seconds before an accidental deletion or corruption).
* **Enablement**: In the Supabase Dashboard, navigate to **Project Settings > Database > Backups** and enable **Point In Time Recovery (PITR)** (7-day or 30-day retention).

### 6.2 Automated Logical Snapshots (Daily to Encrypted AWS S3)
* **CLI Script**: Run [scripts/db-backup.sh](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/scripts/db-backup.sh) locally or via CI/CD.
* **Automated GitHub Action**: [.github/workflows/db-backup.yml](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/.github/workflows/db-backup.yml) runs daily at `02:00 UTC` (07:30 IST), dumping all 14 multi-domain schemas, generating SHA-256 integrity checksums, and uploading with `AES256` encryption to `s3://$AWS_BACKUP_BUCKET/db-backups/`.
* **Zero Web Server Load**: The backup runs entirely inside GitHub Actions / isolated worker instances, never consuming CPU or RAM on your production API instances.

---

## 🚀 7. Continuous Deployment Pipeline & Multi-Cloud Routing

DreamXec uses a unified GitHub Actions pipeline ([.github/workflows/deploy.yml](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/.github/workflows/deploy.yml)) that automatically routes deployments based on the git branch:

| Git Branch | Deployment Target | Compute & Strategy |
| :--- | :--- | :--- |
| **`main`** | **AWS (Production)** | ECR Docker Image Build + Zero-Downtime Blue/Green Deployment on EC2 via AWS Systems Manager (SSM) and atomic Nginx reload. |
| **Any other branch**<br/>(`dev`, `staging`, `feat/*`, etc.) | **Render (Preview / Staging)** | Automated Render Web Service (backend) & Static Site (frontend Vite SPA) deploy via Render Deploy Hooks with branch ref tagging. |

### 7.1 Pipeline Stages
1. **Validation & Routing (`validate-and-route`)**: Runs the full test suite and verifies Prisma schema integrity before determining deployment destination.
2. **Render Trigger (`deploy-to-render`)**: Triggered for non-`main` branches, hitting `RENDER_BACKEND_DEPLOY_HOOK` and `RENDER_FRONTEND_DEPLOY_HOOK` with `?ref=<branch>`.
3. **AWS Build & EC2 Deployment (`build-and-push-ecr` -> `deploy-to-ec2`)**: Triggered exclusively for `main`, compiling client assets into Docker backend, pushing to ECR, and orchestrating blue/green deployment via SSM.
4. **Manual Dispatch Override**: Workflow can also be manually dispatched from the GitHub Actions UI with an explicit target (`auto`, `aws`, or `render`).

