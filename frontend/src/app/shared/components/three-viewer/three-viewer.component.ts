import {
  Component, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-three-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="viewer-container relative w-full h-full bg-gray-950 rounded-xl overflow-hidden">

      <!-- Canvas -->
      <canvas #canvas class="w-full h-full block"></canvas>

      <!-- Controls overlay -->
      <div class="absolute top-3 right-3 flex gap-1">
        <button mat-mini-fab class="viewer-btn" matTooltip="Wireframe" (click)="toggleWireframe()">
          <mat-icon>grid_on</mat-icon>
        </button>
        <button mat-mini-fab class="viewer-btn" matTooltip="Reset view" (click)="resetCamera()">
          <mat-icon>center_focus_strong</mat-icon>
        </button>
        <button mat-mini-fab class="viewer-btn" matTooltip="Toggle lights" (click)="toggleLights()">
          <mat-icon>light_mode</mat-icon>
        </button>
      </div>

      <!-- Loading overlay -->
      @if (loading()) {
        <div class="absolute inset-0 flex items-center justify-center bg-black/60">
          <div class="text-center">
            <div class="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-white text-sm">Loading 3D model...</p>
          </div>
        </div>
      }

      <!-- Error state -->
      @if (error()) {
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center text-slate-500">
            <mat-icon class="text-4xl mb-2 block">broken_image</mat-icon>
            <p class="text-sm">Preview unavailable</p>
          </div>
        </div>
      }

      <!-- Zoom hint -->
      <div class="absolute bottom-3 left-3 text-xs text-slate-500">
        Drag to rotate · Scroll to zoom · Right-click to pan
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .viewer-btn { background: rgba(0,0,0,0.6) !important; width: 32px !important; height: 32px !important; }
  `]
})
export class ThreeViewerComponent implements AfterViewInit, OnDestroy {
  @Input() projectId!: string;
  @Input() stlUrl?: string;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly projectService = inject(ProjectService);

  loading = signal(true);
  error = signal(false);
  wireframeMode = signal(false);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private mesh?: THREE.Mesh;
  private animationId?: number;
  private ambientLight!: THREE.AmbientLight;
  private dirLight1!: THREE.DirectionalLight;
  private lights = signal(true);

  ngAfterViewInit(): void {
    this.initThree();
    this.loadModel();
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
    this.camera.position.set(200, 150, 200);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.dirLight1 = new THREE.DirectionalLight(0x4488ff, 1.2);
    this.dirLight1.position.set(1, 2, 1);
    this.dirLight1.castShadow = true;
    this.scene.add(this.dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffeedd, 0.8);
    dirLight2.position.set(-1, 0.5, -1);
    this.scene.add(dirLight2);

    // Grid
    const grid = new THREE.GridHelper(400, 20, 0x333344, 0x222233);
    this.scene.add(grid);

    // Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Animate
    this.animate();

    // Resize observer
    new ResizeObserver(() => this.onResize()).observe(canvas);
  }

  private loadModel(): void {
    const url = this.stlUrl || this.projectService.getStlUrl(this.projectId);
    if (!url) { this.error.set(true); this.loading.set(false); return; }

    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhysicalMaterial({
          color: 0x6699cc,
          metalness: 0.6,
          roughness: 0.3,
          envMapIntensity: 0.8,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Center model
        const box = new THREE.Box3().setFromObject(this.mesh);
        const center = box.getCenter(new THREE.Vector3());
        this.mesh.position.sub(center);

        this.scene.add(this.mesh);
        this.fitCamera(box);
        this.loading.set(false);
      },
      undefined,
      () => { this.error.set(true); this.loading.set(false); }
    );
  }

  private fitCamera(box: THREE.Box3): void {
    const size = box.getSize(new THREE.Vector3()).length();
    this.camera.position.set(size, size * 0.8, size);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  toggleWireframe(): void {
    this.wireframeMode.update(v => !v);
    if (this.mesh) {
      (this.mesh.material as THREE.MeshPhysicalMaterial).wireframe = this.wireframeMode();
    }
  }

  resetCamera(): void {
    this.controls.reset();
  }

  toggleLights(): void {
    this.lights.update(v => !v);
    this.ambientLight.intensity = this.lights() ? 0.4 : 1.0;
    this.dirLight1.visible = this.lights();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.renderer?.dispose();
    this.controls?.dispose();
  }
}
