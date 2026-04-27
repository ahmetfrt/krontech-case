import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

@Roles(RoleName.ADMIN, RoleName.EDITOR)
class ContentController {
  list() {
    return true;
  }

  @Roles(RoleName.ADMIN)
  publish() {
    return true;
  }
}

class PublicController {
  health() {
    return true;
  }
}

function createContext({
  controller,
  handler,
  role,
}: {
  controller: object;
  handler: object;
  role?: RoleName;
}) {
  return {
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows routes without role metadata', () => {
    const context = createContext({
      controller: PublicController,
      handler: PublicController.prototype.health,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows editor for editor/admin content routes', () => {
    const context = createContext({
      controller: ContentController,
      handler: ContentController.prototype.list,
      role: RoleName.EDITOR,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks editor from admin-only route overrides', () => {
    const context = createContext({
      controller: ContentController,
      handler: ContentController.prototype.publish,
      role: RoleName.EDITOR,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows admin for admin-only route overrides', () => {
    const context = createContext({
      controller: ContentController,
      handler: ContentController.prototype.publish,
      role: RoleName.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
