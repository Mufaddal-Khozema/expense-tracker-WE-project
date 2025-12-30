PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE categories_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    amount REAL,
    parent_id INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

/* 3. Copy data */
INSERT INTO categories_new (
    id,
    name,
    amount,
    parent_id,
    sort_order,
    created_at,
    updated_at,
    is_deleted
)
SELECT
    id,
    name,
    amount,
    parent_id,
    0 AS sort_order, -- or id if you want deterministic ordering
    created_at,
    updated_at,
    is_deleted
FROM categories;

/* 4. Swap tables */
DROP TABLE categories;
ALTER TABLE categories_new RENAME TO categories;

COMMIT;
PRAGMA foreign_keys = ON;
