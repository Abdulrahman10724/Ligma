**Proposed Technical Requirements Document (TRD)**

**1\. Document Information**

- Project Name
- Version
- Authors
- Technology Stack
- Last Updated

**2\. System Overview**

**Purpose**

Describe the complete technical architecture of the AI-powered collaborative brainstorming platform.

**Scope**

The system will provide:

- Infinite collaborative canvas
- AI intent detection
- Automatic task generation
- Real-time synchronization
- Node-level RBAC
- Event sourcing
- Time travel replay

**3\. Technology Stack**

**Frontend**

- React 19
- Vite
- React Konva
- Redux Toolkit
- React Router
- Axios
- Socket.IO Client
- Tailwind CSS
- shadcn/ui
- Lucide React
- Sonner
- React Hook Form
- Zod
- @hookform/resolvers
- @dnd-kit

**Backend**

- Node.js
- Express.js
- Socket.IO
- JWT
- bcryptjs
- Mongoose
- Axios
- Helmet
- express-rate-limit
- Morgan
- Cookie Parser
- CORS
- dotenv

**Database**

MongoDB Atlas

Collections

- Users
- Workspaces
- WorkspaceMembers
- Invitations
- CanvasNodes
- Tasks
- EventLogs

**AI**

OpenRouter API

**Model**

qwen/qwen3-next-80b-a3b-instruct:free

**Email Service**  
Resend (Production)

**Deployment**

Frontend

Vercel

Backend

Render or railway

Database

MongoDB Atlas

**4\. High-Level Architecture**

Users

│

▼

React Frontend (Vite)

│

REST API + Socket.IO

│

▼

Express Backend

┌──────────┬─────────────┬──────────────┬────────────┐

│ │ │ │

▼ ▼ ▼ ▼

MongoDB OpenRouter Resend Socket.IO

Atlas AI Email

**5\. Module Architecture**

**Authentication Module**

Responsibilities

- Login
- Register
- JWT Generation
- Password Encryption

**Workspace Module**

Responsibilities

- Create workspace
- Invite users via email
- Generate invitation token
- Verify invitation
- Accept invitation
- Assign roles
- Manage workspace members

**Canvas Module**

Responsibilities

- Create nodes
- Update nodes
- Delete nodes
- Lock nodes

**Invitation Module**

Responsibilities

• Generate secure invitation tokens

• Store invitations

• Send invitation emails

• Verify invitation tokens

• Accept invitations

• Reject invitations

• Expire old invitations

**AI Module**

Responsibilities

- Receive text
- Send prompt to AI
- Parse response
- Return category

**Task Module**

Responsibilities

- Create task automatically
- Link task to node
- Update task status

**Event Module**

Responsibilities

- Store immutable events
- Replay events
- Provide history

**Socket Module**

Responsibilities

- Broadcast changes
- Cursor synchronization
- Room management

**6\. Frontend Folder Structure**

src/

components/

pages/

hooks/

redux/

services/

sockets/

utils/

layouts/

routes/

assets/

**7\. Backend Folder Structure**

backend/

controllers/

models/

routes/

middleware/

services/

email/

templates/

events/

socket/

config/

utils/

**8\. Database Design**

**Users Model**

\_id

name

email

password

createdAt

**Workspaces Model**

\_id

title

owner

createdAt

**Workspace Members Model**

workspaceId

userId

role

**Invitations Model**

\_id

workspaceId

email

role

token

status = Pending, Accepted, Rejected, Expired

expiresAt

createdAt

respondedAt

**Canvas Nodes Model**

\_id

workspaceId

type

text

position

style

author

permissions

createdAt

updatedAt

**Tasks Model**

\_id

nodeId

status

assignedTo

**Event Logs Model**

\_id

workspaceId

nodeId

eventType

payload

createdBy

timestamp

**9\. API Design**

**Authentication**

POST /register

POST /login

**Workspace**

GET /workspace

POST /workspace

PATCH /workspace

DELETE /workspace

**Invitations**

POST /invitations  
GET /invitations/:token  
POST /invitations/accept  
PATCH /invitations/:token/reject

**Nodes**

GET /nodes

POST /nodes

PATCH /nodes/:id

DELETE /nodes/:id

**Tasks**

GET /tasks

PATCH /tasks/:id

**AI**

POST /ai/classify

