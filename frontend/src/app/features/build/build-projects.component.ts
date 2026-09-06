import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
  html: string;
  css: string;
  js: string;
  thumbnail?: string;
}

@Component({
  selector: 'app-build-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="head-left">
          <div class="head-badge"><span class="live-dot"></span> Build Mode</div>
          <h1>My Projects</h1>
          <p>Manage and open your saved code projects</p>
        </div>
        <a class="btn-new" routerLink="/build">
          <mat-icon>add</mat-icon> New Project
        </a>
      </div>

      @if (projects().length === 0) {
        <div class="empty-state">
          <div class="empty-glow"></div>
          <div class="empty-icon">
            <mat-icon>folder_open</mat-icon>
          </div>
          <h2>No projects yet</h2>
          <p>Go to the Code Editor, build something amazing, and save it here</p>
          <a class="btn-primary" routerLink="/build">
            <mat-icon>code</mat-icon> Open Code Editor
          </a>
        </div>
      } @else {
        <div class="projects-grid">
          @for (p of projects(); track p.id) {
            <div class="project-card" (click)="openProject(p)">
              <div class="project-preview">
                @if (p.thumbnail) {
                  <img [src]="p.thumbnail" alt="preview">
                } @else {
                  <div class="preview-placeholder">
                    <mat-icon>web</mat-icon>
                    <span>{{ p.name }}</span>
                  </div>
                }
              </div>
              <div class="project-info">
                <div class="project-name">{{ p.name }}</div>
                <div class="project-desc">{{ p.description || 'No description' }}</div>
                <div class="project-meta">
                  <span>{{ p.updatedAt | date:'MMM d, y' }}</span>
                </div>
              </div>
              <div class="project-actions">
                <button class="pact-btn" (click)="openProject(p); $event.stopPropagation()" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="pact-btn pact-del" (click)="deleteProject(p.id); $event.stopPropagation()" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }
    .page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .head-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.25); border-radius: 50px; padding: 4px 13px; font-size: .72rem; font-weight: 600; color: #a78bfa; margin-bottom: 10px; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4cbe7d; animation: blink 2s ease-in-out infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    h1 { font-size: clamp(1.4rem,3vw,1.9rem); font-weight: 800; color: var(--text-primary); margin: 0 0 5px; letter-spacing: -.3px; }
    p { color: var(--text-secondary); margin: 0; font-size: .875rem; }
    .btn-new { display: inline-flex; align-items: center; gap: 7px; background: rgba(139,92,246,.2); border: 1px solid rgba(139,92,246,.3); border-radius: 9px; padding: 10px 20px; font-size: .875rem; font-weight: 700; color: #a78bfa; text-decoration: none; transition: all .2s; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .btn-new:hover { background: rgba(139,92,246,.35); }
    /* empty */
    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 80px 24px; position: relative; }
    .empty-glow { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,.1), transparent 70%); pointer-events: none; }
    .empty-icon { width: 88px; height: 88px; border-radius: 22px; background: rgba(139,92,246,.12); border: 1px solid rgba(139,92,246,.2); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; mat-icon { font-size: 40px; width: 40px; height: 40px; color: #a78bfa; } }
    .empty-state h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0 0 10px; }
    .empty-state p { color: var(--text-secondary); max-width: 380px; margin: 0 0 28px; line-height: 1.6; }
    .btn-primary { display: inline-flex; align-items: center; gap: 7px; background: rgba(139,92,246,.2); border: 1px solid rgba(139,92,246,.3); border-radius: 9px; padding: 12px 22px; font-size: .9rem; font-weight: 700; color: #a78bfa; text-decoration: none; transition: all .2s; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .btn-primary:hover { background: rgba(139,92,246,.35); }
    /* grid */
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .project-card { background: var(--surface); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color .2s, transform .2s, box-shadow .2s; position: relative; }
    .project-card:hover { border-color: rgba(139,92,246,.3); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.3); }
    .project-preview { height: 160px; background: #0a1520; display: flex; align-items: center; justify-content: center; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } }
    .preview-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-secondary); mat-icon { font-size: 40px; width: 40px; height: 40px; color: rgba(139,92,246,.5); } span { font-size: .8rem; } }
    .project-info { padding: 14px 16px 12px; }
    .project-name { font-size: .9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
    .project-desc { font-size: .78rem; color: var(--text-secondary); margin-bottom: 8px; }
    .project-meta { font-size: .7rem; color: rgba(139,92,246,.7); }
    .project-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity .2s; }
    .project-card:hover .project-actions { opacity: 1; }
    .pact-btn { width: 30px; height: 30px; border-radius: 7px; background: rgba(0,0,0,.6); border: 1px solid rgba(255,255,255,.1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: all .2s; mat-icon { font-size: 15px; width: 15px; height: 15px; } }
    .pact-btn:hover { background: rgba(139,92,246,.3); color: #a78bfa; }
    .pact-del:hover { background: rgba(248,113,113,.2); color: #f87171; }
  `],
})
export class BuildProjectsComponent {
  private readonly STORAGE_KEY = 'sti_build_projects';

  projects = signal<Project[]>(this._load());

  private _load(): Project[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  openProject(p: Project): void {
    // Store selected project and navigate to editor
    localStorage.setItem('sti_open_project', JSON.stringify(p));
    window.location.href = '/build';
  }

  deleteProject(id: string): void {
    this.projects.update(list => list.filter(p => p.id !== id));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.projects()));
  }
}
