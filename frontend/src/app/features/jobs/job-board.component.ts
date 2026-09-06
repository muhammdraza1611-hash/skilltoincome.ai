import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { JobService, Job } from '../../core/services/job.service';

@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatChipsModule, MatButtonModule, MatInputModule, MatSelectModule,
  ],
  template: `
    <div class="job-board-page">
      
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1><mat-icon>work</mat-icon> Remote Job Board</h1>
          <p>AI-powered job matching • Powered by Remotive.io</p>
          
          <button class="btn-sync" (click)="syncJobs()" [disabled]="syncing()">
            @if (syncing()) {
              <mat-spinner diameter="18"></mat-spinner> Syncing...
            } @else {
              <mat-icon>sync</mat-icon> Sync Latest Jobs
            }
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            placeholder="Search jobs by title, company..."
          >
        </div>

        <select [(ngModel)]="selectedLocation" (ngModelChange)="loadJobs()" class="filter-select">
          <option value="">All Locations</option>
          <option value="Remote">Remote</option>
          <option value="USA">USA</option>
          <option value="Europe">Europe</option>
          <option value="Asia">Asia</option>
        </select>

        <button class="btn-recommended" (click)="loadRecommended()">
          <mat-icon>stars</mat-icon> AI Recommended
        </button>
      </div>

      <!-- Tags Filter -->
      <div class="tags-filter">
        <span class="label">Filter by skills:</span>
        @for (tag of popularTags; track tag) {
          <button 
            class="tag-chip" 
            [class.active]="selectedTags().includes(tag)"
            (click)="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        }
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading jobs...</p>
        </div>
      }

      <!-- Jobs Grid -->
      @if (!loading() && jobs().length > 0) {
        <div class="jobs-grid">
          @for (job of jobs(); track job.id) {
            <div class="job-card">
              
              <!-- Company Logo -->
              <div class="job-header">
                @if (job.company_logo) {
                  <img [src]="job.company_logo" [alt]="job.company" class="company-logo">
                } @else {
                  <div class="company-logo-placeholder">
                    <mat-icon>business</mat-icon>
                  </div>
                }
                
                <div class="job-meta">
                  <h3>{{ job.title }}</h3>
                  <p class="company">{{ job.company }}</p>
                </div>
              </div>

              <!-- Match Score (if recommended) -->
              @if (job.match_score !== undefined) {
                <div class="match-score" [class.high]="job.match_score >= 70">
                  <mat-icon>stars</mat-icon>
                  <span>{{ job.match_score }}% Match</span>
                </div>
              }

              <!-- Location & Type -->
              <div class="job-info">
                <span class="info-item">
                  <mat-icon>location_on</mat-icon>
                  {{ job.location }}
                </span>
                <span class="info-item">
                  <mat-icon>schedule</mat-icon>
                  {{ job.job_type }}
                </span>
                @if (job.salary_min && job.salary_max) {
                  <span class="info-item">
                    <mat-icon>attach_money</mat-icon>
                    {{ job.salary_min / 1000 }}k - {{ job.salary_max / 1000 }}k
                  </span>
                }
              </div>

              <!-- Tags -->
              @if (job.tags && job.tags.length > 0) {
                <div class="job-tags">
                  @for (tag of job.tags.slice(0, 5); track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </div>
              }

              <!-- Match Reasons -->
              @if (job.match_reasons && job.match_reasons.length > 0) {
                <div class="match-reasons">
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ job.match_reasons[0] }}</span>
                </div>
              }

              <!-- Actions -->
              <div class="job-actions">
                <button class="btn-save" (click)="saveJob(job)" [disabled]="savingJobId() === job.id">
                  @if (savingJobId() === job.id) {
                    <mat-spinner diameter="16"></mat-spinner>
                  } @else {
                    <mat-icon>bookmark_border</mat-icon>
                    Save
                  }
                </button>
                
                <button class="btn-apply" (click)="applyToJob(job)">
                  <mat-icon>open_in_new</mat-icon>
                  Apply Now
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Load More -->
        @if (jobs().length >= 20) {
          <div class="load-more">
            <button class="btn-load-more" (click)="loadMore()" [disabled]="loading()">
              Load More Jobs
            </button>
          </div>
        }
      }

      <!-- Empty State -->
      @if (!loading() && jobs().length === 0) {
        <div class="empty-state">
          <mat-icon>work_off</mat-icon>
          <h2>No jobs found</h2>
          <p>Try adjusting your filters or sync latest jobs</p>
        </div>
      }

    </div>
  `,
  styles: [`
    .job-board-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #00668c 0%, #0a4d68 100%);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      color: white;
    }
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .header h1 {
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }
    .btn-sync {
      align-self: flex-start;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      transition: all 0.2s;
      mat-spinner { --mdc-circular-progress-active-indicator-color: white; }
    }
    .btn-sync:hover:not(:disabled) {
      background: rgba(255,255,255,0.3);
    }
    .btn-sync:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 300px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px 16px;
      mat-icon { color: var(--text-secondary); }
      input {
        flex: 1;
        border: none;
        background: none;
        outline: none;
        color: var(--text-primary);
        font-size: 0.95rem;
      }
    }
    .filter-select {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px 16px;
      color: var(--text-primary);
      font-size: 0.95rem;
      cursor: pointer;
      outline: none;
    }
    .btn-recommended {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .btn-recommended:hover {
      transform: translateY(-2px);
    }

    /* Tags Filter */
    .tags-filter {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--surface);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .tags-filter .label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-right: 8px;
    }
    .tag-chip {
      background: rgba(113,196,239,0.1);
      border: 1px solid rgba(113,196,239,0.2);
      color: #71c4ef;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tag-chip:hover {
      background: rgba(113,196,239,0.2);
    }
    .tag-chip.active {
      background: #00668c;
      border-color: #71c4ef;
      color: white;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 60px 20px;
    }

    /* Jobs Grid */
    .jobs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    /* Job Card */
    .job-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .job-card:hover {
      border-color: rgba(113,196,239,0.4);
      box-shadow: 0 8px 24px rgba(0,102,140,0.12);
      transform: translateY(-2px);
    }

    .job-header {
      display: flex;
      gap: 12px;
    }
    .company-logo {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: contain;
      background: white;
      padding: 4px;
      flex-shrink: 0;
    }
    .company-logo-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: rgba(113,196,239,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { color: #71c4ef; }
    }
    .job-meta h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .job-meta .company {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .match-score {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(245,158,11,0.15);
      border: 1px solid rgba(245,158,11,0.3);
      color: #f59e0b;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      align-self: flex-start;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .match-score.high {
      background: rgba(76,190,125,0.15);
      border-color: rgba(76,190,125,0.3);
      color: #4cbe7d;
    }

    .job-info {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .job-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .job-tags .tag {
      background: rgba(113,196,239,0.1);
      color: #71c4ef;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .match-reasons {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(76,190,125,0.1);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #4cbe7d;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .job-actions {
      display: flex;
      gap: 10px;
      margin-top: auto;
    }
    .btn-save {
      flex: 1;
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 600;
      transition: all 0.2s;
      mat-spinner { --mdc-circular-progress-active-indicator-color: currentColor; }
    }
    .btn-save:hover:not(:disabled) {
      border-color: #71c4ef;
      color: #71c4ef;
    }
    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-apply {
      flex: 2;
      background: #00668c;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-apply:hover {
      background: #005a7a;
      transform: translateY(-1px);
    }

    /* Load More */
    .load-more {
      text-align: center;
      margin-top: 24px;
    }
    .btn-load-more {
      background: var(--surface);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 12px 32px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-load-more:hover:not(:disabled) {
      border-color: #71c4ef;
      color: #71c4ef;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--text-secondary);
        opacity: 0.5;
      }
      h2 {
        margin: 16px 0 8px;
        color: var(--text-primary);
      }
      p {
        color: var(--text-secondary);
      }
    }
  `],
})
export class JobBoardComponent implements OnInit {
  private jobService = inject(JobService);
  private snackBar = inject(MatSnackBar);

