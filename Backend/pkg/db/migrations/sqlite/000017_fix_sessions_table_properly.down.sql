-- Rollback sessions table to the old structure
DROP TRIGGER IF EXISTS sessions_updated_at_trigger;
DROP TABLE IF EXISTS sessions;

CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
