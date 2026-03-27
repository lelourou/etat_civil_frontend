import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
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
import { ActesService } from '../../core/services/actes.service';
import { Acte } from '../../core/models/acte.models';
import { StatutBadgeComponent } from '../../shared/components/statut-badge/statut-badge.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    CommonModule, DecimalPipe, RouterLink,
    MatCardModule, MatIconModule, MatTableModule, MatProgressSpinnerModule,
    MatTabsModule, MatButtonModule, MatTooltipModule,
    StatutBadgeComponent,
  ],
  template: `
<div style="padding:8px">

  <!-- En-tête -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
    <mat-icon style="font-size:36px;width:36px;height:36px;color:#F77F00">bar_chart</mat-icon>
    <div>
      <h2 style="margin:0;font-size:20px;font-weight:700">Tableau de bord analytique</h2>
      <span style="font-size:13px;color:#777">
        {{ isAgent() ? 'Mon centre — ' + (auth.agent()?.centre_nom ?? '') : 'Vue nationale' }}
      </span>
    </div>
  </div>

  <mat-tab-group animationDuration="200ms" (selectedIndexChange)="onTabChange($event)">

    <!-- ══════════════════════════════════════
         ONGLET 1 — ANALYTIQUE
         ══════════════════════════════════════ -->
    <mat-tab>
      <ng-template mat-tab-label>
        <mat-icon style="margin-right:6px;font-size:18px;width:18px;height:18px">insights</mat-icon>
        Analytique
      </ng-template>

      @if (loading()) {
        <div style="display:flex;flex-direction:column;align-items:center;padding:80px;gap:16px">
          <mat-spinner diameter="60"></mat-spinner>
          <p style="color:#777">Chargement des données…</p>
        </div>
      }

      @if (!loading()) {

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin:16px 0 28px">

          <mat-card style="background:linear-gradient(135deg,#F77F00,#e06500);color:white;border-radius:12px"
                    [style.cursor]="isAgent()?'pointer':'default'" (click)="nav('/actes')">
            <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
              <mat-icon style="font-size:36px;width:36px;height:36px">description</mat-icon>
              <div style="font-size:22px;font-weight:800">{{ kpi()?.total_actes | number }}</div>
              <div style="font-size:12px;opacity:.9;text-align:center">Actes enregistrés</div>
              <div style="font-size:11px;opacity:.75">{{ kpi()?.actes_naissance | number }} naissances</div>
            </mat-card-content>
          </mat-card>

          <mat-card style="background:linear-gradient(135deg,#009A44,#007a36);color:white;border-radius:12px"
                    [style.cursor]="isAgent()?'pointer':'default'" (click)="nav('/actes')">
            <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
              <mat-icon style="font-size:36px;width:36px;height:36px">verified</mat-icon>
              <div style="font-size:22px;font-weight:800">{{ kpi()?.actes_valides | number }}</div>
              <div style="font-size:12px;opacity:.9;text-align:center">Actes validés</div>
              <div style="font-size:11px;opacity:.75">{{ tauxValidation() }}% de validation</div>
            </mat-card-content>
          </mat-card>

          <mat-card style="background:linear-gradient(135deg,#1565C0,#0d47a1);color:white;border-radius:12px"
                    [style.cursor]="isAgent()?'pointer':'default'" (click)="nav('/individus')">
            <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
              <mat-icon style="font-size:36px;width:36px;height:36px">people</mat-icon>
              <div style="font-size:22px;font-weight:800">{{ kpi()?.total_individus | number }}</div>
              <div style="font-size:12px;opacity:.9;text-align:center">Individus</div>
              <div style="font-size:11px;opacity:.75">{{ kpi()?.individus_deces | number }} décédés</div>
            </mat-card-content>
          </mat-card>

          <mat-card style="background:linear-gradient(135deg,#F9A825,#f57f17);color:white;border-radius:12px"
                    [style.cursor]="isAgent()?'pointer':'default'" (click)="nav('/paiements')">
            <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
              <mat-icon style="font-size:36px;width:36px;height:36px">payments</mat-icon>
              <div style="font-size:22px;font-weight:800">{{ kpi()?.total_recettes | number:'1.0-0' }}</div>
              <div style="font-size:12px;opacity:.9;text-align:center">Recettes (FCFA)</div>
              <div style="font-size:11px;opacity:.75">{{ kpi()?.nb_paiements | number }} paiements</div>
            </mat-card-content>
          </mat-card>

          <mat-card style="background:linear-gradient(135deg,#00796B,#00574b);color:white;border-radius:12px"
                    [style.cursor]="isAgent()?'pointer':'default'" (click)="nav('/notifications')">
            <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
              <mat-icon style="font-size:36px;width:36px;height:36px">notifications_active</mat-icon>
              <div style="font-size:22px;font-weight:800">{{ kpi()?.notifs_attente | number }}</div>
              <div style="font-size:12px;opacity:.9;text-align:center">Notifs en attente</div>
              <div style="font-size:11px;opacity:.75">{{ kpi()?.total_notifications | number }} total</div>
            </mat-card-content>
          </mat-card>

          <mat-card style="background:linear-gradient(135deg,#C62828,#a11010);color:white;border-radius:12px">
            <mat-card-content style="display:flex;flex-direction:column;align-items:center;padding:16px;gap:4px">
              <mat-icon style="font-size:36px;width:36px;height:36px">person_off</mat-icon>
              <div style="font-size:22px;font-weight:800">{{ kpi()?.individus_deces | number }}</div>
              <div style="font-size:12px;opacity:.9;text-align:center">Décès enregistrés</div>
              <div style="font-size:11px;opacity:.75">{{ kpi()?.actes_deces | number }} actes</div>
            </mat-card-content>
          </mat-card>

        </div>

        <!-- Section graphiques -->
        <div [style.visibility]="chartsReady ? 'visible' : 'hidden'" id="charts-zone">

          <div class="section-titre">Évolution temporelle &amp; Distribution</div>
          <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">

            <!-- ── Graphique évolution avec contrôles ── -->
            <mat-card style="flex:2;min-width:340px">
              <mat-card-header>
                <mat-card-title>Évolution mensuelle des actes</mat-card-title>
              </mat-card-header>
              <mat-card-content>

                <!-- Barre de contrôles -->
                <div class="evo-controls">

                  <!-- Sélecteur d'année -->
                  <div class="evo-ctrl-group">
                    <span class="evo-ctrl-label">Année</span>
                    <div class="evo-btn-group">
                      <button class="evo-btn" [class.active]="evoAnnee === 'all'"
                              (click)="setAnnee('all')">Toutes</button>
                      @for (y of anneesDispo(); track y) {
                        <button class="evo-btn" [class.active]="evoAnnee === y"
                                (click)="setAnnee(y)">{{ y }}</button>
                      }
                    </div>
                  </div>

                  <!-- Sélecteur de natures -->
                  <div class="evo-ctrl-group">
                    <span class="evo-ctrl-label">Nature</span>
                    <div class="evo-btn-group">
                      <button class="evo-btn nature-naissance"
                              [class.active]="evoNatures.includes('NAISSANCE')"
                              (click)="toggleNature('NAISSANCE')">
                        Naissances
                      </button>
                      <button class="evo-btn nature-mariage"
                              [class.active]="evoNatures.includes('MARIAGE')"
                              (click)="toggleNature('MARIAGE')">
                        Mariages
                      </button>
                      <button class="evo-btn nature-deces"
                              [class.active]="evoNatures.includes('DECES')"
                              (click)="toggleNature('DECES')">
                        Décès
                      </button>
                    </div>
                  </div>

                  <!-- Type de graphique -->
                  <div class="evo-ctrl-group">
                    <span class="evo-ctrl-label">Vue</span>
                    <div class="evo-btn-group">
                      <button class="evo-btn" [class.active]="evoType === 'line'"
                              (click)="setEvoType('line')">
                        <mat-icon style="font-size:14px;width:14px;height:14px">show_chart</mat-icon>
                        Courbe
                      </button>
                      <button class="evo-btn" [class.active]="evoType === 'bar'"
                              (click)="setEvoType('bar')">
                        <mat-icon style="font-size:14px;width:14px;height:14px">bar_chart</mat-icon>
                        Barres
                      </button>
                    </div>
                  </div>

                </div>

                <canvas id="bi-evolution"></canvas>
              </mat-card-content>
            </mat-card>

            <mat-card style="flex:1;min-width:220px">
              <mat-card-header><mat-card-title>Répartition par nature</mat-card-title></mat-card-header>
              <mat-card-content><canvas id="bi-nature"></canvas></mat-card-content>
            </mat-card>
          </div>

          <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
            <mat-card style="flex:1;min-width:200px">
              <mat-card-header><mat-card-title>Individus par genre</mat-card-title></mat-card-header>
              <mat-card-content><canvas id="bi-genre-ind"></canvas></mat-card-content>
            </mat-card>
            <mat-card style="flex:1;min-width:200px">
              <mat-card-header><mat-card-title>Naissances par genre</mat-card-title></mat-card-header>
              <mat-card-content><canvas id="bi-genre-nai"></canvas></mat-card-content>
            </mat-card>
            <mat-card style="flex:1;min-width:200px">
              <mat-card-header><mat-card-title>Décès par genre</mat-card-title></mat-card-header>
              <mat-card-content><canvas id="bi-genre-dec"></canvas></mat-card-content>
            </mat-card>
          </div>

          @if (!isAgent()) {
          <div class="section-titre">Analyse géographique</div>
          <mat-card style="margin-bottom:24px">
            <mat-card-header>
              <mat-card-title>Top centres par volume d'actes</mat-card-title>
              <mat-card-subtitle>Vert = Sous-Préfecture · Orange = Mairie</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content><canvas id="bi-centres"></canvas></mat-card-content>
          </mat-card>
          }

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

          <div class="section-titre">Analyse des paiements</div>
          <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
            <mat-card style="flex:1;min-width:260px">
              <mat-card-header>
                <mat-card-title>Demandes par canal</mat-card-title>
                <mat-card-subtitle>Guichet vs En ligne</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content><canvas id="bi-canal"></canvas></mat-card-content>
            </mat-card>
            <mat-card style="flex:1;min-width:260px">
              <mat-card-header>
                <mat-card-title>Paiements par moyen</mat-card-title>
                <mat-card-subtitle>Espèces vs Mobile Money</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content><canvas id="bi-moyen"></canvas></mat-card-content>
            </mat-card>
          </div>

        </div>
      }
    </mat-tab>

    <!-- ══════════════════════════════════════
         ONGLET 2 — ACTES (agents uniquement)
         ══════════════════════════════════════ -->
    @if (isAgent()) {
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon style="margin-right:6px;font-size:18px;width:18px;height:18px">description</mat-icon>
          Actes
          @if (kpi()?.total_actes) {
            <span class="tab-count">{{ kpi()!.total_actes }}</span>
          }
        </ng-template>

        <div style="margin:16px 0">

          <!-- Actions rapides -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
            <button mat-raised-button color="primary" routerLink="/actes/nouveau">
              <mat-icon>add</mat-icon> Nouvel acte
            </button>
            <button mat-stroked-button routerLink="/actes">
              <mat-icon>list</mat-icon> Voir tous les actes
            </button>
          </div>

          <!-- KPIs actes -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px">
            <div class="kpi-mini" style="border-left:4px solid #009A44">
              <span class="kpi-val">{{ kpi()?.actes_naissance | number }}</span>
              <span class="kpi-lab">Naissances</span>
            </div>
            <div class="kpi-mini" style="border-left:4px solid #6A1B9A">
              <span class="kpi-val">{{ kpi()?.actes_mariage | number }}</span>
              <span class="kpi-lab">Mariages</span>
            </div>
            <div class="kpi-mini" style="border-left:4px solid #424242">
              <span class="kpi-val">{{ kpi()?.actes_deces | number }}</span>
              <span class="kpi-lab">Décès</span>
            </div>
            <div class="kpi-mini" style="border-left:4px solid #F77F00">
              <span class="kpi-val">{{ kpi()?.actes_brouillon | number }}</span>
              <span class="kpi-lab">En brouillon</span>
            </div>
          </div>

          <!-- Liste des derniers actes -->
          @if (loadingActes()) {
            <div style="display:flex;justify-content:center;padding:40px">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else {
            <mat-card>
              <mat-card-header>
                <mat-card-title>Derniers actes enregistrés</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="actes()" style="width:100%">
                  <ng-container matColumnDef="numero">
                    <th mat-header-cell *matHeaderCellDef>N° Acte</th>
                    <td mat-cell *matCellDef="let a"><code>{{ a.numero_acte }}</code></td>
                  </ng-container>
                  <ng-container matColumnDef="nature">
                    <th mat-header-cell *matHeaderCellDef>Nature</th>
                    <td mat-cell *matCellDef="let a">
                      <span [class]="'badge-nature badge-' + a.nature.toLowerCase()">
                        {{ a.nature_display }}
                      </span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="individu">
                    <th mat-header-cell *matHeaderCellDef>Individu</th>
                    <td mat-cell *matCellDef="let a">{{ a.individu_nom_complet }}</td>
                  </ng-container>
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date événement</th>
                    <td mat-cell *matCellDef="let a">{{ a.date_evenement | date:'dd/MM/yyyy' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="statut">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let a">
                      <app-statut-badge [statut]="a.statut"></app-statut-badge>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let a">
                      <button mat-icon-button [routerLink]="['/actes', a.id]" matTooltip="Voir">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      @if (a.statut === 'BROUILLON') {
                        <button mat-icon-button color="accent" [routerLink]="['/actes', a.id, 'modifier']" matTooltip="Modifier">
                          <mat-icon>edit</mat-icon>
                        </button>
                      }
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="actesCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: actesCols;" style="cursor:pointer"
                      [routerLink]="['/actes', row.id]"></tr>
                  <tr class="mat-mdc-row" *matNoDataRow>
                    <td colspan="6" style="text-align:center;padding:24px;color:#999">
                      Aucun acte enregistré pour ce centre.
                    </td>
                  </tr>
                </table>
              </mat-card-content>
            </mat-card>
          }

        </div>
      </mat-tab>
    }

    <!-- ══════════════════════════════════════
         ONGLET 3 — IMPRESSION D'ACTES (agent)
         ══════════════════════════════════════ -->
    @if (isAgent()) {
      <mat-tab>
        <ng-template mat-tab-label>
          <mat-icon style="margin-right:6px;font-size:18px;width:18px;height:18px">print</mat-icon>
          Impression d'actes
        </ng-template>

        <div style="margin:16px 0">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700">Liste des actes — {{ auth.agent()?.centre_nom }}</h3>
              <span style="font-size:13px;color:#777">{{ actesImpr().length }} acte(s) chargé(s)</span>
            </div>
            <div style="display:flex;gap:8px">
              <button mat-stroked-button (click)="chargerActesImpr()">
                <mat-icon>refresh</mat-icon> Actualiser
              </button>
              <button mat-raised-button color="primary" (click)="imprimerActes()" [disabled]="actesImpr().length===0">
                <mat-icon>print</mat-icon> Imprimer la liste
              </button>
            </div>
          </div>

          @if (loadingImpr()) {
            <div style="display:flex;justify-content:center;padding:40px">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else {
            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="actesImpr()" style="width:100%">
                  <ng-container matColumnDef="num">
                    <th mat-header-cell *matHeaderCellDef>#</th>
                    <td mat-cell *matCellDef="let a; let i = index">{{ i+1 }}</td>
                  </ng-container>
                  <ng-container matColumnDef="numero">
                    <th mat-header-cell *matHeaderCellDef>N° Acte</th>
                    <td mat-cell *matCellDef="let a"><code>{{ a.numero_national }}</code></td>
                  </ng-container>
                  <ng-container matColumnDef="nature">
                    <th mat-header-cell *matHeaderCellDef>Nature</th>
                    <td mat-cell *matCellDef="let a">
                      <span [class]="'badge-nature badge-' + a.nature.toLowerCase()">{{ a.nature_display }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="individu">
                    <th mat-header-cell *matHeaderCellDef>Individu</th>
                    <td mat-cell *matCellDef="let a">{{ a.individu_nom }}</td>
                  </ng-container>
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let a">{{ a.date_evenement | date:'dd/MM/yyyy' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="statut">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let a">
                      <app-statut-badge [statut]="a.statut"></app-statut-badge>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="act">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let a">
                      <button mat-icon-button matTooltip="Imprimer cet acte" (click)="imprimerUnActe(a)">
                        <mat-icon>print</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="imprimerActesCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: imprimerActesCols;"></tr>
                  <tr class="mat-mdc-row" *matNoDataRow>
                    <td colspan="7" style="text-align:center;padding:24px;color:#999">
                      Aucun acte. Cliquez sur "Actualiser".
                    </td>
                  </tr>
                </table>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </mat-tab>
    }

    <!-- ══════════════════════════════════════
         ONGLET 4/2 — IMPRESSION DE RAPPORTS
         ══════════════════════════════════════ -->
    <mat-tab>
      <ng-template mat-tab-label>
        <mat-icon style="margin-right:6px;font-size:18px;width:18px;height:18px">summarize</mat-icon>
        Impression de rapports
      </ng-template>

      <div style="margin:16px 0">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:700">Rapport de synthèse</h3>
            <span style="font-size:13px;color:#777">
              {{ isAgent() ? (auth.agent()?.centre_nom ?? '') : 'Vue nationale — tous les centres' }}
            </span>
          </div>
          <button mat-raised-button color="primary" (click)="imprimerRapport()" [disabled]="!kpi()">
            <mat-icon>print</mat-icon> Imprimer le rapport
          </button>
        </div>

        @if (kpi()) {
          <!-- Aperçu du rapport -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px">

            <mat-card>
              <mat-card-header><mat-card-title style="font-size:14px">Actes enregistrés</mat-card-title></mat-card-header>
              <mat-card-content>
                <table style="width:100%;font-size:13px;border-collapse:collapse">
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Total actes</td><td style="text-align:right;font-weight:700;color:#009A44">{{ kpi()!.total_actes | number }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Naissances</td><td style="text-align:right;font-weight:700;color:#00796B">{{ kpi()!.actes_naissance | number }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Mariages</td><td style="text-align:right;font-weight:700;color:#6A1B9A">{{ kpi()!.actes_mariage | number }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Décès</td><td style="text-align:right;font-weight:700;color:#424242">{{ kpi()!.actes_deces | number }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Validés</td><td style="text-align:right;font-weight:700;color:#2e7d32">{{ kpi()!.actes_valides | number }}</td></tr>
                  <tr><td style="padding:6px 4px;color:#555">Brouillons</td><td style="text-align:right;font-weight:700;color:#F77F00">{{ kpi()!.actes_brouillon | number }}</td></tr>
                </table>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title style="font-size:14px">Individus & paiements</mat-card-title></mat-card-header>
              <mat-card-content>
                <table style="width:100%;font-size:13px;border-collapse:collapse">
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Individus enregistrés</td><td style="text-align:right;font-weight:700;color:#1565C0">{{ kpi()!.total_individus | number }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Individus décédés</td><td style="text-align:right;font-weight:700;color:#424242">{{ kpi()!.individus_deces | number }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Total recettes (FCFA)</td><td style="text-align:right;font-weight:700;color:#009A44">{{ kpi()!.total_recettes | number:'1.0-0' }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Paiements effectués</td><td style="text-align:right;font-weight:700">{{ kpi()!.nb_paiements | number }}</td></tr>
                  <tr style="border-bottom:1px solid #eee"><td style="padding:6px 4px;color:#555">Notifs en attente</td><td style="text-align:right;font-weight:700;color:#F77F00">{{ kpi()!.notifs_attente | number }}</td></tr>
                  <tr><td style="padding:6px 4px;color:#555">Taux validation</td><td style="text-align:right;font-weight:700;color:#2e7d32">{{ tauxValidation() }}%</td></tr>
                </table>
              </mat-card-content>
            </mat-card>

          </div>

          <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;font-size:12px;color:#777">
            <mat-icon style="font-size:16px;width:16px;height:16px;vertical-align:middle;margin-right:4px">info</mat-icon>
            Cliquez sur <strong>Imprimer le rapport</strong> pour ouvrir le document formaté et l'imprimer ou l'enregistrer en PDF.
          </div>
        } @else {
          <div style="text-align:center;padding:40px;color:#999">Données non disponibles</div>
        }
      </div>
    </mat-tab>

  </mat-tab-group>

</div>
  `,
  styles: [`
    mat-card { border-radius: 10px !important; margin-bottom: 0; }
    mat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.15) !important; }
    tr.mat-mdc-row:hover { background: #f5f5f5; }
    .section-titre { color:#009A44; font-weight:600; font-size:15px;
                     border-bottom:2px solid #e8f5e9; padding-bottom:6px; margin-bottom:16px; }
    .tab-count { margin-left:6px; font-size:11px; background:#e0e0e0;
                 border-radius:10px; padding:1px 7px; }
    .kpi-mini { background:#fafafa; border-radius:8px; padding:12px 16px;
                display:flex; flex-direction:column; gap:4px; }
    .kpi-val  { font-size:24px; font-weight:700; color:#333; }
    .kpi-lab  { font-size:12px; color:#777; text-transform:uppercase; letter-spacing:.05em; }
    .badge-nature { font-size:11px; padding:2px 10px; border-radius:10px; font-weight:500; }
    .badge-naissance { background:#e8f5e9; color:#2e7d32; }
    .badge-mariage   { background:#f3e5f5; color:#6a1b9a; }
    .badge-deces     { background:#424242; color:#fff; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:11px; }

    .evo-controls { display:flex; flex-wrap:wrap; gap:10px 20px; margin-bottom:14px;
                    padding:10px 12px; background:#f9f9f9; border-radius:8px;
                    border:1px solid #eee; }
    .evo-ctrl-group { display:flex; align-items:center; gap:8px; }
    .evo-ctrl-label { font-size:11px; font-weight:600; color:#777; text-transform:uppercase;
                      letter-spacing:.06em; white-space:nowrap; }
    .evo-btn-group { display:flex; gap:4px; flex-wrap:wrap; }
    .evo-btn { display:flex; align-items:center; gap:3px; font-size:12px; padding:3px 10px;
               border:1px solid #ddd; border-radius:16px; background:#fff; cursor:pointer;
               color:#555; transition:all .15s; }
    .evo-btn:hover { border-color:#009A44; color:#009A44; }
    .evo-btn.active { background:#009A44; color:#fff; border-color:#009A44; font-weight:600; }
    .evo-btn.nature-naissance.active { background:#F77F00; border-color:#F77F00; }
    .evo-btn.nature-mariage.active   { background:#6A1B9A; border-color:#6A1B9A; }
    .evo-btn.nature-deces.active     { background:#424242; border-color:#424242; }
  `],
})
export class RapportsBiComponent implements OnInit, AfterViewInit, OnDestroy {
  private svc     = inject(RapportsService);
  private actesSvc = inject(ActesService);
  private router  = inject(Router);
  public  auth    = inject(AuthService);
  private cdr     = inject(ChangeDetectorRef);

