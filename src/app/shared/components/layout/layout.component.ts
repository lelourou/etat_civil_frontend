import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <mat-icon class="logo-icon">account_balance</mat-icon>
          <span>État Civil CI</span>
        </div>
        <mat-nav-list>
          @for (item of navItems; track item.label) {
            <a mat-list-item [routerLink]="item.path" routerLinkActive="active-link">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span class="toolbar-spacer"></span>
          <span class="agent-name">{{ auth.agent()?.nom_complet }}</span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/auth/profile">
              <mat-icon>person</mat-icon> Mon profil
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon> Déconnexion
            </button>
          </mat-menu>
        </mat-toolbar>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 240px; background: #009A44; color: white; }
    .sidenav-header { padding: 20px 16px; display: flex; align-items: center; gap: 12px;
                      font-size: 18px; font-weight: 600;
                      border-bottom: 1px solid rgba(255,255,255,0.25);
                      background: rgba(0,0,0,0.12); }
    .logo-icon { font-size: 32px; width: 32px; height: 32px; color: #F77F00; }
    .active-link { background: rgba(247,127,0,0.25) !important;
                   border-left: 3px solid #F77F00 !important; }
    mat-nav-list a { color: rgba(255,255,255,0.9) !important; }
    mat-nav-list a:hover { background: rgba(255,255,255,0.1) !important; }
    .toolbar-spacer { flex: 1 1 auto; }
    .agent-name { margin-right: 8px; font-size: 14px; }
    .main-content { padding: 24px; background: #f9f9f9; min-height: calc(100vh - 64px); }
  `],
})
export class LayoutComponent {
  constructor(public auth: AuthService) {}

  navItems = [
    { path: '/dashboard',      icon: 'dashboard',     label: 'Tableau de bord' },
    { path: '/actes',          icon: 'description',   label: 'Actes d\'état civil' },
    { path: '/individus',      icon: 'people',        label: 'Individus' },
    { path: '/paiements',      icon: 'payment',       label: 'Paiements & Copies' },
    { path: '/notifications',  icon: 'notifications', label: 'Notifications' },
    { path: '/centres',        icon: 'location_city', label: 'Centres' },
  ];
}
