import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Job {
  id: number;
  external_id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  job_type: string;
  description?: string;
  tags: string[];
  apply_url: string;
  salary_min?: number;
  salary_max?: number;
  source: string;
  is_active: boolean;
  posted_date?: string;
  created_at: string;
  match_score?: number;
  match_reasons?: string[];
}

export interface SavedJob {
  id: number;
  user_id: number;
  job_id: number;
  job: Job;
  notes?: string;
  ai_match_score?: number;
  ai_match_reasons: string[];
  created_at: string;
}

export interface JobApplication {
  id: number;
  user_id: number;
  job_id: number;
  job: Job;
  status: string;
  applied_at: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/jobs`;

  syncJobsFromRemoteOK(limit: number = 100): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync?limit=${limit}`, {});
  }

  browseJobs(params: {
    skip?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    location?: string;
  }): Observable<Job[]> {
    return this.http.post<Job[]>(`${this.apiUrl}/browse`, params);
  }

  getRecommendedJobs(limit: number = 10): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.apiUrl}/recommended?limit=${limit}`);
  }

  getJobDetails(jobId: number): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${jobId}`);
  }

  saveJob(jobId: number, notes?: string): Observable<SavedJob> {
    return this.http.post<SavedJob>(`${this.apiUrl}/save`, { job_id: jobId, notes });
  }

  getMySavedJobs(): Observable<SavedJob[]> {
    return this.http.get<SavedJob[]>(`${this.apiUrl}/saved/me`);
  }

  unsaveJob(savedJobId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/saved/${savedJobId}`);
  }

  markJobApplied(jobId: number): Observable<JobApplication> {
    return this.http.post<JobApplication>(`${this.apiUrl}/apply`, { job_id: jobId });
  }

  getMyApplications(): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.apiUrl}/applications/me`);
  }
}
