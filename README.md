# GigaBit 🌐⚡

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=170&text=GigaBit&fontAlignY=35&desc=Real-time%20Social%20Network%20%7C%20Go%20Backend%20%2B%20Next.js%20Frontend&descAlignY=55&animation=twinkling" alt="GigaBit Banner" />
</p>

<p align="center">
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-what-makes-gigabit-special">Highlights</a> •
  <a href="#-architecture--data-flow">Architecture</a> •
  <a href="#-database-schema--logic">Database</a> •
  <a href="#-getting-started">Get Started</a> •
  <a href="#-security--privacy">Security</a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=900&center=true&vCenter=true&width=980&lines=Built+as+a+hero+project+covering+the+full+social+stack;Real-time+chat%2C+posts%2C+polls%2C+events%2C+privacy%2C+notifications;Go+%2B+WebSockets+%2B+Next.js+15+%7C+React+19+%7C+Tailwind+4" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/solar.png" width="100%" alt="Animated Divider" />
</p>

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

[![Full Stack](https://img.shields.io/badge/Project-Full--Stack%20Social%20Network-blueviolet)](#-key-highlights)
[![Realtime](https://img.shields.io/badge/Realtime-WebSocket-0A66C2)](#-real-time-features)
[![Auth](https://img.shields.io/badge/Auth-JWT-orange)](#-security--privacy)

<p align="center">
  <img src="Frontend/public/logo.png" alt="GigaBit Logo" width="400" height="225">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/go/go-original.svg" width="34"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" width="34"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" width="34"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" width="34"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/tailwindcss/tailwindcss-original.svg" width="34"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/sqlite/sqlite-original.svg" width="34"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original.svg" width="34"/>
</p>

<p align="center">
  <img src="https://svg-banners.vercel.app/api?type=glitch&text1=Real-time%20updates&text2=Messaging%20%7C%20Groups%20%7C%20Events%20%7C%20Privacy%20controls&width=980&height=90" alt="GigaBit Highlights Banner"/>
</p>

---

GigaBit is a flagship, end-to-end social network blueprint. It blends a Go + WebSocket backend with a modern Next.js/React/Tailwind frontend and a relational data model that powers the full social surface area: feed, messaging, polls, events, groups, privacy controls, notifications, and real-time delivery.

> Think of it as a product-quality case study: every interaction is wired, every edge is handled, and this README doubles as the story, playbook, and runbook.

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/fresh.png" width="100%" alt="Animated Divider" />
</p>

## ⭐ Key Highlights

- **Privacy-first social graph:** private/public profiles, follow approvals, per-post privacy lists, and profile visibility controls.
- **Full content loop:** posts with media, threaded comments, reactions, bookmarks, shares, polls, and a feed tuned for real conversations.
- **Community OS:** groups with roles, invitations, gated membership, group-only posts/polls/events, and admin dashboards.
- **Real-time nervous system:** WebSocket hub powering chat, typing indicators, live notifications, status changes, and feed updates.
- **Production-ready posture:** Go + SQLite core, Next.js 15/React 19/Tailwind 4 frontend, Dockerized with Nginx-ready routing.

### 🧩 At a Glance

```text
Next.js 15 + React 19 + TypeScript UI
    ↕ REST (auth, feed, groups, events)
Go services (Mux handlers, WebSocket hub)
    ↕
SQLite (25-table relational schema)
    ↕
Broadcast loop (notifications, chat, live feed)
```

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/dots.png" width="100%" alt="Animated Divider" />
</p>

## 📸 Screenshots

A quick tour of live surfaces captured from the current build (no extra uploads needed).

### Main Feed
<div align="center">
  <img src="screenshots/home-feed.jpeg" alt="Home Feed" />
  <p><em>Your personalized feed showing posts from people you follow</em></p>
</div>

### Real-time Chat
<div align="center">
  <img src="screenshots/private-chat.jpeg" alt="Private Chat" />
  <p><em>Private messaging with instant delivery and read receipts</em></p>
</div>

### Group Communities
<div align="center">
  <img src="screenshots/group-posts.jpeg" alt="Group Posts" />
  <p><em>Dedicated spaces for communities with their own discussions</em></p>
</div>

### Event Management
<div align="center">
  <img src="screenshots/events-page.jpeg" alt="Events Page" />
  <p><em>Organize and track events with RSVP functionality</em></p>
</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/mermaid.png" width="100%" alt="Animated Divider" />
</p>

## 📋 Table of Contents

Jump to any section below — the platform covers a full social network surface area.

- [✨ What Makes GigaBit Special](#-what-makes-gigabit-special)
- [🛠️ Tech Stack](#-tech-stack)
- [🏗️ Architecture & Data Flow](#-architecture--data-flow)
- [🗄️ Database Schema & Logic](#-database-schema--logic)
- [🚀 Getting Started](#-getting-started)
- [📖 How GigaBit Works](#-how-gigabit-works)
- [🔌 Real-time Features](#-real-time-features)
- [📁 Project Structure](#-project-structure)
- [🔒 Security & Privacy](#-security--privacy)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👥 Authors](#-authors)
- [🙏 Acknowledgments](#-acknowledgments)

<details open>
<summary><strong>✨ What Makes GigaBit Special (expand/collapse)</strong></summary>

## ✨ What Makes GigaBit Special

### 🔐 Simple But Secure Login
Onboard with an email, username, and password. Credentials are hashed with bcrypt, JWT sessions refresh cleanly, and you stay signed in without stale tokens.

### 🤝 Social Features That Work Like You Expect
**Following with Approval**
Public accounts are instant follows; private accounts queue a request and surface a notification so you can approve or decline. No surprise followers.

<div align="center">
  <img src="screenshots/follow-request-private.jpeg" alt="Follow Request" />
  <p><em>Managing follow requests on private accounts</em></p>
</div>

**Finding People**
Search by name, email, or nickname, and get mutual-connection hints. Profiles open quickly so you can follow or message right away.

<div align="center">
  <img src="screenshots/discover-page.jpeg" alt="Discover Page" />
  <p><em>Discovering new people and communities to follow</em></p>
</div>

<div align="center">
  <img src="screenshots/other-user-profile.jpeg" alt="Other User Profile" />
  <p><em>Viewing other users' profiles and their activity</em></p>
</div>

**Profile Customization**
Add nickname, bio, avatar, and personal details with privacy flags for birthday and gender. Own your profile without oversharing.

<div align="center">
  <img src="screenshots/profile-page.jpeg" alt="Profile Page" />
  <p><em>Customizing your profile with personal information and settings</em></p>
</div>

<div align="center">
  <img src="screenshots/private-profile.jpeg" alt="Private Profile" />
  <p><em>Profile view with privacy controls for personal information</em></p>
</div>

### 📝 Creating & Sharing Content
**Posting Made Simple**
Write posts with text and photos, pick public/followers/custom audiences, and hit publish. Privacy is part of the composer, not an afterthought.

<div align="center">
  <img src="screenshots/create-post.jpeg" alt="Create Post" />
  <p><em>Creating posts with text, images, and privacy controls</em></p>
</div>

**Comments & Discussions**
Threaded comments (with images) and reactions keep conversations tidy. Replies nest cleanly so long discussions stay readable.

<div align="center">
  <img src="screenshots/posts-and-comments.jpeg" alt="Posts and Comments" />
  <p><em>Post details with threaded comments and reactions</em></p>
</div>

**Polls for Fun & Decisions**
Create polls with multiple options and expiry times. Results update live as votes land.

**Sharing & Saving**
Share to feed or chat, and bookmark anything worth revisiting. Posts carry their privacy rules along the way.

<div align="center">
  <img src="screenshots/post-privacy.jpeg" alt="Post Privacy" />
  <p><em>Setting privacy levels for individual posts</em></p>
</div>

### 💬 Chat & Messaging
**Private Messages**
One-to-one conversations with instant delivery, typing indicators, and read receipts so you know what landed.

**Group Conversations**
Chat in groups with the same real-time fidelity and member-aware context.

<div align="center">
  <img src="screenshots/group-chat.jpeg" alt="Group Chat" />
  <p><em>Group conversations with multiple participants</em></p>
</div>

**Managing Your Chats**
Archive, delete, and scroll long histories without losing performance.

<div align="center">
  <img src="screenshots/chats-page.jpeg" alt="Chats Page" />
  <p><em>Overview of all your conversations and chat management</em></p>
</div>

### 👥 Groups & Communities
**Building Communities**
Spin up public or private groups with avatars, descriptions, and clear membership rules.

<div align="center">
  <img src="screenshots/create-group.jpeg" alt="Create Group" />
  <p><em>Setting up a new group with privacy and permission settings</em></p>
</div>

**Who Can Do What**
Creators and admins control roles, permissions, and moderation. Members get scoped capabilities that match their role.

<div align="center">
  <img src="screenshots/group-admin1.jpeg" alt="Group Admin Panel" />
  <p><em>Managing group members and permissions as an admin</em></p>
</div>

<div align="center">
  <img src="screenshots/group-info.jpeg" alt="Group Information" />
  <p><em>Group details and member management interface</em></p>
</div>

**Group-Only Stuff**
Group feeds, polls, and events stay inside the walls. Members get notified when something happens.

<div align="center">
  <img src="screenshots/group-polls.jpeg" alt="Group Polls" />
  <p><em>Group polls for member voting and discussions</em></p>
</div>

**Getting People In**
Invites, join requests, and admin approvals keep private spaces curated.

<div align="center">
  <img src="screenshots/group-admin2.jpeg" alt="Group Admin Tools" />
  <p><em>Advanced admin controls for group management</em></p>
</div>

<div align="center">
  <img src="screenshots/group-admin3.jpeg" alt="Group Admin Settings" />
  <p><em>Group settings and member management options</em></p>
</div>

<div align="center">
  <img src="screenshots/group-delete.jpeg" alt="Group Delete" />
  <p><em>Group deletion and management options</em></p>
</div>

### 📅 Events & Meetups
**Planning Events**
Schedule events with titles, descriptions, locations, and dates for groups or personal use.

<div align="center">
  <img src="screenshots/create-event.jpeg" alt="Create Event" />
  <p><em>Scheduling events with date, location, and description</em></p>
</div>

**RSVP System**
Track going/not going/maybe with live updates and reminders.

**Managing Events**
Edit details, cancel with reasons, and keep everyone in sync.

### 🔔 Staying in the Loop
**Getting Notified**
Likes, comments, follows, messages, invites, and group actions all surface as notifications so nothing slips.

**Customizing Alerts**
Pick sounds, mute chats, set quiet hours, and toggle browser push. Your notifications, your way.

<div align="center">
  <img src="screenshots/settings-pages.jpeg" alt="Settings Pages" />
  <p><em>Customizing notification preferences and account settings</em></p>
</div>

<div align="center">
  <img src="screenshots/sidebar-quick-settings.jpeg" alt="Sidebar Quick Settings" />
  <p><em>Quick access to settings and preferences</em></p>
</div>

**Instant Updates**
Notifications arrive via WebSocket in real time with deep links to the relevant action.

<div align="center">
  <img src="screenshots/notifications-page.jpeg" alt="Notifications Page" />
  <p><em>Notification center showing all activity alerts and updates</em></p>
</div>

</details>

---
## 📊 Activity & Engagement

### Your Activity Overview
See your likes, comments, and posts together to recap your footprint across the network.

<div align="center">
  <img src="screenshots/your-activity-likes.jpeg" alt="Your Activity Likes" />
  <p><em>Viewing your liked posts and activity history</em></p>
</div>

### Sidebar Navigation
Stay oriented with quick links for follows, invites, and your calendar.

<div align="center">
  <img src="screenshots/sidebar-following.jpeg" alt="Sidebar Following" />
  <p><em>Managing who you follow and follower requests</em></p>
</div>

<div align="center">
  <img src="screenshots/sidebar-invitations.jpeg" alt="Sidebar Invitations" />
  <p><em>Group invitations and pending requests</em></p>
</div>

<div align="center">
  <img src="screenshots/sidebar-calender.jpeg" alt="Sidebar Calendar" />
  <p><em>Event calendar and upcoming activities</em></p>
</div>

## 🛠️ Tech Stack

What powers GigaBit end-to-end, from real-time backplane to the UI polish.

### Backend - The Engine Room
- **Go 1.23.2** - Fast, typed, and perfect for WebSocket-heavy workloads.
- **SQLite** - Lightweight, zero-ops relational store that travels with the repo.
- **Gorilla WebSocket** - Handles bidirectional, low-latency messaging.
- **Gorilla Mux** - Predictable routing for REST endpoints.
- **golang-migrate** - Managed schema evolution without manual SQL drift.
- **bcrypt** - Industry-standard password hashing.

### Frontend - What You See
- **Next.js 15.5.3** - Hybrid rendering, file routing, and performance by default.
- **React 19.1.0** - Interactive UI foundation.
- **TypeScript 5** - Safer component contracts and API calls.
- **Tailwind CSS 4** - Utility styling for a consistent system look.
- **Framer Motion 12.23.22** - Smooth transitions and motion flourishes.
- **SWR** - Smart caching and revalidation for fast data refreshes.
- **Lucide Icons** - Clean, scalable icons.

### DevOps - Getting It Running
- **Docker** - Same environment everywhere.
- **Docker Compose** - Orchestrates frontend, backend, and database together.
- **Nginx** - Production-ready reverse proxy option.

---
## 🏗️ Architecture & Data Flow

Think of GigaBit as a conversation between the browser, the Go services, and the database, with a WebSocket rail for live signals.

### How Everything Fits Together

```
Your Browser (Frontend) ↔ Go Backend (API Server) ↔ SQLite Database
       ↓                           ↓
   WebSocket Connection    Real-time Updates
```

**The Frontend** (Next.js + React) handles UI, form flows, and beautifully renders data.

**The Backend** (Go) enforces rules, validates input, orchestrates WebSocket sessions, and keeps state consistent.

**The Database** (SQLite) stores users, posts, chats, events, and relationships with referential integrity.

**WebSocket Connections** keep timelines, chats, and notifications moving without page refreshes.

### Request Flow Example

When you create a post:
1. Frontend collects the data and sends it via API call.
2. Backend validates, checks permissions, and writes to the database.
3. Backend broadcasts the new post to followers via WebSocket.
4. Frontend receives the update and renders instantly.
5. Database keeps the source of truth.

### Real-time Flow Example

When someone sends you a message:
1. Sender's frontend pushes the message over WebSocket.
2. Backend validates the sender, saves to database, and checks recipient presence.
3. Backend sends the message to the recipient via WebSocket (if online).
4. Recipient's frontend displays it instantly.
5. Backend stores notification for later if the recipient is offline.

---
## 🗄️ Database Schema & Logic

SQLite with 25 interconnected tables forms the relational spine. Here is the full Entity Relationship Diagram:

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
        INTEGER user_id FK
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

- **users → sessions** keeps authentication state tied to actual users.
- **users → follows → posts** builds the social graph and drives personalized feeds.
- **posts → comments/likes/bookmarks/shares** layer interactions and distribution on every piece of content.
- **groups → members/posts/events/conversations** anchor community spaces with clear permissions.
- **polls → options → votes** provide lightweight decision-making in feeds and groups.
- **conversations → messages** separate private and group chat rails while keeping histories lean.
- **users → notification_settings/notifications** personalize how and when alerts get delivered.

### 📊 Database Architecture Benefits

- **Normalized & consistent** to avoid duplication and keep joins predictable.
- **Cascading deletes** to protect referential integrity when users or groups disappear.
- **Role-aware design** so permissions stay explicit in group contexts.
- **Real-time ready** with message and notification tables tuned for WebSocket fan-out.
- **Privacy baked in** through dedicated post_privacy and profile visibility fields.
- **Auditable** with timestamps across all entities.

---
## 🚀 Getting Started

> Quick start: `./run.sh` (Docker Compose) spins up everything. Open the **Frontend** at `http://localhost:3000` and the **Backend API** at `http://localhost:8080`.

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

---
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

---
## 🔌 Real-time Features

GigaBit uses WebSocket connections for instant updates across messaging, notifications, status, and feed changes.

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

---
## 📁 Project Structure

```bash
Frontend/   # Next.js + React + Tailwind frontend
Backend/    # Go backend with REST + WebSocket
screenshots # App captures used throughout this README
run.sh      # Docker Compose bootstrap for local dev
```

---
## 🔒 Security & Privacy

- **Strong Passwords:** Passwords are bcrypt-hashed, never stored in plain text.
- **JWT Auth:** Short-lived tokens handle authentication with expiration.
- **Input Hygiene:** Validation and sanitization on every user-facing field.
- **Safe Database:** Parameterized queries to avoid SQL injection.
- **CORS Discipline:** Only accepts requests from the intended frontend origin.
- **Rate Limits:** Request throttling to discourage abuse.
- **Session Cleanup:** Expired sessions get pruned automatically.

---
## 🚀 Future Plans

Ideas on deck based on feedback and where we want the product to go next:

### 🔍 Better Search & Discovery
- **Improved search** with filters for finding posts, people, and groups more easily
- **Better recommendations** for groups and people to follow

### 📊 Basic Analytics
- **Simple stats** for groups and posts to see what's working
- **User activity insights** to help understand engagement

### 🔧 Technical Improvements
- **Better image handling** with compression and different sizes
- **Email notifications** for important updates
- **Improved mobile experience** with responsive design tweaks

### 🌐 Platform Growth
- **Progressive Web App** so it works more like a native app
- **Better accessibility** for screen readers and keyboard navigation
- **Multiple languages** support for international users

---
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

<div align="center">
  <img src="screenshots/mobile-resposive.jpeg" alt="Mobile Responsive" />
  <p><em>GigaBit works great on mobile browsers with responsive design, but no native mobile app available</em></p>
</div>

### 🔧 Development & Deployment
- **Monolithic Architecture:** Single codebase may become complex to maintain at scale
- **Manual Deployment:** Docker-based but lacks automated CI/CD pipelines
- **Limited Monitoring:** Basic logging without comprehensive system monitoring

---
## 🤝 Contributing

Want to push GigaBit further? Here's the flow:

1. **Fork the project** on GitHub
2. **Create a branch** for your feature (`git checkout -b feature/amazing-idea`)
3. **Make your changes** and test them
4. **Submit a pull request** — we'll review together

We're especially interested in:
- Bug fixes and performance improvements
- New features that fit the product story
- Better documentation and examples
- UI/UX enhancements

---
## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) for details.

---
## 👥 Authors

- **Salah Yuksel**
- **Qassim Aljaffer**
- **Sayed Ahmed Husain** - [sayedahmed97.sad@gmail.com](mailto:sayedahmed97.sad@gmail.com)

---
## 🙏 Acknowledgments

Built with ❤️ using modern web technologies. Huge thanks to the Go, React, and open-source communities for the tools and libraries that power this build.

**⭐ If GigaBit helps you connect, please give it a star!**
