# Production-Readiness Report

## SAIL — Multi-Tenant SaaS Platform (React + Express + PostgreSQL)

> **Date:** May 05, 2026
> **Type:** Read-only analysis — no code changes were made
> **Overall Score: 5.5 / 10**

---

## Table of Contents

1. [Project Understanding](#1-project-understanding)
2. [Structure Analysis](#2-structure-analysis)
3. [Dependency Audit](#3-dependency-audit)
4. [Environment & Configuration](#4-environment--configuration)
5. [Error Handling & Logging](#5-error-handling--logging)
6. [Security Audit](#6-security-audit)
7. [Testing Coverage](#7-testing-coverage)
8. [CI/CD & Deployment Readiness](#8-cicd--deployment-readiness)
9. [Performance & Scalability](#9-performance--scalability)
10. [Code Quality](#10-code-quality)
11. [Documentation](#11-documentation)
12. [Top 5 Changes Required Before Go-Live](#top-5-changes-required-before-go-live)
13. [Suggested Order of Work](#suggested-order-of-work)

---

## 1 — Project Understanding

**Tech Stack:** TypeScript throughout.

| Layer        | Technologies                                                                    |
| ------------ | ------------------------------------------------------------------------------- |
| **Backend**  | Node.js 20, Express 4, Drizzle ORM, PostgreSQL (pg), Pino, BullMQ/Redis, Zod    |
| **Frontend** | React 18, Vite 5, TailwindCSS, AG Grid Enterprise, React Query, React Router v6 |
| **Shared**   | Drizzle schemas, Zod validators, custom error classes, isomorphic encryption    |

**Folder Structure:**

| Directory            | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `client/`            | React frontend (Vite root)                                             |
| `server/`            | Express backend (entry: `index.ts`)                                    |
| `server/modules/`    | Feature modules: auth, users, tasks, health, access_control            |
| `server/middleware/` | auth, rateLimiter, tenant, errorHandler, requestLogger                 |
| `server/lib/`        | Shared server utilities: cache, redis, logger, email, pagination       |
| `shared/`            | Isomorphic: Drizzle schemas, Zod validators, error classes, encryption |
| `migrations/master/` | SQL migrations for the master (tenant registry) DB                     |
| `migrations/tenant/` | SQL migrations for each tenant DB                                      |
| `workers/`           | BullMQ email worker (separate process)                                 |
| `scripts/`           | Admin tooling: createTenant, seed, recreate_dbs                        |
| `infra/`             | DB init SQL                                                            |

**Entry Points:** `server/index.ts` (backend + Vite middleware dev), `client/src/main.tsx` (frontend).

---

## 2 — Structure Analysis

**Overall: Good** — the architecture is clean and modular with strong separation of concerns (routes → controllers → services → repositories), consistently applied. The `shared/` layer for isomorphic code is well-designed.

### Issues

| Severity  | Location                                  | Description                                                                                 |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| 🟡 Medium | `server/check_menus.ts`                   | Appears to be a debug/scratch file left in the server root; does not fit the module pattern |
| 🟡 Medium | `workers/email/processor.ts`              | Uses `console.log` instead of the Pino logger — inconsistent with the rest of the codebase  |
| 🟡 Medium | `server/modules/users/service.ts` line 36 | Uses `data: any` — breaks the typed service contract established elsewhere                  |
| 🟡 Medium | `server/modules/users/service.ts` line 39 | Hardcoded default password `'Welcome@123'` inline in business logic                         |
| 🟢 Low    | `migrations/tenant/`                      | Starts at `0002_` — `0001_` is missing, which could cause confusion in migration sequence   |

---

## 3 — Dependency Audit

**Overall: Good** — dependencies are generally current and well-chosen. No obviously deprecated packages. Items to flag:

| Package                    | Issue                                                                                                                                                                                                          | Priority    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `crypto-js`                | Used for AES on both client and server. On the server, Node's built-in `crypto` (AES-256-GCM) is more secure and performant. `crypto-js` is a JS implementation that is slower and less audited for server use | 🟠 High     |
| `drizzle-orm ^0.29.3`      | Latest is 0.41+. Major API changes at 0.30+                                                                                                                                                                    | 🟡 Medium   |
| `pino-pretty`              | Should be `devDependencies` only — having it in `dependencies` bloats production build                                                                                                                         | 🟡 Medium   |
| `ag-grid-enterprise`       | Enterprise license key appears to be stored in `.env copy.development` in plaintext                                                                                                                            | 🔴 Critical |
| `react-router-dom ^6.22.1` | v7 is stable — upgrade path available                                                                                                                                                                          | 🟢 Low      |
| `vitest ^1.3.0`            | Latest is 3.x — significant improvements                                                                                                                                                                       | 🟢 Low      |
| `bcryptjs`                 | Consider `bcrypt` (native bindings, 3–5× faster) for production scale                                                                                                                                          | 🟢 Low      |

**Note on crypto-js duplication:** Both `crypto-js` and Node's native `crypto` module are used in the same codebase (`hashToken` uses `crypto-js SHA256`, while `crypto.randomBytes` is available natively). Mixing two crypto libraries increases attack surface and creates inconsistent security guarantees.

---

## 4 — Environment & Configuration

**Overall: Fair** — environment separation is architecturally intended but has critical implementation gaps.

### Issues

| Severity    | Location                                           | Description                                                                                                                                                              |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🔴 Critical | `migrations/master/0006_default_tenant.sql` line 8 | Hardcoded PostgreSQL connection string `postgresql://postgres:sailadmin@postgres:5432/tenant_db` is baked into source control and applied to every environment           |
| 🔴 Critical | `.env copy.development`                            | AG Grid Enterprise license key committed to repo. File should be renamed and added to `.gitignore`                                                                       |
| 🟠 High     | `migrations/tenant/0014_default_admin.sql`         | Inserts a bcrypt hash for password `Admin@1234`. Since the hash is in source control, a known-password admin account exists in every tenant DB unless explicitly removed |
| 🟡 Medium   | `server/env.ts`                                    | The `DATABASE_URL` fallback fix mutates `envData` after Zod validation — bypasses immutability intent. Better to set the env var before validation                       |
| 🟡 Medium   | `NODE_ENV`                                         | `staging` is referenced in the Zod schema but not handled anywhere in configuration logic                                                                                |
| 🟢 Low      | `.env copy.development` filename                   | The space in the filename is fragile across shells and CI systems. Rename to `.env.development.example`                                                                  |

---

## 5 — Error Handling & Logging

**Overall: Strong** — error handling is one of the best parts of this codebase.

### Strengths

- Global error handler correctly differentiates operational vs. unexpected errors and never leaks stack traces to clients
- `process.on('uncaughtException')` and `process.on('unhandledRejection')` registered in `server/index.ts`
- Structured Pino logging with field redaction for `authorization`, `cookie`, `password`, `token`
- Request correlation IDs via `x-request-id` header
- Tenant ID and user ID attached to every log line automatically
- Custom typed error classes (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RateLimitError`) in `shared/modules/errors/`

### Issues

| Severity  | Location                                  | Description                                                                                                                                                                                                      |
| --------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟠 High   | `server/index.ts` lines 20–28 and 118–125 | `uncaughtException` and `unhandledRejection` event handlers are registered **twice** — once at the top level and again inside the `start()` function. The second registration conflicts with/overrides the first |
| 🟡 Medium | `workers/email/processor.ts`              | Uses `console.log/error` instead of the Pino logger — worker errors won't be structured or correlated with request context                                                                                       |
| 🟡 Medium | `server/middleware/globalErrorHandler.ts` | The `requestId` is logged server-side but not included in the JSON error response body — makes client-side correlation harder                                                                                    |

---

## 6 — Security Audit

**Overall: Fair** — above-average for the pattern used, but several issues must be resolved before production.

### Issues

| Severity    | Location                                       | Description                                                                                                                                                               |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 Critical | `server/middleware/auth.ts` lines 65–75        | `AUTH_BYPASS=true` grants `superadmin` to any request with zero auth. Only gated by `NODE_ENV === 'development'` — which is itself an env var that could be misconfigured |
| 🟠 High     | `server/app.ts`                                | `origin: true` in non-production CORS reflects any origin. If the dev server is accidentally exposed via a tunnel, this is a fully open CORS policy                       |
| 🟠 High     | `server/middleware/rateLimiter.ts` lines 53–55 | Fails **open** when Redis is unavailable — brute-force protection disappears silently on auth endpoints                                                                   |
| 🟠 High     | `server/modules/auth/routes.ts` line 21        | Login route is missing `requireTenant` middleware — tenant resolution happens inside the service from an unchecked body field                                             |
| 🟠 High     | `shared/modules/lib/encryption.ts`             | `CryptoJS.AES.encrypt(plaintext, key)` with a string key uses an MD5-based KDF, not AES-256-GCM. Server-side encryption is weaker than the comments imply                 |
| 🟠 High     | `shared/modules/schema/tenants.ts`             | `db_url` column stores full PostgreSQL connection strings (including passwords) as unencrypted plaintext in the master DB                                                 |
| 🟡 Medium   | `server/middleware/tenant.ts`                  | `x-tenant-id` / `x-tenant-domain` headers are user-controllable — no cross-tenant ownership check verifies the authenticated user belongs to the requested tenant         |
| 🟡 Medium   | `shared/modules/validators/common.ts` line 80  | `sortBy` is accepted as any string up to 50 chars. If passed to a raw `ORDER BY` clause, this is a SQL injection vector — needs an allowlist                              |
| 🟡 Medium   | `server/modules/auth/controller.ts`            | Refresh cookie is `secure: false` in dev — acceptable for development, but must be enforced in production deployments                                                     |
| 🟢 Low      | `server/app.ts`                                | No CSRF token protection — mitigated by `SameSite: strict` on the refresh cookie for modern browsers, but worth noting                                                    |
| 🟢 Low      | `server/app.ts`                                | Helmet disables CSP in development — acceptable, worth noting for production review                                                                                       |

---

## 7 — Testing Coverage

**Overall: Critical Gap** — `vitest` is installed but there are no test files anywhere in the codebase.

### Issues

| Severity    | Description                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| 🔴 Critical | Zero test coverage — no unit tests, no integration tests, no e2e tests found in any directory |
| 🟡 Medium   | No `vitest.config.ts` — running `npm test` will execute with defaults and likely find nothing |
| 🟡 Medium   | No testing utilities, fixtures, or mocking setup in the repository                            |

This is the single largest gap before production use for any SaaS platform.

---

## 8 — CI/CD & Deployment Readiness

**Overall: Incomplete** — health checks and graceful shutdown are well implemented, but the automation pipeline is missing entirely.

### Strengths

- `/health` (simple alive) and `/api/v2/health` (DB + Redis status) endpoints correctly implemented
- Graceful shutdown on `SIGTERM`/`SIGINT` with a 10-second force-exit timeout
- `Dockerfile` exists

### Issues

| Severity  | Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 🟠 High   | No CI/CD pipeline — no GitHub Actions, no automated build/test/lint on push                                                          |
| 🟠 High   | `npm run lint` only runs `tsc --noEmit` — type checking is not linting; logic and style errors TypeScript accepts will not be caught |
| 🟡 Medium | No Prettier or formatter configured — code formatting is not enforced                                                                |
| 🟡 Medium | No `.dockerignore` — Docker build context would include `node_modules`, `dist`, `.git`, etc.                                         |

---

## 9 — Performance & Scalability

**Overall: Good foundations, some gaps** — the core architecture is horizontally scalable with tenant isolation and Redis caching designed in from the start.

### Strengths

- Redis sliding-window rate limiter is efficient for multi-instance deployments
- Per-tenant DB connection pool caching in `server/modules/db.ts`
- Pagination consistently implemented via `server/lib/pagination.ts`
- `SCAN` used instead of `KEYS` in `cacheInvalidatePattern` — correct Redis practice for production
- BullMQ email worker runs as a separate process — correct separation of concerns

### Issues

| Severity  | Location                                    | Description                                                                                                                                                                                                       |
| --------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟠 High   | `server/modules/tasks/repository.ts`        | `findAll` runs two sequential queries (data + `COUNT(*)`) on every list request. A single query with a window function would be more efficient at scale                                                           |
| 🟠 High   | `server/middleware/auth.ts`                 | Role hierarchy is cached in a module-level variable. In a multi-instance deployment, each process has its own cache and role changes take up to 5 minutes to propagate per-process. Redis-backed caching required |
| 🟡 Medium | `server/modules/tenantConnectionManager.ts` | Tenant migrations run lazily on first connection per process. In multi-instance deployments, concurrent migration races on the same tenant DB are possible                                                        |
| 🟡 Medium | `server/modules/db.ts`                      | Connection pool is hardcoded at 5 per tenant. With 100 active tenants, that is 500 open DB connections per process with no global cap                                                                             |

---

## 10 — Code Quality

**Overall: Good** — TypeScript `strict: true` is used throughout, the codebase is well-commented, and the layered structure is consistently applied.

### Issues

| Severity  | Location                                        | Description                                                                                                      |
| --------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 🟠 High   | `server/modules/users/service.ts` lines 36 & 64 | `data: any` breaks type safety at the service boundary — exactly where typed contracts matter most               |
| 🟡 Medium | `tsconfig.json`                                 | `noUnusedLocals: false` and `noUnusedParameters: false` — dead code and unused parameters are silently accepted  |
| 🟡 Medium | Project-wide                                    | No ESLint configured — `console.log` in production code, missing `await`, unreachable code, etc. won't be caught |
| 🟡 Medium | `server/check_menus.ts`                         | Appears to be a development debug file not referenced anywhere — should be removed                               |
| 🟡 Medium | `server/modules/users/service.ts` line 39       | Hardcoded default password `'Welcome@123'` — a security smell; password should be a required field               |

### Strengths

- `asyncHandler` wrapper is used consistently for all async Express handlers, preventing unhandled promise rejections in routes
- Soft deletes implemented across all major entities (`is_deleted`, `deleted_at`, `deleted_by_uuid`)
- Audit log tracking on all user mutations via `server/modules/lib/auditLog.ts`
- All paginated endpoints use a consistent `{ success, data, meta }` response envelope

---

## 11 — Documentation

**Overall: Fair** — internal code documentation is good; external/developer-facing documentation is minimal.

### Strengths

- `server/env.ts` effectively serves as environment variable documentation via the Zod schema with inline descriptions
- Migration files are clearly numbered and named with intent
- Complex functions have inline comments explaining the reasoning

### Issues

| Severity  | Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 🟠 High   | No API documentation — no Swagger/OpenAPI spec, no Postman collection. With 20+ endpoints, this is a critical onboarding gap         |
| 🟡 Medium | `README.md` is a 4-line stub linking to `GETTING_STARTED.md` — no architecture overview, no env var reference, no tech stack summary |
| 🟡 Medium | `GETTING_STARTED.md` only describes Docker / local Postgres setup, not the Replit or single-database dev path                        |

---

## Top 5 Changes Required Before Go-Live

| #   | Change                                                                                                                                                   | Priority    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | **Remove hardcoded DB credentials and default admin password from migration SQL** — parameterise via provisioning scripts instead                        | 🔴 Critical |
| 2   | **Add test coverage** — at minimum, integration tests for auth, tenant resolution, and all CRUD endpoints                                                | 🔴 Critical |
| 3   | **Replace `crypto-js` server-side with Node's native `crypto` (AES-256-GCM)** and encrypt tenant `db_url` values at rest in the master DB                | 🟠 High     |
| 4   | **Fix the duplicate `process.on` event handlers** and make the login rate limiter fail-closed (use a local in-memory fallback when Redis is unavailable) | 🟠 High     |
| 5   | **Add ESLint + CI/CD pipeline** (GitHub Actions: lint → type-check → test → build on every PR)                                                           | 🟠 High     |

---

## Suggested Order of Work

```
Week 1 — Security Foundations
  1. Remove hardcoded credentials from migrations (0006_default_tenant, 0014_default_admin)
  2. Fix duplicate process event handlers in server/index.ts
  3. Replace server-side crypto-js with native crypto (AES-256-GCM)
  4. Encrypt tenant db_url column in master DB
  5. Make rate limiter fail-closed on login endpoint

Week 2 — Quality Gates
  6. Add ESLint (eslint + @typescript-eslint + no-console rule for server/)
  7. Enable noUnusedLocals and noUnusedParameters in tsconfig.json
  8. Replace `any` types in server/modules/users/service.ts
  9. Remove server/check_menus.ts and other debug artifacts
  10. Add Prettier + enforce via pre-commit hook
  11. Move pino-pretty to devDependencies
  12. Add .dockerignore

Week 3 — Test Coverage
  13. vitest.config.ts + test utilities and fixtures
  14. Auth service unit tests (login, refresh, lockout, password change)
  15. Tenant resolution integration tests
  16. CRUD endpoint integration tests (tasks, users)
  17. Role-based access control tests

Week 4 — CI/CD + Documentation
  18. GitHub Actions pipeline (lint → type-check → test → build)
  19. OpenAPI/Swagger spec for all routes (or Postman collection)
  20. Expand README with architecture diagram and env var reference table
  21. Redis-backed role hierarchy cache (replace module-level variable)
  22. Connection pool global cap in server/modules/db.ts
```

---

_Report generated May 05, 2026. Analysis is read-only — no code changes were made to the repository._
