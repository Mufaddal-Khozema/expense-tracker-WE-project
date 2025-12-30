package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
	"strconv"
	_ "github.com/mattn/go-sqlite3"
	"github.com/jmoiron/sqlx"
)

const PORT = 4003

var db *sqlx.DB


// All your tables should implement this interface
type Entity interface {}

type Repository[T Entity] struct {
	db        *sqlx.DB
	tableName string
	idColumn  string
}

// Constructor
func NewRepository[T Entity](db *sqlx.DB, tableName string, idColumn string) *Repository[T] {
	return &Repository[T]{db: db, tableName: tableName, idColumn: idColumn}
}

// Create inserts a new row, returns last insert ID
func (r *Repository[T]) Create(fields map[string]interface{}) (int64, error) {
	cols := []string{}
	vals := []interface{}{}
	placeholders := []string{}

	for col, val := range fields {
		cols = append(cols, col)
		vals = append(vals, val)
		placeholders = append(placeholders, "?")
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		r.tableName,
		strings.Join(cols, ", "),
		strings.Join(placeholders, ", "),
	)

	res, err := r.db.Exec(query, vals...)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	log.Printf("[DB][OK] inserted into %s id=%d", r.tableName, id)
	return id, nil
}

// GetByID fetches a single row by ID
func (r *Repository[T]) GetByID(id int64) (*T, error) {
	var t T

	query := fmt.Sprintf("SELECT * FROM %s WHERE %s = ? AND is_deleted = 0", r.tableName, r.idColumn)
	err := r.db.Get(&t, query, id)
	if err != nil {
		return nil, err
	}

	// Scan into struct using sql tags or a library like sqlx
	// Example: sqlx.Get(&t, query, id) if using sqlx
	return &t, nil 
}

// Update performs partial update
func (r *Repository[T]) Update(id int64, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}

	setClauses := []string{}
	args := []interface{}{}

	for col, val := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = ?", col))
		args = append(args, val)
	}

	setClauses = append(setClauses, "updated_at = CURRENT_TIMESTAMP")
	args = append(args, id)

	query := fmt.Sprintf("UPDATE %s SET %s WHERE %s = ? AND is_deleted = 0",
		r.tableName,
		strings.Join(setClauses, ", "),
		r.idColumn,
	)

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return err
	}

	log.Printf("[DB][OK] updated %s id=%d", r.tableName, id)
	return nil
}

// SoftDelete marks a row as deleted
func (r *Repository[T]) SoftDelete(id int64) error {
	query := fmt.Sprintf("UPDATE %s SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE %s = ?", r.tableName, r.idColumn)
	_, err := r.db.Exec(query, id)
	return err
}


type ListOptions struct {
	where   []string
	args    []any
	orderBy string
	limit   *int
	offset  *int
}

type ListOption func(*ListOptions)

func WithWhere(condition string, args ...any) ListOption {
	return func(o *ListOptions) {
		o.where = append(o.where, condition)
		o.args = append(o.args, args...)
	}
}

func WithOrderBy(order string) ListOption {
	return func(o *ListOptions) {
		o.orderBy = order
	}
}

func WithLimit(limit int) ListOption {
	return func(o *ListOptions) {
		o.limit = &limit
	}
}

func WithOffset(offset int) ListOption {
	return func(o *ListOptions) {
		o.offset = &offset
	}
}

func (r *Repository[T]) List(opts ...ListOption) ([]T, error) {
	var items []T
    o := &ListOptions{}
    for _, opt := range opts {
        opt(o)
    }
    
	query := fmt.Sprintf("SELECT * FROM %s WHERE is_deleted = 0", r.tableName)

    if len(o.where) > 0 {
        query += " AND " + strings.Join(o.where, " AND ")
    }

    if o.orderBy != "" {
        query += " ORDER BY " + o.orderBy
    }

    if o.limit != nil {
        query += fmt.Sprintf(" LIMIT %d", *o.limit)
    }

    if o.offset != nil {
        query += fmt.Sprintf(" OFFSET %d", *o.offset)
    }

	err := r.db.Select(&items, query, o.args...)
	if err != nil {
		return nil, err
	}
	return items, nil
}

