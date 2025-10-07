ALTER TABLE groups ADD COLUMN privacy TEXT NOT NULL DEFAULT 'public';

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS group_members_new (
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

INSERT INTO group_members_new (id, group_id, user_id, status, role, invited_by, requestor_id, created_at, updated_at)
SELECT gm.id,
       gm.group_id,
       gm.user_id,
       CASE
           WHEN gm.status IN ('pending', 'invited') THEN 'sent'
           WHEN gm.status IN ('accepted', 'member') THEN 'member'
           WHEN gm.status IN ('declined', 'rejected') THEN 'rejected'
           ELSE 'sent'
       END,
       CASE
           WHEN gm.role IN ('creator', 'owner', 'admin') THEN 'admin'
           ELSE 'member'
       END,
       NULL,
       NULL,
       gm.created_at,
       gm.updated_at
FROM group_members gm;

DROP TABLE group_members;
ALTER TABLE group_members_new RENAME TO group_members;

PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
