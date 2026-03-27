import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CentresService, StatsDashboard } from '../../core/services/centres.service';
import { RapportsService, SyntheseKPI } from '../../core/services/rapports.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <div class="dashboard">
      <h2>Bienvenue, {{ auth.agent()?.nom_complet }}</h2>
      <p class="subtitle">
        {{ auth.agent()?.role_display }}
        @if (auth.agent()?.centre_nom) { — <strong>{{ auth.agent()?.centre_nom }}</strong> }
      </p>

      <!-- ── Dashboard AGENT_CENTRE ───────────────────────────────────────── -->
      @if (isAgent()) {
        <div class="stats-grid">
          <mat-card class="stat-card" routerLink="/actes">
            <mat-card-content>
              <div class="stat-icon" style="background:#009A44"><mat-icon>description</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ agentKpi()?.total_actes ?? '…' }}</span>
                <span class="stat-label">Total actes</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" routerLink="/actes">
            <mat-card-content>
              <div class="stat-icon" style="background:#00796B"><mat-icon>child_care</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ agentKpi()?.actes_naissance ?? '…' }}</span>
                <span class="stat-label">Naissances</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" routerLink="/actes">
            <mat-card-content>
              <div class="stat-icon" style="background:#6A1B9A"><mat-icon>favorite</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ agentKpi()?.actes_mariage ?? '…' }}</span>
                <span class="stat-label">Mariages</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" routerLink="/actes">
            <mat-card-content>
              <div class="stat-icon" style="background:#424242"><mat-icon>sentiment_very_dissatisfied</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ agentKpi()?.actes_deces ?? '…' }}</span>
                <span class="stat-label">Décès</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" routerLink="/actes">
            <mat-card-content>
              <div class="stat-icon" style="background:#2e7d32"><mat-icon>check_circle</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ agentKpi()?.actes_valides ?? '…' }}</span>
                <span class="stat-label">Validés</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" routerLink="/actes">
            <mat-card-content>
              <div class="stat-icon" style="background:#F77F00"><mat-icon>edit_note</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ agentKpi()?.actes_brouillon ?? '…' }}</span>
                <span class="stat-label">Brouillons</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <h3 class="section-title">Actions rapides</h3>
        <div class="actions-grid">
          <mat-card class="action-card" routerLink="/actes/nouveau">
            <mat-card-content>
              <mat-icon>add_circle</mat-icon>
              <span>Créer un acte</span>
            </mat-card-content>
          </mat-card>
          <mat-card class="action-card" routerLink="/actes">
            <mat-card-content>
              <mat-icon>list_alt</mat-icon>
              <span>Mes actes</span>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- ── Dashboard ADMIN_CENTRAL ──────────────────────────────────────── -->
      @if (isAdmin()) {
        <!-- KPIs organisationnels -->
        <div class="stats-grid">
          <mat-card class="stat-card" routerLink="/centres">
            <mat-card-content>
              <div class="stat-icon" style="background:#009A44"><mat-icon>location_city</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ adminStats()?.nb_centres ?? '…' }}</span>
                <span class="stat-label">Total centres</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" routerLink="/centres">
            <mat-card-content>
              <div class="stat-icon" style="background:#2e7d32"><mat-icon>check_circle</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ adminStats()?.nb_centres_actifs ?? '…' }}</span>
                <span class="stat-label">Centres actifs</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card" routerLink="/utilisateurs">
            <mat-card-content>
              <div class="stat-icon" style="background:#1565C0"><mat-icon>people</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ adminStats()?.nb_agents ?? '…' }}</span>
                <span class="stat-label">Agents actifs</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon" style="background:#F77F00"><mat-icon>description</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ adminStats()?.nb_actes_total ?? '…' }}</span>
                <span class="stat-label">Total actes</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Actes par type -->
        <h3 class="section-title">Actes par type</h3>
        <div class="stats-grid actes-grid">
          <mat-card class="stat-card acte-card">
            <mat-card-content>
              <div class="stat-icon" style="background:#00796B"><mat-icon>child_care</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ adminStats()?.nb_actes_naissance ?? '…' }}</span>
                <span class="stat-label">Naissances</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card acte-card">
            <mat-card-content>
              <div class="stat-icon" style="background:#6A1B9A"><mat-icon>favorite</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ adminStats()?.nb_actes_mariage ?? '…' }}</span>
                <span class="stat-label">Mariages</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card acte-card">
            <mat-card-content>
              <div class="stat-icon" style="background:#424242"><mat-icon>sentiment_very_dissatisfied</mat-icon></div>
              <div class="stat-info">
                <span class="stat-value">{{ adminStats()?.nb_actes_deces ?? '…' }}</span>
                <span class="stat-label">Décès</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

      }
    </div>
  `,
  styles: [`
    .dashboard h2    { margin: 0 0 4px; font-size: 24px; }
    .subtitle        { color: #666; margin-bottom: 24px; }
    .section-title   { margin: 24px 0 12px; font-size: 16px; color: #444; font-weight: 600; }
    .stats-grid      { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                       gap: 16px; margin-bottom: 24px; }
    .stat-card       { cursor: pointer; transition: box-shadow 0.2s; }
    .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    mat-card-content { display: flex; align-items: center; gap: 16px; padding: 16px !important; }
    .stat-icon       { width: 56px; height: 56px; border-radius: 12px; display: flex;
                       align-items: center; justify-content: center; }
    .stat-icon mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    .stat-value      { font-size: 28px; font-weight: 700; display: block; }
    .stat-label      { font-size: 13px; color: #666; }
    .actions-grid    { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .action-card     { cursor: pointer; text-align: center; transition: box-shadow 0.2s; }
    .action-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .action-card mat-card-content { flex-direction: column; gap: 8px; }
    .action-card mat-icon { font-size: 36px; width: 36px; height: 36px; color: #F77F00; }
    .action-card:nth-child(even) mat-icon { color: #009A44; }
  `],
})
export class DashboardComponent implements OnInit {
  agentKpi   = signal<SyntheseKPI | null>(null);
  adminStats = signal<StatsDashboard | null>(null);

  isAgent = () => this.auth.agent()?.role === 'AGENT_CENTRE';
  isAdmin = () => this.auth.agent()?.role === 'ADMIN_CENTRAL';

  constructor(
    public auth: AuthService,
    private rapports: RapportsService,
    private centres: CentresService,
  ) {}

  ngOnInit() {
    if (this.isAgent()) {
      this.rapports.synthese().subscribe(kpi => this.agentKpi.set(kpi));
    }
    if (this.isAdmin()) {
      this.centres.stats().subscribe(s => this.adminStats.set(s));
    }
  }
}
