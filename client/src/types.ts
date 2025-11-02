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
  LEAVE_GROUP: 'leave_group',
  CREATE_GROUP: 'create_group',
  FILE_PRIVATE: 'file_private',
  FILE_GROUP: 'file_group',
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

export interface FileData {
  name: string;
  content: string;
  size: number;
  type: string;
}

export interface Message {
  type: MessageType;
  content?: string;
  from?: string;
  to?: string;
  group_name?: string;
  file?: FileData;
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

export interface UnreadCounts {
  [chatKey: string]: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
