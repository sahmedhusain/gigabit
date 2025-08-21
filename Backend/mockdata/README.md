# Mock Data System

This directory contains comprehensive mock data for testing and development purposes.

## Overview

The mock data system provides a complete set of realistic test data including:
- **10 diverse users** with different roles and backgrounds
- **Realistic follow networks** with accepted and pending relationships
- **30 diverse posts** with various privacy levels and content
- **Authentic engagement** patterns (likes, comments)
- **10 active groups** covering different topics and privacy settings
- **Multiple events** within groups with different attendance patterns
- **Private and group messages** with realistic conversations
- **Comprehensive notifications** covering all system activities

## Usage

### Start with Mock Data
To start the server with mock data:
```bash
go run . -mock
```

### Clear and Load Fresh Mock Data
To clear existing data and load fresh mock data:
```bash
go run . -mock -clear
```

### Start with Original Database
To start with the original database (default):
```bash
go run .
```

## User Credentials

All mock users use the same password for testing convenience:
- **Password**: `Aa123456`
- **Hash**: `$2a$10$RHttySZHDbKUw9e9FQlWIOxf6wFyF02NoPdPpJxKLWoj/D9HZjSrq`

## Mock Users

1. **John Doe** (johndoe) - Software Engineer
2. **Sarah Wilson** (sarahw) - Digital Marketing Specialist  
3. **Mike Johnson** (mikej) - Fitness Trainer
4. **Alice Cooper** (alicecooper) - Graphic Designer (Private Account)
5. **David Brown** (davidb) - Product Manager
6. **Emma Davis** (emmad) - UX/UI Designer
7. **James Smith** (jamessmith) - Full-Stack Developer
8. **Lisa Taylor** (lisat) - Data Scientist (Private Account)
9. **Ryan Garcia** (ryang) - Photographer
10. **Sophia Lee** (sophial) - Marketing Coordinator

## Data Structure

### Files Loading Order
1. `users.sql` - Base user accounts
2. `follows.sql` - Follow relationships
3. `posts.sql` - User posts with privacy settings
4. `likes.sql` - Post engagement patterns
5. `comments.sql` - Post comments and discussions
6. `groups.sql` - Groups and memberships
7. `events.sql` - Group events and attendees
8. `messages.sql` - Private and group messages
9. `notifications.sql` - System notifications

### Key Features in Mock Data

#### User Diversity
- Mix of public and private accounts
- Different professions and interests
- Realistic bio descriptions and usernames
- Varied account creation dates

#### Social Interactions
- Follow networks with pending requests
- Posts with different privacy levels (public, private, almost_private)
- Realistic like patterns and engagement
- Meaningful comments and discussions

#### Groups and Events
- 10 diverse groups covering tech, fitness, creative, and professional topics
- Mix of public and private groups
- Realistic events with different attendance statuses
- Group chat conversations

#### Real-time Features
- Private message conversations
- Group message discussions
- Comprehensive notification types
- Event reminders and social activity alerts

## Development Benefits

- **Immediate Testing**: Full feature testing without manual data creation
- **Realistic Scenarios**: Edge cases like private accounts, pending requests
- **Performance Testing**: Sufficient data volume for performance evaluation
- **UI Development**: Rich content for frontend component development
- **Feature Validation**: Complete user workflows and interactions

## Safety

- No real user data - completely synthetic
- Safe to reset and reload at any time
- Isolated from production data
- Consistent password hash for all test accounts