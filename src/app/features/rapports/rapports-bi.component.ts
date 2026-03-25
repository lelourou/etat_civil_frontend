import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, inject, signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
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

const NATURE_LABELS: Record<string, string> = {
  NAISSANCE: 'Naissances', MARIAGE: 'Mariages', DECES: 'Décès',
};
const MOYEN_LABELS: Record<string, string> = {
  ESPECES: 'Espèces', MTN_MONEY: 'MTN Money',
  ORANGE_MONEY: 'Orange Money', WAVE: 'Wave', VIREMENT: 'Virement',
};
const CANAL_LABELS: Record<string, string> = {
  GUICHET: 'Guichet', EN_LIGNE: 'En ligne',
};
const SEXE_LABELS: Record<string, string> = { M: 'Masculin', F: 'Féminin' };

@Component({
  selector: 'app-rapports-bi',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    MatCardModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="bi-container">

      <div class="page-header">
        <div class="page-title">
          <mat-icon>bar_chart</mat-icon>
          <div>
            <h2>Tableau de bord analytique</h2>
            <span class="subtitle">Système d'État Civil — Côte d'Ivoire · Données 2020–2025</span>
          </div>
        </div>
      </div>

      <!-- ── Spinner ─────────────────────────────────────── -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="60"></mat-spinner>
          <p>Chargement des données analytiques…</p>
        </div>
      }

      <!-- ── Contenu (rendu seulement quand loading=false) ── -->
      @if (!loading()) {

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <mat-card class="kpi-card kpi-orange" (click)="nav('/actes')">
            <mat-card-content>
              <mat-icon>description</mat-icon>
              <div class="kpi-value">{{ kpi()?.total_actes | number }}</div>
              <div class="kpi-label">Actes enregistrés</div>
              <div class="kpi-sub">{{ kpi()?.actes_naissance | number }} naissances</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card kpi-green" (click)="nav('/actes')">
            <mat-card-content>
              <mat-icon>verified</mat-icon>
              <div class="kpi-value">{{ kpi()?.actes_valides | number }}</div>
              <div class="kpi-label">Actes validés</div>
              <div class="kpi-sub">{{ tauxValidation() }}% de validation</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card kpi-blue" (click)="nav('/individus')">
            <mat-card-content>
              <mat-icon>people</mat-icon>
              <div class="kpi-value">{{ kpi()?.total_individus | number }}</div>
              <div class="kpi-label">Individus enregistrés</div>
              <div class="kpi-sub">{{ kpi()?.individus_deces | number }} décédés</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card kpi-gold" (click)="nav('/paiements')">
            <mat-card-content>
              <mat-icon>payments</mat-icon>
              <div class="kpi-value">{{ kpi()?.total_recettes | number:'1.0-0' }}</div>
              <div class="kpi-label">Recettes (FCFA)</div>
              <div class="kpi-sub">{{ kpi()?.nb_paiements | number }} paiements</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card kpi-teal" (click)="nav('/notifications')">
            <mat-card-content>
              <mat-icon>notifications_active</mat-icon>
              <div class="kpi-value">{{ kpi()?.notifs_attente | number }}</div>
              <div class="kpi-label">Notifications en attente</div>
              <div class="kpi-sub">{{ kpi()?.total_notifications | number }} au total</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card kpi-red" (click)="nav('/individus')">
            <mat-card-content>
              <mat-icon>person_off</mat-icon>
              <div class="kpi-value">{{ kpi()?.individus_deces | number }}</div>
              <div class="kpi-label">Décès enregistrés</div>
              <div class="kpi-sub">{{ kpi()?.actes_deces | number }} actes de décès</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Section 1 -->
        <div class="section-title"><mat-icon>show_chart</mat-icon> Évolution temporelle &amp; Distribution</div>

        <div class="charts-row">
          <mat-card class="chart-card chart-large">
            <mat-card-header>
              <mat-card-title><mat-icon>trending_up</mat-icon> Évolution mensuelle (2020–2025)</mat-card-title>
              <mat-card-subtitle>Naissances · Mariages · Décès</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content><canvas #evolutionChart></canvas></mat-card-content>
          </mat-card>
          <mat-card class="chart-card chart-small">
            <mat-card-header>
              <mat-card-title><mat-icon>donut_large</mat-icon> Répartition par nature</mat-card-title>
            </mat-card-header>
            <mat-card-content><canvas #natureChart></canvas></mat-card-content>
          </mat-card>
        </div>

        <!-- Section Genre -->
        <div class="charts-row">
          <mat-card class="chart-card chart-third">
            <mat-card-header>
              <mat-card-title><mat-icon>wc</mat-icon> Individus par genre</mat-card-title>
            </mat-card-header>
            <mat-card-content><canvas #genreIndividuChart></canvas></mat-card-content>
          </mat-card>
          <mat-card class="chart-card chart-third">
            <mat-card-header>
              <mat-card-title><mat-icon>child_care</mat-icon> Naissances par genre</mat-card-title>
            </mat-card-header>
            <mat-card-content><canvas #genreNaissanceChart></canvas></mat-card-content>
          </mat-card>
          <mat-card class="chart-card chart-third">
            <mat-card-header>
              <mat-card-title><mat-icon>person_off</mat-icon> Décès par genre</mat-card-title>
            </mat-card-header>
            <mat-card-content><canvas #genreDecesChart></canvas></mat-card-content>
          </mat-card>
        </div>

        <!-- Section 2 -->
        <div class="section-title"><mat-icon>location_city</mat-icon> Analyse géographique</div>

        <mat-card class="chart-card chart-full">
          <mat-card-header>
            <mat-card-title><mat-icon>bar_chart</mat-icon> Top 10 centres par volume d'actes</mat-card-title>
            <mat-card-subtitle>Gradient urbain → rural (vert = Sous-Préfecture, orange = Mairie)</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content><canvas #centreChart></canvas></mat-card-content>
        </mat-card>

        <!-- Tableau recettes -->
        <mat-card class="table-card">
          <mat-card-header>
            <mat-card-title><mat-icon>account_balance_wallet</mat-icon> Recettes par centre (FCFA)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="recettes()" class="full-width">
              <ng-container matColumnDef="rang">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let r; let i = index">{{ i + 1 }}</td>
              </ng-container>
              <ng-container matColumnDef="centre">
                <th mat-header-cell *matHeaderCellDef>Centre</th>
                <td mat-cell *matCellDef="let r">{{ r.centre_nom }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let r">
                  <span class="badge" [class.badge-sp]="r.centre_type === 'SOUS_PREFECTURE'">
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
                <td mat-cell *matCellDef="let r" class="amount">{{ r.total | number:'1.0-0' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="recCols"></tr>
              <tr mat-row *matRowDef="let row; columns: recCols;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Section 3 -->
        <div class="section-title"><mat-icon>payments</mat-icon> Analyse des paiements</div>

        <div class="charts-row">
          <mat-card class="chart-card chart-half">
            <mat-card-header>
              <mat-card-title><mat-icon>swap_horiz</mat-icon> Demandes par canal</mat-card-title>
              <mat-card-subtitle>Guichet vs En ligne</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content><canvas #canalChart></canvas></mat-card-content>
          </mat-card>
          <mat-card class="chart-card chart-half">
            <mat-card-header>
              <mat-card-title><mat-icon>mobile_friendly</mat-icon> Paiements par moyen</mat-card-title>
              <mat-card-subtitle>Espèces vs Mobile Money</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content><canvas #moyenChart></canvas></mat-card-content>
          </mat-card>
        </div>

      } <!-- fin @if (!loading()) -->
    </div>
  `,
  styles: [`
    .bi-container { padding: 8px 4px; }
    .page-header  { display:flex; justify-content:space-between; align-items:center;
                    margin-bottom:24px; flex-wrap:wrap; gap:12px; }
    .page-title   { display:flex; align-items:center; gap:12px; }
    .page-title mat-icon { font-size:40px; width:40px; height:40px; color:#F77F00; }
    .page-title h2 { margin:0; font-size:22px; font-weight:700; color:#333; }
    .subtitle { font-size:13px; color:#777; }
    .section-title { display:flex; align-items:center; gap:8px; font-size:15px;
                     font-weight:600; color:#009A44; margin:8px 0 16px;
                     padding-bottom:6px; border-bottom:2px solid #e8f5e9; }
    .loading-center { display:flex; flex-direction:column; align-items:center;
                      padding:80px; gap:16px; color:#777; }

    /* KPI */
    .kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr));
                gap:16px; margin-bottom:28px; }
    .kpi-card { border-radius:12px !important; cursor:pointer;
                transition:transform .15s, box-shadow .15s; }
    .kpi-card:hover { transform:translateY(-3px);
                      box-shadow:0 8px 20px rgba(0,0,0,.2) !important; }
    .kpi-card mat-card-content { display:flex; flex-direction:column; align-items:center;
                                  padding:18px 12px !important; gap:6px; }
    .kpi-card mat-icon { font-size:38px; width:38px; height:38px; opacity:.9; }
    .kpi-value { font-size:24px; font-weight:800; line-height:1; }
    .kpi-label { font-size:12px; opacity:.88; text-align:center; font-weight:500; }
    .kpi-sub   { font-size:11px; opacity:.75; text-align:center; }
    .kpi-orange { background:linear-gradient(135deg,#F77F00,#e06500) !important; color:white !important; }
    .kpi-green  { background:linear-gradient(135deg,#009A44,#007a36) !important; color:white !important; }
    .kpi-blue   { background:linear-gradient(135deg,#1565C0,#0d47a1) !important; color:white !important; }
    .kpi-gold   { background:linear-gradient(135deg,#F9A825,#f57f17) !important; color:white !important; }
    .kpi-teal   { background:linear-gradient(135deg,#00796B,#00574b) !important; color:white !important; }
    .kpi-red    { background:linear-gradient(135deg,#C62828,#a11010) !important; color:white !important; }

    /* Charts */
    .charts-row { display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
    .chart-card { margin-bottom:24px; border-radius:10px !important; }
    .chart-large { flex:2; min-width:380px; }
    .chart-small { flex:1; min-width:240px; }
    .chart-third { flex:1; min-width:220px; }
    .chart-half  { flex:1; min-width:280px; }
    .chart-full  { width:100%; box-sizing:border-box; }
    mat-card-content canvas { width:100% !important; }
    mat-card-title { display:flex !important; align-items:center; gap:6px; font-size:14px !important; }
    mat-card-title mat-icon { font-size:18px; width:18px; height:18px; color:#F77F00; }

    /* Table */
    .table-card { margin-bottom:24px; }
    .full-width  { width:100%; }
    .amount      { font-weight:700; color:#009A44; }
    .badge       { padding:2px 10px; border-radius:20px; font-size:11px; font-weight:500;
                   background:#e3f2fd; color:#1565C0; }
    .badge-sp    { background:#e8f5e9; color:#2e7d32; }
    tr.mat-mdc-row:hover { background:#f9f9f9; }
  `],
})
export class RapportsBiComponent implements OnInit, OnDestroy {
  private svc    = inject(RapportsService);
  private router = inject(Router);

  @ViewChild('evolutionChart')      evolutionRef!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('natureChart')         natureRef!:         ElementRef<HTMLCanvasElement>;
  @ViewChild('centreChart')         centreRef!:         ElementRef<HTMLCanvasElement>;
  @ViewChild('canalChart')          canalRef!:          ElementRef<HTMLCanvasElement>;
  @ViewChild('moyenChart')          moyenRef!:          ElementRef<HTMLCanvasElement>;
  @ViewChild('genreIndividuChart')  genreIndividuRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('genreNaissanceChart') genreNaissanceRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('genreDecesChart')     genreDecesRef!:     ElementRef<HTMLCanvasElement>;

  loading  = signal(true);
  kpi      = signal<SyntheseKPI | null>(null);
  recettes = signal<RecettesCentre[]>([]);
  recCols  = ['rang', 'centre', 'type', 'nb', 'total'];

  private evolutionData: EvolutionMensuelle[] = [];
  private centreData:    ActesParCentre[]     = [];
  private canalData:     PaiementsCanal | null = null;
  private natureData:    { nature: string; count: number }[] = [];
  private genreData:     GenreStats | null = null;
  private charts:        Chart[]           = [];

  totalActes()     { return this.kpi()?.total_actes ?? 0; }
  tauxValidation() {
    const k = this.kpi();
    return (!k || !k.total_actes) ? 0 : Math.round(k.actes_valides / k.total_actes * 100);
  }
  nav(path: string) { this.router.navigate([path]); }

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
      next: (data) => {
        this.kpi.set(data.synthese);
        this.recettes.set(data.recettes);
        this.evolutionData = data.evolution;
        this.centreData    = data.centres;
        this.canalData     = data.canal;
        this.natureData    = data.nature;
        this.genreData     = data.genre;

        // Mettre loading à false → Angular rend les @if(!loading()) avec les canvas
        this.loading.set(false);

        // setTimeout(0) : attend que Angular ait fini le cycle de rendu
        // puis requestAnimationFrame : attend que le navigateur ait peint le DOM
        setTimeout(() => requestAnimationFrame(() => this.drawAllCharts()), 0);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  private make(el: HTMLCanvasElement | undefined, config: any): void {
    if (!el) return;
    const c = new Chart(el, config);
    this.charts.push(c);
  }

  private drawAllCharts() {
    this.drawEvolution();
    this.drawNature();
    this.drawCentres();
    this.drawCanal();
    this.drawMoyen();
    this.drawGenre();
  }

  private drawEvolution() {
    const el = this.evolutionRef?.nativeElement;
    if (!el) return;
    const months  = [...new Set(this.evolutionData.map(d => d.mois))].sort();
    const natures = ['NAISSANCE', 'MARIAGE', 'DECES'];
    const colors  = ['#F77F00', '#009A44', '#C62828'];
    const fills   = ['rgba(247,127,0,.15)', 'rgba(0,154,68,.15)', 'rgba(198,40,40,.15)'];

    this.make(el, {
      type: 'line',
      data: {
        labels: months,
        datasets: natures.map((nat, i) => ({
          label: NATURE_LABELS[nat],
          data: months.map(m => (this.evolutionData.find(d => d.mois === m && d.nature === nat)?.count ?? 0)),
          borderColor: colors[i], backgroundColor: fills[i],
          tension: 0.4, fill: true, pointRadius: 3,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { ticks: { maxRotation: 45, font: { size: 10 } } },
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  }

  private drawNature() {
    const el = this.natureRef?.nativeElement;
    if (!el) return;
    this.make(el, {
      type: 'doughnut',
      data: {
        labels: this.natureData.map(d => NATURE_LABELS[d.nature] ?? d.nature),
        datasets: [{
          data: this.natureData.map(d => d.count),
          backgroundColor: ['#F77F00', '#009A44', '#C62828'],
          borderWidth: 2, borderColor: '#fff', hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private drawCentres() {
    const el = this.centreRef?.nativeElement;
    if (!el) return;
    const labels = this.centreData.map(d =>
      (d.centre__nom ?? '').replace(/Sous-Préfecture de |Sous-Préfecture d'|Mairie de |Mairie d'/g, '')
    );
    const isSP = this.centreData.map(d => d.centre__type === 'SOUS_PREFECTURE');
    this.make(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: "Actes enregistrés",
          data: this.centreData.map(d => d.count),
          backgroundColor: isSP.map(sp => sp ? '#009A44' : '#F77F00'),
          borderColor:     isSP.map(sp => sp ? '#007a36' : '#e06500'),
          borderWidth: 1, borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: any[]) => this.centreData[items[0].dataIndex]?.centre__nom ?? '',
              label: (ctx: any) => ` ${ctx.parsed.y} actes`,
            },
          },
        },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  private drawCanal() {
    const el = this.canalRef?.nativeElement;
    if (!el || !this.canalData) return;
    this.make(el, {
      type: 'doughnut',
      data: {
        labels: this.canalData.par_canal.map(d => CANAL_LABELS[d.canal] ?? d.canal),
        datasets: [{
          data: this.canalData.par_canal.map(d => d.count),
          backgroundColor: ['#F77F00', '#009A44'],
          borderWidth: 2, borderColor: '#fff', hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private drawMoyen() {
    const el = this.moyenRef?.nativeElement;
    if (!el || !this.canalData) return;
    this.make(el, {
      type: 'bar',
      data: {
        labels: this.canalData.par_moyen.map(d => MOYEN_LABELS[d.moyen] ?? d.moyen),
        datasets: [{
          label: 'Transactions',
          data: this.canalData.par_moyen.map(d => d.count),
          backgroundColor: ['#009A44', '#F77F00', '#FF6F00', '#1565C0', '#7B1FA2'],
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  private drawGenre() {
    if (!this.genreData) return;
    const COLORS = ['#1565C0', '#E91E63'];

    const makePie = (ref: ElementRef<HTMLCanvasElement> | undefined, data: { sexe: string; count: number }[]) => {
      if (!ref?.nativeElement) return;
      this.make(ref.nativeElement, {
        type: 'doughnut',
        data: {
          labels: data.map(d => SEXE_LABELS[d.sexe] ?? d.sexe),
          datasets: [{
            data: data.map(d => d.count),
            backgroundColor: COLORS,
            borderWidth: 2, borderColor: '#fff', hoverOffset: 8,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        },
      });
    };

    makePie(this.genreIndividuRef,  this.genreData.individus_par_sexe);
    makePie(this.genreNaissanceRef, this.genreData.naissances_par_sexe);
    makePie(this.genreDecesRef,     this.genreData.deces_par_sexe);
  }
}
