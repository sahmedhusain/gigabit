package services

// AreFriends checks if two users are mutual followers (friends)
func (s *PostService) AreFriends(userID1, userID2 uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM follows f1
		JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
		WHERE f1.follower_id = ? AND f1.following_id = ? 
		AND f1.status = 'accepted' AND f2.status = 'accepted'
	`
	
	var count int
	err := s.db.QueryRow(query, userID1, userID2).Scan(&count)
	if err != nil {
		return false, err
	}
	
	return count > 0, nil
}