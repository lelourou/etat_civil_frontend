import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-statut-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="cssClass">{{ label }}</span>`,
  styles: [`
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .brouillon  { background:#fff3e0; color:#e65100; }
    .valide     { background:#e8f5e9; color:#2e7d32; }
    .verrouille { background:#fce4ec; color:#c62828; }
    .annule     { background:#f5f5f5; color:#757575; }
    .en_attente { background:#fff8e1; color:#f57f17; }
    .confirme   { background:#e8f5e9; color:#2e7d32; }
    .echoue     { background:#fce4ec; color:#c62828; }
    .acquittee  { background:#e8f5e9; color:#2e7d32; }
    .envoyee    { background:#e3f2fd; color:#1565c0; }
    .default    { background:#f5f5f5; color:#424242; }
  `],
})
export class StatutBadgeComponent {
  @Input() statut = '';
  @Input() label  = '';
  get cssClass() { return this.statut.toLowerCase() || 'default'; }
}
