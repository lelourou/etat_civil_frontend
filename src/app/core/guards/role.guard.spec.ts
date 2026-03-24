import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { AgentRole } from '../models/auth.models';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

function makeAuthSpy(role: string) {
  return { role } as unknown as AuthService;
}

describe('roleGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  });

  function runGuard(userRole: string, allowedRoles: AgentRole[]): boolean | any {
    const authSvc = makeAuthSpy(userRole);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: Router,      useValue: routerSpy },
      ],
    });
    const guardFn = roleGuard(allowedRoles);
    return TestBed.runInInjectionContext(() =>
      guardFn(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      )
    );
  }

  it('autorise l\'accès si le rôle est dans la liste', () => {
    const result = runGuard('SUPERVISEUR_CENTRE', ['SUPERVISEUR_CENTRE', 'SUPERVISEUR_NATIONAL']);
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('autorise ADMIN_SYSTEME quand il est dans la liste', () => {
    const result = runGuard('ADMIN_SYSTEME', ['SUPERVISEUR_NATIONAL', 'ADMIN_SYSTEME']);
    expect(result).toBeTrue();
  });

  it('redirige vers /dashboard si le rôle est refusé', () => {
    const result = runGuard('AGENT_GUICHET', ['SUPERVISEUR_CENTRE', 'SUPERVISEUR_NATIONAL']);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('redirige si le rôle est vide', () => {
    const result = runGuard('', ['SUPERVISEUR_CENTRE']);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
