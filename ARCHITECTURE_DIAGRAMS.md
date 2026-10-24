# Social Impact Platform - Architecture Diagrams & Flow Charts

This document maps the architectural boundaries, deployment topologies, and transactional flows of the Social Impact Platform using Mermaid diagrams.

---

## 1. Context Diagram (System Boundary)

The Context Diagram defines the user segments and third-party integrations interacting with the platform.

```mermaid
graph TB
    subgraph Users["Ecosystem Participants"]
        User["👤 Volunteer / Donor / Researcher"]
        Corp["🏢 Corporate CSR Teams"]
        NGO["🤝 NGOs and Foundations"]
        Gov["🏛️ Government Agencies"]
    end

    subgraph Platform["Social Impact Platform Boundary"]
        System["🌐 Core Modular Platform<br/>(Donations, Grants, Onboarding, Zanzibar Permissions, Wallets)"]
    end

    subgraph Integrations["Third-Party Integrations"]
        Gateways["🏦 Payment Gateways<br/>(Stripe, Razorpay)"]
        NotificationChannels["📧 Delivery Channels<br/>(SES, SMS, WhatsApp)"]
        Registries["🏛️ Government Registries<br/>(PAN, GST, CIN)"]
        S3Storage["☁️ Object Storage<br/>(S3, GCS)"]
    end

    User -->|Individual Actions| System
    Corp -->|Allocate CSR & Match| System
    NGO -->|Post Projects & Apply| System
    Gov -->|Audit & Verify Registries| System

    System -->|Process Payments| Gateways
    System -->|Deliver Messages| NotificationChannels
    System -->|Validate Credentials| Registries
    System -->|Store Metadata Docs| S3Storage
```

---

## 2. Container Diagram (High-Level Containers)

Details the software containers, caching layers, and database sharding boundaries.

```mermaid
graph TB
    subgraph Edge["Edge Security"]
        Cloudflare["Cloudflare CDN & WAF"]
    end

    subgraph Ingress["Traffic Routing"]
        LoadBalancer["Global Load Balancer"]
        APIGateway["Kong API Gateway<br/>(Auth Verification, Rate Limiting)"]
    end

    subgraph AppContainers["Application Service Containers"]
        AuthService["Auth Service<br/>(JWT, Sessions)"]
        OrgService["Organization Service<br/>(ltree Hierarchy)"]
        ZanzibarService["Zanzibar Perms Service<br/>(Graph Tuples)"]
        OnboardingService["Onboarding Service<br/>(Queue-First API)"]
        VerificationService["Verification Service<br/>(Pipelines)"]
        LedgerService["Ledger & Wallet Service<br/>(Double-Entry Engine)"]
        DonationService["Donation Service<br/>(Payment Router)"]
        GrantService["Grant Service<br/>(Milestones)"]
        DocService["Document Service<br/>(Blob Metadata)"]
        NotificationService["Notification Service<br/>(Dispatchers)"]
    end

    subgraph QueueLayer["Event Streaming Broker"]
        Kafka["Kafka Cluster<br/>(Domain Event & Audit Streams)"]
    end

    subgraph StorageLayer["Data Storage Tier"]
        PostgreSQL["PostgreSQL Cluster<br/>(OLTP, RLS Enabled)"]
        Redis["Redis Cache Cluster<br/>(Permissions, Sessions)"]
        OpenSearch["OpenSearch Cluster<br/>(Faceted Search)"]
        ClickHouse["ClickHouse Cluster<br/>(OLAP Immutable Audits)"]
    end

    Cloudflare --> LoadBalancer
    LoadBalancer --> APIGateway
    APIGateway --> AuthService
    APIGateway --> OrgService
    APIGateway --> ZanzibarService
    APIGateway --> OnboardingService
    APIGateway --> LedgerService
    
    AppContainers -->|Query Cache| Redis
    AppContainers -->|Publish Events| Kafka
    AppContainers -->|Transactional Read/Write| PostgreSQL
    
    Kafka -->|Consume Events| NotificationService
    Kafka -->|Faceted Search Sync| OpenSearch
    Kafka -->|Write Audit Logs| ClickHouse
```

