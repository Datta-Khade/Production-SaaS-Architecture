# CLAUDE.md — Production Application Bootstrap Prompt
# For: production.so | Fresh Project from Scratch
# Designed by: Senior System Architect
# Version: 1.0

---

> **PRIME DIRECTIVE FOR AI AGENTS & DEVELOPERS**
> This file is the single source of truth for building this production application.
> Read it completely before writing a single line of code.
> Every rule exists because the alternative has caused real production failures.
> This is a FRESH project — there is no legacy code. Build it right from day one.

---

## 🏗️ WHAT WE ARE BUILDING

A **multi-tenant SaaS production application** built to serve 50+ enterprise clients.

**Architecture Principles (non-negotiable):**
- Clean Architecture with strict layer separation
- Domain-Driven Design (DDD) with bounded contexts
- 12-Factor App methodology
- OWASP Top 10 security compliance
- AWS Well-Architected Framework alignment

---

## 🧱 TECHNOLOGY STACK (LOCKED — DO NOT DEVIATE)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + TypeScript | Component-driven, type-safe UI |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible components |
| State/Data | TanStack Query v5 | Server state, caching, sync |
| Forms | React Hook Form + Zod | Validated, type-safe forms |
| Routing | React Router v6 | Client-side routing with lazy loading |
| Backend | Node.js + Express + TypeScript | Async API server |
| ORM | Drizzle ORM | Type-safe SQL, migration-first |
| Database | PostgreSQL 15+ | Relational, multi-tenant isolation |
| Caching | Redis 7+ | Session, cache, pub/sub |
| Queue | BullMQ | Background jobs, retries, scheduling |
| Auth | JWT + refresh tokens | Stateless, tenant-aware |
| Logging | Pino | Structured JSON logs, tenant context |
| Validation | Zod (shared schemas) | Single source of truth for types |
| Testing | Vitest + Supertest | Unit + integration coverage |
| Deployment | Docker + nginx | Container-first, LB-ready |

---

## 📁 PROJECT SKELETON (PHASE 1 — BUILD THIS FIRST)

### Step 1.1 — Repository Structure

```
production-app/
├── client/                          # React frontend
│   ├── src/
│   │   ├── modules/                 # Feature modules (DDD bounded contexts)
│   │   │   └── <module>/
│   │   │       ├── components/      # Module-specific UI components
│   │   │       ├── hooks/           # Module-specific custom hooks
│   │   │       ├── pages/           # Route-level page components
│   │   │       └── index.ts         # Public API of the module
│   │   ├── shared/                  # Cross-cutting frontend concerns
│   │   │   ├── components/          # Shared UI components (buttons, modals)
│   │   │   ├── hooks/               # Shared hooks (useAuth, useTenant)
│   │   │   ├── lib/
│   │   │   │   ├── queryClient.ts   # TanStack Query client + apiRequest()
│   │   │   │   ├── auth.ts          # JWT decode, token refresh
│   │   │   │   └── errors.ts        # Error boundary, toast helpers
│   │   │   └── layouts/             # App shell, nav, sidebar
│   │   ├── App.tsx                  # Root router with lazy routes + error boundaries
│   │   └── main.tsx                 # Entry point
│   ├── public/
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                          # Node.js backend
│   ├── v2/                          # All new code lives here (versioned from day 1)
│   │   ├── <module>/
│   │   │   ├── controller.ts        # HTTP in/out ONLY — zero business logic
│   │   │   ├── service.ts           # Business logic ONLY — zero req/res
│   │   │   ├── repository.ts        # DB queries ONLY — zero business rules
│   │   │   └── routes.ts            # Route declarations + middleware
│   │   ├── db.ts                    # getDb() — tenant-scoped Drizzle instance
│   │   ├── tenantConnectionManager.ts
│   │   └── migrationRunner.ts       # Auto-runs on startup
│   ├── middleware/
│   │   ├── auth.ts                  # JWT verification + user attachment
│   │   ├── tenant.ts                # x-tenant-id resolution
│   │   ├── rateLimiter.ts           # Per-tenant rate limiting
│   │   ├── requestLogger.ts         # Pino request logging
│   │   └── globalErrorHandler.ts   # Catches all thrown errors, formats response
│   ├── routes.ts                    # Master route registry
│   ├── app.ts                       # Express app factory
│   └── index.ts                     # Server entry + env validation
│
├── shared/                          # Shared between client and server (monorepo)
│   └── v2/
│       └── <module>/
│           ├── schema.ts            # Drizzle table definitions
│           ├── types.ts             # TypeScript types derived from schema
│           └── validators.ts        # Zod schemas for requests/responses
│
├── migrations/                      # SQL migration files
│   └── NNNN_<description>.sql
│
├── workers/                         # BullMQ worker processes
│   └── <queue-name>/
│       ├── processor.ts             # Job handler
│       └── queue.ts                 # Queue definition + retry config
│
├── infra/                           # Infrastructure configuration
│   ├── docker/
│   │   ├── Dockerfile.client
│   │   ├── Dockerfile.server
│   │   └── Dockerfile.worker
│   ├── nginx/
│   │   └── nginx.conf
│   └── docker-compose.yml
│
├── scripts/                         # Dev tooling
│   ├── seed.ts                      # Seed master DB with test tenants
│   └── createTenant.ts              # Admin: provision new tenant DB
│
├── .env.example                     # All env vars documented (NO real values)
├── .env.development                 # Local dev values (gitignored)
├── package.json                     # Monorepo root
└── tsconfig.base.json               # Shared TS config
```

