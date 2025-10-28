# GoTalkie-WebSocket Chat Application

A complete WebSocket-based chat application built with Go (Fiber framework) and WebSockets. Implements private messaging, group chats, and real-time client list updates.

## System Architecture (Part 1)

### R1: System Architecture (1.0 point) ✅

**Architecture Overview:**
- **Server**: Go-based WebSocket server using Fiber framework and gofiber/websocket
- **Clients**: Web-based clients (HTML/JavaScript) connecting via WebSocket
- **Deployment**: Server runs on one machine (can be cloud or local), clients connect from different physical computers

**Component Diagram:**
```
┌─────────────┐     WebSocket (ws://host:8080/ws)      ┌─────────────┐
│  Client 1   │ ◄────────────────────────────────────► │             │
│ (Computer A)│                                         │   Server    │
└─────────────┘                                         │  (Go/Fiber) │
                                                        │             │
┌─────────────┐     WebSocket (ws://host:8080/ws)      │   - Hub     │
│  Client 2   │ ◄────────────────────────────────────► │   - Groups  │
│ (Computer B)│                                         │   - Clients │
└─────────────┘                                         └─────────────┘

┌─────────────┐     WebSocket (ws://host:8080/ws)
│  Client N   │ ◄────────────────────────────────────►
│ (Computer N)│
└─────────────┘
```

**Physical Deployment:**
1. Server runs on Machine S (or cloud VM - optional for bonus point)
2. Client 1 runs on Machine A (different physical computer)
3. Client 2 runs on Machine B (different physical computer)
4. Clients can be on same network or different networks

**Cloud Deployment** (optional +1 point):
- Deploy server to cloud providers: AWS EC2, Google Cloud, Azure, Heroku, or Digital Ocean
- Clients connect from local machines to cloud server URL

### R2: Socket Programming (0.5 point) ✅

**Implementation**: All chat messages use WebSocket protocol (RFC 6455), which is socket-based communication over TCP.

**Technical Details:**
- Uses `github.com/gofiber/websocket/v2` package
- WebSocket provides full-duplex communication channels
- Messages are sent/received using `ReadMessage()` and `WriteMessage()` socket operations
- No high-level messaging services (like MQTT, AMQP) are used - pure WebSocket sockets

## Part 2: Fundamental Implementation (7 points)

All requirements R3-R11 are fully implemented:

### R3: Unique Client Names (0.5 point) ✅
- Each client must register with a unique name upon connection
- Server validates and rejects duplicate names
- Names are stored in server's Hub structure

### R4: Client List Display (0.5 point) ✅
- All connected clients see a real-time list of all online users
- List updates automatically when clients join/leave
- Displayed in sidebar under "Online Users (R4)"

### R5: Separate Chat Rooms (0.5 point) ✅
- Each private conversation has its own chat room
- Each group has its own chat room
- Chat history is maintained separately for each room

### R6: Chat Box and Chat Window (0.5 point) ✅
- **Chat Box**: Input field at bottom for typing messages
- **Chat Window**: Scrollable message display area showing conversation history
- Sent messages appear on right (blue), received on left (white)

### R7: Private Messaging (1.0 point) ✅
- Click any user in the list to start private chat
- Messages sent to specific recipient only
- Only sender and receiver can see the messages
- Server routes messages using recipient names

### R8: Group Creation (1.0 point) ✅
- "Create Group" button in sidebar
- Creator is automatically added as first member
- Group stored in server with creator's name

### R9: Group List Display (1.0 point) ✅
- All existing groups displayed in sidebar under "Groups (R9)"
- Shows group name, creator, and current members
- Updates in real-time when groups are created or members join

### R10: Voluntary Group Joining (1.0 point) ✅
- Users see "Join" button on groups they haven't joined
- Must click "Join" to become member
- No automatic addition by group creator
- Only after joining can user send/receive group messages

### R11: Group Messaging (1.0 point) ✅
- Members can send messages to their groups
- Messages broadcast only to group members
- Non-members cannot see group messages

## Project Structure

```
GoTalkie-WebSocket/
├── cmd/
│   └── server/
│       └── main.go           # Server entry point with WebSocket handling
├── server/
│   └── hub.go                # Hub logic: clients, groups, message routing
├── static/
│   └── index.html            # Web client UI (HTML/CSS/JS)
├── bin/
│   └── server                # Compiled server binary
├── go.mod                    # Go module dependencies
├── go.sum                    # Dependency checksums
└── README.md                 # This file
```

## How to Run

