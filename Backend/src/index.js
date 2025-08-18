import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import setupSocket from './socket/socket.js';
import { setSocketIO as setFileSocketIO } from './controllers/file.controller.js';
import { setSocketIO as setFolderSocketIO } from './controllers/folder.controller.js';

dotenv.config();

const PORT = process.env.PORT || 8001;
const server = createServer(app);
const io = setupSocket(server);

app.set('io', io);

setFileSocketIO(io);
setFolderSocketIO(io);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Socket.IO server initialized`);
});