let currentChat = null; // {type: 'private'|'group', name: '...'}
let chats = {}; // stores messages for each chat

function openPrivateChat(user) {
    // Remove all active states
    document.querySelectorAll('.list-item').forEach(item => item.classList.remove('active'));
    
    // Add active state to selected user
    const userItem = document.querySelector(`.user-item[data-user="${user}"]`);
    if (userItem) userItem.classList.add('active');
    
    const chatArea = document.getElementById('chat-area');
    chatArea.classList.add('fade-transition');
    
    setTimeout(() => {
        currentChat = {type: 'private', name: user};
        document.getElementById('chat-title').textContent = 'Private Chat with ' + user;
        if (!chats[user]) chats[user] = [];
        displayMessages();
        
        setTimeout(() => {
            chatArea.classList.remove('fade-transition');
        }, 50);
    }, 150);
}

function openGroupChat(groupName) {
    // Remove all active states
    document.querySelectorAll('.list-item').forEach(item => item.classList.remove('active'));
    
    // Add active state to selected group
    const groupItem = document.querySelector(`.group-item[data-group="${groupName}"]`);
    if (groupItem) groupItem.classList.add('active');
    
    const chatArea = document.getElementById('chat-area');
    chatArea.classList.add('fade-transition');
    
    setTimeout(() => {
        currentChat = {type: 'group', name: groupName};
        document.getElementById('chat-title').textContent = 'Group: ' + groupName;
        const chatKey = 'group_' + groupName;
        if (!chats[chatKey]) chats[chatKey] = [];
        displayMessages();
        
        setTimeout(() => {
            chatArea.classList.remove('fade-transition');
        }, 50);
    }, 150);
}

function displayMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';
    
    let chatKey = currentChat.type === 'private' ? currentChat.name : 'group_' + currentChat.name;
    const messages = chats[chatKey] || [];
    
    messages.forEach((msg) => {
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
    
    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById('messages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}
