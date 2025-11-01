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
      myNameRef.current = name; // Update ref
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
      const currentMyName = myNameRef.current; // Get value from ref
      const chatKey = msg.from === currentMyName ? msg.to! : msg.from!;
      
      // Don't add our own message (already added in handleSendMessage)
      if (msg.from !== currentMyName) {
        setChats((prev) => ({
          ...prev,
          [chatKey]: [...(prev[chatKey] || []), msg],
        }));
        
        // Increment unread count if this chat is not currently open
        const currentOpenChat = currentChatRef.current;
        if (!currentOpenChat || currentOpenChat.type !== 'private' || currentOpenChat.name !== chatKey) {
          setUnreadCounts((prev) => ({
            ...prev,
            [chatKey]: (prev[chatKey] || 0) + 1,
          }));
        }
      }
      return;
    }

    if (msg.type === MessageTypes.GROUP_MESSAGE) {
      const currentMyName = myNameRef.current; // Get value from ref
      const chatKey = 'group_' + msg.group_name;
      
      // Debug: see what server sent
      // console.log('📩 Received GROUP_MESSAGE:', {
      //   from: msg.from,
      //   myName: currentMyName,
      //   isMyMessage: msg.from === currentMyName,
      //   content: msg.content
      // });
      
      // Don't add our own message (already added in handleSendMessage)
      if (msg.from !== currentMyName) {
        // console.log('✅ Adding message from other user');
        setChats((prev) => ({
          ...prev,
          [chatKey]: [...(prev[chatKey] || []), msg],
        }));
        
        // Increment unread count if this group chat is not currently open
        const currentOpenChat = currentChatRef.current;
        if (!currentOpenChat || currentOpenChat.type !== 'group' || 'group_' + currentOpenChat.name !== chatKey) {
          setUnreadCounts((prev) => ({
            ...prev,
            [chatKey]: (prev[chatKey] || 0) + 1,
          }));
        }
      } else {
        // console.log('⏭️ Skipping my own message');
      }
      return;
    }
  }, [showNotification]); // Removed myName from dependency, using ref instead

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
      // console.log('📤 Sending GROUP message:', content);
      
      const myMessage: Message = {
        type: MessageTypes.GROUP_MESSAGE,
        from: myName,
        group_name: currentChat.name,
        content: content,
      };
      
      const chatKey = 'group_' + currentChat.name;
      // console.log('➕ Adding my message to local state');
      setChats((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), myMessage],
      }));
      
      // Send message to server
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
    currentChatRef.current = currentChat;
  }, [currentChat]);

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
          existingGroups={groups}
        />
      )}
    </div>
  );
}

export default App;
