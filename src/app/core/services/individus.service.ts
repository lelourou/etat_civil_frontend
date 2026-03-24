import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Individu, DoublonResponse } from '../models/individu.models';
import { Acte } from '../models/acte.models';
import { PaginatedResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class IndividusService {
  private readonly url = `${environment.apiUrl}/individus`;

  constructor(private http: HttpClient) {}

  liste(params?: Record<string, string>) {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => httpParams = httpParams.set(k, v));
    return this.http.get<PaginatedResponse<Individu>>(this.url + '/', { params: httpParams });
  }

  detail(id: string) {
    return this.http.get<Individu>(`${this.url}/${id}/`);
  }

  creer(data: Partial<Individu>) {
    return this.http.post<Individu>(this.url + '/', data);
  }

  actes(id: string) {
    return this.http.get<Acte[]>(`${this.url}/${id}/actes/`);
  }

  verifierDoublon(data: { nom: string; prenoms: string; date_naissance: string; lieu_naissance_libelle?: string }) {
    return this.http.post<DoublonResponse>(`${this.url}/verifier_doublon/`, data);
  }
}
