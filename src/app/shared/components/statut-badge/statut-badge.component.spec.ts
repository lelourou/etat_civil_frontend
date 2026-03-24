import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatutBadgeComponent } from './statut-badge.component';

describe('StatutBadgeComponent', () => {
  let component: StatutBadgeComponent;
  let fixture:   ComponentFixture<StatutBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatutBadgeComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(StatutBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── cssClass ────────────────────────────────────────────────────────────────

  it('cssClass retourne le statut en minuscules', () => {
    component.statut = 'VALIDE';
    expect(component.cssClass).toBe('valide');
  });

  it('cssClass retourne "default" si statut est vide', () => {
    component.statut = '';
    expect(component.cssClass).toBe('default');
  });

  it('cssClass gère les statuts avec underscore', () => {
    component.statut = 'EN_ATTENTE';
    expect(component.cssClass).toBe('en_attente');
  });

  const statuts: Array<{ statut: string; cssExpected: string }> = [
    { statut: 'BROUILLON',  cssExpected: 'brouillon'  },
    { statut: 'VALIDE',     cssExpected: 'valide'     },
    { statut: 'VERROUILLE', cssExpected: 'verrouille' },
    { statut: 'ANNULE',     cssExpected: 'annule'     },
    { statut: 'CONFIRME',   cssExpected: 'confirme'   },
    { statut: 'ECHOUE',     cssExpected: 'echoue'     },
    { statut: 'ACQUITTEE',  cssExpected: 'acquittee'  },
    { statut: 'ENVOYEE',    cssExpected: 'envoyee'    },
  ];

  statuts.forEach(({ statut, cssExpected }) => {
    it(`cssClass est "${cssExpected}" pour le statut "${statut}"`, () => {
      component.statut = statut;
      expect(component.cssClass).toBe(cssExpected);
    });
  });

  // ── Template ────────────────────────────────────────────────────────────────

  it('affiche le label dans le template', () => {
    component.label  = 'Validé';
    component.statut = 'valide';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.textContent.trim()).toBe('Validé');
  });

  it('applique la classe CSS au span', () => {
    component.statut = 'brouillon';
    component.label  = 'Brouillon';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.classList).toContain('brouillon');
  });

  it('applique la classe "default" pour un statut inconnu', () => {
    component.statut = '';
    component.label  = '—';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.classList).toContain('default');
  });
});
