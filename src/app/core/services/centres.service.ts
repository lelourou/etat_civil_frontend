import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.models';

export interface Centre {
  id: string;
  code: string;
  nom: string;
  type: string;
  type_display: string;
  localite: string;
  localite_nom: string;
  adresse: string;
  telephone: string;
  email: string;
  actif: boolean;
  date_creation: string;
  date_fermeture?: string;
  nb_agents: number;
}

export interface AgentCentre {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  nom_complet: string;
  email: string;
  telephone: string;
  role: string;
  role_display: string;
  is_active: boolean;
}

export interface VillageCourant {
  id: string;
  village: string;
  village_nom: string;
  centre: string;
  centre_nom: string;
  date_debut: string;
  date_fin?: string;
  est_courant: boolean;
  motif: string;
  decret_ref: string;
}

export interface Localite {
  id: string;
  code: string;
  nom: string;
}

@Injectable({ providedIn: 'root' })
export class CentresService {
  private readonly url      = `${environment.apiUrl}/centres`;
  private readonly urlTerr  = `${environment.apiUrl}/territoire`;

  constructor(private http: HttpClient) {}

  liste(params: Record<string, string> = {}) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return this.http.get<PaginatedResponse<Centre>>(this.url + '/', { params: p });
  }

  detail(id: string) {
    return this.http.get<Centre>(`${this.url}/${id}/`);
  }

  creer(data: Partial<Centre>) {
    return this.http.post<Centre>(this.url + '/', data);
  }

  modifier(id: string, data: Partial<Centre>) {
    return this.http.patch<Centre>(`${this.url}/${id}/`, data);
  }

  supprimer(id: string) {
    return this.http.delete(`${this.url}/${id}/`);
  }

  agents(id: string) {
    return this.http.get<AgentCentre[]>(`${this.url}/${id}/agents/`);
  }

  villagescourants(id: string) {
    return this.http.get<VillageCourant[]>(`${this.url}/${id}/villages_courants/`);
  }

  localites() {
    return this.http.get<PaginatedResponse<Localite>>(
      `${this.urlTerr}/localites/?page_size=100`
    );
  }
}
