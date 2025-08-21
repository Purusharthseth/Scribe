# SCRIBE

_Transform Ideas into Seamless Collaborative Masterpieces_

---

## 🚀 Built with the tools and technologies:

<p align="center">
  <img src="https://img.shields.io/badge/Express-black?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white" />
  <img src="https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/CodeMirror-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" />
  <img src="https://img.shields.io/badge/.ENV-ecd53f?style=for-the-badge&logo=dotenv&logoColor=black" />
  <br/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-671ddf?style=for-the-badge" />
</p>
## Features

- **Live collaboration** (CRDT / Yjs) — conflict‑free merges across clients
- **Directory-based vault system** — organize notes in nested folders for better workflow
- **Cursor awareness** — named cursors and selections per user
- **Leader-based server architecture** — server is the leader which handles, reducing DB load
- **Vaults & sharing** — owner / edit / view modes enforced server‑side
- **Split / Editor / Preview** views with draggable divider
- **Markdown preview** with task‑list checkbox toggles (preview updates the doc)
- **Leader-based persistence** — server acts as the leader, batching & debouncing saves to DB (via Drizzle) to reduce load  
- **Clerk** authentication & token‑guarded WebSocket connection
- **Per‑user undo/redo** — powered by `Y.UndoManager`
  
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