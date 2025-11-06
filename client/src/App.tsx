import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Group, Chat, MessageTypes, NotificationType, UnreadCounts } from './types';
import { WebSocketService } from './services/websocket';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Notification from './components/Notification';
import CreateGroupModal from './components/CreateGroupModal';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myName, setMyName] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const wsService = useRef<WebSocketService>(new WebSocketService());
  const myNameRef = useRef<string>(''); // Store latest myName value
  const currentChatRef = useRef<Chat | null>(null); // Store latest currentChat value

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Helper function to add message to chat and update unread count
  const addMessageToChat = useCallback((msg: Message, chatKey: string, expectedChatType: 'private' | 'group') => {
    const currentMyName = myNameRef.current;
    
    // Don't add our own messages (already added when sending)
    if (msg.from === currentMyName) return;
    
    setChats((prev) => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), msg],
    }));
    
    // Update unread count if chat is not currently open
    const currentOpenChat = currentChatRef.current;
    const isChatOpen = currentOpenChat?.type === expectedChatType && 
      (expectedChatType === 'private' ? currentOpenChat.name === chatKey : 'group_' + currentOpenChat.name === chatKey);
    
    if (!isChatOpen) {
      setUnreadCounts((prev) => ({
        ...prev,
        [chatKey]: (prev[chatKey] || 0) + 1,
      }));
    }
  }, []);

  // Helper function to handle private messages
  const handlePrivateMessage = useCallback((msg: Message) => {
    const currentMyName = myNameRef.current;
    const chatKey = msg.from === currentMyName ? msg.to! : msg.from!;
    addMessageToChat(msg, chatKey, 'private');
  }, [addMessageToChat]);

  // Helper function to handle group messages
  const handleGroupMessage = useCallback((msg: Message) => {
    const chatKey = 'group_' + msg.group_name;
    addMessageToChat(msg, chatKey, 'group');
  }, [addMessageToChat]);

  // Helper function to handle authentication/connection messages
  const handleAuthMessage = useCallback((msg: Message) => {
    switch (msg.type) {
      case MessageTypes.ERROR:
        showNotification(msg.error || 'An error occurred', 'error');
        break;
      case MessageTypes.DUPLICATE_LOGIN:
        showNotification('This account is being logged in from another location', 'warning');
        break;
      case MessageTypes.KICKED:
        showNotification('You have been disconnected due to login from another device', 'warning');
        setTimeout(() => {
          wsService.current.close();
          window.location.reload();
        }, 2000);
        break;
      case MessageTypes.REGISTER:
        const name = msg.content?.split(' ').pop() || '';
        setMyName(name);
        myNameRef.current = name;
        setIsLoggedIn(true);
        break;
    }
  }, [showNotification]);

  // Helper function to handle list updates
  const handleListUpdate = useCallback((msg: Message) => {
    switch (msg.type) {
      case MessageTypes.CLIENT_LIST:
        setUsers(msg.clients || []);
        break;
      case MessageTypes.GROUP_LIST:
        setGroups(msg.groups || []);
        break;
    }
  }, []);

  const handleMessage = useCallback((msg: Message) => {
    // Handle authentication and connection messages
    const authTypes = [MessageTypes.ERROR, MessageTypes.DUPLICATE_LOGIN, MessageTypes.KICKED, MessageTypes.REGISTER] as const;
    if ((authTypes as readonly string[]).includes(msg.type)) {
      handleAuthMessage(msg);
      return;
    }

    // Handle list updates
    const listTypes = [MessageTypes.CLIENT_LIST, MessageTypes.GROUP_LIST] as const;
    if ((listTypes as readonly string[]).includes(msg.type)) {
      handleListUpdate(msg);
      return;
    }

    // Handle private messages and files
    const privateTypes = [MessageTypes.PRIVATE, MessageTypes.FILE_PRIVATE] as const;
    if ((privateTypes as readonly string[]).includes(msg.type)) {
      handlePrivateMessage(msg);
      return;
    }

    // Handle group messages and files
    const groupTypes = [MessageTypes.GROUP_MESSAGE, MessageTypes.FILE_GROUP] as const;
    if ((groupTypes as readonly string[]).includes(msg.type)) {
      handleGroupMessage(msg);
      return;
    }
  }, [handleAuthMessage, handleListUpdate, handlePrivateMessage, handleGroupMessage]);

  const handleConnect = (username: string) => {
    wsService.current.connect(
      username,
      handleMessage,
      () => showNotification('Connection failed', 'error'),
      (code) => {
        if (code === 1000) {
          showNotification('Connection closed', 'info');
        } else if (code === 1006) {
          showNotification('This name is already in use', 'warning');
        } else {
          showNotification('Connection lost. Please try again', 'error');
        }
        setTimeout(() => window.location.reload(), 2000);
      }
    );
  };

  const handleOpenPrivateChat = (user: string) => {
    const newChat = { type: 'private' as const, name: user };
    setCurrentChat(newChat);
    currentChatRef.current = newChat;
    
    // Clear unread count for this chat
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[user];
      return updated;
    });
  };

  const handleOpenGroupChat = (groupName: string) => {
    const newChat = { type: 'group' as const, name: groupName };
    setCurrentChat(newChat);
    currentChatRef.current = newChat;
    
    // Clear unread count for this group chat
    const chatKey = 'group_' + groupName;
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[chatKey];
      return updated;
    });
  };

  const handleSendMessage = (content: string) => {
    if (!currentChat) return;

    if (currentChat.type === 'private') {
      // Add our message to state immediately
      const myMessage: Message = {
        type: MessageTypes.PRIVATE,
        from: myName,
        to: currentChat.name,
        content: content,
      };
      
      const chatKey = currentChat.name;
      setChats((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), myMessage],
      }));
      
      // Send message to server
      wsService.current.send(MessageTypes.PRIVATE, content, currentChat.name);
    } else {
      // Add our message to state immediately (group)
      const myMessage: Message = {
        type: MessageTypes.GROUP_MESSAGE,
        from: myName,
        group_name: currentChat.name,
        content: content,
      };
      
      const chatKey = 'group_' + currentChat.name;
      setChats((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), myMessage],
      }));
      
      // Send message to server
      wsService.current.send(MessageTypes.GROUP_MESSAGE, content, undefined, currentChat.name);
    }
  };

  const handleSendFile = (file: import('./types').FileData, chatType: 'private' | 'group', chatName: string) => {
    const myMessage: Message = {
      type: chatType === 'private' ? MessageTypes.FILE_PRIVATE : MessageTypes.FILE_GROUP,
      from: myName,
      file: file
    };

    if (chatType === 'private') {
      myMessage.to = chatName;
      const chatKey = chatName;
      setChats((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), myMessage],
      }));
    } else {
      myMessage.group_name = chatName;
      const chatKey = 'group_' + chatName;
      setChats((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), myMessage],
      }));
    }

    // Send file to server
    wsService.current.sendFile(file, chatType, chatName);
    showNotification(`File "${file.name}" sent successfully`, 'success');
  };

  const handleJoinGroup = (groupName: string) => {
    // console.log('Joining group:', groupName);
    wsService.current.send(MessageTypes.JOIN_GROUP, undefined, undefined, groupName);
  };

  const handleLeaveGroup = (groupName: string) => {
    // console.log('Leaving group:', groupName);
    wsService.current.send(MessageTypes.LEAVE_GROUP, undefined, undefined, groupName);
    // If we're currently viewing this group chat, close it
    if (currentChat?.type === 'group' && currentChat.name === groupName) {
      setCurrentChat(null);
    }
    showNotification(`Left group "${groupName}"`, 'info');
  };

  const handleCreateGroup = (groupName: string) => {
    wsService.current.send(MessageTypes.CREATE_GROUP, undefined, undefined, groupName);
    setShowModal(false);
    showNotification('Creating group...', 'info');
  };

  const getCurrentMessages = (): Message[] => {
    if (!currentChat) return [];
    const chatKey = currentChat.type === 'private' 
      ? currentChat.name 
      : 'group_' + currentChat.name;
    return chats[chatKey] || [];
  };

  useEffect(() => {
    return () => {
      wsService.current.close();
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <>
        <Login onConnect={handleConnect} />
        {notification && (
          <Notification message={notification.message} type={notification.type} />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <Sidebar
        myName={myName}
        users={users}
        groups={groups}
        currentChat={currentChat}
        unreadCounts={unreadCounts}
        onOpenPrivateChat={handleOpenPrivateChat}
        onOpenGroupChat={handleOpenGroupChat}
        onJoinGroup={handleJoinGroup}
        onLeaveGroup={handleLeaveGroup}
        onCreateGroup={() => setShowModal(true)}
      />
      <ChatArea
        currentChat={currentChat}
        messages={getCurrentMessages()}
        myName={myName}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
      />
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateGroup}
          onNotify={showNotification}
          existingGroups={groups}
        />
      )}
    </div>
  );
}

export default App;
