# AGENTS.md — Standard Rules for AI Agents & Developers

> [!IMPORTANT]
> This file is the primary instruction set for AI agents (Claude, Antigravity, etc.) working on this repository.
> Every rule here is derived from the project's Core Architecture (`standard_architecture.md`) and must be followed without exception to maintain production stability and multi-tenant security.

---

## 🏗️ Project Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Vite) |
| **Backend** | Node.js (Express) |
| **Database** | PostgreSQL (via Drizzle ORM) |
| **Caching** | Redis |
| **Background Jobs** | BullMQ |

---

## 🎯 PRIME DIRECTIVES

1. **Multi-Tenancy First**: This is a **database-per-tenant** SaaS. Never assume a single database unless in Replit/dev mode.
2. **Layered Isolation**: Strict separation between Controller (HTTP), Service (Logic), and Repository (Data).
3. **Tenant Security**: All data access MUST be scoped via `getDb()` from `server/modules/db.ts`. Direct pool imports are strictly forbidden.
4. **Idempotent Migrations**: Never modify existing migrations. Always create new, idempotent `.sql` files.

---

## 🏛️ ARCHITECTURE STANDARDS

### Layer Responsibilities

| Layer | Responsibility | Forbidden Actions |
| :--- | :--- | :--- |
| **Controller** | HTTP Request/Response, Pagination normalization | Business logic, direct DB queries, throwing raw errors |
| **Service** | Pure Business Logic, Transaction Orchestration | Referencing `req`/`res`, HTTP status codes, direct SQL |
| **Repository** | Data Retrieval/Persistence (Drizzle) | Business rules, checking permissions, HTTP context |

### File Locations (Modular Standard)
- **Backend**: `server/modules/<module>/` (controller.ts, service.ts, repository.ts, routes.ts)
- **Shared**: `shared/modules/<module>/` (schema.ts, types.ts, validators.ts)
- **Frontend**: `client/src/modules/<module>/` (pages/, components/, hooks/)

---

## 🗄️ DATABASE RULES

### Multi-Tenancy
- The system uses **database-per-tenant** isolation. Every tenant has their own PostgreSQL database.
- **NEVER** add a `tenant_id` column to any table — isolation is at the DB level.
- **NEVER** read tenant headers manually in modules — middleware handles this.

### DB Connection
- Always use `getDb()` from `server/modules/db.ts` in repositories — this returns the correct tenant-scoped Drizzle instance.
- **NEVER** import `pool` or `db` directly from `server/db.ts` — doing so bypasses tenant isolation.
- **NEVER** use raw SQL strings — always use Drizzle's typed query builders.

```typescript
// ✅ CORRECT
import { getDb } from "../../db";
const db = getDb(); // resolves correct tenant DB automatically

// ❌ WRONG
import { db } from "server/db"; // bypasses tenant context
```

### Schema & Migrations
- Every table must be defined in `shared/modules/schema/` or `shared/modules/<module>/schema.ts`.
- Every table must have a migration file under `migrations/tenant/NNNN_*.sql`.
- Use `drizzle-zod` (`createInsertSchema`) to auto-generate Zod schemas.
- Migrations apply **automatically on startup** — never run them manually with `psql`.
- **NEVER** modify an existing migration file — always create a new one.
- **NEVER** delete migration files.
- Migration file naming: `NNNN_short_description.sql` (4-digit zero-padded, `snake_case`).
- Always use `IF NOT EXISTS` in migrations to make them idempotent.
- One migration per logical change — never bundle unrelated changes.

### Audit Columns (Required on ALL Tables)
Every table **MUST** spread `...auditColumns` from `shared/modules/schema/audit.ts`.

| Column | Type | Rule |
|---|---|---|
| `created_at` | `timestamp` | Set once at insert — **never updated** |
| `updated_at` | `timestamp` | Updated on **every** PATCH/PUT |
| `created_by_uuid` | `text` | Set by repository — never from client input |
| `updated_by_uuid` | `text` | Set by repository — never from client input |
| `is_deleted` | `boolean` (default `false`) | Soft delete — **never hard DELETE** |

### Table Schema Standard
- Every table must have `id` (serial PK) + `uuid` (text, unique, auto-generated).
- All column names use `snake_case`.
- **No `json` / `jsonb` columns** — normalize into proper relational tables.
- **No hard DELETE** — use `is_deleted = true` soft delete.

