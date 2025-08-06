# Social Network Backend API

A comprehensive backend server for a social network application built with Go, Gin, and GORM.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **User Profiles**: User profile management and search functionality
- **Friend System**: Send, accept, and manage friend requests
- **Posts**: Create, read, update, and delete posts with image support
- **Comments**: Comment on posts with full CRUD operations
- **Likes**: Like and unlike posts
- **News Feed**: Personalized feed showing posts from friends
- **Database**: SQLite with GORM ORM (easily upgradeable to PostgreSQL)

## Tech Stack

- **Language**: Go 1.23.2
- **Framework**: Gin (HTTP web framework)
- **Database**: SQLite with GORM ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Architecture**: Clean architecture with separate packages

## Project Structure

```
Backend/
├── main.go              # Application entry point
├── Server.go            # Route setup and server configuration
├── Database.go          # Database connection and migration
├── models/              # Data models and request/response structs
│   ├── user.go
│   ├── post.go
│   ├── comment.go
│   ├── like.go
│   ├── friendship.go
│   └── auth.go
├── handlers/            # HTTP request handlers
│   ├── auth.go
│   ├── user.go
│   ├── post.go
│   ├── comment.go
│   ├── friendship.go
│   └── feed.go
├── middleware/          # HTTP middleware
│   ├── auth.go
│   ├── error.go
│   └── logging.go
└── utils/               # Utility functions
    ├── jwt.go
    └── password.go
```

## Getting Started

### Prerequisites

- Go 1.23.2 or later
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd social-network/Backend
```

2. Install dependencies:
```bash
go mod tidy
```

3. Build the application:
```bash
go build -o social-server .
```

4. Run the server:
```bash
./social-server
```

The server will start on `http://localhost:8080`

### Development Mode

For development with auto-reload, you can use:
```bash
go run .
```

## API Endpoints

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication

#### Register
- **POST** `/auth/register`
- **Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
- **POST** `/auth/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
- **GET** `/auth/me`
- **Headers**: `Authorization: Bearer <token>`

### Users

#### Get User Profile
- **GET** `/users/{id}`

#### Update Profile
- **PUT** `/users/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Software developer",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Search Users
- **GET** `/users/search?q=john`
- **Headers**: `Authorization: Bearer <token>`

### Friends

#### Send Friend Request
- **POST** `/friends/request`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "addressee_id": 2
}
```

#### Accept Friend Request
- **PUT** `/friends/{id}/accept`
- **Headers**: `Authorization: Bearer <token>`

#### Reject Friend Request
- **DELETE** `/friends/{id}/reject`
- **Headers**: `Authorization: Bearer <token>`

#### Get Friends List
- **GET** `/friends`
- **Headers**: `Authorization: Bearer <token>`

#### Get Pending Requests
- **GET** `/friends/requests`
- **Headers**: `Authorization: Bearer <token>`

### Posts

#### Create Post
- **POST** `/posts`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "content": "Hello, world!",
  "image_url": "https://example.com/image.jpg"
}
```

#### Get Post
- **GET** `/posts/{id}`

#### Update Post
- **PUT** `/posts/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "content": "Updated content",
  "image_url": "https://example.com/new-image.jpg"
}
```

#### Delete Post
- **DELETE** `/posts/{id}`
- **Headers**: `Authorization: Bearer <token>`

#### Like/Unlike Post
- **POST** `/posts/{id}/like`
- **Headers**: `Authorization: Bearer <token>`

### Comments

#### Get Post Comments
- **GET** `/posts/{postId}/comments`

#### Create Comment
- **POST** `/posts/{postId}/comments`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "content": "Great post!"
}
```

#### Update Comment
- **PUT** `/comments/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "content": "Updated comment"
}
```

#### Delete Comment
- **DELETE** `/comments/{id}`
- **Headers**: `Authorization: Bearer <token>`

### Feed

#### Get News Feed
- **GET** `/feed?page=1&limit=10`
- **Headers**: `Authorization: Bearer <token>`

#### Get User Posts
- **GET** `/feed/user/{userId}?page=1&limit=10`
- **Headers**: `Authorization: Bearer <token>`

## Database Schema

The application uses SQLite with the following main entities:

- **Users**: User accounts and profiles
- **Posts**: User posts with content and images
- **Comments**: Comments on posts
- **Likes**: Post likes
- **Friendships**: Friend relationships between users

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS enabled for frontend integration
- Input validation on all endpoints

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
