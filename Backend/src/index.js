import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import setupSocket from './socket/socket.js';
import { setSocketIO as setFileSocketIO } from './controllers/file.controller.js';
import { setSocketIO as setFolderSocketIO } from './controllers/folder.controller.js';

dotenv.config();

const PORT = process.env.PORT || 8001;

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = setupSocket(server);

// Make io accessible in routes (optional)
app.set('io', io);

// Set socket instance in controllers
setFileSocketIO(io);
setFolderSocketIO(io);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Socket.IO server initialized`);
});