import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';

interface Agent {
  id: string;
  nom: string;
  prenoms: string;
  email: string;
  matricule: string;
  role: string;
  role_display: string;
  centre_nom: string;
  is_active: boolean;
}

@Component({
  selector: 'app-utilisateurs-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule,
            MatIconModule, MatTableModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page-header">
      <h2>Gestion des agents</h2>
      <button mat-raised-button color="primary" routerLink="nouveau">
        <mat-icon>person_add</mat-icon> Créer un agent
      </button>
    </div>

    <mat-card>
      <table mat-table [dataSource]="agents()" class="full-width">
        <ng-container matColumnDef="matricule">
          <th mat-header-cell *matHeaderCellDef>Matricule</th>
          <td mat-cell *matCellDef="let a">{{ a.matricule }}</td>
        </ng-container>
        <ng-container matColumnDef="nom">
          <th mat-header-cell *matHeaderCellDef>Nom complet</th>
          <td mat-cell *matCellDef="let a">{{ a.nom }} {{ a.prenoms }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let a">{{ a.email }}</td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Rôle</th>
          <td mat-cell *matCellDef="let a">
            <mat-chip [color]="a.role === 'ADMIN_CENTRAL' ? 'warn' : 'primary'" highlighted>
              {{ a.role_display }}
            </mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="centre">
          <th mat-header-cell *matHeaderCellDef>Centre</th>
          <td mat-cell *matCellDef="let a">{{ a.centre_nom || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="statut">
          <th mat-header-cell *matHeaderCellDef>Statut</th>
          <td mat-cell *matCellDef="let a">
            <mat-chip [color]="a.is_active ? 'primary' : 'warn'" highlighted>
              {{ a.is_active ? 'Actif' : 'Inactif' }}
            </mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let a">
            <button mat-icon-button [routerLink]="[a.id, 'modifier']" matTooltip="Modifier">
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
        <tr mat-row *matRowDef="let row; columns: colonnes;"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { margin: 0; }
    .full-width { width: 100%; }
  `],
})
export class UtilisateursListComponent implements OnInit {
  agents  = signal<Agent[]>([]);
  colonnes = ['matricule', 'nom', 'email', 'role', 'centre', 'statut', 'actions'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ results: Agent[] }>(`${environment.apiUrl}/auth/agents/`)
      .subscribe(r => this.agents.set(r.results));
  }
}
