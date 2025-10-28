# 🌐 Social Network

A full-stack social networking platform built with modern web technologies. This application provides a complete social media experience with real-time features, privacy controls, and rich media support.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema-erd)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Real-time Features](#-real-time-features)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 👤 User Management
- **Secure Authentication:** JWT-based authentication with secure password hashing
- **User Profiles:** Customizable profiles with avatar, bio, and personal information
- **Privacy Controls:** Set profile visibility (public/private) and control who can see your information
- **Status Management:** Online, away, busy, and invisible status options
- **Session Management:** Secure session handling with automatic token expiration

### 🤝 Social Networking
- **Follow System:** Follow/unfollow users with pending request system for private accounts
- **Privacy Settings:** Control birthday and gender visibility
- **Friend Suggestions:** Discover new users based on mutual connections
- **User Search:** Advanced search functionality to find users by name, nickname, or email

### 📝 Content Creation
- **Posts:** Create, edit, and delete posts with rich text and images
- **Privacy Levels:** Set post visibility (public, followers-only, or custom selection)
- **Comments:** Nested commenting system with support for images
- **Reactions:** Like/dislike posts and comments
- **Shares:** Share posts to your feed or via chat
- **Bookmarks:** Save posts for later viewing
- **Polls:** Create polls with multiple options and expiration dates

### 💬 Real-time Messaging
- **Private Conversations:** One-on-one encrypted messaging
- **Group Chats:** Multi-user group conversations
- **Message Types:** Text messages and image sharing
- **Typing Indicators:** See when others are typing
- **Read Receipts:** Track message read status
- **Message History:** Load previous messages with pagination
- **Conversation Management:** Archive and delete conversations

### 👥 Groups
- **Group Creation:** Create public or private groups
- **Member Management:** Admin and member roles with permission controls
- **Group Posts:** Separate feed for group-specific content
- **Group Events:** Schedule and manage events within groups
- **Group Polls:** Create polls exclusively for group members
- **Join Requests:** Approval system for private groups
- **Invitations:** Invite users to join groups

### 📅 Events
- **Event Creation:** Schedule events with date, location, and description
- **RSVP System:** Going/Not Going responses
- **Event Management:** Edit or cancel events with notifications
- **Attendee List:** View who's attending events
- **Event Reminders:** Get notified before events start

### 🔔 Notifications
- **Real-time Updates:** Instant notifications for all activities
- **Notification Types:** Likes, comments, follows, messages, events, and more
- **Notification Settings:** Customize sound, theme, and quiet hours
- **Mute Conversations:** Silence notifications from specific chats
- **Push Notifications:** Browser push notification support

### 🎨 User Experience
- **Responsive Design:** Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Ready:** Beautiful gradient-based UI with glassmorphism effects
- **Smooth Animations:** Framer Motion animations throughout
- **Real-time Updates:** WebSocket integration for instant updates
- **Optimistic Updates:** Immediate UI feedback for better user experience
- **Infinite Scroll:** Lazy loading for posts and messages
- **Image Preview:** Full-screen image viewer with zoom

## 🛠 Tech Stack

### Backend
- **Go 1.21+** - High-performance backend server
- **SQLite** - Lightweight, serverless database
- **Gorilla WebSocket** - Real-time bidirectional communication
- **Gorilla Mux** - HTTP router and URL matcher
- **golang-migrate** - Database migration management
- **bcrypt** - Secure password hashing

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI component library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **SWR** - Data fetching and caching
- **Lucide Icons** - Beautiful icon library

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (production)

## 🏗 Architecture

### Backend Architecture
```
Backend/
├── handlers/       # HTTP request handlers
├── services/       # Business logic layer
├── models/         # Data models and structures
├── middleware/     # Authentication, CORS, logging
├── websocket/      # WebSocket handlers and hub
├── utils/          # Helper functions
└── pkg/
    └── db/
        └── migrations/  # Database migrations
```

### Frontend Architecture
```
Frontend/
├── app/            # Next.js App Router pages
├── components/     # React components
│   ├── auth/       # Authentication components
│   ├── chat/       # Chat interface
│   ├── groups/     # Group management
│   ├── posts/      # Post components
│   └── ui/         # Reusable UI components
├── context/        # React Context providers
├── hooks/          # Custom React hooks
├── lib/            # API client and utilities
└── types/          # TypeScript type definitions
```

## 🔄 Data Flow

1. **Client Request** → Next.js Frontend
2. **API Call** → Go Backend (REST API)
3. **Business Logic** → Service Layer
4. **Data Access** → SQLite Database
5. **Response** → JSON to Frontend
6. **Real-time Updates** → WebSocket Connection

## 🗄 Database Schema (ERD)

The application uses SQLite with a normalized relational database schema. Below is the complete Entity Relationship Diagram:

```mermaid
erDiagram
    users ||--o{ sessions : "has"
    users ||--o{ follows : "follows/is_followed"
    users ||--o{ posts : "creates"
    users ||--o{ comments : "creates"
    users ||--o{ likes : "creates"
    users ||--o{ group_members : "member_of"
    users ||--o{ groups : "creates"
    users ||--o{ event_responses : "responds_to"
    users ||--o{ events : "creates"
    users ||--o{ private_messages : "sends"
    users ||--o{ group_messages : "sends"
    users ||--o{ notifications : "receives"
    users ||--o{ bookmarks : "creates"
    users ||--o{ polls : "creates"
    users ||--o{ poll_votes : "votes"
    users ||--o{ shares : "shares"
    users ||--o{ invitations : "invites/invited"
    users ||--o| notification_settings : "has"
    users ||--o{ private_conversations : "participant"
    
    posts ||--o{ comments : "has"
    posts ||--o{ likes : "has"
    posts ||--o{ post_privacy : "has"
    posts ||--o{ bookmarks : "bookmarked_in"
    posts ||--o{ shares : "shared"
    
    groups ||--o{ group_members : "has"
    groups ||--o{ group_posts : "contains"
    groups ||--o{ events : "hosts"
    groups ||--o{ group_conversations : "has"
    groups ||--o{ polls : "contains"
    groups ||--o{ invitations : "for"
    groups ||--o{ shares : "shared_to"
    
    events ||--o{ event_responses : "has"
    
    polls ||--o{ poll_options : "has"
    poll_options ||--o{ poll_votes : "receives"
    
    private_conversations ||--o{ private_messages : "contains"
    group_conversations ||--o{ group_messages : "contains"
    
    private_conversations ||--o{ shares : "receives"

    users {
        INTEGER id PK
        VARCHAR email UK
        VARCHAR password
        VARCHAR first_name
        VARCHAR last_name
        DATE date_of_birth
        TEXT avatar
        VARCHAR nickname
        TEXT about_me
        BOOLEAN is_private
        VARCHAR status
        DATETIME last_status_change
        DATETIME created_at
        DATETIME updated_at
        VARCHAR gender
        BOOLEAN is_deleted
        VARCHAR birthday_privacy
        VARCHAR gender_privacy
    }

    sessions {
        INTEGER id PK
        INTEGER user_id FK
        TEXT token UK
        DATETIME expires_at
        DATETIME created_at
        DATETIME updated_at
    }

    follows {
        INTEGER id PK
        INTEGER follower_id FK
        INTEGER following_id FK
        VARCHAR status
        DATETIME created_at
        DATETIME updated_at
    }

    posts {
        INTEGER id PK
        INTEGER user_id FK
        TEXT content
        TEXT image_url
        VARCHAR privacy
        INTEGER share_count
        DATETIME created_at
        DATETIME updated_at
    }

    post_privacy {
        INTEGER id PK
        INTEGER post_id FK
        INTEGER user_id FK
        DATETIME created_at
    }

    comments {
        INTEGER id PK
        INTEGER post_id FK
        INTEGER user_id FK
        TEXT content
        TEXT image_url
        DATETIME created_at
        DATETIME updated_at
    }

    likes {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER post_id FK
        TEXT entity_type
        INTEGER entity_id
        TEXT reaction_type
        DATETIME created_at
    }

    groups {
        INTEGER id PK
        VARCHAR name
        TEXT description
        INTEGER creator_id FK
        VARCHAR privacy
        TEXT avatar
        VARCHAR content_creation
        VARCHAR create_posts
        VARCHAR create_polls
        VARCHAR create_events
        VARCHAR send_messages
        DATETIME created_at
        DATETIME updated_at
    }

    group_members {
        INTEGER id PK
        INTEGER group_id FK
        INTEGER user_id FK
        TEXT status
        TEXT role
        INTEGER invited_by FK
        INTEGER requestor_id FK
        DATETIME created_at
        DATETIME updated_at
    }

    group_posts {
        INTEGER id PK
        INTEGER group_id FK
        INTEGER user_id FK
        TEXT content
        TEXT image_url
        DATETIME created_at
        DATETIME updated_at
    }

    events {
        INTEGER id PK
        INTEGER group_id FK
        INTEGER creator_id FK
        VARCHAR title
        TEXT description
        DATETIME event_date
        TEXT location
        BOOLEAN canceled
        TEXT cancel_reason
        DATETIME created_at
        DATETIME updated_at
    }

    event_responses {
        INTEGER id PK
        INTEGER event_id FK
        INTEGER user_id FK
        VARCHAR response
        DATETIME created_at
        DATETIME updated_at
    }

    private_conversations {
        INTEGER id PK
        INTEGER participant1_id FK
        INTEGER participant2_id FK
        INTEGER last_message_id FK
        INTEGER unread_count1
        INTEGER unread_count2
        BOOLEAN participant1_deleted
        BOOLEAN participant2_deleted
        DATETIME participant1_deleted_at
        DATETIME participant2_deleted_at
        DATETIME created_at
        DATETIME updated_at
    }

    group_conversations {
        INTEGER id PK
        INTEGER group_id FK
        INTEGER last_message_id FK
        DATETIME created_at
        DATETIME updated_at
    }

    private_messages {
        INTEGER id PK
        INTEGER conversation_id FK
        INTEGER sender_id FK
        TEXT content
        BOOLEAN is_read
        BOOLEAN is_deleted
        DATETIME created_at
    }

    group_messages {
        INTEGER id PK
        INTEGER conversation_id FK
        INTEGER sender_id FK
        TEXT content
        BOOLEAN is_read
        BOOLEAN is_deleted
        DATETIME created_at
    }

    notifications {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER actor_id FK
        VARCHAR type
        VARCHAR entity_type
        INTEGER entity_id
        VARCHAR title
        TEXT message
        BOOLEAN is_read
        VARCHAR redirect_url
        VARCHAR redirect_type
        DATETIME created_at
        DATETIME updated_at
    }

    bookmarks {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER post_id FK
        DATETIME created_at
        DATETIME updated_at
    }

    invitations {
        INTEGER id PK
        INTEGER inviter_id FK
        INTEGER invitee_id FK
        INTEGER group_id FK
        TEXT status
        DATETIME created_at
    }

    polls {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER group_id FK
        TEXT title
        TEXT description
        BOOLEAN allow_multiple_choices
        TIMESTAMP expires_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    poll_options {
        INTEGER id PK
        INTEGER poll_id FK
        TEXT option_text
        INTEGER option_order
        TIMESTAMP created_at
    }

    poll_votes {
        INTEGER id PK
        INTEGER poll_id FK
        INTEGER option_id FK
        INTEGER user_id FK
        TIMESTAMP created_at
    }

    shares {
        INTEGER id PK
        INTEGER post_id FK
        INTEGER user_id FK
        INTEGER conversation_id FK
        INTEGER group_id FK
        INTEGER message_id FK
        DATETIME created_at
    }

    notification_settings {
        INTEGER id PK
        INTEGER user_id FK UK
        BOOLEAN sound_enabled
        VARCHAR sound_theme
        BOOLEAN browser_push_enabled
        BOOLEAN quiet_hours_enabled
        VARCHAR quiet_hours_start
        VARCHAR quiet_hours_end
        TEXT muted_conversations
        DATETIME created_at
        DATETIME updated_at
    }
```

### Key Database Features

- **24 Tables** with normalized relationships
- **Comprehensive Indexing** for query optimization
- **Cascade Deletions** to maintain referential integrity
- **Soft Deletes** for users and messages
- **Timestamp Tracking** on all entities
- **Privacy Controls** at multiple levels
- **Unique Constraints** to prevent duplicates

## 🚀 Getting Started

### Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)

Or for local development:
- **Go** (version 1.21+)
- **Node.js** (version 18+)
- **npm** or **yarn**

### Installation with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/social-network.git
   cd social-network
   ```

2. **Build the containers**
   ```bash
   ./build.sh
   ```
   This script will build both the frontend and backend Docker images.

3. **Run the application**
   ```bash
   ./run.sh
   ```
   This will start all services in detached mode.

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8080
   - **WebSocket**: ws://localhost:8080/ws

5. **View logs** (optional)
   ```bash
   docker-compose logs -f
   ```

6. **Stop the application**
   ```bash
   docker-compose down
   ```

### Local Development Setup

#### Backend

```bash
cd Backend

# Install dependencies
go mod download

# Run database migrations
go run main.go migrate

# Start the server
go run main.go

# Or build and run
go build -o social-network
./social-network
```

The backend will start on `http://localhost:8080`

#### Frontend

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm start
```

The frontend will start on `http://localhost:3000`

### Environment Variables

Create a `.env` file in the Backend directory:

```env
# Server Configuration
PORT=8080
FRONTEND_URL=http://localhost:3000

# Database
DB_PATH=./social_network.db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Create a `.env.local` file in the Frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/register` | Register new user | No |
| POST | `/api/login` | Login user | No |
| POST | `/api/logout` | Logout user | Yes |
| GET | `/api/check-session` | Validate session | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/:id` | Get user profile | Yes |
| PUT | `/api/users/:id` | Update profile | Yes |
| GET | `/api/users/:id/followers` | Get followers | Yes |
| GET | `/api/users/:id/following` | Get following | Yes |
| PUT | `/api/users/:id/status` | Update status | Yes |

### Post Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/posts` | Get posts feed | Yes |
| POST | `/api/posts` | Create post | Yes |
| GET | `/api/posts/:id` | Get post details | Yes |
| PUT | `/api/posts/:id` | Update post | Yes |
| DELETE | `/api/posts/:id` | Delete post | Yes |
| POST | `/api/posts/:id/like` | Like post | Yes |
| DELETE | `/api/posts/:id/like` | Unlike post | Yes |

### Group Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/groups` | List all groups | Yes |
| POST | `/api/groups` | Create group | Yes |
| GET | `/api/groups/:id` | Get group details | Yes |
| PUT | `/api/groups/:id` | Update group | Yes |
| POST | `/api/groups/:id/join` | Join group | Yes |
| POST | `/api/groups/:id/leave` | Leave group | Yes |
| GET | `/api/groups/:id/members` | Get members | Yes |

### Message Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/conversations` | List conversations | Yes |
| POST | `/api/messages` | Send message | Yes |
| GET | `/api/conversations/:id/messages` | Get messages | Yes |
| DELETE | `/api/messages/:id` | Delete message | Yes |
| PUT | `/api/messages/read` | Mark as read | Yes |

### WebSocket Events

Connect to `ws://localhost:8080/ws` with authentication token.

#### Client → Server Events
- `typing_start` - User starts typing
- `typing_stop` - User stops typing
- `status_change` - Update online status

#### Server → Client Events
- `private_message` - New private message
- `group_message` - New group message
- `message_deleted` - Message was deleted
- `notification` - New notification
- `user_status_changed` - User status updated
- `typing` - User is typing

## 🔌 Real-time Features

The application uses WebSocket connections for real-time updates:

### WebSocket Connection

```typescript
// Frontend connection example
const ws = new WebSocket('ws://localhost:8080/ws', [], {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};
```

### Message Types

- **private_message**: Real-time private chat messages
- **group_message**: Real-time group chat messages
- **notification**: Instant notifications
- **typing**: Live typing indicators
- **status_change**: User online/offline status
- **post_created**: New post alerts
- **comment_added**: New comment notifications

## 🏗 Project Structure

```
social-network-2/
├── Backend/
│   ├── handlers/              # HTTP request handlers
│   │   ├── auth.go           # Authentication
│   │   ├── user.go           # User management
│   │   ├── post.go           # Post operations
│   │   ├── message.go        # Messaging
│   │   ├── group.go          # Group management
│   │   ├── event.go          # Event handling
│   │   └── websocket.go      # WebSocket connections
│   ├── services/              # Business logic
│   │   ├── user_service.go
│   │   ├── post_service.go
│   │   ├── message_service.go
│   │   ├── group_service.go
│   │   └── notification_service.go
│   ├── models/                # Data models
│   ├── middleware/            # Middleware (auth, CORS)
│   ├── websocket/            # WebSocket hub & handlers
│   ├── utils/                # Helper functions
│   ├── pkg/db/migrations/    # Database migrations
│   ├── main.go               # Application entry point
│   └── Dockerfile
├── Frontend/
│   ├── app/                  # Next.js App Router
│   │   ├── feed/            # Feed page
│   │   ├── chats/           # Chat interface
│   │   ├── profile/         # User profiles
│   │   ├── groups/          # Group pages
│   │   └── events/          # Event pages
│   ├── components/          # React components
│   │   ├── auth/           # Auth components
│   │   ├── chat/           # Chat UI
│   │   ├── posts/          # Post components
│   │   ├── groups/         # Group components
│   │   └── ui/             # Reusable UI
│   ├── context/            # React Context
│   │   ├── AuthContext.tsx
│   │   ├── WebSocketContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useFeed.ts
│   │   ├── useRealTimeMessages.ts
│   │   └── useNotifications.ts
│   ├── lib/                # API client
│   │   └── api/           # API methods
│   ├── types/             # TypeScript types
│   └── Dockerfile
├── docker-compose.yml     # Docker orchestration
├── build.sh              # Build script
└── run.sh               # Run script
```

## 🧪 Testing

### Backend Tests

```bash
cd Backend
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./services/...
```

### Frontend Tests

```bash
cd Frontend
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Secure token-based auth
- **Session Management**: Automatic token expiration
- **CORS Protection**: Configured CORS policies
- **SQL Injection Prevention**: Prepared statements
- **XSS Protection**: Input sanitization
- **Rate Limiting**: API rate limiting (production)
- **HTTPS Ready**: SSL/TLS support

## 🚀 Deployment

### Production Build

```bash
# Build Docker images for production
docker-compose -f docker-compose.prod.yml build

# Run in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

Ensure you set these in production:

- `DB_PATH`: Persistent volume path
- `CORS_ALLOWED_ORIGINS`: Your production domain
- `PORT`: Production port (default: 8080)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Coding Standards

- **Backend**: Follow Go best practices and `gofmt`
- **Frontend**: Use TypeScript, follow React best practices
- **Commits**: Use conventional commit messages
- **Tests**: Add tests for new features

## 📝 License

Distributed under the MIT License. See `LICENSE.md` for more information.

## 👥 Authors

- **qaljaffe**
- **sayuksel**
- **sayehusain**

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Go community for excellent libraries
- All contributors who helped build this project

**⭐ If you find this project useful, please give it a star!**