### Prerequisites

- Go 1.20 or higher installed
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Two or more physical computers on the same network (for full requirement testing)

### Build and Run Server

1. **Install dependencies:**
```bash
go mod download
```

2. **Build the server:**
```bash
go build -o bin/server ./cmd/server
```

3. **Run the server:**
```bash
./bin/server
```

The server will start on `http://localhost:8080`

### Connect Clients

1. **On Computer A** (First client):
   - Open browser
   - Navigate to `http://<server-ip>:8080` (replace `<server-ip>` with server's IP address)
   - Enter a unique name (e.g., "Alice")
   - Click "Join Chat"

2. **On Computer B** (Second client):
   - Open browser
   - Navigate to `http://<server-ip>:8080`
   - Enter a different unique name (e.g., "Bob")
   - Click "Join Chat"

3. **Local testing** (same computer, multiple browser tabs):
   - Open first tab: `http://localhost:8080` → Name: "Alice"
   - Open second tab: `http://localhost:8080` → Name: "Bob"
   - Open third tab: `http://localhost:8080` → Name: "Charlie"

### Using the Chat

**Private Messaging (R7):**
1. Click on any user name in the "Online Users" list
2. Type your message in the input box at the bottom
3. Press Enter or click "Send"
4. Only you and the recipient will see the messages

**Group Messaging (R8-R11):**
1. Click "+ Create Group" button
2. Enter group name in the prompt
3. Group appears in "Groups (R9)" section
4. Other users can click "Join" button to join the group
5. Click on group name to open group chat
6. Send messages - only group members will see them

## Testing Requirements

### Test Checklist

- [ ] **R1**: Server running, at least 2 clients on different physical computers
- [ ] **R2**: Verify WebSocket protocol in browser DevTools (Network tab, WS)
- [ ] **R3**: Try joining with duplicate name - should be rejected
- [ ] **R4**: Check client list updates when users join/leave
- [ ] **R5**: Open multiple chats - verify each has separate history
- [ ] **R6**: Verify chat input box and message display window exist
- [ ] **R7**: Send private message - verify only 2 users see it
- [ ] **R8**: Create group - verify creator is initial member
- [ ] **R9**: Create multiple groups - verify all users see the list
- [ ] **R10**: Verify "Join" button appears for non-members
- [ ] **R11**: Send group message - verify only members receive it

## Dependencies

- `github.com/gofiber/fiber/v2` - Web framework
- `github.com/gofiber/websocket/v2` - WebSocket support for Fiber
- `github.com/gorilla/websocket` (transitive) - WebSocket protocol implementation

## Architecture Details

### Message Types

The system uses JSON messages with the following types:

- `register` - Client registration with name
- `client_list` - Broadcast of all connected clients
- `private` - Private message between two users
- `create_group` - Create new group chat
- `group_list` - Broadcast of all groups with members
- `join_group` - Join existing group
- `group_message` - Message to group members
- `error` - Error notifications

### Server Components

**Hub**: Central message router managing:
- Client connections (map of name → Client)
- Group information (map of groupName → Group)
- Registration/unregistration channels
- Message broadcasting and routing

**Client**: Represents connected user:
- Name (unique identifier)
- WebSocket connection
- Send channel for outgoing messages
- Read/Write pumps for message handling

**Group**: Represents chat group:
- Name
- Creator
- Members map
- Thread-safe access with RWMutex

## Cloud Deployment (Optional +1 point)

To deploy to cloud for the bonus point:

### Option 1: Heroku
```bash
# Create Procfile
echo "web: ./bin/server" > Procfile

# Deploy
heroku create gotalkie-app
git push heroku main
```

### Option 2: AWS EC2
1. Launch EC2 instance (Ubuntu)
2. Install Go
3. Copy project files
4. Run server on port 8080
5. Configure security group to allow inbound port 8080

### Option 3: Digital Ocean
1. Create Droplet
2. SSH into server
3. Install Go and build project
4. Run server with `nohup ./bin/server &`

## Troubleshooting

**Can't connect from other computer:**
- Check firewall allows port 8080
- Verify server IP address is correct
- Try `telnet <server-ip> 8080` to test connectivity

**Name already taken:**
- Each client must have unique name
- Close old browser tabs/connections
- Restart server to clear all connections

**Messages not appearing:**
- Check browser console (F12) for WebSocket errors
- Verify server is running
- Reload the page to reconnect

## License

MIT License - Educational Project

## Authors

GoGoTalkie Team - Network Programming Course
