**1\. Design Vision**

**Product Personality**

LIGMA should feel like a calm control room for collaborative thinking. The application combines two complementary personalities within a single experience:

- Canvas: Creative, free-flowing, playful, and flexible, encouraging brainstorming without constraints.
- Task Board & Settings: Structured, professional, and organized, providing the clarity and reliability expected from a modern SaaS application.

This balance allows users to brainstorm freely while seamlessly transitioning into structured project management.

**Visual Identity**

The interface should use a soft neutral color palette, featuring an off-white background in light mode and a near-black background in dark mode. A single, confident indigo/violet accent color should be used consistently across the application for primary actions, AI classification badges, active navigation states, and interactive highlights.

Sticky notes should use their own pastel color palette that remains independent of the primary brand accent. This creates a vibrant, expressive canvas while ensuring the surrounding interface remains calm, minimal, and unobtrusive.

**Design Philosophy**

"The canvas is the hero; the interface is the frame."

The primary focus should always remain on the collaborative canvas. Interface elements such as sidebars, toolbars, floating panels, and dialogs should support the user's workflow without competing for visual attention. Use subtle borders, minimal elevation, generous whitespace, and restrained visual styling to ensure the canvas remains the dominant element.

UX Philosophy

The application should prioritize zero-friction idea capture.

Users should be able to create, edit, and organize notes without interruption. AI-powered classification must operate silently in the background, making the experience feel effortless. Instead of blocking user actions with loaders or modal **dialogs, AI feedback** should appear naturally through subtle animations such as a smooth fade-in of classification badges.

The AI should enhance the workflow without demanding the user's attention.

**Emotional Tone**

The overall experience should feel focused, confident, and quietly intelligent, similar to collaborating with an experienced teammate who works efficiently in the background without interrupting the creative process.

Modern SaaS Design Principles

The interface should incorporate proven interaction patterns from leading productivity platforms while maintaining its own unique identity.

- Clean information density inspired by modern productivity applications.
- Flexible and colorful collaborative canvas interactions.
- Floating contextual toolbars that maximize workspace visibility.
- Consistent spacing, typography, and component hierarchy.
- Minimal visual noise with strong emphasis on usability and readability.

**Simplicity Goal**

A first-time user should be able to open the application, create a sticky note, and naturally discover that the AI has automatically classified it-all within 60 seconds, without requiring onboarding tutorials or guided walkthroughs.

The interface should be intuitive enough that core functionality is learned through interaction rather than instruction.

**2\. Design Principles**

| **Principle**          | **Rule**                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Consistency            | Same component = same look/behavior har jagah (Task card in Task Board vs Task Drawer identical structure) |
| Predictability         | Canvas gestures standard rahenge (scroll=pan, ctrl+scroll=zoom, drag=move) - no custom surprises           |
| Simplicity             | Har node type ka toolbar max 5 primary actions dikhaye, baaki "..." menu mein                              |
| Accessibility          | Sabhi interactive elements keyboard-reachable, 4.5:1 contrast minimum                                      |
| Visual hierarchy       | AI-classified nodes ko subtle colored left-border/badge se distinguish karo bina noise ke                  |
| Progressive disclosure | Node ka full metadata (author, timestamp, permissions) sirf hover/click par dikhe, default view clean      |
| User feedback          | Har mutation (save, lock, task-create) ek toast se confirm ho, canvas block na ho                          |
| Error prevention       | Delete node/workspace pe hamesha confirmation dialog                                                       |
| Minimal cognitive load | Sidebar max 5 primary nav items, extra options collapse mein                                               |

**3\. Information Architecture**

App

├── Auth (public)

│ ├── Login

│ ├── Register

│ └── Accept Invitation

├── Dashboard (authenticated, no workspace context)

│ ├── My Workspaces (grid/list)

│ └── Create Workspace (modal)

└── Workspace (authenticated + workspace context)

├── Canvas (default view)

├── Task Board

├── Chat

├── Members

├── History Panel (Event Log + Time Travel)

└── Settings

├── Workspace Settings (Lead only)

├── Members & Roles (Lead only)

└── My Profile

**Navigation hierarchy:** Global top-level = Dashboard vs Workspace (switch via workspace switcher dropdown). Within a workspace, left sidebar handles Canvas/Tasks/Members/History/Settings - matches PRD's Sidebar section exactly.

**Parent-child:** Workspace → Nodes → Tasks (1 task always maps to 1 node, never orphaned) → Events (append-only, tied to node/workspace).

**4\. User Flows**

**Login**

Landing → Login form (email/password) → Validate → JWT stored → Redirect to Dashboard. Error → inline field error, no page reload.

**Registration**

