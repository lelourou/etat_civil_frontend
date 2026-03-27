import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';

interface NavItem { path: string; icon: string; label: string; }

const NAV_AGENT_CENTRE: NavItem[] = [
  { path: '/dashboard',      icon: 'dashboard',     label: 'Tableau de bord'        },
  { path: '/rapports',       icon: 'bar_chart',     label: 'Rapport BI'             },
  { path: '/actes',          icon: 'description',   label: 'Actes'                  },
  { path: '/notifications',  icon: 'notifications', label: 'Notifications'          },
];

const NAV_ADMIN_CENTRAL: NavItem[] = [
  { path: '/dashboard',     icon: 'dashboard',       label: 'Tableau de bord' },
  { path: '/centres',       icon: 'location_city',   label: 'Centres'          },
  { path: '/utilisateurs',  icon: 'manage_accounts', label: 'Agents'           },
  { path: '/rapports',      icon: 'bar_chart',       label: 'Rapports BI'      },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatBadgeModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <mat-icon class="logo-icon">account_balance</mat-icon>
          <span>État Civil CI</span>
        </div>

        <div class="role-badge">{{ auth.agent()?.role_display }}</div>

        @if (auth.agent()?.centre_nom) {
          <div class="centre-badge">
            <mat-icon style="font-size:14px;width:14px;height:14px">location_on</mat-icon>
            {{ auth.agent()?.centre_nom }}
          </div>
        }

        <mat-nav-list>
          @for (item of navItems(); track item.label) {
            <a mat-list-item [routerLink]="item.path" routerLinkActive="active-link">
              @if (item.path === '/notifications' && notifCount() > 0) {
                <mat-icon matListItemIcon
                  [matBadge]="notifCount()" matBadgeColor="warn" matBadgeSize="small">
                  {{ item.icon }}
                </mat-icon>
              } @else {
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              }
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span class="toolbar-spacer"></span>
          <span class="agent-name">{{ auth.agent()?.nom_complet }}</span>
          @if (auth.agent()?.role === 'AGENT_CENTRE') {
            <button mat-icon-button routerLink="/notifications"
                    [matBadge]="notifCount() > 0 ? notifCount() : null"
                    matBadgeColor="warn" matBadgeSize="small"
                    matTooltip="Notifications inter-centres">
              <mat-icon>notifications</mat-icon>
            </button>
          }
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
    .role-badge { margin: 10px 16px 2px; font-size: 11px; font-weight: 600;
                  text-transform: uppercase; letter-spacing: 1px;
                  color: rgba(255,255,255,0.6); }
    .centre-badge { margin: 0 16px 10px; font-size: 12px; color: rgba(255,255,255,0.85);
                    display: flex; align-items: center; gap: 4px; }
    .active-link { background: rgba(247,127,0,0.25) !important;
                   border-left: 3px solid #F77F00 !important; }
    mat-nav-list a { color: rgba(255,255,255,0.9) !important; }
    mat-nav-list a:hover { background: rgba(255,255,255,0.1) !important; }
    .toolbar-spacer { flex: 1 1 auto; }
    .agent-name { margin-right: 8px; font-size: 14px; }
    .main-content { padding: 24px; background: #f9f9f9; min-height: calc(100vh - 64px); }
  `],
})
export class LayoutComponent implements OnInit {
  navItems = computed<NavItem[]>(() =>
    this.auth.agent()?.role === 'ADMIN_CENTRAL'
      ? NAV_ADMIN_CENTRAL
      : NAV_AGENT_CENTRE
  );
  /** Utilise le signal partagé du service (mis à jour aussi depuis la liste) */
  notifCount = this.notifSvc.pendingCount;

  constructor(public auth: AuthService, private notifSvc: NotificationsService) {}

  ngOnInit() {
    if (this.auth.getPayload()?.role === 'AGENT_CENTRE') {
      this.rafraichirNotifCount();
    }
  }

  rafraichirNotifCount() {
    this.notifSvc.countPending().subscribe({
      next: r => this.notifSvc.pendingCount.set(r.count),
      error: () => {},
    });
  }
}
