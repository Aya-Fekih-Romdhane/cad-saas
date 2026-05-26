import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-dark-bg text-dark-text p-8">
      <h1 class="text-2xl font-bold mb-6">Settings</h1>
      <div class="glass-card rounded-xl p-6 max-w-2xl">
        <h2 class="text-lg font-semibold mb-4">Account</h2>
        <div class="space-y-3 text-slate-300">
          <p><span class="text-slate-500">Email:</span> {{ auth.user()?.email }}</p>
          <p><span class="text-slate-500">Name:</span> {{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</p>
          <p><span class="text-slate-500">Role:</span> {{ auth.user()?.role }}</p>
        </div>
        <button mat-stroked-button color="warn" class="mt-6" (click)="auth.logout()">
          <mat-icon>logout</mat-icon> Sign Out
        </button>
      </div>
    </div>
  `,
  styles: ['.glass-card { background: rgba(26,26,46,0.8); border: 1px solid rgba(255,255,255,0.08); }']
})
export class SettingsComponent {
  readonly auth = inject(AuthService);
}
