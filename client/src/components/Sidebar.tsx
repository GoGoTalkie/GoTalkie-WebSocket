import React from 'react';
import { Group, Chat } from '../types';

interface SidebarProps {
  myName: string;
  users: string[];
  groups: Group[];
  currentChat: Chat | null;
  onOpenPrivateChat: (user: string) => void;
  onOpenGroupChat: (groupName: string) => void;
  onJoinGroup: (groupName: string) => void;
  onCreateGroup: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  myName,
  users,
  groups,
  currentChat,
  onOpenPrivateChat,
  onOpenGroupChat,
  onJoinGroup,
  onCreateGroup,
}) => {
  return (
    <div className="sidebar">
      <div className="section">
        <h3>Your Name</h3>
        <div className="my-name">{myName}</div>
      </div>

      <div className="section">
        <h3>Online Users</h3>
        <div className="users-list">
          {users.map((user) => {
            if (user === myName) return null;
            const isActive = currentChat?.type === 'private' && currentChat.name === user;
            return (
              <div
                key={user}
                className={`list-item user-item ${isActive ? 'active' : ''}`}
                onClick={() => onOpenPrivateChat(user)}
              >
                {user}
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <h3>Groups</h3>
        <button className="create-button" onClick={onCreateGroup}>
          + Create Group
        </button>
        <div className="groups-list">
          {groups.map((group) => {
            const isActive = currentChat?.type === 'group' && currentChat.name === group.name;
            const isMember = group.members.includes(myName);
            return (
              <div
                key={group.name}
                className={`list-item group-item ${isActive ? 'active' : ''}`}
                onClick={() => isMember && onOpenGroupChat(group.name)}
              >
                <div className="group-header">
                  <span className="group-name">{group.name}</span>
                  {!isMember && (
                    <button
                      className="join-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinGroup(group.name);
                      }}
                    >
                      <span className="join-icon">+</span> Join
                    </button>
                  )}
                </div>
                <div className="group-members">
                  <span className="member-icon">👥</span> {group.members.length} member
                  {group.members.length > 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
