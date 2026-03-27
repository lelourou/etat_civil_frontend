import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.models';
import { PaginatedResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly url = `${environment.apiUrl}/notifications`;

  /** Signal partagé — mis à jour par le layout et la liste des notifs */
  readonly pendingCount = signal(0);

  constructor(private http: HttpClient) {}

  liste(params?: Record<string, string>) {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => httpParams = httpParams.set(k, v));
    return this.http.get<PaginatedResponse<Notification>>(this.url + '/', { params: httpParams });
  }

  acquitter(id: string) {
    return this.http.post<Notification>(`${this.url}/${id}/acquitter/`, {});
  }

  /** Retourne le nombre de notifications non acquittées pour le centre connecté */
  countPending() {
    return this.http.get<PaginatedResponse<Notification>>(
      this.url + '/', { params: new HttpParams().set('statut', 'ENVOYEE').set('page_size', '1') }
    );
  }
}
