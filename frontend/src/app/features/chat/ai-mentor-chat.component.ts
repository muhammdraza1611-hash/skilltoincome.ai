import {
  Component, OnInit, inject, signal,
  ViewChild, ElementRef, AfterViewInit, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../core/services/chat.service';
import { AuthStore } from '../../core/store/auth.store';
import { ChatMessage } from '../../core/models/roadmap.model';

@Component({
  selector: 'app-ai-mentor-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="chat-page">

      <!-- ── header ── -->
      <div class="chat-header">
        <div class="header-left">
          <div class="ai-avatar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <line x1="12" y1="15" x2="12" y2="17"/>
            </svg>
            <span class="ai-online-dot"></span>
          </div>
          <div class="header-info">
            <h1>AI Mentor</h1>
            <div class="status-row">
              <span class="status-dot"></span>
              <span class="status-txt">Online · Powered by GPT-4o-mini</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="icon-btn" (click)="newSession()" matTooltip="New conversation">
            <mat-icon>add_comment</mat-icon>
          </button>
          <button class="icon-btn" (click)="clearMessages()" matTooltip="Clear chat">
            <mat-icon>delete_outline</mat-icon>
          </button>
        </div>
      </div>

      <!-- ── chat body ── -->
      <div class="chat-body">

        <!-- messages list -->
        <div class="messages-wrap" #messagesEl>

          <!-- welcome state -->
          @if (messages().length === 0 && !responding()) {
            <div class="welcome-state">
              <div class="welcome-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7.4V18h2v2h-6v-2h2v-1.6C7.5 15.5 5 12.5 5 9a7 7 0 0 1 7-7z"/>
                  <circle cx="12" cy="9" r="2" fill="#71c4ef" stroke="none"/>
                </svg>
              </div>
              <h2>Hi {{ firstName }}, I'm your AI Mentor</h2>
              <p>I know your skills, career goals, and roadmap progress. Ask me anything.</p>

              <div class="prompt-grid">
                @for (prompt of starterPrompts; track prompt.text) {
                  <button class="prompt-card" (click)="sendStarter(prompt.text)">
                    <span class="prompt-icon">{{ prompt.icon }}</span>
                    <span class="prompt-text">{{ prompt.text }}</span>
                  </button>
                }
              </div>
            </div>
          }

          <!-- messages -->
          @for (msg of messages(); track $index) {
            <div class="msg-row" [class.user-row]="msg.role === 'user'" [class.ai-row]="msg.role === 'assistant'">

              @if (msg.role === 'assistant') {
                <div class="msg-avatar ai-msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7.4V18h2v2h-6v-2h2v-1.6C7.5 15.5 5 12.5 5 9a7 7 0 0 1 7-7z"/>
                  </svg>
                </div>
              }

              <div class="msg-bubble" [class.user-bubble]="msg.role === 'user'" [class.ai-bubble]="msg.role === 'assistant'">
                <div class="bubble-content" [innerHTML]="formatMessage(msg.content)"></div>
                <div class="bubble-time">{{ msg.timestamp | date:'HH:mm' }}</div>
              </div>

              @if (msg.role === 'user') {
                <div class="msg-avatar user-msg-avatar">{{ userInitials }}</div>
              }
            </div>
          }

          <!-- typing indicator -->
          @if (responding()) {
            <div class="msg-row ai-row">
              <div class="msg-avatar ai-msg-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7.4V18h2v2h-6v-2h2v-1.6C7.5 15.5 5 12.5 5 9a7 7 0 0 1 7-7z"/>
                </svg>
              </div>
              <div class="msg-bubble ai-bubble typing-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          }
        </div>

        <!-- ── input bar ── -->
        <div class="input-bar">
          <div class="input-wrap" [class.focused]="inputFocused">
            <textarea
              #inputEl
              [(ngModel)]="inputText"
              placeholder="Ask your AI mentor anything…"
              rows="1"
              (keydown)="onKeydown($event)"
              (focus)="inputFocused = true"
              (blur)="inputFocused = false"
              (input)="autoResize()"
              [disabled]="responding()"
            ></textarea>
            <button
              class="send-btn"
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || responding()"
              aria-label="Send"
            >
              @if (responding()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              }
            </button>
          </div>
          <div class="input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── page layout ── */
    .chat-page {
      max-width: 860px; margin: 0 auto;
      height: calc(100vh - 116px);
      display: flex; flex-direction: column;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── header ── */
    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 0 16px; flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }

    .ai-avatar {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(0,102,140,.2);
      border: 1.5px solid rgba(113,196,239,.3);
      display: flex; align-items: center; justify-content: center;
      position: relative;
      box-shadow: 0 0 16px rgba(0,102,140,.25);
    }
    .ai-online-dot {
      position: absolute; bottom: 2px; right: 2px;
      width: 10px; height: 10px; border-radius: 50%;
      background: #4cbe7d;
      border: 2px solid var(--background);
      animation: blink 2s ease-in-out infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

    h1 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 3px; }
    .status-row { display: flex; align-items: center; gap: 6px; }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #4cbe7d;
      animation: blink 2s ease-in-out infinite;
    }
    .status-txt { font-size: .72rem; color: var(--text-secondary); }

    .header-right { display: flex; gap: 6px; }
    .icon-btn {
      width: 36px; height: 36px; border-radius: 9px;
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary);
      transition: background .2s, color .2s;
      mat-icon { font-size: 20px; }
    }
    .icon-btn:hover { background: var(--hover-bg); color: #71c4ef; }

    /* ── chat body ── */
    .chat-body {
      flex: 1; min-height: 0;
      display: flex; flex-direction: column;
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      overflow: hidden;
    }

    /* ── messages ── */
    .messages-wrap {
      flex: 1; overflow-y: auto;
      padding: 24px 24px 16px;
      display: flex; flex-direction: column; gap: 16px;
      scroll-behavior: smooth;
    }

    /* ── welcome ── */
    .welcome-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 32px 20px; text-align: center; margin: auto 0;
    }
    .welcome-icon {
      width: 72px; height: 72px; border-radius: 18px;
      background: rgba(0,102,140,.15);
      border: 1.5px solid rgba(113,196,239,.25);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 0 24px rgba(0,102,140,.2);
    }
    .welcome-state h2 {
      font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
      margin: 0 0 8px;
    }
    .welcome-state p { font-size: .875rem; color: var(--text-secondary); margin: 0 0 28px; }

    .prompt-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px; width: 100%; max-width: 680px;
    }
    .prompt-card {
      background: var(--surface-2, #101f2e);
      border: 1px solid var(--border-color);
      border-radius: 11px; padding: 12px 14px;
      cursor: pointer; text-align: left;
      display: flex; align-items: flex-start; gap: 10px;
      transition: border-color .2s, background .2s, transform .2s;
    }
    .prompt-card:hover {
      border-color: rgba(113,196,239,.3);
      background: rgba(113,196,239,.05);
      transform: translateY(-1px);
    }
    .prompt-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
    .prompt-text { font-size: .82rem; color: var(--text-primary); line-height: 1.45; font-weight: 500; }

    /* ── message rows ── */
    .msg-row {
      display: flex; align-items: flex-end; gap: 10px;
      animation: msg-in .3s ease both;
    }
    .user-row { flex-direction: row-reverse; }
    @keyframes msg-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* avatars */
    .msg-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: .72rem; font-weight: 700;
    }
    .ai-msg-avatar {
      background: rgba(0,102,140,.2);
      border: 1px solid rgba(113,196,239,.25);
    }
    .user-msg-avatar {
      background: rgba(0,102,140,.4);
      border: 1.5px solid rgba(113,196,239,.35);
      color: #71c4ef;
    }

    /* bubbles */
    .msg-bubble {
      max-width: 72%; border-radius: 18px;
      padding: 11px 15px 8px;
      position: relative;
    }
    .ai-bubble {
      background: var(--surface-2, #101f2e);
      border: 1px solid var(--border-color);
      border-bottom-left-radius: 4px;
      color: var(--text-primary);
    }
    .user-bubble {
      background: linear-gradient(135deg, #00668c, #005a7a);
      border-bottom-right-radius: 4px;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0,102,140,.35);
    }

    .bubble-content {
      font-size: .875rem; line-height: 1.65;
      white-space: pre-wrap; word-break: break-word;
    }

    /* inline code */
    ::ng-deep .bubble-content code {
      background: rgba(113,196,239,.12);
      border: 1px solid rgba(113,196,239,.15);
      border-radius: 4px; padding: 1px 5px;
      font-size: .82em; font-family: 'Fira Code', monospace;
      color: #71c4ef;
    }
    /* bold */
    ::ng-deep .bubble-content strong { color: inherit; font-weight: 700; }
    /* bullet list */
    ::ng-deep .bubble-content ul { padding-left: 18px; margin: 6px 0; }
    ::ng-deep .bubble-content li { margin-bottom: 3px; }

    .bubble-time {
      font-size: .62rem; opacity: .45; margin-top: 5px;
      text-align: right;
    }

    /* typing */
    .typing-bubble {
      display: flex; align-items: center; gap: 5px;
      padding: 14px 18px !important;
    }
    .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: rgba(113,196,239,.5);
      animation: dot-bounce 1.2s infinite;
    }
    .dot:nth-child(2) { animation-delay: .18s; }
    .dot:nth-child(3) { animation-delay: .36s; }
    @keyframes dot-bounce {
      0%,60%,100% { transform: translateY(0); opacity: .5; }
      30% { transform: translateY(-7px); opacity: 1; }
    }

    /* ── input bar ── */
    .input-bar {
      padding: 14px 18px 12px;
      border-top: 1px solid var(--border-color);
      flex-shrink: 0;
      background: var(--surface);
    }

    .input-wrap {
      display: flex; align-items: flex-end; gap: 10px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(113,196,239,.15);
      border-radius: 14px; padding: 10px 12px;
      transition: border-color .2s, box-shadow .2s;
    }
    .input-wrap.focused {
      border-color: rgba(113,196,239,.4);
      box-shadow: 0 0 0 3px rgba(113,196,239,.08);
    }

    textarea {
      flex: 1; background: none; border: none; outline: none;
      resize: none; color: var(--text-primary);
      font-family: 'Inter', system-ui, sans-serif;
      font-size: .9rem; line-height: 1.5;
      max-height: 160px; overflow-y: auto;
      padding: 0;
    }
    textarea::placeholder { color: var(--text-secondary); }
    textarea:disabled { opacity: .5; }

    .send-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: #00668c; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0;
      transition: background .2s, transform .15s, opacity .2s;
      box-shadow: 0 3px 12px rgba(0,102,140,.4);
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .send-btn:hover:not(:disabled) {
      background: #005a7a; transform: scale(1.05);
    }
    .send-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

    .input-hint {
      font-size: .68rem; color: var(--text-secondary);
      margin-top: 7px; padding-left: 2px;
      kbd {
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
        border-radius: 3px; padding: 1px 4px; font-size: .65rem;
        font-family: 'Inter', system-ui, sans-serif;
      }
    }
  `],
})
export class AiMentorChatComponent implements OnInit, AfterViewInit {
  @ViewChild('messagesEl') messagesEl!: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl')    inputEl!:    ElementRef<HTMLTextAreaElement>;

  private chatService = inject(ChatService);
  private authStore   = inject(AuthStore);
  private zone        = inject(NgZone);

  messages   = signal<ChatMessage[]>([]);
  responding = signal(false);
  inputText  = '';
  inputFocused = false;

  sessionId = this.makeSession();

  get firstName(): string {
    return (this.authStore.user()?.full_name ?? '').split(' ')[0] || 'there';
  }
  get userInitials(): string {
    const n = this.authStore.user()?.full_name || '';
    return n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  }

  starterPrompts = [
    { icon: '🎯', text: 'What should I learn next based on my skills?' },
    { icon: '💰', text: 'How can I get my first freelance client?' },
    { icon: '📁', text: 'How do I improve my portfolio?' },
    { icon: '🚀', text: 'Which skills are trending in 2025?' },
    { icon: '⏱️', text: 'How long will it take me to become job-ready?' },
    { icon: '🗺️', text: 'Explain my current roadmap progress' },
  ];

  ngOnInit(): void {
    // Load history if session exists in storage
    const saved = sessionStorage.getItem('sti_chat_session');
    if (saved) {
      this.sessionId = saved;
      this.chatService.getHistory(this.sessionId).subscribe({
        next: (history: any[]) => {
          const msgs: ChatMessage[] = history.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
            timestamp: new Date(h.created_at),
          }));
          this.messages.set(msgs);
          this.scrollToBottom();
        },
        error: () => {},
      });
    }
  }

  ngAfterViewInit(): void {
    this.inputEl?.nativeElement.focus();
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(): void {
    const el = this.inputEl?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  sendStarter(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  sendMessage(): void {
    const msg = this.inputText.trim();
    if (!msg || this.responding()) return;

    this.messages.update(m => [...m, { role: 'user', content: msg, timestamp: new Date() }]);
    this.inputText = '';
    // reset textarea height
    if (this.inputEl?.nativeElement) {
      this.inputEl.nativeElement.style.height = 'auto';
    }
    this.responding.set(true);
    this.scrollToBottom();

    this.chatService.sendMessage(msg, this.sessionId).subscribe({
      next: (res) => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: res.response,
          timestamp: new Date(),
        }]);
        this.responding.set(false);
        this.scrollToBottom();
        this.inputEl?.nativeElement.focus();
      },
      error: (err) => {
        const detail = err?.error?.detail || 'Sorry, I had trouble responding. Please check your API key.';
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: detail,
          timestamp: new Date(),
        }]);
        this.responding.set(false);
        this.scrollToBottom();
      },
    });
  }

  newSession(): void {
    this.sessionId = this.makeSession();
    sessionStorage.setItem('sti_chat_session', this.sessionId);
    this.messages.set([]);
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  /** Format message — bold, bullet points, inline code */
  formatMessage(text: string): string {
    return text
      // bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // inline `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // bullet lines starting with • or -
      .replace(/^[•\-]\s(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      // line breaks
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  private makeSession(): string {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('sti_chat_session', id);
    return id;
  }
}
