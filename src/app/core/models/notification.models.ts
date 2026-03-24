export type StatutNotification = 'EN_ATTENTE' | 'ENVOYEE' | 'ACQUITTEE' | 'ECHOUEE';

export interface Notification {
  id: string;
  acte_declencheur: string;
  acte_numero: string;
  centre_emetteur: string;
  centre_emetteur_nom: string;
  centre_destinataire: string;
  centre_destinataire_nom: string;
  acte_cible: string | null;
  type_evenement: string;
  payload: Record<string, unknown>;
  statut: StatutNotification;
  statut_display: string;
  tentatives: number;
  date_envoi: string | null;
  date_acquittement: string | null;
  created_at: string;
}
