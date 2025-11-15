# System Architecture Design - GoTalkie WebSocket Chat

## Part 1: System Architecture Design (1.5 points)

### R1: Multi-Client Architecture (1.0 point)

#### System Overview

The GoTalkie WebSocket Chat system implements a **client-server architecture** with support for multiple concurrent clients communicating through a centralized server. The system supports deployment across different physical computers and includes cloud-based deployment capabilities.

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Physical Deployment                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Computer A (Client 1)          Computer B (Client 2)                │
│  ┌──────────────────┐          ┌──────────────────┐                │
│  │  Web Browser     │          │  Web Browser     │                │
│  │  (React/TS App)  │          │  (React/TS App)  │                │
│  │                  │          │                  │                │
│  │  WebSocket       │          │  WebSocket       │                │
│  │  Client          │          │  Client          │                │
│  └────────┬─────────┘          └────────┬─────────┘                │
│           │                              │                          │
│           │ WSS/WS over TCP/IP          │                          │
│           │ Port: 8080                   │                          │
│           │                              │                          │
│  ─────────┼──────────────────────────────┼──────────────────────── │
│           │                              │                          │
│           └──────────────┬───────────────┘                          │
│                          ▼                                           │
│            Computer C (Server) or Cloud Run                          │
│            ┌───────────────────────────────────┐                    │
│            │   GoTalkie WebSocket Server       │                    │
│            │   (Go + Fiber Framework)          │                    │
│            │                                   │                    │
│            │   ┌───────────────────────────┐  │                    │
│            │   │   WebSocket Endpoint      │  │                    │
│            │   │   (RFC 6455)              │  │                    │
│            │   │   GET /ws                 │  │                    │
│            │   └───────────┬───────────────┘  │                    │
│            │               │                   │                    │
│            │   ┌───────────▼───────────────┐  │                    │
│            │   │   Hub (Message Router)    │  │                    │
│            │   │   • Client Registry       │  │                    │
│            │   │   • Group Management      │  │                    │
│            │   │   • Message Distribution  │  │                    │
│            │   └───────────────────────────┘  │                    │
│            │                                   │                    │
│            │   Listening on: 0.0.0.0:8080     │                    │
│            └───────────────────────────────────┘                    │
│                                                                       │
│  Computer D (Client 3)          Computer E (Client N...)             │
│  ┌──────────────────┐          ┌──────────────────┐                │
│  │  Web Browser     │          │  Mobile Browser  │                │
│  │  (React/TS App)  │          │  (React/TS App)  │                │
│  └────────┬─────────┘          └────────┬─────────┘                │
│           │                              │                          │
│           └──────────────┬───────────────┘                          │
│                          │                                           │
│                          └──────────────────────────────────────────┤
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Physical Deployment Options:
1. LAN Deployment: Server on Computer C, Clients on A, B, D, E
2. Cloud Deployment: Server on Google Cloud Run (asia-southeast1)
   URL: https://gogotalkie-898222558375.asia-southeast1.run.app/
3. Hybrid: Server on one physical machine, clients distributed globally
```

#### Network Topology

```
                    ┌─────────────────┐
                    │   Internet/LAN   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Load Balancer   │ (Optional: Cloud Run)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   GoTalkie       │
                    │   Server         │
                    │   0.0.0.0:8080   │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌─────▼────┐      ┌──────▼───┐
    │ Client 1 │      │ Client 2 │      │ Client N │
    │ (Alice)  │      │  (Bob)   │      │ (Charlie)│
    │ 192.168  │      │ 192.168  │      │ 10.0.0.x │
    │ .1.100   │      │ .1.101   │      │          │
    └──────────┘      └──────────┘      └──────────┘
    Computer A        Computer B         Computer C
```

#### Server Implementation

**File: `cmd/server/main.go`**

The server is implemented in Go using the Fiber framework and WebSocket protocol:

```go
package main

