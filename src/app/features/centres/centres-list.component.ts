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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { CentresService, Centre } from '../../core/services/centres.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-centres-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatPaginatorModule, MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h2>Centres d'état civil</h2>
      @if (isAdmin()) {
        <button mat-raised-button color="primary" routerLink="nouveau">
          <mat-icon>add</mat-icon> Nouveau centre
        </button>
      }
    </div>

    <!-- Filtres -->
    <div class="filters-row">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Rechercher (nom, code...)</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="search">
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:200px">
        <mat-label>Type</mat-label>
        <mat-select [formControl]="filtreType">
          <mat-option value="">Tous les types</mat-option>
          <mat-option value="SOUS_PREFECTURE">Sous-Préfecture</mat-option>
          <mat-option value="MAIRIE">Mairie</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:160px">
        <mat-label>Statut</mat-label>
        <mat-select [formControl]="filtreActif">
          <mat-option value="">Tous</mat-option>
          <mat-option value="true">Actifs</mat-option>
          <mat-option value="false">Fermés</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <mat-table [dataSource]="centres()" class="mat-elevation-z2">

        <ng-container matColumnDef="code">
          <mat-header-cell *matHeaderCellDef>Code</mat-header-cell>
          <mat-cell *matCellDef="let c"><code>{{ c.code }}</code></mat-cell>
        </ng-container>

        <ng-container matColumnDef="nom">
          <mat-header-cell *matHeaderCellDef>Nom du centre</mat-header-cell>
          <mat-cell *matCellDef="let c">
            <strong>{{ c.nom }}</strong>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="type">
          <mat-header-cell *matHeaderCellDef>Type</mat-header-cell>
          <mat-cell *matCellDef="let c">
            <span [class]="'badge-type badge-' + c.type.toLowerCase()">
              <mat-icon>{{ iconeType(c.type) }}</mat-icon>
              {{ c.type_display }}
            </span>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="localite">
          <mat-header-cell *matHeaderCellDef>Localité</mat-header-cell>
          <mat-cell *matCellDef="let c">{{ c.localite_nom }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="nb_agents">
          <mat-header-cell *matHeaderCellDef style="justify-content:center">Agents</mat-header-cell>
          <mat-cell *matCellDef="let c" style="justify-content:center">
            <span class="badge-count">{{ c.nb_agents }}</span>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="actif">
          <mat-header-cell *matHeaderCellDef style="justify-content:center">Statut</mat-header-cell>
          <mat-cell *matCellDef="let c" style="justify-content:center">
            @if (c.actif) {
              <span class="badge-actif">Actif</span>
            } @else {
              <span class="badge-ferme">Fermé</span>
            }
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef></mat-header-cell>
          <mat-cell *matCellDef="let c">
            <button mat-icon-button color="primary" [routerLink]="[c.id]"
                    matTooltip="Voir le centre">
              <mat-icon>visibility</mat-icon>
            </button>
            @if (isAdmin()) {
              <button mat-icon-button color="accent" [routerLink]="[c.id, 'modifier']"
                      matTooltip="Modifier">
                <mat-icon>edit</mat-icon>
              </button>
            }
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="colonnes"></mat-header-row>
        <mat-row *matRowDef="let row; columns: colonnes;"
                 [class.row-ferme]="!row.actif"></mat-row>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell no-data" colspan="7">Aucun centre trouvé.</td>
        </tr>
      </mat-table>

      <mat-paginator [length]="total()" [pageSize]="pageSize"
                     [pageSizeOptions]="[10, 20, 50]"
                     (page)="onPage($event)">
      </mat-paginator>
    }
  `,
  styles: [`
    .filters-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; }
    .search-field { flex:1; min-width:250px; }
    .center { display:flex; justify-content:center; padding:40px; }
    .no-data { padding:24px; text-align:center; color:#999; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:11px; }
    mat-cell, mat-header-cell { padding:0 8px !important; }

    .badge-type { display:flex; align-items:center; gap:4px; font-size:12px;
                  padding:3px 8px; border-radius:12px; width:fit-content; }
    .badge-type mat-icon { font-size:15px; width:15px; height:15px; }
    .badge-sous_prefecture { background:#e3f2fd; color:#1565c0; }
    .badge-mairie          { background:#f3e5f5; color:#6a1b9a; }

    .badge-count { background:#e8f5e9; color:#2e7d32; border-radius:12px;
                   padding:2px 10px; font-size:12px; font-weight:600; }
    .badge-actif { background:#e8f5e9; color:#2e7d32; border-radius:10px;
                   padding:2px 10px; font-size:12px; }
    .badge-ferme { background:#fce4ec; color:#c62828; border-radius:10px;
                   padding:2px 10px; font-size:12px; }
    .row-ferme { opacity:0.6; }
  `],
})
export class CentresListComponent implements OnInit {
  colonnes    = ['code', 'nom', 'type', 'localite', 'nb_agents', 'actif', 'actions'];
  centres     = signal<Centre[]>([]);
  total       = signal(0);
  loading     = signal(false);
  pageSize    = 20;
  page        = 0;
  search      = new FormControl('');
  filtreType  = new FormControl('');
  filtreActif = new FormControl('');

  constructor(private svc: CentresService, private auth: AuthService) {}

  ngOnInit() {
    this.charger();
    this.search.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.page = 0; this.charger(); });
    this.filtreType.valueChanges.subscribe(() => { this.page = 0; this.charger(); });
    this.filtreActif.valueChanges.subscribe(() => { this.page = 0; this.charger(); });
  }

  charger() {
    this.loading.set(true);
    const p: Record<string, string> = {
      page: String(this.page + 1),
      page_size: String(this.pageSize),
    };
    if (this.search.value)      p['search'] = this.search.value;
    if (this.filtreType.value)  p['type']   = this.filtreType.value;
    if (this.filtreActif.value) p['actif']  = this.filtreActif.value;

    this.svc.liste(p).subscribe({
      next: r => { this.centres.set(r.results); this.total.set(r.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent) { this.page = e.pageIndex; this.pageSize = e.pageSize; this.charger(); }

  isAdmin(): boolean { return this.auth.role === 'ADMIN_SYSTEME'; }

  iconeType(type: string): string {
    return type === 'MAIRIE' ? 'location_city' : 'account_balance';
  }
}
