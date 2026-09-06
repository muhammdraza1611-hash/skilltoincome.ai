import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';

type Tab = 'html' | 'css' | 'js';
type ViewMode = 'split' | 'code' | 'preview';

@Component({
  selector: 'app-build-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="editor-shell">

      <!-- ── top bar ── -->
      <div class="editor-topbar">
        <div class="tb-left">
          <div class="project-badge">
            <mat-icon>code</mat-icon>
            <span>{{ projectName }}</span>
          </div>
          <!-- Agent source input -->
          @if (aiMode === 'agent') {
            <div class="repo-path-wrap" matTooltip="GitHub URL or leave empty for pure coding">
              <mat-icon>{{ repoPath.includes('github') ? 'hub' : repoPath ? 'folder' : 'auto_awesome' }}</mat-icon>
              <input class="repo-input" [(ngModel)]="repoPath"
                     placeholder="GitHub URL or empty for pure AI coding…">
              @if (repoPath) {
                <button class="repo-clear" (click)="repoPath = ''" matTooltip="Clear (pure mode)">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>
          }
        </div>

        <!-- view mode tabs -->
        <div class="view-tabs">
          <button class="vt" [class.vt-on]="viewMode === 'code'"    (click)="viewMode = 'code'"    matTooltip="Code only">
            <mat-icon>code</mat-icon>
          </button>
          <button class="vt" [class.vt-on]="viewMode === 'split'"   (click)="viewMode = 'split'"   matTooltip="Split view">
            <mat-icon>view_column</mat-icon>
          </button>
          <button class="vt" [class.vt-on]="viewMode === 'preview'" (click)="viewMode = 'preview'" matTooltip="Preview only">
            <mat-icon>visibility</mat-icon>
          </button>
        </div>

        <div class="tb-right">
          <button class="tb-btn tb-save" (click)="saveProject()" matTooltip="Save Project">
            <mat-icon>save</mat-icon> Save
          </button>
          <button class="tb-btn" (click)="runCode()" matTooltip="Run (Ctrl+Enter)">
            <mat-icon>play_arrow</mat-icon> Run
          </button>
          <button class="tb-btn tb-dl" (click)="download()" matTooltip="Download HTML">
            <mat-icon>download</mat-icon>
          </button>
        </div>
      </div>

      <div class="editor-body">

        <!-- ── CODE PANEL ── -->
        @if (viewMode !== 'preview') {
          <div class="code-panel">

            <!-- file tabs -->
            <div class="file-tabs">
              <button class="ft" [class.ft-on]="activeTab === 'html'" (click)="activeTab = 'html'">
                <span class="ft-dot html-dot"></span> index.html
              </button>
              <button class="ft" [class.ft-on]="activeTab === 'css'" (click)="activeTab = 'css'">
                <span class="ft-dot css-dot"></span> style.css
              </button>
              <button class="ft" [class.ft-on]="activeTab === 'js'" (click)="activeTab = 'js'">
                <span class="ft-dot js-dot"></span> script.js
              </button>
            </div>

            <!-- code editor -->
            <div class="code-editor-wrap">
              <div class="line-numbers">
                @for (n of lineNumbers(); track n) {
                  <div class="ln">{{ n }}</div>
                }
              </div>
              <textarea
                #codeArea
                class="code-area"
                [(ngModel)]="currentCode"
                (ngModelChange)="onCodeChange()"
                (keydown)="onKeydown($event)"
                spellcheck="false"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
              ></textarea>
            </div>

            <!-- AI bar -->
            <div class="ai-bar">
              <!-- mode toggle -->
              <div class="ai-mode-toggle" matTooltip="Switch AI mode">
                <button class="amt-btn" [class.amt-on]="aiMode === 'quick'" (click)="aiMode = 'quick'" matTooltip="Quick (Groq)">
                  <mat-icon>bolt</mat-icon>
                </button>
                <button class="amt-btn" [class.amt-on]="aiMode === 'agent'" (click)="aiMode = 'agent'" matTooltip="Agent (repo-aware)">
                  <mat-icon>psychology</mat-icon>
                </button>
              </div>

              <mat-icon class="ai-icon">auto_awesome</mat-icon>
              <input
                class="ai-input"
                [(ngModel)]="aiPrompt"
                [placeholder]="aiMode === 'agent'
                  ? 'Ask Coding Agent (repo-aware)… e.g. Add a REST endpoint following project patterns'
                  : 'Ask AI to generate or modify code… e.g. Add a dark navbar with logo'"
                (keydown.enter)="askAI()"
                [disabled]="aiLoading()"
              >
              <div class="ai-mode-badge" [class.badge-agent]="aiMode === 'agent'">
                {{ aiMode === 'agent' ? '🤖 Agent' : '⚡ Quick' }}
              </div>
              <button class="ai-send" (click)="askAI()" [disabled]="!aiPrompt.trim() || aiLoading()">
                @if (aiLoading()) { <mat-spinner diameter="16"></mat-spinner> }
                @else { <mat-icon>send</mat-icon> }
              </button>
            </div>
            @if (aiMsg()) {
              <div class="ai-msg-bar" [class.ai-msg-agent]="lastModeUsed === 'agent'">
                <mat-icon>{{ lastModeUsed === 'agent' ? 'psychology' : 'check_circle' }}</mat-icon>
                {{ aiMsg() }}
              </div>
            }
            <!-- agent status -->
            @if (agentStatus()) {
              <div class="agent-status-bar">
                <div class="asb-dot"></div>
                {{ agentStatus() }}
              </div>
            }
          </div>
        }

        <!-- ── PREVIEW PANEL ── -->
        @if (viewMode !== 'code') {
          <div class="preview-panel">
            <div class="preview-header">
              <div class="ph-left">
                <span class="ph-dot red"></span>
                <span class="ph-dot amber"></span>
                <span class="ph-dot green"></span>
                <span class="ph-url">preview</span>
              </div>
              <button class="ph-refresh" (click)="runCode()" matTooltip="Refresh preview">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
            <iframe #previewFrame class="preview-frame" sandbox="allow-scripts allow-same-origin"></iframe>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .editor-shell {
      display: flex; flex-direction: column;
      height: calc(100vh - 60px);
      font-family: 'Inter', system-ui, sans-serif;
      background: #08111a;
    }

    /* topbar */
    .editor-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; height: 44px; flex-shrink: 0;
      background: var(--surface); border-bottom: 1px solid var(--border-color);
      gap: 12px;
    }
    .tb-left { display: flex; align-items: center; gap: 10px; }
    .tb-right { display: flex; align-items: center; gap: 6px; }

    .project-badge {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(139,92,246,.12); border: 1px solid rgba(139,92,246,.25);
      border-radius: 7px; padding: 4px 12px;
      font-size: .8rem; font-weight: 700; color: #a78bfa;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .repo-path-wrap {
      display: flex; align-items: center; gap: 6px;
      background: rgba(0,102,140,.12); border: 1px solid rgba(113,196,239,.2);
      border-radius: 7px; padding: 4px 10px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #71c4ef; flex-shrink: 0; }
    }
    .repo-input {
      background: none; border: none; outline: none;
      color: rgba(113,196,239,.9); font-size: .72rem; font-family: 'Fira Code', monospace;
      width: 260px;
    }
    .repo-input::placeholder { color: rgba(113,196,239,.35); }
    .repo-clear {
      background: none; border: none; cursor: pointer; padding: 0;
      color: rgba(113,196,239,.5); display: flex; align-items: center;
      transition: color .2s; flex-shrink: 0;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .repo-clear:hover { color: #f87171; }

    /* view tabs */
    .view-tabs { display: flex; background: rgba(255,255,255,.04); border: 1px solid var(--border-color); border-radius: 8px; padding: 2px; gap: 2px; }
    .vt {
      width: 32px; height: 28px; border-radius: 6px; border: none;
      background: none; color: var(--text-secondary); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .vt:hover { color: var(--text-primary); background: rgba(255,255,255,.06); }
    .vt.vt-on { background: rgba(139,92,246,.2); color: #a78bfa; }

    .tb-btn {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.25);
      border-radius: 7px; padding: 5px 12px;
      font-size: .78rem; font-weight: 700; color: #a78bfa; cursor: pointer;
      transition: all .2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .tb-btn:hover { background: rgba(139,92,246,.28); border-color: rgba(139,92,246,.5); }
    .tb-dl { background: rgba(0,102,140,.15); border-color: rgba(113,196,239,.22); color: #71c4ef; }
    .tb-dl:hover { background: rgba(0,102,140,.28); }
    .tb-save { background: rgba(76,190,125,.12); border-color: rgba(76,190,125,.25); color: #4cbe7d; }
    .tb-save:hover { background: rgba(76,190,125,.25); }

    /* body */
    .editor-body {
      flex: 1; display: flex; overflow: hidden; min-height: 0;
    }

    /* code panel */
    .code-panel {
      flex: 1; display: flex; flex-direction: column;
      border-right: 1px solid var(--border-color); min-width: 0;
    }

    /* file tabs */
    .file-tabs {
      display: flex; border-bottom: 1px solid var(--border-color);
      background: rgba(255,255,255,.02); flex-shrink: 0;
    }
    .ft {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 16px; border: none; background: none;
      font-size: .78rem; font-weight: 600; color: var(--text-secondary);
      cursor: pointer; border-bottom: 2px solid transparent;
      transition: all .2s;
    }
    .ft:hover { color: var(--text-primary); background: rgba(255,255,255,.03); }
    .ft.ft-on { color: var(--text-primary); border-bottom-color: #a78bfa; background: rgba(139,92,246,.06); }
    .ft-dot { width: 8px; height: 8px; border-radius: 50%; }
    .html-dot { background: #f97316; }
    .css-dot  { background: #3b82f6; }
    .js-dot   { background: #eab308; }

    /* code editor */
    .code-editor-wrap {
      flex: 1; display: flex; overflow: hidden;
      background: #0a1520; font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    }
    .line-numbers {
      padding: 12px 0; min-width: 42px; text-align: right;
      background: rgba(0,0,0,.2); border-right: 1px solid rgba(255,255,255,.05);
      overflow: hidden; user-select: none; flex-shrink: 0;
    }
    .ln {
      height: 20px; line-height: 20px; padding: 0 10px 0 4px;
      font-size: .75rem; color: rgba(255,255,255,.2);
    }
    .code-area {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-family: inherit; font-size: .8rem;
      line-height: 20px; padding: 12px;
      resize: none; overflow: auto; white-space: pre;
      tab-size: 2;
    }
    .code-area::selection { background: rgba(139,92,246,.3); }

    /* AI bar */
    .ai-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-top: 1px solid var(--border-color);
      background: rgba(139,92,246,.04); flex-shrink: 0;
    }
    .ai-icon { font-size: 18px; width: 18px; height: 18px; color: #a78bfa; flex-shrink: 0; }
    .ai-input {
      flex: 1; background: rgba(255,255,255,.04);
      border: 1px solid rgba(139,92,246,.2); border-radius: 8px;
      padding: 7px 12px; color: var(--text-primary);
      font-size: .82rem; font-family: 'Inter', sans-serif; outline: none;
      transition: border-color .2s;
    }
    .ai-input::placeholder { color: rgba(255,255,255,.25); }
    .ai-input:focus { border-color: rgba(139,92,246,.5); }
    .ai-send {
      width: 34px; height: 34px; border-radius: 8px;
      background: rgba(139,92,246,.2); border: 1px solid rgba(139,92,246,.3);
      display: flex; align-items: center; justify-content: center;
      color: #a78bfa; cursor: pointer; transition: all .2s; flex-shrink: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #a78bfa; }
    }
    .ai-send:hover:not(:disabled) { background: rgba(139,92,246,.35); border-color: rgba(139,92,246,.5); }
    .ai-send:disabled { opacity: .45; cursor: not-allowed; }

    /* AI mode toggle */
    .ai-mode-toggle {
      display: flex; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
      border-radius: 7px; padding: 2px; gap: 2px; flex-shrink: 0;
    }
    .amt-btn {
      width: 26px; height: 26px; border-radius: 5px; border: none;
      background: none; cursor: pointer; color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center; transition: all .2s;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .amt-btn:hover { color: var(--text-primary); background: rgba(255,255,255,.06); }
    .amt-btn.amt-on { background: rgba(139,92,246,.25); color: #a78bfa; }

    .ai-mode-badge {
      font-size: .65rem; font-weight: 700; padding: 3px 7px; border-radius: 6px;
      background: rgba(139,92,246,.12); border: 1px solid rgba(139,92,246,.25); color: #a78bfa;
      white-space: nowrap; flex-shrink: 0;
    }
    .badge-agent { background: rgba(76,190,125,.1); border-color: rgba(76,190,125,.25); color: #4cbe7d; }

    .ai-msg-bar {
      display: flex; align-items: center; gap: 7px;
      padding: 6px 14px; background: rgba(76,190,125,.1);
      border-top: 1px solid rgba(76,190,125,.2);
      font-size: .78rem; color: #4cbe7d; flex-shrink: 0;
      animation: fade-in .2s ease;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }
    .ai-msg-agent { background: rgba(0,102,140,.1); border-color: rgba(113,196,239,.2); color: #71c4ef; }

    .agent-status-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 14px; background: rgba(0,102,140,.08);
      border-top: 1px solid rgba(113,196,239,.15);
      font-size: .72rem; color: rgba(113,196,239,.8); flex-shrink: 0;
    }
    .asb-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #71c4ef;
      animation: blink 1s ease-in-out infinite; flex-shrink: 0;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    @keyframes fade-in { from{opacity:0} to{opacity:1} }

    /* preview panel */
    .preview-panel {
      flex: 1; display: flex; flex-direction: column; min-width: 0;
      background: #fff;
    }
    .preview-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 12px; height: 36px; flex-shrink: 0;
      background: #1e1e2e; border-bottom: 1px solid var(--border-color);
    }
    .ph-left { display: flex; align-items: center; gap: 6px; }
    .ph-dot  { width: 10px; height: 10px; border-radius: 50%; }
    .ph-dot.red   { background: #ff5f57; }
    .ph-dot.amber { background: #febc2e; }
    .ph-dot.green { background: #28c840; }
    .ph-url  { font-size: .72rem; color: rgba(255,255,255,.4); margin-left: 8px; font-family: monospace; }
    .ph-refresh {
      background: none; border: none; cursor: pointer; color: rgba(255,255,255,.4);
      display: flex; align-items: center; padding: 0; transition: color .2s;
      mat-icon { font-size: 16px; }
    }
    .ph-refresh:hover { color: #71c4ef; }
    .preview-frame { flex: 1; border: none; width: 100%; height: 100%; }
  `],
})
export class BuildEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('previewFrame') previewFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('codeArea')     codeArea!:    ElementRef<HTMLTextAreaElement>;

  private api = inject(ApiService);

  viewMode: ViewMode = 'split';
  activeTab: Tab     = 'html';
  aiPrompt    = '';
  aiLoading   = signal(false);
  aiMsg       = signal('');
  aiMode: 'quick' | 'agent' = 'quick';
  agentStatus = signal('');
  lastModeUsed: 'quick' | 'agent' = 'quick';

  // AI Coding Agent endpoint (running on port 8001)
  private readonly AGENT_URL = 'http://localhost:8001/api/v1';
  repoPath = '';  // empty = pure AI coding, GitHub URL = repo-aware mode
  projectName = 'My Project';

  private autoRunTimer: any;

  code: Record<Tab, string> = {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <div class="container">
    <h1>Hello World! 👋</h1>
    <p>Start coding or ask AI to generate something amazing.</p>
    <button onclick="greet()">Click me</button>
  </div>

  <script src="script.js"></script>
</body>
</html>`,
    css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #0f0c29, #302b63);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.container {
  text-align: center;
  padding: 40px;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #71c4ef, #00668c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  font-size: 1.1rem;
  opacity: 0.7;
  margin-bottom: 24px;
}

button {
  padding: 12px 28px;
  background: #00668c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

button:hover {
  background: #005a7a;
  transform: translateY(-2px);
}`,
    js: `function greet() {
  const names = ['Developer', 'Builder', 'Creator', 'Coder'];
  const random = names[Math.floor(Math.random() * names.length)];
  alert('Hello, ' + random + '! 🚀');
}

console.log('Script loaded!');`,
  };

  get currentCode(): string { return this.code[this.activeTab]; }
  set currentCode(v: string) { this.code[this.activeTab] = v; }

  lineNumbers() {
    const lines = this.currentCode.split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1);
  }

  ngAfterViewInit(): void {
    // Load template prompt if coming from templates page
    const templatePrompt = localStorage.getItem('sti_template_prompt');
    if (templatePrompt) {
      localStorage.removeItem('sti_template_prompt');
      this.aiPrompt = templatePrompt;
      this.aiMode = 'quick';
      setTimeout(() => this.askAI(), 200);
    }

    // Load saved project if coming from projects page
    const openProject = localStorage.getItem('sti_open_project');
    if (openProject) {
      localStorage.removeItem('sti_open_project');
      try {
        const p = JSON.parse(openProject);
        this.code.html = p.html || this.code.html;
        this.code.css  = p.css  || this.code.css;
        this.code.js   = p.js   || this.code.js;
        this.projectName = p.name || 'My Project';
      } catch {}
    }

    setTimeout(() => this.runCode(), 200);
  }

  ngOnDestroy(): void {
    if (this.autoRunTimer) clearTimeout(this.autoRunTimer);
  }

  onCodeChange(): void {
    clearTimeout(this.autoRunTimer);
    this.autoRunTimer = setTimeout(() => this.runCode(), 800);
  }

  onKeydown(e: KeyboardEvent): void {
    // Tab key → insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target as HTMLTextAreaElement;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      this.code[this.activeTab] =
        this.currentCode.substring(0, start) + '  ' + this.currentCode.substring(end);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
    // Ctrl+Enter → run
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.runCode();
    }
  }

  runCode(): void {
    if (!this.previewFrame?.nativeElement) return;
    const html = this.buildHTML();
    const iframe = this.previewFrame.nativeElement;
    iframe.srcdoc = html;
  }

  private buildHTML(): string {
    return this.code.html
      .replace(
        /<link[^>]*href=["']style\.css["'][^>]*>/,
        `<style>${this.code.css}</style>`
      )
      .replace(
        /<script[^>]*src=["']script\.js["'][^>]*><\/script>/,
        `<script>${this.code.js}</script>`
      );
  }

  download(): void {
    const blob = new Blob([this.buildHTML()], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'project.html';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  saveProject(): void {
    const STORAGE_KEY = 'sti_build_projects';
    let projects: any[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      projects = raw ? JSON.parse(raw) : [];
    } catch {}

    const existingIdx = projects.findIndex((p: any) => p.name === this.projectName);
    const project = {
      id: existingIdx >= 0 ? projects[existingIdx].id : `proj_${Date.now()}`,
      name: this.projectName,
      description: `Built with AI — ${new Date().toLocaleDateString()}`,
      updatedAt: new Date().toISOString(),
      html: this.code.html,
      css:  this.code.css,
      js:   this.code.js,
    };

    if (existingIdx >= 0) {
      projects[existingIdx] = project;
    } else {
      projects.unshift(project);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    this.aiMsg.set('✅ Project saved to My Projects!');
    setTimeout(() => this.aiMsg.set(''), 3000);
  }

  askAI(): void {
    const prompt = this.aiPrompt.trim();
    if (!prompt || this.aiLoading()) return;

    this.lastModeUsed = this.aiMode;

    if (this.aiMode === 'agent') {
      this.askAgent(prompt);
    } else {
      this.askQuick(prompt);
    }
  }

  /** Quick mode — uses Groq via backend /build/generate */
  private askQuick(prompt: string): void {
    this.aiLoading.set(true);
    this.aiMsg.set('');
    this.agentStatus.set('');

    this.api.post<any>('/build/generate', {
      prompt,
      html: this.code.html,
      css:  this.code.css,
      js:   this.code.js,
    }).subscribe({
      next: (res) => {
        this.aiLoading.set(false);
        this.aiMsg.set(res.message || 'Done!');
        if (res.html) this.code.html = res.html;
        if (res.css)  this.code.css  = res.css;
        if (res.js)   this.code.js   = res.js;
        this.aiPrompt = '';
        setTimeout(() => this.runCode(), 100);
        setTimeout(() => this.aiMsg.set(''), 5000);
      },
      error: (err) => {
        this.aiLoading.set(false);
        this.aiMsg.set(err?.error?.detail || 'Generation failed');
      },
    });
  }

  /** Agent mode — uses AI Coding Agent streaming (port 8001) */
  private askAgent(prompt: string): void {
    this.aiLoading.set(true);
    this.aiMsg.set('');

    const hasRepo  = this.repoPath.trim().length > 0;
    const isGitHub = this.repoPath.includes('github.com');
    this.agentStatus.set(
      isGitHub ? '📦 Fetching GitHub repo…' :
      hasRepo  ? '🔍 Analyzing repository…' :
                 '🤖 Pure AI coding mode…'
    );

    // Build full prompt with current code context
    const fullPrompt = hasRepo
      ? `${prompt}\n\nCurrent editor context:\n--- HTML ---\n${this.code.html.slice(0,500)}\n--- CSS ---\n${this.code.css.slice(0,300)}\n--- JS ---\n${this.code.js.slice(0,200)}`
      : prompt;

    // Streaming via SSE
    const url = `${this.AGENT_URL}/agent/stream`;
    let streamedText = '';

    // Use fetch + ReadableStream for POST SSE
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: fullPrompt, repo_path: this.repoPath }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(e => { throw new Error(e.detail || `HTTP ${response.status}`); });
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processChunk = (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // just track event type
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6).replace(/\\n/g, '\n');
            const eventLine = lines[lines.indexOf(line) - 1] || '';
            const eventType = eventLine.startsWith('event: ') ? eventLine.slice(7) : 'token';

            if (eventType === 'status') {
              this.agentStatus.set(data);
            } else if (eventType === 'token') {
              streamedText += data;
              // Live-update the active code tab as tokens arrive
              this.liveUpdateCode(streamedText);
            } else if (eventType === 'done') {
              try {
                const result = JSON.parse(data);
                this.applyCodeBlocks(result.code_blocks || []);
                const refs = (result.relevant_files || []).slice(0, 3).join(', ');
                this.aiMsg.set(`✅ Done! ${result.code_blocks?.length || 0} code blocks generated${refs ? ' · refs: ' + refs : ''}`);
              } catch {}
              this.finishStream();
            } else if (eventType === 'error') {
              this.aiMsg.set(`❌ ${data}`);
              this.finishStream();
            }
          }
        }
      };

      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) { this.finishStream(); return; }
          processChunk(decoder.decode(value, { stream: true }));
          return pump();
        });

      return pump();
    })
    .catch((err: Error) => {
      if (err.message.includes('Failed to fetch') || err.message.includes('ECONNREFUSED')) {
        this.agentStatus.set('');
        this.aiMsg.set('⚠️ Agent not running (port 8001). Falling back to Quick mode…');
        setTimeout(() => { this.aiMode = 'quick'; this.askQuick(prompt); }, 1200);
      } else {
        this.aiMsg.set(`❌ ${err.message}`);
        this.finishStream();
      }
    });

    this.aiPrompt = '';
  }

  private finishStream(): void {
    this.aiLoading.set(false);
    this.agentStatus.set('');
    setTimeout(() => this.runCode(), 100);
    setTimeout(() => this.aiMsg.set(''), 8000);
  }

  /** Live-update code editor as tokens stream in */
  private liveUpdateCode(fullText: string): void {
    // Try to extract the most recent complete code block
    const htmlMatch = fullText.match(/```html\n([\s\S]*?)(?:```|$)/i);
    const cssMatch  = fullText.match(/```css\n([\s\S]*?)(?:```|$)/i);
    const jsMatch   = fullText.match(/```(?:js|javascript)\n([\s\S]*?)(?:```|$)/i);

    if (htmlMatch?.[1]?.trim()) this.code.html = htmlMatch[1];
    if (cssMatch?.[1]?.trim())  this.code.css  = cssMatch[1];
    if (jsMatch?.[1]?.trim())   this.code.js   = jsMatch[1];

    // Auto-refresh preview every ~500 chars
    if (fullText.length % 500 < 20) {
      this.runCode();
    }
  }

  /** Apply final code blocks after stream completes */
  private applyCodeBlocks(blocks: {language: string; code: string}[]): void {
    let applied = false;
    for (const b of blocks) {
      const lang = b.language.toLowerCase();
      if ((lang === 'html' || lang === 'markup') && b.code.includes('<')) {
        this.code.html = b.code; applied = true;
      } else if (lang === 'css') {
        this.code.css = b.code; applied = true;
      } else if (lang === 'javascript' || lang === 'js') {
        this.code.js = b.code; applied = true;
      }
    }
    if (!applied && blocks.length > 0) {
      // Single block — try to detect type
      const code = blocks[0].code;
      if (code.includes('<!DOCTYPE') || code.includes('<html')) {
        this.code.html = code;
      } else if (code.includes('{') && !code.includes('function')) {
        this.code.css = code;
      } else {
        this.code.js = code;
      }
    }
  }
}