**Events**

GET /events

**10\. WebSocket Events**

Client → Server

JOIN_WORKSPACE

LEAVE_WORKSPACE

CREATE_NODE

UPDATE_NODE

DELETE_NODE

MOVE_NODE

LOCK_NODE

CURSOR_MOVE

Server → Client

NODE_CREATED

NODE_UPDATED

NODE_DELETED

TASK_CREATED

CURSOR_UPDATED

USER_JOINED

USER_LEFT

**11\. Authentication Flow**

User Login/Register

↓

Validate Credentials

↓

Generate JWT

↓

Return Token

↓

Store Token

↓

If Invitation Token Exists

↓

Join Workspace

↓

Authenticated Requests

**12\. AI Classification Flow**

User Types

↓

Debounce

↓

POST /ai/classify

↓

OpenRouter

↓

Action Item

↓

Create Task

↓

Broadcast via Socket

**Invitation Flow**

Lead

↓

Invite User

↓

Generate Secure Token

↓

Store Invitation

↓

Send Email

↓

User Opens Link

↓

Verify Token

↓

Login / Register (if required)

↓

Accept or Reject Invitation

│

├── Accept

│

│ ↓

│

│ Create Workspace Member

│

│ Update Invitation Status → Accepted

│

└── Reject

↓

Update Invitation Status → Rejected

↓

Expired invitations are automatically marked as Expired and cannot be accepted.

**13\. Task Generation Flow**

Canvas Node

↓

AI

↓

Action Item

↓

Task Collection

↓

Task Board

↓

Click Task

↓

Navigate to Node

**14\. RBAC (Role Based Access Control) Flow**

Request

↓

JWT Verification

↓

Workspace Membership

↓

Node Permission Check

↓

Allowed?

↓

Execute Operation

**15\. Event Sourcing Flow**

Create Node

↓

Event Stored

↓

Move Node

↓

Event Stored

↓

Edit Text

↓

Event Stored

↓

Delete Node

↓

Event Stored

**16\. Time Travel Replay**

User Selects Timestamp

↓

Load Events

↓

Replay Sequentially

↓

Reconstruct Canvas

**17\. Presence Zones**

Cursor Position

↓

Determine Zone

↓

Broadcast Active Zone

↓

Display Active Members

**18\. AI Prompt**

You are an intent classifier.

Return ONLY one category.

Categories:

Action Item

Decision

Open Question

Reference

Text:

{{TEXT}}

**19\. Security Requirements**

- JWT Authentication
- Password Hashing
- Helmet
- CORS
- Rate Limiting
- Input Validation
- Role Validation
- Node Permission Validation
- Secure invitation tokens
- Invitation expiration
- Email verification before joining workspace
- Expired invitations cannot be reused.

**20\. Performance Requirements**

- Canvas loading < 2 seconds
- AI response < 3 seconds
- Socket latency < 150 ms
- Support 100+ nodes per workspace
- Support 20+ concurrent users

PORT

NODE_ENV

CLIENT_URL

MONGODB_URI

JWT_SECRET

JWT_EXPIRES_IN

OPENROUTER_API_KEY

OPENROUTER_MODEL

OPENROUTER_BASE_URL

OPENROUTER_CHAT_ENDPOINT

SOCKET_CORS_ORIGIN

RESEND_API_KEY

EMAIL_FROM

**21\. Deployment Architecture**

Vercel

↓

React

↓

Render

↓

Express + Socket.IO

↓

MongoDB Atlas

↓

OpenRouter API

↓

Resend Email API

**22\. Error Handling**

- AI timeout fallback
- Socket reconnection
- Automatic retry
- API validation
- MongoDB connection recovery

**23\. More features**

- Voice collaboration
- AI summaries
- OCR from images
- File uploads
- Jira integration
- GitHub integration
- Notifications
- Mobile application

**24\. Technical Success Criteria**

The implementation will be considered successful if:

- Real-time collaboration works correctly.
- AI classifies text accurately.
- Action Items automatically create tasks.
- Node-level RBAC is enforced on both frontend and backend.
- Every mutation is stored in an immutable event log.
- Time Travel Replay reconstructs previous canvas states.
- WebSocket synchronization remains consistent for multiple users.
- The system is successfully deployed using Vercel, Render, and MongoDB Atlas.