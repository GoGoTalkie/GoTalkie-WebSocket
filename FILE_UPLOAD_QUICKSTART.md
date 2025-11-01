# File Upload Quick Start Guide

## At a Glance

**What**: Upload and share C/C++ code files with syntax highlighting  
**File Types**: .c, .cpp, .h, .hpp, .cc, .cxx  
**Max Size**: 1MB  
**Where**: Private chats and group chats

## Quick Steps

### Send a File
```
1. Open chat → 2. Click 📎 → 3. Select file → 4. Preview → 5. Send
```

### View a File
```
1. Find file in chat → 2. Click 👁️ Preview → 3. View code → 4. Close
```

## UI Elements

### File Button
- **Location**: Next to message input
- **Icon**: 📎 (paperclip)
- **Action**: Opens file picker

### File Attachment
```
┌────────────────────────────────────┐
│ [C++]  example.cpp       [👁️ Preview] │
│        2.5 KB                      │
└────────────────────────────────────┘
```

### Preview Modal
```
┌─────────────────────────────────────┐
│ example.c                      [×]  │
├─────────────────────────────────────┤
│ C | 2.5 KB | 45 lines              │
├───┬─────────────────────────────────┤
│ 1 │ #include <stdio.h>              │
│ 2 │ int main() {                    │
│ 3 │     printf("Hello!\n");         │
│...│                                  │
├───┴─────────────────────────────────┤
│              [Close]  [Send File]   │
└─────────────────────────────────────┘
```

## Syntax Colors

- **Blue**: Keywords (`int`, `void`, `return`)
- **Orange**: Strings (`"text"`, `'c'`)
- **Green**: Comments (`//`, `/* */`)
- **Yellow**: Functions
- **Purple**: Preprocessor (`#include`, `#define`)
- **Light Green**: Numbers

## Common Actions

### Upload File
1. Must select a chat first (user or group)
2. Click 📎 button
3. Choose C/C++ file (max 1MB)
4. Wait for preview to load
5. Review syntax-highlighted code
6. Click "Send File"

### Preview Received File
1. Scroll to file attachment in chat
2. Click "👁️ Preview" button
3. Modal opens with code
4. Scroll to view all code
5. Click "Close" to exit

## Error Messages

| Error | Reason | Solution |
|-------|--------|----------|
| "Please select a user or group first" | No chat selected | Select a user or group |
| "File size must be less than 1MB" | File too large | Choose smaller file |
| "Only C/C++ files are supported" | Wrong file type | Select .c, .cpp, .h, or .hpp file |
| "Connection lost" | WebSocket closed | Refresh page and reconnect |

## Tips

✅ **DO**:
- Select chat before uploading
- Use files under 1MB
- Preview code before sending
- Check file type matches supported formats

❌ **DON'T**:
- Upload non-C/C++ files
- Upload files over 1MB
- Click upload without selecting chat
- Upload binary/compiled files

## Keyboard Shortcuts

- **Enter** in message input: Send text message
- **Click 📎**: Open file picker
- **Esc**: Close preview modal (via [×] button)

## Example Workflow

### Scenario: Sharing Code for Review

1. **Alice** wants to share code with **Bob**
2. Alice clicks on Bob's name in user list
3. Alice clicks 📎 button
4. Alice selects `my_code.cpp`
5. Preview modal shows highlighted code
6. Alice reviews and clicks "Send File"
7. File appears in chat with green notification
8. Bob sees file attachment in chat
9. Bob clicks "👁️ Preview"
10. Bob reviews Alice's code with syntax highlighting

### Scenario: Group Code Sharing

1. **Charlie** creates group "Team Alpha"
2. **Alice** and **Bob** join the group
3. Charlie opens group chat
4. Charlie uploads `algorithm.c`
5. Both Alice and Bob receive the file
6. All members can preview the code

## Testing Files

Two example files are included:

- **`example_test.c`**: C program with functions, loops, printf
- **`example_test.cpp`**: C++ program with classes, templates, STL

Use these to test the feature!

## Troubleshooting

**File won't upload?**
- Check file size (must be ≤ 1MB)
- Verify file extension (.c, .cpp, .h, .hpp)
- Ensure chat is selected

**Preview not showing?**
- Refresh the page
- Check browser console for errors
- Verify file is text-based (not binary)

**File not received?**
- Check recipient is online
- Verify WebSocket connection
- Check for network issues

## Technical Notes

- Files transmitted via WebSocket (not HTTP)
- No server-side storage (files in memory only)
- Client-side syntax highlighting
- Files encoded as text in JSON messages
- Real-time transmission to recipients

## Quick Reference Card

```
ACTION              BUTTON/KEY
─────────────────────────────────
Upload File         📎
Preview File        👁️ Preview
Close Preview       × or Close
Send File           Send File
Select Chat         Click user/group
```

## Need More Info?

See **FILE_UPLOAD_FEATURE.md** for complete documentation.
