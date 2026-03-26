export interface Agent {
  id: string;
  email: string;
  nom: string;
  prenoms: string;
  nom_complet: string;
  matricule: string;
  telephone: string;
  role: AgentRole;
  role_display: string;
  centre: string;
  centre_nom: string;
  is_active: boolean;
  created_at: string;
}

export type AgentRole =
  | 'ADMIN_CENTRAL'
  | 'AGENT_CENTRE';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface JwtPayload {
  user_id: string;
  nom_complet: string;
  role: AgentRole;
  centre_id: string | null;
  centre_code: string | null;
  exp: number;
}
