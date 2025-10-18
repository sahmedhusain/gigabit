# Social Network

This is a full-featured social network application built with a Go backend and a Next.js frontend. It includes user authentication, profiles, posts, comments, real-time chat, groups, events, and more.

## Live Demo

[Link to Live Demo]

## Features

### Backend (Go)

*   **User Authentication:** Secure user registration and login with session management.
*   **User Profiles:** Customizable user profiles with avatars, bios, and personal information.
*   **Social Graph:** Follow and unfollow other users.
*   **Posts:** Create, edit, and delete posts.
*   **Comments:** Comment on posts in real-time.
*   **Likes:** Like posts and comments.
*   **Groups:** Create and manage user groups, with group-specific posts and events.
*   **Events:** Create and manage events, with RSVPs.
*   **Real-time Chat:** One-on-one and group chat with websockets.
*   **Notifications:** Real-time notifications for likes, comments, follows, and other activities.
*   **Polls:** Create and vote on polls within posts.
*   **Bookmarks:** Bookmark posts for later viewing.
*   **Image Uploads:** Upload and store images for profile avatars and post content.

### Frontend (Next.js)

*   **User-friendly Interface:** A modern and responsive UI built with Next.js and Material-UI.
*   **Feed:** A personalized feed of posts from users you follow.
*   **Discover:** Discover new posts and users.
*   **Activity:** View your recent activity, including likes, comments, and follows.
*   **Real-time Updates:** Real-time updates for new posts, comments, and notifications.
*   **Chat:** A dedicated chat interface with one-on-one and group conversations.
*   **Groups:** Browse, join, and create groups.
*   **Events:** View and manage events.
*   **User Profiles:** View and edit your profile, and view other users' profiles.
*   **Search:** Search for users, posts, and groups.
*   **Authentication:** Login and registration pages.
*   **Error Handling:** Graceful error handling and error pages.

## Tech Stack

*   **Backend:** Go, SQLite, Gorilla WebSocket
*   **Frontend:** Next.js, React, TypeScript, Material-UI, SWR
*   **DevOps:** Docker, Docker Compose

## Directory Structure

```
.
├── Backend
│   ├── Database.go
│   ├── Dockerfile
│   ├── Server.go
│   ├── go.mod
│   ├── go.sum
│   ├── handlers
│   ├── main
│   ├── main.go
│   ├── middleware
│   ├── mockdata
│   ├── models
│   ├── pkg
│   ├── services
│   ├── uploads
│   ├── utils
│   └── websocket
├── Frontend
│   ├── Dockerfile
│   ├── README.md
│   ├── app
│   ├── components
│   ├── context
│   ├── hooks
│   ├── lib
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public
│   ├── tsconfig.json
│   └── utils
├── LICENSE.md
├── README.md
├── build.sh
├── docker-compose.yml
└── run.sh
```

## Database Schema (ERD)

```mermaid
erDiagram
    users ||--o{ sessions : "has"
    users ||--o{ follows : "follows"
    users ||--o{ posts : "creates"
    users ||--o{ comments : "creates"
    users ||--o{ likes : "creates"
    users ||--o{ group_members : "is member of"
    users ||--o{ event_responses : "responds to"
    users ||--o{ messages : "sends"
    users ||--o{ notifications : "receives"
    users ||--o{ bookmarks : "creates"
    posts ||--o{ comments : "has"
    posts ||--o{ likes : "has"
    posts ||--o{ polls : "has"
    groups ||--o{ group_members : "has"
    groups ||--o{ group_posts : "has"
    groups ||--o{ events : "has"
    events ||--o{ event_responses : "has"
    conversations ||--o{ messages : "has"

    users {
        INTEGER id PK
        TEXT first_name
        TEXT last_name
        TEXT nickname
        TEXT email
        TEXT password
        TEXT avatar
        TEXT about
        TEXT dob
        TEXT created_at
        TEXT gender
    }

    sessions {
        INTEGER id PK
        INTEGER user_id FK
        TEXT uuid
        TEXT created_at
        TEXT expires_at
    }

    follows {
        INTEGER id PK
        INTEGER follower_id FK
        INTEGER following_id FK
        TEXT created_at
    }

    posts {
        INTEGER id PK
        INTEGER user_id FK
        TEXT title
        TEXT content
        TEXT created_at
        TEXT image
    }

    comments {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER post_id FK
        TEXT content
        TEXT created_at
    }

    likes {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER post_id FK
        INTEGER comment_id FK
        TEXT created_at
        TEXT entity_type
        TEXT reaction_type
    }

    groups {
        INTEGER id PK
        TEXT title
        TEXT description
        TEXT created_at
        TEXT avatar
    }

    group_members {
        INTEGER id PK
        INTEGER group_id FK
        INTEGER user_id FK
        TEXT role
        TEXT created_at
    }

    group_posts {
        INTEGER id PK
        INTEGER group_id FK
        INTEGER post_id FK
    }

    events {
        INTEGER id PK
        INTEGER group_id FK
        TEXT title
        TEXT description
        TEXT start_time
        TEXT end_time
        TEXT created_at
    }

    event_responses {
        INTEGER id PK
        INTEGER event_id FK
        INTEGER user_id FK
        TEXT response
    }

    conversations {
        INTEGER id PK
        TEXT created_at
    }

    messages {
        INTEGER id PK
        INTEGER conversation_id FK
        INTEGER sender_id FK
        TEXT content
        TEXT created_at
    }

    notifications {
        INTEGER id PK
        INTEGER user_id FK
        TEXT type
        TEXT message
        TEXT created_at
        INTEGER is_read
    }

    bookmarks {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER post_id FK
        TEXT created_at
    }

    polls {
        INTEGER id PK
        INTEGER post_id FK
        TEXT question
    }

    poll_options {
        INTEGER id PK
        INTEGER poll_id FK
        TEXT option
    }

    poll_votes {
        INTEGER id PK
        INTEGER poll_option_id FK
        INTEGER user_id FK
    }
```

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Docker
*   Docker Compose

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/social-network.git
    ```
2.  Build and run the application with Docker Compose.
    ```sh
    ./build.sh
    ./run.sh
    ```
    The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8080`.

## Usage

Once the application is running, you can:

1.  Register a new user account.
2.  Log in with your new account.
3.  Create a profile.
4.  Start creating posts, following other users, and interacting with the community.

## Screenshots

*Note: I am unable to generate images. Please replace the placeholders below with actual screenshots of your application.*

**[SCREENSHOT_OF_HOMEPAGE]**
*Homepage*

**[SCREENSHOT_OF_PROFILE_PAGE]**
*User Profile*

**[SCREENSHOT_OF_CHAT]**
*Real-time Chat*

## Authors

*   **[Your Name]** - *[Your Role]* - [your-email@example.com]

## License

Distributed under the MIT License. See `LICENSE.md` for more information.