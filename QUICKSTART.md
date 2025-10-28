# Quick Start Guide - GoTalkie WebSocket Chat

## Start the Server (5 seconds)

```bash
# Build and run
go build -o bin/server ./cmd/server && ./bin/server
```

You should see:
```
Server starting on http://localhost:8080
```

## Test Locally (Same Computer)

1. **Open Browser Tab 1**: `http://localhost:8080`
   - Enter name: **Alice**
   - Click "Join Chat"

2. **Open Browser Tab 2**: `http://localhost:8080`
   - Enter name: **Bob**
   - Click "Join Chat"

3. **Open Browser Tab 3**: `http://localhost:8080`
   - Enter name: **Charlie**
   - Click "Join Chat"

## Test All Features

### Test Private Chat (R7)
1. In Alice's tab, click "Bob" in the Online Users list
2. Type "Hello Bob!" and press Enter
3. Switch to Bob's tab - you should see the message
4. Charlie should NOT see this message

### Test Group Chat (R8-R11)
1. In Alice's tab, click "+ Create Group"
2. Enter group name: "Team Chat"
3. Switch to Bob's tab - you'll see "Team Chat" with a "Join" button
4. Click "Join" button in Bob's tab
5. Click on "Team Chat" group name to open it
6. Type "Hi everyone!" and press Enter
7. Switch to Alice's tab, click "Team Chat" - you'll see Bob's message
8. Charlie should NOT see messages (not a member yet)

## Test on Different Computers (For Full Credit)

### Computer A (Server)
```bash
# Find your IP address first
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: inet 192.168.1.100
```

Run the server:
```bash
./bin/server
```

### Computer B (Client 1)
- Open browser
- Go to: `http://192.168.1.100:8080` (use server's IP)
- Name: "User1"

### Computer C (Client 2)
- Open browser
- Go to: `http://192.168.1.100:8080`
- Name: "User2"

## Feature Checklist

- ✅ R1: Two+ clients on different computers
- ✅ R2: WebSocket (check Network tab in DevTools)
- ✅ R3: Unique names (try duplicate - gets rejected)
- ✅ R4: Client list updates automatically
- ✅ R5: Separate chat rooms for each conversation
- ✅ R6: Chat input box + message display window
- ✅ R7: Private messages (only 2 users see them)
- ✅ R8: Create group (creator is first member)
- ✅ R9: See all groups with members
- ✅ R10: "Join" button (voluntary joining)
- ✅ R11: Group messages (only members see them)

## Troubleshooting

**"Name already taken" error?**
- Each client needs a unique name
- Close old tabs or use different names

**Can't connect from another computer?**
```bash
# macOS - allow port 8080
sudo pfctl -d  # disable firewall temporarily for testing

# Or add firewall rule
sudo pfctl -e
echo "pass in proto tcp to port 8080" | sudo pfctl -f -
```

**Server not starting?**
```bash
# Check if port 8080 is already in use
lsof -i :8080

# Kill process if needed
kill -9 <PID>
```

## Architecture Summary

```
Client Browser ──WebSocket──► Server (Go/Fiber)
                              ├─ Hub (manages clients)
                              ├─ Groups (manages chat groups)
                              └─ Message Router
```

**Socket Programming**: Uses WebSocket protocol (RFC 6455) - full-duplex communication over TCP sockets. No high-level messaging services used.

## Demo Script

Want to impress? Follow this script:

1. Start server
2. Open 3 browser tabs (Alice, Bob, Charlie)
3. Show client list updating in real-time (R4)
4. Alice → Bob private chat (R7)
5. Alice creates "Project Team" group (R8)
6. Show group list (R9)
7. Bob joins group (R10)
8. Alice and Bob chat in group, Charlie can't see (R11)
9. Open DevTools → Network tab → show WS connection (R2)

## Cloud Deployment (Bonus +1 point)

Deploy to fly.io (fastest):
```bash
# Install flyctl
brew install flyctl

# Login
flyctl auth login

# Deploy
flyctl launch
```

Your app will be at: `https://gotalkie-xyz.fly.dev`

Now clients from anywhere can connect!

---

**Need help?** Check the full README.md for detailed documentation.
