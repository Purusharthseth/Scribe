// setupSocket.js
import { Server } from "socket.io";
import { vaults } from "../db/schema.js";
import { and, eq, or, ne } from "drizzle-orm";
import { clerkClient, verifyToken } from "@clerk/express"; // <-- clerkClient gives us user profiles
import db from "../db/drizzle.js";
function userPayLoad(u) {

  const fullName = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.username || "Unknown";

  return {
    id: u.id,
    username: u.username || null,
    fullName,
    avatarUrl: u.imageUrl || null,
  };
}

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const { token, vaultId, shareToken } = socket.handshake.auth || {};
      if (!token || !vaultId) return next(new Error("Missing authentication data"));

      const claims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const userId = claims?.sub;
      if (!userId) return next(new Error("Invalid token"));

      const whereClause = shareToken
        ? or(
            and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
            and(
              eq(vaults.id, vaultId),
              eq(vaults.share_token, shareToken),
              ne(vaults.share_mode, "private")
            )
          )
        : and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));

      const [vault] = await db.select().from(vaults).where(whereClause);
      if (!vault) return next(new Error("Access denied to vault"));

      const clerkUser = await clerkClient.users.getUser(userId);
      const publicUser = userPayLoad(clerkUser);

      socket.data.userId = userId;
      socket.data.user = publicUser; 
      socket.data.vaultId = vaultId;
      socket.data.isOwner = vault.owner_id === userId;
      socket.data.shareMode = vault.share_mode;
      socket.data.canEdit = socket.data.isOwner || vault.share_mode === "edit";

      next();
    } catch (err) {
      console.error("Socket authentication failed:", err);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const vaultId = socket.data.vaultId;
    const room = `vault:${vaultId}`;

    socket.join(room);

   
    socket.to(room).emit("user:joined", {
      user: socket.data.user.fullName,
      isOwner: socket.data.isOwner,
      shareMode: socket.data.shareMode,
    });

    socket.on("disconnect", (reason) => {
      socket.to(room).emit("user:left", {
        user: socket.data.user.fullName,
        reason,
      });
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.data.user?.id}:`, error);
    });
  });

  return io;
};

export default setupSocket;