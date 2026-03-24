import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { CentresService, Centre, Localite } from '../../core/services/centres.service';

@Component({
  selector: 'app-centre-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule, MatCardModule, MatSnackBarModule,
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
              <!-- Code -->
              <mat-form-field appearance="outline">
                <mat-label>Code *</mat-label>
                <input matInput formControlName="code" placeholder="ex: CTR-ABJ-001" maxlength="20">
                <mat-hint>Identifiant unique du centre</mat-hint>
                @if (form.get('code')?.invalid && form.get('code')?.touched) {
                  <mat-error>Le code est obligatoire</mat-error>
                }
              </mat-form-field>

              <!-- Nom -->
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Nom du centre *</mat-label>
                <input matInput formControlName="nom" placeholder="ex: Centre Cocody">
                @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
                  <mat-error>Le nom est obligatoire</mat-error>
                }
              </mat-form-field>

              <!-- Type -->
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

              <!-- Localité -->
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

              <!-- Date de création -->
              <mat-form-field appearance="outline">
                <mat-label>Date de création *</mat-label>
                <input matInput [matDatepicker]="dpCreation" formControlName="date_creation">
                <mat-datepicker-toggle matIconSuffix [for]="dpCreation"></mat-datepicker-toggle>
                <mat-datepicker #dpCreation></mat-datepicker>
                @if (form.get('date_creation')?.invalid && form.get('date_creation')?.touched) {
                  <mat-error>La date est obligatoire</mat-error>
                }
              </mat-form-field>

              <!-- Date de fermeture -->
              <mat-form-field appearance="outline">
                <mat-label>Date de fermeture</mat-label>
                <input matInput [matDatepicker]="dpFermeture" formControlName="date_fermeture">
                <mat-datepicker-toggle matIconSuffix [for]="dpFermeture"></mat-datepicker-toggle>
                <mat-datepicker #dpFermeture></mat-datepicker>
                <mat-hint>Laisser vide si le centre est actif</mat-hint>
              </mat-form-field>

              <!-- Adresse -->
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Adresse</mat-label>
                <textarea matInput formControlName="adresse" rows="2"
                          placeholder="Adresse postale du centre"></textarea>
              </mat-form-field>

              <!-- Téléphone -->
              <mat-form-field appearance="outline">
                <mat-label>Téléphone</mat-label>
                <mat-icon matPrefix>phone</mat-icon>
                <input matInput formControlName="telephone" placeholder="+225 XX XX XX XX XX">
              </mat-form-field>

              <!-- Email -->
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input matInput formControlName="email" type="email"
                       placeholder="contact@etatcivil.ci">
                @if (form.get('email')?.errors?.['email']) {
                  <mat-error>Email invalide</mat-error>
                }
              </mat-form-field>

              <!-- Actif -->
              @if (estModification) {
                <div class="checkbox-row">
                  <mat-checkbox formControlName="actif">Centre actif</mat-checkbox>
                </div>
              }
            </div>

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
    }
  `,
  styles: [`
    .center { display:flex; justify-content:center; padding:40px; }
    .form-card { max-width:800px; margin:0 auto; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }
    .span-2 { grid-column:1/-1; }
    .checkbox-row { grid-column:1/-1; padding:8px 0; }
    .form-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:16px; padding-top:16px;
                    border-top:1px solid #e0e0e0; }
  `],
})
export class CentreFormComponent implements OnInit {
  form!: FormGroup;
  localites     = signal<Localite[]>([]);
  loading       = signal(false);
  saving        = signal(false);
  estModification = false;
  private id?: string;

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
    if (this.estModification) this.chargerCentre();
  }

  chargerLocalites() {
    this.svc.localites().subscribe({
      next: r => this.localites.set(r.results),
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

  soumettre() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const val = this.form.getRawValue();
    const payload: Partial<Centre> = {
      ...val,
      date_creation:  this.formatDate(val.date_creation),
      date_fermeture: val.date_fermeture ? this.formatDate(val.date_fermeture) : null,
    };

    const req$ = this.estModification
      ? this.svc.modifier(this.id!, payload)
      : this.svc.creer(payload);

    req$.subscribe({
      next: c => {
        this.saving.set(false);
        this.snack.open(
          this.estModification ? 'Centre mis à jour.' : 'Centre créé avec succès.',
          'OK', { duration: 3000 }
        );
        this.router.navigate(['/centres', c.id]);
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
