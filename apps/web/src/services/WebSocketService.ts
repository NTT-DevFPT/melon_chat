import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    private client: Client;
    private connected: boolean = false;
    private subscriptions: Map<string, any> = new Map();

    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:3000/ws'), // Use proxy
            // webSocketFactory: () => new SockJS('http://localhost:8080/ws'), // Direct if no proxy
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
            console.log('Connected: ' + frame);
            this.connected = true;
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        this.client.onWebSocketClose = () => {
            console.log('WebSocket connection closed');
            this.connected = false;
        };
    }

    connect(token: string, onConnect?: () => void) {
        if (this.connected) return;

        this.client.connectHeaders = {
            Authorization: `Bearer ${token}`,
        };

        const originalOnConnect = this.client.onConnect;
        this.client.onConnect = (frame) => {
            if (originalOnConnect) originalOnConnect(frame);
            if (onConnect) onConnect();
        };

        this.client.activate();
    }

    disconnect() {
        if (this.client.active) {
            this.client.deactivate();
        }
        this.connected = false;
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
        return this.connected;
    }
}

export const webSocketService = new WebSocketService();
