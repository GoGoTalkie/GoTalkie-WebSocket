import React, { useState, useEffect, useRef } from 'react';
import { NotificationType, Group } from '../types';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (groupName: string) => void;
  onNotify: (message: string, type: NotificationType) => void;
  existingGroups: Group[];
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  onClose,
  onCreate,
  onNotify,
  existingGroups,
}) => {
  const [groupName, setGroupName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = () => {
    const name = groupName.trim();

    if (!name) {
      onNotify('Please enter a group name', 'warning');
      return;
    }

    if (name.length < 3) {
      onNotify('Group name must be at least 3 characters', 'warning');
      return;
    }

    // Check for duplicate group names
    const isDuplicate = existingGroups.some(
      (group) => group.name.toLowerCase() === name.toLowerCase()
    );
    
    if (isDuplicate) {
      onNotify('Group name already exists', 'error');
      return;
    }

    onCreate(name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3>Create New Group</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <label htmlFor="group-name-input">Group Name</label>
          <input
            ref={inputRef}
            type="text"
            id="group-name-input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter group name"
            maxLength={50}
          />
          <div className="modal-hint">Choose a unique name for your group</div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-create" onClick={handleCreate}>
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
