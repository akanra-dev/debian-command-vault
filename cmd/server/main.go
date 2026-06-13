package main

import (
    "log"
    "net/http"
    "vault/internal/handlers"
)

func main() {
    http.HandleFunc("/api/commands", handlers.GetCommands)

    fs := http.FileServer(http.Dir("./web"))
    http.Handle("/", fs)

    log.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
