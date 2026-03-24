import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Acte, MentionMarginale } from '../models/acte.models';
import { PaginatedResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ActesService {
  private readonly url = `${environment.apiUrl}/actes`;

  constructor(private http: HttpClient) {}

  liste(params?: Record<string, string>) {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => httpParams = httpParams.set(k, v));
    return this.http.get<PaginatedResponse<Acte>>(this.url + '/', { params: httpParams });
  }

  detail(id: string) {
    return this.http.get<Acte>(`${this.url}/${id}/`);
  }

  creer(data: Partial<Acte>) {
    return this.http.post<Acte>(this.url + '/', data);
  }

  modifier(id: string, data: Partial<Acte>) {
    return this.http.patch<Acte>(`${this.url}/${id}/`, data);
  }

  valider(id: string) {
    return this.http.post<Acte>(`${this.url}/${id}/valider/`, {});
  }

  ajouterMention(id: string, data: Partial<MentionMarginale>) {
    return this.http.post<MentionMarginale>(`${this.url}/${id}/ajouter_mention/`, data);
  }

  mentions(id: string) {
    return this.http.get<MentionMarginale[]>(`${this.url}/${id}/mentions/`);
  }
}
