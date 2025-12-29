package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

const PORT = 4003

var db *sql.DB

// Category represents a category in the database
type Category struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	ParentID *int64 `json:"parent_id,omitempty"`
}

// CategoryRequest represents the JSON request for creating a category
type CategoryRequest struct {
	Name     string `json:"name"`
	ParentID *int64 `json:"parent_id,omitempty"`
}

// LogRequest logs HTTP requests
func LogRequest(ip, method, path string, status int) {
	now := time.Now().Format("2006-01-02 15:04:05")
	log.Printf("[%s] %s %s %s -> %d\n", now, ip, method, path, status)
}

// CORS middleware
func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
    w.Header().Set("Access-Control-Allow-Credentials", "true")
}

// InsertCategory inserts a new category into the database
func InsertCategory(name string, parentID *int64) (int64, error) {
	var id int64

	if parentID != nil {
		result, err := db.Exec("INSERT INTO categories (name, parent_id) VALUES (?, ?)", name, *parentID)
		if err != nil {
			return 0, err
		}
		id, err = result.LastInsertId()
		if err != nil {
			return 0, err
		}
	} else {
		result, err := db.Exec("INSERT INTO categories (name) VALUES (?)", name)
		if err != nil {
			return 0, err
		}
		id, err = result.LastInsertId()
		if err != nil {
			return 0, err
		}
	}

	log.Printf("[DB] insert_category(name=\"%s\", parent_id=%v)\n", name, parentID)
	log.Printf("[DB][OK] category inserted with id=%d\n", id)
	return id, nil
}

// HandleCreateCategory handles POST /category requests
func HandleCreateCategory(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CategoryRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	id, err := InsertCategory(req.Name, req.ParentID)
	if err != nil {
		log.Printf("[DB][ERROR] %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	resp := map[string]interface{}{
		"status": "OK",
		"id":     id,
	}

	json.NewEncoder(w).Encode(resp)
}

// HandleGetCategories handles GET /categories requests
func HandleGetCategories(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT id, name, parent_id FROM categories WHERE is_deleted = 0")
	if err != nil {
		log.Printf("[DB][ERROR] %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var cat Category
		var parentID sql.NullInt64
		err := rows.Scan(&cat.ID, &cat.Name, &parentID)
		if err != nil {
			log.Printf("[DB][ERROR] %v\n", err)
			continue
		}
		if parentID.Valid {
			cat.ParentID = &parentID.Int64
		}
		categories = append(categories, cat)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

// LoggingMiddleware wraps handlers to log requests
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Create a custom response writer to capture status code
		lrw := &loggingResponseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		start := time.Now()
		next.ServeHTTP(lrw, r)
		
		// Get client IP
		ip := strings.Split(r.RemoteAddr, ":")[0]
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = strings.Split(forwarded, ",")[0]
		}
		
		LogRequest(ip, r.Method, r.URL.Path, lrw.statusCode)
		log.Printf("Request completed in %v\n", time.Since(start))
	}
}

type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}

func main() {
	var err error
	
	// Initialize database
	db, err = sql.Open("sqlite3", "db/app.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create categories table if it doesn't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			parent_id INTEGER,
			FOREIGN KEY (parent_id) REFERENCES categories(id)
		)
	`)
	if err != nil {
		log.Fatal(err)
	}

	// Set up HTTP routes
	http.HandleFunc("/categories", LoggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		switch r.Method {
			case http.MethodOptions:
				w.WriteHeader(http.StatusNoContent) // 204 No Content
			case http.MethodPost:
				HandleCreateCategory(w, r)
			case http.MethodGet:
				HandleGetCategories(w, r)
			default:
				http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}))

	// Handle 404 for all other routes
	http.HandleFunc("/", LoggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		http.Error(w, "Not Found", http.StatusNotFound)
	}))

	// Start server
	addr := fmt.Sprintf(":%d", PORT)
	log.Printf("Server running on http://localhost:%d\n", PORT)
	
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
