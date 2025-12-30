PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

/* 1. Backfill existing NULL values */
UPDATE categories
SET is_deleted = 0
WHERE is_deleted IS NULL;

/* 2. Recreate table with DEFAULT 0 */
CREATE TABLE categories_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    amount REAL,
    parent_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

/* 3. Copy data */
INSERT INTO categories_new (
    id, name, amount, parent_id, created_at, updated_at, is_deleted
)
SELECT
    id, name, amount, parent_id, created_at, updated_at, is_deleted
FROM categories;

/* 4. Swap tables */
DROP TABLE categories;
ALTER TABLE categories_new RENAME TO categories;

COMMIT;
PRAGMA foreign_keys = ON;
