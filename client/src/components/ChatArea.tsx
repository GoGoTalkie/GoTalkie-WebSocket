import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message } from '../types';

interface ChatAreaProps {
  currentChat: Chat | null;
  messages: Message[];
  myName: string;
  onSendMessage: (content: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  currentChat,
  messages,
  myName,
  onSendMessage,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const content = messageInput.trim();
    if (!content || !currentChat) return;
    
    onSendMessage(content);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const getChatTitle = () => {
    if (!currentChat) return 'Select a user or group';
    return currentChat.type === 'private'
      ? `Private Chat with ${currentChat.name}`
      : `Group: ${currentChat.name}`;
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h2>{getChatTitle()}</h2>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.from === myName ? 'own' : 'other'}`}
          >
            <div className="message-sender">{msg.from}</div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!currentChat}
        />
        <button onClick={handleSend} disabled={!currentChat}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatArea;