### Step 1.2 — Environment Variables (Validate ALL at startup with Zod)

```env
# .env.example — EVERY variable must be documented here

# App
NODE_ENV=development|staging|production
PORT=3000
APP_URL=https://app.production.so

# Database — Master
MASTER_DATABASE_URL=postgresql://user:pass@host:5432/master_db

# Database — Single tenant (dev/Replit only)
DATABASE_URL=postgresql://user:pass@host:5432/dev_db

# Auth
JWT_SECRET=<min-32-char-random-string>
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=<min-32-char-random-string>
REFRESH_TOKEN_EXPIRY=7d

# Redis
REDIS_URL=redis://localhost:6379

# Feature Flags
AUTH_BYPASS=false          # true ONLY in local dev — NEVER in production
MULTI_TENANT=true          # false on Replit/single-tenant dev

# Logging
LOG_LEVEL=info
LOG_PRETTY=true            # false in production (JSON only)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Email (queue-backed — never inline)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@production.so
```

---

## 🗄️ DATABASE ARCHITECTURE

### Multi-Tenancy Model: Database-Per-Tenant

Every tenant has a fully isolated PostgreSQL database. This is the ONLY acceptable isolation model for this project.

```
┌──────────────────── Master DB ───────────────────────┐
│  Tables: tenants, plans, billing_events              │
│  (tuid, domain, db_url, plan, is_active ...)         │
└──────────────────────┬───────────────────────────────┘
                       │  resolves tenant on every request
          ┌────────────┼──────────────┐
          ▼            ▼              ▼
    Tenant A DB   Tenant B DB   Tenant N DB
    (PostgreSQL)  (PostgreSQL)  (PostgreSQL)
```

**Tenant Resolution Flow (per request):**
1. Extract `x-tenant-id` header OR `domain` claim from JWT
2. `tenantConnectionManager` looks up `tuid` → `db_url` from master DB (cached in Redis, TTL 5min)
3. Returns a PgBouncer-backed Drizzle connection pool (max: 5 connections per tenant)
4. ALL subsequent queries in that request use this tenant-scoped connection

### Master DB — `production_master`

```sql
-- Run once via migration on first deploy
CREATE TABLE IF NOT EXISTS tenants (
  id            SERIAL PRIMARY KEY,
  tuid          TEXT NOT NULL UNIQUE,       -- e.g. "acme-corp-x7f2"
  domain        TEXT NOT NULL UNIQUE,       -- e.g. "acme.production.so"
  db_url        TEXT NOT NULL,              -- Full PostgreSQL connection string
  company_name  TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'starter',  -- starter | pro | enterprise
  is_active     BOOLEAN DEFAULT true,
  is_deleted    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_tuid   ON tenants(tuid);
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE is_active = true;
```

### Standard Table Template (ALL tenant tables must follow this)

