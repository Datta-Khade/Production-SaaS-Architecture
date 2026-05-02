/**
 * Audit Log Service — LOG-2: Track critical actions
 *
 * Call auditLog.track() from the SERVICE layer for:
 *   login, create, update, delete, approve, export, permission changes
 *
 * NEVER call from controllers or repositories.
 *
 * Usage:
 *   import { auditLog } from '../lib/auditLog.js';
 *   await auditLog.track({ actor: req.user, action: 'create', entity: 'users_v2', ... });
 */
import { getRawPool } from '../db.js';
import { logger } from '../../lib/logger.js';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'permission_change'
  | 'password_change'
  | 'login_failed'
  | 'account_locked';

interface AuditActor {
  sub: string;
  email?: string;
}

interface TrackOptions {
  actor: AuditActor | null;
  action: AuditAction;
  entity: string;
  entityUuid?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string;
  requestId?: string;
}

export const auditLog = {
  /**
   * Record an audit event.
   * Non-blocking — errors are logged but never thrown.
   */
  track: async (opts: TrackOptions): Promise<void> => {
    try {
      const db = getRawPool();
      await db.query(
        `INSERT INTO audit_log_v2
          (actor_uuid, actor_email, action, entity, entity_uuid, before_data, after_data, ip_address, request_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          opts.actor?.sub   ?? null,
          opts.actor?.email ?? null,
          opts.action,
          opts.entity,
          opts.entityUuid   ?? null,
          opts.before       ? JSON.stringify(opts.before) : null,
          opts.after        ? JSON.stringify(opts.after)  : null,
          opts.ipAddress    ?? null,
          opts.requestId    ?? null,
        ]
      );
    } catch (err) {
      // Audit failures must NEVER crash the request
      logger.error({ error: (err as Error).message, ...opts }, 'Audit log write failed');
    }
  },
};