import (
	"encoding/json"
	"log"

	"github.com/GoGoTalkie/GoTalkie-WebSocket/server"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

var hub *server.Hub

func main() {
	// Initialize the Hub (message router)
	hub = server.NewHub()
	go hub.Run() // Run Hub in separate goroutine

	app := fiber.New()
	
	// Enable CORS for cross-origin WebSocket connections
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	
	// Serve React frontend (built with Vite)
	app.Static("/", "./client/dist", fiber.Static{
		Compress:  true,
		ByteRange: true,
		Browse:    false,
		Index:     "index.html",
	})

	// WebSocket upgrade middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// WebSocket endpoint
	app.Get("/ws", websocket.New(handleWebSocket))

	// Listen on all network interfaces (0.0.0.0)
	// This allows connections from:
	// - Internet (public IP/Cloud Run)
	log.Println("Server starting on http://0.0.0.0:8080")
	log.Fatal(app.Listen("0.0.0.0:8080"))
}
```

**Explanation:**
- **`0.0.0.0:8080`**: Binds to all network interfaces, enabling connections from different physical computers
- **`hub.Run()`**: Runs in a separate goroutine, handling concurrent client connections
- **CORS enabled**: Allows WebSocket connections from different origins (required for cloud deployment)
- **Serves React frontend**: Single-page application built with Vite/TypeScript

#### Hub Architecture (Message Router)

**File: `server/hub.go`**

```go
type Hub struct {
	clients    map[string]*Client      // Connected clients
	groups     map[string]*Group       // Chat groups
	register   chan *Client            // Channel for new clients
	unregister chan *Client            // Channel for disconnecting clients
	mu         sync.RWMutex            // Thread-safe operations
}

type Client struct {
	Name string                // Unique username
	Conn *websocket.Conn       // WebSocket connection
	Send chan []byte           // Buffered message channel
	hub  *Hub                  // Reference to Hub
	mu   sync.Mutex            // Thread-safe operations
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		groups:     make(map[string]*Group),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Hub.Run() - Main event loop handling client lifecycle
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.Name] = client
			h.mu.Unlock()
			h.BroadcastClientList()
			h.BroadcastGroupList()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.Name]; ok {
				delete(h.clients, client.Name)
				close(client.Send)
				// Remove from all groups
				for _, group := range h.groups {
					group.mu.Lock()
					delete(group.Members, client.Name)
					group.mu.Unlock()
				}
			}
			h.mu.Unlock()
			h.BroadcastClientList()
			h.BroadcastGroupList()
		}
	}
}
```

**Explanation:**
- **Concurrent design**: Uses Go channels for thread-safe communication
- **Centralized registry**: Maintains all connected clients in memory
- **Automatic cleanup**: Removes disconnected clients from all groups
- **Real-time updates**: Broadcasts client/group lists to all connected users

#### Hub Components Deep Dive

##### 1. Hub Structure (`server/hub.go`)

```go
type Hub struct {
	clients    map[string]*Client      // เก็บ clients ทั้งหมดที่เชื่อมต่ออยู่
	groups     map[string]*Group       // เก็บ groups ทั้งหมดที่ถูกสร้าง
	register   chan *Client            // Channel สำหรับรับ client ใหม่
	unregister chan *Client            // Channel สำหรับลบ client ที่ disconnect
	mu         sync.RWMutex            // Mutex สำหรับ thread-safe operations
}
```

**คำอธิบายแต่ละส่วน:**

- **`clients map[string]*Client`**: 
  - เป็น HashMap เก็บ clients ทั้งหมดที่เชื่อมต่ออยู่
  - Key: ชื่อ username (string) เช่น "Alice", "Bob"
  - Value: pointer ไปยัง Client struct
  - ใช้ map เพราะ O(1) lookup time เมื่อต้องการส่งข้อความหา client ที่ระบุ
  
- **`groups map[string]*Group`**:
  - เก็บ chat groups ทั้งหมด
  - Key: ชื่อกลุ่ม (string) เช่น "Project Team", "Friends"
  - Value: pointer ไปยัง Group struct
  - ใช้ตอนส่งข้อความไปยังสมาชิกในกลุ่ม

- **`register chan *Client`**:
  - Channel สำหรับรับ client ใหม่ที่ต้องการลงทะเบียน
  - Unbuffered channel (block จนกว่าจะมีคนรับ)
  - ทำให้การเพิ่ม client เป็น thread-safe

- **`unregister chan *Client`**:
  - Channel สำหรับรับ client ที่ disconnect แล้ว
  - ใช้เมื่อ WebSocket connection ขาดหรือ client ปิดเบราว์เซอร์
  - ทำให้การลบ client เป็น thread-safe

- **`mu sync.RWMutex`**:
  - Read-Write Mutex สำหรับป้องกัน race condition
  - RLock(): อนุญาตให้หลาย goroutines อ่านพร้อมกัน
  - Lock(): block ทุกอย่างเมื่อเขียน
  - ใช้ปกป้อง clients map และ groups map

##### 2. Client Structure

```go
type Client struct {
	Name string                // Username ของ client
	Conn *websocket.Conn       // WebSocket connection (TCP socket)
	Send chan []byte           // Buffered channel สำหรับส่งข้อความ
	hub  *Hub                  // Reference กลับไปยัง Hub
	mu   sync.Mutex            // Mutex สำหรับ thread-safe operations
}
```

**คำอธิบายแต่ละส่วน:**

- **`Name string`**: 
  - Username ที่ต้องไม่ซ้ำกันในระบบ
  - ใช้เป็น key ใน Hub.clients map
  - แสดงในรายชื่อผู้ใช้ออนไลน์

- **`Conn *websocket.Conn`**:
  - WebSocket connection (TCP socket) ระหว่าง server กับ client
  - ใช้สำหรับ ReadMessage() และ WriteMessage()
  - เป็น raw socket connection ที่รักษาสถานะเชื่อมต่อไว้ตลอด

- **`Send chan []byte`**:
  - **Buffered channel** ขนาด 256 bytes
  - ใช้สำหรับ queue ข้อความที่จะส่งไปยัง client
  - Buffered ป้องกันไม่ให้ Hub.Run() block เมื่อส่งข้อความ
  - WritePump() จะอ่านจาก channel นี้และเขียนไปยัง WebSocket

- **`hub *Hub`**:
  - Reference กลับไปยัง Hub หลัก
  - ใช้เรียก hub.UnregisterClient() เมื่อ disconnect
  - ใช้เรียก hub.HandleMessage() เมื่อได้รับข้อความ

- **`mu sync.Mutex`**:
  - Mutex สำหรับป้องกัน race condition
  - ใช้เมื่อเข้าถึง client data พร้อมกันจากหลาย goroutines

##### 3. Group Structure

```go
type Group struct {
	Name    string              // ชื่อกลุ่ม
	Creator string              // ชื่อคนสร้างกลุ่ม
	Members map[string]bool     // สมาชิกในกลุ่ม
	mu      sync.RWMutex        // Mutex สำหรับ thread-safe
}
```

**คำอธิบายแต่ละส่วน:**

- **`Name string`**: ชื่อกลุ่ม (ไม่ซ้ำ)
- **`Creator string`**: Username ของคนที่สร้างกลุ่ม
- **`Members map[string]bool`**: 
  - Key: username ของสมาชิก
  - Value: true (ใช้ map แทน slice เพื่อ O(1) lookup)
- **`mu sync.RWMutex`**: ป้องกัน race condition เมื่อเพิ่ม/ลบสมาชิก

##### 4. Hub.Run() - Main Event Loop

```go
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// มี client ใหม่ต้องการลงทะเบียน
			h.mu.Lock()                          // Lock เพื่อเขียน
			h.clients[client.Name] = client      // เพิ่ม client เข้า map
			h.mu.Unlock()                        // Unlock
			h.BroadcastClientList()              // ส่งรายชื่อ clients ใหม่ไปทุกคน
			h.BroadcastGroupList()               // ส่งรายการ groups ไปทุกคน

		case client := <-h.unregister:
			// มี client disconnect
			h.mu.Lock()                          // Lock เพื่อเขียน
			if _, ok := h.clients[client.Name]; ok {
				delete(h.clients, client.Name)   // ลบ client จาก map
				close(client.Send)               // ปิด Send channel
				
				// ลบออกจากทุก groups
				for _, group := range h.groups {
					group.mu.Lock()
					delete(group.Members, client.Name)
					group.mu.Unlock()
				}
			}
			h.mu.Unlock()                        // Unlock
			h.BroadcastClientList()              // อัพเดทรายชื่อ
			h.BroadcastGroupList()               // อัพเดทรายการกลุ่ม
		}
	}
}
```

**Flow การทำงาน:**

1. **Infinite Loop**: รันตลอดเวลาใน goroutine แยก
2. **Select Statement**: รอ event จาก channels
3. **Register Case**:
   - รับ client ใหม่จาก register channel
   - Lock mutex → เพิ่ม client → Unlock
   - Broadcast รายชื่อใหม่ไปทุกคน
4. **Unregister Case**:
   - รับ client ที่ disconnect
   - Lock mutex → ลบ client → ลบจาก groups → Unlock
   - Broadcast รายชื่อใหม่ไปทุกคน

**ทำไมต้องใช้ channels?**
- Thread-safe: Go scheduler จัดการ synchronization
- Non-blocking: Hub.Run() ไม่ block จนกว่าจะมี event
- Clean design: แยก concerns ระหว่าง registration logic กับ message handling

##### 5. Client.ReadPump() - รับข้อความจาก Client

```go
func (c *Client) ReadPump() {
	defer func() {
		c.hub.UnregisterClient(c)    // ลงทะเบียนออกเมื่อจบ
		c.Conn.Close()                // ปิด TCP socket
	}()

	for {
		// Blocking read จาก WebSocket socket
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			// Error = connection closed/timeout/network error
			break  // ออกจาก loop
		}
		// ส่งข้อความไปยัง Hub เพื่อ routing
		c.hub.HandleMessage(c, message)
	}
}
```

**Flow การทำงาน:**

1. **Infinite Loop**: อ่านข้อความจาก socket ตลอดเวลา
2. **ReadMessage()**: 
   - **Blocking I/O** - รอจนกว่าจะมีข้อความมา
   - อ่านจาก TCP socket โดยตรง
   - Return: (messageType, data, error)
3. **Error Handling**:
   - เกิด error เมื่อ: connection ปิด, timeout, network failure
   - Break จาก loop → defer ทำงาน → unregister + close socket
4. **HandleMessage()**: ส่งข้อความไปยัง Hub เพื่อ routing ต่อ

**ทำไมเป็น Blocking?**
- Go scheduler จัดการ goroutines อย่างมีประสิทธิภาพ
- แต่ละ client มี goroutine เป็นของตัวเอง
- ไม่กระทบ performance เพราะ Go รองรับ 1000+ goroutines

##### 6. Client.WritePump() - ส่งข้อความไปยัง Client

```go
func (c *Client) WritePump() {
	defer c.Conn.Close()  // ปิด socket เมื่อจบ

	for message := range c.Send {
		// Blocking write ไปยัง WebSocket socket
		if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			// Error = connection closed/buffer full
			break  // ออกจาก loop
		}
	}
}
```

**Flow การทำงาน:**

1. **Range over Channel**: อ่านข้อความจาก c.Send channel
2. **WriteMessage()**:
   - **Blocking I/O** - เขียนไปยัง TCP socket
   - ส่ง WebSocket frame (text type)
   - Return error ถ้า socket ปิดหรือ buffer เต็ม
3. **Error Handling**: Break จาก loop → defer close socket
4. **Channel Closed**: เมื่อ Hub close(client.Send) → loop จบอัตโนมัติ

**ทำไมต้องใช้ Channel?**
- **Decoupling**: แยก logic การส่งข้อความออกจาก Hub
- **Buffering**: Buffer 256 bytes ป้องกัน Hub block
- **Thread-safe**: Go channel จัดการ synchronization

##### 7. Hub.HandleMessage() - Routing ข้อความ

```go
func (h *Hub) HandleMessage(client *Client, data []byte) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return  // Invalid JSON
	}

	msg.From = client.Name  // เพิ่มชื่อผู้ส่ง

	switch msg.Type {
	case MsgTypePrivate:
		// ส่งข้อความส่วนตัว (1-to-1)
		h.SendToClient(msg.To, msg)        // ส่งให้ผู้รับ
		h.SendToClient(msg.From, msg)      // ส่งกลับให้ผู้ส่ง (echo)

	case MsgTypeGroupMessage:
		// ส่งข้อความในกลุ่ม (1-to-many)
		h.SendToGroup(msg.GroupName, msg)

	case MsgTypeCreateGroup:
		// สร้างกลุ่มใหม่
		h.mu.Lock()
		if _, exists := h.groups[msg.GroupName]; !exists {
			h.groups[msg.GroupName] = &Group{
				Name:    msg.GroupName,
				Creator: client.Name,
				Members: map[string]bool{client.Name: true},  // Creator เป็นสมาชิกคนแรก
			}
		}
		h.mu.Unlock()
		h.BroadcastGroupList()  // แจ้งทุกคนว่ามีกลุ่มใหม่

	case MsgTypeJoinGroup:
		// เข้าร่วมกลุ่ม
		h.mu.Lock()
		if group, exists := h.groups[msg.GroupName]; exists {
			group.mu.Lock()
			group.Members[client.Name] = true  // เพิ่มเป็นสมาชิก
			group.mu.Unlock()
		}
		h.mu.Unlock()
		h.BroadcastGroupList()  // อัพเดทรายการสมาชิก

	case MsgTypeLeaveGroup:
		// ออกจากกลุ่ม
		h.mu.Lock()
		if group, exists := h.groups[msg.GroupName]; exists {
			group.mu.Lock()
			delete(group.Members, client.Name)

			// ถ้าไม่มีสมาชิกเหลือ ลบกลุ่ม
			if len(group.Members) == 0 {
				group.mu.Unlock()
				delete(h.groups, msg.GroupName)
			} else {
				group.mu.Unlock()
			}
		}
		h.mu.Unlock()
		h.BroadcastGroupList()

	case MsgTypeFilePrivate:
		// ส่งไฟล์ส่วนตัว
		h.SendToClient(msg.To, msg)
		h.SendToClient(msg.From, msg)

	case MsgTypeFileGroup:
		// ส่งไฟล์ในกลุ่ม
		h.SendToGroup(msg.GroupName, msg)
	}
}
```

**Message Types:**
- **MsgTypePrivate**: ส่งข้อความหา client คนเดียว
- **MsgTypeGroupMessage**: ส่งข้อความหาทุกคนในกลุ่ม
- **MsgTypeCreateGroup**: สร้างกลุ่มใหม่
- **MsgTypeJoinGroup**: เข้าร่วมกลุ่ม
- **MsgTypeLeaveGroup**: ออกจากกลุ่ม
- **MsgTypeFilePrivate**: ส่งไฟล์ส่วนตัว
- **MsgTypeFileGroup**: ส่งไฟล์ในกลุ่ม

##### 8. Hub.SendToClient() - ส่งข้อความหา Client คนเดียว

```go
func (h *Hub) SendToClient(clientName string, msg Message) {
	data, _ := json.Marshal(msg)  // แปลง Message struct เป็น JSON
	
	h.mu.RLock()                   // Read lock
	client, ok := h.clients[clientName]  // หา client จาก map
	h.mu.RUnlock()                 // Unlock

	if ok {
		select {
		case client.Send <- data:  // ส่งข้อความเข้า channel (non-blocking)
		default:
			// Channel full - skip message
		}
	}
}
```

**คำอธิบาย:**
- **RLock/RUnlock**: อ่าน clients map แบบ thread-safe
- **select with default**: non-blocking send
  - ถ้า channel ว่าง → ส่งข้อความได้
  - ถ้า channel เต็ม (256 bytes) → skip ข้อความ (ป้องกัน deadlock)
- **JSON Marshal**: แปลง struct เป็น JSON string

##### 9. Hub.SendToGroup() - ส่งข้อความหาทุกคนในกลุ่ม

```go
func (h *Hub) SendToGroup(groupName string, msg Message) {
	h.mu.RLock()
	group, ok := h.groups[groupName]  // หากลุ่ม
	h.mu.RUnlock()

	if !ok {
		return  // กลุ่มไม่มีอยู่
	}

	data, _ := json.Marshal(msg)
	
	group.mu.RLock()  // Lock group
	defer group.mu.RUnlock()

	h.mu.RLock()      // Lock clients
	defer h.mu.RUnlock()

	// วนลูปส่งหาทุกสมาชิกในกลุ่ม
	for memberName := range group.Members {
		if client, ok := h.clients[memberName]; ok {
			select {
			case client.Send <- data:  // Non-blocking send
			default:
				// Skip if channel full
			}
		}
	}
}
```

**คำอธิบาย:**
- หา group จาก groups map
- Lock ทั้ง group และ clients map
- วนลูปส่งข้อความหาทุก member ที่ออนไลน์อยู่
- ใช้ select/default เพื่อ non-blocking send

##### 10. Hub.BroadcastClientList() - ส่งรายชื่อ Clients ทั้งหมด

```go
func (h *Hub) BroadcastClientList() {
	h.mu.RLock()
	clientNames := make([]string, 0, len(h.clients))
	for name := range h.clients {
		clientNames = append(clientNames, name)  // รวบรวมชื่อ
	}
	h.mu.RUnlock()

	msg := Message{
		Type:    MsgTypeClientList, 
		Clients: clientNames,
	}
	h.Broadcast(msg)  // ส่งไปทุกคน
}
```

**คำอธิบาย:**
- รวบรวมชื่อ clients ทั้งหมดใน slice
- สร้าง Message type "client_list"
- Broadcast ไปยัง clients ทุกคน
- Client จะได้รับรายชื่อและแสดงใน UI

##### 11. Hub.Broadcast() - ส่งข้อความหาทุกคน

```go
func (h *Hub) Broadcast(msg Message) {
	data, _ := json.Marshal(msg)
	
	h.mu.RLock()
	clients := make([]*Client, 0, len(h.clients))
	for _, client := range h.clients {
		clients = append(clients, client)  // Copy clients to slice
	}
	h.mu.RUnlock()

	// ส่งหาทุกคน
	for _, client := range clients {
		select {
		case client.Send <- data:
		default:
			// Skip if channel full
		}
	}
}
```

**คำอธิบาย:**
- Copy clients ไปยัง slice (ป้องกัน lock นาน)
- Unlock ก่อนส่งข้อความ
- วนลูปส่งข้อความหาทุก client
- Non-blocking send ป้องกัน deadlock

#### Hub Architecture Summary

```
                         Hub (Central Router)
                         ┌─────────────────────┐
                         │                     │
    Client A ────────────┤  clients map       │
    (Alice)     TCP      │  [Alice] -> Client │
                Socket   │  [Bob]   -> Client │
                         │  [Charlie] -> ...  │
    Client B ────────────┤                     │
    (Bob)                │  groups map        │
                         │  [Team] -> Group   │
    Client C ────────────┤  [Friends] -> ...  │
    (Charlie)            │                     │
                         │  Channels:         │
                         │  - register        │
                         │  - unregister      │
                         └─────────────────────┘

