export interface Individu {
  id: string;
  nin: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  sexe_display: string;
  date_naissance: string;
  lieu_naissance_village: string | null;
  lieu_naissance_village_nom: string;
  lieu_naissance_libelle: string;
  nationalite: string;
  centre_naissance: string | null;
  centre_naissance_nom: string;
  hash_biographique: string;
  est_decede: boolean;
  date_deces: string | null;
  filiations: Filiation[];
  created_at: string;
}

export interface Filiation {
  id: string;
  enfant: string;
  parent: string | null;
  role: 'PERE' | 'MERE';
  role_display: string;
  nom_libelle: string;
  prenoms_libelle: string;
  parent_nom_complet: string;
}

export interface DoublonResponse {
  doublon: boolean;
  nin?: string;
  individu?: Individu;
}
