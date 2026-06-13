package models

type Command struct {
    ID          int     `json:"id"`
    Name        string  `json:"name"`
    Command     string  `json:"command"`
    Description string  `json:"description"`
}