Goroutines per Client:
1. ReadPump()  - อ่านจาก socket
2. WritePump() - เขียนไปยัง socket
3. Hub.Run()   - จัดการ lifecycle (shared)

Total Goroutines = (2 × N clients) + 1
Example: 10 clients = 21 goroutines
```

#### Concurrency Model

**Thread Safety Mechanisms:**
1. **Channels**: register, unregister (event-based)
2. **Mutex**: `sync.RWMutex` for maps (lock-based)
3. **Buffered Channels**: `Send chan []byte` (prevents blocking)
4. **Goroutines**: 1 per client (ReadPump + WritePump)

**Why This Design Works:**
- ✅ **Scalable**: รองรับ 1000+ concurrent connections
- ✅ **Thread-safe**: ไม่มี race conditions
- ✅ **Non-blocking**: Hub ไม่ block จาก slow clients
- ✅ **Clean separation**: แต่ละ component มีหน้าที่ชัดเจน
- ✅ **Automatic cleanup**: clients/groups ถูกลบอัตโนมัติเมื่อ disconnect

#### Cloud Deployment (Bonus +1 point)

**Deployment URL:** https://gogotalkie-898222558375.asia-southeast1.run.app/

**Dockerfile (Multi-stage build):**

```dockerfile
# Stage 1: Build React frontend
FROM node:20-alpine AS node_builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci --silent
COPY client/ ./
RUN npm run build

