**LIGMA - Implementation Plan**

**1\. Introduction**

**Purpose** This document defines the complete, step-by-step engineering roadmap for building LIGMA - an AI-powered collaborative infinite-canvas workspace with automatic task generation - from an empty repository to a production-ready deployment.

**Scope** Covers frontend, backend, database, real-time layer, AI integration, security, performance, testing, and deployment for every feature documented in the PRD, TRD, and UI/UX Blueprint (Auth, Workspace, Invitations, Canvas, Real-Time Collaboration, AI Classification, Task Automation, Node-Level RBAC, Event Log, Time Travel Replay, Presence Zones, and Chat).

**Audience** Engineers (frontend/backend), technical leads, and any code-generation AI assistant that will implement LIGMA feature-by-feature using this plan as the authoritative build order.

**Relationship with source documents**

- **PRD** - defines _what_ to build (features, roles, user journeys). This plan does not alter any PRD feature.
- **TRD** - defines _how_ it's technically built (stack, modules, API/socket contracts, flows). This plan sequences TRD modules into buildable phases.
- **UI/UX Blueprint** - defines _how it should look/feel_ (screens, components, tokens, states). This plan sequences frontend work screen-by-screen against the Blueprint's §7/§8.
- **Chat feature** (added in Blueprint §8/§9) is treated as a first-class module and slotted into the phase sequence below.

This plan introduces no new features, no new architecture, and no scope changes - it is purely sequencing and process guidance.

**2\. Development Strategy**

**Philosophy:** Backend-contract-first, vertical-slice delivery. For each feature, build the data model → API/socket contract → backend logic → frontend integration, so every phase ends in a working, demoable slice rather than a horizontal layer (e.g., "all models" then "all APIs").

**Monorepo structure (recommended):**

ligma/

├── frontend/ (React + Vite)

├── backend/ (Node/Express)

└── docs/ (PRD, TRD, Blueprint, this plan)

A monorepo (npm workspaces or simple two-folder repo with shared root README) is preferred over separate repos for a solo/small-team build - it keeps API/socket contract changes and their consumers in the same PR, easier for one person or a tight team to keep in sync.

**Frontend-first vs backend-first:** Backend-first is recommended per phase. Reason: canvas, tasks, and chat all depend on real data shapes (node schema, event schema, task schema) defined in the Backend Schema/TRD. Building UI against a stable contract avoids rework. Exception: Phase 0 (project scaffolding) and static screens (Login/Register layout) can be built in parallel since they don't depend on backend logic, only on the contract shape.

**Recommended workflow:**

- Implement/confirm data model for the feature.
- Implement REST endpoints (or socket events) per TRD §9/§10.
- Manually verify via API client (Postman/Thunder Client).
- Build frontend service layer (Axios) + Redux slice.
- Build UI screen/component per Blueprint §8.
- Wire loading/empty/error states (Blueprint §7 requires none skipped).
- Manual QA against PRD's user journey for that feature.

**Branching strategy:**

- main - always deployable.
- develop - integration branch.
- feature/&lt;phase&gt;-&lt;feature-name&gt; (e.g., feature/03-invitations) - merged into develop via PR after manual QA.
- release/\* - cut from develop before deployment milestones.

**Milestone strategy:** Milestones are grouped by phase clusters (see §16), each ending in a demoable increment: Auth+Workspace → Canvas (static) → Real-time Canvas → AI+Tasks → RBAC+Events → Replay+Presence+Chat → Hardening → Deploy.

**3\. Project Phases**

**Phase 1 - Project Initialization**

- **Objective:** Empty-repo → running skeleton with both apps connected to DB.
- **Features:** Repo/folder structure (TRD §6/§7), env config, Express server with Helmet/CORS/Morgan/rate-limit, MongoDB Atlas connection, Vite+React app shell, Tailwind config with Blueprint §6 tokens, base routing shell.
- **Dependencies:** None.
- **Deliverables:** Health-check API responds; frontend renders a blank themed shell; DB connects.
- **Success Criteria:** Both apps boot without errors; env vars from TRD's variable list are all present and documented in .env.example.
- **Risks:** Misconfigured CORS/Socket origin causing later integration pain - mitigate by setting SOCKET_CORS_ORIGIN/CLIENT_URL correctly from day one.

**Phase 2 - Authentication**

- **Objective:** Register/Login/Logout fully functional with JWT.
- **Features:** User model, password hashing (bcryptjs), POST /register, POST /login, JWT issuance/verification middleware, Login/Register screens (Blueprint §8.1/§8.2), auth Redux slice, protected route wrapper.
- **Dependencies:** Phase 1.
- **Deliverables:** User can register, log in, receive JWT, hit a protected route, log out.
- **Success Criteria:** Invalid credentials rejected with inline error (per Blueprint §8.1); JWT expiry triggers silent refresh attempt / redirect per UX Rules §10.
- **Risks:** Session-expiry UX (silent refresh) is easy to under-build - flag explicitly since it's a named UX Rule.

**Phase 3 - Workspace Management**

