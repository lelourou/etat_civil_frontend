import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActesService } from '../../core/services/actes.service';
import { Acte } from '../../core/models/acte.models';
import { StatutBadgeComponent } from '../../shared/components/statut-badge/statut-badge.component';

@Component({
  selector: 'app-actes-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatPaginatorModule, MatTooltipModule,
    StatutBadgeComponent,
  ],
  template: `
    <div class="page-header">
      <h2>Actes d'état civil</h2>
      <button mat-raised-button color="primary" routerLink="nouveau">
        <mat-icon>add</mat-icon> Nouvel acte
      </button>
    </div>

    <!-- Filtres -->
    <div class="filters-row">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Rechercher (numéro, nom, NIN...)</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="search">
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:180px">
        <mat-label>Nature</mat-label>
        <mat-select [formControl]="filtreNature">
          <mat-option value="">Toutes</mat-option>
          <mat-option value="NAISSANCE">Naissance</mat-option>
          <mat-option value="MARIAGE">Mariage</mat-option>
          <mat-option value="DECES">Décès</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:180px">
        <mat-label>Statut</mat-label>
        <mat-select [formControl]="filtreStatut">
          <mat-option value="">Tous</mat-option>
          <mat-option value="BROUILLON">Brouillon</mat-option>
          <mat-option value="VALIDE">Validé</mat-option>
          <mat-option value="VERROUILLE">Verrouillé</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <mat-table [dataSource]="actes()" class="mat-elevation-z2">

        <ng-container matColumnDef="numero">
          <mat-header-cell *matHeaderCellDef>Numéro national</mat-header-cell>
          <mat-cell *matCellDef="let a"><code>{{ a.numero_national }}</code></mat-cell>
        </ng-container>

        <ng-container matColumnDef="nature">
          <mat-header-cell *matHeaderCellDef>Nature</mat-header-cell>
          <mat-cell *matCellDef="let a">
            <span class="nature-icon">
              <mat-icon>{{ iconeNature(a.nature) }}</mat-icon>
              {{ a.nature_display }}
            </span>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="individu">
          <mat-header-cell *matHeaderCellDef>Individu</mat-header-cell>
          <mat-cell *matCellDef="let a">{{ a.individu_nom }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="centre">
          <mat-header-cell *matHeaderCellDef>Centre</mat-header-cell>
          <mat-cell *matCellDef="let a">{{ a.centre_nom }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="date">
          <mat-header-cell *matHeaderCellDef>Date événement</mat-header-cell>
          <mat-cell *matCellDef="let a">{{ a.date_evenement | date:'dd/MM/yyyy' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="statut">
          <mat-header-cell *matHeaderCellDef>Statut</mat-header-cell>
          <mat-cell *matCellDef="let a">
            <app-statut-badge [statut]="a.statut.toLowerCase()" [label]="a.statut_display">
            </app-statut-badge>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef></mat-header-cell>
          <mat-cell *matCellDef="let a">
            <button mat-icon-button color="primary" [routerLink]="[a.id]" matTooltip="Voir détail">
              <mat-icon>visibility</mat-icon>
            </button>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="colonnes"></mat-header-row>
        <mat-row *matRowDef="let row; columns: colonnes;"></mat-row>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell no-data" colspan="7">Aucun acte trouvé.</td>
        </tr>
      </mat-table>

      <mat-paginator [length]="total()" [pageSize]="pageSize"
                     [pageSizeOptions]="[10,20,50]" (page)="onPage($event)">
      </mat-paginator>
    }
  `,
  styles: [`
    .filters-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; }
    .search-field { flex:1; min-width:250px; }
    .center { display:flex; justify-content:center; padding:40px; }
    .nature-icon { display:flex; align-items:center; gap:6px; }
    .nature-icon mat-icon { font-size:18px; width:18px; height:18px; }
    .no-data { padding:24px; text-align:center; color:#999; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:11px; }
    mat-cell, mat-header-cell { padding:0 8px !important; }
  `],
})
export class ActesListComponent implements OnInit {
  colonnes      = ['numero', 'nature', 'individu', 'centre', 'date', 'statut', 'actions'];
  actes         = signal<Acte[]>([]);
  total         = signal(0);
  loading       = signal(false);
  pageSize      = 20;
  page          = 0;
  search        = new FormControl('');
  filtreNature  = new FormControl('');
  filtreStatut  = new FormControl('');

  constructor(private svc: ActesService, private route: ActivatedRoute) {}

  ngOnInit() {
    // Pré-filtre depuis query params (ex: ?statut=BROUILLON depuis dashboard)
    const params = this.route.snapshot.queryParams;
    if (params['statut']) this.filtreStatut.setValue(params['statut']);

    this.charger();
    this.search.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.page = 0; this.charger(); });
    this.filtreNature.valueChanges.subscribe(() => { this.page = 0; this.charger(); });
    this.filtreStatut.valueChanges.subscribe(() => { this.page = 0; this.charger(); });
  }

  charger() {
    this.loading.set(true);
    const p: Record<string, string> = { page: String(this.page + 1), page_size: String(this.pageSize) };
    if (this.search.value)       p['search'] = this.search.value;
    if (this.filtreNature.value) p['nature']  = this.filtreNature.value;
    if (this.filtreStatut.value) p['statut']  = this.filtreStatut.value;

    this.svc.liste(p).subscribe({
      next: r => { this.actes.set(r.results); this.total.set(r.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent) { this.page = e.pageIndex; this.pageSize = e.pageSize; this.charger(); }

  iconeNature(nature: string): string {
    return { NAISSANCE: 'child_care', MARIAGE: 'favorite', DECES: 'sentiment_very_dissatisfied' }[nature] ?? 'description';
  }
}
