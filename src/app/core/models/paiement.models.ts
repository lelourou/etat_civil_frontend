export type MoyenPaiement = 'MTN_MONEY' | 'ORANGE_MONEY' | 'WAVE' | 'ESPECES' | 'VIREMENT';
export type StatutDemande = 'EN_ATTENTE_PAIEMENT' | 'PAYEE' | 'EN_COURS' | 'DELIVREE' | 'REJETEE';
export type TypeCopie = 'COPIE_INTEGRALE' | 'EXTRAIT_AVEC_FILIATION' | 'EXTRAIT_SANS_FILIATION' | 'BULLETIN';

export interface DemandeCopie {
  id: string;
  reference: string;
  acte: string;
  acte_numero: string;
  demandeur_nom: string;
  demandeur_cin: string;
  demandeur_lien: string;
  type_copie: TypeCopie;
  type_copie_display: string;
  canal: 'GUICHET' | 'EN_LIGNE';
  canal_display: string;
  statut: StatutDemande;
  statut_display: string;
  centre: string;
  date_demande: string;
  date_livraison: string | null;
  paiement?: Paiement;
}

export interface Paiement {
  id: string;
  montant: number;
  devise: string;
  moyen: MoyenPaiement;
  moyen_display: string;
  statut: string;
  statut_display: string;
  reference_externe: string;
  date_paiement: string | null;
  recu_numero: string | null;
}