```typescript
// shared/v2/<module>/schema.ts
import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { auditColumns } from '../schema/audit';  // ALWAYS spread these

export const myEntityTable = pgTable('my_entity_v2', {
  id:         serial('id').primaryKey(),
  uuid:       text('uuid').notNull().unique(),    // Public-facing ID
  name:       text('name').notNull(),
  is_deleted: boolean('is_deleted').default(false).notNull(),
  ...auditColumns,                                // created_at, updated_at, created_by_uuid, etc.
});
```

### Audit Columns (MANDATORY on every table)

```typescript
// shared/v2/schema/audit.ts
export const auditColumns = {
  created_at:       timestamp('created_at').defaultNow().notNull(),
  updated_at:       timestamp('updated_at').defaultNow().notNull(),
  created_by_uuid:  text('created_by_uuid'),   // Set by service, NOT from client
  updated_by_uuid:  text('updated_by_uuid'),   // Set by service, NOT from client
  is_deleted:       boolean('is_deleted').default(false).notNull(),
  deleted_at:       timestamp('deleted_at'),
  deleted_by_uuid:  text('deleted_by_uuid'),
};
```

### Migration Rules

- Every schema change = new `.sql` file in `migrations/NNNN_description.sql`
- `migrationRunner.ts` applies pending migrations automatically on `npm run dev` and on deploy
- NEVER modify an existing migration file after it has been applied anywhere
- NEVER run migrations manually — the runner handles it
- Naming: `0001_init_master.sql`, `0002_create_users.sql`, etc.

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### JWT Architecture

```
Client → POST /api/auth/login
  → Returns: { accessToken (15m), refreshToken (7d, httpOnly cookie) }

Every authenticated request:
  → Authorization: Bearer <accessToken>
  → x-tenant-id: <tuid>

Token payload:
  {
    sub: userUuid,
    email: string,
    role: "superadmin" | "admin" | "manager" | "user",
    domain: tenantDomain,   // fallback tenant resolution
    iat: number,
    exp: number
  }
```

### Role Hierarchy

```
superadmin > admin > manager > user

Rules:
- Every route MUST declare minimum required role via requireRole() middleware
- Never derive permissions from the request body — always from the verified JWT
- Role checks happen in middleware, NEVER in service or repository layer
```

### Route Protection Pattern

```typescript
// server/v2/<module>/routes.ts
router.get('/api/v2/items',
  authenticate,                    // Verify JWT, attach req.user
  requireTenant,                   // Resolve tenant DB connection
  requireRole('user'),             // Minimum role check
  rateLimiter,                     // Per-tenant rate limiting
  asyncHandler(controller.getAll)  // Controller — never throws uncaught
);
```

---

## 🏛️ BACKEND LAYER RULES

### Layer Responsibilities (STRICT — violations block PR merge)

| Layer | Owns | NEVER Contains |
|---|---|---|
| Controller | HTTP in/out, call service, return response | Business logic, DB queries, req/res in service calls |
| Service | Business rules, orchestration, audit logging | req/res objects, direct DB calls, HTTP status codes |
| Repository | Drizzle queries ONLY | Business rules, HTTP context, raw SQL strings |

### Controller Pattern

```typescript
// server/v2/<module>/controller.ts
export const myController = {
  getAll: async (req: Request, res: Response) => {
    const { page, limit } = normalizePagination(req.query);
    const result = await myService.getAll({ tenantId: req.tenantId, page, limit });
    res.json(result);
  },
  // DO NOT catch errors here — let globalErrorHandler handle everything
};
```

### Service Pattern

```typescript
// server/v2/<module>/service.ts
export const myService = {
  getAll: async ({ tenantId, page, limit }: GetAllInput) => {
    // Pure business logic — no req, no res, no HTTP concepts
    const items = await myRepository.findAll({ page, limit });
    await auditService.log({ tenantId, action: 'READ_ALL', resource: 'my_entity' });
    return items;
  },

  create: async (input: CreateInput, actorUuid: string) => {
    // Always wrap multi-table writes in a transaction
    return withTransaction(async (tx) => {
      const item = await myRepository.create(input, actorUuid, tx);
      await relatedRepository.createRelated(item.uuid, tx);
      return item;
    });
  },
};
```

### Repository Pattern

