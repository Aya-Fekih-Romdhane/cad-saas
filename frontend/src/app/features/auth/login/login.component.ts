import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-page min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <!-- Background -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <div class="glass-card rounded-2xl p-8 w-full max-w-md relative z-10 animate-slide-up">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <mat-icon class="text-blue-400 text-3xl">view_in_ar</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-white">Welcome back</h1>
          <p class="text-slate-400 text-sm mt-1">Sign in to your CAD SaaS account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email"/>
            <mat-icon matPrefix class="text-slate-400">mail</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'"
                   formControlName="password" autocomplete="current-password"/>
            <mat-icon matPrefix class="text-slate-400">lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="togglePassword()">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
          </mat-form-field>

          <div class="flex justify-end">
            <a routerLink="/auth/reset-password" class="text-sm text-blue-400 hover:text-blue-300">
              Forgot password?
            </a>
          </div>

          <button mat-raised-button color="primary" type="submit"
                  class="w-full h-12" [disabled]="form.invalid || auth.loading()">
            @if (auth.loading()) {
              <mat-spinner diameter="20" class="mx-auto"/>
            } @else {
              Sign In
            }
          </button>
        </form>

        <p class="text-center text-slate-400 text-sm mt-6">
          Don't have an account?
          <a routerLink="/auth/register" class="text-blue-400 hover:text-blue-300 ml-1">Sign up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(26, 26, 46, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.08);
    }
  `]
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe();
  }
}
