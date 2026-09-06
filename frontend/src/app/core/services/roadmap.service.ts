import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Roadmap, RoadmapDuration, TaskStatus } from '../models/roadmap.model';

@Injectable({ providedIn: 'root' })
export class RoadmapService {
  private api = inject(ApiService);

  generate(duration: RoadmapDuration, careerPathId?: number, careerTitle?: string): Observable<Roadmap> {
    return this.api.post<Roadmap>('/roadmaps/generate', {
      duration,
      career_path_id: careerPathId,
      career_title: careerTitle,
    });
  }

  getRoadmaps(): Observable<Roadmap[]> {
    return this.api.get<Roadmap[]>('/roadmaps/');
  }

  getActive(): Observable<Roadmap> {
    return this.api.get<Roadmap>('/roadmaps/active');
  }

  updateTaskStatus(taskId: number, status: TaskStatus): Observable<any> {
    return this.api.patch(`/roadmaps/tasks/${taskId}/status`, { status });
  }

  predictIncome(careerPath: string): Observable<any> {
    return this.api.post('/income/predict', { career_path: careerPath });
  }

  getIncomePredictions(): Observable<any[]> {
    return this.api.get('/income/predictions');
  }

  analyzePortfolio(data: { portfolio_url?: string; github_url?: string; career_goal?: string }): Observable<any> {
    return this.api.post('/portfolio/analyze', data);
  }

  getPortfolioReviews(): Observable<any[]> {
    return this.api.get('/portfolio/reviews');
  }
}
