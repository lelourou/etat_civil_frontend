import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, TokenResponse, JwtPayload, Agent } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private _token    = signal<string | null>(localStorage.getItem('access_token'));
  private _agent    = signal<Agent | null>(null);

  readonly isLoggedIn = computed(() => !!this._token());
  readonly token      = this._token.asReadonly();
  readonly agent      = this._agent.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    if (this._token()) this.loadCurrentAgent();
  }

  login(credentials: LoginRequest) {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(res => {
        localStorage.setItem('access_token',  res.access);
        localStorage.setItem('refresh_token', res.refresh);
        this._token.set(res.access);
        this.loadCurrentAgent();
      })
    );
  }

  logout() {
    const refresh = localStorage.getItem('refresh_token');
    this.http.post(`${this.apiUrl}/logout/`, { refresh }).pipe(
      catchError(() => EMPTY)
    ).subscribe();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this._token.set(null);
    this._agent.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post<TokenResponse>(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access);
        this._token.set(res.access);
      })
    );
  }

  private loadCurrentAgent() {
    this.http.get<Agent>(`${this.apiUrl}/me/`).subscribe({
      next: agent => this._agent.set(agent),
      error: ()   => this.logout(),
    });
  }

  getPayload(): JwtPayload | null {
    const token = this._token();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
      return null;
    }
  }

  get centreId(): string | null {
    return this.getPayload()?.centre_id ?? null;
  }

  get role(): string {
    return this.getPayload()?.role ?? '';
  }

  isSuperviseurNational(): boolean {
    return this.role === 'SUPERVISEUR_NATIONAL';
  }
}
