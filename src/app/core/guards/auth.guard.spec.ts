import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/** Crée un faux AuthService avec isLoggedIn() configurable. */
function makeAuthSpy(loggedIn: boolean) {
  return {
    isLoggedIn: signal(loggedIn),
  } as unknown as AuthService;
}

describe('authGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'parseUrl']);
    routerSpy.parseUrl.and.returnValue({} as any);
  });

  function runGuard(loggedIn: boolean): boolean | any {
    const authSvc = makeAuthSpy(loggedIn);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: Router,      useValue: routerSpy },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      )
    );
  }

  it('autorise l\'accès si l\'utilisateur est connecté', () => {
    const result = runGuard(true);
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirige vers /auth/login si l\'utilisateur n\'est pas connecté', () => {
    const result = runGuard(false);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
