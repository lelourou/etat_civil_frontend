import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { IndividusService } from '../../core/services/individus.service';
import { Individu } from '../../core/models/individu.models';

@Component({
  selector: 'app-individus-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatTooltipModule, MatChipsModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-header">
      <h2>Individus</h2>
      <button mat-raised-button color="primary" routerLink="nouveau">
        <mat-icon>person_add</mat-icon> Nouvel individu
      </button>
    </div>

    <!-- Recherche -->
    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Rechercher (nom, prénom, NIN...)</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input matInput [formControl]="search">
    </mat-form-field>

    <!-- Filtre décédés -->
    <mat-chip-listbox class="mb-16" (change)="onFiltreChange($event)">
      <mat-chip-option value="">Tous</mat-chip-option>
      <mat-chip-option value="false" selected>Vivants</mat-chip-option>
      <mat-chip-option value="true">Décédés</mat-chip-option>
    </mat-chip-listbox>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <mat-table [dataSource]="individus()" class="mat-elevation-z2">

        <ng-container matColumnDef="nin">
          <mat-header-cell *matHeaderCellDef>NIN</mat-header-cell>
          <mat-cell *matCellDef="let i">
            <code>{{ i.nin }}</code>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="nom">
          <mat-header-cell *matHeaderCellDef>Nom & Prénoms</mat-header-cell>
          <mat-cell *matCellDef="let i">
            <div>
              <strong>{{ i.nom }} {{ i.prenoms }}</strong>
              @if (i.est_decede) {
                <span class="badge-deces">Décédé</span>
              }
            </div>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="sexe">
          <mat-header-cell *matHeaderCellDef>Sexe</mat-header-cell>
          <mat-cell *matCellDef="let i">{{ i.sexe_display }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="date_naissance">
          <mat-header-cell *matHeaderCellDef>Date de naissance</mat-header-cell>
          <mat-cell *matCellDef="let i">{{ i.date_naissance | date:'dd/MM/yyyy' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="centre_naissance">
          <mat-header-cell *matHeaderCellDef>Centre de naissance</mat-header-cell>
          <mat-cell *matCellDef="let i">{{ i.centre_naissance_nom }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef></mat-header-cell>
          <mat-cell *matCellDef="let i">
            <button mat-icon-button color="primary" [routerLink]="[i.id]" matTooltip="Voir détail">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button color="accent" [routerLink]="[i.id, 'actes']" matTooltip="Voir actes">
              <mat-icon>description</mat-icon>
            </button>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="colonnes"></mat-header-row>
        <mat-row *matRowDef="let row; columns: colonnes;"
                 [class.row-decede]="row.est_decede"></mat-row>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell no-data" colspan="6">Aucun individu trouvé.</td>
        </tr>
      </mat-table>

      <mat-paginator [length]="total()" [pageSize]="pageSize"
                     [pageSizeOptions]="[10,20,50]"
                     (page)="onPage($event)">
      </mat-paginator>
    }
  `,
  styles: [`
    .search-field { width: 100%; margin-bottom: 8px; }
    .mb-16 { margin-bottom: 16px; display: block; }
    .center { display:flex; justify-content:center; padding:40px; }
    .badge-deces { margin-left:8px; background:#fce4ec; color:#c62828;
                   padding:2px 8px; border-radius:10px; font-size:11px; }
    .row-decede { opacity: 0.65; }
    .no-data { padding:24px; text-align:center; color:#999; }
    mat-cell, mat-header-cell { padding: 0 8px !important; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:12px; }
  `],
})
export class IndividusListComponent implements OnInit {
  colonnes  = ['nin', 'nom', 'sexe', 'date_naissance', 'centre_naissance', 'actions'];
  individus = signal<Individu[]>([]);
  total     = signal(0);
  loading   = signal(false);
  pageSize  = 20;
  page      = 0;
  search    = new FormControl('');
  filtre    = '';

  constructor(private svc: IndividusService) {}

  ngOnInit() {
    this.charger();
    this.search.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.page = 0; this.charger(); });
  }

  charger() {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.page + 1),
      page_size: String(this.pageSize),
    };
    if (this.search.value) params['search'] = this.search.value;
    if (this.filtre !== '')  params['est_decede'] = this.filtre;

    this.svc.liste(params).subscribe({
      next: r => { this.individus.set(r.results); this.total.set(r.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFiltreChange(e: any) { this.filtre = e.value ?? ''; this.page = 0; this.charger(); }
  onPage(e: PageEvent)   { this.page = e.pageIndex; this.pageSize = e.pageSize; this.charger(); }
}