```typescript
// server/v2/<module>/repository.ts
import { getDb } from '../../db';   // ALWAYS — never import db directly

export const myRepository = {
  findAll: async ({ page, limit }: PaginationInput) => {
    const db = getDb();
    return db.select()
      .from(myEntityTable)
      .where(eq(myEntityTable.is_deleted, false))
      .limit(limit)
      .offset((page - 1) * limit);
  },
};
```

### Error Handling (Custom Error Classes — MANDATORY)

```typescript
// Throw these in services — NEVER raw Error objects
throw new NotFoundError('Item not found');        // → 404
throw new ValidationError('Email is required');   // → 400
throw new ForbiddenError('Insufficient role');     // → 403
throw new ConflictError('Email already exists');  // → 409
throw new AppError('Something went wrong', 500);  // → 500

// globalErrorHandler maps these to consistent JSON:
// { success: false, code: "NOT_FOUND", message: "Item not found" }
// Stack traces NEVER sent to client
```

---

## 🎨 FRONTEND ARCHITECTURE

### Module Structure

```typescript
// Every module is lazy-loaded and wrapped in ErrorBoundary
// client/src/App.tsx
const MyModule = lazy(() => import('./modules/my-module'));

<Route path="/my-module/*" element={
  <ModuleErrorBoundary moduleName="MyModule">
    <Suspense fallback={<PageSkeleton />}>
      <ProtectedRoute requiredRole="user">
        <MyModule />
      </ProtectedRoute>
    </Suspense>
  </ModuleErrorBoundary>
} />
```

### API Client Pattern (Single Source — Never Bypass)

```typescript
// client/src/shared/lib/queryClient.ts
export const apiRequest = async <T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> => {
  const token = getAccessToken();
  const tenantId = getTenantId();

  const res = await fetch(`/api/v2${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId,    // Auto-injected — never manual
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new ApiError(err.message, res.status, err.code);
  }
  return res.json();
};
```

### Data Fetching Pattern

```typescript
// Always use TanStack Query — never useState + useEffect for server data
export const useMyItems = (filters: Filters) => {
  return useQuery({
    queryKey: ['my-items', filters],
    queryFn: () => apiRequest<MyItem[]>('GET', `/my-items?${qs(filters)}`),
    staleTime: 30_000,
  });
};

export const useCreateMyItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInput) => apiRequest('POST', '/my-items', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-items'] }),
    onError: (err) => toast.error(err.message),  // MANDATORY onError
  });
};
```

### Form Pattern

```typescript
// Always React Hook Form + Zod — never uncontrolled forms
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
});

export const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  // ...
};
```

---

## ⚡ BACKGROUND JOBS (BullMQ)

### When to Use (MANDATORY for these cases)

- Email/notification sending
- PDF generation
- External API calls (webhooks, integrations)
- Report generation
- Data export / import
- Any operation taking > 200ms

### Job Pattern

```typescript
// workers/<queue-name>/queue.ts
export const myQueue = new Queue('my-queue', { connection: redisConnection });

// Enqueue (from service layer — return 202 Accepted immediately)
await myQueue.add('job-name', { tenantId, payload }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,  // Keep last 100 completed
  removeOnFail: 500,      // Keep last 500 failed for debugging
});

// workers/<queue-name>/processor.ts
const worker = new Worker('my-queue', async (job) => {
  const { tenantId, payload } = job.data;
  // Process job — errors are auto-retried per config above
}, { connection: redisConnection, concurrency: 5 });
```

---

## 🔴 CACHING (Redis)

### Cache Key Naming (MANDATORY format)

```typescript
// Always scope cache keys to tenant — NEVER share cache across tenants
const key = tenantCacheKey(tenantId, 'resource', identifier);
// Produces: "tenant:{tenantId}:resource:{identifier}"

// TTL guidelines:
// User sessions:     15 min  (matches JWT expiry)
// Tenant metadata:   5 min   (tenantConnectionManager)
// List queries:      60 sec  (invalidate on mutation)
// Config/settings:   10 min  (rarely changes)
// Never cache:       File data, PII without encryption
```

---

## 🔬 TESTING STRATEGY

### Coverage Requirements

| Layer | Type | Minimum Coverage |
|---|---|---|
| Repository | Unit (mocked DB) | 80% |
| Service | Unit (mocked repo) | 90% |
| Controller | Integration (Supertest) | Cover: 200, 400, 401, 403, 404 |
| Frontend hooks | Unit (React Testing Library) | 80% |

### Test Isolation Rule

```typescript
// NEVER test against shared state — each test suite provisions its own tenant
beforeAll(async () => {
  testTenant = await createTestTenant();   // Isolated DB, unique tuid
  testToken = generateTestToken({ tenantId: testTenant.tuid, role: 'admin' });
});

