import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly requiredRole: string) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthorized access');
    }

    if (user.role !== this.requiredRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true; // ✅ User has the required role
  }
}
