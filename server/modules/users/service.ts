/**
 * Users Service — Business logic for user management
 *
 * Rules:
 * - Audit all changes
 * - Hash passwords before save
 * - Zero req/res references
 */
import { v4 as uuidv4 } from 'uuid';
import { usersRepository } from './repository.js';
import { auditLog } from '../lib/auditLog.js';
import { NotFoundError, ValidationError } from '../../../shared/modules/errors/index.js';
import { authService } from '../auth/service.js';
import type { NewUser } from '../../../shared/modules/schema/users.js';

/**
 * Input type for creating a user.
 * Omits system-managed fields — those are set by the service/repository layer.
 */
interface CreateUserInput {
  email: string;
  username?: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
  assigned_role?: string;
  is_active?: boolean;
}

/**
 * Input type for updating a user.
 * All fields optional — only provided fields are updated.
 */
interface UpdateUserInput {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  assigned_role?: string;
  is_active?: boolean;
}

export const usersService = {
  /**
   * List all users
   */
  async getAllUsers() {
    return usersRepository.findAll();
  },

  /**
   * Get single user
   */
  async getUser(uuid: string) {
    const user = await usersRepository.findByUuid(uuid);
    if (!user) throw new NotFoundError('User not found');
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Create user with hashed password.
   * Password is REQUIRED — no default password fallback.
   */
  async createUser(data: CreateUserInput, actorUuid: string) {
    if (!data.password) {
      throw new ValidationError('Password is required when creating a user');
    }

    const passwordHash = await authService.hashPassword(data.password);
    const userUuid = uuidv4();

    // Build the insert payload — omit non-schema fields like `password`
    const { password: _password, ...cleanData } = data;

    const user = await usersRepository.create({
      ...cleanData,
      uuid: userUuid,
      password_hash: passwordHash,
      created_by_uuid: actorUuid,
    } as NewUser);

    await auditLog.track({
      actor: { sub: actorUuid },
      action: 'create',
      entity: 'users_v2',
      entityUuid: user.uuid,
      after: data as unknown as Record<string, unknown>,
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Update user details
   */
  async updateUser(uuid: string, data: UpdateUserInput, actorUuid: string) {
    const existing = await usersRepository.findByUuid(uuid);
    if (!existing) throw new NotFoundError('User not found');

    const user = await usersRepository.update(uuid, {
      ...data,
      updated_by_uuid: actorUuid,
    });

    await auditLog.track({
      actor: { sub: actorUuid },
      action: 'update',
      entity: 'users_v2',
      entityUuid: user.uuid,
      before: existing,
      after: user,
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Soft delete user
   */
  async deleteUser(uuid: string, actorUuid: string) {
    const existing = await usersRepository.findByUuid(uuid);
    if (!existing) throw new NotFoundError('User not found');

    if (existing.uuid === actorUuid) {
      throw new ValidationError('You cannot delete your own account');
    }

    await usersRepository.delete(uuid, actorUuid);

    await auditLog.track({
      actor: { sub: actorUuid },
      action: 'delete',
      entity: 'users_v2',
      entityUuid: uuid,
      before: existing,
    });

    return { success: true };
  },
};
