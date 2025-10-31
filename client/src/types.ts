// Message types that match the Go backend
export const MessageTypes = {
  REGISTER: 'register',
  ERROR: 'error',
  DUPLICATE_LOGIN: 'duplicate_login',
  KICKED: 'kicked',
  CLIENT_LIST: 'client_list',
  GROUP_LIST: 'group_list',
  PRIVATE: 'private',
  GROUP_MESSAGE: 'group_message',
  JOIN_GROUP: 'join_group',
  CREATE_GROUP: 'create_group',
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

export interface Message {
  type: MessageType;
  content?: string;
  from?: string;
  to?: string;
  group_name?: string;
  clients?: string[];
  groups?: Group[];
  error?: string;
}

export interface Group {
  name: string;
  members: string[];
}

export interface Chat {
  type: 'private' | 'group';
  name: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