- **Objective:** Users can create/list workspaces; creator becomes Lead.
- **Features:** Workspace + WorkspaceMembers models, POST/GET/PATCH/DELETE /workspace, Dashboard screen (Blueprint §8.4), Create Workspace modal, workspace switcher.
- **Dependencies:** Phase 2 (JWT required on all workspace routes).
- **Deliverables:** Dashboard lists workspace cards with role badges; new workspace auto-enters Canvas as Lead.
- **Success Criteria:** Role stored correctly as Lead on creation; empty-state shown per Blueprint §7 when no workspaces exist.

**Phase 4 - Invitation System**

- **Objective:** Full invite → accept/reject flow per PRD Feature 2 and TRD Invitation Flow.
- **Features:** Invitations model, secure token generation, expiration logic, POST /invitations, GET /invitations/:token, POST /invitations/accept, PATCH /invitations/:token/reject, email sending (Resend/dev fallback Nodemailer), Accept Invitation screen (Blueprint §8.3), Members screen (Blueprint §8.7) with pending-invite state.
- **Dependencies:** Phase 3 (needs workspace + role assignment).
- **Deliverables:** Lead can invite by email+role; invited user (new or existing) ends up as a WorkspaceMember with correct role.
- **Success Criteria:** Expired tokens correctly rejected and cannot be reused (TRD Security Requirements); new-user vs existing-user branching works per PRD invitation flow steps 7-8.
- **Risks:** Email deliverability in dev - mitigate with Nodemailer/Gmail App Password fallback as documented.

**Phase 5 - Canvas Foundation (Static)**

- **Objective:** Render an infinite canvas with node CRUD, no real-time yet.
- **Features:** CanvasNodes model, GET/POST/PATCH/DELETE /nodes (or /node per PRD naming - reconcile per Backend Schema), React Konva stage, floating toolbar, node types (Sticky/Text/Shape/Arrow/Draw), Canvas screen shell (Blueprint §8.5) sans live-collab and AI.
- **Dependencies:** Phase 3 (workspace context required to scope nodes).
- **Deliverables:** Single-user node creation/edit/move/delete persists to DB and reloads correctly.
- **Success Criteria:** Node CRUD works via REST only; canvas loads <2s per TRD performance target on a moderate node count.

**Phase 6 - Canvas Editing & Interaction Polish**

- **Objective:** Full node interaction UX per Blueprint §8.5 (keyboard shortcuts, animations, node context menu, resize/lock UI, soft-delete/undo toast).
- **Features:** Node context menu, keyboard shortcut layer, scale-in/out animations, soft-delete + "Undo" toast pattern (UX Rules §10), text max-length counter.
- **Dependencies:** Phase 5.
- **Deliverables:** Canvas interactions match Blueprint's animation system (§12) and consistency rules (§14).
- **Success Criteria:** All node states (default/hover/drag/locked/error) implemented per component spec.

**Phase 7 - Real-Time Collaboration**

- **Objective:** Multi-user sync via Socket.IO per TRD §10/§4 (Real-Time Collaboration).
- **Features:** Socket module (room join/leave), CREATE_NODE/UPDATE_NODE/DELETE_NODE/MOVE_NODE/CURSOR_MOVE/LOCK_NODE client→server events and their server→client broadcasts, live cursor layer, presence indicators, reconnection + missed-event sync.
- **Dependencies:** Phase 5/6 (node CRUD must exist before it can be broadcast).
- **Deliverables:** Two browser sessions see each other's edits and cursors live.
- **Success Criteria:** Socket latency <150ms (TRD perf target); reconnect resyncs missed events without full canvas reload.
- **Risks:** Race conditions on simultaneous node edits - mitigate with last-write-wins + event log as source of truth (see Phase 11).

**Phase 8 - AI Integration**

- **Objective:** Text→classification pipeline per TRD §12/§18 and PRD Feature 5.
- **Features:** AI service module, OpenRouter integration (primary model + fallback per Overview doc), debounced classify calls (800ms per Blueprint §8.5 performance note), POST /ai/classify (or /classify - reconcile naming with Backend Schema), classification badge UI with fade-in (no blocking loaders per UX Philosophy).
- **Dependencies:** Phase 5/6 (nodes must exist to classify their text) - does not require Phase 7, but works best alongside it for broadcasting results.
- **Deliverables:** Typing in a node produces a classification badge within TRD's <3s target.
- **Success Criteria:** AI failure/timeout falls back gracefully (no UI block); classification silent/background per UX Philosophy.

**Phase 9 - Task Automation**

- **Objective:** Action Items automatically become Tasks per PRD Feature 6 / Overview Step 4.
- **Features:** Tasks model, auto-create-task-on-Action-Item logic, GET /tasks, PATCH /tasks/:id, Task Board Kanban (Blueprint §8.6), Task Drawer, "Go to Node" navigation, toast "Task created."
- **Dependencies:** Phase 8 (needs classification result), Phase 7 (task creation should broadcast via socket per TRD AI flow).
- **Deliverables:** Creating an Action-Item node produces a visible task on the Task Board without any manual button.
- **Success Criteria:** Task always references Node ID (never duplicates content, per Overview Step 4); drag-and-drop status change works (@dnd-kit).