Landing → Register form (name/email/password/confirm) → Client validation (Zod) → Submit → Auto-login → Redirect to Dashboard. If registering via invitation link, skip Dashboard → redirect straight to that Workspace's Canvas.

**Dashboard**

Land on Dashboard → See workspace cards (with role badge: Lead/Contributor/Viewer) → Click card → Enter Workspace Canvas. Or "Create Workspace" button → modal (name, optional description) → Create → auto-enter as Lead.

**Workspace Creation**

Dashboard → "+ New Workspace" → Modal: Title input → Submit → Backend creates workspace + assigns creator as Lead → Redirect into new empty Canvas with onboarding empty-state.

**Project/Node Creation (Canvas)**

Canvas open → Floating toolbar → Select tool (Sticky/Text/Shape/Arrow/Draw) → Click/drag on canvas → Node appears in edit mode → Type content → On blur/debounce, text sent for AI classification → Badge appears on node (Action Item/Decision/Question/Reference) → If Action Item, toast "Task created" + task appears in Task Board.

**Task Management**

Sidebar → Tasks → Task Board (Kanban: To Do/In Progress/Done) → Click task → Drawer opens (status, assignee, priority, due date, link to source node) → "Go to Node" button pans canvas to that node.

**Chat**

_Sidebar → Chat → Channel list (default: "General" auto-created per workspace, plus optional Zone-based channels - Frontend/Backend/Database/Testing/Deployment, matching Presence Zones from PRD Feature 11) → Select channel → Message thread loads → Type message → Send (Enter, Shift+Enter for newline) → Message appears instantly for sender (optimistic) → Broadcast via Socket.IO to all workspace members in that channel → Recipients see live message + optional @mention notification._

_Secondary flow -_ **_Node-linked chat reference:_** _From any Canvas node's context menu, "Discuss this node" → opens Chat with a pre-filled reference chip linking back to that Node ID → clicking the chip in chat pans Canvas to that node (mirrors Task's "Go to Node" pattern for consistency, per §14 Design Consistency Rules)._

**Notifications**

Bell icon in navbar → Dropdown list (invitation accepted, task assigned, node locked by Lead, mention) → Click → navigates to relevant node/task.

**Profile**

Navbar avatar → Dropdown → "Profile" → Settings > My Profile tab → Edit name/avatar → Save.

**Settings**

Sidebar → Settings → Tabs: Workspace Info (Lead only) | Members & Roles (Lead only) | My Profile (everyone).

**AI Interactions**

Passive/implicit - no dedicated "AI screen." Classification badge on node IS the AI interaction surface. Clicking badge shows small popover: "Classified as: Action Item - \[Reclassify\] \[Dismiss\]" (manual override allowed only for Lead/Contributor).

**Admin Actions**

Lead-only: Lock Node, Delete Node, Change Member Role, Remove Member, Delete Workspace - all gated behind role check both UI (hide/disable) and backend (RBAC).

**Logout**

Navbar avatar dropdown → Logout → Clear JWT → Redirect to Login.

**5\. Global Layout System**

**Desktop (≥1280px)**

- Sidebar: fixed left, 240px wide, collapsible to 64px (icon-only)
- Top navbar: 64px height, full width minus sidebar, sticky
- Canvas area: fills remaining space, no max-width (infinite canvas needs full viewport)
- Task Board / Settings / History: max-width 1200px, centered, 24px side padding

**Tablet (768-1279px)**

- Sidebar auto-collapses to icon rail (64px), expandable via tap
- Task Board switches from 3-column Kanban to horizontal-scroll columns
- Navbar condenses: workspace switcher becomes icon+dropdown

**Mobile (<768px)**

- Sidebar becomes bottom nav bar OR slide-over drawer (recommend bottom nav: Canvas/Tasks/History/More)
- Canvas: view+pan only in MVP (per assumption), floating "+" FAB for quick sticky note add
- Task Board: single-column stacked cards, filter chips instead of columns

**Grid system:** 12-column grid for Dashboard/Task Board/Settings, 8px base spacing unit.

**Sticky elements:** Navbar, Canvas floating toolbar (bottom-center), Task Board column headers.

**Scrollable regions:** Canvas (pan, not scroll - custom), Sidebar nav list (if items overflow), Task Board columns independently, History Panel timeline.

**Breakpoints:** sm:640px md:768px lg:1024px xl:1280px 2xl:1536px (Tailwind defaults).

**Note:** Chat uses the same WorkspaceLayout shell (sidebar + navbar) as Task Board/Settings. Two-pane layout on desktop: left = channel list (200px), right = active thread. Tablet: channel list collapses to icon rail with unread-dot indicator. Mobile: single-pane, channel list is a separate screen (drill-down navigation, back button to return).

**6\. Design Tokens**

