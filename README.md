# Production-SaaS-Architecture

A production-ready, multi-tenant SaaS application skeleton built with modern web technologies and a strict modular architecture.

## 🏗️ Tech Stack

- **Frontend**: React.js (Vite), TailwindCSS, Shadcn/UI, React Query
- **Backend**: Node.js (Express), Drizzle ORM, PostgreSQL
- **Caching**: Redis (Optional but recommended)
- **Background Jobs**: BullMQ
- **Infrastructure**: Docker, Nginx, PostgreSQL (Database-per-tenant)

## 🏢 Multi-Tenancy Architecture

This platform implements a **database-per-tenant** isolation strategy. Each tenant has their own isolated PostgreSQL database, managed via a master database that stores tenant metadata and encrypted connection strings.

- **Master DB**: Stores tenants, domains, and encrypted `db_url` values.
- **Tenant DB**: Stores users, roles, tasks, and application-specific data for that tenant.

## 🚀 Quick Start Commands

| Action               | Command                                    | Example                                                            |
| :------------------- | :----------------------------------------- | :----------------------------------------------------------------- |
| **Install**          | `npm install`                              |                                                                    |
| **Run Dev**          | `npm run dev`                              |                                                                    |
| **Provision Tenant** | `npm run tenant:create`                    | `npm run tenant:create -- --name "Acme" --domain "acme.localhost"` |
| **Run Migrations**   | `npm run db:migrate`                       |                                                                    |
| **Seed Test Data**   | `npm run db:seed`                          |                                                                    |
| **Encrypt DB URLs**  | `npx tsx scripts/encryptExistingDbUrls.ts` |                                                                    |
| **Run Tests**        | `npm test`                                 |                                                                    |
| **Lint & Format**    | `npm run lint:fix`                         |                                                                    |

## 🛠️ Management & Operations

### Adding a New Tenant

Provision a database and an admin account for a new client:

```bash
npm run tenant:create -- --name "Acme Corp" --domain "acme.localhost" --email "admin@acme.com"
```

### Encrypting Sensitive Data

Ensure all tenant database URLs are encrypted at rest in the master database:

```bash
# Verify encryption status and apply if needed
npx tsx scripts/encryptExistingDbUrls.ts
```

### Database Migrations

The system handles multi-tenant migrations automatically. To run them manually:

```bash
# Runs migrations on Master and the Default Tenant (dev)
npm run db:migrate
```

## 🧪 Quality & Reliability

- **Automated Testing**: Comprehensive test suite using Vitest (Unit) and Supertest (Integration).
- **Security**: AES-256-GCM encryption for sensitive data, RBAC middleware, and token-based authentication.
- **Observability**: Health diagnostics for DB, Redis, and overall system status.

## 🛡️ Production Readiness

Before going live, review the **[Production Security Checklist](./PRODUCTION_CHECKLIST.md)** and the latest **[Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)**. For local setup, see **[Getting Started Guide](./GETTING_STARTED.md)**.
