**Backend Database Schema**

Database: MongoDB Atlas

**1\. Database Overview**

The application uses MongoDB because:

- Flexible document structure
- Fast querying
- Easy horizontal scaling
- Ideal for collaborative applications
- Supports nested objects for canvas data

**2\. Collections**

Users

Workspaces

WorkspaceMembers

CanvasNodes

Tasks

EventLogs

Invitations

**Database Relationship**

Users

│

┌───────────┴───────────┐

│ │

▼ ▼

Workspaces WorkspaceMembers

│ |

└──────────────────────┘

│

▼

CanvasNodes

/ | \\

/ | \\

▼ ▼ ▼

EventLogs Tasks AI Metadata

**Collection 1 - Users**

Purpose

Stores all registered users.

Fields

| **Field**  | **Type** | **Required** | **Description**    |
| ---------- | -------- | ------------ | ------------------ |
| \_id       | ObjectId | Yes          | Primary Key        |
| fullName   | String   | Yes          | User name          |
| username   | String   | Yes          | Unique username    |
| email      | String   | Yes          | Unique email       |
| password   | String   | Yes          | Hashed password    |
| avatar     | String   | No           | Profile image      |
| isVerified | Boolean  | Yes          | Email verification |
| lastSeen   | Date     | No           | Last activity      |
| createdAt  | Date     | Yes          | Account creation   |
| updatedAt  | Date     | Yes          | Last update        |

**Indexes:**

email

username

**Sample**

{

"\_id":"...",

"fullName":"Abdul Rahman",

"username":"abdul",

"email":"<abc@gmail.com>",

"password":"hashedPassword",

"avatar":"avatar.png",

"isVerified":true

}

**Collection 2 - Workspaces**

Purpose

Stores workspace information.

Fields

| **Field**   | **Type**       |
| ----------- | -------------- |
| \_id        | ObjectId       |
| Title       | String         |
| description | String         |
| Owner       | ObjectId(User) |
| visibility  | Public/Private |
| createdAt   | Date           |
| updatedAt   | Date           |

Sample

{

"title":"Sprint Planning",

"owner":"UserID",

"visibility":"Private"

}

**Collection 3 - Workspace Members**

Purpose

Manages user roles.

Fields

| **Field**   | **Type**                    |
| ----------- | --------------------------- |
| workspaceId | ObjectId                    |
| userId      | ObjectId                    |
| Role        | Lead / Contributor / Viewer |
| joinedAt    | Date                        |

Sample

{

"workspaceId":"...",

"userId":"...",

"role":"Contributor"

}

**Collection 4 - Canvas Nodes**

This is the heart of the application.

Each sticky note, text block, drawing, shape, or arrow is one node.

Fields

| **Field**        | **Type**                                        |
| ---------------- | ----------------------------------------------- |
| \_id             | ObjectId                                        |
| workspaceId      | ObjectId                                        |
| Type             | Sticky, Text, Rectangle, Circle, Arrow, Drawing |
| content          | String                                          |
| position         | Object                                          |
| Size             | Object                                          |
| Style            | Object                                          |
| Author           | ObjectId(User)                                  |
| permissions      | Array                                           |
| aiClassification | String                                          |
| isLocked         | Boolean                                         |
| createdAt        | Date                                            |
| updatedAt        | Date                                            |

Position

{

"x":250,

"y":400

}

Size

{

"width":250,

"height":120

}

Permissions

\[

"Lead",

"Contributor"

\]

AI Classification

Action Item

Decision

Open Question

Reference

Sample

{

"\_id":"...",

"workspaceId":"...",

"type":"sticky",

"content":"Complete Login API",

"author":"...",

"aiClassification":"Action Item",

"isLocked":false

}

**Indexes**

workspaceId

author

aiClassification

**Collection 5 - Tasks**

Purpose

Automatically created by AI.

Notice:

Task does NOT duplicate node data.

It stores only the reference.

Fields

| **Field**   | **Type**              |
| ----------- | --------------------- |
| \_id        | ObjectId              |
| workspaceId | ObjectId              |
| nodeId      | ObjectId              |
| assignedTo  | ObjectId              |
| status      | Todo/In Progress/Done |
| priority    | Low/Medium/High       |
| dueDate     | Date                  |
| createdAt   | Date                  |

Sample

{

"nodeId":"NodeID",

"status":"Todo",

"priority":"Medium"

}

**Collection 6 - Event Logs**

Purpose

Stores immutable history.

Every canvas mutation becomes one event.

Fields

| **Field**   | **Type** |
| ----------- | -------- |
| \_id        | ObjectId |
| workspaceId | ObjectId |
| nodeId      | ObjectId |
| userId      | ObjectId |
| eventType   | String   |
| payload     | Mixed    |
| timestamp   | Date     |

Event Types

NODE_CREATED

NODE_UPDATED

NODE_MOVED

NODE_RESIZED

NODE_LOCKED

NODE_DELETED

Payload Example

{

"x":200,

"y":400

}

**Indexes**

workspaceId

nodeId

timestamp

**Collection 7 - Invitations**

Purpose

Stores pending workspace invitations.

Fields

| **Field**   | **Type**             |
| ----------- | -------------------- |
| workspaceId | ObjectId             |
| Email       | String               |
| Role        | Contributor / Viewer |
| Token       | String               |
| expiresAt   | Date                 |

**Relationships**

User

↓

Workspace Owner

↓

Workspace

↓

Workspace Members

↓

Canvas Nodes

↓

Tasks

↓

Event Logs

**Recommended Indexes**

Users

email

username

Workspaces

owner

Workspace Members

workspaceId

userId

Canvas Nodes

workspaceId

author

aiClassification

Tasks

workspaceId

status

assignedTo

Event Logs

workspaceId

nodeId

timestamp

**Data Flow**

User

↓

Create Sticky Note

↓

Canvas Node Saved

↓

AI Classification

↓

Action Item?

│

├── No → Stop

│

▼

Yes

↓

Create Task

↓

Store Event

↓

Broadcast via Socket.IO

↓

Update Every Connected User

**My Suggestions (Production Improvements)**

Before you start implementing, I would make **two architectural improvements** to the schema:

**1\. Add a NodeConnections collection**

Instead of storing arrows inside CanvasNodes, store relationships separately:

**NodeConnections**

\_id

workspaceId

sourceNodeId

targetNodeId

type

style

createdBy

This makes connecting nodes much easier and keeps the node documents simpler.

**2\. Add a CanvasSnapshots collection**

Since your project supports **Time Travel Replay**, periodically save snapshots:

CanvasSnapshots

\_id

workspaceId

snapshotVersion

canvasState

createdAt

Then:

- Use **EventLogs** for detailed history.
- Use **CanvasSnapshots** every 100-200 events to avoid replaying thousands of events from the beginning.

This combination is how many production collaborative systems optimize performance while still preserving a complete event history.