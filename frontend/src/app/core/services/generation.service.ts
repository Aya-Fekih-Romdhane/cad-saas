import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GenerationRequest { name?: string; description: string; }

@Injectable({ providedIn: 'root' })
export class GenerationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/generation`;

  generateFromText(req: GenerationRequest): Observable<any> {
    return this.http.post<any>(`${this.api}/text`, req);
  }

  generateFromImage(file: File, context?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (context) formData.append('context', context);
    return this.http.post<any>(`${this.api}/image`, formData);
  }
}
