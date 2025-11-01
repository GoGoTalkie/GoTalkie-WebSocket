import React, { useState, useEffect, useRef } from 'react';
import stickers, { Sticker } from '../stickers';
import { Chat, Message, FileData } from '../types';
import FilePreviewModal from './FilePreviewModal';
import FileMessage from './FileMessage';

interface ChatAreaProps {
  currentChat: Chat | null;
  messages: Message[];
  myName: string;
  onSendMessage: (content: string) => void;
  onSendFile: (file: FileData, chatType: 'private' | 'group', chatName: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  currentChat,
  messages,
  myName,
  onSendMessage,
  onSendFile,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [previewFile, setPreviewFile] = useState<{file: File, content: string} | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);

  // ตรวจสอบว่าผู้ใช้อยู่ล่างสุดหรือไม่
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isAtBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    isAtBottomRef.current = isAtBottom;
  };

  // ติด event listener สำหรับ scroll
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // scroll เมื่อ message ใหม่เข้ามา
  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];

    // scroll ถ้า message สุดท้ายเป็นของเรา หรือ user อยู่ล่างสุด
    if (lastMessage.from === myName || isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      isAtBottomRef.current = true;
    }
  }, [messages, myName]);

  const handleSend = () => {
    const content = messageInput.trim();
    if (!content || !currentChat) return;

    onSendMessage(content);
    setMessageInput('');
    // auto-scroll จะเกิดจาก useEffect ด้านบน
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleStickerClick = (s: Sticker) => {
    if (!currentChat) return;
    onSendMessage(`sticker:${s.id}`);
  };

  const handleFileButtonClick = () => {
    if (!currentChat) {
      alert('Please select a user or group first');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 2MB');
      e.target.value = '';
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedFile(file);
      setFileContent(content);
      setShowPreview(true);
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsText(file);

    e.target.value = '';
  };

  const handleSendFile = () => {
    if (!selectedFile || !fileContent || !currentChat) return;

    const fileData: FileData = {
      name: selectedFile.name,
      content: fileContent,
      size: selectedFile.size,
      type: selectedFile.type
    };

    onSendFile(fileData, currentChat.type, currentChat.name);
    setShowPreview(false);
    setSelectedFile(null);
    setFileContent('');
  };

  const handlePreviewReceivedFile = (file: FileData) => {
    // Create a fake File object for preview
    const fakeFile = new File([file.content], file.name, { type: file.type });
    setPreviewFile({ file: fakeFile, content: file.content });
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

      <div className="messages" ref={messagesContainerRef}>
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
              {msg.file ? (
                <FileMessage 
                  file={msg.file} 
                  onPreview={() => handlePreviewReceivedFile(msg.file!)}
                />
              ) : (
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
              )}
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
          ref={fileInputRef}
          type="file"
          accept=".c,.cpp,.h,.hpp,.cc,.cxx,.py,.js,.java,.go,.rs,.ts,.jsx,.tsx,.json,.xml,.html,.css,.sql,.sh,.bat,.md,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button 
          className="file-button" 
          onClick={handleFileButtonClick}
          disabled={!currentChat}
          title="Attach file"
        >
          📎
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
      {showPreview && selectedFile && (
        <FilePreviewModal
          file={selectedFile}
          content={fileContent}
          onClose={() => {
            setShowPreview(false);
            setSelectedFile(null);
            setFileContent('');
          }}
          onSend={handleSendFile}
        />
      )}
      {previewFile && (
        <FilePreviewModal
          file={previewFile.file}
          content={previewFile.content}
          onClose={() => setPreviewFile(null)}
          onSend={() => {}}
          isReceived={true}
        />
      )}
    </div>
  );
};

export default ChatArea;
