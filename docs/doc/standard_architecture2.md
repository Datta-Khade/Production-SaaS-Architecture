# standard_architecture2.md

## Enterprise Hardening Add-on to standard_architecture1

This document extends `standard_architecture1.md` with production-grade standards for security, resilience, observability, and maintainability.

---

## AUTH-1: Standard Login Flow

### Endpoint

```http
POST /api/v2/auth/login
```

### Request Body

```json
{
  "domain": "rsms",
  "username": "admin",
  "password": "******"
}
```

### Rules

- Passwords must be hashed using bcrypt (cost factor 12+).
- Compare passwords using secure hash compare only.
- Maximum 10 failed attempts.
- Lock account for configurable duration after threshold.
- Log login success/failure events.

---

## AUTH-2: Token Standard

### Access Token

- Expiry: 15 minutes

### Refresh Token

- Expiry: 7 days
- Stored hashed in database
- Revocable per device/session

### Environment Variables

```env
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

---

## AUTH-3: Auth Middleware Standard

Validate token on every protected request.

### Failure Responses

- Missing token → 401
- Invalid token → 401
- Expired token → 401 with refresh hint
- Disabled user → 403

---

## AUTH-4: Auto Token Injection (Frontend)

Use centralized fetch wrapper:

```ts
tenantFetch(url, options);
```

Automatically inject:

```http
Authorization: Bearer <token>
X-Tenant-Domain: rsms
```

---

## AUTH-5: Silent Refresh Flow

When access token expires:

1. Call refresh endpoint
2. Receive new access token
3. Retry original request once
4. If refresh fails → logout

---

## AUTH-6: Standard Auth APIs

```http
POST /api/v2/auth/login
POST /api/v2/auth/refresh
GET  /api/v2/auth/profile
POST /api/v2/auth/change-password
POST /api/v2/auth/logout
```

---

## ERR-1: Global Error Classes

Create standard errors:

```ts
AppError;
ValidationError;
NotFoundError;
ForbiddenError;
ConflictError;
UnauthorizedError;
```

---

## ERR-2: Global Error Handler

Single Express handler:

```ts
app.use(globalErrorHandler);
```

Response:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR"
}
```

Never expose stack traces in production.

---

## API-1: Standard Response Envelope

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Failure

```json
{
  "success": false,
  "message": "Error text"
}
```

---

## API-2: Pagination Format

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 520,
    "pages": 26
  }
}
```

---

## DB-1: Database Rules

- Prefer normalized schema
- Avoid JSON/JSONB for relational data
- Use UUID public identifiers
- Use integer PK internally if needed
- Use soft delete only when required

---

## DB-2: Foreign Key Standard

```ts
child.parentUuid references parent.uuid
```

---

## DB-3: Index Strategy

Use indexes for:

- foreign keys
- search columns
- status columns
- created_at sorting
- composite filters

Review slow queries regularly.

---

## DB-4: File Metadata Standard

Store:

```txt
file_name
file_size
mime_type
storage_path
checksum
uploaded_by
uploaded_at
```

Never store raw base64 in DB unless temporary.

---

## LOG-1: Structured Logging

Every request gets correlation ID.

Headers:

```http
X-Request-Id
```

Log:

```json
{
  "requestId": "",
  "userId": "",
  "path": "",
  "durationMs": 25
}
```

---

## LOG-2: Audit Logging

Track critical actions:

- login
- create
- update
- delete
- approval
- export
- permission changes

Store:

```txt
actor
action
entity
entity_id
before_data
after_data
timestamp
ip_address
```

---

## OPS-1: Health Check

### Endpoint

```http
GET /health
```

Checks:

- API alive
- DB connectivity
- Redis connectivity
- Queue health

### Response

```json
{
  "status": "healthy"
}
```

If degraded return 503.

---

## OPS-2: Graceful Shutdown

Handle:

```txt
SIGINT
SIGTERM
```

Steps:

1. Stop accepting traffic
2. Close HTTP server
3. Drain queues
4. Close DB pool
5. Close Redis
6. Exit safely

Force exit after timeout.

---

## QUEUE-1: Queue Retry Standard

Use BullMQ retry config:

```txt
attempts: 5
backoff: exponential
```

Track failed jobs.

---

## QUEUE-2: Dead Letter Queue

Move permanently failed jobs to DLQ for manual review.

---

## ENV-1: Strict Env Validation

Validate env on startup using schema validation.

Example:

```ts
PORT;
DATABASE_URL;
JWT_SECRET;
REDIS_URL;
NODE_ENV;
```

If invalid:

```ts
process.exit(1);
```

---

## SEC-1: Security Headers

Use Helmet / secure defaults.

Enable:

- HSTS
- XSS protection
- No sniff
- Frame deny

---

## SEC-2: Rate Limiting

Protect:

- login
- password reset
- public APIs

Example:

```txt
100 req / 15 min
```

---

## OBS-1: Monitoring

Track:

- response time
- error rate
- queue failures
- DB latency
- memory
- CPU

Use dashboards + alerts.

---

## TEST-1: Mandatory Testing

Minimum:

- Unit tests for services
- API integration tests
- Auth tests
- Permission tests

---

## DEPLOY-1: Release Standard

Before deploy:

1. Run tests
2. Run migrations
3. Backup DB
4. Deploy app
5. Smoke test
6. Monitor logs

---

## FINAL RULE

standard_architecture1 = Core Build Standard
standard_architecture2 = Enterprise Production Standard