afterAll(async () => {
  await destroyTestTenant(testTenant.tuid);  // Clean up
});
```

---

## 🔍 OBSERVABILITY

### Logging (Pino — Structured JSON in production)

```typescript
// NEVER use console.log — always use req.log (has tenant/correlation context)
req.log.info({ action: 'CREATE', resource: 'item', itemUuid: item.uuid }, 'Item created');
req.log.error({ error: err.message, stack: err.stack }, 'Failed to process job');

// Every log line automatically includes:
// { timestamp, level, tenantId, requestId, userId, method, path, ... }
```

### Health Check (MANDATORY — load balancer depends on this)

```typescript
// GET /api/health → 200 if healthy, 503 if degraded
{
  "status": "ok" | "degraded",
  "checks": {
    "database": "ok" | "error",
    "redis": "ok" | "error",
    "masterDb": "ok" | "error"
  },
  "uptime": 12345,
  "version": "1.0.0"
}
```

---

## 🚀 INFRASTRUCTURE

### Docker Compose (Development)

```yaml
# infra/docker-compose.yml
services:
  app:
    build: { context: ., dockerfile: infra/docker/Dockerfile.server }
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
    env_file: .env.development

  client:
    build: { context: ., dockerfile: infra/docker/Dockerfile.client }
    ports: ["5173:5173"]
    depends_on: [app]

  postgres:
    image: postgres:15-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: production_master
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpassword

  redis:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    depends_on: [postgres]

volumes:
  pgdata:
  redisdata:
