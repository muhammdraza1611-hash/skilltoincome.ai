import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CareerPath, AssessmentData } from '../models/career.model';

@Injectable({ providedIn: 'root' })
export class CareerService {
  private api = inject(ApiService);

  saveAssessment(data: AssessmentData): Observable<any> {
    return this.api.post('/skills/assessment', data);
  }

  getSkills(): Observable<any[]> {
    return this.api.get('/skills/');
  }

  getProfile(): Observable<any> {
    return this.api.get('/skills/profile');
  }

  analyzeSkills(): Observable<any> {
    return this.api.get('/skills/analyze');
  }

  analyzeCareers(): Observable<CareerPath[]> {
    return this.api.post<CareerPath[]>('/careers/analyze', {});
  }

  getCareers(): Observable<CareerPath[]> {
    return this.api.get<CareerPath[]>('/careers/');
  }
}
