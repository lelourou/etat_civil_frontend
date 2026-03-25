import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Chart,
  LineController, BarController, DoughnutController,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import {
  RapportsService,
  SyntheseKPI, EvolutionMensuelle, ActesParCentre,
  RecettesCentre, PaiementsCanal, GenreStats,
} from '../../core/services/rapports.service';
import { forkJoin } from 'rxjs';

Chart.register(
  LineController, BarController, DoughnutController,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Filler,
);

const NL: Record<string, string> = { NAISSANCE: 'Naissances', MARIAGE: 'Mariages', DECES: 'Décès' };
const ML: Record<string, string> = { ESPECES: 'Espèces', MTN_MONEY: 'MTN Money', ORANGE_MONEY: 'Orange Money', WAVE: 'Wave', VIREMENT: 'Virement' };
const CL: Record<string, string> = { GUICHET: 'Guichet', EN_LIGNE: 'En ligne' };
const SL: Record<string, string> = { M: 'Masculin', F: 'Féminin' };

@Component({
  selector: 'app-rapports-bi',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    MatCardModule, MatIconModule, MatTableModule, MatProgressSpinnerModule,
  ],
  template: `
<div style="padding:8px">

  <!-- En-tête -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
    <mat-icon style="font-size:36px;width:36px;height:36px;color:#F77F00">bar_chart</mat-icon>
    <div>
      <h2 style="margin:0;font-size:20px;font-weight:700">Tableau de bord analytique</h2>
      <span style="font-size:13px;color:#777">État Civil CI · Données 2020–2025</span>
    </div>
  </div>

  <!-- Spinner -->
  @if (loading()) {
    <div style="display:flex;flex-direction:column;align-items:center;padding:80px;gap:16px">
      <mat-spinner diameter="60"></mat-spinner>
      <p style="color:#777">Chargement…</p>
    </div>
  }

  @if (!loading()) {

    <!-- ── KPI ─────────────────────────────────────────────── -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:28px">

      <mat-card style="background:linear-gradient(135deg,#F77F00,#e06500);color:white;cursor:pointer;border-radius:12px" (click)="nav('/actes')">
        <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
          <mat-icon style="font-size:36px;width:36px;height:36px">description</mat-icon>
          <div style="font-size:22px;font-weight:800">{{ kpi()?.total_actes | number }}</div>
          <div style="font-size:12px;opacity:.9;text-align:center">Actes enregistrés</div>
          <div style="font-size:11px;opacity:.75">{{ kpi()?.actes_naissance | number }} naissances</div>
        </mat-card-content>
      </mat-card>

      <mat-card style="background:linear-gradient(135deg,#009A44,#007a36);color:white;cursor:pointer;border-radius:12px" (click)="nav('/actes')">
        <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
          <mat-icon style="font-size:36px;width:36px;height:36px">verified</mat-icon>
          <div style="font-size:22px;font-weight:800">{{ kpi()?.actes_valides | number }}</div>
          <div style="font-size:12px;opacity:.9;text-align:center">Actes validés</div>
          <div style="font-size:11px;opacity:.75">{{ tauxValidation() }}% de validation</div>
        </mat-card-content>
      </mat-card>

      <mat-card style="background:linear-gradient(135deg,#1565C0,#0d47a1);color:white;cursor:pointer;border-radius:12px" (click)="nav('/individus')">
        <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
          <mat-icon style="font-size:36px;width:36px;height:36px">people</mat-icon>
          <div style="font-size:22px;font-weight:800">{{ kpi()?.total_individus | number }}</div>
          <div style="font-size:12px;opacity:.9;text-align:center">Individus</div>
          <div style="font-size:11px;opacity:.75">{{ kpi()?.individus_deces | number }} décédés</div>
        </mat-card-content>
      </mat-card>

      <mat-card style="background:linear-gradient(135deg,#F9A825,#f57f17);color:white;cursor:pointer;border-radius:12px" (click)="nav('/paiements')">
        <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
          <mat-icon style="font-size:36px;width:36px;height:36px">payments</mat-icon>
          <div style="font-size:22px;font-weight:800">{{ kpi()?.total_recettes | number:'1.0-0' }}</div>
          <div style="font-size:12px;opacity:.9;text-align:center">Recettes (FCFA)</div>
          <div style="font-size:11px;opacity:.75">{{ kpi()?.nb_paiements | number }} paiements</div>
        </mat-card-content>
      </mat-card>

      <mat-card style="background:linear-gradient(135deg,#00796B,#00574b);color:white;cursor:pointer;border-radius:12px" (click)="nav('/notifications')">
        <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
          <mat-icon style="font-size:36px;width:36px;height:36px">notifications_active</mat-icon>
          <div style="font-size:22px;font-weight:800">{{ kpi()?.notifs_attente | number }}</div>
          <div style="font-size:12px;opacity:.9;text-align:center">Notifs en attente</div>
          <div style="font-size:11px;opacity:.75">{{ kpi()?.total_notifications | number }} total</div>
        </mat-card-content>
      </mat-card>

      <mat-card style="background:linear-gradient(135deg,#C62828,#a11010);color:white;cursor:pointer;border-radius:12px" (click)="nav('/individus')">
        <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
          <mat-icon style="font-size:36px;width:36px;height:36px">person_off</mat-icon>
          <div style="font-size:22px;font-weight:800">{{ kpi()?.individus_deces | number }}</div>
          <div style="font-size:12px;opacity:.9;text-align:center">Décès enregistrés</div>
          <div style="font-size:11px;opacity:.75">{{ kpi()?.actes_deces | number }} actes</div>
        </mat-card-content>
      </mat-card>

    </div>

    <!-- ── Section 1 ──────────────────────────────────────── -->
    <div style="color:#009A44;font-weight:600;font-size:15px;border-bottom:2px solid #e8f5e9;padding-bottom:6px;margin-bottom:16px">
      Évolution temporelle &amp; Distribution
    </div>

    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      <mat-card style="flex:2;min-width:340px">
        <mat-card-header><mat-card-title>Évolution mensuelle des actes (2020–2025)</mat-card-title></mat-card-header>
        <mat-card-content>
          <canvas id="bi-evolution" style="width:100%"></canvas>
        </mat-card-content>
      </mat-card>
      <mat-card style="flex:1;min-width:220px">
        <mat-card-header><mat-card-title>Répartition par nature</mat-card-title></mat-card-header>
        <mat-card-content>
          <canvas id="bi-nature" style="width:100%"></canvas>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- ── Genre ──────────────────────────────────────────── -->
    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      <mat-card style="flex:1;min-width:200px">
        <mat-card-header><mat-card-title>Individus par genre</mat-card-title></mat-card-header>
        <mat-card-content>
          <canvas id="bi-genre-ind" style="width:100%"></canvas>
        </mat-card-content>
      </mat-card>
      <mat-card style="flex:1;min-width:200px">
        <mat-card-header><mat-card-title>Naissances par genre</mat-card-title></mat-card-header>
        <mat-card-content>
          <canvas id="bi-genre-nai" style="width:100%"></canvas>
        </mat-card-content>
      </mat-card>
      <mat-card style="flex:1;min-width:200px">
        <mat-card-header><mat-card-title>Décès par genre</mat-card-title></mat-card-header>
        <mat-card-content>
          <canvas id="bi-genre-dec" style="width:100%"></canvas>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- ── Section 2 ──────────────────────────────────────── -->
    <div style="color:#009A44;font-weight:600;font-size:15px;border-bottom:2px solid #e8f5e9;padding-bottom:6px;margin-bottom:16px">
      Analyse géographique
    </div>

    <mat-card style="margin-bottom:24px">
      <mat-card-header>
        <mat-card-title>Top 10 centres par volume d'actes</mat-card-title>
        <mat-card-subtitle>Vert = Sous-Préfecture · Orange = Mairie</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <canvas id="bi-centres" style="width:100%"></canvas>
      </mat-card-content>
    </mat-card>

    <!-- ── Tableau recettes ────────────────────────────────── -->
    <mat-card style="margin-bottom:24px">
      <mat-card-header><mat-card-title>Recettes par centre (FCFA)</mat-card-title></mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="recettes()" style="width:100%">
          <ng-container matColumnDef="rang">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let r; let i = index">{{ i+1 }}</td>
          </ng-container>
          <ng-container matColumnDef="centre">
            <th mat-header-cell *matHeaderCellDef>Centre</th>
            <td mat-cell *matCellDef="let r">{{ r.centre_nom }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let r">
              <span [style.background]="r.centre_type==='SOUS_PREFECTURE'?'#e8f5e9':'#e3f2fd'"
                    [style.color]="r.centre_type==='SOUS_PREFECTURE'?'#2e7d32':'#1565C0'"
                    style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500">
                {{ r.centre_type === 'SOUS_PREFECTURE' ? 'Sous-Préf.' : 'Mairie' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="nb">
            <th mat-header-cell *matHeaderCellDef>Paiements</th>
            <td mat-cell *matCellDef="let r">{{ r.nb_paiements | number }}</td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total (FCFA)</th>
            <td mat-cell *matCellDef="let r" style="font-weight:700;color:#009A44">{{ r.total | number:'1.0-0' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="recCols"></tr>
          <tr mat-row *matRowDef="let row; columns: recCols;"></tr>
        </table>
      </mat-card-content>
    </mat-card>

    <!-- ── Section 3 ──────────────────────────────────────── -->
    <div style="color:#009A44;font-weight:600;font-size:15px;border-bottom:2px solid #e8f5e9;padding-bottom:6px;margin-bottom:16px">
      Analyse des paiements
    </div>

    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      <mat-card style="flex:1;min-width:260px">
        <mat-card-header>
          <mat-card-title>Demandes par canal</mat-card-title>
          <mat-card-subtitle>Guichet vs En ligne</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <canvas id="bi-canal" style="width:100%"></canvas>
        </mat-card-content>
      </mat-card>
      <mat-card style="flex:1;min-width:260px">
        <mat-card-header>
          <mat-card-title>Paiements par moyen</mat-card-title>
          <mat-card-subtitle>Espèces vs Mobile Money</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <canvas id="bi-moyen" style="width:100%"></canvas>
        </mat-card-content>
      </mat-card>
    </div>

  } <!-- fin @if (!loading()) -->
</div>
  `,
  styles: [`
    mat-card { border-radius: 10px !important; margin-bottom: 0; }
    mat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.15) !important; }
    tr.mat-mdc-row:hover { background: #f5f5f5; }
  `],
})
export class RapportsBiComponent implements OnInit, OnDestroy {
  private svc    = inject(RapportsService);
  private router = inject(Router);

