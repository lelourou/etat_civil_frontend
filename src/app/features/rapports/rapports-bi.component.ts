import {
  Component, OnInit, AfterViewInit,
  ElementRef, ViewChild, inject, signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import {
  Chart, LineController, BarController, DoughnutController,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Title,
} from 'chart.js';
import {
  RapportsService,
  SyntheseKPI, EvolutionMensuelle, ActesParCentre,
  RecettesCentre, PaiementsCanal,
} from '../../core/services/rapports.service';
import { forkJoin } from 'rxjs';

Chart.register(
  LineController, BarController, DoughnutController,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Title,
);

@Component({
  selector: 'app-rapports-bi',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    MatCardModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="bi-container">
      <h2 class="page-title">
        <mat-icon>bar_chart</mat-icon>
        Tableau de bord analytique
      </h2>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
      } @else {

      <!-- ── KPI Cards ─────────────────────────────────── -->
      <div class="kpi-grid">
        <mat-card class="kpi-card kpi-orange">
          <mat-card-content>
            <mat-icon>description</mat-icon>
            <div class="kpi-value">{{ kpi()?.total_actes | number }}</div>
            <div class="kpi-label">Actes enregistrés</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-green">
          <mat-card-content>
            <mat-icon>check_circle</mat-icon>
            <div class="kpi-value">{{ kpi()?.actes_valides | number }}</div>
            <div class="kpi-label">Actes validés</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-blue">
          <mat-card-content>
            <mat-icon>people</mat-icon>
            <div class="kpi-value">{{ kpi()?.total_individus | number }}</div>
            <div class="kpi-label">Individus enregistrés</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-gold">
          <mat-card-content>
            <mat-icon>payments</mat-icon>
            <div class="kpi-value">{{ kpi()?.total_recettes | number:'1.0-0' }} FCFA</div>
            <div class="kpi-label">Recettes confirmées</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-teal">
          <mat-card-content>
            <mat-icon>notifications_active</mat-icon>
            <div class="kpi-value">{{ kpi()?.notifs_attente | number }}</div>
            <div class="kpi-label">Notifications en attente</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-red">
          <mat-card-content>
            <mat-icon>person_off</mat-icon>
            <div class="kpi-value">{{ kpi()?.individus_deces | number }}</div>
            <div class="kpi-label">Décès enregistrés</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- ── Charts Row 1 ──────────────────────────────── -->
      <div class="charts-row">
        <mat-card class="chart-card chart-large">
          <mat-card-header>
            <mat-card-title>Évolution mensuelle des actes (12 derniers mois)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #evolutionChart></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card chart-small">
          <mat-card-header>
            <mat-card-title>Répartition par nature</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #natureChart></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- ── Chart Row 2 ───────────────────────────────── -->
      <mat-card class="chart-card chart-full">
        <mat-card-header>
          <mat-card-title>Top centres par volume d'actes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <canvas #centreChart></canvas>
        </mat-card-content>
      </mat-card>

      <!-- ── Recettes Table ────────────────────────────── -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Recettes par centre</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="recettes()" class="full-width">
            <ng-container matColumnDef="centre">
              <th mat-header-cell *matHeaderCellDef>Centre</th>
              <td mat-cell *matCellDef="let r">{{ r.centre_nom }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let r">
                <span class="badge" [class.badge-sp]="r.centre_type === 'SOUS_PREFECTURE'">
                  {{ r.centre_type === 'SOUS_PREFECTURE' ? 'Sous-préf.' : 'Mairie' }}
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

      <!-- ── Canaux & Moyens ───────────────────────────── -->
      <div class="charts-row">
        <mat-card class="chart-card chart-half">
          <mat-card-header>
            <mat-card-title>Demandes par canal</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #canalChart></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card chart-half">
          <mat-card-header>
            <mat-card-title>Paiements par moyen</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #moyenChart></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      } <!-- end @else -->
    </div>
  `,
  styles: [`
    .bi-container { padding: 8px; }
    .page-title { display: flex; align-items: center; gap: 10px;
                  color: #F77F00; font-weight: 600; margin-bottom: 24px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 16px; margin-bottom: 24px; }
    .kpi-card mat-card-content { display: flex; flex-direction: column;
                                  align-items: center; padding: 20px; gap: 8px; }
    .kpi-card mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .kpi-value { font-size: 22px; font-weight: 700; }
    .kpi-label { font-size: 13px; opacity: 0.85; text-align: center; }
    .kpi-orange { background: #F77F00 !important; color: white !important; }
    .kpi-green  { background: #009A44 !important; color: white !important; }
    .kpi-blue   { background: #1565C0 !important; color: white !important; }
    .kpi-gold   { background: #F9A825 !important; color: white !important; }
    .kpi-teal   { background: #00796B !important; color: white !important; }
    .kpi-red    { background: #C62828 !important; color: white !important; }

    /* Charts */
    .charts-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .chart-card { margin-bottom: 24px; }
    .chart-large { flex: 2; min-width: 400px; }
    .chart-small { flex: 1; min-width: 250px; }
    .chart-full  { width: 100%; }
    .chart-half  { flex: 1; min-width: 280px; }
    canvas { max-height: 300px; }

    /* Table */
    .table-card { margin-bottom: 24px; }
    .full-width { width: 100%; }
    .amount { font-weight: 600; color: #009A44; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 12px;
             background: #e3f2fd; color: #1565C0; }
    .badge-sp { background: #e8f5e9; color: #2e7d32; }
  `],
})
export class RapportsBiComponent implements OnInit, AfterViewInit {
  private svc = inject(RapportsService);

  @ViewChild('evolutionChart') evolutionRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('natureChart')    natureRef!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('centreChart')    centreRef!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('canalChart')     canalRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('moyenChart')     moyenRef!:     ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  kpi     = signal<SyntheseKPI | null>(null);
  recettes = signal<RecettesCentre[]>([]);
  recCols = ['centre', 'type', 'nb', 'total'];

  private evolutionData: EvolutionMensuelle[] = [];
  private centreData: ActesParCentre[] = [];
  private canalData: PaiementsCanal | null = null;

  ngOnInit() {
    forkJoin({
      synthese:   this.svc.synthese(),
      evolution:  this.svc.evolutionMensuelle(),
      nature:     this.svc.actesParNature(),
      centres:    this.svc.actesParCentre(),
      recettes:   this.svc.recettesParCentre(),
      canal:      this.svc.paiementsParCanal(),
    }).subscribe({
      next: (data) => {
        this.kpi.set(data.synthese);
        this.recettes.set(data.recettes);
        this.evolutionData = data.evolution;
        this.centreData = data.centres;
        this.canalData = data.canal;
        this.loading.set(false);
        // Charts drawn in ngAfterViewInit after data loaded — schedule for next tick
        setTimeout(() => this.drawCharts(data.nature), 0);
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit() {}

  private drawCharts(natureData: { nature: string; count: number }[]) {
    this.drawEvolution();
    this.drawNature(natureData);
    this.drawCentres();
    this.drawCanal();
    this.drawMoyen();
  }

  private drawEvolution() {
    if (!this.evolutionRef) return;
    const months = [...new Set(this.evolutionData.map(d => d.mois))].sort();
    const natures = ['NAISSANCE', 'MARIAGE', 'DECES'];
    const colors  = ['#F77F00', '#009A44', '#C62828'];

    const datasets = natures.map((nat, i) => ({
      label: nat.charAt(0) + nat.slice(1).toLowerCase(),
      data: months.map(m => {
        const found = this.evolutionData.find(d => d.mois === m && d.nature === nat);
        return found ? found.count : 0;
      }),
      borderColor: colors[i],
      backgroundColor: colors[i] + '33',
      tension: 0.4,
      fill: true,
    }));

    new Chart(this.evolutionRef.nativeElement, {
      type: 'line',
      data: { labels: months, datasets },
      options: { responsive: true, plugins: { legend: { position: 'top' } } },
    });
  }

  private drawNature(data: { nature: string; count: number }[]) {
    if (!this.natureRef) return;
    new Chart(this.natureRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.nature),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: ['#F77F00', '#009A44', '#C62828', '#1565C0'],
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'right' } } },
    });
  }

  private drawCentres() {
    if (!this.centreRef) return;
    new Chart(this.centreRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.centreData.map(d => d.centre__nom),
        datasets: [{
          label: "Nombre d'actes",
          data: this.centreData.map(d => d.count),
          backgroundColor: '#009A44',
          borderColor: '#007a36',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private drawCanal() {
    if (!this.canalRef || !this.canalData) return;
    new Chart(this.canalRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.canalData.par_canal.map(d => d.canal),
        datasets: [{
          data: this.canalData.par_canal.map(d => d.count),
          backgroundColor: ['#F77F00', '#009A44', '#1565C0'],
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });
  }

  private drawMoyen() {
    if (!this.moyenRef || !this.canalData) return;
    new Chart(this.moyenRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.canalData.par_moyen.map(d => d.moyen),
        datasets: [{
          label: 'Transactions',
          data: this.canalData.par_moyen.map(d => d.count),
          backgroundColor: '#F77F00',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }
}
