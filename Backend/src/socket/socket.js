import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";           
import { vaults, files } from "../db/schema.js";
import { and, eq, or, ne } from "drizzle-orm";
import { clerkClient, verifyToken } from "@clerk/express";
import db from "../db/drizzle.js";
import { createDocSaver } from "./y-debounce.js"

function userPayLoad(u) {
  return { username: u.username, fullName: u.fullName || "Unknown", avatarUrl: u.imageUrl || null };
}

function deleteFromSet(set, username) {
  const userToDelete = [...set].find(user => user.username === username);
  if (userToDelete) set.delete(userToDelete);
}


async function loadFileText(fileId) { 
  try {
    const rows = await db
      .select({ content: files.content })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);
    
    return rows[0]?.content || "";
  } catch (error) {
    console.error(`[YJS] Failed to load file ${fileId}:`, error);
    return "";
  }
}

async function saveFileText(fileId, text) { 
  try {
    await db
      .update(files)
      .set({ 
        content: text, 
        updated_at: new Date() 
      })
      .where(eq(files.id, fileId));
    
    console.log(`[YJS] Saved file ${fileId} (${text.length} chars)`);
  } catch (error) {
    console.error(`[YJS] Failed to save file ${fileId}:`, error);
  }
}

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  const vaultUserCounts = new Map();
  const vaultUniqueUsers = new Map();

  io.use(async (socket, next) => {
    try {
      const { token, vaultId, shareToken } = socket.handshake.auth || {};
      if (!token || !vaultId) return next(new Error("Missing authentication data"));

      const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      const userId = claims?.sub;
      if (!userId) return next(new Error("Invalid token"));

      const whereClause = shareToken
        ? or(
            and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
            and(eq(vaults.id, vaultId), eq(vaults.share_token, shareToken), ne(vaults.share_mode, "private"))
          )
        : and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));

      const [vault] = await db.select().from(vaults).where(whereClause);
      if (!vault) return next(new Error("Access denied to vault"));

      const clerkUser = await clerkClient.users.getUser(userId);
      const publicUser = userPayLoad(clerkUser);
      publicUser.isOwner = vault.owner_id === userId;

      socket.data.userId = userId;
      socket.data.user = publicUser;
      socket.data.vaultId = vaultId;
      socket.data.shareMode = vault.share_mode;
      socket.data.canEdit = publicUser.isOwner || vault.share_mode === "edit";

      next();
    } catch (err) {
      console.error("Socket authentication failed:", err);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const vaultId = socket.data.vaultId;
    const username = socket.data.user.username;
    const user = socket.data.user;
    const room = `vault:${vaultId}`;

    socket.join(room);

    if (!vaultUserCounts.has(vaultId)) {
      vaultUserCounts.set(vaultId, new Map());
      vaultUniqueUsers.set(vaultId, new Set());
    }

    const userCounts = vaultUserCounts.get(vaultId);
    const uniqueUsers = vaultUniqueUsers.get(vaultId);

    const currCnt = userCounts.get(username) || 0;
    const isFirstConnection = currCnt === 0;

    userCounts.set(username, currCnt + 1);

    if (isFirstConnection) {
      uniqueUsers.add(user);
      socket.to(room).emit("user:joined", { user });
    }
    socket.emit("user:list", { users: Array.from(uniqueUsers) });

    socket.on("disconnect", () => {
      setTimeout(() => {
        if (socket.connected) return; // Skip if reconnected

        const userCounts = vaultUserCounts.get(vaultId);
        const uniqueUsers = vaultUniqueUsers.get(vaultId);

        if (userCounts && uniqueUsers) {
          const currentCount = userCounts.get(username) || 0;
          const newCount = Math.max(0, currentCount - 1);

          if (newCount === 0) {
            userCounts.delete(username);
            deleteFromSet(uniqueUsers, username);
            socket.to(room).emit("user:left", { user: { username } });
          } else {
            userCounts.set(username, newCount);
          }

          if (userCounts.size === 0) {
            vaultUserCounts.delete(vaultId);
            vaultUniqueUsers.delete(vaultId);
          }
        }
      }, 5000); // 5-second grace period
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.data.user?.id}:`, error);
      socket.disconnect(true);
    });
  });

  const scheduleSave = createDocSaver();

  // Create YSocketIO on top of your existing io
  const ysocketio = new YSocketIO(io, {
    authenticate: async (handshake) => {
      const auth = handshake.auth || {};
      const { token, vaultId, shareToken, fileId } = auth;
      if (!token || !vaultId || !fileId) return false;

      try {
        const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
        const userId = claims?.sub;
        if (!userId) return false;

        const whereClause = shareToken
          ? or(
              and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
              and(eq(vaults.id, vaultId), eq(vaults.share_token, shareToken), ne(vaults.share_mode, "private"))
            )
          : and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));

        const [vault] = await db.select().from(vaults).where(whereClause);
        if (!vault) return false;

        const isOwner = vault.owner_id === userId;
        const canEdit = isOwner || vault.share_mode === "edit";
        handshake.auth.__canEdit = canEdit;
        handshake.auth.__vaultId = vaultId;
        handshake.auth.__fileId = fileId;

        return true;
      } catch {
        return false;
      }
    },

    gcEnabled: true,
  });

  ysocketio.initialize();

  ysocketio.on("document-loaded", async (doc) => {
    //doc main bas vohi doc aayega joh sab share kr re hoge uss file-id pe
    const room = doc.name || ""; 
    const match = room.match(/^file-(.+)$/);
    const fileId = match?.[1];
    if (!fileId) return;

    const text = await loadFileText(fileId);
    if (text) {
      const ytext = doc.getText("codemirror");
      if (ytext.length === 0) ytext.insert(0, text);
    }
  });

  ysocketio.on("document-update", async (doc) => {
    const room = doc.name || "";
    const match = room.match(/^file-(.+)$/);
    const fileId = match?.[1];
    if (!fileId) return;

    scheduleSave(room, async () => {
      const ytext = doc.getText("codemirror");
      await saveFileText(fileId, ytext.toString());
    });
  });

  ysocketio.on("all-document-connections-closed", async (doc) => {
  try {
    const room = doc.name || "";
    const match = room.match(/^file-(.+)$/);
    const fileId = match?.[1];
    if (!fileId) return;

    const ytext = doc.getText("codemirror");
    await saveFileText(fileId, ytext.toString());

    ysocketio.documents.delete(doc.name);

    console.log(`[Yjs] All users left ${room}. Saved and deleted from memory.`);
  } catch (err) {
    console.error("Error cleaning up doc:", err);
  }
});

  const yjsNs = io.of(/^\/yjs\|.*/);
  yjsNs.use((socket, next) => {
    const { __canEdit } = socket.handshake.auth || {};
    socket.data.canEdit = __canEdit;
    next();
  });
  
  yjsNs.on("connection", (socket) => {
    if (!socket.data.canEdit) {
      socket.use((packet, next) => {
        const event = packet?.[0];
        if (event !== "awareness") {
          socket.emit("error", { message: "Tried to edit document but you have view-only access." });
          return; 
        }
        next();
      });
    }
  });

  return io;
};

export default setupSocket;