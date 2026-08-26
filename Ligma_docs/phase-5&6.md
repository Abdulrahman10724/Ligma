# Phase 5 & 6 — Workspace Collaboration & Infinite Canvas Foundation

## Summary

Implemented the Workspace Collaboration Foundation and the Infinite Canvas for LIGMA. Workspace members can now be listed, have their roles changed, and be removed. Pending invitations are surfaced inside the Members page. An infinite React Konva canvas with pan, zoom, a background grid, and full node CRUD (Sticky, Text, Rectangle, Circle, Arrow) is now live.

---

## Files Created

### Backend
- `Ligma_backend/src/models/canvas-node.model.js`
- `Ligma_backend/src/services/member.service.js`
- `Ligma_backend/src/services/canvas-node.service.js`
- `Ligma_backend/src/validation/member.validation.js`
- `Ligma_backend/src/validation/canvas-node.validation.js`
- `Ligma_backend/src/controllers/member.controller.js`
- `Ligma_backend/src/controllers/canvas-node.controller.js`
- `Ligma_backend/src/routes/member.routes.js`
- `Ligma_backend/src/routes/canvas-node.routes.js`

### Frontend
- `Ligma_frontend/Frontend/src/services/member.service.js`
- `Ligma_frontend/Frontend/src/services/canvas-node.service.js`
- `Ligma_frontend/Frontend/src/redux/memberSlice.js`
- `Ligma_frontend/Frontend/src/redux/canvasSlice.js`
- `Ligma_frontend/Frontend/src/components/canvas/CanvasToolbar.jsx`
- `Ligma_frontend/Frontend/src/components/canvas/nodes/StickyNode.jsx`
- `Ligma_frontend/Frontend/src/components/canvas/nodes/TextNode.jsx`
- `Ligma_frontend/Frontend/src/components/canvas/nodes/ShapeNode.jsx`
- `Ligma_frontend/Frontend/src/components/canvas/nodes/ArrowNode.jsx`

---

## Files Modified

### Backend
- `Ligma_backend/index.js` — registered member and canvas-node routes
- `Ligma_backend/src/models/workspace-member.model.js` — added `findMembersByWorkspace`, `findMembershipsForUser`, `updateMemberRole`, `removeMember`
- `Ligma_backend/src/models/workspace.model.js` — added `findWorkspacesByIds`

### Frontend
- `Ligma_frontend/Frontend/src/redux/store.js` — wired `memberReducer` and `canvasReducer` (removed placeholder)
- `Ligma_frontend/Frontend/src/pages/MembersPage.jsx` — full implementation replacing stub
- `Ligma_frontend/Frontend/src/pages/CanvasPage.jsx` — full implementation replacing stub

---

## APIs Added

### Members
| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| `GET` | `/api/v1/workspaces/:workspaceId/members` | JWT | Any member or owner |
| `GET` | `/api/v1/workspaces/:workspaceId/members/invitations/pending` | JWT | Lead only |
| `PATCH` | `/api/v1/workspaces/:workspaceId/members/:userId/role` | JWT | Lead only |
| `DELETE` | `/api/v1/workspaces/:workspaceId/members/:userId` | JWT | Lead only |

### Canvas Nodes
| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| `GET` | `/api/v1/workspaces/:workspaceId/canvas/nodes` | JWT | Any member or owner |
| `POST` | `/api/v1/workspaces/:workspaceId/canvas/nodes` | JWT | Any member or owner |
| `PATCH` | `/api/v1/workspaces/:workspaceId/canvas/nodes/:nodeId` | JWT | Any member or owner |
| `DELETE` | `/api/v1/workspaces/:workspaceId/canvas/nodes/:nodeId` | JWT | Any member or owner |

---

## Database Changes

### `workspaceMembers` collection (extended)
- New query functions: `findMembersByWorkspace`, `findMembershipsForUser`, `updateMemberRole`, `removeMember`
- Existing unique index on `{ workspaceId, userId }` still enforced

### `canvasNodes` collection (new)
| Field | Type | Description |
|-------|------|-------------|
| `workspaceId` | ObjectId | Parent workspace |
| `createdById` | ObjectId | Author user |
| `type` | String | `sticky`, `text`, `rectangle`, `circle`, `arrow` |
| `x` | Number | Canvas X position |
| `y` | Number | Canvas Y position |
| `data` | Object | Type-specific payload (text, color, size, etc.) |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

Indexes: `{ workspaceId, createdAt }`, `{ workspaceId, type }`

---

## Redux Changes

### `memberSlice` (new)
- State: `{ list, pendingInvitations, loading, saving, error }`
- Thunks: `fetchWorkspaceMembers`, `changeMemberRole`, `removeMember`, `fetchPendingInvitations`
- Actions: `clearMembers`
- Optimistic updates: role changes and removals applied immediately to local list

