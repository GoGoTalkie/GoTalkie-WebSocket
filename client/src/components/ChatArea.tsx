import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message } from '../types';
import stickers, { Sticker } from '../stickers';

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
  const [showStickers, setShowStickers] = useState(false);
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

  const handleStickerClick = (s: Sticker) => {
    if (!currentChat) return;
    // Send sticker by id so other clients can map to local assets
    onSendMessage(`sticker:${s.id}`);
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
        {messages.map((msg, index) => {
          const isSticker = msg.content?.startsWith('sticker:');
          const stickerId = isSticker ? msg.content!.slice('sticker:'.length) : undefined;
          const stickerObj = stickerId ? stickers.find((st) => st.id === stickerId) : undefined;
          return (
            <div
              key={index}
              className={`message ${msg.from === myName ? 'own' : 'other'}`}
            >
              <div className="message-sender">{msg.from}</div>
              <div className={`message-content ${isSticker ? 'sticker-content' : ''}`}>
                {isSticker ? (
                  stickerObj ? (
                    <div className="sticker">
                      <img src={stickerObj.src} alt={stickerObj.alt} />
                    </div>
                  ) : (
                    <div className="sticker">{stickerId}</div>
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <button
          className="sticker-button"
          onClick={() => setShowStickers((s) => !s)}
          aria-label="Toggle stickers"
          disabled={!currentChat}
        >
          😊
        </button>
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

      {showStickers && (
        <div className="sticker-panel">
          {stickers.map((s) => (
            <button
              key={s.id}
              className="sticker-item"
              onClick={() => handleStickerClick(s)}
              aria-label={`Send sticker ${s.alt}`}
            >
              <img src={s.src} alt={s.alt} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatArea;
