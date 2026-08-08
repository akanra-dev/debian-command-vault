package database

import (
	"database/sql"
	"encoding/json"
	"os"

	_ "github.com/mattn/go-sqlite3"
	"vault/internal/models"
)

var db *sql.DB

func Init(path string) error {
	var err error
	db, err = sql.Open("sqlite3", path)
	if err != nil {
		return err
	}

	if err := db.Ping(); err != nil {
		return err
	}

	if err := migrate(); err != nil {
		return err
	}

	return seedIfEmpty()
}

func migrate() error {
	query := `CREATE TABLE IF NOT EXISTS commands (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		command TEXT NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		category TEXT NOT NULL DEFAULT 'debian'
	)`
	_, err := db.Exec(query)
	return err
}

func seedIfEmpty() error {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM commands").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	file, err := os.ReadFile("data/commands.json")
	if err != nil {
		return nil
	}

	var commands []models.Command
	if err := json.Unmarshal(file, &commands); err != nil {
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare("INSERT INTO commands(id, name, command, description, category) VALUES(?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer func() { _ = stmt.Close() }()

	for _, c := range commands {
		if _, err := stmt.Exec(c.ID, c.Name, c.Command, c.Description, c.Category); err != nil {
			_ = tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func List() ([]models.Command, error) {
	rows, err := db.Query("SELECT id, name, command, description, category FROM commands ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	var commands []models.Command
	for rows.Next() {
		var c models.Command
		if err := rows.Scan(&c.ID, &c.Name, &c.Command, &c.Description, &c.Category); err != nil {
			return nil, err
		}
		commands = append(commands, c)
	}

	return commands, nil
}

func GetByID(id int) (models.Command, error) {
	var c models.Command
	err := db.QueryRow("SELECT id, name, command, description, category FROM commands WHERE id = ?", id).
		Scan(&c.ID, &c.Name, &c.Command, &c.Description, &c.Category)
	return c, err
}

func Create(cmd models.Command) (models.Command, error) {
	res, err := db.Exec("INSERT INTO commands(name, command, description, category) VALUES(?, ?, ?, ?)",
		cmd.Name, cmd.Command, cmd.Description, cmd.Category)
	if err != nil {
		return cmd, err
	}

	id, _ := res.LastInsertId()
	cmd.ID = int(id)
	return cmd, nil
}

func Update(cmd models.Command) error {
	_, err := db.Exec("UPDATE commands SET name = ?, command = ?, description = ?, category = ? WHERE id = ?",
		cmd.Name, cmd.Command, cmd.Description, cmd.Category, cmd.ID)
	return err
}

func Delete(id int) error {
	_, err := db.Exec("DELETE FROM commands WHERE id = ?", id)
	return err
}

func Close() error {
	return db.Close()
}