  loading          = signal(true);
  loadingActes     = signal(false);
  loadingImpr      = signal(false);
  kpi              = signal<SyntheseKPI | null>(null);
  recettes         = signal<RecettesCentre[]>([]);
  actes            = signal<Acte[]>([]);
  actesImpr        = signal<Acte[]>([]);
  recCols          = ['rang', 'centre', 'type', 'nb', 'total'];
  actesCols        = ['numero', 'nature', 'individu', 'date', 'statut', 'actions'];
  imprimerActesCols = ['num', 'numero', 'nature', 'individu', 'date', 'statut', 'act'];
  chartsReady  = false;

  private evolutionData: EvolutionMensuelle[]                = [];
  private centreData:    ActesParCentre[]                    = [];
  private canalData:     PaiementsCanal | null               = null;
  private natureData:    { nature: string; count: number }[] = [];
  private genreData:     GenreStats | null                   = null;
  private charts:        Chart[]                             = [];
  private evolutionChart: Chart | null                       = null;
  private viewReady = false;
  private dataReady = false;

  // Contrôles du graphique d'évolution
  evoAnnee   = 'all';
  evoNatures = ['NAISSANCE', 'MARIAGE', 'DECES'];
  evoType:   'line' | 'bar' = 'line';
  anneesDispo = signal<string[]>([]);

