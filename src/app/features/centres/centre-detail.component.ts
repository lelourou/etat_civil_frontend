import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CentresService, Centre, AgentCentre, VillageCourant, Village } from '../../core/services/centres.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-centre-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTableModule, MatTabsModule, MatCardModule, MatTooltipModule,
    MatDividerModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/centres" matTooltip="Retour à la liste">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h2>{{ centre()?.nom ?? 'Chargement…' }}</h2>
      @if (isAdmin() && centre()?.id) {
        <button mat-stroked-button color="accent" [routerLink]="['/centres', centre()!.id, 'modifier']">
          <mat-icon>edit</mat-icon> Modifier
        </button>
      }
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (centre()) {

      <!-- Fiche résumé -->
      <div class="fiche-header">
        <div class="fiche-badge" [class]="'badge-type badge-' + centre()!.type.toLowerCase()">
          <mat-icon>{{ iconeType(centre()!.type) }}</mat-icon>
          {{ centre()!.type_display }}
        </div>
        @if (centre()!.actif) {
          <span class="badge-actif">Actif</span>
        } @else {
          <span class="badge-ferme">Fermé</span>
        }
        <span class="badge-code"><mat-icon>qr_code</mat-icon> {{ centre()!.code }}</span>
      </div>

      <mat-tab-group animationDuration="200ms">

        <!-- ── Onglet 1 : Informations ── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">info</mat-icon> Informations
          </ng-template>

          <mat-card class="info-card">
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Localité</span>
                  <span class="value">{{ centre()!.localite_nom }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Date de création</span>
                  <span class="value">{{ centre()!.date_creation | date:'dd/MM/yyyy' }}</span>
                </div>
                @if (centre()!.date_fermeture) {
                  <div class="info-item">
                    <span class="label">Date de fermeture</span>
                    <span class="value warn">{{ centre()!.date_fermeture | date:'dd/MM/yyyy' }}</span>
                  </div>
                }
                @if (centre()!.adresse) {
                  <div class="info-item full">
                    <span class="label">Adresse</span>
                    <span class="value">{{ centre()!.adresse }}</span>
                  </div>
                }
                @if (centre()!.telephone) {
                  <div class="info-item">
                    <span class="label">Téléphone</span>
                    <span class="value">
                      <mat-icon class="inline-icon">phone</mat-icon> {{ centre()!.telephone }}
                    </span>
                  </div>
                }
                @if (centre()!.email) {
                  <div class="info-item">
                    <span class="label">Email</span>
                    <span class="value">
                      <mat-icon class="inline-icon">email</mat-icon> {{ centre()!.email }}
                    </span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- ── Onglet 2 : Agents ── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">group</mat-icon>
            Agents <span class="tab-count">({{ agents().length }})</span>
          </ng-template>

          @if (loadingAgents()) {
            <div class="center"><mat-spinner diameter="30"></mat-spinner></div>
          } @else {
            <mat-table [dataSource]="agents()" class="mat-elevation-z1 tab-table">

              <ng-container matColumnDef="matricule">
                <mat-header-cell *matHeaderCellDef>Matricule</mat-header-cell>
                <mat-cell *matCellDef="let a"><code>{{ a.matricule }}</code></mat-cell>
              </ng-container>

              <ng-container matColumnDef="nom">
                <mat-header-cell *matHeaderCellDef>Nom & Prénoms</mat-header-cell>
                <mat-cell *matCellDef="let a"><strong>{{ a.nom_complet }}</strong></mat-cell>
              </ng-container>

              <ng-container matColumnDef="role">
                <mat-header-cell *matHeaderCellDef>Rôle</mat-header-cell>
                <mat-cell *matCellDef="let a">
                  <span [class]="'badge-role badge-' + a.role.toLowerCase()">
                    {{ a.role_display }}
                  </span>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="email">
                <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
                <mat-cell *matCellDef="let a">{{ a.email }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="telephone">
                <mat-header-cell *matHeaderCellDef>Téléphone</mat-header-cell>
                <mat-cell *matCellDef="let a">{{ a.telephone || '—' }}</mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="colonnesAgents"></mat-header-row>
              <mat-row *matRowDef="let row; columns: colonnesAgents;"></mat-row>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" colspan="5">Aucun agent actif dans ce centre.</td>
              </tr>
            </mat-table>
          }
        </mat-tab>

        <!-- ── Onglet 3 : Villages rattachés ── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">villa</mat-icon>
            Villages <span class="tab-count">({{ villages().length }})</span>
          </ng-template>

          <!-- Formulaire de rattachement (admin uniquement) -->
          @if (isAdmin()) {
            <mat-card class="rattach-form-card">
              <mat-card-title>
                <mat-icon>add_location_alt</mat-icon> Rattacher un village
              </mat-card-title>
              <mat-card-content>
                <form [formGroup]="rattachForm" (ngSubmit)="rattacherVillage()" class="rattach-form">
                  <mat-form-field>
                    <mat-label>Village</mat-label>
                    <mat-select formControlName="village" required>
                      @for (v of villagesDisponibles(); track v.id) {
                        <mat-option [value]="v.id">{{ v.nom }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Date de rattachement</mat-label>
                    <input matInput type="date" formControlName="date_debut" required>
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Référence décret</mat-label>
                    <input matInput formControlName="decret_ref" placeholder="Ex : Décret N°2026-001">
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Motif</mat-label>
                    <input matInput formControlName="motif">
                  </mat-form-field>
                  <button mat-raised-button color="primary" type="submit"
                          [disabled]="rattachForm.invalid || savingRattach()">
                    <mat-icon>link</mat-icon>
                    {{ savingRattach() ? 'Enregistrement…' : 'Rattacher' }}
                  </button>
                </form>
              </mat-card-content>
            </mat-card>
          }

          @if (loadingVillages()) {
            <div class="center"><mat-spinner diameter="30"></mat-spinner></div>
          } @else {
            <mat-table [dataSource]="villages()" class="mat-elevation-z1 tab-table">

              <ng-container matColumnDef="village_nom">
                <mat-header-cell *matHeaderCellDef>Village</mat-header-cell>
                <mat-cell *matCellDef="let v"><strong>{{ v.village_nom }}</strong></mat-cell>
              </ng-container>

              <ng-container matColumnDef="date_debut">
                <mat-header-cell *matHeaderCellDef>Date de rattachement</mat-header-cell>
                <mat-cell *matCellDef="let v">{{ v.date_debut | date:'dd/MM/yyyy' }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="date_fin">
                <mat-header-cell *matHeaderCellDef>Date de fin</mat-header-cell>
                <mat-cell *matCellDef="let v">{{ v.date_fin ? (v.date_fin | date:'dd/MM/yyyy') : '—' }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="decret_ref">
                <mat-header-cell *matHeaderCellDef>Décret</mat-header-cell>
                <mat-cell *matCellDef="let v">{{ v.decret_ref || '—' }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="statut">
                <mat-header-cell *matHeaderCellDef style="justify-content:center">Statut</mat-header-cell>
                <mat-cell *matCellDef="let v" style="justify-content:center">
                  @if (v.est_courant) {
                    <span class="badge-actif">Courant</span>
                  } @else {
                    <span class="badge-ferme">Terminé</span>
                  }
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="colonnesVillages"></mat-header-row>
              <mat-row *matRowDef="let row; columns: colonnesVillages;"></mat-row>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" colspan="5">Aucun village rattaché actuellement.</td>
              </tr>
            </mat-table>
          }
        </mat-tab>

      </mat-tab-group>
    }
  `,
  styles: [`
    .center { display:flex; justify-content:center; padding:40px; }
    .no-data { padding:24px; text-align:center; color:#999; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:11px; }
    mat-cell, mat-header-cell { padding:0 8px !important; }

    .fiche-header { display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap; }

    .badge-type { display:flex; align-items:center; gap:4px; font-size:13px;
                  padding:4px 12px; border-radius:16px; }
    .badge-type mat-icon { font-size:16px; width:16px; height:16px; }
    .badge-sous_prefecture { background:#e3f2fd; color:#1565c0; }
    .badge-mairie          { background:#f3e5f5; color:#6a1b9a; }

    .badge-code { display:flex; align-items:center; gap:4px; font-size:13px;
                  background:#f5f5f5; padding:4px 12px; border-radius:16px; color:#555; }
    .badge-code mat-icon { font-size:15px; width:15px; height:15px; }

    .badge-actif { background:#e8f5e9; color:#2e7d32; border-radius:10px;
                   padding:3px 12px; font-size:13px; }
    .badge-ferme { background:#fce4ec; color:#c62828; border-radius:10px;
                   padding:3px 12px; font-size:13px; }

    .info-card { margin-top:16px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px 32px; }
    .info-item { display:flex; flex-direction:column; gap:4px; }
    .info-item.full { grid-column:1/-1; }
    .label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.05em; }
    .value { font-size:14px; color:#333; display:flex; align-items:center; gap:4px; }
    .value.warn { color:#e65100; }
    .inline-icon { font-size:16px; width:16px; height:16px; color:#888; }

    .tab-icon { margin-right:4px; font-size:18px; width:18px; height:18px; vertical-align:middle; }
    .tab-count { margin-left:4px; font-size:11px; background:#e0e0e0; border-radius:10px;
                 padding:1px 7px; }
    .tab-table { margin-top:8px; }

    .badge-role { font-size:11px; padding:2px 8px; border-radius:10px; }
    .badge-agent_guichet     { background:#fff3e0; color:#e65100; }
    .badge-superviseur_centre { background:#e3f2fd; color:#1565c0; }
    .badge-superviseur_national { background:#f3e5f5; color:#6a1b9a; }
    .badge-admin_systeme     { background:#fce4ec; color:#c62828; }

    .rattach-form-card { margin-bottom:16px; }
    .rattach-form { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-start; }
    .rattach-form mat-form-field { flex:1 1 200px; }
  `],
})
export class CentreDetailComponent implements OnInit {
  colonnesAgents   = ['matricule', 'nom', 'role', 'email', 'telephone'];
  colonnesVillages = ['village_nom', 'date_debut', 'date_fin', 'decret_ref', 'statut'];

  centre           = signal<Centre | null>(null);
  agents           = signal<AgentCentre[]>([]);
  villages         = signal<VillageCourant[]>([]);
  villagesDisponibles = signal<Village[]>([]);
  loading          = signal(false);
  loadingAgents    = signal(false);
  loadingVillages  = signal(false);
  savingRattach    = signal(false);

  rattachForm = this.fb.group({
    village:    ['', Validators.required],
    date_debut: ['', Validators.required],
    decret_ref: [''],
    motif:      [''],
  });

  private id!: string;

  constructor(
    private svc: CentresService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.chargerCentre();
    this.chargerAgents();
    this.chargerVillages();
    if (this.isAdmin()) {
      this.svc.villagesLibres().subscribe(r => this.villagesDisponibles.set(r.results));
    }
  }

  chargerCentre() {
    this.loading.set(true);
    this.svc.detail(this.id).subscribe({
      next: c => { this.centre.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  chargerAgents() {
    this.loadingAgents.set(true);
    this.svc.agents(this.id).subscribe({
      next: a => { this.agents.set(a); this.loadingAgents.set(false); },
      error: () => this.loadingAgents.set(false),
    });
  }

  chargerVillages() {
    this.loadingVillages.set(true);
    this.svc.villagescourants(this.id).subscribe({
      next: v => { this.villages.set(v); this.loadingVillages.set(false); },
      error: () => this.loadingVillages.set(false),
    });
  }

  rattacherVillage() {
    if (this.rattachForm.invalid) return;
    this.savingRattach.set(true);
    const val = this.rattachForm.value;
    this.svc.rattacherVillage({
      village:    val.village!,
      centre:     this.id,
      date_debut: val.date_debut!,
      motif:      val.motif || undefined,
      decret_ref: val.decret_ref || undefined,
    }).subscribe({
      next: () => {
        this.savingRattach.set(false);
        this.rattachForm.reset();
        this.chargerVillages();
        this.snackBar.open('Village rattaché avec succès', 'Fermer', { duration: 3000 });
      },
      error: (e) => {
        this.savingRattach.set(false);
        this.snackBar.open('Erreur : ' + JSON.stringify(e.error), 'Fermer', { duration: 5000 });
      },
    });
  }

  isAdmin(): boolean { return this.auth.agent()?.role === 'ADMIN_CENTRAL'; }

  iconeType(type: string): string {
    return type === 'MAIRIE' ? 'location_city' : 'account_balance';
  }
}
