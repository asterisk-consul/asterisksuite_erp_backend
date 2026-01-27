import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // Logic to check if user has the role. 
    // Since roles are complex in this schema (user -> user_company -> role), 
    // we need to determine *which* company context we are in, OR if the user object has roles populated.
    // For now, checking if user.roles includes the required role.
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