No new tokens needed - reuses existing badge colors for unread-count (accent), existing shadow-sm/radius-md for message bubbles

**Color Palette**

| **Token**         | **Light**            | **Dark** | **Usage**                      |
| ----------------- | -------------------- | -------- | ------------------------------ |
| \--bg-primary     | #FAFAFA              | #0F0F12  | App background                 |
| \--bg-surface     | #FFFFFF              | #1A1A1F  | Cards, panels, sidebar         |
| \--border         | #E4E4E7              | #2A2A31  | Dividers, card borders         |
| \--text-primary   | #18181B              | #F4F4F5  | Headings, body                 |
| \--text-secondary | #71717A              | #A1A1AA  | Meta text, timestamps          |
| \--accent         | #6366F1 (indigo-500) | #818CF8  | Primary actions, active states |
| \--accent-hover   | #4F46E5              | #6366F1  | Button hover                   |
| \--success        | #22C55E              | #4ADE80  | Task done, save confirm        |
| \--warning        | #F59E0B              | #FBBF24  | Locked node indicator          |
| \--danger         | #EF4444              | #F87171  | Delete, errors                 |

**AI Classification Badge Colors** (independent, not brand accent - so they read as "system" tags)

- Action Item → #EF4444 (red-toned, urgency)
- Decision → #22C55E (green, resolved)
- Open Question → #F59E0B (amber, pending)
- Reference → #8B5CF6 (violet, informational)

**Sticky Note Palette** (canvas only): Yellow #FEF3C7, Pink #FCE7F3, Blue #DBEAFE, Green #D1FAE5, Orange #FFEDD5 - user picks on creation.

**Typography Scale:** Inter or Geist font family.

| **Token** | **Size/Weight** | **Usage**        |
| --------- | --------------- | ---------------- |
| text-xs   | 12px/400        | Timestamps, meta |
| text-sm   | 14px/400-500    | Body, inputs     |
| text-base | 16px/400        | Default body     |
| text-lg   | 18px/600        | Card titles      |
| text-xl   | 20px/600        | Section headers  |
| text-2xl  | 24px/700        | Page titles      |
| text-3xl  | 30px/700        | Dashboard hero   |

**Spacing scale:** 4px base (Tailwind default 1=4px through 96=384px). Component internal padding: 12-16px. Section gaps: 24-32px.

**Border radius:** sm=6px (inputs, badges), md=10px (buttons, cards), lg=16px (modals, sticky notes), full (avatars, pills).

**Shadow/Elevation:**

| **Level**   | **Usage**                        |
| ----------- | -------------------------------- |
| shadow-none | Flat canvas nodes (default)      |
| shadow-sm   | Cards, dropdown triggers         |
| shadow-md   | Popovers, floating toolbar       |
| shadow-lg   | Modals, drawers                  |
| shadow-xl   | Dragged node (active drag state) |

**Opacity:** disabled=0.5, hover-overlay=0.08, active-overlay=0.12, skeleton=0.6.

**Animation duration:** micro=120ms, standard=200ms, panel=300ms, page=400ms.

**Transition curve:** ease-out for entrances, ease-in for exits, cubic-bezier(0.4,0,0.2,1) default.

**Icon sizes:** 16px (inline/dense), 20px (default UI), 24px (toolbar/nav).

**Avatar sizes:** 24px (cursor/inline), 32px (lists), 40px (navbar/profile).

**Z-index hierarchy:** canvas=0, sidebar/navbar=10, dropdown=20, toast=30, popover=40, drawer=50, modal=60, live-cursors=70 (always on top of canvas content).

**7\. Component Library**

_(Format: Purpose → Variants/Sizes → States → Notes)_

**Button** - Primary/Secondary/Ghost/Destructive; sm/md/lg. States: default, hover, focus-ring, active, disabled, loading (spinner replaces label). Keyboard: Enter/Space triggers.

**Input / Textarea** - Default, with-icon, with-error. States: default, focus (accent border), error (red border + helper text), disabled. Autosave inputs show subtle "saving..." → "saved" microcopy.

**Checkbox / Radio / Switch** - Standard shadcn primitives; Switch used for role toggles and dark-mode.

**Select / Combobox** - Used for role assignment, task status, assignee picker. Combobox for member search with avatar+name.

**Search** - Global search in navbar (workspace/task/node search), debounced 300ms.

**Modal** - Centered, max-width 480px (confirmations) or 640px (forms like Create Workspace). Backdrop blur, ESC to close, focus-trapped.

**Drawer** - Right-side slide-in, 400px wide (Task Detail, Node Detail, History event detail).

**Sidebar** - Collapsible, icon+label items, active item = accent left-border + bg tint.

