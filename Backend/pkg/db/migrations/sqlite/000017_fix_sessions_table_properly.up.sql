-- Fix sessions table to match the expected schema in the code
-- First, create a new sessions table with the correct structure
CREATE TABLE sessions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create trigger to update updated_at on updates
CREATE TRIGGER sessions_updated_at_trigger
    AFTER UPDATE ON sessions_new
BEGIN
    UPDATE sessions_new SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Drop the old table and rename the new one
DROP TABLE IF EXISTS sessions;
ALTER TABLE sessions_new RENAME TO sessions;
