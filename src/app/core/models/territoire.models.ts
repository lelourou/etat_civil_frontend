export interface Region {
  id: string;
  code: string;
  nom: string;
  created_at: string;
}

export interface Departement {
  id: string;
  code: string;
  nom: string;
  region: string;
  region_nom: string;
}

export interface Localite {
  id: string;
  code: string;
  nom: string;
  departement: string;
  departement_nom: string;
  region_nom: string;
}

export interface Village {
  id: string;
  code: string;
  nom: string;
  localite: string;
  localite_nom: string;
}
