import http from "http";
import { createSocketServer } from "./sockets/index.js";
import { env } from "./config/env.js";
import { connectToDatabase } from "./config/db.js";
import app from "./app.js";

async function bootstrap() {
  try {
    await connectToDatabase();
    console.log("Database connected");

    const server = http.createServer(app);

    const io = createSocketServer(server);
    console.log("Socket.IO server initialized");

    server.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    return { server, io };
  } catch (err) {
    console.error("Failed to bootstrap server:", err);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

bootstrap();