# Stage 2: Build Go server
FROM golang:1.24.3-alpine AS go_builder
RUN apk add --no-cache git ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags "-w -s" -o bin/server ./cmd/server

# Stage 3: Runtime (distroless for security)
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=go_builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=go_builder --chown=nonroot:nonroot /app/bin/server /app/server
COPY --from=node_builder --chown=nonroot:nonroot /app/client/dist /app/client/dist
USER nonroot:nonroot
WORKDIR /app
EXPOSE 8080
ENTRYPOINT ["/app/server"]
```

**Cloud Run Configuration:**
- **Region:** asia-southeast1 (Singapore)
- **Min instances:** 1
- **Max instances:** 1 (to maintain WebSocket state)
- **Session affinity:** Enabled
- **CPU:** 1
- **Memory:** 512Mi

---

### R2: Socket Programming Implementation (0.5 points)

#### WebSocket Protocol (RFC 6455)

The system uses **WebSocket protocol** for bidirectional, full-duplex communication over a single TCP connection. WebSocket is a low-level socket programming protocol that operates over TCP/IP.

#### Protocol Stack

```
┌─────────────────────────────────────────────────────────┐
│ Application Layer (L7)                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ WebSocket Protocol (RFC 6455)                       │ │
│ │ • Handshake: HTTP/1.1 Upgrade                       │ │
│ │ • Frames: Text/Binary/Control frames                │ │
│ │ • Persistent connection                             │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Transport Layer (L4)                                     │
│ • TCP (Transmission Control Protocol)                   │
│ • Port: 8080                                             │
│ • Connection-oriented, reliable, ordered delivery       │
├─────────────────────────────────────────────────────────┤
│ Network Layer (L3)                                       │
│ • IP (Internet Protocol) - IPv4/IPv6                    │
│ • Routing, addressing                                    │
├─────────────────────────────────────────────────────────┤
│ Data Link Layer (L2)                                     │
│ • Ethernet / Wi-Fi                                       │
└─────────────────────────────────────────────────────────┘
```

#### Server-Side Socket Programming

**File: `cmd/server/main.go` - WebSocket Handler**

```go
func handleWebSocket(c *websocket.Conn) {
	// 1. Read initial registration message from socket
	var regMsg server.Message
	err := c.ReadJSON(&regMsg)
	if err != nil {
		c.Close()
		return
	}

	// 2. Validate registration
	if regMsg.Type != server.MsgTypeRegister || regMsg.Content == "" {
		c.WriteJSON(server.Message{
			Type: server.MsgTypeError, 
			Error: "Must register first"
		})
		c.Close()
		return
	}

	// 3. Check for duplicate username
	if hub.ClientExists(regMsg.Content) {
		c.WriteJSON(server.Message{
			Type: server.MsgTypeError, 
			Error: "Name taken"
		})
		c.Close()
		return
	}

	// 4. Register client with Hub
	client := hub.RegisterClient(regMsg.Content, c)
	defer hub.UnregisterClient(client)

	// 5. Send confirmation message through socket
	confirmMsg := server.Message{
		Type: server.MsgTypeRegister, 
		Content: "Registered as " + client.Name
	}
	confirmData, _ := json.Marshal(confirmMsg)
	client.Send <- confirmData

	// 6. Start bidirectional communication
	go client.WritePump()  // Write goroutine
	client.ReadPump()      // Read in main goroutine
}
```

**Explanation:**
1. **Socket Connection**: `websocket.Conn` represents the TCP socket connection
2. **ReadJSON/WriteJSON**: Direct socket I/O operations for reading/writing messages
3. **Blocking I/O**: `ReadPump()` blocks waiting for incoming socket data
4. **Concurrent I/O**: Separate goroutines for reading and writing prevent blocking

**File: `server/hub.go` - Client Read/Write Pumps**

```go
// ReadPump - Continuously reads from WebSocket socket
func (c *Client) ReadPump() {
	defer func() {
		c.hub.UnregisterClient(c)
		c.Conn.Close()  // Close TCP socket
	}()

	for {
		// Blocking socket read operation
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			// Socket error (connection closed, timeout, etc.)
			break
		}
		// Route message through Hub
		c.hub.HandleMessage(c, message)
	}
}

