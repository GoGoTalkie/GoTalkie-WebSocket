let ws;
let myName = '';

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

function joinGroup(groupName) {
    ws.send(JSON.stringify({
        type: 'join_group',
        group_name: groupName
    }));
}

function createGroupRequest(groupName) {
    ws.send(JSON.stringify({
        type: 'create_group',
        group_name: groupName
    }));
}
