import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService, Project } from '../../../core/services/project.service';
import { ThreeViewerComponent } from '../../../shared/components/three-viewer/three-viewer.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule, ThreeViewerComponent
  ],
  template: `
    <div class="min-h-screen bg-dark-bg text-dark-text p-8">
      <div class="max-w-6xl mx-auto">
        @if (loading()) {
          <div class="flex justify-center py-20"><mat-spinner/></div>
        } @else if (project()) {
          <!-- Header -->
          <div class="flex items-center gap-4 mb-8">
            <button mat-icon-button routerLink="/dashboard">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="flex-1">
              <h1 class="text-2xl font-bold">{{ project()!.name }}</h1>
              <div class="flex items-center gap-3 mt-1">
                <span [class]="statusClass()" class="text-xs px-2 py-0.5 rounded-full">
                  {{ project()!.status }}
                </span>
                <span class="text-slate-500 text-sm">{{ project()!.createdAt | date:'medium' }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 3D Viewer -->
            <app-three-viewer [projectId]="project()!.id" class="block h-96 rounded-2xl overflow-hidden"/>

            <!-- Files -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-semibold mb-4">Generated Files</h2>
              <div class="space-y-3">
                @for (file of project()!.files; track file.id) {
                  <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div class="flex items-center gap-3">
                      <mat-icon class="text-blue-400">description</mat-icon>
                      <div>
                        <p class="text-sm font-medium">{{ file.fileName }}</p>
                        <p class="text-xs text-slate-500">{{ file.fileType }} · {{ formatSize(file.fileSize) }}</p>
                      </div>
                    </div>
                    <button mat-icon-button (click)="download(file.id)" matTooltip="Download">
                      <mat-icon>download</mat-icon>
                    </button>
                  </div>
                }
                @if (!project()!.files?.length) {
                  <p class="text-slate-500 text-sm text-center py-4">No files yet</p>
                }
              </div>
            </div>

            <!-- Prompt -->
            <div class="glass-card rounded-2xl p-6 lg:col-span-2">
              <h2 class="font-semibold mb-3">Original Input</h2>
              <p class="text-slate-300 text-sm leading-relaxed">{{ project()!.prompt }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: ['.glass-card { background: rgba(26,26,46,0.8); border: 1px solid rgba(255,255,255,0.08); }']
})
export class ProjectDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly projectService = inject(ProjectService);

  project = signal<Project | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.projectService.getProject(this.id).subscribe({
      next: res => { this.project.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusClass(): string {
    const s = this.project()?.status;
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-500/20 text-green-400',
      FAILED: 'bg-red-500/20 text-red-400',
      PENDING: 'bg-yellow-500/20 text-yellow-400',
    };
    return map[s || ''] || 'bg-slate-500/20 text-slate-400';
  }

  download(fileId: string): void {
    this.projectService.downloadFile(this.id, fileId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileId;
      a.click(); URL.revokeObjectURL(url);
    });
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
