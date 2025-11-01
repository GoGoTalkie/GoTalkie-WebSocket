# File Upload Feature

## Overview

GoTalkie WebSocket Chat now supports uploading and previewing C/C++ source code files with syntax highlighting.

## Features

- **File Upload**: Upload C/C++ files (.c, .cpp, .h, .hpp, .cc, .cxx) up to 1MB
- **Syntax Highlighting**: Real-time syntax highlighting for keywords, strings, comments, functions, preprocessor directives
- **Code Preview**: Dark-theme code viewer with line numbers and file info
- **File Sharing**: Share files in private chats or group chats
- **Interactive Preview**: Both sender and receiver can preview files

## Supported File Types

| Extension | Type |
|-----------|------|
| .c | C Source |
| .cpp, .cc, .cxx | C++ Source |
| .h | C/C++ Header |
| .hpp | C++ Header |

**File Size Limit**: 1MB

## Usage

### Sending a File

1. Select a user or group to chat with
2. Click the **📎** button next to message input
3. Choose a C/C++ file from your computer
4. Review the syntax-highlighted preview
5. Click **"Send File"** to share
6. File appears in chat for both sender and recipient(s)

### Viewing a Received File

1. Locate the file attachment in chat
2. Click **"👁️ Preview"** button
3. View code with syntax highlighting and line numbers
4. Click **"Close"** when done

## Technical Details

### Frontend

**Files**:
- `static/index.html` - File input button and preview modal
- `static/js/file-handler.js` - Upload, preview, and rendering logic
- `static/js/websocket.js` - WebSocket message handling
- `static/js/chat.js` - Display file messages
- `static/style.css` - Styling for file UI components

**Key Features**:
- FileReader API for reading files
- Custom syntax highlighter for C/C++
- Responsive modal design
- Line number generation

### Backend

**Files**:
- `server/hub.go` - Message types and routing

**Message Types**:
- `file_private` - Private file messages
- `file_group` - Group file messages

**Data Structure**:
```go
type FileData struct {
    Name    string `json:"name"`
    Content string `json:"content"`
    Size    int    `json:"size"`
    Type    string `json:"type"`
}
```

### Message Format

**Private File Message**:
```json
{
  "type": "file_private",
  "from": "alice",
  "to": "bob",
  "file": {
    "name": "example.c",
    "content": "// source code...",
    "size": 1024,
    "type": "text/plain"
  }
}
```

**Group File Message**:
```json
{
  "type": "file_group",
  "from": "alice",
  "group_name": "developers",
  "file": {
    "name": "example.cpp",
    "content": "// source code...",
    "size": 2048,
    "type": "text/plain"
  }
}
```

## Syntax Highlighting

The preview supports basic C/C++ syntax highlighting:

| Element | Color | Example |
|---------|-------|---------|
| Keywords | Blue | `int`, `void`, `class`, `return` |
| Strings | Orange | `"hello"`, `'c'` |
| Comments | Green (italic) | `// comment`, `/* block */` |
| Numbers | Light Green | `42`, `3.14`, `0xFF` |
| Functions | Yellow | Function names before `(` |
| Preprocessor | Purple | `#include`, `#define` |

## UI Components

### File Attachment Card
- File type badge (colored)
- File name and size display
- Preview button with eye icon

### Code Preview Modal
- **Header**: File name and close button
- **Info Bar**: File type, size, line count
- **Code Viewer**: Syntax-highlighted code with line numbers
- **Footer**: Close and Send buttons

## Security

1. **File Type Validation**: Only C/C++ files accepted
2. **Size Limit**: 1MB maximum prevents memory issues
3. **Client-Side Validation**: Fast feedback before upload
4. **HTML Escaping**: Prevents XSS in code display
5. **No Server Storage**: Files transmitted via WebSocket only

## Testing

Use the included example files:
- `example_test.c` - Sample C program
- `example_test.cpp` - Sample C++ program

**Test Steps**:
1. Start server: `go run cmd/server/main.go`
2. Open two browser tabs
3. Login with different names
4. Start a chat
5. Upload an example file
6. Preview and send
7. Verify recipient receives and can preview

## Browser Compatibility

Requires modern browsers with:
- WebSocket support
- FileReader API support
- ES6 JavaScript support

Tested on: Chrome, Firefox, Edge, Safari

## Future Enhancements

- Support for more languages (Python, JavaScript, Go)
- Download file functionality
- Copy-to-clipboard button
- Multi-file upload
- File compression
- Persistent storage option
