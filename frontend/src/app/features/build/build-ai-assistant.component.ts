import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-build-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="head-badge"><span class="live-dot"></span> Build Mode</div>
        <h1>AI Assistant</h1>
        <p>Ask the AI anything about web development, get code suggestions, or plan your next project</p>
      </div>

      <div class="assistant-layout">
        <!-- Left: chat -->
        <div class="chat-panel">
          <div class="messages-wrap" #msgWrap>
            @if (messages().length === 0) {
              <div class="welcome">
                <div class="welcome-icon">
                  <mat-icon>auto_awesome</mat-icon>
                </div>
                <h2>Your AI Build Assistant</h2>
                <p>Ask me to help you plan websites, explain code, suggest improvements, or generate specific components.</p>
                <div class="suggestions">
                  @for (s of suggestions; track s.text) {
                    <button class="sug-card" (click)="sendMessage(s.text)">
                      <span class="sug-icon">{{ s.icon }}</span>
                      <span>{{ s.text }}</span>
                    </button>
                  }
                </div>
              </div>
            }

            @for (msg of messages(); track $index) {
              <div class="msg-row" [class.user-row]="msg.role === 'user'" [class.ai-row]="msg.role === 'assistant'">
                @if (msg.role === 'assistant') {
                  <div class="msg-avatar ai-av"><mat-icon>auto_awesome</mat-icon></div>
                }
                <div class="bubble" [class.user-bubble]="msg.role === 'user'" [class.ai-bubble]="msg.role === 'assistant'">
                  <div class="bubble-text" [innerHTML]="formatMsg(msg.content)"></div>
                  <div class="bubble-time">{{ msg.timestamp | date:'HH:mm' }}</div>
                  @if (msg.role === 'assistant') {
                    <button class="copy-btn" (click)="copyToEditor(msg.content)" matTooltip="Open in Code Editor">
                      <mat-icon>open_in_new</mat-icon> Open in Editor
                    </button>
                  }
                </div>
                @if (msg.role === 'user') {
                  <div class="msg-avatar user-av">{{ userInitial }}</div>
                }
              </div>
            }

            @if (loading()) {
              <div class="msg-row ai-row">
                <div class="msg-avatar ai-av"><mat-icon>auto_awesome</mat-icon></div>
                <div class="bubble ai-bubble typing">
                  <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </div>
              </div>
            }
          </div>

          <div class="input-bar">
            <div class="input-wrap" [class.focused]="focused">
              <textarea [(ngModel)]="inputText" rows="1"
                placeholder="Ask about web development, request code, or describe what you want to build…"
                (keydown)="onKey($event)"
                (focus)="focused = true" (blur)="focused = false"
                (input)="autoResize($event)"></textarea>
              <button class="send-btn" (click)="sendMessage()" [disabled]="!inputText.trim() || loading()">
                @if (loading()) { <mat-spinner diameter="16"></mat-spinner> }
                @else { <mat-icon>send</mat-icon> }
              </button>
            </div>
            <div class="input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</div>
          </div>
        </div>

        <!-- Right: quick actions -->
        <div class="right-panel">
          <div class="rp-card">
            <div class="rp-title">Quick Actions</div>
            @for (a of quickActions; track a.label) {
              <button class="qa-btn" (click)="sendMessage(a.prompt)">
                <span class="qa-icon">{{ a.icon }}</span>
                <div>
                  <div class="qa-label">{{ a.label }}</div>
                  <div class="qa-sub">{{ a.sub }}</div>
                </div>
              </button>
            }
          </div>

          <div class="rp-card">
            <div class="rp-title">Code Editor</div>
            <p class="rp-sub">Generate code here and send it directly to the editor</p>
            <a class="go-editor-btn" routerLink="/build">
              <mat-icon>code</mat-icon> Open Editor
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; height: calc(100vh - 116px); display: flex; flex-direction: column; }
    .page-head { margin-bottom: 16px; flex-shrink: 0; }
    .head-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.25); border-radius: 50px; padding: 4px 13px; font-size: .72rem; font-weight: 600; color: #a78bfa; margin-bottom: 10px; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4cbe7d; animation: blink 2s ease-in-out infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    h1 { font-size: clamp(1.3rem,3vw,1.7rem); font-weight: 800; color: var(--text-primary); margin: 0 0 4px; }
    p { color: var(--text-secondary); margin: 0; font-size: .875rem; }
    .assistant-layout { flex: 1; display: grid; grid-template-columns: 1fr 280px; gap: 16px; min-height: 0; }
    @media(max-width: 768px) { .assistant-layout { grid-template-columns: 1fr; } .right-panel { display: none; } }
    /* chat */
    .chat-panel { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; }
    .messages-wrap { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; scroll-behavior: smooth; }
    /* welcome */
    .welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 32px 16px; margin: auto 0; }
    .welcome-icon { width: 64px; height: 64px; border-radius: 16px; background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.25); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; mat-icon { font-size: 32px; width: 32px; height: 32px; color: #a78bfa; } }
    .welcome h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
    .welcome p { color: var(--text-secondary); max-width: 360px; font-size: .85rem; margin: 0 0 24px; line-height: 1.6; }
    .suggestions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; max-width: 500px; }
    .sug-card { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 13px; cursor: pointer; text-align: left; font-size: .78rem; color: var(--text-secondary); transition: all .2s; }
    .sug-card:hover { border-color: rgba(139,92,246,.3); color: var(--text-primary); background: rgba(139,92,246,.05); }
    .sug-icon { font-size: 1.1rem; flex-shrink: 0; }
    /* messages */
    .msg-row { display: flex; align-items: flex-end; gap: 9px; animation: msg-in .25s ease; }
    .user-row { flex-direction: row-reverse; }
    @keyframes msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .msg-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: .72rem; font-weight: 700; mat-icon { font-size: 15px; width: 15px; height: 15px; } }
    .ai-av { background: rgba(139,92,246,.2); border: 1px solid rgba(139,92,246,.3); mat-icon { color: #a78bfa; } }
    .user-av { background: rgba(0,102,140,.4); border: 1.5px solid rgba(113,196,239,.35); color: #71c4ef; }
    .bubble { max-width: 78%; border-radius: 16px; padding: 10px 14px 8px; }
    .ai-bubble { background: rgba(255,255,255,.04); border: 1px solid var(--border-color); border-bottom-left-radius: 4px; }
    .user-bubble { background: linear-gradient(135deg,#00668c,#005a7a); color: #fff; border-bottom-right-radius: 4px; }
    .bubble-text { font-size: .84rem; line-height: 1.65; white-space: pre-wrap; word-break: break-word; color: var(--text-primary); }
    .user-bubble .bubble-text { color: #fff; }
    ::ng-deep .bubble-text code { background: rgba(139,92,246,.15); border-radius: 4px; padding: 1px 5px; font-size: .8em; color: #a78bfa; }
    .bubble-time { font-size: .6rem; opacity: .45; margin-top: 5px; text-align: right; }
    .copy-btn { display: inline-flex; align-items: center; gap: 5px; background: rgba(139,92,246,.12); border: 1px solid rgba(139,92,246,.2); border-radius: 6px; padding: 4px 10px; font-size: .72rem; font-weight: 600; color: #a78bfa; cursor: pointer; margin-top: 8px; transition: all .2s; mat-icon { font-size: 13px; width: 13px; height: 13px; } }
    .copy-btn:hover { background: rgba(139,92,246,.25); }
    .typing { display: flex; align-items: center; gap: 5px; padding: 14px 18px !important; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(139,92,246,.5); animation: db 1.2s infinite; }
    .dot:nth-child(2) { animation-delay: .18s; }
    .dot:nth-child(3) { animation-delay: .36s; }
    @keyframes db { 0%,60%,100%{transform:translateY(0);opacity:.5} 30%{transform:translateY(-6px);opacity:1} }
    /* input */
    .input-bar { padding: 12px 16px 10px; border-top: 1px solid var(--border-color); flex-shrink: 0; }
    .input-wrap { display: flex; align-items: flex-end; gap: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(139,92,246,.15); border-radius: 12px; padding: 9px 12px; transition: border-color .2s; }
    .input-wrap.focused { border-color: rgba(139,92,246,.4); }
    textarea { flex: 1; background: none; border: none; outline: none; color: var(--text-primary); font-family: inherit; font-size: .875rem; line-height: 1.5; resize: none; max-height: 140px; overflow-y: auto; }
    textarea::placeholder { color: rgba(255,255,255,.2); }
    .send-btn { width: 34px; height: 34px; border-radius: 9px; background: rgba(139,92,246,.2); border: 1px solid rgba(139,92,246,.3); color: #a78bfa; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; mat-icon { font-size: 16px; width: 16px; height: 16px; } mat-spinner { --mdc-circular-progress-active-indicator-color: #a78bfa; } }
    .send-btn:hover:not(:disabled) { background: rgba(139,92,246,.35); }
    .send-btn:disabled { opacity: .45; cursor: not-allowed; }
    .input-hint { font-size: .68rem; color: var(--text-secondary); margin-top: 7px; kbd { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 3px; padding: 1px 4px; font-size: .65rem; } }
    /* right panel */
    .right-panel { display: flex; flex-direction: column; gap: 12px; }
    .rp-card { background: var(--surface); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; }
    .rp-title { font-size: .8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: .5px; }
    .rp-sub { font-size: .78rem; color: var(--text-secondary); margin: 0 0 12px; line-height: 1.5; }
    .qa-btn { display: flex; align-items: center; gap: 10px; width: 100%; background: rgba(255,255,255,.03); border: 1px solid rgba(139,92,246,.1); border-radius: 9px; padding: 10px 12px; cursor: pointer; text-align: left; transition: all .2s; margin-bottom: 6px; }
    .qa-btn:last-child { margin-bottom: 0; }
    .qa-btn:hover { background: rgba(139,92,246,.08); border-color: rgba(139,92,246,.25); }
    .qa-icon { font-size: 1.3rem; flex-shrink: 0; }
    .qa-label { font-size: .8rem; font-weight: 600; color: var(--text-primary); }
    .qa-sub { font-size: .7rem; color: var(--text-secondary); }
    .go-editor-btn { display: inline-flex; align-items: center; gap: 7px; background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.25); border-radius: 8px; padding: 9px 16px; font-size: .82rem; font-weight: 700; color: #a78bfa; text-decoration: none; transition: all .2s; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .go-editor-btn:hover { background: rgba(139,92,246,.28); }
  `],
})
export class BuildAiAssistantComponent {
  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  inputText = '';
  focused = false;

  get userInitial(): string {
    try {
      const u = JSON.parse(localStorage.getItem('sti_user') || '{}');
      return (u.full_name || 'U')[0].toUpperCase();
    } catch { return 'U'; }
  }

  suggestions = [
    { icon: '🏗️', text: 'How do I structure a SaaS landing page?' },
    { icon: '🎨', text: 'What makes a website look modern and professional?' },
    { icon: '⚡', text: 'Write a hero section with glassmorphism CSS' },
    { icon: '📱', text: 'How to make my website responsive?' },
  ];

  quickActions = [
    { icon: '🚀', label: 'Plan a Website', sub: 'Get structure & sections', prompt: 'I want to build a portfolio website for a full-stack developer. Give me a detailed plan: sections, color scheme, fonts, and key interactions to include.' },
    { icon: '🎨', label: 'Design Tips', sub: 'Color, typography, layout', prompt: 'Give me 10 professional web design tips for making a dark-theme website look stunning and modern. Include specific CSS techniques.' },
    { icon: '⚙️', label: 'Debug Code', sub: 'Fix issues in my code', prompt: 'I have a CSS layout issue. My flexbox items are not centering properly. Can you explain the most common flexbox centering mistakes and how to fix them?' },
    { icon: '📚', label: 'Learn CSS', sub: 'Glassmorphism & effects', prompt: 'Teach me how to create glassmorphism cards in CSS. Give me the exact CSS code with explanation of each property.' },
  ];

  onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  autoResize(e: Event): void {
    const ta = e.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }

  sendMessage(text?: string): void {
    const msg = (text || this.inputText).trim();
    if (!msg || this.loading()) return;

    this.messages.update(m => [...m, { role: 'user', content: msg, timestamp: new Date() }]);
    this.inputText = '';
    this.loading.set(true);

    // Call AI Coding Agent or fallback to direct message
    const agentUrl = 'http://localhost:8001/api/v1/agent/stream';
    const body = JSON.stringify({ query: msg, repo_path: '' });
    let fullText = '';

    fetch(agentUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    .then(resp => {
      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = '';
      const pump = (): Promise<void> => reader.read().then(({ done, value }) => {
        if (done) { this.loading.set(false); this._pushAssistant(fullText); return; }
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const prev = lines[i - 1] || '';
          const evType = prev.startsWith('event: ') ? prev.slice(7).trim() : 'token';
          if (line.startsWith('data: ') && evType === 'token') {
            fullText += line.slice(6).replace(/\\n/g, '\n');
          }
        }
        return pump();
      });
      return pump();
    })
    .catch(() => {
      this.loading.set(false);
      this._pushAssistant('⚠️ AI Assistant (port 8001) is not running. Start it with: `uvicorn app.main:app --port 8001` in the `ai-coding-agent` folder.');
    });
  }

  private _pushAssistant(text: string): void {
    if (text.trim()) {
      this.messages.update(m => [...m, { role: 'assistant', content: text, timestamp: new Date() }]);
    }
  }

  formatMsg(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  copyToEditor(content: string): void {
    localStorage.setItem('sti_template_prompt', content);
    window.location.href = '/build';
  }
}