  jobs = signal<Job[]>([]);
  loading = signal(false);
  syncing = signal(false);
  savingJobId = signal<number | null>(null);
  
  searchQuery = '';
  selectedLocation = '';
  selectedTags = signal<string[]>([]);
  currentSkip = 0;
  
  popularTags = ['Python', 'JavaScript', 'React', 'Node', 'AWS', 'DevOps', 'Design', 'Marketing'];

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.loading.set(true);
    this.currentSkip = 0;
    
    this.jobService.browseJobs({
      skip: 0,
      limit: 20,
      search: this.searchQuery || undefined,
      tags: this.selectedTags().length > 0 ? this.selectedTags() : undefined,
      location: this.selectedLocation || undefined,
    }).subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load jobs:', err);
        this.snackBar.open('Failed to load jobs', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    this.currentSkip += 20;
    this.loading.set(true);
    
    this.jobService.browseJobs({
      skip: this.currentSkip,
      limit: 20,
      search: this.searchQuery || undefined,
      tags: this.selectedTags().length > 0 ? this.selectedTags() : undefined,
      location: this.selectedLocation || undefined,
    }).subscribe({
      next: (jobs) => {
        this.jobs.set([...this.jobs(), ...jobs]);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load more jobs:', err);
        this.loading.set(false);
      }
    });
  }

