import { Message, MessageType, MessageTypes, FileData } from '../types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandler: ((msg: Message) => void) | null = null;
  private url: string;

  constructor(url?: string) {
    // Auto-detect WebSocket URL based on environment
    if (url) {
      this.url = url;
    } else {
      // Use environment variable if available, otherwise auto-detect
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = import.meta.env.VITE_WS_URL || window.location.host || 'localhost:8080';
      this.url = `${wsProtocol}//${wsHost}/ws`;
    }
    // console.log('WebSocket URL:', this.url);
  }

  connect(
    username: string,
    onMessage: (msg: Message) => void,
    onError: () => void,
    onClose: (code: number) => void
  ): void {
    this.messageHandler = onMessage;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.send(MessageTypes.REGISTER, username);
    };

    this.ws.onmessage = (event) => {
      const msg: Message = JSON.parse(event.data);
      if (this.messageHandler) {
        this.messageHandler(msg);
      }
    };

    this.ws.onerror = () => {
      onError();
    };

    this.ws.onclose = (event) => {
      onClose(event.code);
    };
  }

  send(type: MessageType, content?: string, to?: string, group_name?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: Message = { type };
      if (content !== undefined) message.content = content;
      if (to !== undefined) message.to = to;
      if (group_name !== undefined) message.group_name = group_name;
      
      // console.log('Sending WebSocket message:', message);
      this.ws.send(JSON.stringify(message));
    }
  }

  sendFile(file: FileData, type: 'private' | 'group', target: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: Message = {
        type: type === 'private' ? MessageTypes.FILE_PRIVATE : MessageTypes.FILE_GROUP,
        file: file
      };
      
      if (type === 'private') {
        message.to = target;
      } else {
        message.group_name = target;
      }
      
      // console.log('Sending file message:', {
      //   type: message.type,
      //   to: message.to,
      //   group_name: message.group_name,
      //   fileName: file.name,
      //   fileSize: file.size
      // });
      
      this.ws.send(JSON.stringify(message));
    }
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