**Phase 10 - Node-Level RBAC**

- **Objective:** Per-node permission enforcement per PRD Feature 7 / Overview Step 5.
- **Features:** Permission field on node schema, RBAC middleware (workspace-role check + node-permission check), frontend permission hooks (useNodePermissions, useWorkspaceRole), locked-node dimmed UI + tooltip, Lead-only Lock/Delete controls (UI hide/disable + backend enforcement).
- **Dependencies:** Phase 5 (nodes exist), Phase 2/3 (roles exist).
- **Deliverables:** Contributor cannot edit a Lead-locked node either via UI or direct API call.
- **Success Criteria:** RBAC enforced on both client (UI gating) and server (TRD §14 RBAC Flow) - server check is authoritative.

**Phase 11 - Event Sourcing**

- **Objective:** Append-only event log for every canvas mutation per PRD Feature 8 / TRD §15.
- **Features:** EventLogs model, event-emission hooks on every node mutation (create/update/move/resize/delete/lock/permission-change), no update/delete allowed on event records.
- **Dependencies:** Phases 5-10 (all mutation types must exist to be logged).
- **Deliverables:** Every canvas action produces exactly one immutable event record.
- **Success Criteria:** Event log is complete and ordered; no mutation path bypasses event emission.

**Phase 12 - History Panel**

- **Objective:** Human-readable activity log per PRD Feature 9.
- **Features:** GET /events, History Panel "Activity Log" tab (Blueprint §8.8), pagination/virtualization for large logs.
- **Dependencies:** Phase 11.
- **Deliverables:** Users can see who did what, when, reverse-chronologically.
- **Success Criteria:** Performs acceptably at 50+ events (paginated per Blueprint note).

**Phase 13 - Time Travel Replay**

- **Objective:** Reconstruct canvas state at any point in time per PRD Feature 10 / TRD §16.
- **Features:** Replay engine (sequential event replay), "Replay" tab with timeline scrubber, play/pause/speed control, read-only overlay during replay, "Exit Replay" button.
- **Dependencies:** Phase 11 (event log must be complete and ordered).
- **Deliverables:** Scrubbing timeline visually reconstructs the canvas as it looked at that timestamp.
- **Success Criteria:** Replay never mutates live canvas state; matches TRD Time Travel flow exactly.

**Phase 14 - Presence Zones**

- **Objective:** Zone-based active-user awareness per PRD Feature 11 / TRD §17.
- **Features:** Zone boundary definitions (Frontend/Backend/Database/Testing/Deployment), cursor-position→zone mapping, zone overlay UI with active-user avatars.
- **Dependencies:** Phase 7 (needs live cursor data).
- **Deliverables:** Canvas visually shows which teammates are active in which zone.
- **Success Criteria:** Zone membership updates in near real-time as users pan/move.

**Phase 15 - Chat (Blueprint §8/§9 addition)**

