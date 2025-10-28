package server

import (
	"encoding/json"
	"sync"

	"github.com/gofiber/websocket/v2"
)

const (
	MsgTypeRegister     = "register"
	MsgTypeClientList   = "client_list"
	MsgTypePrivate      = "private"
	MsgTypeCreateGroup  = "create_group"
	MsgTypeGroupList    = "group_list"
	MsgTypeJoinGroup    = "join_group"
	MsgTypeGroupMessage = "group_message"
	MsgTypeError        = "error"
)

type Client struct {
	Name string
	Conn *websocket.Conn
	Send chan []byte
	hub  *Hub
	mu   sync.Mutex
}

type Group struct {
	Name    string
	Creator string
	Members map[string]bool
	mu      sync.RWMutex
}

type Hub struct {
	clients    map[string]*Client
	groups     map[string]*Group
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

type Message struct {
	Type      string      `json:"type"`
	From      string      `json:"from,omitempty"`
	To        string      `json:"to,omitempty"`
	GroupName string      `json:"group_name,omitempty"`
	Content   string      `json:"content,omitempty"`
	Clients   []string    `json:"clients,omitempty"`
	Groups    []GroupInfo `json:"groups,omitempty"`
	Error     string      `json:"error,omitempty"`
}

type GroupInfo struct {
	Name    string   `json:"name"`
	Creator string   `json:"creator"`
	Members []string `json:"members"`
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		groups:     make(map[string]*Group),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

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

func (h *Hub) ClientExists(name string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, exists := h.clients[name]
	return exists
}

func (h *Hub) BroadcastClientList() {
	h.mu.RLock()
	clientNames := make([]string, 0, len(h.clients))
	for name := range h.clients {
		clientNames = append(clientNames, name)
	}
	h.mu.RUnlock()

	msg := Message{Type: MsgTypeClientList, Clients: clientNames}
	h.Broadcast(msg)
}

func (h *Hub) BroadcastGroupList() {
	h.mu.RLock()
	groupInfos := make([]GroupInfo, 0, len(h.groups))
	for _, group := range h.groups {
		group.mu.RLock()
		members := make([]string, 0, len(group.Members))
		for member := range group.Members {
			members = append(members, member)
		}
		groupInfos = append(groupInfos, GroupInfo{
			Name:    group.Name,
			Creator: group.Creator,
			Members: members,
		})
		group.mu.RUnlock()
	}
	h.mu.RUnlock()

	msg := Message{Type: MsgTypeGroupList, Groups: groupInfos}
	h.Broadcast(msg)
}

func (h *Hub) Broadcast(msg Message) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
			delete(h.clients, client.Name)
		}
	}
}

func (h *Hub) SendToClient(clientName string, msg Message) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	client, ok := h.clients[clientName]
	h.mu.RUnlock()

	if ok {
		select {
		case client.Send <- data:
		default:
		}
	}
}

func (h *Hub) SendToGroup(groupName string, msg Message) {
	h.mu.RLock()
	group, ok := h.groups[groupName]
	h.mu.RUnlock()

	if !ok {
		return
	}

	data, _ := json.Marshal(msg)
	group.mu.RLock()
	defer group.mu.RUnlock()

	h.mu.RLock()
	defer h.mu.RUnlock()

	for memberName := range group.Members {
		if client, ok := h.clients[memberName]; ok {
			select {
			case client.Send <- data:
			default:
			}
		}
	}
}

func (h *Hub) HandleMessage(client *Client, data []byte) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return
	}

	msg.From = client.Name

	switch msg.Type {
	case MsgTypePrivate:
		h.SendToClient(msg.To, msg)
		h.SendToClient(msg.From, msg)

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

	case MsgTypeGroupMessage:
		h.SendToGroup(msg.GroupName, msg)
	}
}

func (h *Hub) RegisterClient(name string, conn *websocket.Conn) *Client {
	client := &Client{
		Name: name,
		Conn: conn,
		Send: make(chan []byte, 256),
		hub:  h,
	}

	h.register <- client
	return client
}

func (h *Hub) UnregisterClient(client *Client) {
	h.unregister <- client
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.UnregisterClient(c)
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		c.hub.HandleMessage(c, message)
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()

	for message := range c.Send {
		if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			break
		}
	}
}
