import React, { useEffect, useState } from 'react';
import { NotificationType } from '../types';

interface NotificationProps {
  message: string;
  type: NotificationType;
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2700);

    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    return icons[type] || icons.info;
  };

  return (
    <div className={`notification notification-${type} ${fadeOut ? 'fade-out' : ''}`}>
      <div className="notification-content">
        <span className="notification-icon">{getIcon()}</span>
        <span className="notification-message">{message}</span>
      </div>
    </div>
  );
};

export default Notification;
