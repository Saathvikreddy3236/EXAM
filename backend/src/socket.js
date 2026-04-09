import { Server } from "socket.io";
import { verifyToken } from "./utils/jwt.js";

let io;

function getToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const authorization = socket.handshake.headers?.authorization || "";
  const [scheme, token] = authorization.split(" ");
  return scheme === "Bearer" ? token : null;
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = getToken(socket);
      if (!token) {
        return next(new Error("Authentication required."));
      }

      const payload = verifyToken(token);
      socket.user = payload;
      next();
    } catch (_error) {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    const username = socket.user?.username;
    if (username) {
      socket.join(`user:${username}`);
    }
  });

  return io;
}

export function emitToUser(username, eventName, payload) {
  if (!io || !username) {
    return;
  }

  io.to(`user:${username}`).emit(eventName, payload);
}
