# Getting Started Guide

This document provides step-by-step instructions to set up and run the **Production SaaS Architecture** project on your local machine.

## Prerequisites

- **Node.js**: v20.0.0 or higher
- **PostgreSQL**: Installed and running
- **Redis** (Optional but recommended): For caching and background jobs

---

## 1. Database Setup

The project uses a **database-per-tenant** architecture. You need to create at least two databases:

1.  **Master Database**: Manages tenant registrations and global settings.
2.  **Tenant Database**: A dedicated database for the development tenant.

Run the following SQL commands in your PostgreSQL terminal:

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

3.  Generate an **Encryption Key** (required for secure data storage):
    Run this command in your terminal:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
    Copy the 64-character output and set it as `ENCRYPTION_KEY` in your `.env.development`.

4.  Set `JWT_SECRET` and `REFRESH_TOKEN_SECRET` to any secure random strings.

---

## 3. Database Initialization

Run the following commands to set up the schema and create initial test data:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Run migrations (creates tables in both master and tenant DBs)
npm run db:migrate

# 3. Seed data (creates a test tenant and users)
npm run db:seed
```

---

## 4. Running the Application

Start the development server (Backend + Frontend via Vite):

```bash
npm run dev
```

The application will be available at: **[http://localhost:3009](http://localhost:3009)**

---

## 5. Default Credentials

The `db:seed` script creates the following test account for the `dev.localhost` domain:

-   **Domain**: `dev.localhost`
-   **Username**: `admin@dev.localhost`
-   **Password**: `Admin@1234`

> [!NOTE]
> If you cannot access the site via `dev.localhost`, you may need to add `127.0.0.1 dev.localhost` to your system's `hosts` file.

---

## 🛠️ Common Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts server and client in development mode |
| `npm run db:migrate` | Runs all pending SQL migrations |
| `npm run db:seed` | Populates the database with test data |
| `npm run build` | Builds the project for production |
| `npm test` | Runs the test suite |
