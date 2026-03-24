import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaiementsService } from '../../core/services/paiements.service';
import { DemandeCopie } from '../../core/models/paiement.models';
import { StatutBadgeComponent } from '../../shared/components/statut-badge/statut-badge.component';

@Component({
  selector: 'app-paiements-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatPaginatorModule, MatSnackBarModule, StatutBadgeComponent,
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>payment</mat-icon> Demandes de copies & Paiements</h2>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <mat-table [dataSource]="demandes()" class="mat-elevation-z2">
        <ng-container matColumnDef="reference">
          <mat-header-cell *matHeaderCellDef>Référence</mat-header-cell>
          <mat-cell *matCellDef="let d"><code>{{ d.reference }}</code></mat-cell>
        </ng-container>
        <ng-container matColumnDef="acte">
          <mat-header-cell *matHeaderCellDef>Acte</mat-header-cell>
          <mat-cell *matCellDef="let d">
            <a [routerLink]="['/actes', d.acte]">{{ d.acte_numero }}</a>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="demandeur">
          <mat-header-cell *matHeaderCellDef>Demandeur</mat-header-cell>
          <mat-cell *matCellDef="let d">{{ d.demandeur_nom }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="type_copie">
          <mat-header-cell *matHeaderCellDef>Type</mat-header-cell>
          <mat-cell *matCellDef="let d">{{ d.type_copie_display }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="montant">
          <mat-header-cell *matHeaderCellDef>Montant</mat-header-cell>
          <mat-cell *matCellDef="let d">
            <strong>{{ d.paiement?.montant || 500 }} FCFA</strong>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="statut">
          <mat-header-cell *matHeaderCellDef>Statut</mat-header-cell>
          <mat-cell *matCellDef="let d">
            <app-statut-badge [statut]="d.statut.toLowerCase()" [label]="d.statut_display"></app-statut-badge>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="date">
          <mat-header-cell *matHeaderCellDef>Date</mat-header-cell>
          <mat-cell *matCellDef="let d">{{ d.date_demande | date:'dd/MM/yyyy HH:mm' }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef></mat-header-cell>
          <mat-cell *matCellDef="let d">
            @if (d.statut === 'EN_ATTENTE_PAIEMENT') {
              <button mat-stroked-button color="primary" (click)="confirmerPaiement(d)">
                <mat-icon>payment</mat-icon> Payer
              </button>
            }
          </mat-cell>
        </ng-container>
        <mat-header-row *matHeaderRowDef="colonnes"></mat-header-row>
        <mat-row *matRowDef="let row; columns: colonnes;"></mat-row>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell no-data" colspan="8">Aucune demande.</td>
        </tr>
      </mat-table>
      <mat-paginator [length]="total()" [pageSize]="20"
                     [pageSizeOptions]="[10,20,50]" (page)="onPage($event)">
      </mat-paginator>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:center; gap:8px; margin-bottom:24px; }
    .page-header h2 { display:flex; align-items:center; gap:8px; margin:0; }
    .center { display:flex; justify-content:center; padding:40px; }
    .no-data { padding:24px; text-align:center; color:#999; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:11px; }
    mat-cell, mat-header-cell { padding:0 8px !important; }
  `],
})
export class PaiementsListComponent implements OnInit {
  colonnes = ['reference','acte','demandeur','type_copie','montant','statut','date','actions'];
  demandes = signal<DemandeCopie[]>([]);
  total    = signal(0);
  loading  = signal(false);
  page     = 0;

  constructor(private svc: PaiementsService, private snack: MatSnackBar) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading.set(true);
    this.svc.liste({ page: String(this.page + 1) }).subscribe({
      next: r => { this.demandes.set(r.results); this.total.set(r.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirmerPaiement(d: DemandeCopie) {
    this.svc.confirmerPaiement(d.id, 'ESPECES').subscribe({
      next: () => { this.snack.open('Paiement confirmé.', 'OK', { duration: 3000 }); this.charger(); },
      error: () => this.snack.open('Erreur lors du paiement.', 'Fermer', { duration: 3000 }),
    });
  }

  onPage(e: PageEvent) { this.page = e.pageIndex; this.charger(); }
}
