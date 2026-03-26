import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-utilisateur-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
            MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatSlideToggleModule],
  template: `
    <div class="page-header">
      <h2>{{ isEdit() ? 'Modifier l\'agent' : 'Créer un agent' }}</h2>
    </div>

    <mat-card class="form-card">
      <form [formGroup]="form" (ngSubmit)="sauvegarder()">
        <div class="form-grid">
          <mat-form-field>
            <mat-label>Nom</mat-label>
            <input matInput formControlName="nom" required>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Prénoms</mat-label>
            <input matInput formControlName="prenoms" required>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Matricule</mat-label>
            <input matInput formControlName="matricule" required>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="telephone">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Rôle</mat-label>
            <mat-select formControlName="role" required>
              <mat-option value="ADMIN_CENTRAL">Administrateur central</mat-option>
              <mat-option value="AGENT_CENTRE">Agent de centre</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Centre</mat-label>
            <mat-select formControlName="centre">
              <mat-option [value]="null">— Aucun (admin central) —</mat-option>
              @for (c of centres(); track c.id) {
                <mat-option [value]="c.id">{{ c.nom }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (!isEdit()) {
            <mat-form-field>
              <mat-label>Mot de passe</mat-label>
              <input matInput type="password" formControlName="password" required>
              <mat-hint>Minimum 12 caractères</mat-hint>
            </mat-form-field>
          }
        </div>

        @if (isEdit()) {
          <mat-slide-toggle formControlName="is_active" class="toggle-actif">
            Compte actif
          </mat-slide-toggle>
        }

        @if (erreur()) {
          <p class="erreur">{{ erreur() }}</p>
        }

        <div class="form-actions">
          <button mat-button type="button" (click)="router.navigate(['/utilisateurs'])">Annuler</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-header h2 { margin: 0; }
    .form-card { max-width: 800px; padding: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .toggle-actif { margin: 8px 0 16px; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
    .erreur { color: #d32f2f; font-size: 13px; }
  `],
})
export class UtilisateurFormComponent implements OnInit {
  isEdit = signal(false);
  saving = signal(false);
  erreur = signal('');
  centres = signal<Array<{ id: string; nom: string }>>([]);

  form = this.fb.group({
    nom:       ['', Validators.required],
    prenoms:   ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    matricule: ['', Validators.required],
    telephone: [''],
    role:      ['AGENT_CENTRE', Validators.required],
    centre:    [null as string | null],
    password:  [''],
    is_active: [true],
  });

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.http.get<{ results: Array<{ id: string; nom: string }> }>(
      `${environment.apiUrl}/centres/centres/?actif=true&page_size=500`
    ).subscribe(r => this.centres.set(r.results));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.form.get('password')?.clearValidators();
      this.http.get<any>(`${environment.apiUrl}/auth/agents/${id}/`)
        .subscribe(a => this.form.patchValue(a));
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(12)]);
    }
  }

  sauvegarder() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.erreur.set('');
    const id  = this.route.snapshot.paramMap.get('id');
    const url = id
      ? `${environment.apiUrl}/auth/agents/${id}/`
      : `${environment.apiUrl}/auth/agents/`;
    const req = id
      ? this.http.patch(url, this.form.value)
      : this.http.post(url, this.form.value);

    req.subscribe({
      next: () => this.router.navigate(['/utilisateurs']),
      error: (e) => {
        this.saving.set(false);
        this.erreur.set(JSON.stringify(e.error));
      },
    });
  }
}
