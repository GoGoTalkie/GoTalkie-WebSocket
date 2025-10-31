import { Message, MessageType, MessageTypes } from '../types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandler: ((msg: Message) => void) | null = null;
  private url: string;

  constructor(url: string = 'ws://localhost:8080/ws') {
    this.url = url;
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
