import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { signal } from '@angular/core';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="auth-page min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div class="glass-card rounded-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <mat-icon class="text-blue-400 text-5xl block mb-4">lock_reset</mat-icon>
          <h1 class="text-2xl font-bold text-white">Reset Password</h1>
          <p class="text-slate-400 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>
        @if (sent()) {
          <div class="text-center py-4">
            <mat-icon class="text-green-400 text-5xl block mb-3">mark_email_read</mat-icon>
            <p class="text-white">Check your inbox!</p>
            <p class="text-slate-400 text-sm mt-1">We've sent a password reset link to your email.</p>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email"/>
            </mat-form-field>
            <button mat-raised-button color="primary" class="w-full h-12" type="submit" [disabled]="form.invalid">
              Send Reset Link
            </button>
          </form>
        }
        <p class="text-center text-slate-400 text-sm mt-4">
          <a routerLink="/auth/login" class="text-blue-400">Back to login</a>
        </p>
      </div>
    </div>
  `,
  styles: ['.glass-card { background: rgba(26,26,46,0.9); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }']
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  sent = signal(false);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  onSubmit(): void { this.sent.set(true); }
}