---

## 3. Component Diagram (Onboarding & Permissions Internals)

Illustrates the internal package dependencies of the Onboarding Service and its integration with the Zanzibar-inspired relation engine.

```mermaid
graph TB
    subgraph OnboardingService["Onboarding Service Component"]
        Controller["Onboarding Controller<br/>(Validates Payload)"]
        CommandProducer["Kafka Command Producer"]
        Worker["Onboarding Worker<br/>(Consumes Submissions)"]
        StateMachine["State Machine Engine"]
        WorkflowRepo["Workflow DB Repository"]
    end

    subgraph ZanzibarService["Zanzibar Permission Component"]
        ZanzibarEngine["Zanzibar Graph Engine"]
        TupleCache["Redis Cache Manager"]
        TupleRepo["Tuple SQL Repository"]
    end

    Controller -->|Produce JSON submission| CommandProducer
    CommandProducer -->|Write to Kafka| KafkaBroker[("Kafka Broker")]
    KafkaBroker -->|Fetch offset| Worker
    Worker -->|Execute step validation| StateMachine
    StateMachine -->|Fetch template rules| WorkflowRepo
    StateMachine -->|Create relations on approve| ZanzibarEngine
    ZanzibarEngine -->|Validate user scope| TupleCache
    TupleCache -->|On cache miss| TupleRepo
```

---

## 4. Deployment Diagram (Infrastructure Topology)

Visualizes physical deployment nodes distributed across Availability Zones.

```mermaid
graph TB
    CloudflareEdge["☁️ Cloudflare CDN Edge"] --> |HTTPS Traffic| ALB["⚖️ AWS Application Load Balancer"]

    subgraph Region["AWS Regional VPC (us-east-1)"]
        subgraph AZ1["Availability Zone A"]
            K8s_AZ1["Kubernetes Node Group A"]
            Pod_AuthA["Auth Service Pod"]
            Pod_LedgerA["Ledger Service Pod"]
            Redis_ReplA["Redis Replica Node"]
            Kafka_Broker1["Kafka Broker 1"]
        end

        subgraph AZ2["Availability Zone B"]
            K8s_AZ2["Kubernetes Node Group B"]
            Pod_AuthB["Auth Service Pod"]
            Pod_LedgerB["Ledger Service Pod"]
            Redis_Primary["Redis Primary Node"]
            Kafka_Broker2["Kafka Broker 2"]
            DB_Primary["PostgreSQL Primary DB<br/>(Multi-AZ Write)"]
        end

        subgraph AZ3["Availability Zone C"]
            K8s_AZ3["Kubernetes Node Group C"]
            Pod_WorkerC["Workflow Worker Pod"]
            Redis_ReplC["Redis Replica Node"]
            Kafka_Broker3["Kafka Broker 3"]
            DB_Replica["PostgreSQL Read Replica"]
        end
    end

    ALB --> K8s_AZ1
    ALB --> K8s_AZ2
    ALB --> K8s_AZ3

    Pod_AuthA & Pod_AuthB --> Redis_Primary
    Pod_LedgerA & Pod_LedgerB --> DB_Primary
    Pod_WorkerC --> DB_Replica
    
    DB_Primary -->|Physical Synchronous Replication| DB_Replica
    Redis_Primary -->|Replicate| Redis_ReplA & Redis_ReplC
```

---

## 5. Tiered Data-Fetching Flow

Illustrates high-speed reads across container memory, Redis, RLS replicas, and OpenSearch.

