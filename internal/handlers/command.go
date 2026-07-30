package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"vault/internal/database"
	"vault/internal/models"
)

func HandleCommands(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		listCommands(w, r)
	case http.MethodPost:
		addCommand(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func HandleCommandByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/commands/")
	if idStr == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getCommand(w, r, id)
	case http.MethodPut:
		updateCommand(w, r, id)
	case http.MethodDelete:
		deleteCommand(w, r, id)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func listCommands(w http.ResponseWriter, r *http.Request) {
	commands, err := database.List()
	if err != nil {
		http.Error(w, "failed to list commands", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, commands)
}

func getCommand(w http.ResponseWriter, r *http.Request, id int) {
	cmd, err := database.GetByID(id)
	if err != nil {
		http.Error(w, "command not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, cmd)
}

func addCommand(w http.ResponseWriter, r *http.Request) {
	var cmd models.Command
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if cmd.Name == "" || cmd.Command == "" {
		http.Error(w, "name and command are required", http.StatusBadRequest)
		return
	}

	created, err := database.Create(cmd)
	if err != nil {
		http.Error(w, "failed to create command", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func updateCommand(w http.ResponseWriter, r *http.Request, id int) {
	var cmd models.Command
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	cmd.ID = id

	if err := database.Update(cmd); err != nil {
		http.Error(w, "failed to update command", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, cmd)
}

func deleteCommand(w http.ResponseWriter, r *http.Request, id int) {
	if err := database.Delete(id); err != nil {
		http.Error(w, "failed to delete command", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