```

### Scaling Thresholds

| Component | Phase 1 (< 10 tenants) | Phase 2 (10–50) | Phase 3 (50+) |
|---|---|---|---|
| DB Connections | Direct pool (max 5/tenant) | PgBouncer required | PgBouncer + read replicas |
| Caching | Redis single instance | Redis Sentinel | Redis Cluster |
| Background Jobs | BullMQ + 1 worker | BullMQ + 3 workers | Dedicated worker fleet |
| App Servers | 1 instance | 2 (active-active) | Auto-scaling group |
| Monitoring | Pino logs | Logs + Prometheus | Full APM (Datadog/Grafana) |

---

## 📋 PRE-FLIGHT CHECKLIST (Run before every PR merge)

### Database
- [ ] Every table has `id` (serial PK) + `uuid` (text, unique)
- [ ] Every table spreads `...auditColumns`
- [ ] `created_by_uuid` / `updated_by_uuid` set in service — NOT from client input
- [ ] Soft delete via `is_deleted = true` (never hard DELETE in production)
- [ ] Table name ends with `_v2` suffix
- [ ] All column names use `snake_case`
- [ ] Indexes on: `uuid`, `is_deleted`, FK columns, frequent WHERE columns
- [ ] Partial index on `is_deleted = false` for active-row queries
- [ ] No `jsonb` columns — normalize into proper tables
- [ ] Files stored with `file_name`, `file_data`, `file_size`, `mime_type`
- [ ] `file_data` excluded from list queries
- [ ] Every FK uses `.references()` with explicit `onDelete` behavior
- [ ] No N+1 queries — use `inArray()` batch or JOINs

### Backend
- [ ] All new code under `server/v2/<module>/`
- [ ] Every repository uses `getDb()` — never direct `db` or `pool` import
- [ ] Controllers have ZERO business logic
- [ ] Services have ZERO `req`/`res` references
- [ ] Repositories have ZERO business rules
- [ ] All request bodies validated with Zod
- [ ] Custom error classes used (never raw `new Error()`)
- [ ] Errors propagate to `globalErrorHandler` (never caught in controllers)
- [ ] Slow operations queued via BullMQ (not inline)
- [ ] New migration file created (existing files NOT modified)
- [ ] Routes mounted in `server/routes.ts`

### Security
- [ ] Every route has `requireRole()` middleware
- [ ] Rate limiting applied to all public endpoints
- [ ] No DB errors or stack traces in API responses
- [ ] No secrets hardcoded — all from `process.env` via `env.ts`
- [ ] Input sanitized and validated before DB insert

### Frontend
- [ ] Module lives in `client/src/modules/<module>/`
- [ ] API calls use `apiRequest()` — never raw fetch with manual headers
- [ ] Data fetching uses TanStack Query (never useState + useEffect)
- [ ] Forms use React Hook Form + Zod
- [ ] UI uses `shadcn/ui` components only
- [ ] Route registered with `<ProtectedRoute>` + correct `requiredRole`
- [ ] Module lazy-loaded + wrapped in `<ModuleErrorBoundary>`
- [ ] Every `useMutation` has an `onError` handler with user feedback

### Multi-Tenancy
- [ ] Repository uses `getDb()` — not direct pool
- [ ] Cache keys use `tenantCacheKey()` prefix
- [ ] No `tenant_id` column in tables (isolation is DB-level)
- [ ] Tested with at least 2 different tenant IDs
- [ ] Audit logs include `tenantId` context

### Tests
- [ ] Integration tests cover: 200, 201, 400, 401, 403, 404 status codes
- [ ] Service unit tests cover happy path + all error branches
- [ ] Tests use isolated tenant (`createTestTenant()`)
- [ ] No tests share state between suites

---

## ❌ DON'T LIST (Hard Stops — These Block Merge)

| # | ❌ Never Do | ✅ Do Instead |
|---|---|---|
| 1 | Add routes without `requireRole()` | Every route declares minimum role |
| 2 | Return unbounded lists | Always use `normalizePagination()` |
| 3 | Use `console.log` in server code | Use `req.log.info/error()` from Pino |
| 4 | Write audit logic in controllers | Call `auditService.log()` from service |
| 5 | Create cache keys without tenant scope | Always prefix with `tenantCacheKey()` |
| 6 | Open unlimited DB connections per tenant | `max: 5` per pool + PgBouncer |
| 7 | Call slow APIs inline in request cycle | Queue via BullMQ, return 202 |
| 8 | Skip error boundaries on lazy routes | Every lazy route = `<ModuleErrorBoundary>` |
| 9 | Test against shared tenant | `createTestTenant()` per test suite |
| 10 | Deploy without `/api/health` check | Health check verifies DB + Redis |
| 11 | Add business logic to controllers | Move to service layer |
| 12 | Reference `req`/`res` in services | Services are pure — no HTTP context |
| 13 | Use `any` types in TypeScript | Use proper types or `unknown` + type guard |
| 14 | Modify existing migration files | Always create new migration file |
| 15 | Hard DELETE in production | `is_deleted = true` soft delete only |
| 16 | Throw raw `new Error()` in services | Use `NotFoundError`, `ValidationError`, etc. |
| 17 | Catch errors in controllers | Let `globalErrorHandler` handle all errors |
| 18 | Expose stack traces in API responses | Sanitize in `globalErrorHandler` |
| 19 | Write to multiple tables without transaction | Use `withTransaction()` |
| 20 | Boot without env var validation | Validate all env vars in `env.ts` at startup |
| 21 | Use `// @ts-ignore` or `as any` | Fix the type or use `unknown` + type guard |
| 22 | Define BullMQ jobs without retry config | Set `attempts`, `backoff`, `removeOnFail` |
| 23 | `useMutation` without `onError` | Every mutation has `onError` with toast |
| 24 | Return `null` for expected records | Throw `NotFoundError` — never return null |
| 25 | Use `jsonb` for structured data | Normalize into relational tables |
| 26 | FK columns without `.references()` | Every FK uses `.references()` + `onDelete` |
| 27 | Tables without indexes on filter columns | Index every FK + WHERE column |
| 28 | Include `file_data` in list queries | Fetch `file_data` only on single-record GET |
| 29 | Query in loops (N+1) | Use `inArray()` batch or JOINs |
| 30 | Redefine audit columns per table | Always spread `...auditColumns` |

---

## 🔢 STEPWISE IMPLEMENTATION PHASES

### PHASE 1 — Project Skeleton (Current Step)

**Goal:** Working project structure, no feature code yet.

