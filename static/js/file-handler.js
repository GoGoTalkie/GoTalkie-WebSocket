// File handling for code file uploads and previews
let currentFile = null;
let currentFileData = null;

// File type extensions and their display names
const FILE_TYPES = {
    '.c': 'C',
    '.cpp': 'C++',
    '.cc': 'C++',
    '.cxx': 'C++',
    '.h': 'C/C++ Header',
    '.hpp': 'C++ Header'
};

// Trigger file input click
function triggerFileUpload() {
    if (!currentChat) {
        showNotification('Please select a user or group first', 'warning');
        return;
    }
    
    const fileInput = document.getElementById('file-input');
    fileInput.click();
}

// Initialize file input listener
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
});

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
        showNotification('File size must be less than 1MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Get file extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    // Check if it's a supported file type
    if (!FILE_TYPES[ext]) {
        showNotification('Only C/C++ files are supported (.c, .cpp, .h, .hpp)', 'warning');
        event.target.value = '';
        return;
    }
    
    currentFile = file;
    
    // Read file content
    const reader = new FileReader();
    reader.onload = function(e) {
        currentFileData = e.target.result;
        showFilePreview(file.name, currentFileData, ext);
    };
    reader.onerror = function() {
        showNotification('Error reading file', 'error');
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
}

// Show file preview modal
function showFilePreview(fileName, content, ext) {
    const modal = document.getElementById('file-preview-modal');
    const fileNameEl = document.getElementById('preview-file-name');
    const fileTypeLabel = document.getElementById('file-type-label');
    const fileSizeLabel = document.getElementById('file-size-label');
    const fileLinesLabel = document.getElementById('file-lines-label');
    const codeContent = document.getElementById('code-content');
    const lineNumbers = document.getElementById('line-numbers');
    
    // Set file info
    fileNameEl.textContent = fileName;
    fileTypeLabel.textContent = FILE_TYPES[ext] || 'Code';
    
    const sizeKB = (currentFile.size / 1024).toFixed(2);
    fileSizeLabel.textContent = `${sizeKB} KB`;
    
    const lines = content.split('\n');
    fileLinesLabel.textContent = `${lines.length} lines`;
    
    // Apply syntax highlighting
    const highlightedCode = highlightCode(content, ext);
    codeContent.innerHTML = highlightedCode;
    
    // Generate line numbers
    let lineNumbersHTML = '';
    for (let i = 1; i <= lines.length; i++) {
        lineNumbersHTML += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = lineNumbersHTML;
    
    // Show modal
    modal.style.display = 'flex';
}

// Close file preview modal
function closeFilePreview() {
    const modal = document.getElementById('file-preview-modal');
    modal.style.display = 'none';
    currentFile = null;
    currentFileData = null;
}

// Confirm and send file
function confirmFileSend() {
    if (!currentFile || !currentFileData || !currentChat) {
        return;
    }
    
    // Create file message
    const fileMessage = {
        type: currentChat.type === 'private' ? 'file_private' : 'file_group',
        to: currentChat.type === 'private' ? currentChat.name : undefined,
        group_name: currentChat.type === 'group' ? currentChat.name : undefined,
        file: {
            name: currentFile.name,
            content: currentFileData,
            size: currentFile.size,
            type: currentFile.type
        }
    };
    
    // Send via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(fileMessage));
        showNotification(`File "${currentFile.name}" sent successfully`, 'success');
        closeFilePreview();
    } else {
        showNotification('Connection lost. Please reconnect.', 'error');
    }
}

// Basic syntax highlighting for C/C++
function highlightCode(code, ext) {
    // Escape HTML
    code = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Keywords
    const keywords = [
        'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
        'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
        'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
        'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
        'unsigned', 'void', 'volatile', 'while', '_Bool', '_Complex', '_Imaginary',
        'class', 'namespace', 'template', 'typename', 'public', 'private',
        'protected', 'virtual', 'friend', 'operator', 'new', 'delete', 'this',
        'try', 'catch', 'throw', 'using', 'bool', 'true', 'false', 'nullptr',
        'constexpr', 'decltype', 'explicit', 'export', 'mutable', 'override',
        'final', 'noexcept', 'static_assert', 'thread_local'
    ];
    
    // Highlight keywords
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        code = code.replace(regex, '<span class="keyword">$1</span>');
    });
    
    // Highlight preprocessor directives
    code = code.replace(/^(#\s*\w+.*?)$/gm, '<span class="preprocessor">$1</span>');
    
    // Highlight strings
    code = code.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="string">"$1"</span>');
    code = code.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<span class="string">\'$1\'</span>');
    
    // Highlight comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    code = code.replace(/\/\/.*/g, '<span class="comment">$&</span>');
    
    // Highlight numbers
    code = code.replace(/\b(\d+\.?\d*[fFlLuU]*)\b/g, '<span class="number">$1</span>');
    
    // Highlight function calls
    code = code.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="function">$1</span>(');
    
    return code;
}

// Show file attachment in messages
function renderFileMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message ' + (msg.from === myName ? 'own' : 'other');
    
    const sender = document.createElement('div');
    sender.className = 'message-sender';
    sender.textContent = msg.from;
    div.appendChild(sender);
    
    const fileAttachment = document.createElement('div');
    fileAttachment.className = 'file-attachment';
    
    const fileIcon = document.createElement('div');
    fileIcon.className = 'file-icon';
    const ext = '.' + msg.file.name.split('.').pop().toLowerCase();
    fileIcon.textContent = FILE_TYPES[ext] || 'File';
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info-inline';
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = msg.file.name;
    
    const fileSize = document.createElement('div');
    fileSize.className = 'file-size';
    const sizeKB = (msg.file.size / 1024).toFixed(2);
    fileSize.textContent = `${sizeKB} KB`;
    
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);
    
    const previewBtn = document.createElement('button');
    previewBtn.className = 'file-preview-btn';
    previewBtn.textContent = '👁️ Preview';
    previewBtn.onclick = function() {
        showReceivedFilePreview(msg.file.name, msg.file.content, ext);
    };
    
    fileAttachment.appendChild(fileIcon);
    fileAttachment.appendChild(fileInfo);
    fileAttachment.appendChild(previewBtn);
    
    div.appendChild(fileAttachment);
    
    return div;
}

