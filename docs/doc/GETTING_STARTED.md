# Getting Started Guide

This document provides step-by-step instructions to set up and run the **Production SaaS Architecture** project on your local machine.

## Prerequisites

- **Node.js**: v20.0.0 or higher
- **PostgreSQL**: Installed and running
- **Redis** (Optional): For caching and background jobs. Controlled by `REDIS_ENABLED`.

---

## 1. Database Setup

The project uses a **database-per-tenant** architecture. You need to create at least two databases:

1.  **Master Database**: Manages tenant registrations and global settings.
2.  **Tenant Database**: A dedicated database for the development tenant.

```sql
CREATE DATABASE master_db;
CREATE DATABASE tenant_db;
```

---

## 2. Environment Configuration

1.  Copy the example environment file:

    ```bash
    cp .env.example .env.development
    ```

2.  Open `.env.development` and update the connection strings:

    ```env
    # Database — Master
    MASTER_DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/master_db

    # Database — Default Tenant (dev only)
    DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/tenant_db
    ```

3.  **Generate an Encryption Key** (CRITICAL):
    The system encrypts tenant database URLs at rest using AES-256-GCM.
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
    Copy the 64-character output and set it as `ENCRYPTION_KEY` in your `.env.development`.

---

## 3. Tenant Provisioning & Encryption

### Provisioning a New Tenant

To add a new tenant to the system, use the provisioning script:

```bash
npm run tenant:create -- --name "Acme Corp" --domain "acme.localhost" --email "admin@acme.com"
```

This script automatically:

1. Creates the tenant database.
2. Runs all required migrations.
3. Registers the tenant in the master DB with an **encrypted** `db_url`.
4. Creates an initial admin user for the tenant.

### Encrypting Existing DB URLs

If you have unencrypted (plaintext) `db_url` values in your `tenants` table, run the migration script:

```bash
npx tsx scripts/encryptExistingDbUrls.ts
```

---

## 4. Application Initialization

Run the following commands to set up the schema and create initial test data:

```bash
# 1. Install dependencies
npm install

# 2. Run migrations
npm run db:migrate

# 3. Seed test data
npm run db:seed
```

---

## 5. Running & Testing

### Development Mode

Starts the Backend (Express) and Frontend (Vite) concurrently:

```bash
npm run dev
```

- **App URL**: [http://localhost:5005](http://localhost:5005)
- **Health Check**: [http://localhost:5005/api/v2/health](http://localhost:5005/api/v2/health)

### Testing

The project uses Vitest for unit and integration testing.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 🛠️ Common Scripts

| Command                                    | Description                     | Example Usage                                                      |
| :----------------------------------------- | :------------------------------ | :----------------------------------------------------------------- |
| `npm run dev`                              | Starts server and client (Vite) | `npm run dev`                                                      |
| `npm run tenant:create`                    | Provisions a new tenant DB      | `npm run tenant:create -- --name "Acme" --domain "acme.localhost"` |
| `npm run db:migrate`                       | Runs SQL migrations             | `npm run db:migrate`                                               |
| `npm run db:seed`                          | Populates test data             | `npm run db:seed`                                                  |
| `npm run build`                            | Builds for production           | `npm run build`                                                    |
| `npm test`                                 | Runs all tests (Vitest)         | `npm test`                                                         |
| `npm run lint`                             | Runs ESLint checks              | `npm run lint`                                                     |
| `npm run lint:fix`                         | Fixes linting/formatting        | `npm run lint:fix`                                                 |
| `npx tsx scripts/encryptExistingDbUrls.ts` | Encrypts legacy DB URLs         | `npx tsx scripts/encryptExistingDbUrls.ts`                         |
