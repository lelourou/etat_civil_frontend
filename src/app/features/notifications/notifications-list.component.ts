import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification } from '../../core/models/notification.models';
import { StatutBadgeComponent } from '../../shared/components/statut-badge/statut-badge.component';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatPaginatorModule,
    MatTooltipModule, StatutBadgeComponent,
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>notifications</mat-icon> Notifications inter-centres</h2>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <mat-table [dataSource]="notifications()" class="mat-elevation-z2">

        <ng-container matColumnDef="type">
          <mat-header-cell *matHeaderCellDef>Type</mat-header-cell>
          <mat-cell *matCellDef="let n">{{ n.type_evenement }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="acte">
          <mat-header-cell *matHeaderCellDef>Acte déclencheur</mat-header-cell>
          <mat-cell *matCellDef="let n"><code>{{ n.acte_numero }}</code></mat-cell>
        </ng-container>

        <ng-container matColumnDef="emetteur">
          <mat-header-cell *matHeaderCellDef>Centre émetteur</mat-header-cell>
          <mat-cell *matCellDef="let n">{{ n.centre_emetteur_nom }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="destinataire">
          <mat-header-cell *matHeaderCellDef>Centre destinataire</mat-header-cell>
          <mat-cell *matCellDef="let n">{{ n.centre_destinataire_nom }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="statut">
          <mat-header-cell *matHeaderCellDef>Statut</mat-header-cell>
          <mat-cell *matCellDef="let n">
            <app-statut-badge [statut]="n.statut.toLowerCase()" [label]="n.statut_display"></app-statut-badge>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="date">
          <mat-header-cell *matHeaderCellDef>Date</mat-header-cell>
          <mat-cell *matCellDef="let n">{{ n.created_at | date:'dd/MM/yyyy HH:mm' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef></mat-header-cell>
          <mat-cell *matCellDef="let n">
            @if (n.statut === 'EN_ATTENTE' || n.statut === 'ENVOYEE') {
              <button mat-stroked-button color="primary" (click)="acquitter(n)"
                      matTooltip="Acquitter la notification">
                <mat-icon>check</mat-icon> Acquitter
              </button>
            }
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="colonnes"></mat-header-row>
        <mat-row *matRowDef="let row; columns: colonnes;"></mat-row>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell no-data" colspan="7">Aucune notification.</td>
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
export class NotificationsListComponent implements OnInit {
  colonnes      = ['type','acte','emetteur','destinataire','statut','date','actions'];
  notifications = signal<Notification[]>([]);
  total         = signal(0);
  loading       = signal(false);
  page          = 0;

  constructor(private svc: NotificationsService, private snack: MatSnackBar) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.loading.set(true);
    this.svc.liste({ page: String(this.page + 1) }).subscribe({
      next: r => { this.notifications.set(r.results); this.total.set(r.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  acquitter(n: Notification) {
    this.svc.acquitter(n.id).subscribe({
      next: () => { this.snack.open('Notification acquittée.', 'OK', { duration: 3000 }); this.charger(); },
      error: () => this.snack.open('Erreur lors de l\'acquittement.', 'Fermer', { duration: 3000 }),
    });
  }

  onPage(e: PageEvent) { this.page = e.pageIndex; this.charger(); }
}