  setAnnee(y: string) { this.evoAnnee = y; this.updateEvolution(); }
  setEvoType(t: 'line' | 'bar') { this.evoType = t; this.rebuildEvolution(); }

  toggleNature(n: string) {
    if (this.evoNatures.includes(n)) {
      if (this.evoNatures.length > 1) this.evoNatures = this.evoNatures.filter(x => x !== n);
    } else {
      this.evoNatures = [...this.evoNatures, n];
    }
    this.updateEvolution();
  }

  tauxValidation() {
    const k = this.kpi();
    return (!k || !k.total_actes) ? 0 : Math.round(k.actes_valides / k.total_actes * 100);
  }
  isAgent() { return this.auth.role === 'AGENT_CENTRE'; }
  nav(p: string) { if (this.isAgent()) this.router.navigate([p]); }

  ngOnInit() {
    // Chaque observable a son propre catchError → un échec isolé ne bloque pas les autres
    forkJoin({
      synthese:  this.svc.synthese().pipe(catchError(() => of(null))),
      evolution: this.svc.evolutionMensuelle().pipe(catchError(() => of([]))),
      nature:    this.svc.actesParNature().pipe(catchError(() => of([]))),
      centres:   this.svc.actesParCentre().pipe(catchError(() => of([]))),
      recettes:  this.svc.recettesParCentre().pipe(catchError(() => of([]))),
      canal:     this.svc.paiementsParCanal().pipe(catchError(() => of(null))),
      genre:     this.svc.actesParGenre().pipe(catchError(() => of(null))),
    }).subscribe(d => {
      this.kpi.set(d.synthese);
      this.recettes.set(d.recettes as RecettesCentre[]);
      this.evolutionData = d.evolution as EvolutionMensuelle[];
      this.centreData    = d.centres as ActesParCentre[];
      this.canalData     = d.canal as PaiementsCanal | null;
      this.natureData    = d.nature as { nature: string; count: number }[];
      this.genreData     = d.genre as GenreStats | null;
      // Extraire les années disponibles pour le sélecteur
      const years = [...new Set(this.evolutionData.map(e => e.mois.substring(0, 4)))].sort().reverse();
      this.anneesDispo.set(years);
      this.loading.set(false);
      this.cdr.detectChanges();
      this.dataReady = true;
      if (this.viewReady) this.scheduleDrawAll();
    });

    if (this.isAgent()) {
      this.chargerActes();
    }
  }

