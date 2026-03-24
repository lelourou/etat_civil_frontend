import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page-header">
      <h2>Notifications</h2>
    </div>
    <p>Module Notifications — implémentation en cours</p>
  `,
})
export class NotificationsListComponent implements OnInit {
  ngOnInit() {}
}