// WritePump - Continuously writes to WebSocket socket
func (c *Client) WritePump() {
	defer c.Conn.Close()  // Close TCP socket on exit

	for message := range c.Send {
		// Blocking socket write operation
		if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			// Socket error (connection closed, buffer full, etc.)
			break
		}
	}
}
```

**Explanation:**
- **`ReadMessage()`**: Low-level socket read operation (blocking I/O)
- **`WriteMessage()`**: Low-level socket write operation (blocking I/O)
- **Error handling**: Detects socket errors (connection loss, timeouts)
- **Resource cleanup**: Ensures socket is properly closed using `defer`

#### Message Routing in Hub

**File: `server/hub.go` - HandleMessage**

```go
func (h *Hub) HandleMessage(client *Client, data []byte) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return
	}

	msg.From = client.Name

	switch msg.Type {
	case MsgTypePrivate:
		// Send to specific client's socket
		h.SendToClient(msg.To, msg)
		h.SendToClient(msg.From, msg)

	case MsgTypeGroupMessage:
		// Send to all group members' sockets
		h.SendToGroup(msg.GroupName, msg)

	case MsgTypeCreateGroup:
		h.mu.Lock()
		if _, exists := h.groups[msg.GroupName]; !exists {
			h.groups[msg.GroupName] = &Group{
				Name:    msg.GroupName,
				Creator: client.Name,
				Members: map[string]bool{client.Name: true},
			}
		}
		h.mu.Unlock()
		h.BroadcastGroupList()

	case MsgTypeJoinGroup:
		h.mu.Lock()
		if group, exists := h.groups[msg.GroupName]; exists {
			group.mu.Lock()
			group.Members[client.Name] = true
			group.mu.Unlock()
		}
		h.mu.Unlock()
		h.BroadcastGroupList()
	}
}

// SendToClient - Direct socket write to specific client
func (h *Hub) SendToClient(clientName string, msg Message) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	client, ok := h.clients[clientName]
	h.mu.RUnlock()

	if ok {
		select {
		case client.Send <- data:  // Non-blocking send to socket
		default:
			// Skip if socket buffer is full
		}
	}
}
```

**Explanation:**
- **Direct socket communication**: Messages are sent directly to client sockets
- **Non-blocking sends**: Uses Go channels with `select` to prevent deadlocks
- **Message serialization**: JSON encoding over raw socket data

#### Client-Side Socket Programming

**File: `client/src/services/websocket.ts`**

```typescript
export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;

  constructor() {
    // Auto-detect WebSocket protocol and host
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host || 'localhost:8080';
    this.url = `${wsProtocol}//${wsHost}/ws`;
  }

  connect(
    username: string,
    onMessage: (msg: Message) => void,
    onError: () => void,
    onClose: (code: number) => void
  ): void {
    // Establish TCP socket connection via WebSocket
    this.ws = new WebSocket(this.url);

    // Socket connection established
    this.ws.onopen = () => {
      // Send registration message through socket
      this.send(MessageTypes.REGISTER, username);
    };

    // Socket data received
    this.ws.onmessage = (event) => {
      const msg: Message = JSON.parse(event.data);
      onMessage(msg);
    };

    // Socket error
    this.ws.onerror = () => {
      onError();
    };

    // Socket connection closed
    this.ws.onclose = (event) => {
      onClose(event.code);
    };
  }

  // Send data through socket
  send(type: MessageType, content?: string, to?: string, group_name?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: Message = { type };
      if (content !== undefined) message.content = content;
      if (to !== undefined) message.to = to;
      if (group_name !== undefined) message.group_name = group_name;
      
      // Write to socket
      this.ws.send(JSON.stringify(message));
    }
  }

  // Close socket connection
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Check socket connection status
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
```

**Explanation:**
- **WebSocket API**: Browser's native socket programming interface
- **`new WebSocket(url)`**: Establishes TCP connection to server
- **`onopen/onmessage/onerror/onclose`**: Event-driven socket I/O
- **`send()`**: Writes data directly to TCP socket
- **`readyState`**: Monitors TCP connection status

#### WebSocket Handshake (Socket Upgrade)

```
Client                                    Server
  |                                         |
  | HTTP GET /ws                            |
  | Upgrade: websocket                      |
  | Connection: Upgrade                     |
  | Sec-WebSocket-Key: xxx                 |
  |---------------------------------------->|
  |                                         |
  |           HTTP 101 Switching Protocols  |
  |           Upgrade: websocket            |
  |           Connection: Upgrade           |
  |           Sec-WebSocket-Accept: yyy     |
  |<----------------------------------------|
  |                                         |
  | [TCP socket now in WebSocket mode]     |
  |                                         |
  | WebSocket Frame: {"type":"register"}   |
  |---------------------------------------->|
  |                                         |
  | WebSocket Frame: {"type":"client_list"}|
  |<----------------------------------------|
  |                                         |