  loadRecommended() {
    this.loading.set(true);
    this.jobService.getRecommendedJobs(20).subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.loading.set(false);
        this.snackBar.open('✨ Showing AI-recommended jobs based on your skills', 'OK', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to load recommended jobs:', err);
        this.snackBar.open('Failed to load recommended jobs. Make sure you have skills added.', 'OK', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  syncJobs() {
    this.syncing.set(true);
    this.jobService.syncJobsFromRemoteOK(100).subscribe({
      next: (result) => {
        this.syncing.set(false);
        this.snackBar.open(`✅ Synced ${result.jobs_added} new jobs from Remotive.io`, 'OK', { duration: 4000 });
        this.loadJobs(); // Reload to show new jobs
      },
      error: (err) => {
        console.error('Failed to sync jobs:', err);
        this.snackBar.open('Failed to sync jobs from Remotive.io', 'OK', { duration: 3000 });
        this.syncing.set(false);
      }
    });
  }

  onSearchChange() {
    // Debounce search
    setTimeout(() => this.loadJobs(), 500);
  }

  toggleTag(tag: string) {
    const tags = this.selectedTags();
    if (tags.includes(tag)) {
      this.selectedTags.set(tags.filter(t => t !== tag));
    } else {
      this.selectedTags.set([...tags, tag]);
    }
    this.loadJobs();
  }

  saveJob(job: Job) {
    this.savingJobId.set(job.id);
    this.jobService.saveJob(job.id).subscribe({
      next: () => {
        this.savingJobId.set(null);
        this.snackBar.open(`✅ Saved "${job.title}" to your bookmarks`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to save job:', err);
        this.snackBar.open('Failed to save job', 'OK', { duration: 3000 });
        this.savingJobId.set(null);
      }
    });
  }

  applyToJob(job: Job) {
    // Mark as applied
    this.jobService.markJobApplied(job.id).subscribe({
      next: () => {
        // Open job URL in new tab
        window.open(job.apply_url, '_blank');
        this.snackBar.open(`✅ Opening application page for ${job.company}`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to mark job as applied:', err);
        // Still open the URL even if tracking fails
        window.open(job.apply_url, '_blank');
      }
    });
  }
}