// Show preview for received file
function showReceivedFilePreview(fileName, content, ext) {
    const modal = document.getElementById('file-preview-modal');
    const fileNameEl = document.getElementById('preview-file-name');
    const fileTypeLabel = document.getElementById('file-type-label');
    const fileSizeLabel = document.getElementById('file-size-label');
    const fileLinesLabel = document.getElementById('file-lines-label');
    const codeContent = document.getElementById('code-content');
    const lineNumbers = document.getElementById('line-numbers');
    const sendBtn = document.querySelector('.btn-send-file');
    
    // Hide send button for received files
    sendBtn.style.display = 'none';
    
    // Set file info
    fileNameEl.textContent = fileName;
    fileTypeLabel.textContent = FILE_TYPES[ext] || 'Code';
    
    const sizeBytes = new Blob([content]).size;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    fileSizeLabel.textContent = `${sizeKB} KB`;
    
    const lines = content.split('\n');
    fileLinesLabel.textContent = `${lines.length} lines`;
    
    // Apply syntax highlighting
    const highlightedCode = highlightCode(content, ext);
    codeContent.innerHTML = highlightedCode;
    
    // Generate line numbers
    let lineNumbersHTML = '';
    for (let i = 1; i <= lines.length; i++) {
        lineNumbersHTML += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = lineNumbersHTML;
    
    // Show modal
    modal.style.display = 'flex';
}

// Override close to reset send button visibility
const originalCloseFilePreview = closeFilePreview;
closeFilePreview = function() {
    const sendBtn = document.querySelector('.btn-send-file');
    sendBtn.style.display = 'block';
    originalCloseFilePreview();
};
