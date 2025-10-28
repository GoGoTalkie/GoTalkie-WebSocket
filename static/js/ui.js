function updateUsersList(users) {
    const list = document.getElementById('users-list');
    list.innerHTML = '';
    users.forEach(user => {
        if (user !== myName) {
            const div = document.createElement('div');
            div.className = 'list-item user-item';
            div.setAttribute('data-user', user);
            div.textContent = user;
            div.onclick = () => openPrivateChat(user);
            
            // Highlight if this is the current chat
            if (currentChat && currentChat.type === 'private' && currentChat.name === user) {
                div.classList.add('active');
            }
            
            list.appendChild(div);
        }
    });
}

function updateGroupsList(groups) {
    const list = document.getElementById('groups-list');
    list.innerHTML = '';
    groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'list-item group-item';
        div.setAttribute('data-group', group.name);
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'group-header';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'group-name';
        nameSpan.textContent = group.name;
        headerDiv.appendChild(nameSpan);

        if (!group.members.includes(myName)) {
            const joinBtn = document.createElement('button');
            joinBtn.className = 'join-button';
            joinBtn.innerHTML = '<span class="join-icon">+</span> Join';
            joinBtn.onclick = (e) => {
                e.stopPropagation();
                joinGroup(group.name);
            };
            headerDiv.appendChild(joinBtn);
        }
        
        div.appendChild(headerDiv);

        const membersDiv = document.createElement('div');
        membersDiv.className = 'group-members';
        membersDiv.innerHTML = `<span class="member-icon">👥</span> ${group.members.length} member${group.members.length > 1 ? 's' : ''}`;
        div.appendChild(membersDiv);

        div.onclick = () => {
            if (group.members.includes(myName)) {
                openGroupChat(group.name);
            }
        };
        
        // Highlight if this is the current chat
        if (currentChat && currentChat.type === 'group' && currentChat.name === group.name) {
            div.classList.add('active');
        }
        
        list.appendChild(div);
    });
}

function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };
    return icons[type] || icons['info'];
}

function createGroup() {
    showModal();
}

function showModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3>Create New Group</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <label for="group-name-input">Group Name</label>
                <input type="text" id="group-name-input" placeholder="Enter group name" maxlength="50" />
                <div class="modal-hint">Choose a unique name for your group</div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
                <button class="btn-create" onclick="confirmCreateGroup()">Create Group</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('group-name-input').focus();
    }, 100);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Create on Enter key
    document.getElementById('group-name-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmCreateGroup();
    });
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.add('fade-out');
        setTimeout(() => modal.remove(), 200);
    }
}

function confirmCreateGroup() {
    const input = document.getElementById('group-name-input');
    const name = input.value.trim();
    
    if (!name) {
        showNotification('Please enter a group name', 'warning');
        return;
    }
    
    if (name.length < 3) {
        showNotification('Group name must be at least 3 characters', 'warning');
        return;
    }
    
    createGroupRequest(name);
    
    closeModal();
    showNotification('Creating group...', 'info');
}