### Mandatory Indexes (Every Table)
```sql
CREATE INDEX idx_<table>_uuid       ON <table>(uuid);
CREATE INDEX idx_<table>_created_at ON <table>(created_at);
CREATE INDEX idx_<table>_active     ON <table>(is_deleted) WHERE is_deleted = false;
```
- Every FK column (`*_uuid`) **MUST** have a dedicated index.
- Create composite indexes for frequent multi-column query patterns.
- **NEVER** create indexes you don't query — unused indexes slow writes.

### Foreign Keys
- Every relationship **MUST** use a proper FK constraint referencing the `uuid` column of the parent.
- Column naming: `<parent_entity>_uuid` (e.g., `user_uuid`).
- Always declare `onDelete` behavior explicitly (`cascade`, `restrict`, or `set null`).

### File Storage
- Files are stored as **base64-encoded text** directly in PostgreSQL for small attachments (< 5MB).
- Always include `file_name`, `file_data`, `file_size`, and `mime_type` columns together.
- Use `text` column type for `file_data` — NOT `bytea`.
- **Exclude `file_data` from list/getAll queries** — fetch base64 only on single-record GET.
- Validate `mime_type` against an allow-list before saving.

### N+1 Prevention
- **NEVER** execute a DB query inside a `for` / `forEach` / `map` loop.
- Use `inArray()` for batch loading related records.
- Use `LEFT JOIN` for single-query parent+child fetches.

### Transactions
- Any operation writing to **2+ tables** MUST be wrapped in `withTransaction()`.
- Pass the `tx` object into repositories — never call `getDb()` inside a transaction callback.
- Transactions auto-rollback on any thrown error — do not manually catch inside `withTransaction`.

---

## 🔒 SECURITY RULES

### Role-Based Access Control (RBAC)
- Every route in `routes.ts` **MUST** have an explicit `requireRole()` middleware.
- **Hierarchy**: `admin` > `manager` > `user` > `viewer`.
- **Defaults**: GET (`viewer`), POST/PATCH (`user`), DELETE (`admin`).

### Headers
- `x-tenant-id`: Required for all API calls.
- `Authorization`: Bearer `<token>` required for all protected routes.

---

## 🚨 ERROR HANDLING & API RESPONSES

### Error Classes
Never throw raw `new Error()`. Use typed subclasses:
- `NotFoundError`, `ValidationError`, `ForbiddenError`, `ConflictError`, `AppError`.

### Response Envelope
Every successful response must follow the envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 10 } // for lists
}
```

---

## 📊 OBSERVABILITY & JOBS

- **Logging**: Always use `req.log.info/error()` from `pino` — **NEVER** `console.log`.
- **Audit**: Every write operation (create/update/delete) MUST call `auditLog.track()` from the service layer.
- **Jobs**: Never send emails or process heavy tasks inline — queue via BullMQ and return `202 Accepted`.

---

## ❌ THE "DON'T" LIST (Hard Stops)

1. **NO Business Logic in Controllers**: Controllers should be < 2000 lines.
2. **NO Business Logic in Frontend**: All transformations and rules belong in the Service layer.
3. **NO N+1 Queries**: Use `inArray` or JOINs.
4. **NO console.log**: Use `req.log.info()` or `req.log.error()` (Pino).
5. **NO Raw SQL**: Use Drizzle's typed query builder.
6. **NO Shared State in Tests**: Use `createTestTenant()`.
7. **NO Unvalidated Env**: All env vars must be validated via Zod in `env.ts`.
8. **NO Hard DELETE**: Use `is_deleted = true` soft delete.
9. **NO routes without `requireRole()`**: Every route must have a minimum role.

---

## 🛠️ WORKFLOW FOR NEW MODULES

1. **Schema**: Define Drizzle schema in `shared/modules/<module>/schema.ts` (or `shared/modules/schema/`).
2. **Migration**: Create `.sql` migration file in `migrations/tenant/`.
3. **Types**: Generate Zod validators and TypeScript types.
4. **Data Layer**: Build Repository using `getDb()`.
5. **Logic Layer**: Build Service (wrap multi-table writes in `withTransaction`).
6. **API Layer**: Build Controller and register routes with `requireRole`.
7. **Frontend**: Create UI using `shadcn/ui` and `apiRequest()`.