**Navbar** - Logo/workspace-switcher (left), search (center), notifications+avatar (right).

**Cards** - Workspace card (Dashboard), Task card (Kanban), Member card (Settings). Consistent: icon/avatar top-left, title, meta row bottom.

**Table** - Members list, Event Log list. Sortable headers, row hover highlight.

**Badges** - AI classification badges (colored per §6), Role badges (Lead/Contributor/Viewer - neutral gray+bold text), Status badges (To Do/In Progress/Done).

**Avatar** - With fallback initials, colored background derived from userId hash, presence ring (green dot) when online.

**Tooltip** - 200ms delay, used on icon-only buttons and toolbar tools.

**Dropdown** - Workspace switcher, avatar menu, node "..." menu.

**Tabs** - Settings page (Workspace/Members/Profile), History Panel (Log view / Replay view).

**Accordion** - FAQ/help sections only if needed; not core.

**Pagination** - Event Log list (if >50 events), Member list.

**Breadcrumb** - Workspace name > Canvas/Tasks/etc, shown in navbar left area.

**Calendar/Date picker** - Task due date field in Task Drawer.

**Toast** - Bottom-right, auto-dismiss 4s, used for: node saved, task created, member invited, error messages, socket reconnected.

**Alert (inline banner)** - Socket disconnected warning, permission-denied banner.

**Skeleton loader** - Dashboard workspace cards, Task Board columns, Canvas initial load.

**Progress** - Invitation token expiry countdown (subtle), file upload (future feature).

**Charts** - Not in MVP scope (no analytics screen in PRD) - flagged as unused for now.

**Empty states** - Canvas (no nodes): center illustration + "Start brainstorming - pick a tool below." Task Board (no tasks): "No action items yet - they'll appear here automatically." Dashboard (no workspaces): "Create your first workspace."

**Error states** - Inline for forms, full-page for 404/workspace-not-found, toast for transient API errors.

**Loading states** - Skeletons for lists/boards; canvas shows centered spinner + "Loading canvas..." only on very first load (subsequent = optimistic).

**Message Bubble** - Variants: own-message (right-aligned, accent-tinted bg) vs others'-message (left-aligned, neutral bg-surface). States: sending (slightly faded, small spinner), sent, failed (red outline), edited (small "(edited)" label - if edit feature added later). Includes avatar, name, timestamp, content, optional node-reference chip.

**Node Reference Chip** - Purpose: link chat messages back to canvas nodes. Variants: active (clickable, accent border) / deleted (grayed, non-clickable). Contains node-type icon + truncated text snippet.

**8\. Screen Specifications**

**8.1 Login**

- **Purpose:** Authenticate existing user. **Users:** all roles.
- **Layout:** Centered card, 400px wide, on plain branded background.
- **Sections:** Logo, heading "Welcome back", email input, password input, "Forgot password" link, Login button, "Don't have an account? Register" link.
- **Primary action:** Login. **Secondary:** Register link.
- **Loading:** Button shows spinner, inputs disabled.
- **Error:** Inline "Invalid email or password" above form, field-level for validation errors.
- **Accessibility:** Form has aria-label, error announced via aria-live.
- **Edge case:** Expired invitation token in URL → redirect through login but preserve token in query, resume invitation flow post-login.

**8.2 Register**

- Same layout pattern as Login. Fields: name, email, password, confirm password. Password strength inline hint. If arriving via invitation link, email field pre-filled + locked, and workspace name shown above form ("You're joining **Acme Team**").

**8.3 Accept Invitation**

- **Purpose:** Bridge screen for invited users. **Layout:** Card showing workspace name, inviter name, assigned role, with "Accept" / "Decline" buttons. If not logged in, buttons redirect to Login/Register with token preserved. **Edge case:** expired token → error state "This invitation has expired. Ask the workspace Lead to resend."

**8.4 Dashboard**

- **Purpose:** Workspace hub. **Layout:** Navbar + grid of workspace cards (3-col desktop, 1-col mobile) + "Create Workspace" card as first tile.
- **Card content:** workspace name, member avatars (stacked, max 4 + "+N"), user's role badge, last activity timestamp.
- **Empty state:** No workspaces → centered illustration + CTA.
- **Primary action:** Click card → enter workspace. **Secondary:** Create Workspace.
- **Loading:** Skeleton cards. **API data expected:** GET /workspace → list with member counts.

**8.5 Workspace Canvas (core screen)**

