import { Router, Request, Response } from 'express';
import { sendSuccess, sendList, asyncHandler } from '../../shared/utils/index.js';
import { sendValidationError } from '../../shared/errors/api-error-response.js';
import { Role } from '../../shared/domain/role.js';
import { UserStatus } from '../../shared/domain/user-status.js';
import { toPublicUser } from '../../shared/domain/user-mappers.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import {
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission,
} from '../../shared/middleware/index.js';
import { PermissionAction } from '../../shared/access-control/permission-action.js';
import * as usersService from './users.service.js';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
} from './users.types.js';
import {
  validate,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from '../../shared/validation/index.js';


const router = Router();

router.post(
  '/',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.users.create),
  asyncHandler(async (req: Request, res: Response) => {
    const body: CreateUserRequest = req.body;

    const result = validate(body, createUserSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const user = await usersService.createUser({
      email: (result.data!.email as string).toLowerCase(),
      name: result.data!.name as string,
      password: result.data!.password as string,
      role: result.data!.role as Role,
      status: result.data!.status as UserStatus,
    });

    return sendSuccess(res, toPublicUser(user), 201);
  })
);

router.get(
  '/',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.users.list),
  asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const users = await usersService.listUsers({ search });
    const publicUsers = users.map(toPublicUser);
    return sendList(res, publicUsers, 200, publicUsers.length);
  })
);

router.get(
  '/:id',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.users.read),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new NotFoundError('User not found');
    }

    const user = await usersService.getUserById(id);
    return sendSuccess(res, toPublicUser(user), 200);
  })
);

router.patch(
  '/:id',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.users.update),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body: UpdateUserRequest = req.body;

    if (!id) {
      throw new NotFoundError('User not found');
    }

    const result = validate(body, updateUserSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const updateData: Record<string, unknown> = {};
    if (result.data!.email !== undefined) {
      updateData.email = (result.data!.email as string).toLowerCase();
    }
    if (result.data!.name !== undefined) {
      updateData.name = result.data!.name;
    }

    const user = await usersService.updateUser(id, {
      email: updateData.email as string | undefined,
      name: updateData.name as string | undefined,
    });

    return sendSuccess(res, toPublicUser(user), 200);
  })
);

router.patch(
  '/:id/status',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.users.updateStatus),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body: UpdateUserStatusRequest = req.body;

    if (!id) {
      throw new NotFoundError('User not found');
    }

    const result = validate(body, updateUserStatusSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const user = await usersService.updateUserStatus(id, {
      status: result.data!.status as UserStatus,
    });

    return sendSuccess(res, toPublicUser(user), 200);
  })
);

router.patch(
  '/:id/role',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.users.updateRole),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body: UpdateUserRoleRequest = req.body;

    if (!id) {
      throw new NotFoundError('User not found');
    }

    const result = validate(body, updateUserRoleSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const user = await usersService.updateUserRole(id, {
      role: result.data!.role as Role,
    });

    return sendSuccess(res, toPublicUser(user), 200);
  })
);

export default router;
