package main

import (
	"encoding/json"
	"log"

	"github.com/GoGoTalkie/GoTalkie-WebSocket/server"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

var hub *server.Hub

func main() {
	hub = server.NewHub()
	go hub.Run()

	app := fiber.New()
	// Serve React build files or fallback to static folder
	app.Static("/", "./client/dist", fiber.Static{
		Compress:  true,
		ByteRange: true,
		Browse:    false,
		Index:     "index.html",
	})
	// Fallback for old static files (if client/dist doesn't exist)
	app.Static("/", "./static")

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(handleWebSocket))

	log.Println("Server starting on http://localhost:8080")
	log.Fatal(app.Listen(":8080"))
}

func handleWebSocket(c *websocket.Conn) {
	var regMsg server.Message
	err := c.ReadJSON(&regMsg)
	if err != nil {
		c.Close()
		return
	}

	if regMsg.Type != server.MsgTypeRegister || regMsg.Content == "" {
		c.WriteJSON(server.Message{Type: server.MsgTypeError, Error: "Must register first"})
		c.Close()
		return
	}

	if hub.ClientExists(regMsg.Content) {
		c.WriteJSON(server.Message{Type: server.MsgTypeError, Error: "Name taken"})
		c.Close()
		return
	}

	client := hub.RegisterClient(regMsg.Content, c)
	defer hub.UnregisterClient(client)

	confirmMsg := server.Message{Type: server.MsgTypeRegister, Content: "Registered as " + client.Name}
	confirmData, _ := json.Marshal(confirmMsg)
	client.Send <- confirmData

	go client.WritePump()
	client.ReadPump()
}