- **Purpose:** Real-time collaborative infinite canvas. **Users:** all roles (Viewer = read-only interactions).
- **Layout:** Full-bleed canvas below navbar, sidebar on left, floating toolbar bottom-center, floating zoom controls bottom-right, live cursor layer on top.
- **Components:** React Konva stage, Node components (Sticky/Text/Shape/Arrow/Freehand), floating toolbar, live cursor avatars w/ name label, presence zone overlays (subtle dashed zone boundaries with zone label + active-user avatars in corner), node context menu, classification badge popover.
- **Content hierarchy:** Canvas dominant, chrome minimal.
- **Primary actions:** Create node, edit node, drag node.
- **Secondary actions:** Lock node, delete node, comment (future), reclassify.
- **Responsive:** Tablet - toolbar shrinks to icon-only with overflow menu. Mobile - pan/zoom view-only, FAB for quick sticky add (per assumption).
- **Loading state:** Full-canvas skeleton/spinner only on first mount; node updates arrive via socket without blocking.
- **Empty state:** As per §7.
- **Error state:** Socket disconnected → top banner "Reconnecting..." with retry; node save failed → toast + node shows small red dot until retried.
- **Validation:** Text nodes have soft max-length (e.g. 2000 chars) with counter near limit.
- **Accessibility:** Canvas itself is inherently mouse-centric (acceptable limitation, common in whiteboard tools); ensure toolbar and node context menus are fully keyboard operable; provide a non-canvas fallback list view of nodes for screen-reader users (linked from a "List View" toggle) - recommend as accessibility mitigation.
- **Animations:** Node create = scale-in 120ms, node delete = fade+scale-out, classification badge = fade-in after AI response, live cursor = smooth interpolated movement (no snapping).
- **Keyboard shortcuts:** V select tool, S sticky note, T text, R rectangle, A arrow, D draw, Delete remove selected node, Ctrl+Z undo (local), Space+drag pan.
- **Performance:** Virtualize/cull nodes outside viewport for 100+ node support (per TRD perf requirement); debounce text-change AI classification calls (e.g., 800ms after typing stops).
- **Expected API/socket data:** Initial GET /nodes?workspaceId=, then socket events NODE_CREATED/UPDATED/DELETED/MOVED, CURSOR_MOVE, TASK_CREATED.
- **Component hierarchy:** CanvasPage > CanvasStage > NodeLayer(NodeRenderer per type) > CursorLayer > FloatingToolbar > NodeContextMenu.
- **State management:** Redux slice for nodes (normalized by nodeId), separate ephemeral local state for in-progress drag/cursor (not put in Redux for perf - use refs/local state, synced to socket directly).

**8.6 Task Board**

