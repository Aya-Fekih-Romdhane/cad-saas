import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatChipsModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard min-h-screen bg-dark-bg text-dark-text">

      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 h-screen w-64 bg-dark-card border-r border-dark-border flex flex-col z-10">
        <div class="p-6 border-b border-dark-border">
          <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            CAD SaaS
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">AI-Powered CAD Generation</p>
        </div>

        <nav class="flex-1 p-4 space-y-1">
          @for (item of navItems; track item.label) {
            <a [routerLink]="item.route" routerLinkActive="bg-blue-500/20 text-blue-400"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300
                      hover:bg-white/5 transition-colors duration-150">
              <mat-icon class="text-sm">{{ item.icon }}</mat-icon>
              <span class="text-sm">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="p-4 border-t border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ auth.user()?.firstName }}</p>
              <p class="text-xs text-slate-500 truncate">{{ auth.user()?.email }}</p>
            </div>
            <button mat-icon-button (click)="auth.logout()" matTooltip="Logout">
              <mat-icon class="text-slate-400">logout</mat-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="ml-64 p-8">

        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-4 mb-8">
          @for (stat of stats(); track stat.label) {
            <div class="glass-card rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-slate-400 text-sm">{{ stat.label }}</p>
                <mat-icon [style.color]="stat.color" class="text-lg">{{ stat.icon }}</mat-icon>
              </div>
              <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
            </div>
          }
        </div>

        <!-- Actions Bar -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold">My Projects</h2>
          <button mat-raised-button color="primary" routerLink="/generate">
            <mat-icon>add</mat-icon>
            New Generation
          </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-4 mb-6">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)"
                   placeholder="Search projects..."/>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-40">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="loadProjects()">
              <mat-option value="">All</mat-option>
              <mat-option value="COMPLETED">Completed</mat-option>
              <mat-option value="PENDING">Pending</mat-option>
              <mat-option value="FAILED">Failed</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-40">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (ngModelChange)="loadProjects()">
              <mat-option value="">All</mat-option>
              <mat-option value="TEXT">Text</mat-option>
              <mat-option value="IMAGE">Image</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Projects Grid -->
        @if (loading()) {
          <div class="flex justify-center py-20">
            <mat-spinner diameter="40"/>
          </div>
        } @else if (projects().length === 0) {
          <div class="glass-card rounded-2xl p-16 text-center">
            <mat-icon class="text-6xl text-slate-600 mb-4 block">view_in_ar</mat-icon>
            <p class="text-slate-400 text-lg">No projects yet</p>
            <p class="text-slate-500 text-sm mt-1 mb-4">Create your first CAD generation</p>
            <button mat-raised-button color="primary" routerLink="/generate">
              Get Started
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (project of projects(); track project.id) {
              <div class="glass-card rounded-xl overflow-hidden hover:border-blue-500/30
                          transition-all duration-200 cursor-pointer group"
                   [routerLink]="['/projects', project.id]">

                <!-- Thumbnail -->
                <div class="h-36 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
                  @if (project.thumbnailPath) {
                    <img [src]="project.thumbnailPath" class="w-full h-full object-cover" alt=""/>
                  } @else {
                    <div class="absolute inset-0 flex items-center justify-center">
                      <mat-icon class="text-6xl text-slate-700 group-hover:text-slate-600 transition-colors">
                        view_in_ar
                      </mat-icon>
                    </div>
                  }
                  <div class="absolute top-2 right-2">
                    <span [class]="getStatusClass(project.status)"
                          class="text-xs px-2 py-0.5 rounded-full font-medium">
                      {{ project.status }}
                    </span>
                  </div>
                </div>

                <!-- Info -->
                <div class="p-4">
                  <h3 class="font-semibold truncate">{{ project.name }}</h3>
                  <p class="text-slate-400 text-xs mt-1 line-clamp-2">{{ project.prompt }}</p>
                  <div class="flex items-center justify-between mt-3">
                    <span class="text-xs text-slate-500">{{ project.createdAt | date:'MMM d, y' }}</span>
                    <div class="flex gap-1">
                      <span [matTooltip]="project.inputType">
                        <mat-icon class="text-sm text-slate-500">
                          {{ project.inputType === 'IMAGE' ? 'image' : 'text_fields' }}
                        </mat-icon>
                      </span>
                      @if (project.files?.length) {
                        <span class="text-xs text-blue-400">{{ project.files.length }} files</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(26, 26, 46, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.06);
    }
    :host { display: block; }
  `]
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly search$ = new Subject<string>();

  projects = signal<Project[]>([]);
  loading = signal(true);
  stats = signal<any[]>([]);

  searchQuery = '';
  statusFilter = '';
  typeFilter = '';

  userInitial = computed(() => {
    const u = this.auth.user();
    return u ? u.firstName.charAt(0).toUpperCase() : '?';
  });

  navItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'auto_awesome', label: 'Generate', route: '/generate' },
    { icon: 'folder', label: 'Projects', route: '/dashboard' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(() => this.loadProjects());
  }

  ngOnInit(): void {
    this.loadProjects();
    this.loadStats();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getProjects({
      search: this.searchQuery || undefined,
      status: this.statusFilter || undefined,
      inputType: this.typeFilter || undefined,
    }).subscribe({
      next: res => {
        this.projects.set(res.data.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadStats(): void {
    this.stats.set([
      { label: 'Total Projects', icon: 'folder', value: 0, color: '#60a5fa' },
      { label: 'Completed', icon: 'check_circle', value: 0, color: '#34d399' },
      { label: 'Processing', icon: 'autorenew', value: 0, color: '#fbbf24' },
      { label: 'This Month', icon: 'calendar_month', value: 0, color: '#a78bfa' },
    ]);
  }

  onSearch(query: string): void {
    this.search$.next(query);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-500/20 text-green-400',
      FAILED: 'bg-red-500/20 text-red-400',
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      ANALYZING: 'bg-blue-500/20 text-blue-400',
      GENERATING: 'bg-purple-500/20 text-purple-400',
    };
    return map[status] || 'bg-slate-500/20 text-slate-400';
  }
}
