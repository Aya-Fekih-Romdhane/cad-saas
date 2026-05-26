import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="landing min-h-screen bg-dark-bg text-white overflow-hidden">

      <!-- Animated background -->
      <div class="fixed inset-0 pointer-events-none">
        <div class="absolute top-20 left-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl animate-pulse-slow"></div>
        <div class="absolute bottom-20 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" style="animation-delay:1.5s"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <!-- Nav -->
      <nav class="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div class="flex items-center gap-2">
          <mat-icon class="text-blue-400 text-3xl">view_in_ar</mat-icon>
          <span class="text-xl font-bold">CAD SaaS</span>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/auth/login" mat-button class="text-slate-300">Sign In</a>
          <a routerLink="/auth/register" mat-raised-button color="primary">Get Started</a>
        </div>
      </nav>

      <!-- Hero -->
      <section class="relative z-10 text-center py-32 px-4 animate-fade-in">
        <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30
                    rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
          <mat-icon class="text-sm">auto_awesome</mat-icon>
          Powered by Claude AI & OpenCascade
        </div>

        <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Text to
          <span class="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            SolidWorks
          </span>
          <br>in seconds
        </h1>

        <p class="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Describe any mechanical part or upload a sketch.
          Our AI generates production-ready CAD files compatible with SolidWorks, STEP, STL and more.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/auth/register" mat-raised-button color="primary"
             class="h-14 px-8 text-lg">
            <mat-icon>rocket_launch</mat-icon>
            Start for Free
          </a>
          <a routerLink="/auth/login" mat-stroked-button class="h-14 px-8 text-lg text-slate-300">
            <mat-icon>play_circle</mat-icon>
            See Demo
          </a>
        </div>
      </section>

      <!-- Features -->
      <section class="relative z-10 py-24 px-4">
        <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (feature of features; track feature.title) {
            <div class="glass-card rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                   [style.background]="feature.bgColor">
                <mat-icon [style.color]="feature.color">{{ feature.icon }}</mat-icon>
              </div>
              <h3 class="text-lg font-semibold mb-2">{{ feature.title }}</h3>
              <p class="text-slate-400 text-sm leading-relaxed">{{ feature.description }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Pipeline -->
      <section class="relative z-10 py-24 px-4 text-center">
        <h2 class="text-3xl font-bold mb-16">How it works</h2>
        <div class="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
          @for (step of pipeline; track step.label; let last = $last) {
            <div class="glass-card rounded-xl p-5 flex-1 text-center">
              <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <span class="text-blue-400 font-bold">{{ $index + 1 }}</span>
              </div>
              <mat-icon class="text-slate-400 mb-2 block">{{ step.icon }}</mat-icon>
              <p class="text-sm font-medium">{{ step.label }}</p>
            </div>
            @if (!last) {
              <mat-icon class="text-slate-600 hidden md:block">arrow_forward</mat-icon>
            }
          }
        </div>
      </section>

      <!-- CTA -->
      <section class="relative z-10 py-24 px-4 text-center">
        <div class="glass-card rounded-3xl p-16 max-w-2xl mx-auto">
          <h2 class="text-3xl font-bold mb-4">Ready to generate?</h2>
          <p class="text-slate-400 mb-8">Join engineers using AI-powered CAD generation</p>
          <a routerLink="/auth/register" mat-raised-button color="primary" class="h-14 px-10 text-lg">
            Get Started Free
          </a>
        </div>
      </section>
    </div>
  `,
  styles: ['.glass-card { background: rgba(26,26,46,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.07); }']
})
export class LandingComponent {
  features = [
    {
      icon: 'text_fields', title: 'Text to CAD', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.1)',
      description: 'Describe any mechanical part in natural language. Claude AI extracts dimensions, geometry, and constraints to build precise models.'
    },
    {
      icon: 'image_search', title: 'Image to CAD', color: '#34d399', bgColor: 'rgba(52,211,153,0.1)',
      description: 'Upload photos, blueprints, or sketches. Vision AI detects contours, estimates dimensions, and reconstructs 3D geometry.'
    },
    {
      icon: 'download', title: 'Multi-format Export', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.1)',
      description: 'Export to SLDPRT, STEP, STL, IGES, and OBJ. Full SolidWorks compatibility with parametric features preserved.'
    },
  ];

  pipeline = [
    { icon: 'edit', label: 'Describe / Upload' },
    { icon: 'psychology', label: 'AI Analysis' },
    { icon: 'data_object', label: 'CAD JSON' },
    { icon: 'view_in_ar', label: '3D Generation' },
    { icon: 'cloud_download', label: 'Download Files' },
  ];
}