```

**Explanation:**
1. **HTTP Upgrade**: Initial HTTP request to upgrade TCP connection
2. **101 Switching Protocols**: Server accepts upgrade, socket enters WebSocket mode
3. **Persistent TCP connection**: Socket remains open for bidirectional communication
4. **Frame-based protocol**: Messages are sent as WebSocket frames over TCP

#### Socket Programming Features

**1. Low-Level Socket Operations:**
```go
// Direct socket read (blocking I/O)
messageType, data, err := conn.ReadMessage()

// Direct socket write (blocking I/O)
err = conn.WriteMessage(websocket.TextMessage, data)

// Close socket
conn.Close()
```

**2. TCP Connection Management:**
```go
// Server binds to TCP port 8080 on all interfaces
app.Listen("0.0.0.0:8080")

// Client connects to TCP socket
ws = new WebSocket("ws://server:8080/ws")
```

**3. Concurrent Socket Handling:**
```go
// Each client connection runs in separate goroutines
go client.WritePump()  // Goroutine for socket writes
client.ReadPump()      // Main goroutine for socket reads
```

**4. Socket Buffer Management:**
```go
// Buffered channel for socket writes (prevents blocking)
Send: make(chan []byte, 256)

// Non-blocking socket write
select {
case client.Send <- data:
default:
    // Skip if buffer full
}
```

#### Socket Programming Implementation - Detailed Explanation

**R2 Requirement: "The chat messages between the server and each client must be implemented using Socket Programming only"**

This project implements **pure socket programming** using the WebSocket protocol (RFC 6455), which is a **low-level TCP socket-based protocol**. No high-level messaging services are used.

##### What is Socket Programming?

Socket Programming is **direct communication between two endpoints using TCP/IP sockets**:
- **Socket**: An endpoint for sending/receiving data over a network
- **TCP Socket**: Connection-oriented, reliable, bidirectional communication channel
- **Socket Operations**: Read, Write, Connect, Accept, Close
- **No Middleware**: Direct communication without message queues or pub/sub systems

##### Socket Programming in This Project

**1. Server-Side Socket Creation (Go)**

```go
// File: cmd/server/main.go

// Server binds to TCP socket on all interfaces
app.Listen("0.0.0.0:8080")  // Creates TCP socket listening on port 8080

// This is equivalent to:
// socket = socket(AF_INET, SOCK_STREAM, 0)  // Create socket
// bind(socket, "0.0.0.0", 8080)             // Bind to address/port
// listen(socket, backlog)                   // Listen for connections
```

**What happens:**
- Creates a TCP socket (SOCK_STREAM = TCP)
- Binds to IP address 0.0.0.0 (all network interfaces)
- Listens on port 8080
- Accepts incoming connections from clients

**2. Client-Side Socket Connection (TypeScript)**

```typescript
// File: client/src/services/websocket.ts

// Client creates TCP socket connection to server
this.ws = new WebSocket(this.url);  // e.g., "ws://server:8080/ws"

// This is equivalent to:
// socket = socket(AF_INET, SOCK_STREAM, 0)     // Create socket
// connect(socket, "server_ip", 8080)           // Connect to server
```

**What happens:**
- Creates a client TCP socket
- Initiates 3-way TCP handshake (SYN, SYN-ACK, ACK)
- Establishes persistent connection to server
- Upgrades HTTP connection to WebSocket protocol

**3. WebSocket Upgrade (Socket Handshake)**

```
Client Socket                           Server Socket
     |                                       |
     | TCP 3-way Handshake                   |
     |-------------------------------------->|
     |<--------------------------------------|
     |                                       |
     | HTTP GET /ws (Upgrade Request)        |
     | Upgrade: websocket                    |
     | Connection: Upgrade                   |
     |-------------------------------------->|
     |                                       |
     |         HTTP 101 Switching Protocols  |
     |         Upgrade: websocket            |
     |<--------------------------------------|
     |                                       |
     | [TCP Socket now in WebSocket mode]   |
     | Full-duplex bidirectional communication|
     |                                       |
```

**4. Socket Write Operations (Server → Client)**

**Code Snippet:**
```go
// File: server/hub.go - WritePump()

func (c *Client) WritePump() {
	defer c.Conn.Close()  // Close TCP socket when done

	for message := range c.Send {
		// DIRECT SOCKET WRITE OPERATION
		// This writes raw bytes directly to the TCP socket
		err := c.Conn.WriteMessage(websocket.TextMessage, message)
		
		if err != nil {
			// Socket error: connection closed, buffer full, network error
			break
		}
	}
}
```

**Low-level socket operations:**
```go
// WriteMessage() internally calls:
// 1. Frame the message (WebSocket framing)
// 2. write(socket_fd, buffer, length)  ← ACTUAL SOCKET WRITE
// 3. Check for errors (ECONNRESET, EPIPE, etc.)
```

**What WriteMessage does:**
1. Takes message bytes
2. Wraps in WebSocket frame format (header + payload)
3. **Calls OS system call**: `write(socket_fd, data, len)`
4. Writes directly to TCP send buffer
5. TCP layer sends packets over network

**Example of actual data sent:**
```
WebSocket Frame Structure:
┌─────────┬─────────┬─────────┬──────────────┐
│ FIN=1   │ Opcode  │ Payload │   Message    │
│ (1 bit) │ (4 bits)│ Length  │     Data     │
├─────────┼─────────┼─────────┼──────────────┤
│    1    │  0001   │   125   │ {"type":".."}│
└─────────┴─────────┴─────────┴──────────────┘
     ↓
