package services

import (
	"database/sql"
	"social/models"
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
		INSERT INTO sessions (user_id, token, expires_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, session.UserID, session.Token, session.ExpiresAt, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	session.ID = uint(id)
	session.CreatedAt = now
	session.UpdatedAt = now

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
		UPDATE sessions SET token = ?, updated_at = ? WHERE id = ?
	`

	now := time.Now()
	_, err := s.db.Exec(query, session.Token, now, session.ID)
	if err != nil {
		return err
	}

	session.UpdatedAt = now
	return nil
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