- **Purpose:** View/manage auto-generated tasks. **Layout:** Kanban - To Do / In Progress / Done columns, drag-and-drop via @dnd-kit.
- **Components:** Task cards (title = source node's text snippet, badge=priority, avatar=assignee, mini "linked node" icon).
- **Primary action:** Drag to change status, click to open Task Drawer.
- **Secondary:** Filter by assignee/priority.
- **Empty state:** Per column: "No tasks here."
- **Loading:** Skeleton columns. **Responsive:** Mobile = stacked single column w/ status filter chips.
- **Task Drawer:** status select, assignee combobox, priority select, due date picker, "View Source Node" button (pans Canvas), read-only creation metadata (author, timestamp).

**8.7 Members**

- **Purpose:** Manage workspace membership (Lead-only edit, others view). **Layout:** Table - avatar, name, email, role (editable dropdown for Lead), joined date, remove action.
- **Primary action (Lead):** Change role, remove member, invite new member (button opens modal: email input + role select).
- **Secondary:** Resend invitation (for pending invites row, shown with amber "Pending" badge).

**8.8 History Panel**

- **Purpose:** Event log + Time Travel Replay. **Layout:** Tabs - "Activity Log" (reverse-chron list: actor avatar, action verb, node reference, timestamp) and "Replay" (horizontal timeline scrubber with play/pause, speed control, canvas preview area).
- **Replay behavior:** Scrubbing timeline reconstructs canvas state up to that point by replaying events sequentially (per TRD §16); canvas becomes read-only overlay during replay with a persistent "Exit Replay" button.
- **Empty state:** "No activity yet."
- **Performance:** Paginate/virtualize event list for large logs.

**8.9 Settings**

- **Layout:** Tabbed page - Workspace Info (name, description, delete-workspace danger zone - Lead only), Members & Roles (links to Members screen or embeds it), My Profile (name, avatar upload, password change).
- **Danger zone:** Delete workspace requires typing workspace name to confirm (destructive-action pattern).

**9.0 Chats**

Purpose: Real-time text collaboration scoped to a workspace, reducing need for external tools (Slack) per PRD's Problem Statement.  
Target users: All roles - Lead/Contributor can post; Viewer is read-only (consistent with their permission model elsewhere in the app).

**Layout**:

- **Left pane**: Channel list - "General" + any Zone channels + optional custom channels (Lead can create/rename/archive).
- **Right pane**: Message thread - reverse-chronological scroll, date separators, message grouping (consecutive messages from same author within 2 min collapse under one avatar/name header).
- **Bottom**: composer bar - text input, @mention trigger, node-reference attach icon, send button.

**Components used**: Avatar, Badge (unread count), Tooltip (timestamps on hover), Dropdown (channel options menu), Toast (send failure), Skeleton (thread loading), Empty state, node-reference chip (new small component: rounded pill showing node-type icon + text snippet, clickable).

**Content hierarchy**: Message content primary; author/timestamp secondary (small, muted text-secondary token); node-reference chips visually distinct (bordered pill, accent-colored icon) so they don't blend into plain text.

**Primary actions**: Send message, switch channel.  
**Secondary actions**: @mention a member, attach node reference, react with emoji (optional/nice-to-have - flag as non-MVP if scope needs trimming), create new channel (Lead only).

**Responsive behavior**: Per §9 table - desktop two-pane, tablet icon-rail + thread, mobile drill-down single-pane.

**Loading state**: Skeleton message bubbles (3-4 gray pulsing rows) while initial channel history fetches.

**Empty state**: New channel - "No messages yet. Say hi 👋" centered in thread pane.

**Error state**: Message failed to send → message bubble shows red outline + small retry icon (tap to resend), non-blocking toast "Message failed to send."

**Validation**: Max message length (e.g. 2000 chars) with counter appearing near limit; empty messages can't be sent (send button disabled on empty input).

**Accessibility**: Thread has aria-live="polite" region so new incoming messages are announced to screen readers without interrupting current focus; composer textarea has visible label (sr-only "Message \[Channel Name\]"); mention suggestions dropdown fully keyboard-navigable (arrow keys + Enter).

**Animations**: New message = fade+slight slide-up (120ms, ease-out - matches toast/badge timing from §12); typing indicator = 3-dot pulse animation while another user is composing (received via a lightweight TYPING socket event, not persisted).

**Keyboard shortcuts**: Enter send, Shift+Enter newline, @ triggers mention autocomplete, Esc closes mention/emoji popovers.

**Performance considerations**: Paginate/virtualize message history (load last 50, infinite-scroll upward to fetch older); debounce TYPING socket emission (don't fire on every keystroke - throttle to once per 2s while actively typing).

**Edge cases**: Viewer attempts to type → input is disabled with tooltip "Viewers can't send messages"; member removed from workspace mid-session → their chat access revokes **immediately (socket forces disconnect from that channel room);** deleted node referenced in an old chat message → chip shows muted/grayed state with label "Node deleted" instead of broken link.

**Expected API data**: GET /channels?workspaceId=, GET /messages?channelId=&before= (pagination cursor), POST /messages.

**Component hierarchy**: ChatPage > ChannelList > ChatThread(MessageGroup > MessageBubble > NodeReferenceChip) > Composer(MentionAutocomplete, NodeAttachPicker).

**State management**: Redux slice for messages normalized by channelId → messageId; typing-indicator state kept local/ephemeral (not persisted to Redux store, similar treatment to live cursors in §8.5) since it's transient by nature**.**

**9\. Responsive Design Rules**

| **Aspect**             | **Desktop**                      | **Tablet**                   | **Mobile**                                 |
| ---------------------- | -------------------------------- | ---------------------------- | ------------------------------------------ |
| Sidebar                | Expanded 240px                   | Icon-rail 64px               | Bottom nav bar                             |
| Canvas                 | Full edit                        | Full edit, condensed toolbar | Pan/zoom view + FAB quick-add              |
| Task Board             | 3-column Kanban                  | Horizontal scroll columns    | Stacked single column                      |
| Table (Members/Events) | Full table                       | Full table, smaller font     | Card-per-row layout                        |
| Typography             | Base scale                       | Base scale                   | \-1 step on headings                       |
| Touch targets          | N/A                              | 40px min                     | 44px min                                   |
| Gestures               | Mouse hover/drag                 | Touch + hover fallback       | Pinch-zoom, swipe between sidebar sections |
| Chat                   | Two-pane (channel list + thread) | Icon-rail + thread           | Single-pane drill-down                     |

**10\. UX Rules**

- **Confirmation dialogs:** Delete node, delete workspace, remove member, decline invitation.
- **Undo:** Local undo stack (Ctrl+Z) for canvas actions within session; no server-side undo (event log is append-only by design - "undo" = create a new corrective event, never rewrite history).
- **Delete behavior:** Soft visual removal + toast "Node deleted \[Undo\]" (5s window) before hard delete event is finalized.
- **Autosave:** All node edits autosave (debounced), no manual save button on Canvas. Settings forms use explicit Save button.
- **Notifications:** Toast for own actions' confirmations; bell-dropdown for async events (invitation accepted, task assigned to you). @mentions in Chat trigger the same bell-dropdown notification pattern as task-assignment (consistency with existing rule).
- **Inline/form validation:** Real-time via Zod schemas, error shown on blur, not on every keystroke.
- **Session timeout:** JWT expiry → silent refresh attempt; on failure, redirect to Login with toast "Session expired, please log in again."
- **Permission handling:** Viewer sees disabled/hidden controls (not error-on-click); Contributor sees locked nodes as visually dimmed with lock icon, click shows tooltip "Locked by Lead."
- **Offline/connection loss:** Banner "You're offline - changes will sync when reconnected", local optimistic queue, auto-retry with exponential backoff. Chat composer queues unsent messages locally and auto-sends on reconnect (same optimistic-queue pattern as Canvas node edits.
- **Retry behavior:** Failed API calls retry 3x silently before surfacing error toast.
- **Success/failure feedback:** Always toast-based, never blocking alert() dialogs (except destructive confirmations).

**11\. Accessibility**

- **WCAG target:** AA.
- **Keyboard navigation:** All modals/drawers/dropdowns/menus fully operable via Tab/Shift+Tab/Enter/Esc/Arrow keys. Canvas has keyboard shortcut layer (§8.5) plus List View fallback.
- **ARIA:** role="dialog" for modals/drawers, aria-live="polite" for toasts and classification badge updates, aria-pressed for toolbar tool toggle states.
- **Screen reader support:** Node List View announces node type, author, classification.
- **Color contrast:** All text/background pairs ≥4.5:1; badges use both color AND text label (never color-only).
- **Focus indicators:** 2px accent-colored ring, never removed via outline: none without replacement.
- **Touch targets:** 44px minimum on mobile.
- **Reduced motion:** Respect prefers-reduced-motion - disable cursor-interpolation animation and node scale-in/out, replace with instant/fade-only.
- **Form accessibility:** Labels always visible (no placeholder-only labels), error messages tied via aria-describedby.

**12\. Animation System**

| **Element**                 | **Animation**                             | **Duration** | **Easing**  |
| --------------------------- | ----------------------------------------- | ------------ | ----------- |
| Page/route transition       | Fade                                      | 200ms        | ease-out    |
| Sidebar collapse/expand     | Width transition                          | 250ms        | ease-in-out |
| Modal open                  | Fade+scale from 0.96                      | 200ms        | ease-out    |
| Modal close                 | Fade+scale to 0.96                        | 150ms        | ease-in     |
| Drawer slide-in             | Translate-X                               | 300ms        | ease-out    |
| Dropdown/Popover            | Fade+translateY(4px)                      | 120ms        | ease-out    |
| Button hover                | Background color                          | 120ms        | ease-out    |
| Node create (canvas)        | Scale 0.8→1 + fade                        | 150ms        | ease-out    |
| Node delete (canvas)        | Scale 1→0.9 + fade                        | 150ms        | ease-in     |
| Live cursor movement        | Position interpolation                    | continuous   | linear      |
| Classification badge appear | Fade+slight bounce                        | 200ms        | ease-out    |
| Toast enter/exit            | Slide from bottom + fade                  | 200ms        | ease-out    |
| Skeleton shimmer            | Opacity pulse                             | 1500ms loop  | ease-in-out |
| Drag-and-drop (task/node)   | Elevation lift (shadow-xl) + slight scale | 100ms        | ease-out    |

**Rule - when NOT to animate:** Never animate during active drag (jank risk), never animate socket-driven bulk updates (e.g., initial canvas load of 100 nodes - render instantly, only animate incremental single-node changes after initial load), respect reduced-motion always.

**13\. Dribbble Inspiration Mapping**

**Reference: ClickUp Whiteboards (Dribbble #18048306)**

- **Adopt:** Soft, rounded sticky-note cards with subtle drop shadow; playful pastel palette confined to canvas objects only; floating bottom-center toolbar with grouped icon clusters; generous canvas whitespace/breathing room; friendly rounded iconography.
- **Do NOT copy:** ClickUp's specific brand purple as our UI chrome accent (we use our own indigo); their exact toolbar icon set/order; any literal layout composition or marketing illustration style.
- **Layout inspiration:** Bottom-floating toolbar placement (vs top toolbar) frees vertical canvas space - adopted for LIGMA.
- **Component inspiration:** Rounded sticky-note shadow treatment → mapped to our shadow-sm + radius-lg token combo.
- **Spacing inspiration:** Generous padding inside sticky notes (16px+) for readability - adopted.
- **Color inspiration:** Multi-pastel sticky palette confirmed, but LIGMA restricts UI chrome to neutral+single-accent (ClickUp's UI is more colorful throughout; we intentionally tone that down for our "calm control room" vision in §1).
- **Animation inspiration:** Smooth micro-interactions on card creation - reflected in our node scale-in animation.
- **Navigation inspiration:** Left icon sidebar pattern - consistent with our IA.

**Merge into original language:** LIGMA takes ClickUp's playful, tactile canvas object treatment (soft shadows, pastel notes, bottom toolbar) but wraps it in a calmer, more neutral SaaS chrome (inspired more by Linear/Notion restraint) so that the AI-classification signal (colored badges) remains the most visually "loud" element in the interface - reinforcing that AI intelligence is the product's differentiator, not decoration.

**14\. Design Consistency Rules**

Node-reference chips in Chat use the exact same visual treatment (icon+snippet+accent border) as the "linked node" indicator on Task cards- one consistent "node reference" pattern reused across Tasks and Chat, not two different designs for the same concept.

- **Buttons:** Only one primary (filled, accent) button visible per view/section at a time; everything else Secondary/Ghost.
- **Spacing:** All section gaps multiples of 8px; never mix arbitrary px values.
- **Typography:** Never more than 3 font sizes visible in one screen section.
- **Shadows:** Canvas nodes = flat by default, shadow only appears on hover/drag (signals interactivity); chrome elements (cards, popovers) = static shadow per §6 table.
- **Radius:** Never mix radius sizes within the same component family (all buttons = md, all cards = md, all sticky/modals = lg).
- **Icons:** Lucide only, consistent stroke-width (1.5-2px), never mix filled+outline icon styles.
- **Images:** Avatars always circular with fallback initials; no decorative stock imagery in-app (only in marketing/empty-state illustrations).
- **Card behavior:** All cards have consistent hover state (subtle border-color shift, no shadow pop on non-canvas cards).
- **Modal behavior:** Always dismissible via Esc + backdrop click, except destructive-confirmation modals which require explicit button click.
- **Navigation:** Active nav item always indicated via accent left-border + icon color, never text-only.
- **Animation:** Reuse the exact duration/easing tokens from §12 - no ad-hoc animation values anywhere in codebase.

**15\. Frontend Implementation Rules**

- Build every repeated UI unit (Node, TaskCard, MemberRow, Badge) as a standalone reusable component - zero duplicated JSX for these patterns.
- Prefer composition (&lt;Card&gt;&lt;CardHeader/&gt;&lt;CardBody/&gt;&lt;/Card&gt;) over monolithic components.
- Tailwind utility classes only - no inline style={{}} except for truly dynamic canvas positioning (transform: translate(x,y) is acceptable as it's computed, not styling).
- Semantic HTML (&lt;nav&gt;, &lt;main&gt;, &lt;aside&gt;, &lt;button&gt; not &lt;div onClick&gt;).
- Responsive-first: build mobile layout logic alongside desktop, not retrofitted.
- Folder structure exactly per TRD §6 (components/pages/hooks/redux/services/sockets/utils/layouts/routes/assets).
- Reusable layout wrappers: DashboardLayout, WorkspaceLayout (sidebar+navbar shell).
- Reusable hooks: useSocket, useNodePermissions, useDebouncedClassify, useWorkspaceRole.
- Production-quality naming (NodeContextMenu, not Menu2).
- No hardcoded content - all copy through constants/i18n-ready strings; all data via props/API, never hardcoded arrays of "sample tasks" left in production code.
- Use clear placeholder states (skeletons, empty states from §7/§8) wherever backend data is pending.

**16\. AI Code Generation Constraints**

The code-generation AI must produce output that is:

- Production-ready, modular, and responsive per all screen specs in §8.
- Accessible per §11 (ARIA, keyboard nav, contrast) - non-negotiable, not optional polish.
- Built in React with TypeScript (even though PRD stack says JS/Vite - recommend TypeScript for RBAC/type-safety around node permissions; flag to user as suggested upgrade, not forced).
- Styled purely with Tailwind CSS, using only the design tokens defined in §6 (extend tailwind.config with these values - no arbitrary magic numbers).
- Routed via React Router matching the IA in §3.
- Dark mode structured via CSS variables from §6 even if toggle UI ships later.
- Every component from §7 implemented with all listed states (hover/focus/active/disabled/loading/error/success) - no partial implementations.
- Every screen from §8 implemented with loading/empty/error states - none skipped.
- Socket-driven real-time updates handled via the useSocket hook pattern, never polling.
- Avoid unnecessary complexity - no premature abstraction beyond what's specified; keep components reusable but not over-engineered.
- Suitable for a real-world SaaS application - clean, maintainable, following the folder structure and naming conventions above.