package services

import (
	"database/sql"
	"fmt"
	"gigabit/models"
	"time"
)

type SessionService struct {
	db *sql.DB
}

func NewSessionService(db *sql.DB) *SessionService {
	return &SessionService{db: db}
}

func (s *SessionService) CreateSession(session *models.Session) error {
	query := `
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (?, ?, ?)
    `

	result, err := s.db.Exec(query, session.UserID, session.Token, session.ExpiresAt)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	session.ID = uint(id)

	query = `SELECT created_at, updated_at FROM sessions WHERE id = ?`
	row := s.db.QueryRow(query, session.ID)
	err = row.Scan(&session.CreatedAt, &session.UpdatedAt)
	if err != nil {
		return err
	}

	return nil
}

func (s *SessionService) GetSessionByTokenAndID(token string, sessionID uint) (*models.Session, error) {
	query := `
        SELECT id, user_id, token, expires_at, created_at, updated_at
        FROM sessions 
        WHERE id = ? AND token = ?
    `

	session := &models.Session{}
	row := s.db.QueryRow(query, sessionID, token)

	err := row.Scan(&session.ID, &session.UserID, &session.Token, &session.ExpiresAt,
		&session.CreatedAt, &session.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return session, nil
}

func (s *SessionService) GetSessionByIDAndToken(sessionID uint, token string) (*models.Session, error) {
	query := `
        SELECT id, user_id, token, expires_at, created_at, updated_at
        FROM sessions 
        WHERE id = ? AND token = ?
    `

	session := &models.Session{}
	row := s.db.QueryRow(query, sessionID, token)

	err := row.Scan(&session.ID, &session.UserID, &session.Token, &session.ExpiresAt,
		&session.CreatedAt, &session.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return session, nil
}

func (s *SessionService) GetSessionByToken(token string) (*models.Session, error) {
	query := `
        SELECT id, user_id, token, expires_at, created_at, updated_at
        FROM sessions 
        WHERE token = ?
    `

	session := &models.Session{}
	row := s.db.QueryRow(query, token)

	err := row.Scan(&session.ID, &session.UserID, &session.Token, &session.ExpiresAt,
		&session.CreatedAt, &session.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return session, nil
}

func (s *SessionService) GetSessionByID(sessionID uint) (*models.Session, error) {
	query := `
        SELECT id, user_id, token, expires_at, created_at, updated_at
        FROM sessions 
        WHERE id = ?
    `

	session := &models.Session{}
	row := s.db.QueryRow(query, sessionID)

	err := row.Scan(&session.ID, &session.UserID, &session.Token, &session.ExpiresAt,
		&session.CreatedAt, &session.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return session, nil
}

func (s *SessionService) UpdateSessionToken(session *models.Session) error {
	query := `
UPDATE sessions SET token = ? WHERE id = ?
`

	_, err := s.db.Exec(query, session.Token, session.ID)
	if err != nil {
		return err
	}

	query = `SELECT updated_at FROM sessions WHERE id = ?`
	row := s.db.QueryRow(query, session.ID)
	err = row.Scan(&session.UpdatedAt)
	if err != nil {
		return err
	}

	return nil
}

func (s *SessionService) ExtendSession(sessionID uint, extensionDuration time.Duration) error {
	query := `
UPDATE sessions SET expires_at = datetime(expires_at, ?) WHERE id = ?
`

	minutes := int(extensionDuration.Minutes())
	modifier := fmt.Sprintf("+%d minutes", minutes)

	_, err := s.db.Exec(query, modifier, sessionID)
	return err
}

func (s *SessionService) RefreshSessionExpiry(sessionID uint) error {
	query := `
UPDATE sessions SET expires_at = datetime('now', '+60 minutes') WHERE id = ?
`

	_, err := s.db.Exec(query, sessionID)
	return err
}

func (s *SessionService) DeleteSession(sessionID uint) error {
	query := `
        DELETE FROM sessions WHERE id = ?
    `

	_, err := s.db.Exec(query, sessionID)
	return err
}

func (s *SessionService) DeleteUserSessions(userID uint) error {
	query := `
        DELETE FROM sessions WHERE user_id = ?
    `

	_, err := s.db.Exec(query, userID)
	return err
}

func (s *SessionService) CleanupExpiredSessions() error {
	query := `
        DELETE FROM sessions WHERE expires_at < ?
    `

	now := time.Now()
	_, err := s.db.Exec(query, now)
	return err
}
