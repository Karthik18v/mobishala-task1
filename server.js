const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");

const { API_KEY, APP_SECRET, PORT,  MONGO_URI } = process.env;
const HMS_API_BASE = "https://api.100ms.live/v2";


const app = express();
app.use(cors());
const wss = new WebSocket.Server({ noServer: true });

app.use(express.json());

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const RoomSchema = new mongoose.Schema({
  roomId: String,
  name: String,
  createdAt: Date,
  participantCount: { type: Number, default: 0 },
});
const ParticipantSchema = new mongoose.Schema({
  userId: String,
  roomId: String,
  token: String,
  joinedAt: Date,
  leftAt: Date,
});

const Room = mongoose.model("Room", RoomSchema);
const Participant = mongoose.model("Participant", ParticipantSchema);





app.post("/rooms", async (req, res) => {
  const { roomName } = req.body;
  try {
    const response = await axios.post(
      `${HMS_API_BASE}/rooms`,
      { name: roomName },
      {
        headers: {
          Authorization: `Bearer ${APP_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    const roomId = response.data.id;
    const room = new Room({ roomId, roomName, createdAt: new Date() });
    await room.save();
    res.status(201).send(response.data);
  } catch (error) {
    console.error("Error creating room:", error.message);
  }
});

app.post("/rooms/:roomId/token", (req, res) => {
  const { roomId } = req.params;
  const { role } = req.body;

  try {
    const token = jwt.sign(
      {
        access_key: API_KEY,
        room_id: roomId,
        role,
        type: "app",
        version: 2,
      },
      APP_SECRET,
      { expiresIn: "24h" }
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate token" });
  }
});

app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ error: "Failed to list rooms" });
  }
});

wss.on("connection", (ws) => {
  console.log("WebSocket connection established");

  ws.on("message", async (message) => {
    const { event, data } = JSON.parse(message);

    if (event === "join") {
      const { roomId, userId } = data;
      const participant = new Participant({
        userId,
        roomId,
        joinedAt: new Date(),
      });
      await participant.save();
      await Room.updateOne({ roomId }, { $inc: { participantCount: 1 } });
      ws.send(
        JSON.stringify({
          event: "update",
          data: { roomId, userId, action: "joined" },
        })
      );
    }

    if (event === "leave") {
      const { roomId, userId } = data;
      await Participant.updateOne({ userId, roomId }, { leftAt: new Date() });
      await Room.updateOne({ roomId }, { $inc: { participantCount: -1 } });
      ws.send(
        JSON.stringify({
          event: "update",
          data: { roomId, userId, action: "left" },
        })
      );
    }
  });
});

// Start Server
const server = app.listen(PORT || 3000, () => {
  console.log(`Server running on port ${PORT || 3000}`);
});

// Upgrade HTTP server to WebSocket
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
