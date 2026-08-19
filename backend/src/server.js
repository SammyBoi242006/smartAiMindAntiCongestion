require("dotenv").config();

const http = require("http");
const cors = require("cors");
const express = require("express");
const { Server } = require("socket.io");
const { startSimulator } = require("./services/simulator");
const apiRoutes = require("./routes/apiRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

server.listen(port, () => {
  console.log(`Transit intelligence API listening on http://localhost:${port}`);
  startSimulator();
});

module.exports = { app, server, io };
