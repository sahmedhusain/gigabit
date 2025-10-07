PRAGMA foreign_keys = OFF;

CREATE TABLE groups_old (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO groups_old (id, name, description, creator_id, created_at, updated_at)
SELECT id, name, description, creator_id, created_at, updated_at
FROM groups;

DROP TABLE groups;
ALTER TABLE groups_old RENAME TO groups;

CREATE TABLE group_members_old (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    role VARCHAR(20) DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

INSERT INTO group_members_old (id, group_id, user_id, status, role, created_at, updated_at)
SELECT gm.id,
       gm.group_id,
       gm.user_id,
       CASE
           WHEN gm.status = 'sent' THEN 'pending'
           WHEN gm.status = 'member' THEN 'accepted'
           WHEN gm.status = 'rejected' THEN 'declined'
           ELSE gm.status
       END,
       CASE
           WHEN gm.role = 'admin' THEN 'admin'
           ELSE gm.role
       END,
       gm.created_at,
       gm.updated_at
FROM group_members gm;

DROP TABLE group_members;
ALTER TABLE group_members_old RENAME TO group_members;

PRAGMA foreign_keys = ON;
