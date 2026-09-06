import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = inject(ApiService);

  sendMessage(message: string, sessionId?: string): Observable<{ response: string; session_id: string }> {
    return this.api.post('/chat/message', { message, session_id: sessionId });
  }

  getHistory(sessionId: string): Observable<any[]> {
    return this.api.get(`/chat/history/${sessionId}`);
  }
}
