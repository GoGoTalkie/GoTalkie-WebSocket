let ws;
let myName = '';
let currentChat = null; // {type: 'private'|'group', name: '...'}
let chats = {}; // stores messages for each chat

function connect() {
    const name = document.getElementById('username').value.trim();
    if (!name) {
        document.getElementById('error').textContent = 'Please enter a name';
        return;
    }

    ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.onopen = () => {
        ws.send(JSON.stringify({type: 'register', content: name}));
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };

    ws.onerror = () => {
        showNotification('Connection failed', 'error');
    };

    ws.onclose = (event) => {
        // Check if it's a normal closure or forced closure
        if (event.code === 1000) {
            // Normal closure
            showNotification('Connection closed', 'info');
        } else if (event.code === 1006) {
            // same name in use
            showNotification('This name is already in use', 'warning');
        } else {
            // Unexpected closure
            showNotification('Connection lost. Please try again', 'error');
        }
        
        setTimeout(() => {
            location.reload();
        }, 2000);
    };
}

function handleMessage(msg) {
    if (msg.type === 'error') {
        showNotification(msg.error, 'error');
        return;
    }

    if (msg.type === 'duplicate_login') {
        showNotification('This account is being logged in from another location', 'warning');
        return;
    }

    if (msg.type === 'kicked') {
        showNotification('You have been disconnected due to login from another device', 'warning');
        setTimeout(() => {
            ws.close();
            location.reload();
        }, 2000);
        return;
    }

    if (msg.type === 'register') {
        myName = msg.content.split(' ').pop();
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('my-name').textContent = myName;
        return;
    }

    if (msg.type === 'client_list') {
        updateUsersList(msg.clients);
        return;
    }

    if (msg.type === 'group_list') {
        updateGroupsList(msg.groups);
        return;
    }

    if (msg.type === 'private') {
        const chatKey = msg.from === myName ? msg.to : msg.from;
        if (!chats[chatKey]) chats[chatKey] = [];
        chats[chatKey].push(msg);
        if (currentChat && currentChat.type === 'private' && currentChat.name === chatKey) {
            displayMessages();
        }
        return;
    }

    if (msg.type === 'group_message') {
        const chatKey = 'group_' + msg.group_name;
        if (!chats[chatKey]) chats[chatKey] = [];
        chats[chatKey].push(msg);
        if (currentChat && currentChat.type === 'group' && currentChat.name === msg.group_name) {
            displayMessages();
        }
        return;
    }
}

function updateUsersList(users) {
    const list = document.getElementById('users-list');
    list.innerHTML = '';
    users.forEach(user => {
        if (user !== myName) {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.textContent = user;
            div.onclick = () => openPrivateChat(user);
            list.appendChild(div);
        }
    });
}

function updateGroupsList(groups) {
    const list = document.getElementById('groups-list');
    list.innerHTML = '';
    groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'list-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = group.name;
        div.appendChild(nameSpan);

        if (!group.members.includes(myName)) {
            const joinBtn = document.createElement('button');
            joinBtn.className = 'join-button';
            joinBtn.textContent = 'Join';
            joinBtn.onclick = (e) => {
                e.stopPropagation();
                joinGroup(group.name);
            };
            div.appendChild(joinBtn);
        }

        const membersDiv = document.createElement('div');
        membersDiv.className = 'group-members';
        membersDiv.textContent = 'Members: ' + group.members.join(', ');
        div.appendChild(membersDiv);

        div.onclick = () => {
            if (group.members.includes(myName)) {
                openGroupChat(group.name);
            }
        };
        list.appendChild(div);
    });
}

function openPrivateChat(user) {
    currentChat = {type: 'private', name: user};
    document.getElementById('chat-title').textContent = 'Private Chat with ' + user;
    if (!chats[user]) chats[user] = [];
    displayMessages();
}

function openGroupChat(groupName) {
    currentChat = {type: 'group', name: groupName};
    document.getElementById('chat-title').textContent = 'Group: ' + groupName;
    const chatKey = 'group_' + groupName;
    if (!chats[chatKey]) chats[chatKey] = [];
    displayMessages();
}

function displayMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';
    
    let chatKey = currentChat.type === 'private' ? currentChat.name : 'group_' + currentChat.name;
    const messages = chats[chatKey] || [];
    
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message ' + (msg.from === myName ? 'own' : 'other');
        
        const sender = document.createElement('div');
        sender.className = 'message-sender';
        sender.textContent = msg.from;
        div.appendChild(sender);
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = msg.content;
        div.appendChild(content);
        
        container.appendChild(div);
    });
    
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    if (!content || !currentChat) return;

    if (currentChat.type === 'private') {
        ws.send(JSON.stringify({
            type: 'private',
            to: currentChat.name,
            content: content
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'group_message',
            group_name: currentChat.name,
            content: content
        }));
    }

    input.value = '';
}

function createGroup() {
    const name = prompt('Enter group name:');
    if (name && name.trim()) {
        ws.send(JSON.stringify({
            type: 'create_group',
            group_name: name.trim()
        }));
    }
}

function joinGroup(groupName) {
    ws.send(JSON.stringify({
        type: 'join_group',
        group_name: groupName
    }));
}

document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') connect();
});

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
