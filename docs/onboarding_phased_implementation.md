# Phased Implementation Plan: Onboarding & Verification Engine

This document details the step-by-step development roadmap for building the modular, high-scale **Onboarding & Verification Engine**. The work is divided into 6 distinct, incremental phases to ensure that all code can be verified, isolated, and tested at every checkpoint.

---

```mermaid
gantt
    title Onboarding Engine Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Backend Pipeline
    Phase 1: DB Foundation & DDL Validation :active, p1, 2026-07-20, 5d
    Phase 2: Ingestion API & Kafka Buffering  : p2, after p1, 6d
    Phase 3: Worker & State Machine          : p3, after p2, 7d
    Phase 4: AI & Pipeline Verifications     : p4, after p3, 8d
    Phase 5: Admin Dashboard & Zanzibar      : p5, after p4, 5d
    Phase 6: Load, Stress & Chaos Testing    : p6, after p5, 6d
```

---

## Phase 1: Database Foundation & DDL Validation

### Objective
Deploy the onboarding database schema and write automated SQL assertions to verify that RLS, foreign keys, and default states behave exactly as specified.

### Tasks
1. Enable extensions: `uuid-ossp`, `ltree`, `citext`.
2. Create tables: `workflow_templates`, `workflow_instances`, `verifications`.
3. Apply Row-Level Security (RLS) policies and test role restrictions.

### Code / Test Specifications
Write a SQL unit test script (`tests/db/onboarding_schema.spec.sql`) using `pgTAP` or raw transactional assertions:

```sql
BEGIN;
SELECT plan(4);

-- 1. Test: RLS isolates tenant queries
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO workflow_templates (id, tenant_id, name, applies_to_org_types, steps)
VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'NGO_Onboarding', ARRAY['NGO'], '[]');

SET LOCAL app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT is(
    (SELECT COUNT(*)::INT FROM workflow_templates),
    0,
    'RLS policy must hide Tenant A templates from Tenant B session context'
);

-- 2. Test: Verification inserts fail on malformed types
SELECT throws_ok(
    $$INSERT INTO workflow_instances (template_id, tenant_id, applicant_email, applicant_name, org_type) VALUES (null, null, 'dino@example.com', 'Dino', 'NGO')$$,
    '23502', -- Not Null violation code
    'Should throw Not Null violation on missing template ID'
);

SELECT * FROM finish();
ROLLBACK;
```

### Verification & Checkpoints
- Run migration script on test DB.
- Run `pg_prove` on SQL specification tests.
- **Verification Gate**: 100% of schema constraints, default states, and RLS bypass rules pass.

---

## Phase 2: Ingestion API & Kafka Command Buffering (Write Path)

### Objective
Create the REST entry point that accepts onboarding submissions, performs schema validation, enforces idempotency, and immediately queues requests in Kafka.

```
Client ──> HTTP POST ──> [ Express API ] ──> Redis Check ──> [ Kafka Topic ]
                                                    │
                                                    └───> Return 202 Accepted
```

### Tasks
1. Set up Express routes: `POST /onboarding/apply`.
2. Integrate Zod schema validation matching the organization registration form structures.
3. Configure **Redis Idempotency Check**:
   - Save `Idempotency-Key` with `IN_PROGRESS` status (TTL: 24h).
4. Establish Kafka Producer client and serialize payloads to JSON.

### Code / Test Specifications
```typescript
// src/api/onboarding.ts
import { Router } from 'express';
import { KafkaProducer } from '../services/kafka';
import { RedisClient } from '../services/redis';
import { applicationSchema } from '../dto/onboarding';

const router = Router();

router.post('/apply', async (req, res, next) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Missing Idempotency-Key header' });
  }

  // 1. Enforce Idempotency check
  const lockAcquired = await RedisClient.set(`idempotent:onboarding:${idempotencyKey}`, 'IN_PROGRESS', 'NX', 'EX', 86400);
  if (!lockAcquired) {
    return res.status(409).json({ error: 'Duplicate request in progress or completed.' });
  }

  try {
    // 2. Validate payload matching schema
    const payload = applicationSchema.parse(req.body);
    const correlationId = crypto.randomUUID();

    // 3. Queue request inside Kafka
    await KafkaProducer.send({
      topic: 'onboarding-submissions',
      messages: [{
        key: correlationId,
        value: JSON.stringify({ ...payload, correlationId, idempotencyKey })
      }]
    });

    return res.status(202).json({
      status: 'ACCEPTED',
      correlation_id: correlationId,
      message: 'Application received and queued for processing.'
    });
  } catch (error) {
    await RedisClient.del(`idempotent:onboarding:${idempotencyKey}`);
    next(error);
  }
});
```

