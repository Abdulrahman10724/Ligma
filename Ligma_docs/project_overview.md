# Project Overview

## Project Goal

Build an **AI-powered collaborative whiteboard** where teams can brainstorm on an infinite canvas while the system automatically converts important ideas into structured tasks. The goal is to eliminate manual copying of ideas into external task managers by connecting brainstorming directly with task management.

---

# Step 1 – Authentication & Workspace

* Users sign up and log in using JWT Authentication.
* A user creates a workspace.
* The creator automatically becomes the **Lead**.
* The Lead can invite users via **email invitation**.
* Invitations contain a secure token with an expiration time.
* If the invited user already has an account, they simply log in and accept the invitation.
* If they are new, they register first and then join the workspace.
* Members can have one of the following roles:

  * Lead
  * Contributor
  * Viewer

---

# Step 2 – Infinite Canvas

Users collaborate together on a shared infinite canvas.

They can create:

* Sticky Notes
* Text Blocks
* Shapes
* Freehand Drawings
* Connectors (Arrows)

Every canvas element is an independent **Node**.

Each node contains:

* Unique Node ID
* Workspace ID
* Author ID
* Creation Timestamp
* Last Updated Timestamp
* Position (X, Y)
* Size
* Style
* Permission Rules
* AI Classification
* Lock Status

Each node can be independently edited, moved, resized, deleted, locked, or shared.

---

# Step 3 – AI Intent Detection

Whenever a user enters or updates text inside a node, the backend sends **only the node's text** to an AI model through **OpenRouter**.

The AI classifies the content into one of four categories:

* Action Item
* Decision
* Open Question
* Reference

Example:

```
Complete Login API before Friday
```

↓

```
Action Item
```

Example:

```
We decided to use MongoDB Atlas.
```

↓

```
Decision
```

Example:

```
Should we use Redis for caching?
```

↓

```
Open Question
```

Example:

```
https://expressjs.com
```

↓

```
Reference
```

The backend never sends internal IDs to the AI model. It only sends the text, receives the classification, and maps the response back to the correct node using the stored Node ID.

Only **Action Items** automatically generate tasks.

---

# Step 4 – Automatic Task Management

When AI classifies a node as an **Action Item**, the backend automatically creates a task.

No manual "Create Task" button is required.

Each task stores:

* Task ID
* Node ID (Reference)
* Workspace ID
* Assigned User
* Status
* Priority
* Due Date
* Author
* Timestamp

The original node remains the single source of truth.

Tasks reference the Node ID instead of duplicating the node content.

Clicking a task automatically focuses the original node on the canvas.

---

# Step 5 – Node-Level Role-Based Access Control (RBAC)

Permissions are applied **per node**, not globally across the workspace.

Example:

Architecture Diagram

Allowed Roles:

* Lead ✅
* Contributor ❌
* Viewer ❌

Meeting Notes

Allowed Roles:

* Lead ✅
* Contributor ✅
* Viewer 👀 Read Only

This enables sensitive information to remain protected while allowing open collaboration on other nodes.

---

# Step 6 – Append-Only Event Log

Every canvas action creates a new immutable event.

Examples:

* Node Created
* Node Updated
* Node Moved
* Node Resized
* Node Deleted
* Node Locked
* Permission Updated

Events are never modified or deleted.

Instead, new events are continuously appended.

Benefits:

* Complete activity history
* Audit trail
* Canvas reconstruction
* Foundation for Time Travel Replay
* Efficient synchronization

---

# Step 7 – Real-Time Collaboration

The backend uses **Socket.IO** to synchronize all connected users.

Features include:

* Live collaboration
* Multiple users editing simultaneously
* Instant node updates
* Live cursor positions
* User presence indicators
* Automatic reconnection
* Missed-event synchronization instead of reloading the full canvas

---

# Step 8 – Invitation System

Workspace collaboration is managed through email invitations.

Flow:

Lead

↓

Invite User

↓

Enter Email

↓

Select Role

↓

Backend Generates Secure Token

↓

Invitation Stored in Database

↓

Email Sent

↓

User Opens Invitation Link

↓

Login / Register

↓

Accept Invitation

↓

Added to Workspace

The invitation contains:

* Workspace ID
* Email
* Assigned Role
* Secure Token
* Expiration Date

---

# Bonus Feature – Time Travel Replay

Since every canvas action is stored in the Event Log, users can replay an entire brainstorming session.

Users can:

* Move backward through history
* Move forward through history
* Watch the collaboration exactly as it happened
* Inspect how ideas evolved over time

---

# Bonus Feature – Presence Zones

The canvas is divided into logical work areas.

Example:

* Frontend Zone
* Backend Zone
* Database Zone
* AI Zone

Each zone displays which collaborators are currently active within that area.

This improves awareness during large collaborative sessions.

---

# Recommended Technology Stack

## Frontend

* React (Vite)
* React Konva
* Redux Toolkit
* React Router DOM
* Axios
* Socket.IO Client
* Tailwind CSS
* shadcn/ui
* Lucide React
* Sonner
* React Hook Form
* Zod
* @hookform/resolvers
* @dnd-kit (Core, Sortable, Utilities)

---

## Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* Socket.IO
* JWT Authentication
* bcryptjs
* Zod
* Axios
* Helmet
* Express Rate Limit
* Morgan
* Cookie Parser
* CORS
* dotenv

---

## Database

* MongoDB Atlas

Collections:

* Users
* Workspaces
* WorkspaceMembers
* CanvasNodes
* Tasks
* EventLogs
* Invitations

---

## AI

* OpenRouter API
* Primary Model:

  * `qwen/qwen3-next-80b-a3b-instruct:free`
* Fallback Model:

  * `google/gemma-3-4b-it:free`

---

## Email Service

* Resend (Production Recommended)

or

* Nodemailer + Gmail App Password (Development)

---

## Deployment

Frontend

* Vercel

Backend

* Render
* Railway

Database

* MongoDB Atlas

---

# Final Workflow

```
User Login
        │
        ▼
Create Workspace
        │
        ▼
Invite Team Members
        │
        ▼
Collaborate on Infinite Canvas
        │
        ▼
Create or Update Nodes
        │
        ▼
AI Classifies Text
        │
        ▼
Action Item?
      │
      ├── No → Save Node Only
      │
      ▼
Yes
      │
      ▼
Automatically Create Task
      │
      ▼
Store Event Log
      │
      ▼
Broadcast Changes via Socket.IO
      │
      ▼
All Connected Users Receive Live Updates
      │
      ▼
Replay History Anytime Using Event Logs
```
