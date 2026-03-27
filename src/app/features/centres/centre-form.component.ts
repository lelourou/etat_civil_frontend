import { Component, OnInit, signal } from '@angular/core';
import { formatApiError } from '../../core/utils/api-error.utils';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { CentresService, Centre, Localite, Village, VillageCourant } from '../../core/services/centres.service';

@Component({
  selector: 'app-centre-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule, MatCardModule, MatSnackBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/centres" matTooltip="Annuler">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h2>{{ estModification ? 'Modifier le centre' : 'Nouveau centre' }}</h2>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="soumettre()">

            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Code *</mat-label>
                <input matInput formControlName="code" placeholder="ex: CTR-ABJ-001" maxlength="20">
                <mat-hint>Identifiant unique du centre</mat-hint>
                @if (form.get('code')?.invalid && form.get('code')?.touched) {
                  <mat-error>Le code est obligatoire</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Nom du centre *</mat-label>
                <input matInput formControlName="nom" placeholder="ex: Centre Cocody">
                @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
                  <mat-error>Le nom est obligatoire</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Type *</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="SOUS_PREFECTURE">Sous-Préfecture</mat-option>
                  <mat-option value="MAIRIE">Mairie</mat-option>
                </mat-select>
                @if (form.get('type')?.invalid && form.get('type')?.touched) {
                  <mat-error>Choisissez un type</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Localité *</mat-label>
                <mat-select formControlName="localite">
                  @for (loc of localites(); track loc.id) {
                    <mat-option [value]="loc.id">{{ loc.nom }} ({{ loc.code }})</mat-option>
                  }
                </mat-select>
                @if (form.get('localite')?.invalid && form.get('localite')?.touched) {
                  <mat-error>Choisissez une localité</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date de création *</mat-label>
                <input matInput [matDatepicker]="dpCreation" formControlName="date_creation">
                <mat-datepicker-toggle matIconSuffix [for]="dpCreation"></mat-datepicker-toggle>
                <mat-datepicker #dpCreation></mat-datepicker>
                @if (form.get('date_creation')?.invalid && form.get('date_creation')?.touched) {
                  <mat-error>La date est obligatoire</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date de fermeture</mat-label>
                <input matInput [matDatepicker]="dpFermeture" formControlName="date_fermeture">
                <mat-datepicker-toggle matIconSuffix [for]="dpFermeture"></mat-datepicker-toggle>
                <mat-datepicker #dpFermeture></mat-datepicker>
                <mat-hint>Laisser vide si le centre est actif</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Adresse</mat-label>
                <textarea matInput formControlName="adresse" rows="2"
                          placeholder="Adresse postale du centre"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Téléphone</mat-label>
                <mat-icon matPrefix>phone</mat-icon>
                <input matInput formControlName="telephone" placeholder="+225 XX XX XX XX XX">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input matInput formControlName="email" type="email"
                       placeholder="contact@etatcivil.ci">
                @if (form.get('email')?.errors?.['email']) {
                  <mat-error>Email invalide</mat-error>
                }
              </mat-form-field>

              @if (estModification) {
                <div class="checkbox-row">
                  <mat-checkbox formControlName="actif">Centre actif</mat-checkbox>
                </div>
              }
            </div>

            <!-- ── Villages (création) ── -->
            @if (!estModification) {
              <div class="section-titre">
                <mat-icon>add_location_alt</mat-icon>
                Villages rattachés (optionnel)
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Sélectionner un ou plusieurs villages</mat-label>
                <mat-select [(ngModel)]="villagesSelectionnes" [ngModelOptions]="{standalone:true}" multiple>
                  @for (v of villagesDisponibles(); track v.id) {
                    <mat-option [value]="v.id">{{ v.nom }}</mat-option>
                  }
                </mat-select>
                <mat-hint>Ces villages seront rattachés dès la création du centre</mat-hint>
              </mat-form-field>
            }

            <div class="form-actions">
              <button mat-stroked-button type="button" routerLink="/centres">Annuler</button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="form.invalid || saving()">
                @if (saving()) {
                  <mat-spinner diameter="20" style="display:inline-block;margin-right:8px"></mat-spinner>
                }
                <mat-icon>save</mat-icon>
                {{ estModification ? 'Enregistrer' : 'Créer le centre' }}
              </button>
            </div>

          </form>
        </mat-card-content>
      </mat-card>

      <!-- ── Gestion des villages (modification uniquement) ── -->
      @if (estModification) {
        <mat-card class="form-card village-card">
          <mat-card-content>

            <div class="section-titre">
              <mat-icon>add_location_alt</mat-icon>
              Rattacher un nouveau village
            </div>

            <div class="rattach-form">
              <mat-form-field appearance="outline" style="flex:2;min-width:200px">
                <mat-label>Village</mat-label>
                <mat-select [(ngModel)]="nvVillage">
                  @for (v of villagesDisponibles(); track v.id) {
                    <mat-option [value]="v.id">{{ v.nom }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex:1;min-width:160px">
                <mat-label>Date de rattachement</mat-label>
                <input matInput type="date" [(ngModel)]="nvDateDebut">
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex:1;min-width:180px">
                <mat-label>Référence décret</mat-label>
                <input matInput [(ngModel)]="nvDecretRef" placeholder="Ex : Décret N°2026-001">
              </mat-form-field>
              <button mat-raised-button color="primary"
                      [disabled]="!nvVillage || !nvDateDebut || savingVillage()"
                      (click)="rattacherNouveauVillage()">
                <mat-icon>link</mat-icon>
                {{ savingVillage() ? 'En cours…' : 'Rattacher' }}
              </button>
            </div>

            <mat-divider style="margin:16px 0"></mat-divider>

            <div class="section-titre" style="margin-top:0">
              <mat-icon>villa</mat-icon>
              Villages actuellement rattachés ({{ villagesCourants().length }})
            </div>

            @if (loadingVillages()) {
              <div class="center"><mat-spinner diameter="30"></mat-spinner></div>
            } @else if (villagesCourants().length === 0) {
              <p style="color:#999;font-style:italic;text-align:center;padding:16px">
                Aucun village rattaché à ce centre.
              </p>
            } @else {
              <div class="villages-liste">
                @for (v of villagesCourants(); track v.id) {
                  <div class="village-item" [class.village-termine]="!v.est_courant">
                    <mat-icon class="village-icon">{{ v.est_courant ? 'location_on' : 'location_off' }}</mat-icon>
                    <div class="village-info">
                      <strong>{{ v.village_nom }}</strong>
                      <span class="village-dates">
                        Depuis le {{ v.date_debut | date:'dd/MM/yyyy' }}
                        @if (v.date_fin) { · Jusqu'au {{ v.date_fin | date:'dd/MM/yyyy' }} }
                        @if (v.decret_ref) { · {{ v.decret_ref }} }
                      </span>
                    </div>
                    <span [class]="v.est_courant ? 'badge-actif' : 'badge-ferme'">
                      {{ v.est_courant ? 'Courant' : 'Terminé' }}
                    </span>
                    @if (v.est_courant) {
                      <button mat-stroked-button color="warn"
                              [disabled]="retirantId() === v.id"
                              (click)="retirerVillage(v)">
                        <mat-icon>link_off</mat-icon>
                        {{ retirantId() === v.id ? 'En cours…' : 'Retirer' }}
                      </button>
                    }
                  </div>
                }
              </div>
            }

          </mat-card-content>
        </mat-card>
      }
    }
  `,
  styles: [`
    .center { display:flex; justify-content:center; padding:40px; }
    .form-card { max-width:800px; margin:0 auto; }
    .village-card { margin-top:20px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }
    .span-2 { grid-column:1/-1; }
    .checkbox-row { grid-column:1/-1; padding:8px 0; }
    .section-titre { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:600;
                     color:#009A44; margin:20px 0 8px; padding-bottom:6px; border-bottom:2px solid #e8f5e9; }
    .section-titre mat-icon { font-size:20px; width:20px; height:20px; }
    .full-width { width:100%; }
    .form-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:16px; padding-top:16px;
                    border-top:1px solid #e0e0e0; }

    .rattach-form { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }

    .villages-liste { display:flex; flex-direction:column; gap:8px; }
    .village-item { display:flex; align-items:center; gap:12px; padding:10px 12px;
                    border:1px solid #e0e0e0; border-radius:8px; background:#fafafa; }
    .village-item.village-termine { opacity:.65; }
    .village-icon { color:#009A44; }
    .village-termine .village-icon { color:#999; }
    .village-info { flex:1; display:flex; flex-direction:column; gap:2px; }
    .village-dates { font-size:12px; color:#777; }
    .badge-actif { background:#e8f5e9; color:#2e7d32; border-radius:10px; padding:2px 10px; font-size:12px; white-space:nowrap; }
    .badge-ferme { background:#fce4ec; color:#c62828; border-radius:10px; padding:2px 10px; font-size:12px; white-space:nowrap; }
  `],
})
export class CentreFormComponent implements OnInit {
  form!: FormGroup;
  localites           = signal<Localite[]>([]);
  villagesDisponibles = signal<Village[]>([]);
  villagesCourants    = signal<VillageCourant[]>([]);
  villagesSelectionnes: string[] = [];
  loading         = signal(false);
  saving          = signal(false);
  loadingVillages = signal(false);
  savingVillage   = signal(false);
  retirantId      = signal<string | null>(null);
  estModification = false;
  private id?: string;

  // Champs du formulaire d'ajout de village (mode modification)
  nvVillage   = '';
  nvDateDebut = '';
  nvDecretRef = '';

  constructor(
    private fb: FormBuilder,
    private svc: CentresService,
    private router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.estModification = !!this.id;

    this.form = this.fb.group({
      code:           ['', Validators.required],
      nom:            ['', Validators.required],
      type:           ['', Validators.required],
      localite:       ['', Validators.required],
      date_creation:  ['', Validators.required],
      date_fermeture: [null],
      adresse:        [''],
      telephone:      [''],
      email:          ['', Validators.email],
      actif:          [true],
    });

    this.chargerLocalites();
    this.svc.villagesLibres().subscribe(r => this.villagesDisponibles.set(r.results));
    if (this.estModification) {
      this.chargerCentre();
      this.chargerVillagesCourants();
    }
  }

  chargerLocalites() {
    this.svc.localites().subscribe({ next: r => this.localites.set(r.results) });
  }

  chargerVillagesCourants() {
    this.loadingVillages.set(true);
    this.svc.villagescourants(this.id!).subscribe({
      next: v => { this.villagesCourants.set(v); this.loadingVillages.set(false); },
      error: () => this.loadingVillages.set(false),
    });
  }

  chargerCentre() {
    this.loading.set(true);
    this.svc.detail(this.id!).subscribe({
      next: c => {
        this.form.patchValue({
          ...c,
          date_creation:  c.date_creation  ? new Date(c.date_creation)  : null,
          date_fermeture: c.date_fermeture  ? new Date(c.date_fermeture) : null,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  rattacherNouveauVillage() {
    if (!this.nvVillage || !this.nvDateDebut) return;
    this.savingVillage.set(true);
    this.svc.rattacherVillage({
      village:    this.nvVillage,
      centre:     this.id!,
      date_debut: this.nvDateDebut,
      decret_ref: this.nvDecretRef || undefined,
    }).subscribe({
      next: () => {
        this.savingVillage.set(false);
        this.nvVillage = '';
        this.nvDateDebut = '';
        this.nvDecretRef = '';
        this.chargerVillagesCourants();
        this.svc.villagesLibres().subscribe(r => this.villagesDisponibles.set(r.results));
        this.snack.open('Village rattaché avec succès.', 'OK', { duration: 3000 });
      },
      error: e => {
        this.savingVillage.set(false);
        this.snack.open(formatApiError(e.error), 'Fermer', { duration: 5000 });
      },
    });
  }

  retirerVillage(v: VillageCourant) {
    const dateFin = new Date().toISOString().split('T')[0];
    this.retirantId.set(v.id);
    this.svc.retirerVillage(v.id, dateFin).subscribe({
      next: () => {
        this.retirantId.set(null);
        this.chargerVillagesCourants();
        this.svc.villagesLibres().subscribe(r => this.villagesDisponibles.set(r.results));
        this.snack.open('Village retiré. Il peut maintenant être rattaché à un autre centre.', 'OK', { duration: 4000 });
      },
      error: e => {
        this.retirantId.set(null);
        this.snack.open(formatApiError(e.error), 'Fermer', { duration: 5000 });
      },
    });
  }

  soumettre() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const val = this.form.getRawValue();
    const dateCreation = this.formatDate(val.date_creation);
    const payload: Partial<Centre> = {
      ...val,
      date_creation:  dateCreation,
      date_fermeture: val.date_fermeture ? this.formatDate(val.date_fermeture) : null,
    };

    const req$ = this.estModification
      ? this.svc.modifier(this.id!, payload)
      : this.svc.creer(payload);

    req$.subscribe({
      next: c => {
        if (!this.estModification && this.villagesSelectionnes.length > 0) {
          const rattach$ = this.villagesSelectionnes.map(vid =>
            this.svc.rattacherVillage({ village: vid, centre: c.id, date_debut: dateCreation })
          );
          let done = 0;
          rattach$.forEach(obs => obs.subscribe({
            complete: () => {
              done++;
              if (done === rattach$.length) {
                this.saving.set(false);
                this.snack.open('Centre créé avec ' + done + ' village(s) rattaché(s).', 'OK', { duration: 3000 });
                this.router.navigate(['/centres', c.id]);
              }
            },
          }));
        } else {
          this.saving.set(false);
          this.snack.open(
            this.estModification ? 'Centre mis à jour.' : 'Centre créé avec succès.',
            'OK', { duration: 3000 }
          );
          this.router.navigate(['/centres', c.id]);
        }
      },
      error: err => {
        this.saving.set(false);
        const msg = err?.error?.detail ?? 'Une erreur est survenue.';
        this.snack.open(msg, 'Fermer', { duration: 5000 });
      },
    });
  }

  private formatDate(d: Date | string): string {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toISOString().split('T')[0];
  }
}