### Verification & Checkpoints
- **Unit Test**: Stub SQS/Kafka and Redis. Verify payload validation returns correct `400 Bad Request` errors.
- **Integration Test**: Spin up local Redis and Kafka. Execute `POST /apply`. Verify that a message is successfully written to the `onboarding-submissions` topic.
- **Load Test Ingestion**: Run `autocannon` or `k6` sending 20,000 request payloads/second. Verify memory footprint is stable and Gateway latency stays under 10ms.

---

## Phase 3: Asynchronous Workflow Worker & State Machine

### Objective
Build the background worker that consumes Kafka events, creates workflow instances in PostgreSQL, and drives state transitions.

### Tasks
1. Implement the Kafka Consumer subscription loop on `onboarding-submissions`.
2. Build the **Workflow State Machine Engine**:
   - Parses the JSON list of steps from `workflow_templates`.
   - Validates transition constraints.
3. Manage database writes: Create a new `workflow_instances` record on new ingestion events.

### Code / Test Specifications
```typescript
// src/services/stateMachine.ts
export interface WorkflowStep {
  name: string;
  type: 'EMAIL_VERIFICATION' | 'DOCUMENT_UPLOAD' | 'AI_OCR' | 'MANUAL_REVIEW';
  config: Record<string, any>;
}

export class StateMachine {
  static getNextState(currentStep: number, steps: WorkflowStep[]): { status: string; nextIndex: number } {
    if (currentStep >= steps.length) {
      return { status: 'APPROVED', nextIndex: currentStep };
    }
    const step = steps[currentStep];
    switch (step.type) {
      case 'EMAIL_VERIFICATION':
        return { status: 'PENDING_EMAIL_VERIFICATION', nextIndex: currentStep };
      case 'DOCUMENT_UPLOAD':
        return { status: 'PENDING_DOCUMENT_UPLOAD', nextIndex: currentStep };
      case 'AI_OCR':
        return { status: 'PROCESSING_AI_OCR', nextIndex: currentStep };
      case 'MANUAL_REVIEW':
        return { status: 'PENDING_MANUAL_REVIEW', nextIndex: currentStep };
      default:
        return { status: 'IN_PROGRESS', nextIndex: currentStep };
    }
  }
}
```

### Verification & Checkpoints
- **Unit Test**: Test state machine transitions using mock steps lists. Verify it transitions to `APPROVED` when final index is exceeded.
- **Integration Test**: Write a mock submission to Kafka. Verify worker consumes it, creates a PostgreSQL instance, and sets status to the first step's status (e.g. `PENDING_EMAIL_VERIFICATION`).

---

## Phase 4: Automated Verification Pipeline & Mocks

### Objective
Implement automated step validation triggers: dispatching verification tasks (Domain checking, Email confirmation, PAN/GST registry integrations) and running AI OCR mocks.

### Tasks
1. Implement independent verification adapters matching the generic interface.
2. Build the parallel worker orchestrator to trigger multiple tests at once.
3. Set up **Kafka Retries and Dead Letter Queue (DLQ)** routing.

### Code / Test Specifications
```typescript
// src/services/verification/types.ts
export interface IVerificationProvider {
  type: string;
  verify(evidence: any): Promise<{ success: boolean; data: any; score?: number }>;
}

// src/services/verification/panProvider.ts
export class PanVerificationProvider implements IVerificationProvider {
  type = 'PAN';
  async verify(evidence: { pan_number: string }) {
    try {
      // Mock government PAN registry connection
      const response = await axios.post('https://api.gov.in/pan/verify', { pan: evidence.pan_number }, { timeout: 5000 });
      return {
        success: response.data.status === 'VALID',
        data: response.data
      };
    } catch (error) {
      throw new Error(`PAN API connection failed: ${error.message}`);
    }
  }
}
```