### `canvasSlice` (new, replaces placeholder)
- State: `{ nodes: { [id]: node }, loading, saving, error }` — normalized map for O(1) access
- Thunks: `fetchCanvasNodes`, `createCanvasNode`, `updateCanvasNode`, `deleteCanvasNode`
- Actions: `updateNodePositionLocally` (optimistic drag-and-drop), `clearCanvas`

---

## Components Added

| Component | Description |
|-----------|-------------|
| `CanvasToolbar` | Floating pill toolbar at bottom-center; 6 tools (select, sticky, text, rectangle, circle, arrow) |
| `StickyNode` | Konva sticky note with 5 color variants, shadow, and text display |
| `TextNode` | Konva text block with configurable size and color |
| `ShapeNode` | Handles both `rectangle` and `circle` types with fill/stroke and optional label |
| `ArrowNode` | Directed arrow with configurable dx/dy vector and optional label |

---

## RBAC Implementation

- Workspace **Owner** → always treated as Lead; cannot be removed or have role changed
- **Lead** members → can list members, change any member's role, remove any member
- **Contributor / Viewer** → can list members and read/write canvas nodes; cannot manage members

The `assertWorkspaceLead` and `assertWorkspaceAccess` helpers in `member.service.js` enforce these rules on the backend for every mutation.

---

## Canvas Features

- **Infinite pan** — Stage draggable when Select tool is active
- **Smooth zoom** — Mouse-wheel zoom with origin tracking (zoom to cursor)
- **Background grid** — Dynamic line grid that tiles correctly at any scale/offset
- **Viewport state** — `{ x, y, scale }` managed in component state
- **Click-to-place** — Clicking canvas with a tool active creates a node at that world position; reverts to Select afterwards
- **Node dragging** — Optimistic local update via `updateNodePositionLocally`; then syncs to backend
- **Selection** — Click a node to select it; click canvas to deselect
- **Delete** — Selected node surfaces a Delete button in the top-right; confirmed via Redux thunk
- **Zoom indicator** — Live `%` indicator bottom-right
- **Empty state** — Hint message when no nodes exist

---

## Validation Added

### Backend
- Member endpoints: Zod schemas for params (`workspaceId`, `userId`) and role enum
- Canvas node endpoints: Zod schemas for type enum, numeric x/y, partial update guard
- RBAC assertions in service layer on every mutation

### Frontend
- Loading spinners and disabled states during async operations
- Toast notifications (via `sonner`) for success and error feedback
- Confirm-remove modal before removing members
- Empty state UI for empty member lists

---

## Testing Summary

- **Frontend production build**: ✅ Passed — 2282 modules transformed, 0 errors
- **Backend module load**: ✅ Server started and loaded all new modules; only stopped at MongoDB connection (expected — no live DB in this environment)
- **API route registration**: ✅ Verified in `index.js`
- **Redux store wiring**: ✅ All slices registered and typed correctly
- **Build artifact**: `dist/assets/index-*.js` — 984 kB (304 kB gzip)

---

## Known Limitations

- Full API runtime verification requires a live MongoDB instance
- Canvas node text is not inline-editable in this phase (editing through `data.text` field update only)
- WebSocket live-collaboration and presence are deferred to a later phase
- AI classification of canvas nodes is deferred to a later phase

---

## Phase Completion Checklist

### Workspace Collaboration
- [x] Member listing with owner + member rows
- [x] Role management (Lead / Contributor / Viewer)
- [x] Lead-only RBAC enforcement (backend + frontend)
- [x] Owner protection (cannot remove or change owner role)
- [x] Remove member (with confirm dialog)
- [x] Pending invitations surfaced for Leads
- [x] Backend validation (Zod)
- [x] Loading, empty, and error states
- [x] Toast feedback

### Infinite Canvas
- [x] React Konva stage with infinite pan and zoom
- [x] Background grid aligned to viewport
- [x] Sticky Note nodes
- [x] Text nodes
- [x] Rectangle nodes
- [x] Circle nodes
- [x] Arrow nodes
- [x] Click-to-place node creation
- [x] Node dragging with optimistic updates
- [x] Node selection
- [x] Node deletion
- [x] Toolbar with tool switching
- [x] Zoom indicator

### Backend CRUD
- [x] `GET /canvas/nodes`
- [x] `POST /canvas/nodes`
- [x] `PATCH /canvas/nodes/:nodeId`
- [x] `DELETE /canvas/nodes/:nodeId`

### Integration
- [x] Redux memberSlice wired
- [x] Redux canvasSlice wired (normalized map)
- [x] Store registered
- [x] Frontend services connected to APIs
- [x] No duplicate or dead code
- [x] No unnecessary abstractions
- [x] Production build verified ✅
