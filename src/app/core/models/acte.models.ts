export type NatureActe = 'NAISSANCE' | 'MARIAGE' | 'DECES';
export type StatutActe = 'BROUILLON' | 'VALIDE' | 'VERROUILLE' | 'ANNULE';

export interface Acte {
  id: string;
  numero_national: string;
  nature: NatureActe;
  nature_display: string;
  statut: StatutActe;
  statut_display: string;
  individu: string;
  individu_nom: string;
  centre: string;
  centre_nom: string;
  village: string | null;
  date_evenement: string;
  date_enregistrement: string;
  agent: string;
  agent_nom: string;
  superviseur: string | null;
  date_validation: string | null;
  observations: string;
  mentions: MentionMarginale[];
  detail_naissance?: ActeNaissance;
  detail_mariage?: ActeMariage;
  detail_deces?: ActeDeces;
}

export interface MentionMarginale {
  id: string;
  acte: string;
  type_mention: string;
  type_mention_display: string;
  acte_source_ref: string;
  centre_source: string | null;
  date_mention: string;
  contenu: string;
  agent: string;
  agent_nom: string;
}

export interface ActeNaissance {
  heure_naissance: string | null;
  ordre_naissance: number;
  poids_naissance: number | null;
  etablissement: string;
  declarant_nom: string;
  declarant_prenoms: string;
  declarant_lien: string;
  declarant_cin: string;
}

export interface ActeMariage {
  epoux: string;
  epoux_nom: string;
  epouse: string;
  epouse_nom: string;
  regime_matrimonial: string;
  temoin1_nom: string;
  temoin2_nom: string;
  officiant_nom: string;
}

export interface ActeDeces {
  heure_deces: string | null;
  lieu_deces: string;
  cause_deces: string;
  declarant_nom: string;
  declarant_prenoms: string;
  declarant_lien: string;
}
