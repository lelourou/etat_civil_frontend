import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.models';

export interface Centre { id: string; code: string; nom: string; type: string; type_display: string; localite: string; localite_nom: string; actif: boolean; }

@Injectable({ providedIn: 'root' })
export class CentresService {
  private readonly url = `${environment.apiUrl}/centres`;

  constructor(private http: HttpClient) {}

  liste()  { return this.http.get<PaginatedResponse<Centre>>(this.url + '/'); }
  detail(id: string) { return this.http.get<Centre>(`${this.url}/${id}/`); }
  villagescourants(id: string) { return this.http.get<unknown[]>(`${this.url}/${id}/villages_courants/`); }
}
