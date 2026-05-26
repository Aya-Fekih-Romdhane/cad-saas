import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private client?: Client;
  private connected = false;

  connect(): void {
    if (this.connected || this.client?.active) return;

    // Convert http(s):// → ws(s):// and append the STOMP endpoint path
    const wsUrl = environment.apiUrl.replace(/^http/, 'ws') + '/ws';

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${this.auth.getAccessToken() ?? ''}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
      },
      onDisconnect: () => {
        this.connected = false;
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame.headers['message']);
      }
    });

    this.client.activate();
  }

  subscribeToProject(projectId: string): Observable<any> {
    this.connect();

    return new Observable(observer => {
      let stompSub: { unsubscribe: () => void } | null = null;

      const waitForConnect = setInterval(() => {
        if (this.connected && this.client?.connected) {
          clearInterval(waitForConnect);
          stompSub = this.client!.subscribe(
            `/topic/generation/${projectId}`,
            (msg: IMessage) => {
              try {
                observer.next(JSON.parse(msg.body));
              } catch {
                observer.next(msg.body);
              }
            }
          );
        }
      }, 200);

      return () => {
        clearInterval(waitForConnect);
        stompSub?.unsubscribe();
      };
    });
  }

  disconnect(): void {
    this.client?.deactivate();
    this.connected = false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