1. Initialize monorepo with root `package.json`
2. Scaffold `client/` with Vite + React + TypeScript + Tailwind
3. Scaffold `server/` with Express + TypeScript
4. Scaffold `shared/` package with path aliases
5. Create `env.ts` with Zod validation for ALL env vars
6. Set up Docker Compose with Postgres + Redis + PgBouncer
7. Create master DB + `tenants` table migration
8. Implement `tenantConnectionManager.ts`
9. Implement JWT auth middleware (`authenticate.ts`, `requireRole.ts`)
10. Implement `globalErrorHandler.ts` + custom error classes
11. Implement `queryClient.ts` + `apiRequest()` on frontend
12. Set up `/api/health` endpoint
13. Set up Pino logging with tenant context
14. Create `ModuleErrorBoundary` + `ProtectedRoute` components
15. Wire up `migrationRunner.ts` on server start

**Deliverable after Phase 1:** Running app skeleton with auth, tenant isolation, error handling, and observability — zero feature code.

---

### PHASE 2 — UI Design (Using Screenshots)

**Goal:** Build UI shell and design system before any real data.

1. After Phase 1 is running, take screenshots of the skeleton
2. Provide screenshots to Claude for UI design iteration
3. Design: App shell (sidebar, topbar, breadcrumbs)
4. Design: Auth pages (login, forgot password, reset)
5. Design: Dashboard skeleton with metric cards
6. Design: Data table component (pagination, sort, filter)
7. Design: Form layouts (create/edit modals)
8. Design: Error states (404, 403, network error)
9. Confirm design system tokens (colors, spacing, typography)

---

### PHASE 3 — Core Domain Modules

**Goal:** First feature module end-to-end using the established patterns.

1. Define domain entities and bounded contexts
2. Create Drizzle schema + migration for Module 1
3. Build repository → service → controller → routes
4. Build frontend module (hooks → components → pages)
5. Add BullMQ jobs for async operations
6. Add Redis caching for list endpoints
7. Write integration + unit tests
8. Run pre-flight checklist

---

### PHASE 4 — Production Hardening

**Goal:** Ready for first real tenant.

1. PgBouncer configuration for production
2. Rate limiting per tenant (Redis-backed)
3. Automated migration pipeline in CI/CD
4. Monitoring: Prometheus metrics + Grafana dashboard
5. Alerting: PagerDuty/Slack for 5xx rate, queue depth, DB lag
6. Backup: Automated per-tenant DB snapshots
7. Security audit: OWASP checklist pass
8. Load test: Simulate 10 concurrent tenants

---

## 🧠 SENIOR ARCHITECT NOTES & ADDITIONS TO STANDARD SPEC

The following are deliberate improvements over the base architecture reference:

1. **Versioned from day 1**: All code under `server/v2/` even though it's fresh. When you need `v3` in 18 months, you won't be doing a painful migration.

2. **Shared package is the contract**: `shared/v2/<module>/` contains types, validators, and schema. Frontend and backend import from here — this is the single source of truth. Drift between layers is impossible.

3. **`env.ts` is the boot gate**: The app REFUSES to start if any required env var is missing or malformed. No "undefined" surprises deep in a request handler.

4. **BullMQ from day 1**: Even if you don't need it immediately, having the worker infrastructure set up means you never inline a slow operation "just this once."

5. **PgBouncer in dev Docker Compose**: Developers learn the connection limits early. You don't discover connection exhaustion when you go from 2 tenants to 20.

6. **`normalizePagination()` is a hard gate**: Lists NEVER return unbounded results. Max page size is set at the utility level — no feature can accidentally OOM the server.

7. **`withTransaction()` wrapper**: Multi-table writes are always transactional. The pattern is discoverable in the repo — developers naturally use it instead of writing their own.

8. **Soft deletes only**: `is_deleted = true`. This is non-negotiable for a SaaS product — tenants will ask "where did my data go?" within the first month.

9. **File metadata + lazy fetch**: Large base64 files in list queries have killed production databases. Exclude `file_data` from all list queries — fetch it only on single-record GET.

10. **Phase 2 is screenshot-driven UI**: Build the skeleton first, then iterate the UI visually using screenshots. This prevents over-engineering the UI before the data model is stable.

---

*Document Version: 1.0 — production.so Fresh Start*
*Architecture Owner: Senior System Architect*
*Next Review: After Phase 1 completion*