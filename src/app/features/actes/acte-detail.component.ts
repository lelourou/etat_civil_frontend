import { Component, OnInit, signal } from '@angular/core';
import { formatApiError } from '../../core/utils/api-error.utils';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActesService } from '../../core/services/actes.service';
import { PaiementsService } from '../../core/services/paiements.service';
import { AuthService } from '../../core/services/auth.service';
import { Acte } from '../../core/models/acte.models';
import { StatutBadgeComponent } from '../../shared/components/statut-badge/statut-badge.component';

@Component({
  selector: 'app-acte-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatTabsModule, MatSnackBarModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, StatutBadgeComponent,
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>description</mat-icon> Détail de l'acte</h2>
      <button mat-stroked-button routerLink="/actes">
        <mat-icon>arrow_back</mat-icon> Retour
      </button>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (acte()) {

      <!-- En-tête acte -->
      <mat-card class="header-card">
        <mat-card-content>
          <div class="acte-header">
            <div>
              <code class="numero">{{ acte()!.numero_national }}</code>
              <h3>{{ acte()!.nature_display }} — {{ acte()!.individu_nom }}</h3>
              <p>{{ acte()!.centre_nom }} | {{ acte()!.date_evenement | date:'dd/MM/yyyy' }}</p>
            </div>
            <div class="header-right">
              <app-statut-badge [statut]="acte()!.statut.toLowerCase()"
                                [label]="acte()!.statut_display">
              </app-statut-badge>

              @if (peutValider()) {
                <button mat-raised-button color="primary" (click)="valider()" [disabled]="loadingAction()">
                  <mat-icon>check_circle</mat-icon> Valider l'acte
                </button>
              }

              @if (acte()!.statut === 'VALIDE') {
                <button mat-raised-button color="accent" (click)="demanderCopie()">
                  <mat-icon>file_copy</mat-icon> Demander une copie
                </button>
              }
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <mat-tab-group>

            <!-- Onglet : Informations -->
            <mat-tab label="Informations">
              <div class="tab-content">
                <div class="info-grid">
                  <div class="info-item"><span class="label">Numéro national</span><code>{{ acte()!.numero_national }}</code></div>
                  <div class="info-item"><span class="label">Nature</span>{{ acte()!.nature_display }}</div>
                  <div class="info-item"><span class="label">Statut</span>
                    <app-statut-badge [statut]="acte()!.statut.toLowerCase()" [label]="acte()!.statut_display"></app-statut-badge>
                  </div>
                  <div class="info-item"><span class="label">Individu concerné</span>
                    <a [routerLink]="['/individus', acte()!.individu]">{{ acte()!.individu_nom }}</a>
                  </div>
                  <div class="info-item"><span class="label">Centre</span>{{ acte()!.centre_nom }}</div>
                  <div class="info-item"><span class="label">Date événement</span>{{ acte()!.date_evenement | date:'dd/MM/yyyy' }}</div>
                  <div class="info-item"><span class="label">Enregistré le</span>{{ acte()!.date_enregistrement | date:'dd/MM/yyyy HH:mm' }}</div>
                  <div class="info-item"><span class="label">Agent</span>{{ acte()!.agent_nom }}</div>
                  @if (acte()!.superviseur) {
                    <div class="info-item"><span class="label">Validé le</span>{{ acte()!.date_validation | date:'dd/MM/yyyy HH:mm' }}</div>
                  }
                </div>

                @if (acte()!.observations) {
                  <mat-divider class="my-16"></mat-divider>
                  <div class="info-item"><span class="label">Observations</span>{{ acte()!.observations }}</div>
                }

                <!-- Détails naissance -->
                @if (acte()!.detail_naissance) {
                  <mat-divider class="my-16"></mat-divider>
                  <h4>Détails naissance</h4>
                  <div class="info-grid">
                    <div class="info-item"><span class="label">Heure</span>{{ acte()!.detail_naissance!.heure_naissance || '—' }}</div>
                    <div class="info-item"><span class="label">Établissement</span>{{ acte()!.detail_naissance!.etablissement || '—' }}</div>
                    <div class="info-item"><span class="label">Déclarant</span>{{ acte()!.detail_naissance!.declarant_nom }} {{ acte()!.detail_naissance!.declarant_prenoms }}</div>
                  </div>
                }

                <!-- Détails mariage -->
                @if (acte()!.detail_mariage) {
                  <mat-divider class="my-16"></mat-divider>
                  <h4>Détails mariage</h4>
                  <div class="info-grid">
                    <div class="info-item"><span class="label">Époux</span>{{ acte()!.detail_mariage!.epoux_nom }}</div>
                    <div class="info-item"><span class="label">Épouse</span>{{ acte()!.detail_mariage!.epouse_nom }}</div>
                    <div class="info-item"><span class="label">Régime</span>{{ acte()!.detail_mariage!.regime_matrimonial || '—' }}</div>
                    <div class="info-item"><span class="label">Officiant</span>{{ acte()!.detail_mariage!.officiant_nom || '—' }}</div>
                  </div>
                }

                <!-- Détails décès -->
                @if (acte()!.detail_deces) {
                  <mat-divider class="my-16"></mat-divider>
                  <h4>Détails décès</h4>
                  <div class="info-grid">
                    <div class="info-item"><span class="label">Lieu</span>{{ acte()!.detail_deces!.lieu_deces || '—' }}</div>
                    <div class="info-item"><span class="label">Cause</span>{{ acte()!.detail_deces!.cause_deces || '—' }}</div>
                    <div class="info-item"><span class="label">Déclarant</span>{{ acte()!.detail_deces!.declarant_nom }} {{ acte()!.detail_deces!.declarant_prenoms }}</div>
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Onglet : Mentions marginales -->
            <mat-tab [label]="'Mentions (' + (acte()!.mentions?.length || 0) + ')'">
              <div class="tab-content">
                @for (m of acte()!.mentions; track m.id) {
                  <div class="mention-item">
                    <div class="mention-header">
                      <app-statut-badge [statut]="'envoyee'" [label]="m.type_mention_display"></app-statut-badge>
                      <span class="mention-date">{{ m.date_mention | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <p>{{ m.contenu }}</p>
                    <small>Par {{ m.agent_nom }}</small>
                  </div>
                } @empty {
                  <p class="no-data">Aucune mention marginale.</p>
                }
              </div>
            </mat-tab>

          </mat-tab-group>
        </mat-card-content>
      </mat-card>

      <!-- Formulaire demande copie (inline) -->
      @if (demandeOuverte()) {
        <mat-card class="demande-card">
          <mat-card-header><mat-card-title>Demande de copie d'acte</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="formDemande" (ngSubmit)="soumettreDemande()" class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Nom du demandeur *</mat-label>
                <input matInput formControlName="demandeur_nom">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>CIN demandeur</mat-label>
                <input matInput formControlName="demandeur_cin">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Lien avec l'individu</mat-label>
                <input matInput formControlName="demandeur_lien">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Type de copie *</mat-label>
                <mat-select formControlName="type_copie">
                  <mat-option value="COPIE_INTEGRALE">Copie intégrale</mat-option>
                  <mat-option value="EXTRAIT_AVEC_FILIATION">Extrait avec filiation</mat-option>
                  <mat-option value="EXTRAIT_SANS_FILIATION">Extrait sans filiation</mat-option>
                  <mat-option value="BULLETIN">Bulletin</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Canal</mat-label>
                <mat-select formControlName="canal">
                  <mat-option value="GUICHET">Guichet</mat-option>
                  <mat-option value="EN_LIGNE">En ligne</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Moyen de paiement</mat-label>
                <mat-select formControlName="moyen_paiement">
                  <mat-option value="ESPECES">Espèces (500 FCFA)</mat-option>
                  <mat-option value="MTN_MONEY">MTN Money</mat-option>
                  <mat-option value="ORANGE_MONEY">Orange Money</mat-option>
                  <mat-option value="WAVE">Wave</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="form-actions" style="grid-column:1/-1">
                <button mat-stroked-button type="button" (click)="demandeOuverte.set(false)">Annuler</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="formDemande.invalid || loadingAction()">
                  <mat-icon>receipt</mat-icon> Soumettre (500 FCFA)
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .page-header h2 { display:flex; align-items:center; gap:8px; margin:0; }
    .center { display:flex; justify-content:center; padding:40px; }
    .header-card { margin-bottom:16px; }
    .acte-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .acte-header h3 { margin:8px 0 4px; }
    .acte-header p { margin:0; color:#666; }
    .header-right { display:flex; flex-direction:column; align-items:flex-end; gap:12px; }
    .numero { font-size:14px; background:#e3f2fd; color:#1565c0; padding:4px 10px; border-radius:4px; }
    .tab-content { padding:24px 0; }
    .info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:16px; }
    .info-item { display:flex; flex-direction:column; gap:4px; }
    .label { font-size:11px; color:#757575; text-transform:uppercase; letter-spacing:.5px; }
    .my-16 { margin:16px 0; }
    code { background:#f5f5f5; padding:3px 8px; border-radius:4px; font-size:12px; width:fit-content; }
    .mention-item { background:#fafafa; border:1px solid #e0e0e0; border-radius:8px; padding:16px; margin-bottom:12px; }
    .mention-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .mention-date { color:#757575; font-size:13px; }
    .no-data { color:#999; text-align:center; padding:24px; }
    .demande-card { margin-top:16px; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; }
    .form-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:8px; }
  `],
})
export class ActeDetailComponent implements OnInit {
  acte          = signal<Acte | null>(null);
  loading       = signal(false);
  loadingAction = signal(false);
  demandeOuverte = signal(false);
  formDemande   = this.fb.group({
    demandeur_nom:   ['', Validators.required],
    demandeur_cin:   [''],
    demandeur_lien:  [''],
    type_copie:      ['COPIE_INTEGRALE', Validators.required],
    canal:           ['GUICHET'],
    moyen_paiement:  ['ESPECES'],
  });

  constructor(
    private route: ActivatedRoute,
    private svc: ActesService,
    private paiementsSvc: PaiementsService,
    public auth: AuthService,
    private snack: MatSnackBar,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.svc.detail(id).subscribe({
      next: a => { this.acte.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  peutValider(): boolean {
    const role = this.auth.role;
    return this.acte()?.statut === 'BROUILLON' &&
           ['SUPERVISEUR_CENTRE', 'SUPERVISEUR_NATIONAL', 'ADMIN_SYSTEME'].includes(role);
  }

  valider() {
    this.loadingAction.set(true);
    this.svc.valider(this.acte()!.id).subscribe({
      next: a => {
        this.acte.set(a);
        this.loadingAction.set(false);
        this.snack.open('Acte validé avec succès.', 'OK', { duration: 3000 });
      },
      error: (e) => {
        this.loadingAction.set(false);
        this.snack.open(formatApiError(e.error), 'Fermer', { duration: 4000 });
      },
    });
  }

  demanderCopie() { this.demandeOuverte.set(true); }

  soumettreDemande() {
    if (this.formDemande.invalid) return;
    this.loadingAction.set(true);
    const v = this.formDemande.value;
    const payload = {
      acte:          this.acte()!.id,
      centre:        this.acte()!.centre,
      demandeur_nom: v.demandeur_nom!,
      demandeur_cin: v.demandeur_cin!,
      demandeur_lien:v.demandeur_lien!,
      type_copie:    v.type_copie!,
      canal:         v.canal!,
    };
    this.paiementsSvc.creerDemande(payload as any).subscribe({
      next: (d) => {
        // Confirmer paiement immédiatement si guichet
        if (v.canal === 'GUICHET') {
          this.paiementsSvc.confirmerPaiement(d.id, v.moyen_paiement!).subscribe({
            next: () => {
              this.loadingAction.set(false);
              this.demandeOuverte.set(false);
              this.snack.open(`Copie demandée et payée — Réf: ${d.reference}`, 'OK', { duration: 5000 });
            },
          });
        } else {
          this.loadingAction.set(false);
          this.demandeOuverte.set(false);
          this.snack.open(`Demande créée — Réf: ${d.reference}. Paiement en attente.`, 'OK', { duration: 5000 });
        }
      },
      error: (e) => {
        this.loadingAction.set(false);
        this.snack.open(formatApiError(e.error), 'Fermer', { duration: 4000 });
      },
    });
  }
}
