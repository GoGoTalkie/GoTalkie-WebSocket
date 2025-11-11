# GoTalkie-WebSocket - System Architecture & Structure

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture Diagram](#system-architecture-diagram)
4. [Directory Structure](#directory-structure)
5. [Component Architecture](#component-architecture)
6. [Data Flow](#data-flow)
7. [Deployment Architecture](#deployment-architecture)
8. [Key Components Explanation](#key-components-explanation)

---

## 🎯 Project Overview

**GoTalkie-WebSocket** เป็น Real-time Chat Application ที่สร้างด้วย **WebSocket Protocol (RFC 6455)** รองรับการสื่อสารแบบ Full-duplex ระหว่าง Client และ Server

### Core Features
- ✅ **Private Chat** - แชทส่วนตัว 1-on-1
- ✅ **Group Chat** - แชทกลุ่มแบบ Multi-user
- ✅ **File Sharing** - ส่งไฟล์ (รูปภาพ, เอกสาร)
- ✅ **Real-time Updates** - อัพเดทรายชื่อผู้ใช้และกลุ่มแบบ Real-time
- ✅ **Cloud Deployment** - รองรับ Cloud Run, Docker

---

## 🛠 Technology Stack

### Backend (Server)
```
Language:     Go 1.24.3
Framework:    Fiber v2.52.9 (Fast HTTP framework)
WebSocket:    gofiber/websocket v2.2.1
Protocol:     WebSocket (RFC 6455) over TCP/IP
Port:         8080
```

### Frontend (Client)
```
Language:     TypeScript 5.2.2
Framework:    React 18.2.0
Build Tool:   Vite 5.0.8
Styling:      CSS
```

### Infrastructure
```
Containerization:  Docker (Multi-stage build)
Orchestration:     Docker Compose
CI/CD:             GitHub Actions
Cloud Platform:    Google Cloud Run
```

---

## 🏗 System Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER (Browser)                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    React Application (SPA)                          │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │                                                                     │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │ │
│  │  │ Login.tsx      │  │ Sidebar.tsx    │  │ ChatArea.tsx   │      │ │
│  │  │ (R3: Username) │  │ (R4: User List)│  │ (R6: Chat Box) │      │ │
│  │  │                │  │ (R9: Group List)│ │ (R5: Chat Room)│      │ │
│  │  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘      │ │
│  │           │                   │                   │               │ │
│  │           └───────────────────┼───────────────────┘               │ │
│  │                               │                                   │ │
│  │                      ┌────────▼────────┐                          │ │
│  │                      │    App.tsx      │                          │ │
│  │                      │  (State Manager)│                          │ │
│  │                      └────────┬────────┘                          │ │
│  │                               │                                   │ │
│  │                      ┌────────▼────────┐                          │ │
│  │                      │ WebSocketService│                          │ │
│  │                      │  (Transport)    │                          │ │
│  │                      └────────┬────────┘                          │ │
│  │                               │                                   │ │
│  └───────────────────────────────┼───────────────────────────────────┘ │
│                                  │                                     │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │
                                   │ WebSocket Connection
                                   │ ws://server:8080/ws
                                   │ (TCP Socket - Full Duplex)
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                         SERVER TIER (Go Backend)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    Fiber Web Server                               │ │
│  │                    (Listen: 0.0.0.0:8080)                         │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │                                                                   │ │
│  │  ┌──────────────────────────────────────────────────────────────┐│ │
│  │  │  HTTP/WebSocket Middleware Layer                             ││ │
│  │  │  • CORS Handler                                              ││ │
│  │  │  • WebSocket Upgrade Handler                                 ││ │
│  │  │  • Static File Server (React build)                          ││ │
│  │  └────────────────────────┬─────────────────────────────────────┘│ │
│  │                           │                                       │ │
│  │                  ┌────────▼─────────┐                            │ │
│  │                  │ handleWebSocket()│                            │ │
│  │                  │ (Connection Entry)│                           │ │
│  │                  └────────┬─────────┘                            │ │
│  │                           │                                       │ │
│  │            ┌──────────────┴──────────────┐                       │ │
│  │            │                             │                       │ │
│  │   ┌────────▼────────┐         ┌─────────▼────────┐             │ │
│  │   │ Client.ReadPump()│         │Client.WritePump()│             │ │
│  │   │ (Read Messages) │         │ (Send Messages)  │             │ │
│  │   └────────┬────────┘         └─────────▲────────┘             │ │
│  │            │                             │                       │ │
│  │            │        ┌────────────────────┘                       │ │
│  │            │        │                                            │ │
│  │            │        │                                            │ │
│  │     ┌──────▼────────▼──────┐                                    │ │
│  │     │                       │                                    │ │
│  │     │    Hub (Core Logic)   │                                    │ │
│  │     │                       │                                    │ │
│  │     │  ┌─────────────────┐ │                                    │ │
│  │     │  │ clients: map    │ │  (R3: Unique Names)                │ │
│  │     │  │ [name]*Client   │ │  (R4: Client List)                 │ │
│  │     │  └─────────────────┘ │                                    │ │
│  │     │                       │                                    │ │
│  │     │  ┌─────────────────┐ │                                    │ │
│  │     │  │ groups: map     │ │  (R8: Create Group)                │ │
│  │     │  │ [name]*Group    │ │  (R9: Group List)                  │ │
│  │     │  └─────────────────┘ │  (R10: Join Group)                 │ │
│  │     │                       │                                    │ │
│  │     │  ┌─────────────────┐ │                                    │ │
│  │     │  │ Message Routing │ │  (R5: Separate Rooms)              │ │
│  │     │  │ • Private       │ │  (R7: Private Chat)                │ │
│  │     │  │ • Group         │ │  (R11: Group Chat)                 │ │
│  │     │  │ • File Transfer │ │                                    │ │
│  │     │  └─────────────────┘ │                                    │ │
│  │     │                       │                                    │ │
│  │     └───────────────────────┘                                    │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE TIER (Optional)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Docker Container                                                  │ │
│  │ • Multi-stage build (Node + Go + Distroless)                     │ │
│  │ • Port: 8080                                                      │ │
│  │ • Non-root user (security)                                        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Google Cloud Run                                                  │ │
│  │ • Region: asia-southeast1                                         │ │
│  │ • Min/Max instances: 1 (for WebSocket state)                     │ │
│  │ • Session affinity: Enabled                                       │ │
│  │ • URL: https://gogotalkie-*.run.app/                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ CI/CD Pipeline (GitHub Actions)                                   │ │
│  │ • ci.yml (dev branch) - Build & Test                             │ │
│  │ • google-cloudrun-docker.yml (main) - Deploy to Cloud            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
GoTalkie-WebSocket/
│
├── 📂 cmd/                          # Application Entry Points
│   └── 📂 server/
│       └── main.go                  # Server entry point (Fiber setup)
│
├── 📂 server/                       # Backend Core Logic
│   └── hub.go                       # Hub, Client, Group, Message structs
│                                    # WebSocket message routing
│
├── 📂 client/                       # Frontend React Application
│   ├── 📂 src/
│   │   ├── App.tsx                  # Main React component
│   │   ├── main.tsx                 # React entry point
│   │   ├── types.ts                 # TypeScript type definitions
│   │   │
│   │   ├── 📂 components/           # React UI Components
│   │   │   ├── Login.tsx            # Login screen (R3)
│   │   │   ├── Sidebar.tsx          # User/Group list (R4, R9)
│   │   │   ├── ChatArea.tsx         # Chat interface (R5, R6)
│   │   │   ├── CreateGroupModal.tsx # Group creation (R8)
│   │   │   ├── FileMessage.tsx      # File display
│   │   │   ├── FilePreviewModal.tsx # File preview
│   │   │   └── Notification.tsx     # Toast notifications
│   │   │
│   │   └── 📂 services/
│   │       └── websocket.ts         # WebSocket client service
│   │
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.ts               # Vite configuration
│   └── tsconfig.json                # TypeScript configuration
│
├── 📂 .github/                      # GitHub Configuration
│   └── 📂 workflows/
│       ├── ci.yml                   # CI workflow (dev branch)
│       └── google-cloudrun-docker.yml # CD workflow (main branch)
│
├── 📂 bin/                          # Compiled binaries (gitignored)
│
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml               # Docker Compose setup
├── go.mod                           # Go module dependencies
├── go.sum                           # Go dependency checksums
│
└── 📄 Documentation Files
    ├── README.md                    # Project documentation
    ├── SYSTEM_ARCHITECTURE.md       # R1/R2 architecture docs
    ├── PROJECT_SUMMARY.md           # Network & DevSecOps summary
    ├── IMPLEMENTATION.md            # R3-R11 implementation guide
    ├── structure.md                 # This file
    └── QUICKSTART.md                # Quick start guide
```

---

## 🔧 Component Architecture

### Backend Components (Go)

#### 1. Hub (Central Router)
```go
// File: server/hub.go

type Hub struct {
    clients    map[string]*Client      // All connected clients
    groups     map[string]*Group       // All chat groups
    register   chan *Client            // Channel for new clients
    unregister chan *Client            // Channel for disconnecting clients
    mu         sync.RWMutex            // Thread-safe mutex
}
```

**Responsibilities:**
- ✅ Manage all connected clients
- ✅ Route messages (private, group)
- ✅ Handle client registration/unregistration
- ✅ Broadcast client/group lists
- ✅ Thread-safe concurrent operations

**Key Methods:**
```go
func (h *Hub) Run()                          // Main event loop
func (h *Hub) ClientExists(name) bool        // Check duplicate username (R3)
func (h *Hub) RegisterClient(name, conn)     // Add new client
func (h *Hub) HandleMessage(client, data)    // Route incoming messages
func (h *Hub) SendToClient(name, msg)        // Private message (R7)
func (h *Hub) SendToGroup(name, msg)         // Group message (R11)
func (h *Hub) BroadcastClientList()          // Send user list (R4)
func (h *Hub) BroadcastGroupList()           // Send group list (R9)
```

#### 2. Client (Connection Handler)
```go
type Client struct {
    Name string                // Unique username (R3)
    Conn *websocket.Conn       // TCP socket connection
    Send chan []byte           // Buffered message queue (256 bytes)
    hub  *Hub                  // Reference to Hub
    mu   sync.Mutex            // Client-specific mutex
}
```

**Responsibilities:**
- ✅ Maintain WebSocket connection
- ✅ Read messages from socket (ReadPump)
- ✅ Write messages to socket (WritePump)
- ✅ Handle connection lifecycle

**Key Methods:**
```go
func (c *Client) ReadPump()   // Read from WebSocket socket (blocking)
func (c *Client) WritePump()  // Write to WebSocket socket (blocking)
```

#### 3. Group (Chat Group)
```go
type Group struct {
    Name    string              // Group name
    Creator string              // Creator's username (R8)
    Members map[string]bool     // Group members (R10)
    mu      sync.RWMutex        // Group-specific mutex
}
```

**Responsibilities:**
- ✅ Store group metadata
- ✅ Track group members
- ✅ Thread-safe member operations

#### 4. Message Types
```go
const (
    MsgTypeRegister     = "register"       // User registration
    MsgTypeClientList   = "client_list"    // User list broadcast (R4)
    MsgTypePrivate      = "private"        // Private message (R7)
    MsgTypeCreateGroup  = "create_group"   // Create group (R8)
    MsgTypeGroupList    = "group_list"     // Group list broadcast (R9)
    MsgTypeJoinGroup    = "join_group"     // Join group (R10)
    MsgTypeLeaveGroup   = "leave_group"    // Leave group
    MsgTypeGroupMessage = "group_message"  // Group message (R11)
    MsgTypeFilePrivate  = "file_private"   // Private file
    MsgTypeFileGroup    = "file_group"     // Group file
    MsgTypeError        = "error"          // Error message
)
```

### Frontend Components (React)

#### 1. App.tsx (State Manager)
**Responsibilities:**
- ✅ Global state management (useState)
- ✅ WebSocket connection management
- ✅ Message routing to UI components
- ✅ Handle user interactions

**Key State:**
```typescript
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [myName, setMyName] = useState('');
const [users, setUsers] = useState<string[]>([]);      // R4: Client list
const [groups, setGroups] = useState<Group[]>([]);     // R9: Group list
const [currentChat, setCurrentChat] = useState(null);  // R5: Current room
const [chats, setChats] = useState({});                // R5: Chat history
```

#### 2. WebSocketService.ts (Transport Layer)
**Responsibilities:**
- ✅ WebSocket connection lifecycle
- ✅ Send messages to server
- ✅ Receive messages from server
- ✅ Event handling (onopen, onmessage, onerror, onclose)

**Key Methods:**
```typescript
connect(username, onMessage, onError, onClose)  // Establish connection
send(type, content, to, group_name)             // Send message
sendFile(file, type, target)                    // Send file
close()                                         // Close connection
```

#### 3. UI Components

**Login.tsx** (R3: Unique Names)
- Input field for username
- Connect button
- Username validation

**Sidebar.tsx** (R4: User List, R9: Group List)
- Display online users
- Display available groups
- Join/Leave group buttons (R10)
- Create group button (R8)

**ChatArea.tsx** (R5: Chat Rooms, R6: Chat Box)
- Message display area (chat window)
- Message input field (chat box)
- File upload button
- Separate rooms per chat

**CreateGroupModal.tsx** (R8: Create Group)
- Group name input
- Create button
- Validation

---

## 🔄 Data Flow

### 1. User Login Flow (R3: Unique Names)

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser   │      │   Frontend   │      │   Backend    │
└──────┬──────┘      └──────┬───────┘      └──────┬───────┘
       │                    │                     │
       │ 1. Enter username  │                     │
       ├──────────────────► │                     │
       │    "Alice"         │                     │
       │                    │                     │
       │ 2. Click "Join"    │                     │
       ├──────────────────► │                     │
       │                    │                     │
       │                    │ 3. new WebSocket()  │
       │                    ├────────────────────►│
       │                    │    (TCP Handshake)  │
       │                    │                     │
       │                    │ 4. send("register") │
       │                    ├────────────────────►│
       │                    │    {"type":"register",│
       │                    │     "content":"Alice"}│
       │                    │                     │
       │                    │            5. hub.ClientExists("Alice")?
       │                    │               ├─► false: Continue
       │                    │               └─► true: Error
       │                    │                     │
       │                    │               6. hub.RegisterClient()
       │                    │                     │
       │                    │               7. BroadcastClientList()
       │                    │                     │
       │                    │ 8. Confirmation msg │
       │                    │◄────────────────────┤
       │                    │    {"type":"register",│
       │                    │     "content":"Registered as Alice"}│
       │                    │                     │
       │ 9. Show Chat UI    │                     │
       │◄───────────────────┤                     │
       │                    │                     │
```

### 2. Private Message Flow (R7: Private Chat)

```
Alice (Client A)     Frontend A        Backend          Frontend B      Bob (Client B)
──────────────       ──────────        ───────          ──────────      ──────────────
      │                  │                 │                 │                │
  1. Type "Hi Bob"       │                 │                 │                │
      ├─────────────────►│                 │                 │                │
      │                  │                 │                 │                │
  2. Click Send          │                 │                 │                │
      ├─────────────────►│                 │                 │                │
      │                  │                 │                 │                │
      │              3. send("private")    │                 │                │
      │                  ├────────────────►│                 │                │
      │                  │  {"type":"private",               │                │
      │                  │   "to":"Bob",                     │                │
      │                  │   "content":"Hi Bob"}             │                │
      │                  │                 │                 │                │
      │                  │         4. HandleMessage()        │                │
      │                  │            msg.From = "Alice"     │                │
      │                  │                 │                 │                │
      │                  │         5. SendToClient("Bob")    │                │
      │                  │                 ├────────────────►│                │
      │                  │                 │  {"type":"private",              │
      │                  │                 │   "from":"Alice",│               │
      │                  │                 │   "to":"Bob",    │               │
      │                  │                 │   "content":"Hi Bob"}            │
      │                  │                 │                 │                │
      │                  │                 │        6. ws.onmessage()         │
      │                  │                 │                 ├───────────────►│
      │                  │                 │                 │                │
      │                  │                 │         7. Display message       │
      │                  │                 │                 │                │
      │                  │                 │                 │   "Alice: Hi Bob"
```

### 3. Group Chat Flow (R11: Group Message)

```
Alice              Frontend           Backend                      Group Members
─────              ────────           ───────                      ─────────────
  │                   │                  │                              │
  │ 1. Type message   │                  │                              │
  ├──────────────────►│                  │                              │
  │                   │                  │                              │
  │              2. send("group_message")│                              │
  │                   ├─────────────────►│                              │
  │                   │  {"type":"group_message",                       │
  │                   │   "group_name":"Team",                          │
  │                   │   "content":"Hello team"}                       │
  │                   │                  │                              │
  │                   │          3. HandleMessage()                     │
  │                   │             msg.From = "Alice"                  │
  │                   │                  │                              │
  │                   │          4. SendToGroup("Team")                 │
  │                   │             • Find group                        │
  │                   │             • Loop members                      │
  │                   │             • Send to each                      │
  │                   │                  ├─────────────────────────────►│
  │                   │                  │  Broadcast to all members:   │
  │                   │                  │  - Alice                     │
  │                   │                  │  - Bob                       │
  │                   │                  │  - Charlie                   │
  │                   │                  │                              │
  │                   │                  │              5. Display in all members' UI
```

### 4. File Transfer Flow

```
Sender            Frontend           Backend           Recipient
──────            ────────           ───────           ─────────
  │                  │                  │                  │
  │ 1. Select file   │                  │                  │
  ├─────────────────►│                  │                  │
  │                  │                  │                  │
  │ 2. Read as Base64│                  │                  │
  │                  │                  │                  │
  │              3. sendFile()          │                  │
  │                  ├─────────────────►│                  │
  │                  │  {"type":"file_private",            │
  │                  │   "to":"Bob",                       │
  │                  │   "file":{                          │
  │                  │     "name":"photo.jpg",             │
  │                  │     "content":"data:image...",      │
  │                  │     "size":12345,                   │
  │                  │     "type":"image/jpeg"             │
  │                  │   }}                                │
  │                  │                  │                  │
  │                  │          4. SendToClient("Bob")     │
  │                  │                  ├─────────────────►│
  │                  │                  │                  │
  │                  │                  │     5. Receive & display file
  │                  │                  │        • Show preview
  │                  │                  │        • Download button
```

---

## 🚀 Deployment Architecture

### Local Development
```
┌──────────────────────────────────────────┐
│         Developer Machine                 │
├──────────────────────────────────────────┤
│                                          │
│  Terminal 1: Go Server                   │
│  $ cd cmd/server                         │
│  $ go run main.go                        │
│  → Server: http://0.0.0.0:8080          │
│                                          │
│  Terminal 2: React Dev Server            │
│  $ cd client                             │
│  $ npm run dev                           │
│  → Client: http://localhost:5173        │
│  → Proxy WebSocket to :8080             │
│                                          │
└──────────────────────────────────────────┘
```

### Docker Deployment
```
┌──────────────────────────────────────────────────────────┐
│                   Docker Container                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Stage 1: node:20-alpine (Frontend Build)               │
│  ├─ npm ci                                               │
│  ├─ npm run build                                        │
│  └─ Output: /app/client/dist                            │
│                                                          │
│  Stage 2: golang:1.24.3-alpine (Backend Build)          │
│  ├─ go mod download                                      │
│  ├─ go build -o bin/server                              │
│  └─ Output: /app/bin/server                             │
│                                                          │
│  Stage 3: distroless/static-debian12 (Runtime)          │
│  ├─ Copy: /app/server (binary)                          │
│  ├─ Copy: /app/client/dist (frontend)                   │
│  ├─ User: nonroot (security)                            │
│  ├─ Port: 8080                                           │
│  └─ Entry: /app/server                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘

$ docker build -t gotalkie .
$ docker run -p 8080:8080 gotalkie
→ Access: http://localhost:8080
```

### Cloud Run Deployment
```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Run                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Region: asia-southeast1 (Singapore)                        │
│  URL: https://gogotalkie-*.asia-southeast1.run.app/        │
│                                                             │
│  Configuration:                                             │
│  ├─ Container: gcr.io/PROJECT/gotalkie                     │
│  ├─ Port: 8080                                              │
│  ├─ CPU: 1                                                  │
│  ├─ Memory: 512Mi                                           │
│  ├─ Min instances: 1  ◄── Important for WebSocket state    │
│  ├─ Max instances: 1  ◄── Prevents multiple instances      │
│  ├─ Session affinity: Enabled ◄── Sticky connections       │
│  └─ Timeout: 300s                                           │
│                                                             │
│  CI/CD: GitHub Actions                                      │
│  ├─ Trigger: Push to main branch                           │
│  ├─ Build: Docker image                                     │
│  ├─ Push: Artifact Registry                                 │
│  └─ Deploy: Cloud Run                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Clients connect via:
wss://gogotalkie-*.asia-southeast1.run.app/ws
```

---

## 🔍 Key Components Explanation

### 1. Hub Pattern (Centralized Message Router)

```go
// Hub is the heart of the system
// It runs in a single goroutine and handles all client lifecycle events

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            // New client connected
            h.clients[client.Name] = client
            h.BroadcastClientList()      // R4: Update user list
            h.BroadcastGroupList()       // R9: Update group list
            
        case client := <-h.unregister:
            // Client disconnected
            delete(h.clients, client.Name)
            close(client.Send)
            // Remove from all groups
            for _, group := range h.groups {
                delete(group.Members, client.Name)
            }
            h.BroadcastClientList()      // R4: Update user list
            h.BroadcastGroupList()       // R9: Update group list
        }
    }
}
```

**Why Hub Pattern?**
- ✅ **Centralized control** - Single source of truth for all clients/groups
- ✅ **Thread-safe** - Uses channels for synchronization (Go idiom)
- ✅ **Scalable** - Each client runs in separate goroutines
- ✅ **Simple** - Clear separation of concerns

### 2. Goroutine Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Goroutine Architecture                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Main Goroutine:                                        │
│  └─ Hub.Run() ◄─────────────────────┐                  │
│     • Listens on register channel   │                  │
│     • Listens on unregister channel │                  │
│     • Manages clients/groups maps   │                  │
│                                     │                  │
│  Per Client (N clients = 2N goroutines):              │
│                                     │                  │
│  Client 1:                          │                  │
│  ├─ ReadPump() goroutine            │                  │
│  │  • Read from WebSocket ──────────┼─► Hub.register   │
│  │  • Parse messages                │                  │
│  │  • Call Hub.HandleMessage() ─────┼─► Hub routing    │
│  │                                  │                  │
│  └─ WritePump() goroutine           │                  │
│     • Read from client.Send channel │                  │
│     • Write to WebSocket ◄───────────┼── Hub sends     │
│                                     │                  │
│  Client 2: (same structure)         │                  │
│  Client N: (same structure)         │                  │
│                                                         │
│  Total Goroutines = 1 (Hub) + 2 × N (Clients)         │
│  Example: 10 clients = 1 + 20 = 21 goroutines         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. WebSocket Connection Lifecycle

```
Client                Frontend              Backend
──────                ────────              ───────

1. User Login
   │
   ├──── new WebSocket(url) ─────────────► TCP Handshake
   │                                        Accept connection
   │
   ├──── HTTP Upgrade Request ────────────► websocket.IsWebSocketUpgrade()
   │                                        Return 101 Switching Protocols
   │
   ◄──── WebSocket Established ────────────┤
   │                                        │
   │                                   handleWebSocket(conn)
   │                                        │
2. Registration                             │
   │                                        │
   ├──── send("register", "Alice") ────────► c.ReadJSON(&msg)
   │                                        hub.ClientExists("Alice")?
   │                                        ├─► false: Continue
   │                                        └─► true: Error + Close
   │                                        │
   │                                   hub.RegisterClient()
   │                                        │
   ◄──── Confirmation message ─────────────┤ client.Send <- data
   │                                        │
   │                                   go client.WritePump()  ◄─┐
   │                                   client.ReadPump()     ◄──┤
   │                                        │                   │
3. Active Communication                     │              Goroutines
   │                                        │                   │
   ├──── Messages ─────────────────────────► ReadPump() ───────┤
   │                                        HandleMessage()     │
   │                                        Route to recipients │
   │                                        │                   │
   ◄──── Messages ─────────────────────────┤ WritePump() ──────┘
   │                                        │
   │                                        │
4. Disconnection                            │
   │                                        │
   │ close() or network error               │
   ├──── TCP FIN ──────────────────────────► ReadPump() error
   │                                        break loop
   │                                        defer: hub.UnregisterClient()
   │                                        conn.Close()
   │                                        │
   │                                   Hub.Run() receives unregister
   │                                   delete(clients, name)
   │                                   BroadcastClientList()
   │                                        │
   [Connection Closed]              [Cleanup Complete]
```

### 4. Message Routing Logic

```go
// File: server/hub.go - Hub.HandleMessage()

func (h *Hub) HandleMessage(client *Client, data []byte) {
    var msg Message
    json.Unmarshal(data, &msg)
    
    msg.From = client.Name  // Add sender name
    
    switch msg.Type {
    case MsgTypePrivate:           // R7: Private Chat
        h.SendToClient(msg.To, msg)        // Send to recipient
        h.SendToClient(msg.From, msg)      // Echo to sender
        
    case MsgTypeGroupMessage:      // R11: Group Chat
        h.SendToGroup(msg.GroupName, msg)  // Broadcast to group
        
    case MsgTypeCreateGroup:       // R8: Create Group
        h.groups[msg.GroupName] = &Group{
            Name:    msg.GroupName,
            Creator: client.Name,
            Members: map[string]bool{client.Name: true},
        }
        h.BroadcastGroupList()     // R9: Update group list
        
    case MsgTypeJoinGroup:         // R10: Join Group
        if group, exists := h.groups[msg.GroupName]; exists {
            group.Members[client.Name] = true
        }
        h.BroadcastGroupList()     // R9: Update group list
        
    case MsgTypeLeaveGroup:
        if group, exists := h.groups[msg.GroupName]; exists {
            delete(group.Members, client.Name)
            if len(group.Members) == 0 {
                delete(h.groups, msg.GroupName)  // Auto-cleanup
            }
        }
        h.BroadcastGroupList()     // R9: Update group list
        
    case MsgTypeFilePrivate:
        h.SendToClient(msg.To, msg)
        h.SendToClient(msg.From, msg)
        
    case MsgTypeFileGroup:
        h.SendToGroup(msg.GroupName, msg)
    }
}
```

### 5. Frontend State Management

```typescript
// File: client/src/App.tsx

function App() {
  // Global state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myName, setMyName] = useState('');
  const [users, setUsers] = useState<string[]>([]);      // R4
  const [groups, setGroups] = useState<Group[]>([]);     // R9
  const [currentChat, setCurrentChat] = useState(null);  // R5
  const [chats, setChats] = useState({});                // R5
  
  // WebSocket service (singleton)
  const wsService = useRef(new WebSocketService());
  
  // Message handler (receives all messages from server)
  const handleMessage = useCallback((msg: Message) => {
    switch (msg.type) {
      case MessageTypes.REGISTER:
        setMyName(msg.content.split(' ').pop());
        setIsLoggedIn(true);
        break;
        
      case MessageTypes.CLIENT_LIST:  // R4
        setUsers(msg.clients);
        break;
        
      case MessageTypes.GROUP_LIST:   // R9
        setGroups(msg.groups);
        break;
        
      case MessageTypes.PRIVATE:      // R7
        const chatKey = msg.from === myName ? msg.to : msg.from;
        setChats(prev => ({
          ...prev,
          [chatKey]: [...(prev[chatKey] || []), msg]
        }));
        break;
        
      case MessageTypes.GROUP_MESSAGE: // R11
        const groupKey = 'group_' + msg.group_name;
        setChats(prev => ({
          ...prev,
          [groupKey]: [...(prev[groupKey] || []), msg]
        }));
        break;
    }
  }, [myName]);
  
  // ... rest of component
}
```

---

## 📊 Architecture Patterns Used

### 1. Hub Pattern (Publish-Subscribe)
- Central message router
- Clients subscribe to Hub
- Hub publishes to relevant clients

### 2. Producer-Consumer Pattern
- Clients produce messages → Hub consumes
- Hub produces messages → Clients consume
- Uses Go channels as queue

### 3. Repository Pattern
- Hub stores clients/groups
- Clean separation: storage vs logic

### 4. Observer Pattern
- Clients observe Hub events
- Real-time updates on state changes

### 5. Singleton Pattern
- Single Hub instance per server
- Single WebSocketService per frontend app

---

## 🔐 Security Features

### Backend Security
```go
// 1. Username validation
if hub.ClientExists(username) {
    return Error("Name taken")  // R3: Prevent duplicates
}

// 2. Non-root user in Docker
USER nonroot:nonroot

// 3. Distroless base image (minimal attack surface)
FROM gcr.io/distroless/static-debian12:nonroot

// 4. CORS protection
app.Use(cors.New(cors.Config{
    AllowOrigins: "*",  // Configure for production
}))
```

### Frontend Security
```typescript
// 1. Input sanitization
const sanitized = username.trim();

// 2. WebSocket over TLS (wss://)
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

// 3. Error handling
ws.onerror = () => {
    showNotification('Connection failed', 'error');
};
```

---

## 📈 Performance Considerations

### Backend Optimizations
1. **Buffered Channels** - Prevent blocking (256 bytes)
2. **Goroutines** - Concurrent client handling
3. **RWMutex** - Allow concurrent reads
4. **Non-blocking Sends** - Use select/default
5. **Static Compilation** - Fast startup

### Frontend Optimizations
1. **Vite Build** - Fast HMR, optimized bundles
2. **Code Splitting** - Lazy load components
3. **React.memo** - Prevent unnecessary re-renders
4. **useCallback** - Memoize handlers
5. **Production Build** - Minified, compressed

---

## 🧪 Testing Strategy

### Backend Testing
```bash
# Unit tests
go test ./server/...

# Integration tests
go test ./cmd/server/...

# Load testing
# Test with multiple concurrent WebSocket connections
```

### Frontend Testing
```bash
# Linting
npm run lint

# Type checking
tsc --noEmit

# Build test
npm run build
```

---

## 📚 Requirements Mapping

| Requirement | Implementation | Files |
|------------|----------------|-------|
| **R1: Multi-Client** | Server on one machine, clients on different computers | `cmd/server/main.go`, Docker, Cloud Run |
| **R2: Socket Programming** | WebSocket (RFC 6455) over TCP | `server/hub.go`, `client/src/services/websocket.ts` |
| **R3: Unique Names** | `hub.ClientExists()` validation | `server/hub.go:105`, `cmd/server/main.go:68` |
| **R4: Client List** | `BroadcastClientList()` | `server/hub.go:113`, `client/src/components/Sidebar.tsx` |
| **R5: Separate Rooms** | `chats` state with keys per room | `client/src/App.tsx:17` |
| **R6: Chat Box/Window** | `ChatArea.tsx` component | `client/src/components/ChatArea.tsx` |
| **R7: Private Chat** | `SendToClient()` routing | `server/hub.go:173`, `App.tsx:handleSendMessage` |
| **R8: Create Group** | `MsgTypeCreateGroup` handler | `server/hub.go:226`, `CreateGroupModal.tsx` |
| **R9: Group List** | `BroadcastGroupList()` | `server/hub.go:129`, `Sidebar.tsx` |
| **R10: Join Group** | `MsgTypeJoinGroup` handler | `server/hub.go:235`, `Sidebar.tsx` |
| **R11: Group Message** | `SendToGroup()` routing | `server/hub.go:188`, `App.tsx:handleSendMessage` |

---

## 🎓 Learning Points

### Go Concurrency
- Goroutines for concurrent operations
- Channels for communication
- Mutexes for synchronization
- select statements for multiplexing

### WebSocket Protocol
- Full-duplex communication
- Persistent connections
- Frame-based messaging
- Upgrade from HTTP

### React Patterns
- Hooks (useState, useEffect, useCallback, useRef)
- Component composition
- State management
- Event handling

### DevOps
- Multi-stage Docker builds
- Distroless images
- CI/CD with GitHub Actions
- Cloud deployment (Cloud Run)

---

## 🚀 Future Enhancements

1. **Authentication** - User login with JWT tokens
2. **Persistence** - Store messages in database
3. **Presence** - Typing indicators, online status
4. **Rich Media** - Voice messages, video calls
5. **Encryption** - End-to-end encryption
6. **Scalability** - Redis pub/sub for multi-instance
7. **Mobile App** - React Native client
8. **Admin Panel** - User management, moderation

---

## 📞 Support & Contact

For questions or issues, please refer to:
- **README.md** - Main documentation
- **SYSTEM_ARCHITECTURE.md** - Detailed architecture (R1/R2)
- **IMPLEMENTATION.md** - Implementation guide (R3-R11)
- **GitHub Issues** - Bug reports and feature requests

---

**Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Author:** GoGoTalkie Team
