package handlers

import (
    "encoding/json"
    "net/http"
    "os"

    "vault/internal/models"
)

func GetCommands(w http.ResponseWriter, r *http.Request) {
    file, err := os.ReadFile("data/commands.json")
    if err != nil {
	http.Error(w, "cannot read file", http.StatusInternalServerError)
	return
    }

    var commands []models.Command

    if err := json.Unmarshal(file, &commands); err != nil {
	http.Error(w, "invalid json", http.StatusInternalServerError)
	return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(commands)
}
