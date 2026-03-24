import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture:   ComponentFixture<LoginComponent>;
  let authSpy:   jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy   = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router',      ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy   },
        { provide: Router,      useValue: routerSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Formulaire ───────────────────────────────────────────────────────────────

  it('formulaire invalide si vide', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('formulaire invalide si email incorrect', () => {
    component.form.setValue({ email: 'pas-un-email', password: 'secret123' });
    expect(component.form.get('email')?.valid).toBeFalse();
  });

  it('formulaire valide avec email et password corrects', () => {
    component.form.setValue({ email: 'agent@test.ci', password: 'Test@2024ci' });
    expect(component.form.valid).toBeTrue();
  });

  it('email est requis', () => {
    const ctrl = component.form.get('email')!;
    ctrl.setValue('');
    expect(ctrl.hasError('required')).toBeTrue();
  });

  it('password est requis', () => {
    const ctrl = component.form.get('password')!;
    ctrl.setValue('');
    expect(ctrl.hasError('required')).toBeTrue();
  });

  // ── Signals ──────────────────────────────────────────────────────────────────

  it('loading est false à l\'initialisation', () => {
    expect(component.loading()).toBeFalse();
  });

  it('erreur est vide à l\'initialisation', () => {
    expect(component.erreur()).toBe('');
  });

  it('showPassword est false à l\'initialisation', () => {
    expect(component.showPassword()).toBeFalse();
  });

  // ── onSubmit — succès ─────────────────────────────────────────────────────────

  it('onSubmit n\'est pas appelé si le formulaire est invalide', () => {
    component.form.setValue({ email: '', password: '' });
    component.onSubmit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('onSubmit appelle auth.login et redirige vers /dashboard', fakeAsync(() => {
    authSpy.login.and.returnValue(of({} as any));
    component.form.setValue({ email: 'agent@test.ci', password: 'Test@2024ci' });

    component.onSubmit();
    tick();

    expect(authSpy.login).toHaveBeenCalledWith({
      email: 'agent@test.ci',
      password: 'Test@2024ci',
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading()).toBeFalse();
  }));

  // ── onSubmit — erreur ─────────────────────────────────────────────────────────

  it('onSubmit affiche le message d\'erreur de l\'API sur échec', fakeAsync(() => {
    authSpy.login.and.returnValue(
      throwError(() => ({ error: { detail: 'Email ou mot de passe incorrect.' } }))
    );
    component.form.setValue({ email: 'agent@test.ci', password: 'mauvais' });

    component.onSubmit();
    tick();

    expect(component.erreur()).toBe('Email ou mot de passe incorrect.');
    expect(component.loading()).toBeFalse();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('onSubmit affiche le message générique si pas de detail dans l\'erreur', fakeAsync(() => {
    authSpy.login.and.returnValue(throwError(() => ({ error: {} })));
    component.form.setValue({ email: 'agent@test.ci', password: 'mauvais' });

    component.onSubmit();
    tick();

    expect(component.erreur()).toBe('Email ou mot de passe incorrect.');
  }));

  // ── Template ─────────────────────────────────────────────────────────────────

  it('le bouton submit est désactivé si le formulaire est invalide', () => {
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeTrue();
  });

  it('le bouton submit est activé si le formulaire est valide', () => {
    component.form.setValue({ email: 'agent@test.ci', password: 'Test@2024ci' });
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeFalse();
  });
});
