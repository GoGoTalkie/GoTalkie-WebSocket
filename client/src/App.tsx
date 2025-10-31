import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Group, Chat, MessageTypes, NotificationType } from './types';
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
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const wsService = useRef<WebSocketService>(new WebSocketService());

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleMessage = useCallback((msg: Message) => {
    if (msg.type === MessageTypes.ERROR) {
      showNotification(msg.error || 'An error occurred', 'error');
      return;
    }

    if (msg.type === MessageTypes.DUPLICATE_LOGIN) {
      showNotification('This account is being logged in from another location', 'warning');
      return;
    }

    if (msg.type === MessageTypes.KICKED) {
      showNotification('You have been disconnected due to login from another device', 'warning');
      setTimeout(() => {
        wsService.current.close();
        window.location.reload();
      }, 2000);
      return;
    }

    if (msg.type === MessageTypes.REGISTER) {
      const name = msg.content?.split(' ').pop() || '';
      setMyName(name);
      setIsLoggedIn(true);
      return;
    }

    if (msg.type === MessageTypes.CLIENT_LIST) {
      setUsers(msg.clients || []);
      return;
    }

    if (msg.type === MessageTypes.GROUP_LIST) {
      setGroups(msg.groups || []);
      return;
    }

    if (msg.type === MessageTypes.PRIVATE) {
      const chatKey = msg.from === myName ? msg.to! : msg.from!;
      setChats((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), msg],
      }));
      return;
    }

    if (msg.type === MessageTypes.GROUP_MESSAGE) {
      const chatKey = 'group_' + msg.group_name;
      setChats((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), msg],
      }));
      return;
    }
  }, [myName, showNotification]);

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
    setCurrentChat({ type: 'private', name: user });
  };

  const handleOpenGroupChat = (groupName: string) => {
    setCurrentChat({ type: 'group', name: groupName });
  };

  const handleSendMessage = (content: string) => {
    if (!currentChat) return;

    if (currentChat.type === 'private') {
      wsService.current.send(MessageTypes.PRIVATE, content, currentChat.name);
    } else {
      wsService.current.send(MessageTypes.GROUP_MESSAGE, content, undefined, currentChat.name);
    }
  };

  const handleJoinGroup = (groupName: string) => {
    wsService.current.send(MessageTypes.JOIN_GROUP, undefined, undefined, groupName);
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
        onOpenPrivateChat={handleOpenPrivateChat}
        onOpenGroupChat={handleOpenGroupChat}
        onJoinGroup={handleJoinGroup}
        onCreateGroup={() => setShowModal(true)}
      />
      <ChatArea
        currentChat={currentChat}
        messages={getCurrentMessages()}
        myName={myName}
        onSendMessage={handleSendMessage}
      />
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateGroup}
          onNotify={showNotification}
        />
      )}
    </div>
  );
}

export default App;