func (r *Repository[T]) Reorder(id int64, oldIndex, newIndex int) error {
	if oldIndex == newIndex {
        return nil
	}

	// Determine shift direction
	var shiftOp string
	var args []interface{}

	if oldIndex < newIndex {
		// Moving down: decrease sort_order of intervening rows
		shiftOp = "- 1"
		args = append(args, oldIndex+1, newIndex)
	} else {
		// Moving up: increase sort_order of intervening rows
		shiftOp = "+ 1"
		args = append(args, newIndex, oldIndex-1)
	}

	// 1️⃣ Shift all affected rows
	shiftQuery := fmt.Sprintf(`
		UPDATE %s
		SET sort_order = sort_order %s, updated_at = CURRENT_TIMESTAMP
		WHERE is_deleted = 0 AND sort_order BETWEEN ? AND ? AND id != ?
	`, r.tableName, shiftOp)

	_, err := r.db.Exec(shiftQuery, append(args, id)...)
	if err != nil {
		return err
	}

	// 2️⃣ Set the new position of the moved row
	updateQuery := fmt.Sprintf(`
		UPDATE %s
		SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND is_deleted = 0
	`, r.tableName)

	_, err = r.db.Exec(updateQuery, newIndex, id)
	if err != nil {
		return err
	}

	log.Printf("[DB][OK] Reordered %s id=%d from %d -> %d", r.tableName, id, oldIndex, newIndex)
	return nil
}


// Category represents a category in the database
type Category struct {
	ID        int64    `json:"id"`
	Name      string   `json:"name"`
    ParentID  *int64   `db:"parent_id" json:"parent_id,omitempty"`
	Amount    *float64 `json:"amount"`
	SortOrder int64    `db:"sort_order" json:"sort_order"`
	CreatedAt string   `db:"created_at" json:"created_at"`
	UpdatedAt string   `db:"updated_at" json:"updated_at"`
	IsDeleted string   `db:"is_deleted" json:"is_deleted"`
}

// CategoryRequest represents the JSON request for creating a category
type CategoryRequest struct {
	Name     string `json:"name"`
	ParentID *int64 `json:"parent_id,omitempty"`
	Amount   *float64 `json:"amount"`
}

type UpdateCategoryRequest struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Amount   *float64 `json:"amount"`
	ParentID *int64 `json:"parent_id,omitempty"`
}

type ReorderRequest struct {
	OldIndex int `json:"oldIndex"`
	NewIndex int `json:"newIndex"`
}

// LogRequest logs HTTP requests
func LogRequest(ip, method, path string, status int) {
	now := time.Now().Format("2006-01-02 15:04:05")
	log.Printf("[%s] %s %s %s -> %d\n", now, ip, method, path, status)
}

// CORS middleware
func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
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

func UpdateCategory(id int64, name string, amount *float64, parentID *int64) error {
	catRepo := NewRepository[Category](db, "categories", "id")

	updates := map[string]interface{}{}

	if name != "" {
		updates["name"] = name
	}
	if amount != nil {
		updates["amount"] = *amount
	}
	if parentID != nil {
		updates["parent_id"] = *parentID
	}

	if len(updates) == 0 {
		// nothing to update
		return nil
	}

	err := catRepo.Update(id, updates)
	if err != nil {
		return err
	}

	log.Printf("[DB][OK] update_category(id=%d, updates=%+v)\n", id, updates)
	return nil
}

// HandleCreateCategory handles POST /category requests
func HandleCreateCategory(w http.ResponseWriter, r *http.Request) {
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

func HandleUpdateCategoryByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	var req UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := UpdateCategory(id, req.Name, req.Amount, req.ParentID); err != nil {
		log.Printf("[DB][ERROR] %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "OK",
	})
}

// HandleGetCategories handles GET /categories requests
func HandleGetCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	catRepo := NewRepository[Category](db, "categories", "id")
	categories, err := catRepo.List(
        WithOrderBy("sort_order"),
    )
	if err != nil {
		log.Printf("[DB][ERROR] %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func ReorderCategoryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
    id, err := strconv.ParseInt(idStr, 10, 64)
    if err != nil {
        http.Error(w, "invalid id", http.StatusBadRequest)
        return
    }

    var req ReorderRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }

	catRepo := NewRepository[Category](db, "categories", "id")
    if err := catRepo.Reorder(id, req.OldIndex, req.NewIndex); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "OK",
	})
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
	db, err = sqlx.Connect("sqlite3", "db/app.db")
	//db, err = sqlx.Open("sqlite3", "file:db.sqlite?_journal_mode=WAL&_busy_timeout=5000")
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

	http.HandleFunc("/categories/{id}", LoggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		switch r.Method {
			case http.MethodOptions:
				w.WriteHeader(http.StatusNoContent) // 204 No Content
			case http.MethodPut:
				HandleUpdateCategoryByID(w, r)

			default:
				http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/categories/reorder/{id}", LoggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		switch r.Method {
			case http.MethodOptions:
				w.WriteHeader(http.StatusNoContent) // 204 No Content
			case http.MethodPut:
				ReorderCategoryHandler(w, r)

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
