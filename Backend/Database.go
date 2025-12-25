package main

import (
	"log"
	customsqlite "gigabit/pkg/db/sqlite"
)

var DB *customsqlite.DB

func InitDatabase() {
	var err error
	DB, err = customsqlite.NewDB("social_network.db")
	if err != nil {
		log.Fatal("Failed to initialize database with migrations:", err)
	}
}
