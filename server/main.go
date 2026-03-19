package main

import (
	"log"
	"net/http"
	"os"

	"bg-remover-server/handler"

	"github.com/rs/cors"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/remove-bg", handler.RemoveBackground)
	mux.HandleFunc("/api/health", handler.HealthCheck)

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "https://twbbb.cn", "https://westian.cn", "http://43.139.241.194"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: false,
		MaxAge:           86400,
	})

	handler := c.Handler(mux)

	log.Printf("🚀 BG Remover API server starting on port %s", port)
	log.Printf("   POST /api/remove-bg  - Remove image background")
	log.Printf("   GET  /api/health     - Health check")

	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
