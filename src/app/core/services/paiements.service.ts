import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DemandeCopie, Paiement } from '../models/paiement.models';
import { PaginatedResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PaiementsService {
  private readonly url = `${environment.apiUrl}/paiements`;

  constructor(private http: HttpClient) {}

  liste(params?: Record<string, string>) {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => httpParams = httpParams.set(k, v));
    return this.http.get<PaginatedResponse<DemandeCopie>>(this.url + '/', { params: httpParams });
  }

  creerDemande(data: Partial<DemandeCopie>) {
    return this.http.post<DemandeCopie>(this.url + '/', data);
  }

  confirmerPaiement(id: string, moyen: string, reference_externe?: string) {
    return this.http.post<Paiement>(`${this.url}/${id}/confirmer_paiement/`, {
      moyen, reference_externe: reference_externe ?? ''
    });
  }
}
