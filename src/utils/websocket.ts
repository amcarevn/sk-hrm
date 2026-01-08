import { io, Socket } from 'socket.io-client';
// Simple EventEmitter implementation for browser
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
      return true;
    }
    return false;
  }

  off(event: string, listener: Function): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    }
    return this;
  }
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  chatbotId: string;
  userId: string;
  message: string;
  timestamp: Date;
}

export interface ChatResponse {
  id: string;
  conversationId: string;
  chatbotId: string;
  response: string;
  timestamp: Date;
  metadata?: any;
  originalMessage?: ChatMessage;
}

export interface WebSocketEvents {
  'chat:response': (data: ChatResponse) => void;
  'chat:error': (data: { message: string; error: string }) => void;
  'conversation:update': (data: any) => void;
  'document:processed': (data: any) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

export class WebSocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private isConnected = false;
  // Unused variable - keeping for future reconnect logic
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    super();
  }

  /**
   * Connect to WebSocket server
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const wsUrl =
        import.meta.env.VITE_MANAGEMENT_SOCKET_URL?.replace('http', 'ws') ||
        'ws://localhost:8000';

      this.socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 60000, // Tăng timeout lên 60 giây
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        forceNew: true, // Force new connection
        upgrade: true, // Allow upgrade to WebSocket
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('WebSocket connected');
        this.emit('connect');
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log('WebSocket disconnected:', reason);
        this.emit('disconnect', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.emit('connect_error', error);
        reject(error);
      });

      // Handle chat events
      this.socket.on('chat:response', (data: ChatResponse) => {
        console.log('Received chat response:', data);
        this.emit('chat:response', data);
      });

      this.socket.on(
        'chat:error',
        (data: { message: string; error: string }) => {
          console.error('Chat error:', data);
          this.emit('chat:error', data);
        }
      );

      this.socket.on('conversation:update', (data: any) => {
        console.log('Conversation updated:', data);
        this.emit('conversation:update', data);
      });

      this.socket.on('document:processed', (data: any) => {
        console.log('Document processed:', data);
        this.emit('document:processed', data);
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Send a chat message
   */
  sendChatMessage(message: ChatMessage): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('chat:message', message);
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('conversation:join', conversationId);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('conversation:leave', conversationId);
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Listen to WebSocket events
   */
  on<T extends keyof WebSocketEvents>(
    event: T,
    listener: WebSocketEvents[T]
  ): this {
    super.on(event, listener);
    return this;
  }

  /**
   * Remove event listener
   */
  off<T extends keyof WebSocketEvents>(
    event: T,
    listener: WebSocketEvents[T]
  ): this {
    super.off(event, listener);
    return this;
  }

  /**
   * Emit custom event
   */
  emit<T extends keyof WebSocketEvents>(
    event: T,
    ...args: Parameters<WebSocketEvents[T]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

// Create singleton instance
export const websocketClient = new WebSocketClient();

// Export types
