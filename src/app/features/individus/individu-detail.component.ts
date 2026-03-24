import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { IndividusService } from '../../core/services/individus.service';
import { Individu } from '../../core/models/individu.models';
import { Acte } from '../../core/models/acte.models';
import { StatutBadgeComponent } from '../../shared/components/statut-badge/statut-badge.component';

@Component({
  selector: 'app-individu-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatDividerModule,
    MatProgressSpinnerModule, MatTableModule, StatutBadgeComponent,
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>person</mat-icon> Fiche individu</h2>
      <div>
        <button mat-stroked-button routerLink="/individus">
          <mat-icon>arrow_back</mat-icon> Retour
        </button>
        <button mat-raised-button color="primary" [routerLink]="['/actes','nouveau']"
                [queryParams]="{individu: individu()?.id}" style="margin-left:8px">
          <mat-icon>add</mat-icon> Nouvel acte
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (individu()) {
      <!-- Bannière décédé -->
      @if (individu()!.est_decede) {
        <div class="banner-deces">
          <mat-icon>info</mat-icon>
          Individu décédé le {{ individu()!.date_deces | date:'dd/MM/yyyy' }} —
          Aucune modification possible sur ses actes.
        </div>
      }

      <mat-card>
        <mat-card-content>
          <mat-tab-group>

            <!-- Onglet : Identité -->
            <mat-tab label="Identité">
              <div class="tab-content">
                <div class="info-grid">
                  <div class="info-item"><span class="label">NIN</span><code>{{ individu()!.nin }}</code></div>
                  <div class="info-item"><span class="label">Nom</span><strong>{{ individu()!.nom }}</strong></div>
                  <div class="info-item"><span class="label">Prénoms</span>{{ individu()!.prenoms }}</div>
                  <div class="info-item"><span class="label">Sexe</span>{{ individu()!.sexe_display }}</div>
                  <div class="info-item"><span class="label">Date de naissance</span>{{ individu()!.date_naissance | date:'dd/MM/yyyy' }}</div>
                  <div class="info-item"><span class="label">Lieu de naissance</span>{{ individu()!.lieu_naissance_libelle || individu()!.lieu_naissance_village_nom }}</div>
                  <div class="info-item"><span class="label">Nationalité</span>{{ individu()!.nationalite }}</div>
                  <div class="info-item"><span class="label">Centre de naissance</span>{{ individu()!.centre_naissance_nom }}</div>
                  <div class="info-item"><span class="label">Statut</span>
                    <app-statut-badge
                      [statut]="individu()!.est_decede ? 'verrouille' : 'valide'"
                      [label]="individu()!.est_decede ? 'Décédé' : 'Vivant'">
                    </app-statut-badge>
                  </div>
                </div>

                @if (individu()!.filiations?.length) {
                  <mat-divider class="my-16"></mat-divider>
                  <h4>Filiation</h4>
                  <div class="info-grid">
                    @for (f of individu()!.filiations; track f.id) {
                      <div class="info-item">
                        <span class="label">{{ f.role_display }}</span>
                        {{ f.parent_nom_complet }}
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Onglet : Actes -->
            <mat-tab [label]="'Actes (' + actes().length + ')'">
              <div class="tab-content">
                @if (loadingActes()) {
                  <div class="center"><mat-spinner diameter="32"></mat-spinner></div>
                } @else {
                  <mat-table [dataSource]="actes()" class="mat-elevation-z1">
                    <ng-container matColumnDef="numero">
                      <mat-header-cell *matHeaderCellDef>Numéro</mat-header-cell>
                      <mat-cell *matCellDef="let a"><code>{{ a.numero_national }}</code></mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="nature">
                      <mat-header-cell *matHeaderCellDef>Nature</mat-header-cell>
                      <mat-cell *matCellDef="let a">{{ a.nature_display }}</mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="date">
                      <mat-header-cell *matHeaderCellDef>Date</mat-header-cell>
                      <mat-cell *matCellDef="let a">{{ a.date_evenement | date:'dd/MM/yyyy' }}</mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="statut">
                      <mat-header-cell *matHeaderCellDef>Statut</mat-header-cell>
                      <mat-cell *matCellDef="let a">
                        <app-statut-badge [statut]="a.statut.toLowerCase()" [label]="a.statut_display"></app-statut-badge>
                      </mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <mat-header-cell *matHeaderCellDef></mat-header-cell>
                      <mat-cell *matCellDef="let a">
                        <button mat-icon-button [routerLink]="['/actes', a.id]">
                          <mat-icon>visibility</mat-icon>
                        </button>
                      </mat-cell>
                    </ng-container>
                    <mat-header-row *matHeaderRowDef="colonnesActes"></mat-header-row>
                    <mat-row *matRowDef="let row; columns: colonnesActes;"></mat-row>
                    <tr class="mat-row" *matNoDataRow>
                      <td class="mat-cell no-data" colspan="5">Aucun acte enregistré.</td>
                    </tr>
                  </mat-table>
                }
              </div>
            </mat-tab>

          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .page-header h2 { display:flex; align-items:center; gap:8px; margin:0; }
    .center { display:flex; justify-content:center; padding:32px; }
    .tab-content { padding:24px 0; }
    .info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:16px; }
    .info-item { display:flex; flex-direction:column; gap:4px; }
    .label { font-size:12px; color:#757575; text-transform:uppercase; letter-spacing:.5px; }
    code { background:#f5f5f5; padding:3px 8px; border-radius:4px; font-size:13px; width:fit-content; }
    .my-16 { margin:16px 0; }
    .no-data { padding:24px; text-align:center; color:#999; }
    .banner-deces { display:flex; align-items:center; gap:8px; background:#fce4ec;
                    color:#c62828; padding:12px 16px; border-radius:8px; margin-bottom:16px; }
  `],
})
export class IndividuDetailComponent implements OnInit {
  individu     = signal<Individu | null>(null);
  actes        = signal<Acte[]>([]);
  loading      = signal(false);
  loadingActes = signal(false);
  colonnesActes = ['numero', 'nature', 'date', 'statut', 'actions'];

  constructor(private route: ActivatedRoute, private svc: IndividusService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.svc.detail(id).subscribe({
      next: i => { this.individu.set(i); this.loading.set(false); this.chargerActes(id); },
      error: () => this.loading.set(false),
    });
  }

  chargerActes(id: string) {
    this.loadingActes.set(true);
    this.svc.actes(id).subscribe({
      next: a => { this.actes.set(a); this.loadingActes.set(false); },
      error: () => this.loadingActes.set(false),
    });
  }
}
