import { Component, OnInit, OnDestroy, signal, Injector, effect } from '@angular/core';
import { formatApiError } from '../../core/utils/api-error.utils';
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
import { AuthService } from '../../core/services/auth.service';
import { CentresService, VillageCourant } from '../../core/services/centres.service';
import { Individu } from '../../core/models/individu.models';
import { Acte } from '../../core/models/acte.models';

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
              <mat-label>Centre d'enregistrement</mat-label>
              <input matInput [value]="auth.agent()?.centre_nom ?? auth.getPayload()?.centre_nom ?? ''" readonly>
              <mat-icon matSuffix style="color:#009A44">location_city</mat-icon>
            </mat-form-field>

            <!-- Village de naissance — obligatoire pour NAISSANCE uniquement -->
            @if (step1.get('nature')?.value === 'NAISSANCE') {
              <mat-form-field appearance="outline">
                <mat-label>Village de naissance *</mat-label>
                <mat-select formControlName="village">
                  @for (v of villagesCentre(); track v.village) {
                    <mat-option [value]="v.village">{{ v.village_nom }}</mat-option>
                  }
                </mat-select>
                <mat-hint>Uniquement les villages rattachés à ce centre</mat-hint>
                @if (step1.get('village')?.invalid && step1.get('village')?.touched) {
                  <mat-error>Le village de naissance est obligatoire.</mat-error>
                }
              </mat-form-field>
              @if (villagesCentre().length === 0) {
                <div class="alert-warning">
                  <mat-icon>warning</mat-icon>
                  Aucun village rattaché à ce centre. Contactez l'administrateur.
                </div>
              }
            }

            <!-- Pour NAISSANCE : saisie directe de l'enfant -->
            @if (step1.get('nature')?.value === 'NAISSANCE') {
              <mat-form-field appearance="outline">
                <mat-label>Nom de l'enfant *</mat-label>
                <input matInput formControlName="enfant_nom">
                @if (step1.get('enfant_nom')?.invalid && step1.get('enfant_nom')?.touched) {
                  <mat-error>Le nom est obligatoire.</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Prénoms de l'enfant *</mat-label>
                <input matInput formControlName="enfant_prenoms">
                @if (step1.get('enfant_prenoms')?.invalid && step1.get('enfant_prenoms')?.touched) {
                  <mat-error>Les prénoms sont obligatoires.</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Sexe *</mat-label>
                <mat-select formControlName="enfant_sexe">
                  <mat-option value="M">Masculin</mat-option>
                  <mat-option value="F">Féminin</mat-option>
                </mat-select>
              </mat-form-field>
            }

            <!-- Pour MARIAGE / DÉCÈS : recherche individu existant -->
            @if (step1.get('nature')?.value && step1.get('nature')?.value !== 'NAISSANCE') {
              <mat-form-field appearance="outline">
                <mat-label>Rechercher individu (NIN ou nom) *</mat-label>
                <input matInput [value]="individu()?.nin || ''" readonly
                       placeholder="Cliquez sur Rechercher">
                <button mat-icon-button matSuffix (click)="ouvrirRechercheIndividu()" type="button">
                  <mat-icon>search</mat-icon>
                </button>
              </mat-form-field>
            }

          </div>

          @if (individu() && step1.get('nature')?.value !== 'NAISSANCE') {
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
                    [disabled]="step1.invalid || (step1.get('nature')?.value !== 'NAISSANCE' && !individu())">
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

              <!-- ── PÈRE ─────────────────────────────────────────────── -->
              <h4>Père <span class="hint-required">* Recherche par NIN obligatoire</span></h4>
              <div class="nin-search-row">
                <mat-form-field appearance="outline" class="nin-field">
                  <mat-label>NIN du père *</mat-label>
                  <input matInput [(ngModel)]="ninPere" [ngModelOptions]="{standalone:true}"
                         placeholder="ex: CI2005XXXXXXXX" (keyup.enter)="rechercherParentParNin('pere')">
                  <button mat-icon-button matSuffix type="button"
                          (click)="rechercherParentParNin('pere')" matTooltip="Rechercher">
                    <mat-icon>search</mat-icon>
                  </button>
                </mat-form-field>
                @if (pere()) {
                  <button mat-icon-button color="warn" type="button"
                          (click)="reinitialiserParent('pere')" matTooltip="Effacer">
                    <mat-icon>clear</mat-icon>
                  </button>
                }
              </div>
              @if (erreurNinPere()) {
                <p class="nin-error"><mat-icon>error_outline</mat-icon> {{ erreurNinPere() }}</p>
              }
              @if (pere()) {
                <div class="parent-card">
                  <mat-icon>man</mat-icon>
                  <div>
                    <strong>{{ pere()!.nom }} {{ pere()!.prenoms }}</strong>
                    <small>NIN : {{ pere()!.nin }}</small>
                  </div>
                </div>
                <div class="form-grid" style="margin-top:8px">
                  <mat-form-field appearance="outline">
                    <mat-label>Profession père</mat-label>
                    <input matInput formControlName="profession_pere">
                  </mat-form-field>
                </div>
              }

              <mat-divider class="my-16"></mat-divider>

              <!-- ── MÈRE ─────────────────────────────────────────────── -->
              <h4>Mère <span class="hint-required">* Recherche par NIN obligatoire</span></h4>
              <div class="nin-search-row">
                <mat-form-field appearance="outline" class="nin-field">
                  <mat-label>NIN de la mère *</mat-label>
                  <input matInput [(ngModel)]="ninMere" [ngModelOptions]="{standalone:true}"
                         placeholder="ex: CI2000XXXXXXXX" (keyup.enter)="rechercherParentParNin('mere')">
                  <button mat-icon-button matSuffix type="button"
                          (click)="rechercherParentParNin('mere')" matTooltip="Rechercher">
                    <mat-icon>search</mat-icon>
                  </button>
                </mat-form-field>
                @if (mere()) {
                  <button mat-icon-button color="warn" type="button"
                          (click)="reinitialiserParent('mere')" matTooltip="Effacer">
                    <mat-icon>clear</mat-icon>
                  </button>
                }
              </div>
              @if (erreurNinMere()) {
                <p class="nin-error"><mat-icon>error_outline</mat-icon> {{ erreurNinMere() }}</p>
              }
              @if (mere()) {
                <div class="parent-card mere">
                  <mat-icon>woman</mat-icon>
                  <div>
                    <strong>{{ mere()!.nom }} {{ mere()!.prenoms }}</strong>
                    <small>NIN : {{ mere()!.nin }}</small>
                  </div>
                </div>
                <div class="form-grid" style="margin-top:8px">
                  <mat-form-field appearance="outline">
                    <mat-label>Profession mère</mat-label>
                    <input matInput formControlName="profession_mere">
                  </mat-form-field>
                </div>
              }
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

              <!-- Époux = individu sélectionné à l'étape 1 -->
              <h4 style="margin-bottom:8px">Époux <span style="color:#888;font-weight:400;font-size:13px">(individu sélectionné à l'étape 1)</span></h4>
              @if (individu()) {
                <div class="acte-card epoux">
                  <mat-icon>male</mat-icon>
                  <div>
                    <strong>{{ individu()!.nom }} {{ individu()!.prenoms }}</strong>
                    <small>NIN : {{ individu()!.nin }}</small>
                  </div>
                </div>
              } @else {
                <p style="color:#e53935;font-size:13px">
                  <mat-icon style="vertical-align:middle;font-size:16px">warning</mat-icon>
                  Retournez à l'étape 1 pour sélectionner l'époux.
                </p>
              }

              <!-- Épouse — recherche -->
              <mat-divider class="my-16"></mat-divider>
              <h4>Épouse</h4>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Rechercher l'épouse (NIN ou nom)</mat-label>
                  <input matInput [value]="epouse()?.nin || ''" readonly
                         placeholder="Cliquez sur Rechercher">
                  <button mat-icon-button matSuffix type="button"
                          (click)="toggleRechercheEpouse()"
                          matTooltip="Rechercher l'épouse">
                    <mat-icon>{{ rechercheEpouseOuverte() ? 'close' : 'search' }}</mat-icon>
                  </button>
                </mat-form-field>
              </div>
              @if (epouse()) {
                <div class="acte-card epouse">
                  <mat-icon>female</mat-icon>
                  <div>
                    <strong>{{ epouse()!.nom }} {{ epouse()!.prenoms }}</strong>
                    <small>NIN : {{ epouse()!.nin }}</small>
                  </div>
                  <button mat-icon-button color="warn" type="button"
                          (click)="epouse.set(null)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
              @if (rechercheEpouseOuverte()) {
                <div class="recherche-panel">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nom ou NIN de l'épouse</mat-label>
                    <input matInput [(ngModel)]="termeEpouse" [ngModelOptions]="{standalone:true}"
                           (input)="rechercherEpouse()">
                  </mat-form-field>
                  <div class="resultats">
                    @for (r of resultatsEpouseIndividu(); track r.id) {
                      <div class="resultat-item" (click)="selectionnerEpouse(r)">
                        <strong>{{ r.nom }} {{ r.prenoms }}</strong>
                        <span>NIN: {{ r.nin }} | {{ r.date_naissance | date:'dd/MM/yyyy' }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <mat-divider class="my-16"></mat-divider>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Régime matrimonial</mat-label>
                  <mat-select formControlName="regime_matrimonial">
                    <mat-option value="COMMUNAUTE_BIENS">Communauté de biens</mat-option>
                    <mat-option value="SEPARATION_BIENS">Séparation de biens</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Officiant</mat-label>
                  <input matInput formControlName="officiant_nom">
                </mat-form-field>
              </div>

              <!-- Acte de naissance Époux -->
              <mat-divider class="my-16"></mat-divider>
              <h4>Acte de naissance — Époux</h4>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Réf. acte naissance époux</mat-label>
                  <input matInput formControlName="acte_naissance_epoux_ref" readonly
                         placeholder="Recherchez via le bouton →">
                  <button mat-icon-button matSuffix type="button"
                          (click)="toggleRechercheEpoux()"
                          matTooltip="Rechercher l'acte de naissance de l'époux">
                    <mat-icon>{{ rechercheEpouxOuverte() ? 'close' : 'search' }}</mat-icon>
                  </button>
                </mat-form-field>
              </div>
              @if (acteNaissanceEpoux()) {
                <div class="acte-card epoux">
                  <mat-icon>male</mat-icon>
                  <div>
                    <strong>{{ acteNaissanceEpoux()!.individu_nom }}</strong>
                    <small>Acte : {{ acteNaissanceEpoux()!.numero_national }} — {{ acteNaissanceEpoux()!.centre_nom }}</small>
                  </div>
                  <button mat-icon-button color="warn" type="button"
                          (click)="acteNaissanceEpoux.set(null); step2.patchValue({acte_naissance_epoux_ref: ''})">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
              @if (rechercheEpouxOuverte()) {
                <div class="recherche-panel">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nom ou NIN de l'époux</mat-label>
                    <input matInput [(ngModel)]="termeEpoux" [ngModelOptions]="{standalone:true}"
                           (input)="rechercherActeNaissance('epoux')">
                  </mat-form-field>
                  <div class="resultats">
                    @for (a of resultatsEpoux(); track a.id) {
                      <div class="resultat-item" (click)="selectionnerActeNaissance('epoux', a)">
                        <strong>{{ a.individu_nom }}</strong>
                        <span>{{ a.numero_national }} — {{ a.centre_nom }}</span>
                      </div>
                    }
                    @if (resultatsEpoux().length === 0 && termeEpoux.length >= 2) {
                      <p class="no-result">Aucun acte de naissance trouvé.</p>
                    }
                  </div>
                </div>
              }

              <!-- Acte de naissance Épouse -->
              <mat-divider class="my-16"></mat-divider>
              <h4>Acte de naissance — Épouse</h4>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Réf. acte naissance épouse</mat-label>
                  <input matInput formControlName="acte_naissance_epouse_ref" readonly
                         placeholder="Recherchez via le bouton →">
                  <button mat-icon-button matSuffix type="button"
                          (click)="toggleRechercheEpouse()"
                          matTooltip="Rechercher l'acte de naissance de l'épouse">
                    <mat-icon>{{ rechercheEpouseOuverte() ? 'close' : 'search' }}</mat-icon>
                  </button>
                </mat-form-field>
              </div>
              @if (acteNaissanceEpouse()) {
                <div class="acte-card epouse">
                  <mat-icon>female</mat-icon>
                  <div>
                    <strong>{{ acteNaissanceEpouse()!.individu_nom }}</strong>
                    <small>Acte : {{ acteNaissanceEpouse()!.numero_national }} — {{ acteNaissanceEpouse()!.centre_nom }}</small>
                  </div>
                  <button mat-icon-button color="warn" type="button"
                          (click)="acteNaissanceEpouse.set(null); step2.patchValue({acte_naissance_epouse_ref: ''})">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
              @if (rechercheEpouseOuverte()) {
                <div class="recherche-panel">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nom ou NIN de l'épouse</mat-label>
                    <input matInput [(ngModel)]="termeEpouse" [ngModelOptions]="{standalone:true}"
                           (input)="rechercherActeNaissance('epouse')">
                  </mat-form-field>
                  <div class="resultats">
                    @for (a of resultatsEpouse(); track a.id) {
                      <div class="resultat-item" (click)="selectionnerActeNaissance('epouse', a)">
                        <strong>{{ a.individu_nom }}</strong>
                        <span>{{ a.numero_national }} — {{ a.centre_nom }}</span>
                      </div>
                    }
                    @if (resultatsEpouse().length === 0 && termeEpouse.length >= 2) {
                      <p class="no-result">Aucun acte de naissance trouvé.</p>
                    }
                  </div>
                </div>
              }

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
    .acte-card { display:flex; align-items:center; gap:12px; padding:10px 16px;
                 border-radius:8px; margin:8px 0; }
    .acte-card.epoux { background:#e3f2fd; }
    .acte-card.epouse { background:#fce4ec; }
    .acte-card div { flex:1; display:flex; flex-direction:column; }
    .acte-card small { color:#555; font-size:12px; }
    .no-result { padding:8px 12px; color:#999; font-size:13px; }
    .alert-warning { display:flex; align-items:center; gap:8px; padding:10px 14px;
                     background:#fff3e0; color:#e65100; border-radius:6px;
                     font-size:13px; margin:4px 0; }
    .alert-warning mat-icon { font-size:18px; width:18px; height:18px; }
    .hint-required { font-size:11px; color:#e53935; font-weight:400; margin-left:8px; }
    .nin-search-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .nin-field { flex:1; max-width:340px; }
    .parent-card { display:flex; align-items:center; gap:12px; padding:10px 16px;
                   background:#e3f2fd; border-radius:8px; margin-bottom:8px; }
    .parent-card.mere { background:#fce4ec; }
    .parent-card div { flex:1; display:flex; flex-direction:column; }
    .parent-card small { color:#555; font-size:12px; }
    .nin-error { display:flex; align-items:center; gap:6px; color:#e53935;
                 font-size:13px; margin:4px 0; }
    .nin-error mat-icon { font-size:16px; width:16px; height:16px; }
  `],
})
export class ActeFormComponent implements OnInit, OnDestroy {
  step1!: FormGroup;
  step2!: FormGroup;
  loading            = signal(false);
  individu           = signal<Individu | null>(null);
  rechercheOuverte   = signal(false);
  resultatsRecherche = signal<Individu[]>([]);
  termeRecherche     = '';

  // Villages rattachés au centre (pour acte de naissance)
  villagesCentre = signal<VillageCourant[]>([]);

  // Recherche parents par NIN
  pere          = signal<Individu | null>(null);
  mere          = signal<Individu | null>(null);
  ninPere       = '';
  ninMere       = '';
  erreurNinPere = signal('');
  erreurNinMere = signal('');


  // Épouse (individu) pour acte de mariage
  epouse                 = signal<Individu | null>(null);
  rechercheEpouseOuverte = signal(false);
  resultatsEpouseIndividu = signal<Individu[]>([]);
  termeEpouse            = '';

  // Recherche actes de naissance (réf.) époux / épouse
  rechercheEpouxOuverte  = signal(false);
  resultatsEpoux         = signal<Acte[]>([]);
  resultatsEpouse        = signal<Acte[]>([]);
  acteNaissanceEpoux     = signal<Acte | null>(null);
  acteNaissanceEpouse    = signal<Acte | null>(null);
  termeEpoux             = '';

  private _centreEffectRef: ReturnType<typeof effect> | null = null;

  constructor(
    private fb: FormBuilder,
    private svc: ActesService,
    private individusSvc: IndividusService,
    private centresSvc: CentresService,
    public auth: AuthService,
    private snack: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private injector: Injector,
  ) {}

  ngOnDestroy() {
    this._centreEffectRef?.destroy();
  }

  ngOnInit() {
    // centreId depuis JWT (synchrone) ou agent() chargé via /me/ (asynchrone)
    const centreId = this.auth.centreId ?? this.auth.agent()?.centre ?? '';

    // Charger les villages du centre pour la règle de naissance
    if (centreId) {
      this.centresSvc.villagescourants(centreId).subscribe({
        next: v => this.villagesCentre.set(v),
        error: () => {},
      });
    }

    this.step1 = this.fb.group({
      nature:          ['', Validators.required],
      date_evenement:  ['', Validators.required],
      centre:          [centreId, Validators.required],
      individu:        [''],
      village:         [''],
      observations:    [''],
      enfant_nom:      [''],
      enfant_prenoms:  [''],
      enfant_sexe:     [''],
    });

    // Validators dynamiques selon nature
    this.step1.get('nature')!.valueChanges.subscribe(nature => {
      const villageCtrl  = this.step1.get('village')!;
      const individuCtrl = this.step1.get('individu')!;
      const nomCtrl      = this.step1.get('enfant_nom')!;
      const prenomsCtrl  = this.step1.get('enfant_prenoms')!;
      const sexeCtrl     = this.step1.get('enfant_sexe')!;

      if (nature === 'NAISSANCE') {
        villageCtrl.setValidators(Validators.required);
        individuCtrl.clearValidators(); individuCtrl.setValue('');
        nomCtrl.setValidators(Validators.required);
        prenomsCtrl.setValidators(Validators.required);
        sexeCtrl.setValidators(Validators.required);
      } else {
        villageCtrl.clearValidators(); villageCtrl.setValue('');
        individuCtrl.setValidators(Validators.required);
        nomCtrl.clearValidators(); nomCtrl.setValue('');
        prenomsCtrl.clearValidators(); prenomsCtrl.setValue('');
        sexeCtrl.clearValidators(); sexeCtrl.setValue('');
      }
      [villageCtrl, individuCtrl, nomCtrl, prenomsCtrl, sexeCtrl]
        .forEach(c => c.updateValueAndValidity());
    });

    // Fallback : si le JWT ne contient pas encore centre_id,
    // on attend que /me/ réponde et on patche le formulaire
    if (!centreId) {
      this._centreEffectRef = effect(() => {
        const a = this.auth.agent();
        if (a?.centre) {
          this.step1.patchValue({ centre: a.centre });
        }
      }, { injector: this.injector });
    }
    this.step2 = this.fb.group({
      // Communs
      declarant_nom:     [''], declarant_prenoms: [''],
      declarant_lien:    [''], declarant_cin:     [''],
      // Naissance — Père
      nom_pere:          [''], prenoms_pere:     [''],
      nationalite_pere:  ['CI'], profession_pere: [''],
      // Naissance — Mère
      nom_mere:          [''], prenoms_mere:     [''],
      nationalite_mere:  ['CI'], profession_mere: [''],
      // Naissance — autres
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

  // ── Recherche parents par NIN ─────────────────────────────────────────

  rechercherParentParNin(role: 'pere' | 'mere') {
    const nin    = role === 'pere' ? this.ninPere.trim() : this.ninMere.trim();
    const errSig = role === 'pere' ? this.erreurNinPere : this.erreurNinMere;
    if (!nin) { errSig.set('Saisissez un NIN avant de rechercher.'); return; }
    errSig.set('');
    this.individusSvc.liste({ search: nin, page_size: '5' }).subscribe({
      next: r => {
        const found = r.results.find(i => i.nin === nin) ?? r.results[0];
        if (!found) { errSig.set(`Aucun individu trouvé pour le NIN : ${nin}`); return; }
        if (role === 'pere') {
          this.pere.set(found); this.erreurNinPere.set('');
          this.step2.patchValue({ nom_pere: found.nom, prenoms_pere: found.prenoms, nationalite_pere: found.nationalite || 'CI' });
        } else {
          this.mere.set(found); this.erreurNinMere.set('');
          this.step2.patchValue({ nom_mere: found.nom, prenoms_mere: found.prenoms, nationalite_mere: found.nationalite || 'CI' });
        }
      },
      error: () => errSig.set('Erreur lors de la recherche.'),
    });
  }

  reinitialiserParent(role: 'pere' | 'mere') {
    if (role === 'pere') {
      this.pere.set(null); this.ninPere = ''; this.erreurNinPere.set('');
      this.step2.patchValue({ nom_pere: '', prenoms_pere: '', nationalite_pere: 'CI', profession_pere: '' });
    } else {
      this.mere.set(null); this.ninMere = ''; this.erreurNinMere.set('');
      this.step2.patchValue({ nom_mere: '', prenoms_mere: '', nationalite_mere: 'CI', profession_mere: '' });
    }
  }

  // ── Sélection épouse (individu FK) ────────────────────────────────────

  toggleRechercheEpouse() {
    this.rechercheEpouseOuverte.set(!this.rechercheEpouseOuverte());
    this.resultatsEpouseIndividu.set([]);
    this.termeEpouse = '';
  }

  rechercherEpouse() {
    if (this.termeEpouse.length < 2) { this.resultatsEpouseIndividu.set([]); return; }
    this.individusSvc.liste({ search: this.termeEpouse, page_size: '10' })
      .subscribe(r => this.resultatsEpouseIndividu.set(r.results));
  }

  selectionnerEpouse(i: Individu) {
    this.epouse.set(i);
    this.rechercheEpouseOuverte.set(false);
    this.resultatsEpouseIndividu.set([]);
    this.termeEpouse = '';
  }

  // ── Recherche actes de naissance (réf. texte) ─────────────────────────

  toggleRechercheEpoux() {
    this.rechercheEpouxOuverte.set(!this.rechercheEpouxOuverte());
    this.resultatsEpoux.set([]);
    this.termeEpoux = '';
  }

  rechercherActeNaissance(cible: 'epoux' | 'epouse') {
    const terme = cible === 'epoux' ? this.termeEpoux : this.termeEpouse;
    if (terme.length < 2) {
      cible === 'epoux' ? this.resultatsEpoux.set([]) : this.resultatsEpouse.set([]);
      return;
    }
    this.svc.liste({ nature: 'NAISSANCE', search: terme, page_size: '10' }).subscribe(r => {
      cible === 'epoux'
        ? this.resultatsEpoux.set(r.results)
        : this.resultatsEpouse.set(r.results);
    });
  }

  selectionnerActeNaissance(cible: 'epoux' | 'epouse', acte: Acte) {
    if (cible === 'epoux') {
      this.acteNaissanceEpoux.set(acte);
      this.step2.patchValue({ acte_naissance_epoux_ref: acte.numero_national });
      this.rechercheEpouxOuverte.set(false);
      this.resultatsEpoux.set([]);
    } else {
      this.acteNaissanceEpouse.set(acte);
      this.step2.patchValue({ acte_naissance_epouse_ref: acte.numero_national });
      // rechercheEpouseRef n'est pas utilisée ici (c'est la recherche individu qui est active)
      this.resultatsEpouse.set([]);
    }
  }

  onSubmit() {
    const nature = this.step1.get('nature')!.value;

    if (nature === 'MARIAGE' && !this.epouse()) {
      this.snack.open('Veuillez sélectionner l\'épouse avant d\'enregistrer.', 'Fermer', { duration: 4000 });
      return;
    }
    if (nature === 'NAISSANCE' && (!this.pere() || !this.mere())) {
      this.snack.open('Le père et la mère doivent être recherchés par NIN.', 'Fermer', { duration: 4000 });
      return;
    }

    this.loading.set(true);
    const v1 = { ...this.step1.value };
    const v2 = this.step2.value;

    if (v1.date_evenement instanceof Date) {
      const d = v1.date_evenement;
      v1.date_evenement = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    if (nature === 'NAISSANCE') {
      // Créer l'individu (enfant) puis l'acte
      const enfantData = {
        nom:            v1.enfant_nom,
        prenoms:        v1.enfant_prenoms,
        sexe:           v1.enfant_sexe,
        date_naissance: v1.date_evenement,
        lieu_naissance_village: v1.village || null,
        nationalite:    'CI',
      };
      this.individusSvc.creer(enfantData).subscribe({
        next: (enfant) => {
          const payload: any = {
            nature:         v1.nature,
            date_evenement: v1.date_evenement,
            centre:         v1.centre,
            village:        v1.village,
            individu:       enfant.id,
            observations:   v1.observations,
            detail_naissance: v2,
          };
          this._soumettreActe(payload);
        },
        error: (e) => {
          this.loading.set(false);
          this.snack.open('Erreur création enfant : ' + formatApiError(e.error), 'Fermer', { duration: 6000 });
        },
      });
    } else {
      const payload: any = { ...v1 };
      delete payload['enfant_nom']; delete payload['enfant_prenoms']; delete payload['enfant_sexe'];
      if (nature === 'MARIAGE') {
        payload['detail_mariage'] = { ...v2, epoux: this.individu()?.id, epouse: this.epouse()?.id };
      }
      if (nature === 'DECES') payload['detail_deces'] = v2;
      this._soumettreActe(payload);
    }
  }

  private _soumettreActe(payload: any) {
    this.svc.creer(payload).subscribe({
      next: (acte) => {
        this.loading.set(false);
        this.snack.open(`Acte créé — ${acte.numero_national}`, 'OK', { duration: 4000 });
        this.router.navigate(['/actes', acte.id]);
      },
      error: (e) => {
        this.loading.set(false);
        this.snack.open(formatApiError(e.error), 'Fermer', { duration: 6000 });
      },
    });
  }
}
