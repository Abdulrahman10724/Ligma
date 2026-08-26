**Product Requirements Document (PRD)**

**Project Name**

**LIGMA - Let's Integrate Groups, Manage Anything**

**1\. Product Overview**

LIGMA is an AI-powered collaborative workspace where teams brainstorm on a shared infinite canvas.

Instead of manually converting ideas into tasks after a meeting, the platform automatically detects actionable items using AI and creates a structured task board.

The goal is to reduce context switching between brainstorming tools and task management tools.

**2\. Problem Statement**

Modern teams use multiple tools during meetings.

Example:

- Miro for brainstorming
- Slack for discussions
- Jira for tasks
- Notion for documentation

After every meeting someone manually transfers ideas into tasks.

Problems:

- Ideas get lost
- Tasks are forgotten
- Duplicate work
- Time wasted
- Poor meeting documentation

LIGMA solves this by combining brainstorming and task management into one platform.

**3\. Objectives**

Build a collaborative workspace where users can

- Brainstorm visually
- Collaborate in real time
- Automatically generate tasks
- Keep complete history
- Secure important nodes
- Continue work after brainstorming ends

**4\. Target Users**

- Software Teams
- Product Managers
- Designers
- Startups
- Students
- Remote Teams

**5\. User Roles**

**Lead**

Permissions

- Create Workspace
- Invite Members
- Assign Roles
- Edit every node
- Lock nodes
- Delete nodes
- Manage permissions

**Contributor**

Permissions

- Create nodes
- Edit allowed nodes
- Draw
- Create sticky notes
- Comment

Cannot edit locked nodes.

**Viewer**

Permissions

- Read canvas
- View tasks
- View event log

Cannot modify anything.

**6\. Core Features**

**Feature 1**

**Authentication**

Users can

- Register
- Login
- Logout

**Feature 2**

**Workspace Management**

Users can

Create Workspace

Invite Members

Assign Roles

Lead becomes workspace owner automatically.

**Feature 3**

**Infinite Canvas**

Canvas supports

- Sticky Notes
- Text
- Rectangle
- Circle
- Arrow
- Free Drawing

Every object is a Node.

Each node contains

ID

Type

Position

Content

Author

Timestamp

Permissions

**Feature 4**

**Real-Time Collaboration**

Multiple users can

- Draw together
- Edit together
- See updates instantly
- See live cursors

Implemented using Socket.IO.

**Feature 5**

**AI Intent Classification**

Whenever text changes

Backend sends it to AI.

Possible outputs

Action Item

Decision

Question

Reference

Only Action Items become Tasks.

**Feature 6**

**Automatic Task Board**

When AI returns

Action Item

Backend creates

Task

Task contains

Node ID

Author

Timestamp

Status

Task always links back to original node.

**Feature 7**

**Node Level RBAC**

Each node has its own permissions.

Example

Architecture Diagram

Lead

Contributor

Viewer

**Feature 8**

**Event Log**

Every operation creates an event.

Example

Create Node

Move Node

Resize Node

Edit Text

Delete Node

Events never change.

They are only appended.

**Feature 9**

**Event History**

Users can open

History Panel

See

Who

Did What

When

**Feature 10**

**Time Travel Replay**

Replay the brainstorming session.

Timeline

0 min

↓

5 min

↓

10 min

↓

15 min

Canvas rebuilds using Event Log.

**Feature 11**

**Presence Zones**

Canvas divided into

Frontend

Backend

Database

Testing

Deployment

Each zone shows active users.

**7\. User Journey**

Register

↓

Login

↓

Create Workspace

↓

Invite Members

↓

Assign Roles

↓

Open Canvas

↓

Create Nodes

↓

AI Classifies Text

↓

Action Items become Tasks

↓

Task Board Updates

↓

Continue Collaboration

↓

Review Event Log

↓

Replay Session

↓

Export Summary

**8\. Database Collections**

**Users**

\_id

name

email

password

**Workspace**

\_id

title

owner

members

**Workspace Members**

workspaceId

userId

role

**Canvas Nodes**

\_id

workspaceId

type

text

position

author

permissions

createdAt

updatedAt

**Tasks**

\_id

nodeId

status

assignedTo

**Event Logs**

\_id

workspaceId

nodeId

eventType

payload

createdBy

timestamp

**9\. Backend Modules**

Authentication

Workspace

Canvas

AI

Tasks

RBAC

Events

Socket

Users

**10\. Frontend Pages**

Login

Register

Dashboard

Workspace

Canvas

Task Board

History Panel

Settings

**11\. Sidebar**

Canvas

Tasks

Members

History

Settings

**12\. Main Layout**

Sidebar

Canvas

Task Board

**13\. API Modules**

Authentication

POST /login

POST /register

Workspace

POST /workspace

GET /workspace

Nodes

POST /node

PATCH /node

DELETE /node

Tasks

GET /tasks

PATCH /task

AI

POST /classify

Events

GET /events

**14\. WebSocket Events**

JOIN_WORKSPACE

CREATE_NODE

UPDATE_NODE

DELETE_NODE

MOVE_NODE

CURSOR_MOVE

LOCK_NODE

CREATE_TASK

**15\. AI Flow**

User Types

↓

React

↓

Backend

↓

OpenRouter API

↓

Classification

↓

Backend

↓

Task Creation

↓

Task Board Updates

**16\. Tech Stack**

Frontend

- React
- Vite
- React Konva
- Redux Toolkit

Backend

- Node.js
- Express
- Socket.IO

Database

- MongoDB Atlas

Authentication

- JWT

AI

- OpenRouter (Gemma Free)

Deployment

- Frontend : Vercel
- Backend : Render or railway

**17\. more Features**

- AI Meeting Summary
- Voice-to-Task
- File Attachments
- Comments
- Mentions (@user)
- Export to PDF
- Export to Jira
- Dark Mode
- Mobile Version

**18\. Success Criteria**

The project is considered successful if:

- Users collaborate on the same canvas in real time.
- AI correctly classifies user intent.
- Action items automatically appear in the Task Board.
- Node-level permissions are enforced on both client and server.
- Every canvas change is recorded in the event log.
- Users can replay the brainstorming session using Time Travel.
- The application is deployed and fully functional.