  loading  = signal(true);
  kpi      = signal<SyntheseKPI | null>(null);
  recettes = signal<RecettesCentre[]>([]);
  recCols  = ['rang', 'centre', 'type', 'nb', 'total'];

  private evolutionData: EvolutionMensuelle[]                = [];
  private centreData:    ActesParCentre[]                    = [];
  private canalData:     PaiementsCanal | null               = null;
  private natureData:    { nature: string; count: number }[] = [];
  private genreData:     GenreStats | null                   = null;
  private charts:        Chart[]                             = [];

  tauxValidation() {
    const k = this.kpi();
    return (!k || !k.total_actes) ? 0 : Math.round(k.actes_valides / k.total_actes * 100);
  }
  nav(p: string) { this.router.navigate([p]); }

  ngOnInit() {
    forkJoin({
      synthese:  this.svc.synthese(),
      evolution: this.svc.evolutionMensuelle(),
      nature:    this.svc.actesParNature(),
      centres:   this.svc.actesParCentre(),
      recettes:  this.svc.recettesParCentre(),
      canal:     this.svc.paiementsParCanal(),
      genre:     this.svc.actesParGenre(),
    }).subscribe({
      next: d => {
        this.kpi.set(d.synthese);
        this.recettes.set(d.recettes);
        this.evolutionData = d.evolution;
        this.centreData    = d.centres;
        this.canalData     = d.canal;
        this.natureData    = d.nature;
        this.genreData     = d.genre;
        this.loading.set(false);

        // Attendre qu'Angular rende @if(!loading()), puis dessiner
        setTimeout(() => this.drawAll(), 300);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() { this.charts.forEach(c => c.destroy()); }

  private cvs(id: string) { return document.getElementById(id) as HTMLCanvasElement | null; }
  private reg(c: Chart)   { this.charts.push(c); }

  private drawAll() {
    this.drawEvolution();
    this.drawNature();
    this.drawCentres();
    this.drawCanal();
    this.drawMoyen();
    this.drawGenre();
  }

  private drawEvolution() {
    const el = this.cvs('bi-evolution'); if (!el) return;
    const months = [...new Set(this.evolutionData.map(d => d.mois))].sort();
    const nats   = ['NAISSANCE','MARIAGE','DECES'];
    const colors = ['#F77F00','#009A44','#C62828'];
    const fills  = ['rgba(247,127,0,.15)','rgba(0,154,68,.15)','rgba(198,40,40,.15)'];
    this.reg(new Chart(el, {
      type: 'line',
      data: {
        labels: months,
        datasets: nats.map((n,i) => ({
          label: NL[n], tension: 0.4, fill: true,
          borderColor: colors[i], backgroundColor: fills[i], pointRadius: 3,
          data: months.map(m => this.evolutionData.find(d => d.mois===m && d.nature===n)?.count ?? 0),
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 2.5,
        plugins: { legend: { position: 'top' } },
        scales: { x: { ticks: { maxRotation: 45, font: { size: 10 } } }, y: { beginAtZero: true } },
      },
    }));
  }

  private drawNature() {
    const el = this.cvs('bi-nature'); if (!el) return;
    this.reg(new Chart(el, {
      type: 'doughnut',
      data: {
        labels: this.natureData.map(d => NL[d.nature] ?? d.nature),
        datasets: [{ data: this.natureData.map(d => d.count),
          backgroundColor: ['#F77F00','#009A44','#C62828'], borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }],
      },
      options: { responsive: true, maintainAspectRatio: true, aspectRatio: 1.4, plugins: { legend: { position: 'bottom' } } },
    }));
  }

  private drawCentres() {
    const el = this.cvs('bi-centres'); if (!el) return;
    const labels = this.centreData.map(d =>
      (d.centre__nom ?? '').replace(/Sous-Préfecture de |Sous-Préfecture d'|Mairie de |Mairie d'/g,''));
    this.reg(new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Actes', borderRadius: 4,
          data: this.centreData.map(d => d.count),
          backgroundColor: this.centreData.map(d => d.centre__type==='SOUS_PREFECTURE' ? '#009A44' : '#F77F00') }],
      },
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 2.2,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { title: (i: any[]) => this.centreData[i[0].dataIndex]?.centre__nom ?? '' } } },
        scales: { y: { beginAtZero: true } },
      },
    }));
  }

  private drawCanal() {
    const el = this.cvs('bi-canal'); if (!el || !this.canalData) return;
    this.reg(new Chart(el, {
      type: 'doughnut',
      data: {
        labels: this.canalData.par_canal.map(d => CL[d.canal] ?? d.canal),
        datasets: [{ data: this.canalData.par_canal.map(d => d.count),
          backgroundColor: ['#F77F00','#009A44'], borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }],
      },
      options: { responsive: true, maintainAspectRatio: true, aspectRatio: 1.4, plugins: { legend: { position: 'bottom' } } },
    }));
  }

  private drawMoyen() {
    const el = this.cvs('bi-moyen'); if (!el || !this.canalData) return;
    this.reg(new Chart(el, {
      type: 'bar',
      data: {
        labels: this.canalData.par_moyen.map(d => ML[d.moyen] ?? d.moyen),
        datasets: [{ label: 'Transactions', borderRadius: 4,
          data: this.canalData.par_moyen.map(d => d.count),
          backgroundColor: ['#009A44','#F77F00','#FF6F00','#1565C0','#7B1FA2'] }],
      },
      options: {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: true, aspectRatio: 1.8,
        plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } },
      },
    }));
  }

  private drawGenre() {
    if (!this.genreData) return;
    const COLORS = ['#1565C0','#E91E63'];
    const pie = (id: string, data: { sexe: string; count: number }[]) => {
      const el = this.cvs(id); if (!el || !data.length) return;
      this.reg(new Chart(el, {
        type: 'doughnut',
        data: {
          labels: data.map(d => SL[d.sexe] ?? d.sexe),
          datasets: [{ data: data.map(d => d.count),
            backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }],
        },
        options: { responsive: true, maintainAspectRatio: true, aspectRatio: 1.4, plugins: { legend: { position: 'bottom' } } },
      }));
    };
    pie('bi-genre-ind', this.genreData.individus_par_sexe);
    pie('bi-genre-nai', this.genreData.naissances_par_sexe);
    pie('bi-genre-dec', this.genreData.deces_par_sexe);
  }
}
