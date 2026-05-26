import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Project {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  inputType: 'TEXT' | 'IMAGE';
  status: 'PENDING' | 'ANALYZING' | 'GENERATING' | 'EXPORTING' | 'COMPLETED' | 'FAILED';
  thumbnailPath?: string;
  files: GeneratedFile[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  isPrimary: boolean;
}

export interface ProjectsPage {
  content: Project[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/projects`;

  getProjects(params?: {
    page?: number; size?: number; status?: string;
    inputType?: string; search?: string;
  }): Observable<{ data: ProjectsPage }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<{ data: ProjectsPage }>(this.api, { params: httpParams });
  }

  getProject(id: string): Observable<{ data: Project }> {
    return this.http.get<{ data: Project }>(`${this.api}/${id}`);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  downloadFile(projectId: string, fileId: string): Observable<Blob> {
    return this.http.get(`${this.api}/${projectId}/files/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  getStlUrl(projectId: string): string {
    return `${environment.apiUrl}/projects/${projectId}/files/stl/download`;
  }
}