```mermaid
sequenceDiagram
    participant Client as Client Request
    participant Pod as Service Container (L1)
    participant Redis as Redis Cluster (L2)
    participant OpenSearch as OpenSearch (L4 Search)
    participant Replica as PostgreSQL Read Replica (L3)
    participant Primary as PostgreSQL Primary DB

    Client->>Pod: GET Request (Tenant ID + Filters)
    
    rect rgb(240, 248, 255)
        Note over Pod: Check L1 Local Cache (e.g. global config)
        alt L1 Hit
            Pod-->>Client: Return L1 Response (sub-ms)
        end
    end

    Pod->>Redis: Check L2 Cache (e.g. session, permissions, profiles)
    alt L2 Hit
        Redis-->>Pod: Return L2 JSON Payload
        Pod-->>Client: Return Response (<5ms)
    end

    alt Query is Faceted / Full-Text Search
        Pod->>OpenSearch: Query OpenSearch Cluster (includes Tenant filter)
        OpenSearch-->>Pod: Return Matches
        Pod-->>Client: Return Response
    else Query is Database Record Lookup
        Pod->>Replica: Run Query with app.current_tenant_id set
        alt Replica lagging behind client LSN token
            Pod->>Primary: Fallback: Query Primary DB
            Primary-->>Pod: Return Consistent Record
        else Replica has synchronized
            Replica-->>Pod: Return Tenant-Isolated rows
        end
        Pod->>Redis: Populate L2 Cache asynchronously
        Pod-->>Client: Return Response
    end
```

---

## 6. System Data Flow Diagram

Visualizes the lifecycle of a command execution vs. a read query evaluation.

```mermaid
graph TD
    User[👤 Client User] -->|1. HTTP Write Command| Gateway[API Gateway]
    Gateway -->|2. Put to Command Queue| Kafka[Apache Kafka]
    Kafka -->|3. Consume Async| Worker[Worker Service]
    Worker -->|4. Strict Write| PGWrite[(PostgreSQL Primary)]
    PGWrite -->|5. Trigger Emit| AuditStream[Kafka Audit Topic]
    AuditStream -->|6. Batch Ingest| ClickHouse[(ClickHouse OLAP)]

    User -->|1. HTTP Read Query| ReadGateway[API Gateway]
    ReadGateway -->|2. Check Cache| Redis[Redis Cache]
    Redis -- Cache Miss -->|3. Query Read Replica| PGRead[(PostgreSQL Replica)]
```

---

## 7. Request Lifecycle Flow

Traces how request traces are propagated through the system boundaries.

```mermaid
sequenceDiagram
    participant Client as User Client
    participant Kong as Kong API Gateway
    participant Services as App Container Node
    participant Redis as Redis Cache
    participant DB as PgBouncer / PostgreSQL

    Client->>Kong: Send API Request (inject Traceparent ID)
    Kong->>Kong: Verify API Rate Limit & Trace headers
    Kong->>Services: Route Request with Trace Header
    Services->>Redis: Check Session Token validity
    Redis-->>Services: Session active, return properties
    Services->>Services: Compile Authorization context
    Services->>DB: Checkout connection from PgBouncer pool
    DB->>DB: Execute query under Row-Level Security
    DB-->>Services: Return tenant-restricted rows
    Services-->>Kong: Format JSON response
    Kong-->>Client: Return HTTP Response
```

---

## 8. Authentication Flow

Details token lifecycle management.

```mermaid
sequenceDiagram
    participant Client as Web/Mobile Client
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Redis as Redis Session Cache
    participant DB as PostgreSQL DB

    Client->>Gateway: POST /auth/login (email, password_hash)
    Gateway->>Auth: Validate Credentials
    Auth->>DB: Query User record & password hash
    DB-->>Auth: User record matches
    Auth->>Auth: Check credentials & generate Access (15m) + Refresh (7d) Tokens
    Auth->>Redis: Set Refresh Token mapping to active user session
    Auth->>Gateway: Return Token Pair
    Gateway-->>Client: 200 OK + JWT Tokens (set HttpOnly cookies)
```

---

## 9. Onboarding Application Flow

Visualizes the queue-buffered onboarding pipeline.

```mermaid
sequenceDiagram
    participant Applicant as User Applicant
    participant Gateway as Onboarding API Gateway
    participant Kafka as Kafka Broker (submissions-topic)
    participant Worker as Onboarding Worker
    participant Verifications as Verification Pipeline
    participant DB as PostgreSQL DB

    Applicant->>Gateway: POST /onboarding/apply (form data + idempotency key)
    Gateway->>Gateway: Validate Idempotency Key
    Gateway->>Kafka: Publish SubmitApplicationCommand
    Gateway-->>Applicant: 202 Accepted (Correlation ID)
    
    Worker->>Kafka: Poll SubmitApplicationCommand
    Worker->>DB: Create workflow instance row (status = IN_VERIFICATION)
    Worker->>Verifications: Trigger Verification processes (Email, Document, CIN)
    Verifications-->>Worker: Return verification statuses and scores
    alt Score acceptable (Trust > 70 & Risk < 30)
        Worker->>DB: Update state to APPROVED & Create Namespace RLS isolation
    else Requires manual inspection
        Worker->>DB: Update state to REVIEW_PENDING
    end
```

