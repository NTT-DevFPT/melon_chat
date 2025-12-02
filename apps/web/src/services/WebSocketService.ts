import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client;
  private connected: boolean = false;
  private subscriptions: Map<string, any> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private baseReconnectDelay: number = 1000; // 1 second
  private maxReconnectDelay: number = 30000; // 30 seconds
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionHealthy: boolean = true;

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:3000/ws'), // Use proxy
      // webSocketFactory: () => new SockJS('http://localhost:8080/ws'), // Direct if no proxy
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 0, // We'll handle reconnection manually
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('WebSocket connected: ' + frame);
      this.connected = true;
      this.connectionHealthy = true;
      this.reconnectAttempts = 0; // Reset on successful connection
      this.startHeartbeat();
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      this.connectionHealthy = false;
      this.handleReconnection();
    };

    this.client.onWebSocketClose = (event) => {
      console.log('WebSocket connection closed', event);
      this.connected = false;
      this.connectionHealthy = false;
      this.stopHeartbeat();
      this.handleReconnection();
    };

    this.client.onWebSocketError = (event) => {
      console.error('WebSocket error:', event);
      this.connectionHealthy = false;
      this.handleReconnection();
    };
  }

  connect(token: string, onConnect?: () => void) {
    if (this.connected && this.connectionHealthy) return;

    this.client.connectHeaders = {
      Authorization: `Bearer ${token}`,
    };

    const originalOnConnect = this.client.onConnect;
    this.client.onConnect = (frame) => {
      if (originalOnConnect) originalOnConnect(frame);
      if (onConnect) onConnect();
    };

    try {
      this.client.activate();
    } catch (error) {
      console.error('Failed to activate WebSocket client:', error);
      this.handleReconnection();
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.client.active) {
      this.client.deactivate();
    }
    this.connected = false;
    this.connectionHealthy = false;
    this.reconnectAttempts = 0;
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    // Add jitter (±25% of delay)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    const finalDelay = Math.max(delay + jitter, 1000);

    console.log(
      `Attempting to reconnect in ${Math.round(finalDelay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.connected && !this.client.active) {
        console.log('Attempting WebSocket reconnection...');
        try {
          this.client.activate();
        } catch (error) {
          console.error('Reconnection attempt failed:', error);
          this.handleReconnection();
        }
      }
    }, finalDelay);
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat

    // Send a heartbeat every 30 seconds to check connection health
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.client.active) {
        try {
          // Send a ping message to check if connection is alive
          this.client.publish({
            destination: '/app/ping',
            body: JSON.stringify({ timestamp: Date.now() }),
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
          this.connectionHealthy = false;
          this.handleReconnection();
        }
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  subscribe(topic: string, callback: (message: any) => void) {
    if (!this.client.active) {
      console.warn('Cannot subscribe, client not active');
      return;
    }

    if (this.subscriptions.has(topic)) {
      return; // Already subscribed
    }

    const subscription = this.client.subscribe(topic, (message: Message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        console.error('Failed to parse message body', e);
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, subscription);
  }

  unsubscribe(topic: string) {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  isConnected(): boolean {
    return this.connected && this.connectionHealthy;
  }

  getConnectionStatus(): {
    connected: boolean;
    healthy: boolean;
    attempts: number;
  } {
    return {
      connected: this.connected,
      healthy: this.connectionHealthy,
      attempts: this.reconnectAttempts,
    };
  }

  // Force a reconnection (useful for testing or manual recovery)
  forceReconnect() {
    console.log('Forcing WebSocket reconnection...');
    this.disconnect();
    this.reconnectAttempts = 0;
    // Small delay to ensure clean disconnection
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        this.connect(token);
      }
    }, 100);
  }

  // Send typing indicator
  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    if (!this.client.active) {
      console.warn('Cannot send typing indicator, client not active');
      return;
    }

    try {
      this.client.publish({
        destination: `/app/typing/${conversationId}`,
        body: JSON.stringify({ isTyping }),
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }

  // Subscribe to typing events
  subscribeToTyping(conversationId: string, callback: (event: any) => void) {
    const topic = `/topic/typing/${conversationId}`;
    this.subscribe(topic, callback);
  }

  // Unsubscribe from typing events
  unsubscribeFromTyping(conversationId: string) {
    const topic = `/topic/typing/${conversationId}`;
    this.unsubscribe(topic);
  }
}

export const webSocketService = new WebSocketService();
