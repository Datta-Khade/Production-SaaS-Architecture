# AGENTS.md — AI Agent Rules of Engagement

> [!IMPORTANT]
> This file is the primary instruction set for AI agents (Claude, Antigravity, etc.) working on this repository.
> Every rule here is derived from the project's Core Architecture (`standard_architecture.md`) and must be followed without exception to maintain production stability and multi-tenant security.

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

### File Locations (v2 Standard)
- **Backend**: `server/modules/<module>/` (controller.ts, service.ts, repository.ts, routes.ts)
- **Shared**: `shared/modules/<module>/` (schema.ts, types.ts, validators.ts)
- **Frontend**: `client/src/modules/<module>/` (pages/, components/, hooks/)

---

## 🗄️ DATABASE & MULTI-TENANCY

### The Golden Rule of DB Access
Always use `getDb()` to get a tenant-aware Drizzle instance.
```typescript
// ✅ CORRECT
import { getDb } from "../../db";
const db = getDb(); // Automatically resolves tenant from request context

// ❌ WRONG
import { db } from "server/db"; // Bypasses tenant isolation!
```

### Table Requirements
Every table must include:
- `id`: Serial primary key (internal use).
- `uuid`: Text unique identifier (public/API use).
- `...auditColumns`: Always spread `created_at`, `updated_at`, `created_by_uuid`, `updated_by_uuid`, `is_deleted`.
- **Soft Delete**: Use `is_deleted = true`. Never hard delete production data.

### Migrations
- Format: `migrations/NNNN_snake_case_description.sql`.
- Rule: Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- Note: Migrations run automatically on startup or first tenant connection.

---

## 🔒 SECURITY & AUTHENTICATION

### RBAC (Role-Based Access Control)
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

## ❌ THE "DON'T" LIST (Hard Stops)

1. **NO Business Logic in Controllers**: Controllers should be < 50 lines.
2. **NO N+1 Queries**: Use `inArray` or JOINs.
3. **NO console.log**: Use `req.log.info()` or `req.log.error()` (Pino).
4. **NO Raw SQL**: Use Drizzle's typed query builder.
5. **NO Shared State in Tests**: Each test suite must use `createTestTenant()`.
6. **NO Unvalidated Env**: All env vars must be validated via Zod in `env.ts`.

---

## 🛠️ WORKFLOW FOR NEW MODULES

1. **Schema**: Define Drizzle schema in `shared/modules/<module>/schema.ts`.
2. **Migration**: Create `.sql` migration file.
3. **Types**: Generate Zod validators and TypeScript types.
4. **Data Layer**: Build Repository using `getDb()`.
5. **Logic Layer**: Build Service (wrap multi-table writes in `withTransaction`).
6. **API Layer**: Build Controller and register routes with `requireRole`.
7. **Frontend**: Create UI using `shadcn/ui` and `apiRequest()`.