### Verification & Checkpoints
- **Contract Tests**: Mock API responses from government registries. Run mock tests to ensure parser logic correctly extracts data.
- **Worker Resiliency Tests**: Inject network failures (e.g. timeout on PAN registry). Verify the task is queued to the `verification-retry-5m` topic and subsequently routed to the DLQ after maximum retries are exhausted.

---

## Phase 5: Admin Dashboard & Zanzibar Integration

### Objective
Deploy the manual verification dashboard APIs. Enforce Zanzibar ReBAC rules to ensure only authorized compliance officers can review and sign off on applications.

### Tasks
1. REST routes: `GET /onboarding/applications` (paginated), `POST /onboarding/applications/:id/review`.
2. Integrate Zanzibar check middlewares:
   - Call Permission Service to check if user has `approver` relation on target organization workspace.
3. Account Activation Hook: On approval, create tenant workspace, activate organization status, and configure default RLS rules.

### Code / Test Specifications
```typescript
// src/api/review.ts
import { Router } from 'express';
import { checkPermission } from '../middleware/auth';
import { db } from '../config/db';

const router = Router();

router.post('/:id/review', checkPermission('onboarding', 'approve'), async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body; // 'APPROVE' or 'REJECT'

  const application = await db.workflow_instances.findUnique({ where: { id } });
  if (!application) return res.status(404).json({ error: 'Application not found' });

  await db.$transaction(async (tx) => {
    // 1. Save review decision state
    await tx.workflow_instances.update({
      where: { id },
      data: {
        status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        completed_at: new Date()
      }
    });

    if (decision === 'APPROVE') {
      // 2. Perform Onboarding activation steps
      await tx.organizations.update({
        where: { id: application.tenant_id },
        data: { lifecycle_status: 'ACTIVE' }
      });

      // 3. Emit activation event
      await KafkaProducer.send({
        topic: 'organization-events',
        messages: [{ key: application.tenant_id, value: JSON.stringify({ event: 'OrganizationActivated', tenant_id: application.tenant_id }) }]
      });
    }
  });

  return res.json({ status: 'SUCCESS', message: `Application ${decision} successfully` });
});
```

### Verification & Checkpoints
- **Authorization Test**: Attempt reviews using unauthorized users. Verify that the API returns `403 Forbidden`.
- **Transaction Rollback Test**: Force a write failure on the organizations table during approval. Verify that the application status changes are rolled back to their original state.

---

## Phase 6: Load, Stress, and Chaos Testing

### Objective
Perform end-to-end load testing to verify system behaviors under massive concurrency, network drops, and memory leaks.

```
                    [ 20K Concurrent Users ]
                               │
               [ Load Injector / k6 script ]
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
      [ Gateway API ]                    [ Kafka Queue ]
              │                                 │
     [ DB connection drop ]            [ Consumer Pod crash ]
```

### Test Scenarios
1. **Load Test (20,000 Concurrent Submissions)**:
   - Target: Enqueue applications continuously at a rate of 20K requests/second.
   - Validation criteria: HTTP latency remains below 15ms. SQS/Kafka buffers the requests, and PostgreSQL CPU utilization stays under 60% as workers throttle operations.
2. **Database Failover (Chaos)**:
   - Crash the PostgreSQL primary node mid-onboarding.
   - Validation criteria: Kafka consumers halt offset commits. On primary database recovery, consumers resume operations without duplicate writes or data loss.
3. **Zanzibar Cache Wipe**:
   - Wipe the Redis permissions cache under load.
   - Validation criteria: The permission engine falls back to direct PostgreSQL tuple reads; check queries continue to resolve. The local rate limiter protects the DB from connection surges.

### Automation Script (K6)
Create `tests/perf/onboarding_load.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 5000 },  // Ramp up
    { duration: '3m', target: 20000 }, // Sustained load
    { duration: '1m', target: 0 },     // Cool down
  ],
};

export default function () {
  const url = 'http://api.socialimpact.local/onboarding/apply';
  const payload = JSON.stringify({
    applicant_email: `test-${__VU}-${__ITER}@univ.edu`,
    applicant_name: 'Alpha University',
    org_type: 'UNIVERSITY',
    form_data: { cin: 'U12345MH2026PTC123456' }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `key-${__VU}-${__ITER}`
    },
  };

  const res = http.post(url, payload, params);
  check(res, {
    'status is 202': (r) => r.status === 202,
    'latency OK': (r) => r.timings.duration < 15,
  });
  sleep(0.1);
}
```
