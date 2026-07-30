package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"sync"

	"vault/internal/models"
)

var mu sync.Mutex

func HandleCommands(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		listCommands(w, r)
	case http.MethodPost:
		addCommand(w, r)
	case http.MethodDelete:
		deleteCommand(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func readCommands() ([]models.Command, error) {
	file, err := os.ReadFile("data/commands.json")
	if err != nil {
		return nil, err
	}

	var commands []models.Command
	if err := json.Unmarshal(file, &commands); err != nil {
		return nil, err
	}

	return commands, nil
}

func writeCommands(commands []models.Command) error {
	data, err := json.MarshalIndent(commands, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile("data/commands.json", data, 0644)
}

func listCommands(w http.ResponseWriter, r *http.Request) {
	commands, err := readCommands()
	if err != nil {
		http.Error(w, "cannot read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(commands)
}

func addCommand(w http.ResponseWriter, r *http.Request) {
	var newCmd models.Command
	if err := json.NewDecoder(r.Body).Decode(&newCmd); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if newCmd.Name == "" || newCmd.Command == "" {
		http.Error(w, "name and command are required", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	commands, err := readCommands()
	if err != nil {
		http.Error(w, "cannot read file", http.StatusInternalServerError)
		return
	}

	maxID := 0
	for _, c := range commands {
		if c.ID > maxID {
			maxID = c.ID
		}
	}
	newCmd.ID = maxID + 1

	commands = append(commands, newCmd)

	if err := writeCommands(commands); err != nil {
		http.Error(w, "cannot write file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newCmd)
}

func deleteCommand(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	commands, err := readCommands()
	if err != nil {
		http.Error(w, "cannot read file", http.StatusInternalServerError)
		return
	}

	index := -1
	for i, c := range commands {
		if c.ID == id {
			index = i
			break
		}
	}

	if index == -1 {
		http.Error(w, "command not found", http.StatusNotFound)
		return
	}

	commands = append(commands[:index], commands[index+1:]...)

	if err := writeCommands(commands); err != nil {
		http.Error(w, "cannot write file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