Direct TCP Socket Write
     ↓
Network Layer (IP packets)
```

**5. Socket Read Operations (Server ← Client)**

**Code Snippet:**
```go
// File: server/hub.go - ReadPump()

func (c *Client) ReadPump() {
	defer func() {
		c.hub.UnregisterClient(c)
		c.Conn.Close()  // Close TCP socket
	}()

	for {
		// DIRECT SOCKET READ OPERATION (BLOCKING)
		// This reads raw bytes directly from the TCP socket
		messageType, message, err := c.Conn.ReadMessage()
		
		if err != nil {
			// Socket errors:
			// - ECONNRESET: Connection reset by peer
			// - EOF: Connection closed
			// - ETIMEDOUT: Read timeout
			break
		}
		
		// Process message received from socket
		c.hub.HandleMessage(c, message)
	}
}
```

**Low-level socket operations:**
```go
// ReadMessage() internally calls:
// 1. read(socket_fd, buffer, length)  ← ACTUAL SOCKET READ (BLOCKING)
// 2. Parse WebSocket frame
// 3. Extract message payload
// 4. Return data to application
```

**What ReadMessage does:**
1. **Blocks** waiting for data on TCP socket
2. **Calls OS system call**: `read(socket_fd, buffer, len)`
3. Reads from TCP receive buffer
4. Parses WebSocket frame format
5. Extracts actual message payload
6. Returns to application

**6. Socket Connection Management**

**Accept New Connection:**
```go
// File: cmd/server/main.go - handleWebSocket

func handleWebSocket(c *websocket.Conn) {
	// c *websocket.Conn = TCP socket connection from client
	
	// Read from socket (blocking)
	var regMsg server.Message
	err := c.ReadJSON(&regMsg)  // Reads from TCP socket
	if err != nil {
		c.Close()  // Close TCP socket
		return
	}
	
	// Write to socket
	c.WriteJSON(server.Message{
		Type: server.MsgTypeRegister,
		Content: "Registered as " + client.Name,
	})  // Writes to TCP socket
	
	// Start bidirectional socket I/O
	go client.WritePump()  // Goroutine for socket writes
	client.ReadPump()      // Main goroutine for socket reads
}
```

**7. Client-Side Socket Operations**

**Code Snippet:**
```typescript
// File: client/src/services/websocket.ts

export class WebSocketService {
  private ws: WebSocket | null = null;

  connect(username: string, onMessage, onError, onClose): void {
    // SOCKET CREATION AND CONNECTION
    this.ws = new WebSocket(this.url);
    // Equivalent to: socket() + connect()

    // SOCKET EVENT: Connection established
    this.ws.onopen = () => {
      // SOCKET WRITE: Send data to server
      this.send(MessageTypes.REGISTER, username);
    };

    // SOCKET EVENT: Data received
    this.ws.onmessage = (event) => {
      // SOCKET READ: Read data from server
      const msg: Message = JSON.parse(event.data);
      onMessage(msg);
    };

    // SOCKET EVENT: Connection error
    this.ws.onerror = () => {
      onError();
    };

    // SOCKET EVENT: Connection closed
    this.ws.onclose = (event) => {
      onClose(event.code);
    };
  }

  // SOCKET WRITE OPERATION
  send(type: MessageType, content?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, content };
      
      // DIRECT SOCKET WRITE
      this.ws.send(JSON.stringify(message));
      // Browser internally calls: send(socket_fd, data, len)
    }
  }

  // SOCKET CLOSE OPERATION
  close(): void {
    if (this.ws) {
      this.ws.close();  // Closes TCP socket
      // Browser internally calls: close(socket_fd)
    }
  }
}
```

**8. Socket States and Error Handling**

```typescript
// WebSocket.readyState maps to TCP socket states:

WebSocket.CONNECTING = 0  // TCP handshake in progress
WebSocket.OPEN       = 1  // TCP connection established (ESTABLISHED)
WebSocket.CLOSING    = 2  // TCP close initiated (FIN_WAIT)
WebSocket.CLOSED     = 3  // TCP connection closed (CLOSED)

// Socket errors handled:
- ECONNREFUSED: Server not listening
- ECONNRESET: Connection reset by peer
- ETIMEDOUT: Connection timeout
- EPIPE: Broken pipe (write to closed socket)
- ENOTCONN: Socket not connected
```

**9. Complete Message Flow (Socket-Level)**

```
Client Browser                          Go Server
──────────────                          ─────────

[1] Create Socket
    socket = new WebSocket(url)
                │
                ▼
    TCP SYN ───────────────────────────> 
                                         accept()
    <─────────────────────────── TCP SYN-ACK
                │
                ▼
    TCP ACK ───────────────────────────>
                                         [Socket connected]

[2] WebSocket Upgrade
    HTTP GET /ws
    Upgrade: websocket ─────────────────>
                                         websocket.IsWebSocketUpgrade()
    <──────────────────────── HTTP 101
                                         websocket.New(handler)

[3] Socket Write (Client → Server)
    ws.send(JSON) ──────────────────────>
                                         ReadMessage() ← SOCKET READ
                                         HandleMessage()

[4] Socket Write (Server → Client)
                                         WriteMessage() ← SOCKET WRITE
    <────────────────────────── message
    onmessage(event) ← SOCKET READ

[5] Socket Close
    ws.close() ─────────────────────────>
    TCP FIN ────────────────────────────>
                                         ReadMessage() returns EOF
                                         Close() ← SOCKET CLOSE
    <───────────────────────────── TCP FIN-ACK
    [Socket closed]
```

**10. Proof: No High-Level Messaging Services**

**Dependencies Analysis:**
```go
// File: go.mod
module github.com/GoGoTalkie/GoTalkie-WebSocket

require (
    github.com/gofiber/fiber/v2 v2.52.9      // HTTP framework
    github.com/gofiber/websocket/v2 v2.2.1   // WebSocket library
)

// NO message queue libraries:
// ❌ github.com/streadway/amqp         (RabbitMQ)
// ❌ github.com/Shopify/sarama         (Kafka)
// ❌ github.com/go-redis/redis         (Redis Pub/Sub)
// ❌ github.com/nats-io/nats.go        (NATS)
// ❌ github.com/nsqio/go-nsq           (NSQ)

// ONLY socket-level libraries:
// ✅ github.com/gorilla/websocket       (TCP sockets with WebSocket framing)
```

**What gofiber/websocket does:**
```go
// It's a thin wrapper around gorilla/websocket
// which is a thin wrapper around net.Conn (TCP sockets)