- **Objective:** Workspace-scoped real-time chat per Blueprint's Chat spec.
- **Features:** Channels + Messages models (not in original PRD/TRD schema list - flagged as an Overview/Blueprint-only addition, see assumption note below), GET /channels, GET /messages, POST /messages, TYPING socket event, node-reference chip, mention autocomplete, Chat screen two-pane layout.
- **Dependencies:** Phase 3 (workspace context), Phase 5 (node-reference chips link to nodes), Phase 7 (reuses socket infrastructure).
- **Deliverables:** Members chat in real time per channel; node-reference chips deep-link to Canvas.
- **Success Criteria:** Viewer role is read-only in chat (per Blueprint's stated permission model); optimistic send + retry-on-fail works.
- **Assumption flagged:** The PRD/TRD's documented database collections list does not include Channels/Messages - the Blueprint introduces Chat later. This plan assumes two new collections (Channels, Messages) are added to the schema, consistent with the Blueprint's explicit API expectations (GET /channels, GET /messages, POST /messages), without altering any other documented collection.

**Phase 16 - Testing**

- **Objective:** Verify correctness across all completed phases.
- **Features:** Unit, integration, E2E, manual, AI, and socket testing per §13 below.
- **Dependencies:** All feature phases substantially complete.
- **Deliverables:** Test suite + manual QA checklist executed against PRD Success Criteria and TRD Technical Success Criteria.
- **Success Criteria:** All items in PRD §18 and TRD §24 verified.

**Phase 17 - Deployment**

- **Objective:** Ship to production per TRD §21.
- **Features:** Vercel (frontend), Render/Railway (backend), MongoDB Atlas (prod cluster), OpenRouter + Resend production keys, env var configuration, CI/CD.
- **Dependencies:** Phase 16.
- **Deliverables:** Publicly accessible, fully functional production deployment.
- **Success Criteria:** All TRD §24 criteria pass in the deployed environment.

**4\. Feature Dependency Map**

Authentication

↓

Workspace Management

↓

Invitation System

↓

Canvas Foundation (nodes exist)

↓

├──► Canvas Editing Polish

├──► Real-Time Collaboration (needs nodes to broadcast)

│ ↓

│ Presence Zones (needs live cursors)

│ ↓

│ Chat (reuses socket infra + node references)

↓

AI Integration (needs node text)

↓

Task Automation (needs classification result)

↓

Node-Level RBAC (needs nodes + roles, gates all mutation paths)

↓

Event Sourcing (needs all mutation types finalized to log correctly)

↓

History Panel (needs event log)

↓

Time Travel Replay (needs complete, ordered event log)

↓

Testing → Deployment

**Rationale for key dependencies:**

- **Auth → everything:** every API is JWT-protected; nothing else is testable without it.
- **Workspace → Canvas/Invitations:** nodes, tasks, events, and members are all scoped to a workspace ID.
- **Canvas → AI → Tasks:** AI classifies node text; tasks are created _from_ classification results and reference node IDs - this order can't be reversed.
- **RBAC placed after core CRUD, before Event Sourcing:** RBAC must wrap every mutation path; building it after all mutation types exist (Phases 5-9) avoids retrofitting permission checks into every new endpoint added later.
- **Event Sourcing after RBAC:** because permission-change events must also be logged, RBAC needs to exist first.
- **Replay after Event Sourcing:** replay is literally "read the event log sequentially" - it has no meaning until the log is complete and trustworthy.
- **Presence Zones after Real-Time:** zones are derived from live cursor position data.
- **Chat after Real-Time + Canvas:** node-reference chips require nodes to exist; typing indicators reuse socket infra.

**5\. Frontend Implementation Roadmap**

**Routing:** Set up React Router matching the Information Architecture (Blueprint §3) first: /login, /register, /invite/:token, /dashboard, /workspace/:id/canvas, /workspace/:id/tasks, /workspace/:id/chat, /workspace/:id/members, /workspace/:id/history, /workspace/:id/settings. Protected-route wrapper gates authenticated routes; workspace-context wrapper gates workspace-scoped routes.

**Layouts:** Build DashboardLayout and WorkspaceLayout (sidebar + navbar shell) early (Phase 3) since every subsequent screen nests inside one of these two shells.

**Components:** Build in dependency order - primitives first (Button, Input, Badge, Avatar, Modal, Drawer, Toast) via shadcn/ui, then composite components (Cards, Table, Tabs) reused across screens, then feature-specific components (NodeRenderer, TaskCard, MessageBubble) last, once their backing data model exists.

**Pages:** Build in the same order as Phases 2-15 above (Login/Register → Dashboard → Canvas → Task Board → Members → History → Settings → Chat), since each page's real data dependency is the gating factor, not visual complexity.

**State Management:** Redux Toolkit slices, one per domain (auth, workspaces, nodes, tasks, events, members, chat). Nodes normalized by nodeId; messages normalized by channelId → messageId (per Blueprint §9.0 state management note). Ephemeral, high-frequency state (live cursor position, typing indicators) is kept out of Redux - local component state or refs synced directly to sockets, exactly as the Blueprint specifies, to avoid unnecessary re-renders.

**API Layer:** Centralized Axios instance with JWT interceptor and silent-refresh-on-401 logic (per UX Rules §10 session-timeout behavior), one service module per domain matching backend route modules.

**Socket Layer:** Single useSocket hook (per Blueprint's Frontend Implementation Rules §15) wrapping connection lifecycle, room join/leave, and typed event handlers - reused by Canvas, Presence, and Chat, never re-implemented per feature.

**Canvas Layer:** React Konva stage built incrementally: static stage → node rendering → node CRUD → drag/resize → live-cursor overlay → presence-zone overlay → classification badge overlay. Virtualization/culling for 100+ nodes added once base rendering is stable (Phase 6/7), not from day one, to avoid premature optimization.

**AI UI:** Passive/implicit per UX Philosophy - implement only the classification badge + its popover (Reclassify/Dismiss); no dedicated AI screen exists in the IA, so none should be built.

**Task Board:** Kanban via @dnd-kit built after Task model/API exist (Phase 9); drag-and-drop status change wired to PATCH /tasks/:id.

**Responsive Design:** Build desktop layout first per screen spec, then apply the three responsive rule-sets from Blueprint §9 (Desktop/Tablet/Mobile) - done per-screen immediately after that screen's desktop version is functional, not retrofitted at the end (per Blueprint §15 "responsive-first" rule).

**Accessibility:** ARIA roles, keyboard nav, and contrast requirements (Blueprint §11) are built into each component at creation time, not as a later pass - treated as non-negotiable per AI Code Generation Constraints §16.

**6\. Backend Implementation Roadmap**

**Express setup:** App factory with Helmet, CORS (scoped to CLIENT_URL), Morgan logging, express-rate-limit, centralized error-handling middleware, JSON body parsing - all in Phase 1, before any route exists.

**Database:** Mongoose connection singleton with retry-on-failure (per TRD Error Handling §22), connected before server starts accepting requests.

**Models:** Implemented in the dependency order from §7 below (Users → Workspaces → WorkspaceMembers → Invitations → CanvasNodes → Tasks → EventLogs → Channels/Messages).

**Authentication:** JWT generation/verification utility + bcrypt password hashing, built once in Phase 2 and reused (not reimplemented) by every subsequent protected route.

**Middleware:** authenticate (JWT verify) built in Phase 2; requireWorkspaceRole and requireNodePermission built in Phase 10, applied to all mutation routes retroactively where needed and to all new routes going forward.

**APIs:** Built module-by-module matching Phase order in §3 - Auth → Workspace → Invitations → Nodes → AI → Tasks → Events → Chat.

**Socket.IO:** Single socket server instance initialized alongside Express (Phase 1 setup, event logic added in Phase 7), room-per-workspace pattern, JWT-authenticated socket handshake reusing the same auth utility as REST.

**AI Service:** Isolated service module wrapping OpenRouter calls (primary + fallback model), independent of any specific route so it can be reused by both the classify endpoint and any future batch/summary feature.

**Invitation Service:** Isolated module for token generation/verification/expiry, reused by both the invite-creation and invite-acceptance routes.

**Event Log:** Implemented as a write-only service (logEvent(...)) called from every mutation controller - never exposed as a direct write endpoint to clients.

**RBAC:** Implemented as reusable middleware/utility functions, not duplicated per-route logic.

**Validation:** Zod schemas per request body, applied at the route/controller boundary consistently across all modules (matches frontend's Zod usage for symmetry).

**Error Handling:** Centralized error-handling middleware from Phase 1 onward; AI-timeout fallback and socket-reconnection handling added in their respective phases (8 and 7).

**7\. Database Implementation Order**

- **Users** - no dependencies, needed by everything.
- **Workspaces** - depends on Users (owner reference).
- **WorkspaceMembers** - depends on Workspaces + Users (junction collection for role assignment).
- **Invitations** - depends on Workspaces (workspaceId) and references an email, not necessarily an existing User.
- **CanvasNodes** - depends on Workspaces (workspaceId) + Users (author).
- **Tasks** - depends on CanvasNodes (nodeId reference - tasks never duplicate node content, per Overview Step 4).
- **EventLogs** - depends on Workspaces + CanvasNodes (nodeId), built last among core collections since it must be able to reference every mutable entity type.
- **Channels / Messages** (Blueprint addition) - depend on Workspaces (channel scoping) and CanvasNodes (node-reference chips in messages).

**Indexes:** Add indexes as each collection is implemented, not retroactively:

- Users.email - unique index (login lookups, invite email matching).
- WorkspaceMembers.{workspaceId, userId} - compound unique index (one role per user per workspace).
- Invitations.token - unique index (fast token lookup on GET /invitations/:token).
- CanvasNodes.workspaceId - index (canvas load queries by workspace).
- Tasks.nodeId - index (task↔node lookups).
- EventLogs.{workspaceId, timestamp} - compound index (ordered replay queries).
- Messages.{channelId, timestamp} - compound index (paginated thread loading).

**References:** All cross-collection references use Mongoose ObjectId refs, never embedded duplication - this preserves the "single source of truth" principle stated explicitly for Tasks→Nodes and should be applied consistently to Messages→Nodes (reference chips) as well.

**8\. API Implementation Order**

Authentication (POST /register, POST /login)

↓

Workspace (GET/POST/PATCH/DELETE /workspace)

↓

Invitations (POST /invitations, GET /invitations/:token,

POST /invitations/accept, PATCH /invitations/:token/reject)

↓

Canvas Nodes (GET/POST/PATCH/DELETE /nodes)

↓

AI (POST /ai/classify)

↓

Tasks (GET /tasks, PATCH /tasks/:id)

↓

Events (GET /events)

↓

Chat (GET /channels, GET /messages, POST /messages)

Each module is implemented and manually verified (via API client) before its dependent module begins, per the vertical-slice workflow in §2. Note: PRD lists singular /node//task//classify while TRD/Backend Schema imply pluralized REST conventions (/nodes, /tasks, /ai/classify) - this plan follows the TRD's more detailed convention per the source-of-truth rule (use the more detailed document when they overlap), while preserving identical behavior.

**9\. WebSocket Implementation Plan**

**Connection lifecycle:** Client connects with JWT in the handshake → server verifies → on success, client emits JOIN_WORKSPACE with workspaceId → server adds socket to that workspace's room. On disconnect, server removes socket from room and broadcasts USER_LEFT.

**Room management:** One Socket.IO room per workspace ID. All broadcasts (NODE_CREATED, TASK_CREATED, etc.) are scoped to that room only - no cross-workspace leakage.

**Event flow:** Client emits a mutation event (CREATE_NODE, UPDATE_NODE, etc.) → server validates JWT + RBAC (Phase 10 onward) → server persists to DB + writes an event log entry (Phase 11 onward) → server broadcasts the corresponding \*\_CREATED/UPDATED/DELETED event to the room (excluding or including sender per UX needs - sender gets optimistic local update, so exclude sender from re-broadcast to avoid duplicate render).

**Synchronization strategy:** On reconnect, client requests events since its last-known timestamp (missed-event sync per TRD Real-Time Collaboration feature) rather than reloading the entire canvas - this relies on the EventLogs collection's ordered timestamp index (§7).

**Reconnection handling:** Socket.IO's built-in exponential backoff reconnection is used; frontend shows the "Reconnecting..." banner (Blueprint §8.5 error state) during this window and "You're offline" banner with optimistic local queue for actions taken while disconnected (UX Rules §10).

**Presence updates:** USER_JOINED/USER_LEFT broadcast on room join/leave; presence-zone membership (Phase 14) is computed from CURSOR_MOVE payloads client-side or server-side and broadcast as a lightweight, non-persisted event (matches Blueprint's treatment of typing indicators as ephemeral/non-persisted).

**Cursor updates:** CURSOR_MOVE throttled client-side (not on every mousemove event) before emission to respect the <150ms latency budget and avoid flooding the socket channel; interpolated smoothly on the receiving end (per Blueprint §12 animation table - continuous/linear).

**10\. AI Integration Plan**

**When AI should be called:** Only on node text create/update, debounced - never on every keystroke (per Blueprint §8.5 performance note and TRD AI Flow).

**Debouncing strategy:** 800ms of typing inactivity (per Blueprint) before firing POST /ai/classify. If the user keeps typing, the timer resets - only one classification call per pause, not per character.

**Classification workflow:** Backend sends only the node's raw text to OpenRouter using the fixed prompt template (TRD §18) - no internal IDs are ever sent to the AI model (explicit constraint from the Overview doc). Response is parsed into exactly one of four categories (Action Item / Decision / Open Question / Reference) and mapped back to the originating node via the locally-stored Node ID.

**Task generation workflow:** Only "Action Item" results trigger Task creation (Phase 9) - all other categories update the node's classification field only, no downstream task action.

**Failure handling:** If OpenRouter times out or errors, fall back to the secondary model (google/gemma-3-4b-it:free per Overview doc) before surfacing failure; if both fail, the node saves normally without a classification badge - AI failure must never block node save/edit (matches UX Philosophy of AI never demanding attention).

**Retry strategy:** One automatic retry on transient failure (network/5xx) before falling back to the secondary model; no retry storm - bounded per TRD Error Handling §22 pattern (mirrors the "retry 3x silently" API pattern from UX Rules, scaled appropriately for AI latency).

**Rate limiting considerations:** Debouncing is the primary rate-limit strategy; additionally, backend-level rate limiting (express-rate-limit, already scaffolded in Phase 1) is applied to the /ai/classify route specifically to protect the free-tier OpenRouter quota from abuse (e.g., programmatic/rapid-fire requests bypassing the frontend debounce).

**11\. Security Implementation Plan**

- **JWT:** Issued at login/register, verified via middleware on every protected route and socket handshake; short-lived access token with silent-refresh pattern (per UX Rules §10).
- **Password hashing:** bcryptjs at registration; plaintext password never stored or logged.
- **RBAC:** Two layers - workspace-level role (Lead/Contributor/Viewer) and node-level permission (Phase 10) - both enforced server-side; frontend gating is UX convenience only, never the security boundary.
- **Node permissions:** Checked on every node mutation route before persistence; locked nodes reject Contributor writes even if the request is crafted directly against the API.
- **Invitation token validation:** Cryptographically random token generation, expiration timestamp checked on every GET /invitations/:token and POST /invitations/accept call; expired/used tokens permanently rejected (cannot be reused, per TRD §19).
- **API validation:** Zod schema validation on every request body across all modules, rejecting malformed input before it reaches business logic.
- **Rate limiting:** Global rate limiter from Phase 1, plus a stricter limiter on /ai/classify and /login//register (brute-force protection).
- **Helmet:** Standard secure-header defaults applied from Phase 1.
- **CORS:** Locked to CLIENT_URL/SOCKET_CORS_ORIGIN env values, never wildcard, in both dev and prod configs.
- **Environment variables:** All secrets (JWT_SECRET, MONGODB_URI, OPENROUTER_API_KEY, RESEND_API_KEY, etc.) loaded via dotenv locally and via the hosting platform's secret manager in staging/production - never committed to the repo.

**12\. Performance Strategy**

- **Canvas optimization:** Viewport-based culling/virtualization of nodes outside the visible area (added once base rendering is stable, per §5) to support 100+ nodes per workspace (TRD perf target).
- **React optimization:** React.memo on node/task/message card components to avoid re-rendering the full list on single-item updates; Redux selectors kept granular (per-node, per-message) rather than selecting whole slices.
- **Socket optimization:** Throttled CURSOR_MOVE and TYPING emissions (client-side throttle, not per-event), event batching for bulk canvas loads (render initial 100-node load instantly with no animation, per Blueprint §12 "when NOT to animate" rule).
- **Database optimization:** Indexes per §7, pagination on Events and Messages queries (never fetch unbounded history), lean/projection queries where full documents aren't needed.
- **Lazy loading:** Route-based code splitting so Canvas (React Konva, heaviest dependency) doesn't block initial load of Login/Dashboard.
- **Code splitting:** Per top-level route (/canvas, /tasks, /chat, /history) via React Router lazy loading.
- **Memoization:** Expensive derived computations (e.g., zone-membership calculation, replay reconstruction) memoized against their input event slice.
- **Event batching:** Rapid sequential socket broadcasts (e.g., during Time Travel Replay's sequential event application) batched/throttled on the frontend to avoid excessive re-renders during fast-forward replay.

**13\. Testing Strategy**

| **Type**                | **Scope**                                                                                                            | **Priority Areas**                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Unit Testing**        | Individual functions/services (JWT utils, RBAC checks, invitation token logic, AI response parsing)                  | RBAC logic and invitation expiry logic - highest business-risk if wrong         |
| **Integration Testing** | API routes against a test DB (auth flow, invite→accept flow, node CRUD, task auto-creation)                          | AI-classify→task-creation pipeline end-to-end                                   |
| **End-to-End Testing**  | Full user journeys per PRD §7 (Register→Workspace→Canvas→Task→History→Replay) using a browser automation tool        | Multi-user real-time collaboration scenario (two simulated sessions)            |
| **Manual Testing**      | UX/visual QA against Blueprint screen specs, responsive breakpoints, accessibility (keyboard nav, contrast)          | Every screen's loading/empty/error states (Blueprint §16 requires none skipped) |
| **AI Testing**          | Classification accuracy sampling against the four documented example categories; fallback-model trigger verification | Confirm failure path never blocks node save                                     |
| **Socket Testing**      | Room isolation (no cross-workspace leakage), reconnection/missed-event sync, presence accuracy                       | Concurrent multi-user editing race conditions                                   |

No test code is authored in this document - this section defines scope and priority only, per the governing prompt's constraints.

**14\. Deployment Strategy**

**Environments:**

- **Development:** Local - Vite dev server + local/Atlas dev cluster + Nodemailer/Gmail App Password for email.
- **Staging:** Vercel preview deployments (frontend) + Render/Railway preview environment (backend) + a separate MongoDB Atlas dev/staging cluster + Resend in sandbox/test mode.
- **Production:** Vercel production (frontend), Render or Railway production service (backend), MongoDB Atlas production cluster, OpenRouter production key, Resend production sending domain.

**Frontend (Vercel):** Connected to main branch for auto-deploy; environment variables (API base URL, socket URL) configured per environment in Vercel dashboard.

**Backend (Render/Railway):** Connected to main; all TRD-listed env vars (PORT, NODE_ENV, CLIENT_URL, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_BASE_URL, OPENROUTER_CHAT_ENDPOINT, SOCKET_CORS_ORIGIN, RESEND_API_KEY, EMAIL_FROM) configured in the platform's secret manager, never in the repo.

**MongoDB Atlas:** Separate clusters (or at minimum separate databases) for dev/staging/production to avoid cross-contaminating test data with real user data.

**OpenRouter / Resend:** Separate API keys per environment where the provider supports it, to isolate cost/quota and avoid staging traffic consuming production rate limits.

**CI/CD recommendation:** GitHub Actions pipeline - on PR: lint + build + (once written) test suite run; on merge to main: auto-deploy frontend (Vercel) and backend (Render/Railway) via their native GitHub integration.

**15\. Risk Assessment**

| **Risk**                                                                       | **Likelihood**           | **Impact** | **Mitigation**                                                                           | **Priority** |
| ------------------------------------------------------------------------------ | ------------------------ | ---------- | ---------------------------------------------------------------------------------------- | ------------ |
| Real-time race conditions on simultaneous node edits                           | Medium                   | High       | Event log as source of truth; last-write-wins with event ordering by timestamp           | High         |
| OpenRouter free-tier rate limits/downtime                                      | Medium                   | Medium     | Fallback model + debounce + graceful non-blocking failure                                | High         |
| RBAC bypass via direct API calls (frontend-only gating)                        | Low (if built correctly) | High       | Server-side enforcement mandatory on every mutation route, verified in integration tests | High         |
| Invitation token reuse/expiry bugs                                             | Low                      | Medium     | Explicit expiry check + status-transition tests (Pending→Accepted/Rejected/Expired)      | Medium       |
| Canvas performance degradation at 100+ nodes                                   | Medium                   | Medium     | Viewport culling + virtualization built before scale-testing                             | Medium       |
| Socket reconnection losing events                                              | Medium                   | Medium     | Missed-event sync via timestamped event log rather than full reload                      | Medium       |
| Email deliverability issues in dev/staging                                     | Medium                   | Low        | Documented Nodemailer/Gmail App Password fallback for local dev                          | Low          |
| Schema drift between PRD/TRD naming (/node vs /nodes)                          | Low                      | Low        | Standardize on TRD/Backend Schema convention as documented in §8                         | Low          |
| Scope creep from "more Features" wishlist (voice, OCR, Jira integration, etc.) | Medium                   | Medium     | Explicitly out of scope for this plan - PRD §17/TRD §23 items are post-MVP only          | Medium       |

**16\. Development Milestones**

| **Milestone**                     | **Phases Included** | **Expected Outcome**                     | **Exit Criteria**                                                                       |
| --------------------------------- | ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| **M1 - Foundation**               | 1-2                 | Runnable skeleton with working auth      | User can register/login/logout; JWT protects a sample route                             |
| **M2 - Workspace Core**           | 3-4                 | Full workspace + invitation loop         | Lead can create workspace, invite a Contributor/Viewer, invitee joins with correct role |
| **M3 - Canvas MVP (single-user)** | 5-6                 | Functional infinite canvas, no real-time | User can create/edit/move/delete all node types with full interaction polish            |
| **M4 - Live Collaboration**       | 7                   | Multi-user canvas sync                   | Two sessions see each other's edits/cursors within perf targets                         |
| **M5 - Intelligence Layer**       | 8-9                 | AI classification + auto task creation   | Typing an action item produces a Task Board entry with no manual step                   |
| **M6 - Governance & History**     | 10-13               | RBAC, event log, history, replay         | Locked nodes enforced server-side; replay reconstructs canvas accurately                |
| **M7 - Awareness & Chat**         | 14-15               | Presence zones + chat                    | Zone indicators live; chat sends/receives in real time with node-reference chips        |
| **M8 - Hardening**                | 16                  | Test coverage across all modules         | All PRD §18 / TRD §24 success criteria verified                                         |
| **M9 - Launch**                   | 17                  | Production deployment                    | App live on Vercel/Render/Atlas, fully functional per TRD §24                           |

**17\. Final Development Checklist**

**Frontend**

- \[ \] Folder structure matches TRD §6 exactly
- \[ \] Routing matches IA (Blueprint §3)
- \[ \] DashboardLayout / WorkspaceLayout shells built
- \[ \] All components from Blueprint §7 implemented with every listed state
- \[ \] All screens from Blueprint §8 implemented with loading/empty/error states
- \[ \] Redux slices per domain, normalized where specified
- \[ \] useSocket, useNodePermissions, useDebouncedClassify, useWorkspaceRole hooks built
- \[ \] Responsive rules (Blueprint §9) applied per screen
- \[ \] Accessibility (Blueprint §11) verified per screen
- \[ \] Animation system (Blueprint §12) applied consistently, reduced-motion respected

**Backend**

- \[ \] Folder structure matches TRD §7 exactly
- \[ \] Helmet, CORS, rate-limit, Morgan configured
- \[ \] All models built in dependency order (§7)
- \[ \] All indexes applied
- \[ \] JWT auth + bcrypt hashing implemented
- \[ \] RBAC middleware applied to every mutation route
- \[ \] All API modules implemented in order (§8)
- \[ \] Zod validation on every route
- \[ \] Centralized error handling + AI timeout fallback + DB reconnection recovery

**Database**

- \[ \] Users, Workspaces, WorkspaceMembers, Invitations, CanvasNodes, Tasks, EventLogs, Channels, Messages all implemented
- \[ \] All references use ObjectId, no content duplication
- \[ \] Event log confirmed append-only (no update/delete code path exists)

**AI**

- \[ \] OpenRouter primary + fallback model wired
- \[ \] Debounce (800ms) implemented client-side
- \[ \] Prompt template matches TRD §18 exactly
- \[ \] No internal IDs ever sent to the AI model
- \[ \] Non-blocking failure/fallback behavior verified

**Socket.IO**

- \[ \] Room-per-workspace isolation verified
- \[ \] All client→server and server→client events from TRD §10 implemented
- \[ \] Reconnection + missed-event sync working
- \[ \] Cursor/typing throttling in place

**Security**

- \[ \] All env vars from TRD list present and never committed
- \[ \] JWT expiry + silent refresh implemented
- \[ \] Invitation token expiry/reuse protection verified
- \[ \] RBAC enforced server-side, confirmed via direct API test (bypassing UI)

**Testing**

- \[ \] Unit tests for RBAC, invitation, AI-parsing logic
- \[ \] Integration tests for all API modules
- \[ \] E2E test for full PRD §7 user journey
- \[ \] Manual QA against every Blueprint screen spec
- \[ \] Multi-session real-time collaboration test executed

**Deployment**

- \[ \] Frontend deployed to Vercel
- \[ \] Backend deployed to Render/Railway
- \[ \] MongoDB Atlas production cluster provisioned
- \[ \] OpenRouter + Resend production keys configured
- \[ \] CI/CD pipeline running lint/build (and tests once written) on every PR

**Documentation**

- \[ \] .env.example kept in sync with actual required variables
- \[ \] README updated with setup/run instructions
- \[ \] This Implementation Plan updated if any documented assumption (e.g., Chat schema addition, /node vs /nodes naming) is later formalized in an updated Backend Schema doc