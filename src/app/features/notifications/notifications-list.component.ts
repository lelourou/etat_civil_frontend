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
      <h2><mat-icon>notifications_active</mat-icon> Notifications inter-centres</h2>
      <span class="pending-count" *ngIf="pendingCount() > 0">
        {{ pendingCount() }} en attente d'acquittement
      </span>
    </div>

    <p class="info-text">
      Ces notifications vous informent des mariages ou décès enregistrés dans d'autres centres
      pour des individus dont l'acte de naissance a été établi dans votre centre.
      Acquittez chaque notification pour confirmer la mise à jour.
    </p>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <mat-table [dataSource]="notifications()" class="mat-elevation-z2">

        <ng-container matColumnDef="type">
          <mat-header-cell *matHeaderCellDef>Événement</mat-header-cell>
          <mat-cell *matCellDef="let n">
            <span class="type-chip" [class.mariage]="n.type_evenement.includes('MARIAGE')"
                                    [class.deces]="n.type_evenement.includes('DECES')">
              <mat-icon>{{ n.type_evenement.includes('MARIAGE') ? 'favorite' : 'sentiment_very_dissatisfied' }}</mat-icon>
              {{ n.type_evenement.includes('MARIAGE') ? 'Mariage' : 'Décès' }}
            </span>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="individu">
          <mat-header-cell *matHeaderCellDef>Individu concerné</mat-header-cell>
          <mat-cell *matCellDef="let n">
            <strong>{{ n.payload?.individu_nom }}</strong>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="acte">
          <mat-header-cell *matHeaderCellDef>Acte enregistré</mat-header-cell>
          <mat-cell *matCellDef="let n">
            <code>{{ n.acte_numero }}</code>
            <small class="date-acte">{{ n.payload?.date_evenement | date:'dd/MM/yyyy' }}</small>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="emetteur">
          <mat-header-cell *matHeaderCellDef>Centre émetteur</mat-header-cell>
          <mat-cell *matCellDef="let n">{{ n.centre_emetteur_nom }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="statut">
          <mat-header-cell *matHeaderCellDef>Statut</mat-header-cell>
          <mat-cell *matCellDef="let n">
            <app-statut-badge [statut]="n.statut.toLowerCase()" [label]="n.statut_display"></app-statut-badge>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="date">
          <mat-header-cell *matHeaderCellDef>Reçue le</mat-header-cell>
          <mat-cell *matCellDef="let n">{{ n.created_at | date:'dd/MM/yyyy HH:mm' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef></mat-header-cell>
          <mat-cell *matCellDef="let n">
            @if (n.statut === 'EN_ATTENTE' || n.statut === 'ENVOYEE') {
              <button mat-raised-button color="primary" (click)="acquitter(n)"
                      matTooltip="Confirmer la prise en compte">
                <mat-icon>check_circle</mat-icon> Acquitter
              </button>
            } @else {
              <mat-icon style="color:#4caf50" matTooltip="Acquittée">check_circle</mat-icon>
            }
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="colonnes"></mat-header-row>
        <mat-row *matRowDef="let row; columns: colonnes;"
                 [class.row-pending]="row.statut === 'ENVOYEE'"></mat-row>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell no-data" colspan="7">Aucune notification inter-centre.</td>
        </tr>
      </mat-table>

      <mat-paginator [length]="total()" [pageSize]="20"
                     [pageSizeOptions]="[10,20,50]" (page)="onPage($event)">
      </mat-paginator>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .page-header h2 { display:flex; align-items:center; gap:8px; margin:0; }
    .pending-count { background:#ff5722; color:white; font-size:12px; font-weight:600;
                     padding:4px 12px; border-radius:12px; }
    .info-text { color:#666; font-size:13px; margin-bottom:16px; }
    .center { display:flex; justify-content:center; padding:40px; }
    .no-data { padding:24px; text-align:center; color:#999; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:11px; display:block; }
    .date-acte { color:#888; font-size:11px; display:block; }
    mat-cell, mat-header-cell { padding:0 8px !important; }
    .type-chip { display:inline-flex; align-items:center; gap:4px; font-weight:500;
                 padding:2px 8px; border-radius:12px; font-size:12px; }
    .type-chip.mariage { background:#fce4ec; color:#c2185b; }
    .type-chip.deces { background:#f3e5f5; color:#6a1b9a; }
    .type-chip mat-icon { font-size:14px; width:14px; height:14px; }
    .row-pending { background:#fff8e1; }
  `],
})
export class NotificationsListComponent implements OnInit {
  colonnes      = ['type','individu','acte','emetteur','statut','date','actions'];
  notifications = signal<Notification[]>([]);
  total         = signal(0);
  loading       = signal(false);
  page          = 0;
  pendingCount  = this.svc.pendingCount;

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
      next: () => {
        this.snack.open('Notification acquittée.', 'OK', { duration: 3000 });
        this.charger();
        // Rafraîchir le badge dans la nav
        this.svc.countPending().subscribe(r => this.svc.pendingCount.set(r.count));
      },
      error: () => this.snack.open('Erreur lors de l\'acquittement.', 'Fermer', { duration: 3000 }),
    });
  }

  onPage(e: PageEvent) { this.page = e.pageIndex; this.charger(); }
}
