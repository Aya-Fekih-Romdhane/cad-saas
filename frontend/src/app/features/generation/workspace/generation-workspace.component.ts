import {
  Component, signal, inject, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { GenerationService } from '../../../core/services/generation.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ThreeViewerComponent } from '../../../shared/components/three-viewer/three-viewer.component';

interface ProgressEvent {
  projectId: string;
  percentage: number;
  message: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

@Component({
  selector: 'app-generation-workspace',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatTabsModule, MatButtonModule, MatProgressBarModule,
    MatIconModule, MatCardModule, MatInputModule, MatFormFieldModule,
    MatChipsModule, MatTooltipModule,
    ThreeViewerComponent
  ],
  template: `
    <div class="workspace-container min-h-screen bg-dark-bg text-dark-text">

      <!-- Top Navigation Bar -->
      <nav class="sticky top-0 z-10 bg-dark-card border-b border-dark-border px-6 py-3 flex items-center gap-4">
        <button mat-icon-button (click)="goBack()" matTooltip="Back to Dashboard">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="h-5 w-px bg-dark-border"></div>
        <span class="text-sm font-medium text-slate-300">
          <a routerLink="/dashboard" class="text-slate-500 hover:text-slate-300 transition-colors">Dashboard</a>
          <mat-icon class="text-slate-600 text-sm mx-1 align-middle">chevron_right</mat-icon>
          New Generation
        </span>
        <div class="flex-1"></div>
        <span class="text-xs text-slate-600">CAD SaaS</span>
      </nav>

      <div class="p-6">
      <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            CAD Generator
          </h1>
          <p class="text-slate-400 mt-1">Transform ideas into SolidWorks-compatible 3D models</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Input Panel -->
          <div class="glass-card rounded-2xl p-6 animate-slide-up">
            <mat-tab-group class="cad-tabs" animationDuration="200ms">

              <!-- Text Input Tab -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2">text_fields</mat-icon>
                  Text Description
                </ng-template>
                <div class="pt-4">
                  <form [formGroup]="textForm" (ngSubmit)="generateFromText()">
                    <mat-form-field appearance="outline" class="w-full mb-3">
                      <mat-label>Project Name</mat-label>
                      <input matInput formControlName="name" placeholder="My CAD Part"/>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Part Description</mat-label>
                      <textarea
                        matInput
                        formControlName="description"
                        rows="8"
                        placeholder="Describe your mechanical part...
Example: Create a circular steel flange with 150mm diameter, 6 M10 holes on a 120mm pitch circle, 20mm thick with a 60mm central bore."
                        class="resize-none">
                      </textarea>
                      <mat-hint>{{ textForm.get('description')?.value?.length || 0 }} / 2000</mat-hint>
                      <mat-error *ngIf="textForm.get('description')?.hasError('required')">
                        Description is required
                      </mat-error>
                      <mat-error *ngIf="textForm.get('description')?.hasError('minlength')">
                        Description must be at least 10 characters
                      </mat-error>
                    </mat-form-field>

                    <!-- Example Prompts -->
                    <div class="mt-3">
                      <p class="text-xs text-slate-400 mb-2">Quick examples:</p>
                      <mat-chip-set class="flex flex-wrap gap-2">
                        @for (example of examplePrompts; track example.label) {
                          <mat-chip
                            class="cursor-pointer text-xs"
                            (click)="useExample(example.prompt)">
                            {{ example.label }}
                          </mat-chip>
                        }
                      </mat-chip-set>
                    </div>

                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      class="w-full mt-4 h-12"
                      [disabled]="textForm.invalid || isGenerating()">
                      <ng-container>
                        @if (isGenerating()) {
                          <mat-icon class="animate-spin mr-2">autorenew</mat-icon>
                          Generating...
                        } @else {
                          <mat-icon class="mr-2">auto_awesome</mat-icon>
                          Generate CAD Model
                        }
                      </ng-container>
                    </button>
                  </form>
                </div>
              </mat-tab>

              <!-- Image Upload Tab -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="mr-2">image</mat-icon>
                  Image Upload
                </ng-template>
                <div class="pt-4">
                  <!-- Dropzone -->
                  <div
                    class="dropzone border-2 border-dashed border-blue-500/40 rounded-xl p-8
                           text-center cursor-pointer hover:border-blue-400 transition-all duration-300
                           hover:bg-blue-500/5"
                    [class.active]="isDragOver()"
                    (click)="fileInput.click()"
                    (dragover)="onDragOver($event)"
                    (dragleave)="isDragOver.set(false)"
                    (drop)="onFileDrop($event)">

                    @if (selectedFile()) {
                      <div class="flex items-center justify-center gap-3">
                        <mat-icon class="text-green-400 text-4xl">check_circle</mat-icon>
                        <div class="text-left">
                          <p class="text-white font-medium">{{ selectedFile()!.name }}</p>
                          <p class="text-slate-400 text-sm">{{ formatFileSize(selectedFile()!.size) }}</p>
                        </div>
                      </div>
                    } @else {
                      <mat-icon class="text-blue-400 text-5xl mb-3 block">cloud_upload</mat-icon>
                      <p class="text-white font-medium">Drop image here or click to browse</p>
                      <p class="text-slate-400 text-sm mt-1">Supports: JPG, PNG, PDF, SVG (max 50MB)</p>
                      <p class="text-blue-400 text-xs mt-2">Technical drawings, blueprints, sketches, photos</p>
                    }

                    <input
                      #fileInput
                      type="file"
                      hidden
                      accept="image/*,.pdf,.svg"
                      (change)="onFileSelected($event)"/>
                  </div>

                  @if (imagePreviewUrl()) {
                    <div class="mt-4 rounded-xl overflow-hidden border border-dark-border">
                      <img [src]="imagePreviewUrl()" alt="Preview" class="w-full max-h-48 object-contain bg-black"/>
                    </div>
                  }

                  <mat-form-field appearance="outline" class="w-full mt-4">
                    <mat-label>Additional Context (optional)</mat-label>
                    <input matInput [(ngModel)]="imageContext" placeholder="e.g., This is a top view, scale is 1:2"/>
                  </mat-form-field>

                  <button
                    mat-raised-button
                    color="primary"
                    class="w-full h-12 mt-2"
                    [disabled]="!selectedFile() || isGenerating()"
                    (click)="generateFromImage()">
                    <ng-container>
                      @if (isGenerating()) {
                        <mat-icon class="animate-spin mr-2">autorenew</mat-icon>
                        Analyzing & Generating...
                      } @else {
                        <mat-icon class="mr-2">3d_rotation</mat-icon>
                        Analyze & Generate
                      }
                    </ng-container>
                  </button>
                </div>
              </mat-tab>

            </mat-tab-group>
          </div>

          <!-- Output Panel -->
          <div class="space-y-4">

            <!-- Progress Card -->
            @if (isGenerating() || generationComplete()) {
              <div class="glass-card rounded-2xl p-6 animate-slide-up">
                <h3 class="font-semibold mb-3 flex items-center gap-2">
                  <mat-icon [class]="generationComplete() ? 'text-green-400' : 'text-blue-400'">
                    {{ generationComplete() ? 'check_circle' : 'engineering' }}
                  </mat-icon>
                  Generation Pipeline
                </h3>

                <mat-progress-bar
                  [mode]="isGenerating() ? 'determinate' : 'determinate'"
                  [value]="progress()"
                  [color]="generationFailed() ? 'warn' : 'primary'"
                  class="rounded-full mb-3">
                </mat-progress-bar>

                <div class="flex justify-between items-center">
                  <span class="text-sm text-slate-300">{{ progressMessage() }}</span>
                  <span class="text-sm font-bold" [class]="generationFailed() ? 'text-red-400' : 'text-blue-400'">
                    {{ progress() }}%
                  </span>
                </div>

                <!-- Pipeline Steps -->
                <div class="mt-4 space-y-2">
                  @for (step of pipelineSteps; track step.label) {
                    <div class="flex items-center gap-3 text-sm"
                         [class.opacity-40]="step.threshold > progress()">
                      <mat-icon [class]="getStepClass(step.threshold)">
                        {{ step.threshold <= progress() ? 'check_circle' : 'radio_button_unchecked' }}
                      </mat-icon>
                      <span>{{ step.label }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- 3D Viewer -->
            @if (generationComplete() && projectId()) {
              <div class="glass-card rounded-2xl overflow-hidden animate-slide-up">
                <div class="p-4 border-b border-dark-border flex items-center justify-between">
                  <h3 class="font-semibold">3D Preview</h3>
                  <div class="flex gap-2">
                    <button mat-icon-button matTooltip="Download STEP">
                      <mat-icon>download</mat-icon>
                    </button>
                    <button mat-icon-button [routerLink]="['/projects', projectId()]">
                      <mat-icon>open_in_new</mat-icon>
                    </button>
                  </div>
                </div>
                <app-three-viewer [projectId]="projectId()!" class="block h-80"/>
              </div>
            }

            <!-- Placeholder -->
            @if (!isGenerating() && !generationComplete()) {
              <div class="glass-card rounded-2xl p-12 text-center animate-fade-in">
                <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <mat-icon class="text-blue-400 text-5xl">view_in_ar</mat-icon>
                </div>
                <p class="text-slate-400">Your 3D model will appear here</p>
                <p class="text-slate-500 text-sm mt-1">Supports STL, STEP, OBJ preview</p>
              </div>
            }

          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(26, 26, 46, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .dropzone.active { background: rgba(59, 130, 246, 0.1); }
    :host { display: block; }
  `]
})
export class GenerationWorkspaceComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly generationService = inject(GenerationService);
  private readonly wsService = inject(WebSocketService);
  private readonly router = inject(Router);

  textForm = this.fb.group({
    name: [''],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]]
  });

  isGenerating = signal(false);
  generationComplete = signal(false);
  generationFailed = signal(false);
  progress = signal(0);
  progressMessage = signal('');
  projectId = signal<string | null>(null);
  isDragOver = signal(false);
  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  imageContext = '';

  pipelineSteps = [
    { label: 'Input validation', threshold: 5 },
    { label: 'Claude AI analysis', threshold: 30 },
    { label: 'CAD parameter extraction', threshold: 40 },
    { label: '3D model generation', threshold: 70 },
    { label: 'Multi-format export', threshold: 90 },
    { label: 'Preview generation', threshold: 100 },
  ];

  examplePrompts = [
    { label: 'Flange', prompt: 'Create a circular steel flange, 150mm diameter, 6 M10 holes on 120mm PCD, 20mm thick, 60mm central bore.' },
    { label: 'Bracket', prompt: 'L-shaped aluminum mounting bracket, 100x80mm, 10mm thick, 4 mounting holes 8mm diameter.' },
    { label: 'Shaft', prompt: 'Steel shaft 200mm long, 30mm diameter, with keyway 8x4mm along 60mm length.' },
    { label: 'Plate', prompt: 'Rectangular steel plate 300x200x15mm with chamfered corners R5 and 8 holes M8.' },
  ];

  private wsSub?: Subscription;

  generateFromText(): void {
    if (this.textForm.invalid) return;
    this.startGeneration();

    const { name, description } = this.textForm.value;
    this.generationService.generateFromText({ name: name!, description: description! }).subscribe({
      next: res => this.handleGenerationStart(res.data.projectId),
      error: () => this.onGenerationFailed('Failed to start generation')
    });
  }

  generateFromImage(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.startGeneration();

    this.generationService.generateFromImage(file, this.imageContext).subscribe({
      next: res => this.handleGenerationStart(res.data.projectId),
      error: () => this.onGenerationFailed('Failed to analyze image')
    });
  }

  private startGeneration(): void {
    this.isGenerating.set(true);
    this.generationComplete.set(false);
    this.generationFailed.set(false);
    this.progress.set(5);
    this.progressMessage.set('Starting generation pipeline...');
  }

  private handleGenerationStart(projectId: string): void {
    this.projectId.set(projectId);
    this.subscribeToProgress(projectId);
  }

  private subscribeToProgress(projectId: string): void {
    this.wsSub = this.wsService.subscribeToProject(projectId).subscribe({
      next: (event: ProgressEvent) => {
        this.progress.set(event.percentage);
        this.progressMessage.set(event.message);

        if (event.status === 'COMPLETED') {
          this.isGenerating.set(false);
          this.generationComplete.set(true);
        } else if (event.status === 'FAILED') {
          this.onGenerationFailed(event.message);
        }
      }
    });
  }

  private onGenerationFailed(message: string): void {
    this.isGenerating.set(false);
    this.generationFailed.set(true);
    this.progressMessage.set(message);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processFile(input.files[0]);
  }

  private processFile(file: File): void {
    this.selectedFile.set(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => this.imagePreviewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  useExample(prompt: string): void {
    this.textForm.patchValue({ description: prompt });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getStepClass(threshold: number): string {
    if (threshold <= this.progress()) return 'text-green-400';
    return 'text-slate-600';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }
}