---

## 10. Double-Entry Donation Flow

Detailed accounting processing.

```mermaid
sequenceDiagram
    participant Donor as Donor Client
    participant Donation as Donation Service
    participant Gateway as Payment Gateway (Stripe)
    participant Ledger as Ledger Service
    participant DB as PostgreSQL DB (RLS Mode)

    Donor->>Donation: Initiate Donation (Amount, Campaign ID)
    Donation->>DB: Write pending donation record
    Donation->>Gateway: Create checkout session
    Gateway-->>Donor: Redirect to Payment page
    Donor->>Gateway: Complete payment authorization
    Gateway->>Donation: HTTP Webhook Callback (payment succeeded)
    Donation->>DB: Update donation status to SUCCEEDED
    Donation->>Ledger: POST /ledger/transactions (Double-entry payload)
    Ledger->>DB: Insert Ledger Transaction & Entries (Debit cash, Credit liability)
    Note over DB: Database deferred trigger validates: SUM(amount) == 0
    DB-->>Ledger: Transaction Committed
    Ledger-->>Donation: Balance verification complete
```

---

## 11. Grant Application & Dispersal Flow

Milestone-driven grant lifecycle.

```mermaid
sequenceDiagram
    participant Applicant as Researcher/NGO Client
    participant Grant as Grant Service
    participant DB as PostgreSQL DB
    participant Ledger as Ledger Service

    Applicant->>Grant: Submit Grant Proposal (budget + milestones)
    Grant->>DB: Write proposal record (status = SUBMITTED)
    Note over Grant: Score aggregation from random reviewers
    Grant->>DB: Approve proposal, write milestone schedule
    Applicant->>Grant: Submit Milestone Evidence (Report doc)
    Grant->>DB: Update milestone status to APPROVED
    Grant->>Ledger: Trigger disbursement transfer
    Ledger->>DB: Log ledger Entries (Debit grant liability, Credit recipient wallet)
    Note over DB: Verify balanced double-entry entries
    Ledger-->>Grant: Fund transfer verified
```

---

## 12. Hierarchy Organization Traversal Flow

Demonstrates organizational tree resolution.

```mermaid
sequenceDiagram
    participant User as Client Admin
    participant Org as Organization Service
    participant Cache as Redis Cache
    participant DB as PostgreSQL DB

    User->>Org: GET /organizations/{id}/descendants
    Org->>Cache: Query tree cache key (org:tree:descendants:{id})
    alt Cache Hit
        Cache-->>Org: Return cached tree structure
    else Cache Miss
        Org->>DB: Execute path query (SELECT * FROM organizations WHERE hierarchy_path <@ 'parent_path')
        DB-->>Org: Return children and descendants
        Org->>Cache: Cache computed tree output
    end
    Org-->>User: Return organization hierarchy tree
```

---

## 13. State Machine Workflow Execution Flow

Core steps executor.

```mermaid
sequenceDiagram
    participant Worker as State Machine Engine
    participant DB as PostgreSQL DB
    participant Kafka as Kafka Event Broker

    Worker->>DB: Fetch pending workflow execution task
    Worker->>Worker: Run execution step validation rules
    alt Step Succeeded
        Worker->>DB: Update workflow step progress status (index += 1)
        Worker->>Kafka: Publish StepCompleted Event
    else Step Failed & Retry Available
        Worker->>Worker: Increment retry count
        Worker->>Kafka: Publish StepFailed Event to Retry Topic
    else Step Fatal / Exhausted
        Worker->>DB: Transition state to FAILED
        Worker->>Kafka: Publish WorkflowFailed Event
    end
```
