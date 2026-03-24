import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AgentRole } from '../models/auth.models';

export const roleGuard = (allowedRoles: AgentRole[]): CanActivateFn => () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (allowedRoles.includes(auth.role as AgentRole)) return true;
  router.navigate(['/dashboard']);
  return false;
};
