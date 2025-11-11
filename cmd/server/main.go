package main

import (
	"encoding/json"
	"log"

	"github.com/GoGoTalkie/GoTalkie-WebSocket/server"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)
// Global hub instance
var hub *server.Hub

func main() {
	hub = server.NewHub()
	go hub.Run()

	app := fiber.New()
	
	// Enable CORS for all routes (required for Cloud Run)
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	
	// Serve React build files or fallback to static folder
	app.Static("/", "./client/dist", fiber.Static{
		Compress:  true,
		ByteRange: true,
		Browse:    false,
		Index:     "index.html",
	})

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(handleWebSocket))

	// Listen on 0.0.0.0 to accept connections from any network interface
	// This is required for Cloud Run and works fine for local development
	log.Println("Server starting on http://0.0.0.0:8080")
	log.Fatal(app.Listen("0.0.0.0:8080"))
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
