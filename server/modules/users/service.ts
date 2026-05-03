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
   * Create user with hashed password
   */
  async createUser(data: any, actorUuid: string) {
    const { id, uuid, created_at, updated_at, ...cleanData } = data;
    
    const passwordHash = await authService.hashPassword(cleanData.password || 'Welcome@123');
    const userUuid = uuidv4();

    const user = await usersRepository.create({
      ...cleanData,
      uuid: userUuid,
      password_hash: passwordHash,
      created_by_uuid: actorUuid,
    });

    await auditLog.track({
      actor: { sub: actorUuid },
      action: 'create',
      entity: 'users_v2',
      entityUuid: user.uuid,
      after: data,
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Update user details
   */
  async updateUser(uuid: string, data: any, actorUuid: string) {
    const existing = await usersRepository.findByUuid(uuid);
    if (!existing) throw new NotFoundError('User not found');

    // Remove immutable and audit fields that might be strings
    const { id, uuid: _uuid, created_at, updated_at, password_hash, ...cleanData } = data;

    const user = await usersRepository.update(uuid, {
      ...cleanData,
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
