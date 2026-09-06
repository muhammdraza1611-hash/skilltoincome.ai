import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WeeklyStats } from '../models/roadmap.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private api = inject(ApiService);

  logProgress(hours: number, tasks: number, notes?: string): Observable<any> {
    return this.api.post('/progress/log', { learning_hours: hours, tasks_completed: tasks, notes });
  }

  getWeeklyStats(): Observable<WeeklyStats> {
    return this.api.get<WeeklyStats>('/progress/weekly');
  }

  getMonthlyStats(): Observable<any> {
    return this.api.get('/progress/monthly');
  }

  getNotifications(): Observable<any[]> {
    return this.api.get('/progress/notifications');
  }

  markNotificationRead(id: number): Observable<any> {
    return this.api.patch(`/progress/notifications/${id}/read`, {});
  }
}