type Conn struct {
    conn net.Conn  // ← This is the actual TCP socket!
    // ... WebSocket framing logic
}

// All I/O goes through net.Conn:
func (c *Conn) ReadMessage() (int, []byte, error) {
    return c.conn.Read(buffer)  // ← Direct TCP socket read
}

func (c *Conn) WriteMessage(messageType int, data []byte) error {
    return c.conn.Write(frame)  // ← Direct TCP socket write
}
```

**11. Socket System Calls (Under the Hood)**

**Server side (Go):**
```go
// When you call:
conn.ReadMessage()

// Go runtime calls:
syscall.Read(fd, buffer, len)  // ← POSIX socket read

// Kernel performs:
1. Block until data arrives on socket
2. Copy data from kernel buffer to user space
3. Return number of bytes read

// When you call:
conn.WriteMessage(websocket.TextMessage, data)

// Go runtime calls:
syscall.Write(fd, buffer, len)  // ← POSIX socket write

// Kernel performs:
1. Copy data from user space to kernel buffer
2. TCP layer segments data into packets
3. IP layer routes packets to destination
4. Network interface sends packets
```

**Client side (Browser JavaScript):**
```javascript
// When you call:
ws.send(message)

// Browser internally calls:
send(socket_fd, buffer, length, flags)  // ← C socket API

// When socket receives data:
recv(socket_fd, buffer, length, flags)  // ← C socket API
// Triggers: ws.onmessage event
```

**12. TCP Socket Properties Used**

```
Socket Properties:
├─ Connection-oriented: 3-way handshake (SYN, SYN-ACK, ACK)
├─ Reliable delivery: Acknowledgments (ACK) and retransmissions
├─ Ordered delivery: Sequence numbers ensure correct order
├─ Full-duplex: Bidirectional simultaneous communication
├─ Stream-based: Byte stream (no message boundaries)
└─ Flow control: Sliding window, congestion control

WebSocket adds:
├─ Message framing: Boundaries for messages
├─ Text/Binary types: Message type identification
├─ Control frames: Ping/Pong for keepalive
└─ Masking: Client-to-server payload masking
```

#### Summary: Pure Socket Programming

✅ **Socket Creation**: `Listen("0.0.0.0:8080")` creates TCP socket  
✅ **Socket Accept**: Server accepts TCP connections from clients  
✅ **Socket Connect**: `new WebSocket(url)` establishes TCP connection  
✅ **Socket Read**: `ReadMessage()` reads from TCP socket (blocking I/O)  
✅ **Socket Write**: `WriteMessage()` writes to TCP socket (blocking I/O)  
✅ **Socket Close**: `Close()` terminates TCP connection  
✅ **No Middleware**: No message queues, pub/sub, or high-level services  
✅ **Direct Communication**: Client ↔ TCP Socket ↔ Server  
✅ **Low-Level Protocol**: WebSocket = TCP + framing (still socket programming)  

**This project implements PURE SOCKET PROGRAMMING using TCP sockets with WebSocket protocol for message framing. All chat messages are transmitted directly through TCP sockets using read/write operations.**

---

## Summary

### R1 (1.0 point) - Multi-Client Architecture ✅
- **Physical deployment**: Server on Computer C (or Cloud Run), clients on different computers (A, B, D, E)
- **Network binding**: `0.0.0.0:8080` accepts connections from any network interface
- **Concurrent handling**: Go goroutines handle multiple client connections simultaneously
- **Cloud deployment** (bonus): Deployed on Google Cloud Run (asia-southeast1)

### R2 (0.5 points) - Socket Programming ✅
- **Protocol**: WebSocket (RFC 6455) over TCP/IP
- **Socket operations**: Direct `ReadMessage()`/`WriteMessage()` on TCP sockets
- **Connection management**: Persistent TCP connections with proper error handling
- **No high-level services**: No message queues, pub/sub, or long-polling
- **Bidirectional communication**: Full-duplex socket I/O with concurrent read/write goroutines

**Total: 1.5 points + 1.0 bonus (cloud deployment) = 2.5 points**


login flow : 

User Types "Alice"
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend: client/src/App.tsx                             │
│ handleConnect("Alice")                                   │
│ → wsService.connect()                                    │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ WebSocket connection established
                   │ send({"type":"register", "content":"Alice"})
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ Backend: cmd/server/main.go (handleWebSocket)           │
│                                                          │
│ 1. c.ReadJSON(&regMsg)                                  │
│    → regMsg.Content = "Alice"                           │
│                                                          │
│ 2. Validate message type                                │
│    if regMsg.Type != MsgTypeRegister ❌                 │
│       → Error "Must register first"                     │
│                                                          │
│ 3. 🔍 CHECK UNIQUE NAME (R3)                            │
│    if hub.ClientExists("Alice") {                       │
│       ├─► true: Name already taken ❌                   │
│       │   • WriteJSON(Error: "Name taken")             │
│       │   • Close connection                            │
│       │   • return                                      │
│       │                                                  │
│       └─► false: Name available ✅                      │
│           Continue to registration                       │
│    }                                                     │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ Backend: server/hub.go                                   │
│                                                          │
│ hub.ClientExists("Alice"):                              │
│                                                          │
│ func (h *Hub) ClientExists(name string) bool {          │
│     h.mu.RLock()              ← Thread-safe read lock   │
│     defer h.mu.RUnlock()                                 │
│     _, exists := h.clients[name]  ← Check in map        │
│     return exists                                        │
│ }                                                        │
│                                                          │
│ h.clients = map[string]*Client {                        │
│     "Bob":     &Client{...},     ← Already exists       │
│     "Charlie": &Client{...},                             │
│ }                                                        │
│                                                          │
│ Checking for "Alice" → NOT FOUND → return false ✅      │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ If Name Available: Continue Registration                │
│                                                          │
│ client := hub.RegisterClient("Alice", conn)             │
│ h.clients["Alice"] = &Client{Name: "Alice", ...}       │
│                                                          │
│ Send confirmation message ✅                             │
└──────────────────────────────────────────────────────────┘


If Name Taken: Close Connection
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ Backend sends error → Frontend receives close event      │
│ WebSocket.onclose(code: 1006)                           │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend: client/src/App.tsx                             │
│                                                          │
│ onClose callback triggered:                             │
│ if (code === 1006) {                                    │
│   showNotification('This name is already in use')       │
│   setTimeout(() => reload(), 2000)                      │
│ }                                                        │
│                                                          │
│ User sees: 🔴 "This name is already in use"             │
│ Page reloads → Try again with different name            │
└──────────────────────────────────────────────────────────┘