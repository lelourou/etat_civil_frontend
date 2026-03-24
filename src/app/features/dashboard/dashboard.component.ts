import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ActesService } from '../../core/services/actes.service';
import { NotificationsService } from '../../core/services/notifications.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <div class="dashboard">
      <h2>Bienvenue, {{ auth.agent()?.nom_complet }}</h2>
      <p class="subtitle">{{ auth.agent()?.role_display }} — {{ auth.agent()?.centre_nom }}</p>

      <div class="stats-grid">
        @for (stat of stats(); track stat.label) {
          <mat-card class="stat-card" [routerLink]="stat.link">
            <mat-card-content>
              <div class="stat-icon" [style.background]="stat.color">
                <mat-icon>{{ stat.icon }}</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <div class="actions-grid">
        <mat-card class="action-card" routerLink="/actes/nouveau">
          <mat-card-content>
            <mat-icon>add_circle</mat-icon>
            <span>Nouvel acte</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="action-card" routerLink="/individus/nouveau">
          <mat-card-content>
            <mat-icon>person_add</mat-icon>
            <span>Enregistrer individu</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="action-card" routerLink="/paiements">
          <mat-card-content>
            <mat-icon>receipt</mat-icon>
            <span>Demande de copie</span>
          </mat-card-content>
        </mat-card>
        <mat-card class="action-card" routerLink="/notifications">
          <mat-card-content>
            <mat-icon>notifications_active</mat-icon>
            <span>Notifications ({{ notifCount() }})</span>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard h2  { margin: 0 0 4px; font-size: 24px; }
    .subtitle      { color: #666; margin-bottom: 24px; }
    .stats-grid    { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                     gap: 16px; margin-bottom: 24px; }
    .stat-card     { cursor: pointer; transition: box-shadow 0.2s; }
    .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    mat-card-content { display: flex; align-items: center; gap: 16px; padding: 16px !important; }
    .stat-icon     { width: 56px; height: 56px; border-radius: 12px; display: flex;
                     align-items: center; justify-content: center; }
    .stat-icon mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    .stat-value    { font-size: 28px; font-weight: 700; display: block; }
    .stat-label    { font-size: 13px; color: #666; }
    .actions-grid  { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .action-card   { cursor: pointer; text-align: center; transition: box-shadow 0.2s; }
    .action-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .action-card mat-card-content { flex-direction: column; gap: 8px; }
    .action-card mat-icon { font-size: 36px; width: 36px; height: 36px; color: #1a4f7a; }
  `],
})
export class DashboardComponent implements OnInit {
  stats     = signal<Array<{ label: string; value: number; icon: string; color: string; link: string }>>([]);
  notifCount = signal(0);

  constructor(
    public auth: AuthService,
    private actes: ActesService,
    private notifs: NotificationsService,
  ) {}

  ngOnInit() {
    this.actes.liste({ statut: 'BROUILLON' }).subscribe(r =>
      this.stats.set([
        { label: 'Actes en brouillon',  value: r.count, icon: 'edit_note',   color: '#ff9800', link: '/actes?statut=BROUILLON' },
        { label: 'Total actes',          value: 0,       icon: 'description', color: '#2196f3', link: '/actes' },
        { label: 'Copies délivrées',     value: 0,       icon: 'file_copy',   color: '#4caf50', link: '/paiements' },
        { label: 'Notifications',        value: 0,       icon: 'notifications',color: '#9c27b0', link: '/notifications' },
      ])
    );
    this.notifs.liste({ statut: 'EN_ATTENTE' }).subscribe(r => this.notifCount.set(r.count));
  }
}
