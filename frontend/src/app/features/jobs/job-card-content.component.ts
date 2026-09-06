import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Job } from '../../core/services/job.service';

@Component({
  selector: 'app-job-card-content',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="job-card-content">
      <!-- Company Logo -->
      @if (job.company_logo) {
        <img [src]="job.company_logo" [alt]="job.company" class="company-logo">
      } @else {
        <div class="company-logo-placeholder">
          <mat-icon>business</mat-icon>
        </div>
      }

      <!-- Job Title & Company -->
      <h3 class="job-title">{{ job.title }}</h3>
      <div class="company-info">
        <mat-icon>business</mat-icon>
        <span>{{ job.company }}</span>
      </div>

      <!-- Location & Type -->
      <div class="job-meta">
        <div class="meta-item">
          <mat-icon>location_on</mat-icon>
          <span>{{ job.location }}</span>
        </div>
        <div class="meta-item">
          <mat-icon>schedule</mat-icon>
          <span>{{ job.job_type }}</span>
        </div>
      </div>

      <!-- Salary -->
      @if (job.salary_min || job.salary_max) {
        <div class="salary">
          <mat-icon>attach_money</mat-icon>
          <span>
            @if (job.salary_min && job.salary_max) {
              ${{ formatSalary(job.salary_min) }} - ${{ formatSalary(job.salary_max) }}
            } @else if (job.salary_min) {
              From ${{ formatSalary(job.salary_min) }}
            } @else {
              Up to ${{ formatSalary(job.salary_max!) }}
            }
          </span>
        </div>
      }

      <!-- Tags -->
      @if (job.tags && job.tags.length > 0) {
        <div class="tags-container">
          @for (tag of job.tags.slice(0, 5); track tag) {
            <span class="tag">{{ tag }}</span>
          }
          @if (job.tags.length > 5) {
            <span class="tag more">+{{ job.tags.length - 5 }}</span>
          }
        </div>
      }

      <!-- Match Reasons (for recommended jobs) -->
      @if (matchReasons && matchReasons.length > 0) {
        <div class="match-reasons">
          <div class="match-title">
            <mat-icon>check_circle</mat-icon>
            <span>Why it matches:</span>
          </div>
          @for (reason of matchReasons.slice(0, 3); track reason) {
            <div class="reason-item">• {{ reason }}</div>
          }
        </div>
      }

      <!-- Actions -->
      <div class="card-actions">
        <button class="btn-primary" (click)="apply.emit(job)">
          <mat-icon>open_in_new</mat-icon> Apply Now
        </button>
        <button class="btn-ghost-icon" (click)="save.emit(job)" title="Save job">
          <mat-icon>bookmark_border</mat-icon>
        </button>
      </div>

      <!-- Posted Date -->
      <div class="posted-date">
        <mat-icon>schedule</mat-icon>
        <span>Posted {{ getRelativeTime(job.posted_date || job.created_at) }}</span>
      </div>
    </div>
  `,
  styles: [`
    .job-card-content { display: flex; flex-direction: column; gap: 12px; }

    .company-logo {
      width: 48px; height: 48px; border-radius: 8px; object-fit: contain;
      background: rgba(255,255,255,.05); padding: 4px;
    }
    .company-logo-placeholder {
      width: 48px; height: 48px; border-radius: 8px;
      background: rgba(0,102,140,.15); display: flex;
      align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; }
    }

    .job-title {
      font-size: 1.1rem; font-weight: 700; margin: 0;
      color: var(--text-primary); line-height: 1.3;
    }

    .company-info {
      display: flex; align-items: center; gap: 6px;
      color: var(--text-secondary); font-size: .9rem;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .job-meta {
      display: flex; gap: 16px; flex-wrap: wrap;
    }
    .meta-item {
      display: flex; align-items: center; gap: 4px;
      color: var(--text-secondary); font-size: .85rem;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .salary {
      display: flex; align-items: center; gap: 6px;
      background: rgba(76,190,125,.1); color: #4cbe7d;
      padding: 6px 12px; border-radius: 8px; font-size: .85rem; font-weight: 600;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .tags-container {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .tag {
      background: rgba(113,196,239,.1); border: 1px solid rgba(113,196,239,.2);
      color: #71c4ef; padding: 4px 10px; border-radius: 6px;
      font-size: .75rem; font-weight: 600;
    }
    .tag.more { background: rgba(255,255,255,.05); color: var(--text-secondary); }

    .match-reasons {
      background: rgba(76,190,125,.08); border: 1px solid rgba(76,190,125,.2);
      border-radius: 8px; padding: 10px;
    }
    .match-title {
      display: flex; align-items: center; gap: 6px;
      font-size: .85rem; font-weight: 600; color: #4cbe7d; margin-bottom: 6px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .reason-item { font-size: .8rem; color: var(--text-secondary); margin-bottom: 2px; }

    .card-actions {
      display: flex; gap: 8px; margin-top: 8px;
    }
    .btn-primary {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      background: #00668c; color: #fff; border: none;
      border-radius: 8px; padding: 10px 16px; font-size: .85rem; font-weight: 700;
      cursor: pointer; transition: all .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .btn-primary:hover { background: #005a7a; transform: translateY(-1px); }

    .btn-ghost-icon {
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid var(--border-color);
      border-radius: 8px; cursor: pointer; transition: all .2s;
      mat-icon { color: var(--text-secondary); font-size: 20px; width: 20px; height: 20px; }
    }
    .btn-ghost-icon:hover {
      border-color: rgba(113,196,239,.3); background: rgba(113,196,239,.08);
      mat-icon { color: #71c4ef; }
    }

    .posted-date {
      display: flex; align-items: center; gap: 4px;
      color: var(--text-secondary); font-size: .75rem; margin-top: 4px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
  `],
})
export class JobCardContentComponent {
  @Input({ required: true }) job!: Job;
  @Input() matchReasons?: string[];
  @Output() apply = new EventEmitter<Job>();
  @Output() save = new EventEmitter<Job>();

  formatSalary(amount: number): string {
    return (amount / 1000).toFixed(0) + 'k';
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}
