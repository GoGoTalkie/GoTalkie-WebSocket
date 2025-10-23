package server

import (
    "log"
	"github.com/gofiber/fiber/v2"
)

func main() {

    app := fiber.New()
	app.Listen(":8080")
	log.Println("Server starting on :8080")

}
