import { Server } from "http";
import * as jwt from "jsonwebtoken";
import { Server as SocketioServer } from "socket.io";

import config from "../config";

export const globalSocket = {};

export default (server: Server) => {
  const io = new SocketioServer(server);

  io.use((socket, next) => {
    const token = socket.handshake.auth["token"];
    if (!token) {
      return next(new Error("no-token"));
    }

    try {
      jwt.verify(token, config.secret);
      return next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new Error("invalid-jwt"));
      } else {
        return next(new Error("invalid-auth"));
      }
    }
  }).on("connection", (socket) => {
    const token = socket.handshake.query.token;
    const payload: any = jwt.decode(token);

    // tslint:disable-next-line: no-console
    console.log(`a user connected ${payload.username}(${payload.id})`);

    globalSocket[payload.id] = socket;

    socket.on("disconnect", () => {
      delete globalSocket[payload.id];
      // tslint:disable-next-line: no-console
      console.log(`User disconnected ${payload.username}(${payload.id})`);
    });
  });
};
