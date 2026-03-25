import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="logo">
            <img src="assets/logo-ci.png" alt="RCI" width="60" onerror="this.style.display='none'">
            <div>
              <h1>État Civil</h1>
              <p>Côte d'Ivoire</p>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email" autocomplete="username">
              @if (form.get('email')?.hasError('required')) {
                <mat-error>L'email est requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password">
              <button mat-icon-button matSuffix type="button"
                      (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required')) {
                <mat-error>Le mot de passe est requis</mat-error>
              }
            </mat-form-field>

            @if (erreur()) {
              <div class="error-msg">{{ erreur() }}</div>
            }

            <button mat-raised-button color="primary" class="full-width submit-btn"
                    type="submit" [disabled]="loading() || form.invalid">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Se connecter
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      background: linear-gradient(160deg, #F77F00 0%, #ffffff 50%, #009A44 100%);
    }
    .login-card { width: 420px; padding: 24px;
                  border-top: 4px solid #F77F00; border-bottom: 4px solid #009A44; }
    .logo { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .logo h1 { margin: 0; font-size: 24px; color: #F77F00; }
    .logo p  { margin: 0; color: #009A44; font-size: 14px; font-weight: 500; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 16px; height: 48px; font-size: 16px; }
    .error-msg { color: #f44336; padding: 8px; border-radius: 4px;
                 background: #fde8e8; margin-bottom: 8px; }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading      = signal(false);
  showPassword = signal(false);
  erreur       = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.erreur.set('');
    this.auth.login(this.form.value).subscribe({
      next: ()  => { this.loading.set(false); this.router.navigate(['/dashboard']); },
      error: (e) => {
        this.loading.set(false);
        this.erreur.set(e.error?.detail ?? 'Email ou mot de passe incorrect.');
      },
    });
  }
}
