# 🛡️ Production Security & Deployment Checklist

This document outlines the critical steps required to transition this SaaS skeleton from a **Development/Demo** state to a **Live Production** environment.

---

## 1. 🔑 Secrets & Authentication

- [ ] **Change Default Passwords**: Immediately update `POSTGRES_PASSWORD` and `REDIS_PASSWORD` in `.env.docker`.
- [ ] **Rotate JWT Secrets**: Generate new, 32-character random strings for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`.
- [ ] **Disable Auth Bypass**: Ensure `AUTH_BYPASS=false` is set in the production environment.
- [ ] **SMTP Credentials**: Replace the placeholder `mailtrap` or `ethereal` credentials with a production-grade provider (SendGrid, Postmark, or AWS SES).
- [ ] **DB URL Encryption**: Ensure `ENCRYPTION_KEY` is set and all rows in the `tenants` table have encrypted `db_url` values (run `scripts/encryptExistingDbUrls.ts`).

## 2. 🌐 Networking & Security

- [ ] **Enable HTTPS (SSL/TLS)**: Update `nginx.conf` to support Port 443 and provide valid SSL certificates (via Certbot/Let's Encrypt or a Cloud Provider).
- [ ] **CORS Policy**: Update the `cors` origin in `app.ts` to strictly allow only your production domain (e.g., `https://app.yourclient.com`).
- [ ] **Firewall**: Ensure Port 5432 (Postgres) and 6379 (Redis) are **not** exposed to the public internet. They should only be accessible within the Docker internal network.
- [ ] **Rate Limiting**: Tune the `rateLimiter` middleware thresholds based on expected traffic to prevent DDoS attacks.

## 3. 🗄️ Database & Persistence

- [ ] **Backup Strategy**: Implement a daily automated backup of the `pgdata` volume using `pg_dump` or a cloud-native backup solution.
- [ ] **Connection Pooling**: Monitor PgBouncer metrics to ensure the `PGBOUNCER_MAX_CLIENT_CONN` is sufficient for the number of active tenants.
- [ ] **Managed Database**: For high availability, consider moving the Postgres database from a Docker container to a managed service like **AWS RDS** or **Azure SQL**.

## 4. 📊 Observability & Logs

- [ ] **Log Aggregation**: In production, Node.js logs are JSON formatted. Connect your Docker logs to a service like **Datadog**, **New Relic**, or an **ELK Stack** for monitoring.
- [ ] **Error Masking**: Ensure that `NODE_ENV=production` is set so that internal stack traces are not leaked to the frontend via the `globalErrorHandler`.
- [ ] **Health Checks**: Configure your load balancer to monitor the `/api/health` endpoint.

## 🚀 Deployment Command (Hardened)

When deploying for the first time, use this command to ensure a clean state:

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

---

> [!IMPORTANT]
> This skeleton provides the **architecture** for security, but the **configuration** must be managed by the deployment team.
