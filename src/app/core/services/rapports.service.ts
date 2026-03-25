import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SyntheseKPI {
  total_actes: number;
  actes_naissance: number;
  actes_mariage: number;
  actes_deces: number;
  actes_valides: number;
  actes_brouillon: number;
  total_individus: number;
  individus_deces: number;
  total_recettes: number;
  nb_paiements: number;
  total_notifications: number;
  notifs_attente: number;
}

export interface EvolutionMensuelle {
  mois: string;
  nature: string;
  count: number;
}

export interface ActesParNature {
  nature: string;
  count: number;
}

export interface ActesParCentre {
  centre__nom: string;
  centre__type: string;
  count: number;
}

export interface RecettesCentre {
  centre_nom: string;
  centre_type: string;
  total: number;
  nb_paiements: number;
}

export interface PaiementsCanal {
  par_canal: { canal: string; count: number }[];
  par_moyen: { moyen: string; count: number; total: number }[];
}

@Injectable({ providedIn: 'root' })
export class RapportsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/v1/rapports`;

  synthese(): Observable<SyntheseKPI> {
    return this.http.get<SyntheseKPI>(`${this.base}/synthese/`);
  }

  evolutionMensuelle(): Observable<EvolutionMensuelle[]> {
    return this.http.get<EvolutionMensuelle[]>(`${this.base}/evolution-mensuelle/`);
  }

  actesParNature(): Observable<ActesParNature[]> {
    return this.http.get<ActesParNature[]>(`${this.base}/par-nature/`);
  }

  actesParCentre(): Observable<ActesParCentre[]> {
    return this.http.get<ActesParCentre[]>(`${this.base}/par-centre/`);
  }

  recettesParCentre(): Observable<RecettesCentre[]> {
    return this.http.get<RecettesCentre[]>(`${this.base}/recettes/`);
  }

  paiementsParCanal(): Observable<PaiementsCanal> {
    return this.http.get<PaiementsCanal>(`${this.base}/paiements-canal/`);
  }
}
