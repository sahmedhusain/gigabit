# GigaBit 🌐

[![Go](https://img.shields.io/badge/Go-1.23.2-00ADD8?style=flat&logo=go)](https://golang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)
[![SQLite](https://img.shields.io/badge/SQLite-3.0-green)](https://www.sqlite.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-blue)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.23.22-purple)](https://www.framer.com/motion/)
[![Gorilla Mux](https://img.shields.io/badge/Gorilla_Mux-1.8-red)](https://github.com/gorilla/mux)
[![Gorilla WebSocket](https://img.shields.io/badge/Gorilla_WebSocket-1.5-red)](https://github.com/gorilla/websocket)

<p align="center">
  <img src="Frontend/public/logo.png" alt="GigaBit Logo" width="400" height="225">
</p>

Hey there! 👋 Welcome to **GigaBit** - a modern, real-time social networking platform that's actually fun to use. Think of it like a supercharged social media app where everything happens instantly, communities thrive, and your privacy is always respected. Whether you're connecting with friends, joining interest-based groups, or just sharing your thoughts with the world, GigaBit makes social networking feel natural and immediate.

Built with cutting-edge web technologies, GigaBit combines the best of social media with real-time messaging, advanced privacy controls, and rich interactive features. It's designed for people who want meaningful connections without the noise and complexity of traditional social platforms.

## 📸 Screenshots

### Main Feed & Posts
![Main Feed](screenshots/main-feed.png)
_The heart of GigaBit - your personalized feed with posts from people you follow_

### Real-time Chat
![Chat Interface](screenshots/chat-interface.png)
_Private messaging that feels instant, with typing indicators and read receipts_

### Group Communities
![Group Page](screenshots/group-page.png)
_Dedicated spaces for communities with their own posts, events, and discussions_

### Event Management
![Event Creation](screenshots/event-creation.png)
_Easy event scheduling with RSVP tracking and automated reminders_

## 📋 Table of Contents

- [✨ What Makes GigaBit Special](#-what-makes-gigabit-special)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture & Data Flow](#️-architecture--data-flow)
- [🗄️ Database Schema & Logic](#-database-schema--logic)
- [🚀 Getting Started](#-getting-started)
- [📖 How GigaBit Works](#-how-gigabit-works)
- [🔌 Real-time Features](#-real-time-features)
- [📁 Project Structure](#-project-structure)
- [🔒 Security Features](#-security-features)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👥 Authors](#-authors)
- [🙏 Acknowledgments](#-acknowledgments)

## ✨ What Makes GigaBit Special

### 🔐 Smart Authentication & Privacy
**Secure Login That Just Works**
Getting started with GigaBit is simple - just pick a username, add your email, and you're in. But don't let the simplicity fool you. Behind the scenes, we're using industry-standard JWT authentication with secure password hashing using bcrypt. Your login sessions are managed intelligently, with automatic token refresh so you stay logged in securely without annoying re-authentication prompts.

**Privacy Controls You Actually Control**
Your data is yours, and GigaBit gives you granular control over who sees what. Set your profile visibility (public or private), control who can see your birthday and gender, and manage follow requests if you prefer approval-based following. It's social media with privacy built-in from day one.

**Real-time Status Management**
Let people know when you're available with live status indicators - online, away, busy, or invisible. Your status updates instantly across the platform, so friends know when you're free to chat.

### 🤝 Social Networking That Feels Natural
**Follow System with Smart Approval**
Following works just like you'd expect, but with extra smarts. Public accounts let anyone follow immediately, while private accounts require approval. When someone wants to follow you, you get a notification and can choose to accept or decline. It's social networking that respects personal boundaries.

**Intelligent Friend Discovery**
GigaBit helps you find interesting people through mutual connections and smart suggestions. Search by name, nickname, or email to find specific people, or let our system suggest friends based on who you already know.

**Advanced Profile Customization**
Your profile is your digital home. Add a catchy nickname, write a bio that tells your story, upload an avatar, and set your personal details. Control exactly who sees what with privacy settings for birthdays, gender, and other personal information.

### 📝 Rich Content Creation
**Posts with Personality**
Share your thoughts, moments, and ideas with posts that support text and images. Set privacy levels for each post - share publicly, limit to followers only, or create custom audiences. It's flexible content sharing that adapts to your needs.

**Conversations That Matter**
Comments aren't just replies - they're full conversations. Nest comments for threaded discussions, add images to your replies, and react with likes. It's forum-style discussion built into every post.

**Interactive Polls**
Create polls with multiple choices, set expiration dates, and watch results update in real-time. Perfect for group decisions, opinions, or just having fun with friends.

**Smart Sharing & Bookmarking**
Share interesting posts to your feed or directly in private chats. Bookmark posts you want to save for later. Content flows naturally across the platform.

### 💬 Messaging That Feels Instant
**Private Conversations**
One-on-one messaging with full encryption and real-time delivery. See typing indicators, read receipts, and message timestamps. Conversations feel as immediate as texting.

**Group Chats**
Multi-user conversations for communities and friend groups. Everyone sees messages instantly, with the same rich features as private chats.

**Message Management**
Archive old conversations, delete messages you regret, and manage your chat history. Pagination keeps things fast even with thousands of messages.

### 👥 Community Groups
**Groups That Bring People Together**
Create public or private groups around shared interests. Each group has its own feed, events, and chat. It's like having dedicated communities within your social network.

**Smart Permission System**
Groups have role-based permissions - creators and admins can manage settings, while members have appropriate access. Control who can post, create events, send messages, and more.

**Group-Exclusive Content**
Groups have their own posts, polls, and events. Members get notifications for group activity, keeping communities engaged and active.

**Join Requests & Invitations**
Private groups require approval to join. Send invitations to specific people, or let interested users request to join. Admins review and approve membership.

### 📅 Events & Scheduling
**Event Creation Made Easy**
Schedule events with titles, descriptions, dates, and locations. Set them for groups or create personal events.

**RSVP & Attendance Tracking**
People can RSVP as "going," "not going," or "maybe." See who's attending and get reminders before events start.

**Event Lifecycle Management**
Edit event details, cancel events with explanations, and track responses. Everything updates in real-time for all participants.

### 🔔 Notifications That Keep You Connected
**Comprehensive Notification System**
Get notified for everything that matters - likes, comments, follows, messages, event invites, group activity, and more. Never miss important updates.

**Smart Notification Settings**
Customize your notification experience with sound themes, quiet hours, and conversation muting. Enable browser push notifications for desktop alerts.

**Real-time Updates**
Notifications appear instantly across the platform. See them in your notification center, with links to relevant content.

## 🛠️ Tech Stack

### Backend - The Reliable Engine
- **Go 1.23.2** - A fast, compiled language that's perfect for web servers and real-time applications
- **SQLite** - A lightweight, serverless database that stores everything in a single file
- **Gorilla WebSocket** - Enables real-time, bidirectional communication between browser and server
- **Gorilla Mux** - A powerful HTTP router that handles all our API endpoints
- **golang-migrate** - Manages database schema changes and migrations
- **bcrypt** - Industry-standard password hashing for security

### Frontend - The Beautiful Interface
- **Next.js 15.5.3** - React's most popular framework, with the new App Router for better performance
- **React 19.1.0** - Component-based UI library with concurrent features
- **TypeScript 5** - Adds type safety to JavaScript, catching errors before they happen
- **Tailwind CSS 4** - Utility-first CSS framework for rapid, consistent styling
- **Framer Motion 12.23.22** - Production-ready animations that make the interface feel alive
- **SWR** - Smart data fetching with caching and real-time updates
- **Lucide Icons** - Beautiful, consistent icons that scale perfectly

### DevOps - Making Deployment Easy
- **Docker** - Containerizes our entire application for consistent deployment
- **Docker Compose** - Orchestrates multiple containers (frontend, backend, database)
- **Nginx** - High-performance reverse proxy for production deployments

## 🏗️ Architecture & Data Flow

### How Everything Fits Together

Imagine GigaBit as a well-orchestrated conversation between your browser, our servers, and the database:

```
Your Browser (Frontend) ↔ Go Backend (API Server) ↔ SQLite Database
       ↓                           ↓
   WebSocket Connection    Real-time Updates
```

**The Frontend** (Next.js + React) is what you see and interact with. It handles the user interface, form submissions, and displays data beautifully.

**The Backend** (Go) is the brains of the operation. It processes requests, enforces business rules, manages real-time connections, and coordinates everything.

**The Database** (SQLite) is our persistent memory. It stores all user data, posts, messages, and relationships safely and efficiently.

**WebSocket Connections** provide the "real-time magic" - instant updates without page refreshes.

### Request Flow Example

When you create a post:
1. **Frontend** collects your post data and sends it via API call
2. **Backend** validates the data, checks permissions, and saves to database
3. **Backend** broadcasts the new post to followers via WebSocket
4. **Frontend** receives the update and shows the post instantly
5. **Database** stores everything permanently

### Real-time Flow Example

When someone sends you a message:
1. **Sender's Frontend** sends message via WebSocket
2. **Backend** validates sender, saves to database, checks if recipient is online
3. **Backend** sends message to recipient via WebSocket (if online)
4. **Recipient's Frontend** receives and displays message instantly
5. **Backend** stores notification for later if recipient is offline

## 🗄️ Database Schema & Relationships

GigaBit uses SQLite with 25 interconnected tables that create a comprehensive social networking system. Below is the complete Entity Relationship Diagram showing how all tables connect:

```mermaid
erDiagram
    users ||--o{ sessions : "manages_authentication"
    users ||--o{ follows : "creates_follow_relationships"
    users ||--o{ posts : "creates_content"
    users ||--o{ comments : "writes_discussions"
    users ||--o{ likes : "gives_reactions"
    users ||--o{ bookmarks : "saves_content"
    users ||--o{ group_members : "participates_in_groups"
    users ||--o{ groups : "creates_communities"
    users ||--o{ event_responses : "rsvp_to_events"
    users ||--o{ events : "organizes_activities"
    users ||--o{ private_messages : "sends_private_messages"
    users ||--o{ group_messages : "sends_group_messages"
    users ||--o{ notifications : "receives_activity_alerts"
    users ||--o{ polls : "creates_interactive_content"
    users ||--o{ poll_votes : "participates_in_polls"
    users ||--o{ shares : "distributes_content"
    users ||--o{ invitations : "sends_group_invites"
    users ||--o| notification_settings : "configures_alerts"
    users ||--o{ private_conversations : "engages_in_private_chats"

    posts ||--o{ comments : "sparks_discussions"
    posts ||--o{ likes : "receives_reactions"
    posts ||--o{ post_privacy : "controls_visibility"
    posts ||--o{ bookmarks : "gets_saved"
    posts ||--o{ shares : "gets_distributed"

    groups ||--o{ group_members : "has_participants"
    groups ||--o{ group_posts : "contains_discussions"
    groups ||--o{ events : "hosts_activities"
    groups ||--o{ group_conversations : "facilitates_communication"
    groups ||--o{ polls : "runs_interactive_content"
    groups ||--o{ invitations : "manages_access"
    groups ||--o{ shares : "receives_shared_content"

    events ||--o{ event_responses : "tracks_participation"

    polls ||--o{ poll_options : "defines_choices"
    poll_options ||--o{ poll_votes : "collects_responses"

    private_conversations ||--o{ private_messages : "contains_chat_history"
    group_conversations ||--o{ group_messages : "contains_group_chat_history"

    private_conversations ||--o{ shares : "receives_shared_content"

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

### 🔗 Key Database Relationships Explained

**User-Centric Relationships:**
- **users → sessions**: Each user can have multiple active login sessions for secure authentication
- **users → follows**: Users create follow relationships with other users (social graph)
- **users → posts**: Users create content that forms their feed and timeline
- **users → group_members**: Users participate in multiple communities with different roles
- **users → notifications**: Users receive activity alerts from the platform
- **users → private_conversations**: Users engage in one-on-one messaging

**Content Relationships:**
- **posts → comments**: User-generated content sparks discussions and conversations
- **posts → likes**: Content receives reactions from the community
- **posts → post_privacy**: Posts can have custom visibility rules beyond basic privacy settings
- **posts → bookmarks**: Users save interesting content for later reference
- **posts → shares**: Content gets distributed across conversations and groups

**Community Relationships:**
- **groups → group_members**: Communities consist of participants with different permission levels
- **groups → group_posts**: Each group maintains its own discussion feed
- **groups → events**: Communities organize activities and gatherings
- **groups → invitations**: Private groups control access through invitation system
- **groups → group_conversations**: Communities facilitate group messaging

**Interactive Features:**
- **events → event_responses**: Activities track participation through RSVP system
- **polls → poll_options → poll_votes**: Interactive content collects community input
- **private_conversations → private_messages**: Direct messaging with read receipts
- **group_conversations → group_messages**: Community discussions with member participation

**System Relationships:**
- **users → notification_settings**: Each user configures their alert preferences
- **notifications**: Links users to activities performed by other users (actor_id)
- **shares**: Connects content distribution across different contexts (posts, conversations, groups)

### 📊 Database Architecture Benefits

- **Normalized Structure**: Eliminates data redundancy while maintaining relationships
- **Cascading Deletes**: Ensures referential integrity when users/groups are removed
- **Flexible Permissions**: Role-based access control for groups and content
- **Scalable Messaging**: Separate conversation tracking for private and group chats
- **Comprehensive Auditing**: Full timestamp tracking on all entities
- **Privacy Controls**: Granular visibility settings at multiple levels
- **Real-time Ready**: Optimized for WebSocket-based live updates

## 🚀 Getting Started

### Quick Start with Docker (Recommended)

1. **Get the code**
   ```bash
   git clone https://github.com/sahmedhusain/gigabit.git
   cd gigabit
   ```

2. **Launch everything**
   ```bash
   ./run.sh
   ```

3. **Open GigaBit**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

That's it! GigaBit is running with all services properly connected.

### Manual Development Setup

**Backend Setup:**
```bash
cd Backend
go mod download
go run main.go migrate  # Setup database
go run main.go          # Start server
```

**Frontend Setup:**
```bash
cd Frontend
npm install
npm run dev
```

## 📖 How GigaBit Works

### 🔄 Overall Application Flow

```mermaid
flowchart TD
    A[User Visits GigaBit] --> B{Registered?}
    B -->|No| C[Sign Up Process]
    B -->|Yes| D[Login Process]

    C --> C1[Enter Details<br/>Email/Password/Name]
    C1 --> C2[Validate Input<br/>Check Email Uniqueness]
    C2 --> C3[Hash Password<br/>Create User Record]
    C3 --> C4[JWT Token Generated<br/>Session Created]
    C4 --> E[Main Dashboard]

    D --> D1[Enter Credentials<br/>Email/Password]
    D1 --> D2[Validate Credentials<br/>Check Password Hash]
    D2 --> D3{JWT Token Created<br/>Session Established}
    D3 --> E

    E --> F{Choose Action}

    F -->|View Feed| G[Browse Posts]
    F -->|Create Content| H[Post Creation]
    F -->|Connect| I[Social Features]
    F -->|Communicate| J[Messaging]
    F -->|Join Community| K[Groups]
    F -->|Organize| L[Events]

    G --> G1[Load Timeline<br/>From Followed Users]
    G1 --> G2[Display Posts<br/>With Reactions]
    G2 --> G3[Real-time Updates<br/>Via WebSocket]
    G3 --> G4[User Interactions<br/>Like/Comment/Share]

    H --> H1[Compose Post<br/>Text + Images]
    H1 --> H2[Set Privacy<br/>Public/Followers/Custom]
    H2 --> H3[Submit Post<br/>Save to Database]
    H3 --> H4[Broadcast to Feed<br/>Notify Followers]
    H4 --> H5[Real-time Display<br/>In User Timelines]

    I --> I1{Follow Users}
    I --> I2{Search People}
    I --> I3{Profile Management}

    I1 --> I1A[Click Follow<br/>On Profile]
    I1A --> I1B{Account Type?}
    I1B -->|Public| I1C[Immediate Follow<br/>Status: Accepted]
    I1B -->|Private| I1D[Send Request<br/>Status: Pending]
    I1D --> I1E[Wait for Approval<br/>Notification Sent]
    I1E --> I1F{Approved?}
    I1F -->|Yes| I1C
    I1F -->|No| I1G[Request Declined<br/>Optional Retry]

    I2 --> I2A[Search by Name<br/>Email/Nickname]
    I2A --> I2B[Display Results<br/>With Profiles]
    I2B --> I2C[View Profiles<br/>Send Messages/Follow]

    I3 --> I3A[Update Profile<br/>Avatar/Bio/Settings]
    I3A --> I3B[Privacy Controls<br/>Visibility Settings]
    I3B --> I3C[Save Changes<br/>Update Database]

    J --> J1{Message Type}
    J1 -->|Private| J2[Select User<br/>Start Conversation]
    J1 -->|Group| J3[Join Group Chat<br/>Send Group Message]

    J2 --> J2A[Open Chat<br/>Load Message History]
    J2A --> J2B[Type Message<br/>Send via WebSocket]
    J2B --> J2C[Real-time Delivery<br/>Read Receipts]
    J2C --> J2D[Typing Indicators<br/>Online Status]

    J3 --> J3A[Group Chat Interface<br/>Member List]
    J3A --> J3B[Send Messages<br/>@Mentions Support]
    J3B --> J3C[All Members Receive<br/>Instantly]

    K --> K1{Browse Groups}
    K1 -->|Public| K2[View Group<br/>Request to Join]
    K1 -->|Private| K3[Need Invitation<br/>Or Admin Approval]

    K2 --> K2A[Join Request<br/>Status: Requested]
    K2A --> K2B{Admin Approves?}
    K2B -->|Yes| K2C[Become Member<br/>Access Group Content]
    K2B -->|No| K2D[Request Denied<br/>Cannot Access]

    K3 --> K3A[Receive Invitation<br/>From Group Member]
    K3A --> K3B{Accept Invite?}
    K3B -->|Yes| K2C
    K3B -->|No| K3C[Decline Invitation]

    L --> L1[Create Event<br/>In Group]
    L1 --> L2[Set Details<br/>Date/Location/Description]
    L2 --> L3[Invite Members<br/>Send Notifications]
    L3 --> L4[Members RSVP<br/>Going/Not Going/Maybe]
    L4 --> L5[Track Attendance<br/>Send Reminders]
    L5 --> L6[Event Day<br/>Real-time Updates]

    F -->|Get Notified| M[Notification System]
    M --> M1[Receive Alerts<br/>For All Activities]
    M1 --> M2[Like/Comment/Follow<br/>Message/Event Updates]
    M2 --> M3[Real-time Delivery<br/>Via WebSocket]
    M3 --> M4[Customizable Settings<br/>Sound Themes/Muting]

    E --> N[Real-time Engine]
    N --> N1[WebSocket Connection<br/>Persistent Link]
    N1 --> N2[Live Updates<br/>Instant Synchronization]
    N2 --> N3[Typing Indicators<br/>Status Changes]
    N3 --> N4[Push Notifications<br/>Background Sync]

    style A fill:#e1f5fe
    style E fill:#f3e5f5
    style N fill:#e8f5e8
```

### 🔍 Flowchart Legend

- **🔵 Blue Nodes**: User entry points and main navigation
- **🟣 Purple Nodes**: Core application features and user actions
- **🟢 Green Nodes**: Real-time system components
- **Decision Diamonds**: Conditional logic (public/private accounts, approvals, etc.)
- **Solid Arrows**: Main user flow progression
- **Dashed Elements**: Background processes and real-time updates

### User Registration & Authentication

**Creating an Account:**
1. User submits registration form with email, password, name
2. Backend validates input and checks for existing email
3. Password is hashed with bcrypt for security
4. User record is created in database
5. JWT token is generated for immediate login

**Login Process:**
1. User provides email/username and password
2. Backend finds user by email or username
3. Password is verified against stored hash
4. If valid, JWT token is created and stored in session
5. Token is returned to frontend for authentication

### Group Creation & Management

**Creating a Group:**
1. User fills group creation form (name, description, privacy settings)
2. Backend validates permissions and input
3. Group record is created with creator as first admin
4. Creator is automatically added to group_members as 'admin'
5. Success response includes group details

**Joining Groups:**
- **Public Groups:** User clicks "Join" → status becomes 'member' immediately
- **Private Groups:** User requests to join → status becomes 'requested' → admin approval required

**Admin Functions:**
- Promote members to admin (max 3 admins per group)
- Remove members from group
- Update group settings and permissions
- Delete group (creator only)

### Event Management

**Creating Events:**
1. Admin selects "Create Event" in group
2. Fills event details (title, description, date, location)
3. Backend validates user is group admin
4. Event is created and linked to group
5. Group members get notifications

**RSVP System:**
1. Members see event and click response (going/not going/maybe)
2. Response is recorded in event_responses table
3. Creator sees updated attendance count
4. Reminders sent before event date

### Real-time Messaging

**Starting a Conversation:**
1. User clicks "Message" on another user's profile
2. Backend checks if conversation already exists
3. If not, creates private_conversations record
4. Returns conversation ID for messaging

**Sending Messages:**
1. User types message and hits send
2. Message saved to database with timestamp
3. WebSocket broadcasts to recipient (if online)
4. Notification created for offline recipient

### Follow System

**Following Public Accounts:**
1. User clicks "Follow" on profile
2. Follow record created with status 'accepted'
3. Follower count updates immediately
4. Both users get notifications

**Following Private Accounts:**
1. User clicks "Follow" → status becomes 'pending'
2. Target user gets follow request notification
3. Target can accept or decline request
4. If accepted, status changes to 'accepted'

### Account Deletion

**Soft Delete Process:**
1. User requests account deletion
2. All user content remains but becomes anonymous
3. User record marked as `is_deleted = true`
4. Profile becomes inaccessible to others
5. Data preserved for legal/backup purposes

## 🔌 Real-time Features

GigaBit uses WebSocket connections for instant updates:

### Connection Establishment

```javascript
const ws = new WebSocket('ws://localhost:8080/ws', [], {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Real-time Events

- **Private Messages:** Instant chat delivery
- **Group Messages:** Live group conversations
- **Typing Indicators:** See when others are typing
- **Status Updates:** Online/offline status changes
- **Notifications:** Instant activity alerts
- **Post Updates:** New content in feeds
- **Event Changes:** RSVP updates and reminders

## 🔒 Security Features

- **Password Hashing:** bcrypt with salt
- **JWT Tokens:** Secure authentication with expiration
- **Input Validation:** All user input sanitized
- **SQL Injection Protection:** Parameterized queries
- **CORS Configuration:** Proper cross-origin policies
- **Rate Limiting:** API request throttling
- **Session Management:** Automatic cleanup

## 🚀 Future Improvements

### 🔍 Advanced Features
- **Advanced Search & Filtering:** Full-text search with filters by date, content type, and user
- **Content Moderation:** AI-powered content moderation and automated spam detection
- **Video Support:** Native video upload and streaming capabilities
- **Stories Feature:** Instagram-style ephemeral content with 24-hour visibility
- **Live Streaming:** Real-time video broadcasting for events and announcements

### 📊 Analytics & Insights
- **User Analytics:** Post engagement metrics, follower growth, and activity insights
- **Content Analytics:** Performance tracking for posts, optimal posting times, and audience reach
- **Group Analytics:** Member activity, content engagement, and community health metrics
- **Real-time Dashboards:** Administrative panels with live system monitoring

### 🔧 Technical Enhancements
- **Microservices Architecture:** Break down monolithic backend into scalable microservices
- **GraphQL API:** More flexible and efficient data fetching
- **Redis Caching:** High-performance caching layer for frequently accessed data
- **CDN Integration:** Global content delivery for faster media loading
- **Advanced WebRTC:** Peer-to-peer video calling and screen sharing

### 🌐 Platform Expansion
- **Mobile Apps:** Native iOS and Android applications
- **Progressive Web App:** Installable web app with offline capabilities
- **API Ecosystem:** Third-party integrations and developer API access
- **Multi-language Support:** Internationalization and localization
- **Accessibility:** WCAG 2.1 compliance and screen reader support

### 🤖 AI & Machine Learning
- **Smart Recommendations:** AI-powered content and friend suggestions
- **Automated Tagging:** Image recognition and content categorization
- **Sentiment Analysis:** Community mood tracking and toxicity detection
- **Personalized Feeds:** Machine learning algorithms for content ranking

## ⚠️ Limitations

### 🗃️ Database Constraints
- **SQLite Limitations:** Single-writer limitation may cause bottlenecks under high load
- **No Built-in Replication:** Manual backup and restore processes required
- **File-based Storage:** Database file size limits and potential corruption risks

### ⚡ Performance Considerations
- **Memory Usage:** WebSocket connections consume server memory for each active user
- **Real-time Scaling:** Current architecture may struggle with 10,000+ concurrent users

### 🔐 Security Boundaries
- **No Multi-factor Authentication:** Currently relies on password-only authentication
- **Basic Rate Limiting:** Simple request throttling without advanced DDoS protection
- **Session Management:** JWT tokens don't support forced logout across all devices

### 🎨 User Experience Gaps
- **Limited Customization:** Basic theming options without extensive personalization

### 📱 Platform Restrictions
- **Web-Only:** No native mobile applications available
- **Browser Dependent:** Real-time features require modern browser WebSocket support

### 🔧 Development & Deployment
- **Monolithic Architecture:** Single codebase may become complex to maintain at scale
- **Manual Deployment:** Docker-based but lacks automated CI/CD pipelines
- **Limited Monitoring:** Basic logging without comprehensive system monitoring

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE.md for details.

## 👥 Authors

- **Salah Yuksel**
- **Qassim Aljaffer**
- **Sayed Ahmed Husain** - [sayedahmed97.sad@gmail.com](mailto:sayedahmed97.sad@gmail.com)

## 🙏 Acknowledgments

Built with ❤️ using modern web technologies. Special thanks to the Go and React communities for amazing tools and libraries.

**⭐ If GigaBit helps you connect, please give it a star!**
