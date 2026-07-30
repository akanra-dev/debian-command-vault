package main

import (
	"log"
	"net/http"

	"vault/internal/database"
	"vault/internal/handlers"
)

func main() {
	if err := database.Init("data/vault.db"); err != nil {
		log.Fatal("database init:", err)
	}
	defer database.Close()

	http.HandleFunc("/api/commands", handlers.HandleCommands)
	http.HandleFunc("/api/commands/", handlers.HandleCommandByID)

	fs := http.FileServer(http.Dir("./web"))
	http.Handle("/", fs)

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
