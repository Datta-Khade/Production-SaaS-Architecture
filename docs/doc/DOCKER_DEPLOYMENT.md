# Docker Deployment Guide

This guide explains how to deploy the SaaS platform using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your machine.
- Ports `80` (Frontend) and `3009` (API) must be available.

## Step-by-step Setup

### 1. Build the Application

Before running the containers, you need to build the images. This will bundle the frontend, backend, and worker.

```bash
docker compose -f infra/docker-compose.yml build
```

### 2. Start the Services

Launch all services (API, Frontend, Database, Redis, Worker, PgBouncer) in detached mode.

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 3. Verify the Status

Check that all containers are healthy.

```bash
docker compose -f infra/docker-compose.yml ps
```

### 4. Initialize the Database

The first time you run the stack, the `master_db` and `tenant_db` databases will be created automatically.

**Automatic Setup**: Database migrations run automatically on server startup. These migrations include:

- Creating a default tenant (`dev.localhost`).
- Creating a default superadmin user (`admin@dev.localhost`).

**Default Login Credentials**:

- **Username**: `admin@dev.localhost`
- **Password**: `Admin@1234`
- **Domain**: `dev.localhost`

### 5. Access the Application

- **Frontend**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost:3009/api/health](http://localhost:3009/api/health)
- **Redis UI (RedisInsight)**: [http://localhost:8001](http://localhost:8001)

## Service Ports Reference

| Service        | Host Port | Internal Port | Description                 |
| -------------- | --------- | ------------- | --------------------------- |
| **Frontend**   | 80        | 80            | Nginx serving static assets |
| **API Server** | 3009      | 3009          | Node.js Express server      |
| **PostgreSQL** | 5432      | 5432          | Master Database             |
| **PgBouncer**  | 6432      | 6432          | Connection Pooler           |
| **Redis**      | 6379      | 6379          | Cache & Queue               |

## Database Access

To inspect the databases directly from your terminal:

```bash
# Connect to master_db
docker compose -f infra/docker-compose.yml exec postgres psql -U postgres -d master_db

# Connect to tenant_db
docker compose -f infra/docker-compose.yml exec postgres psql -U postgres -d tenant_db
```

Useful `psql` commands:

- `\dt` : List all tables
- `\d <table>` : Show table schema
- `\q` : Exit psql

## Troubleshooting

### Check Logs

If a service fails to start, check the logs:

```bash
docker compose -f infra/docker-compose.yml logs -f <service_name>
```

### Fresh Setup (Wipe & Rebuild)

To delete all data, volumes, and images to start completely fresh:

```bash
docker compose -f infra/docker-compose.yml down -v --rmi all
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up -d
```

### Clean Restart

To stop and remove all volumes (data reset):

```bash
docker compose -f infra/docker-compose.yml down -v
```