  chargerActes() {
    this.loadingActes.set(true);
    this.actesSvc.liste({ page_size: '20' } as any).subscribe({
      next: r => { this.actes.set(r.results); this.loadingActes.set(false); },
      error: () => this.loadingActes.set(false),
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.dataReady) this.scheduleDrawAll();
  }

  ngOnDestroy() { this.charts.forEach(c => c.destroy()); }

  onTabChange(idx: number) {
    if (idx === 0 && this.dataReady) {
      this.charts.forEach(c => c.destroy());
      this.charts = [];
      this.chartsReady = false;
      setTimeout(() => this.scheduleDrawAll(), 50);
    }
    // Charger tous les actes quand l'agent ouvre l'onglet "Impression d'actes" (idx 2)
    if (this.isAgent() && idx === 2) {
      this.chargerActesImpr();
    }
  }

  private scheduleDrawAll() {
    // setTimeout garantit que le DOM est à jour (visibility changée) avant de dessiner
    setTimeout(() => {
      this.chartsReady = true;
      this.cdr.detectChanges();
      this.drawAll();
    }, 50);
  }

  private cvs(id: string) { return document.getElementById(id) as HTMLCanvasElement | null; }
  private reg(c: Chart)   { this.charts.push(c); }

  /** Filtre les données d'évolution selon les contrôles sélectionnés */
  private filteredEvoData(): { months: string[]; nats: string[]; data: EvolutionMensuelle[] } {
    const data = this.evoAnnee === 'all'
      ? this.evolutionData
      : this.evolutionData.filter(e => e.mois.startsWith(this.evoAnnee));
    const months = [...new Set(data.map(d => d.mois))].sort();
    const nats   = ['NAISSANCE','MARIAGE','DECES'].filter(n => this.evoNatures.includes(n));
    return { months, nats, data };
  }

  /** Met à jour les données du graphique existant sans le recréer */
  private updateEvolution() {
    if (!this.evolutionChart) return;
    const { months, nats, data } = this.filteredEvoData();
    const colors = { NAISSANCE: '#F77F00', MARIAGE: '#009A44', DECES: '#C62828' };
    const fills  = { NAISSANCE: 'rgba(247,127,0,.15)', MARIAGE: 'rgba(0,154,68,.15)', DECES: 'rgba(198,40,40,.15)' };

    this.evolutionChart.data.labels = months;
    this.evolutionChart.data.datasets = nats.map(n => ({
      label: NL[n],
      tension: 0.4,
      fill: this.evoType === 'line',
      borderColor: colors[n as keyof typeof colors],
      backgroundColor: fills[n as keyof typeof fills],
      pointRadius: 3,
      data: months.map(m => data.find(d => d.mois === m && d.nature === n)?.count ?? 0),
    }));
    this.evolutionChart.update();
  }

  /** Recrée le graphique (changement de type line ↔ bar) */
  private rebuildEvolution() {
    if (this.evolutionChart) {
      this.evolutionChart.destroy();
      this.evolutionChart = null;
      this.charts = this.charts.filter(c => c !== this.evolutionChart);
    }
    this.drawEvolution();
  }

  chargerActesImpr() {
    if (this.loadingImpr()) return;
    this.loadingImpr.set(true);
    this.actesSvc.liste({ page_size: '500' } as any).subscribe({
      next: r => { this.actesImpr.set(r.results); this.loadingImpr.set(false); },
      error: () => this.loadingImpr.set(false),
    });
  }

  imprimerActes() {
    const actes = this.actesImpr();
    const centre = this.auth.agent()?.centre_nom ?? '';
    const date = new Date().toLocaleDateString('fr-FR');
    const rows = actes.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><code>${a.numero_national ?? ''}</code></td>
        <td><span class="badge ${(a.nature ?? '').toLowerCase()}">${a.nature_display ?? a.nature}</span></td>
        <td>${a.individu_nom ?? ''}</td>
        <td>${a.date_evenement ? new Date(a.date_evenement).toLocaleDateString('fr-FR') : ''}</td>
        <td>${a.statut_display ?? a.statut}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Actes — ${centre}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:30px;font-size:12px}
        h1,h2{text-align:center;margin:4px 0}
        h1{font-size:16px} h2{font-size:13px;font-weight:normal;color:#555}
        .sub{text-align:center;color:#777;font-size:11px;border-bottom:2px solid #009A44;padding-bottom:8px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse}
        th{background:#009A44;color:#fff;padding:7px 8px;text-align:left;font-size:11px}
        td{padding:5px 8px;border-bottom:1px solid #eee}
        tr:nth-child(even){background:#f9f9f9}
        code{background:#f0f0f0;padding:1px 5px;border-radius:3px}
        .badge{padding:1px 7px;border-radius:10px;font-weight:600;font-size:10px}
        .naissance{background:#e8f5e9;color:#2e7d32}
        .mariage{background:#f3e5f5;color:#6a1b9a}
        .deces{background:#eee;color:#333}
        .footer{margin-top:20px;font-size:10px;color:#aaa;text-align:right}
      </style></head><body>
      <h1>REPUBLIQUE DE CÔTE D'IVOIRE</h1>
      <h2>Liste des Actes d'État Civil</h2>
      <div class="sub">Centre : <strong>${centre}</strong> &nbsp;|&nbsp; Imprimé le : ${date}</div>
      <table>
        <thead><tr><th>#</th><th>N° Acte</th><th>Nature</th><th>Individu</th><th>Date événement</th><th>Statut</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Total : ${actes.length} actes</div>
      </body></html>`;
    const w = window.open('', '_blank', 'width=920,height=700');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
  }

  imprimerUnActe(a: Acte) {
    const centre = this.auth.agent()?.centre_nom ?? '';
    const date = new Date().toLocaleDateString('fr-FR');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Acte ${a.numero_national}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;font-size:13px}
        h1,h2,h3{text-align:center;margin:4px 0}
        h1{font-size:16px} h2{font-size:13px;font-weight:normal;color:#555}
        .sep{border-top:2px solid #009A44;margin:14px 0}
        .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee}
        .lbl{color:#777;font-size:12px} .val{font-weight:600}
        .footer{margin-top:30px;font-size:10px;color:#aaa;text-align:center}
        .badge{padding:2px 10px;border-radius:10px;font-weight:600;font-size:11px;display:inline-block}
        .naissance{background:#e8f5e9;color:#2e7d32}
        .mariage{background:#f3e5f5;color:#6a1b9a}
        .deces{background:#eee;color:#333}
      </style></head><body>
      <h1>REPUBLIQUE DE CÔTE D'IVOIRE</h1>
      <h2>DIRECTION GÉNÉRALE DE L'ÉTAT CIVIL</h2>
      <h3 style="margin-top:8px">Acte de ${a.nature_display ?? a.nature}</h3>
      <div class="sep"></div>
      <div class="row"><span class="lbl">Numéro d'acte</span><span class="val">${a.numero_national ?? ''}</span></div>
      <div class="row"><span class="lbl">Nature</span><span class="val"><span class="badge ${(a.nature ?? '').toLowerCase()}">${a.nature_display ?? a.nature}</span></span></div>
      <div class="row"><span class="lbl">Individu</span><span class="val">${a.individu_nom ?? ''}</span></div>
      <div class="row"><span class="lbl">Date de l'événement</span><span class="val">${a.date_evenement ? new Date(a.date_evenement).toLocaleDateString('fr-FR') : ''}</span></div>
      <div class="row"><span class="lbl">Centre</span><span class="val">${centre}</span></div>
      <div class="row"><span class="lbl">Statut</span><span class="val">${a.statut_display ?? a.statut}</span></div>
      <div class="footer">Imprimé le ${date} — Système d'Information État Civil CI</div>
      </body></html>`;
    const w = window.open('', '_blank', 'width=700,height=600');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
  }

  imprimerRapport() {
    const k = this.kpi();
    const scope = this.isAgent() ? (this.auth.agent()?.centre_nom ?? '') : 'Vue Nationale — Tous les centres';
    const date = new Date().toLocaleDateString('fr-FR');
    const tx = this.tauxValidation();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Rapport — ${scope}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;font-size:13px}
        h1,h2{text-align:center;margin:4px 0}
        h1{font-size:16px} h2{font-size:13px;font-weight:normal;color:#555}
        .sub{text-align:center;font-size:12px;color:#777;border-bottom:2px solid #009A44;padding-bottom:10px;margin-bottom:24px}
        .section{margin-bottom:22px}
        .section h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#009A44;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px}
        table{width:100%;border-collapse:collapse}
        th{background:#f5f5f5;padding:7px 10px;text-align:left;font-weight:600;font-size:11px;border-bottom:2px solid #ddd}
        td{padding:6px 10px;border-bottom:1px solid #eee}
        .right{text-align:right;font-weight:700;color:#009A44}
        .footer{margin-top:40px;font-size:10px;color:#aaa;text-align:center}
      </style></head><body>
      <h1>REPUBLIQUE DE CÔTE D'IVOIRE</h1>
      <h2>DIRECTION GÉNÉRALE DE L'ÉTAT CIVIL</h2>
      <div class="sub"><strong>Rapport de Synthèse</strong><br>${scope}<br>Imprimé le : ${date}</div>
      <div class="section">
        <h3>Actes enregistrés</h3>
        <table>
          <tr><th>Indicateur</th><th>Valeur</th></tr>
          <tr><td>Total actes</td><td class="right">${k?.total_actes ?? 0}</td></tr>
          <tr><td>Actes de naissance</td><td class="right">${k?.actes_naissance ?? 0}</td></tr>
          <tr><td>Actes de mariage</td><td class="right">${k?.actes_mariage ?? 0}</td></tr>
          <tr><td>Actes de décès</td><td class="right">${k?.actes_deces ?? 0}</td></tr>
          <tr><td>Actes validés</td><td class="right">${k?.actes_valides ?? 0}</td></tr>
          <tr><td>Actes en brouillon</td><td class="right">${k?.actes_brouillon ?? 0}</td></tr>
          <tr><td>Taux de validation</td><td class="right">${tx}%</td></tr>
        </table>
      </div>
      <div class="section">
        <h3>Individus &amp; paiements</h3>
        <table>
          <tr><th>Indicateur</th><th>Valeur</th></tr>
          <tr><td>Total individus</td><td class="right">${k?.total_individus ?? 0}</td></tr>
          <tr><td>Individus décédés</td><td class="right">${k?.individus_deces ?? 0}</td></tr>
          <tr><td>Total recettes (FCFA)</td><td class="right">${(k?.total_recettes ?? 0).toLocaleString('fr-FR')}</td></tr>
          <tr><td>Nombre de paiements</td><td class="right">${k?.nb_paiements ?? 0}</td></tr>
          <tr><td>Notifications en attente</td><td class="right">${k?.notifs_attente ?? 0}</td></tr>
        </table>
      </div>
      <div class="footer">Document généré automatiquement — Système d'Information État Civil CI</div>
      </body></html>`;
    const w = window.open('', '_blank', 'width=800,height=700');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
  }

  private drawAll() {
    this.drawEvolution();
    this.drawNature();
    if (!this.isAgent()) this.drawCentres();
    this.drawCanal();
    this.drawMoyen();
    this.drawGenre();
  }

  private drawEvolution() {
    const el = this.cvs('bi-evolution'); if (!el) return;
    const { months, nats, data } = this.filteredEvoData();
    const colors = { NAISSANCE: '#F77F00', MARIAGE: '#009A44', DECES: '#C62828' };
    const fills  = { NAISSANCE: 'rgba(247,127,0,.15)', MARIAGE: 'rgba(0,154,68,.15)', DECES: 'rgba(198,40,40,.15)' };
    const chart = new Chart(el, {
      type: this.evoType,
      data: {
        labels: months,
        datasets: nats.map(n => ({
          label: NL[n], tension: 0.4,
          fill: this.evoType === 'line',
          borderColor: colors[n as keyof typeof colors],
          backgroundColor: fills[n as keyof typeof fills],
          pointRadius: 3,
          data: months.map(m => data.find(d => d.mois === m && d.nature === n)?.count ?? 0),
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 2.5,
        plugins: { legend: { position: 'top' } },
        scales: { x: { ticks: { maxRotation: 45, font: { size: 10 } } }, y: { beginAtZero: true } },
      },
    });
    this.evolutionChart = chart;
    this.reg(chart);
  }

  private drawNature() {
    const el = this.cvs('bi-nature'); if (!el) return;
    if (!this.natureData.length) return;
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
    if (!this.centreData.length) return;
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
    if (!this.canalData.par_canal.length) return;
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
    if (!this.canalData.par_moyen.length) return;
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
