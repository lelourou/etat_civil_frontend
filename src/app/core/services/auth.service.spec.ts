import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

// Génère un JWT factice avec le payload souhaité
function makeJwt(payload: object): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

const MOCK_PAYLOAD = {
  user_id: 'uuid-agent-1',
  nom_complet: 'KONAN Kouame',
  role: 'AGENT_GUICHET',
  centre_id: 'uuid-centre-1',
  centre_code: 'CTR01',
  exp: 9999999999,
};

const MOCK_ACCESS  = makeJwt(MOCK_PAYLOAD);
const MOCK_REFRESH = makeJwt({ token_type: 'refresh', exp: 9999999999 });

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const API = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Nettoyer le localStorage avant chaque test
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── isLoggedIn ─────────────────────────────────────────────────────────────

  it('isLoggedIn est false si aucun token en localStorage', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isLoggedIn est true si un token est présent en localStorage', () => {
    localStorage.setItem('access_token', MOCK_ACCESS);
    // Recréer le service pour qu'il lise le localStorage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });
    const svc = TestBed.inject(AuthService);
    // flush la requête /me/ déclenchée par le constructeur
    const req = TestBed.inject(HttpTestingController).expectOne(`${API}/me/`);
    req.flush({ id: '1', email: 'agent@test.ci', nom: 'KONAN', prenoms: 'Kouame',
                nom_complet: 'KONAN Kouame', matricule: 'AGT-001', telephone: '',
                role: 'AGENT_GUICHET', role_display: 'Agent de guichet',
                centre: 'uuid-c1', centre_nom: 'Centre A', is_active: true, created_at: '' });
    expect(svc.isLoggedIn()).toBeTrue();
  });

  // ── getPayload ──────────────────────────────────────────────────────────────

  it('getPayload retourne null si non connecté', () => {
    expect(service.getPayload()).toBeNull();
  });

  it('getPayload décode correctement le JWT', () => {
    localStorage.setItem('access_token', MOCK_ACCESS);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });
    const svc = TestBed.inject(AuthService);
    TestBed.inject(HttpTestingController)
      .expectOne(`${API}/me/`)
      .flush({ id: '1', email: 'a@b.ci', nom: 'A', prenoms: 'B', nom_complet: 'A B',
               matricule: 'M1', telephone: '', role: 'AGENT_GUICHET', role_display: '',
               centre: 'c1', centre_nom: 'C1', is_active: true, created_at: '' });

    const payload = svc.getPayload();
    expect(payload).not.toBeNull();
    expect(payload!.role).toBe('AGENT_GUICHET');
    expect(payload!.centre_id).toBe('uuid-centre-1');
  });

  // ── role & centreId ─────────────────────────────────────────────────────────

  it('role retourne une chaîne vide si non connecté', () => {
    expect(service.role).toBe('');
  });

  it('centreId retourne null si non connecté', () => {
    expect(service.centreId).toBeNull();
  });

  // ── login ───────────────────────────────────────────────────────────────────

  it('login stocke les tokens et met à jour le signal', fakeAsync(() => {
    service.login({ email: 'agent@test.ci', password: 'Test@2024ci' }).subscribe();

    const loginReq = httpMock.expectOne(`${API}/login/`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ access: MOCK_ACCESS, refresh: MOCK_REFRESH });

    // flush /me/ déclenché par login
    const meReq = httpMock.expectOne(`${API}/me/`);
    meReq.flush({ id: '1', email: 'agent@test.ci', nom: 'KONAN', prenoms: 'Kouame',
                  nom_complet: 'KONAN Kouame', matricule: 'AGT-001', telephone: '',
                  role: 'AGENT_GUICHET', role_display: 'Agent de guichet',
                  centre: 'c1', centre_nom: 'Centre A', is_active: true, created_at: '' });
    tick();

    expect(localStorage.getItem('access_token')).toBe(MOCK_ACCESS);
    expect(localStorage.getItem('refresh_token')).toBe(MOCK_REFRESH);
    expect(service.isLoggedIn()).toBeTrue();
  }));

  it('login envoie les credentials en JSON', () => {
    service.login({ email: 'agent@test.ci', password: 'secret' }).subscribe();
    const req = httpMock.expectOne(`${API}/login/`);
    expect(req.request.body).toEqual({ email: 'agent@test.ci', password: 'secret' });
    req.flush({ access: MOCK_ACCESS, refresh: MOCK_REFRESH });
    httpMock.expectOne(`${API}/me/`).flush({});
  });

  // ── logout ──────────────────────────────────────────────────────────────────

  it('logout supprime les tokens et redirige vers /auth/login', () => {
    localStorage.setItem('access_token',  MOCK_ACCESS);
    localStorage.setItem('refresh_token', MOCK_REFRESH);

    service.logout();

    // flush la requête POST /logout/
    const req = httpMock.expectOne(`${API}/logout/`);
    req.flush({ detail: 'Déconnexion réussie.' });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  // ── refreshToken ─────────────────────────────────────────────────────────────

  it('refreshToken met à jour le token d\'accès', fakeAsync(() => {
    localStorage.setItem('refresh_token', MOCK_REFRESH);
    const newAccess = makeJwt({ ...MOCK_PAYLOAD, exp: 9999999998 });

    service.refreshToken().subscribe();
    const req = httpMock.expectOne(`${API}/token/refresh/`);
    expect(req.request.method).toBe('POST');
    req.flush({ access: newAccess, refresh: MOCK_REFRESH });
    tick();

    expect(localStorage.getItem('access_token')).toBe(newAccess);
  }));

  // ── isSuperviseurNational ───────────────────────────────────────────────────

  it('isSuperviseurNational est false pour AGENT_GUICHET', () => {
    expect(service.isSuperviseurNational()).toBeFalse();
  });
});
