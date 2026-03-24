import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { IndividusService } from '../../core/services/individus.service';
import { CentresService } from '../../core/services/centres.service';

@Component({
  selector: 'app-individu-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatDividerModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>person_add</mat-icon> Enregistrer un individu</h2>
      <button mat-stroked-button routerLink="/individus">
        <mat-icon>arrow_back</mat-icon> Retour
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Informations personnelles -->
          <h3 class="section-title">Informations personnelles</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Nom *</mat-label>
              <input matInput formControlName="nom" (blur)="verifierDoublon()">
              @if (form.get('nom')?.hasError('required') && form.get('nom')?.touched) {
                <mat-error>Le nom est requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Prénoms *</mat-label>
              <input matInput formControlName="prenoms" (blur)="verifierDoublon()">
              @if (form.get('prenoms')?.hasError('required') && form.get('prenoms')?.touched) {
                <mat-error>Les prénoms sont requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sexe *</mat-label>
              <mat-select formControlName="sexe">
                <mat-option value="M">Masculin</mat-option>
                <mat-option value="F">Féminin</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date de naissance *</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date_naissance"
                     (blur)="verifierDoublon()">
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Lieu de naissance</mat-label>
              <input matInput formControlName="lieu_naissance_libelle" (blur)="verifierDoublon()">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nationalité</mat-label>
              <input matInput formControlName="nationalite">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Centre d'enregistrement *</mat-label>
              <mat-select formControlName="centre_naissance">
                @for (c of centres(); track c.id) {
                  <mat-option [value]="c.id">{{ c.nom }} ({{ c.type_display }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Alerte doublon -->
          @if (doublon()) {
            <div class="alert-doublon">
              <mat-icon>warning</mat-icon>
              <span>⚠ Un individu similaire existe déjà — NIN : <strong>{{ doublon() }}</strong></span>
            </div>
          }

          <mat-divider class="my-24"></mat-divider>

          <!-- Filiation -->
          <div class="section-header">
            <h3 class="section-title">Filiation</h3>
            <button mat-stroked-button type="button" (click)="ajouterFiliation()">
              <mat-icon>add</mat-icon> Ajouter parent
            </button>
          </div>

          <div formArrayName="filiations">
            @for (f of filiationsArray.controls; track $index) {
              <div [formGroupName]="$index" class="filiation-row">
                <mat-form-field appearance="outline">
                  <mat-label>Rôle</mat-label>
                  <mat-select formControlName="role">
                    <mat-option value="PERE">Père</mat-option>
                    <mat-option value="MERE">Mère</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="nom_libelle">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Prénoms</mat-label>
                  <input matInput formControlName="prenoms_libelle">
                </mat-form-field>

                <button mat-icon-button color="warn" type="button"
                        (click)="supprimerFiliation($index)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }
          </div>

          <!-- Boutons -->
          <div class="form-actions">
            <button mat-stroked-button type="button" routerLink="/individus">Annuler</button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || loading() || !!doublon()">
              @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
              @else { <mat-icon>save</mat-icon> Enregistrer }
            </button>
          </div>

        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .page-header h2 { display:flex; align-items:center; gap:8px; margin:0; }
    .section-title { color:#1a4f7a; font-size:16px; margin:0 0 16px; }
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
    .filiation-row { display:grid; grid-template-columns:150px 1fr 1fr 48px; gap:12px; align-items:center; margin-bottom:8px; }
    .form-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:24px; }
    .my-24 { margin:24px 0; }
    .alert-doublon { display:flex; align-items:center; gap:8px; background:#fff3e0;
                     color:#e65100; padding:12px 16px; border-radius:8px; margin-top:8px; }
  `],
})
export class IndividuFormComponent implements OnInit {
  form!: FormGroup;
  loading  = signal(false);
  doublon  = signal('');
  centres  = signal<any[]>([]);

  constructor(
    private fb: FormBuilder,
    private svc: IndividusService,
    private centresSvc: CentresService,
    private snack: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nom:                    ['', Validators.required],
      prenoms:                ['', Validators.required],
      sexe:                   ['', Validators.required],
      date_naissance:         ['', Validators.required],
      lieu_naissance_libelle: [''],
      nationalite:            ['Ivoirienne'],
      centre_naissance:       ['', Validators.required],
      filiations:             this.fb.array([]),
    });
    this.centresSvc.liste().subscribe(r => this.centres.set(r.results));
  }

  get filiationsArray(): FormArray {
    return this.form.get('filiations') as FormArray;
  }

  ajouterFiliation() {
    this.filiationsArray.push(this.fb.group({
      role:            ['PERE', Validators.required],
      nom_libelle:     [''],
      prenoms_libelle: [''],
    }));
  }

  supprimerFiliation(i: number) { this.filiationsArray.removeAt(i); }

  verifierDoublon() {
    const { nom, prenoms, date_naissance, lieu_naissance_libelle } = this.form.value;
    if (!nom || !prenoms || !date_naissance) return;
    this.svc.verifierDoublon({ nom, prenoms, date_naissance, lieu_naissance_libelle })
      .subscribe(r => this.doublon.set(r.doublon ? r.nin! : ''));
  }

  onSubmit() {
    if (this.form.invalid || this.doublon()) return;
    this.loading.set(true);
    const data = { ...this.form.value };
    if (data.date_naissance instanceof Date) {
      const d = data.date_naissance;
      data.date_naissance = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    this.svc.creer(data).subscribe({
      next: (ind) => {
        this.loading.set(false);
        this.snack.open(`Individu enregistré — NIN : ${ind.nin}`, 'OK', { duration: 4000 });
        this.router.navigate(['/individus', ind.id]);
      },
      error: (e) => {
        this.loading.set(false);
        const msg = e.error?.detail || JSON.stringify(e.error) || 'Erreur lors de l\'enregistrement';
        this.snack.open(msg, 'Fermer', { duration: 5000, panelClass: 'snack-error' });
      },
    });
  }
}
