<div align="center">
  <h1 style="margin:0;font-size:3rem;letter-spacing:-0.02em;">SCRIBE</h1>
  <p style="margin:8px 0 0;font-size:1.05rem;opacity:0.85;">
    Collaborative, real‑time Markdown note taking app with CRDT‑backed syncing and a directory‑based vault system
  </p>
</div>

## Features

-	**Real-time collaboration** powered by CRDTs (Yjs) for seamless, conflict-free editing
-	**Presence & cursor awareness** : see exactly where collaborators are and what they’re selecting
-	**Leader-driven server model**: a single source of truth that minimizes DB load and ensures consistency
-	**Granular sharing controls** : owner, editor, and viewer modes, enforced server-side
-	**Flexible workspace** with split, editor, and live preview views, plus draggable dividers
-	**Efficient persistence** : leader batches & debounces DB saves via Drizzle, keeping writes minimal
-	**Per-user history**: independent undo/redo stacks backed by Y.UndoManager
-	**Directory-style organization** with nested folders for structured, distraction-free note management
-	**Secure authentication** with Clerk and token-guarded WebSocket connections
-	**Rich Markdown preview**with live task-lists (checkboxes update the source doc)
  
___
## Tech Stack

**Client**
- React+Vite
- CodeMirror 6 (y-codemirror.next, custom theme)
- Yjs
- Clerk (front‑end auth)
- Socket.IO (transport for y‑socket.io)
- Tailwind/Radix UI (layout & widgets)
- markdown-it
- Zustand

**Server**
- Node.js+Express
- Socket.IO
- y-socket.io 
- Clerk
- Drizzle (ORM)
- PostgreSQL
___

## ScreenShots

#### Example collab file view
![File](./public/File.png)

#### Example Vault view
![Vault](./public/Vault.png)

#### Active Users  view
![Active Users](./public/ActiveUsers.png)