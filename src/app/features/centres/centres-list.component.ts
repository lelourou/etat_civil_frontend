import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-centres-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page-header">
      <h2>Centres</h2>
    </div>
    <p>Module Centres — implémentation en cours</p>
  `,
})
export class CentresListComponent implements OnInit {
  ngOnInit() {}
}
