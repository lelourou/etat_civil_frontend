import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { ActesService } from '../../core/services/actes.service';
import { IndividusService } from '../../core/services/individus.service';
import { CentresService } from '../../core/services/centres.service';
import { Individu } from '../../core/models/individu.models';

@Component({
  selector: 'app-acte-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatDividerModule, MatSnackBarModule, MatStepperModule,
    FormsModule,
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>add_circle</mat-icon> Nouvel acte d'état civil</h2>
      <button mat-stroked-button routerLink="/actes">
        <mat-icon>arrow_back</mat-icon> Retour
      </button>
    </div>

    <mat-stepper [linear]="true" #stepper>

      <!-- ÉTAPE 1 : Informations générales -->
      <mat-step [stepControl]="step1">
        <ng-template matStepLabel>Informations générales</ng-template>
        <form [formGroup]="step1">
          <div class="form-grid mt-16">

            <mat-form-field appearance="outline">
              <mat-label>Nature de l'acte *</mat-label>
              <mat-select formControlName="nature" (selectionChange)="onNatureChange()">
                <mat-option value="NAISSANCE">
                  <mat-icon>child_care</mat-icon> Naissance
                </mat-option>
                <mat-option value="MARIAGE">
                  <mat-icon>favorite</mat-icon> Mariage
                </mat-option>
                <mat-option value="DECES">
                  <mat-icon>sentiment_very_dissatisfied</mat-icon> Décès
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date de l'événement *</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date_evenement">
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Centre d'enregistrement *</mat-label>
              <mat-select formControlName="centre">
                @for (c of centres(); track c.id) {
                  <mat-option [value]="c.id">{{ c.nom }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Rechercher individu (NIN ou nom) *</mat-label>
              <input matInput [value]="individu()?.nin || ''" readonly
                     placeholder="Cliquez sur Rechercher">
              <button mat-icon-button matSuffix (click)="ouvrirRechercheIndividu()" type="button">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>

          </div>

          @if (individu()) {
            <div class="individu-card">
              <mat-icon>person</mat-icon>
              <div>
                <strong>{{ individu()!.nom }} {{ individu()!.prenoms }}</strong>
                <small>NIN : {{ individu()!.nin }} — né(e) le {{ individu()!.date_naissance | date:'dd/MM/yyyy' }}</small>
              </div>
              <button mat-icon-button color="warn" (click)="individu.set(null); step1.patchValue({individu: ''})" type="button">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          @if (rechercheOuverte()) {
            <div class="recherche-panel">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nom ou NIN</mat-label>
                <input matInput [(ngModel)]="termeRecherche" [ngModelOptions]="{standalone:true}"
                       (input)="rechercherIndividu()">
              </mat-form-field>
              <div class="resultats">
                @for (r of resultatsRecherche(); track r.id) {
                  <div class="resultat-item" (click)="selectionnerIndividu(r)">
                    <strong>{{ r.nom }} {{ r.prenoms }}</strong>
                    <span>NIN: {{ r.nin }} | {{ r.date_naissance | date:'dd/MM/yyyy' }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <mat-form-field appearance="outline" class="full-width mt-16">
            <mat-label>Observations</mat-label>
            <textarea matInput formControlName="observations" rows="3"></textarea>
          </mat-form-field>

          <div class="step-actions">
            <button mat-raised-button color="primary" matStepperNext
                    [disabled]="step1.invalid || !individu()">
              Suivant <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </form>
      </mat-step>

      <!-- ÉTAPE 2 : Détails spécifiques -->
      <mat-step [stepControl]="step2">
        <ng-template matStepLabel>
          Détails {{ step1.get('nature')?.value | titlecase }}
        </ng-template>
        <form [formGroup]="step2">
          <div class="mt-16">

            <!-- Naissance -->
            @if (step1.get('nature')?.value === 'NAISSANCE') {
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Heure de naissance</mat-label>
                  <input matInput type="time" formControlName="heure_naissance">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Établissement</mat-label>
                  <input matInput formControlName="etablissement">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Ordre (gémellité)</mat-label>
                  <input matInput type="number" formControlName="ordre_naissance" min="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Poids (kg)</mat-label>
                  <input matInput type="number" step="0.001" formControlName="poids_naissance">
                </mat-form-field>
              </div>
              <mat-divider class="my-16"></mat-divider>
              <h4>Déclarant</h4>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Nom déclarant *</mat-label>
                  <input matInput formControlName="declarant_nom">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Prénoms déclarant *</mat-label>
                  <input matInput formControlName="declarant_prenoms">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Lien avec l'enfant</mat-label>
                  <input matInput formControlName="declarant_lien">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>CIN déclarant</mat-label>
                  <input matInput formControlName="declarant_cin">
                </mat-form-field>
              </div>
            }

            <!-- Mariage -->
            @if (step1.get('nature')?.value === 'MARIAGE') {
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Régime matrimonial</mat-label>
                  <mat-select formControlName="regime_matrimonial">
                    <mat-option value="MONOGAMIE">Monogamie</mat-option>
                    <mat-option value="POLYGAMIE">Polygamie</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Réf. acte naissance époux</mat-label>
                  <input matInput formControlName="acte_naissance_epoux_ref">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Réf. acte naissance épouse</mat-label>
                  <input matInput formControlName="acte_naissance_epouse_ref">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Officiant</mat-label>
                  <input matInput formControlName="officiant_nom">
                </mat-form-field>
              </div>
              <mat-divider class="my-16"></mat-divider>
              <h4>Témoins</h4>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Témoin 1 — Nom</mat-label>
                  <input matInput formControlName="temoin1_nom">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Témoin 1 — CIN</mat-label>
                  <input matInput formControlName="temoin1_cin">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Témoin 2 — Nom</mat-label>
                  <input matInput formControlName="temoin2_nom">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Témoin 2 — CIN</mat-label>
                  <input matInput formControlName="temoin2_cin">
                </mat-form-field>
              </div>
            }

            <!-- Décès -->
            @if (step1.get('nature')?.value === 'DECES') {
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Heure du décès</mat-label>
                  <input matInput type="time" formControlName="heure_deces">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Lieu du décès</mat-label>
                  <input matInput formControlName="lieu_deces">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Cause du décès</mat-label>
                  <input matInput formControlName="cause_deces">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Réf. acte de naissance</mat-label>
                  <input matInput formControlName="acte_naissance_ref">
                </mat-form-field>
              </div>
              <mat-divider class="my-16"></mat-divider>
              <h4>Déclarant</h4>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Nom déclarant *</mat-label>
                  <input matInput formControlName="declarant_nom">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Prénoms déclarant *</mat-label>
                  <input matInput formControlName="declarant_prenoms">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Lien</mat-label>
                  <input matInput formControlName="declarant_lien">
                </mat-form-field>
              </div>
            }
          </div>

          <div class="step-actions">
            <button mat-stroked-button matStepperPrevious>
              <mat-icon>chevron_left</mat-icon> Précédent
            </button>
            <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
              @else { <mat-icon>save</mat-icon> Enregistrer l'acte }
            </button>
          </div>
        </form>
      </mat-step>

    </mat-stepper>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .page-header h2 { display:flex; align-items:center; gap:8px; margin:0; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px; }
    .mt-16 { margin-top:16px; }
    .my-16 { margin:16px 0; }
    .full-width { width:100%; }
    .step-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:24px; }
    .individu-card { display:flex; align-items:center; gap:12px; background:#e8f5e9;
                     padding:12px 16px; border-radius:8px; margin:12px 0; }
    .individu-card div { flex:1; display:flex; flex-direction:column; }
    .individu-card small { color:#555; font-size:12px; }
    .recherche-panel { background:#fafafa; border:1px solid #e0e0e0;
                       border-radius:8px; padding:16px; margin:8px 0; }
    .resultats { max-height:200px; overflow-y:auto; }
    .resultat-item { padding:10px 12px; cursor:pointer; border-radius:6px;
                     display:flex; flex-direction:column; gap:2px; }
    .resultat-item:hover { background:#e3f2fd; }
    .resultat-item span { font-size:12px; color:#666; }
  `],
})
export class ActeFormComponent implements OnInit {
  step1!: FormGroup;
  step2!: FormGroup;
  loading           = signal(false);
  individu          = signal<Individu | null>(null);
  centres           = signal<any[]>([]);
  rechercheOuverte  = signal(false);
  resultatsRecherche = signal<Individu[]>([]);
  termeRecherche    = '';

  constructor(
    private fb: FormBuilder,
    private svc: ActesService,
    private individusSvc: IndividusService,
    private centresSvc: CentresService,
    private snack: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.step1 = this.fb.group({
      nature:         ['', Validators.required],
      date_evenement: ['', Validators.required],
      centre:         ['', Validators.required],
      individu:       ['', Validators.required],
      observations:   [''],
    });
    this.step2 = this.fb.group({
      // Communs
      declarant_nom:     [''], declarant_prenoms: [''],
      declarant_lien:    [''], declarant_cin:     [''],
      // Naissance
      heure_naissance:   [''], etablissement:   [''],
      ordre_naissance:   [1],  poids_naissance: [null],
      // Mariage
      regime_matrimonial: [''], officiant_nom:  [''],
      temoin1_nom:       [''],  temoin1_cin:    [''],
      temoin2_nom:       [''],  temoin2_cin:    [''],
      acte_naissance_epoux_ref:  [''],
      acte_naissance_epouse_ref: [''],
      // Décès
      heure_deces:   [''], lieu_deces:   [''],
      cause_deces:   [''], acte_naissance_ref: [''],
    });

    this.centresSvc.liste().subscribe(r => this.centres.set(r.results));

    // Pré-sélectionner l'individu si passé en query param
    const individu_id = this.route.snapshot.queryParams['individu'];
    if (individu_id) {
      this.individusSvc.detail(individu_id).subscribe(i => {
        this.individu.set(i);
        this.step1.patchValue({ individu: i.id });
      });
    }
  }

  onNatureChange() { /* les sous-formulaires sont conditionnels dans le template */ }

  ouvrirRechercheIndividu() { this.rechercheOuverte.set(!this.rechercheOuverte()); }

  rechercherIndividu() {
    if (this.termeRecherche.length < 2) { this.resultatsRecherche.set([]); return; }
    this.individusSvc.liste({ search: this.termeRecherche, page_size: '10' })
      .subscribe(r => this.resultatsRecherche.set(r.results));
  }

  selectionnerIndividu(i: Individu) {
    this.individu.set(i);
    this.step1.patchValue({ individu: i.id });
    this.rechercheOuverte.set(false);
    this.resultatsRecherche.set([]);
  }

  onSubmit() {
    this.loading.set(true);
    const nature = this.step1.get('nature')!.value;
    const v1     = { ...this.step1.value };
    const v2     = this.step2.value;

    if (v1.date_evenement instanceof Date) {
      const d = v1.date_evenement;
      v1.date_evenement = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    const payload: any = { ...v1 };
    if (nature === 'NAISSANCE') payload['detail_naissance'] = v2;
    if (nature === 'MARIAGE')   payload['detail_mariage']   = v2;
    if (nature === 'DECES')     payload['detail_deces']     = v2;

    this.svc.creer(payload).subscribe({
      next: (acte) => {
        this.loading.set(false);
        this.snack.open(`Acte créé — ${acte.numero_national}`, 'OK', { duration: 4000 });
        this.router.navigate(['/actes', acte.id]);
      },
      error: (e) => {
        this.loading.set(false);
        const msg = e.error?.detail || JSON.stringify(e.error) || 'Erreur';
        this.snack.open(msg, 'Fermer', { duration: 5000 });
      },
    });
  }
}
