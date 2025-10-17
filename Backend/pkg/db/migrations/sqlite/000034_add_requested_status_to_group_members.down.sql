-- +migrate Down
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS group_members_old (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'member', 'rejected')),
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member', 'admin')),
    invited_by INTEGER,
    requestor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

INSERT INTO group_members_old (id, group_id, user_id, status, role, invited_by, requestor_id, created_at, updated_at)
SELECT id, group_id, user_id, status, role, invited_by, requestor_id, created_at, updated_at
FROM group_members;

DROP TABLE group_members;
ALTER TABLE group_members_old RENAME TO group_members;

PRAGMA foreign_keys = ON;