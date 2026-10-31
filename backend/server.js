const express = require("express");
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const { DATASET, QUIZZES, generateResponse } = require("./aiEngine");

let chatMemory = [];
const MAX_CHAT_MEMORY = 100;
const { PORT } = require("./config/env");
const { testConnection } = require("./config/db");
const apiRouter = require("./routes");

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple request logging (dev-friendly)
app.use((req, res, next) => {
  // Very lightweight log
  console.log(`${req.method} ${req.url}`);
  next();
});

// API routes
app.use("/api", apiRouter);

// Rule-Based AI Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const { topic, moduleType, level, message, isWorkspace, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }
    const cleanMessage = message.trim();
    
    // Save to memory, keeping memory bounded
    chatMemory.push({ user: "student", message: cleanMessage, topic: topic || "general", time: new Date() });
    if (chatMemory.length > MAX_CHAT_MEMORY) chatMemory = chatMemory.slice(-MAX_CHAT_MEMORY);

    let aiRes;
    if (isWorkspace && topic) {
      aiRes = generateResponse(topic, "workspace", "basic", cleanMessage, history);
    } else if (topic && moduleType && level) {
      aiRes = generateResponse(topic, moduleType.toLowerCase(), level.toLowerCase(), cleanMessage);
    } else {
      aiRes = { type: "text", content: "That is an interesting thought! Let's explore more about Computer Science. Try explicitly asking about a Data Structure or Algorithm." };
      for (const t of Object.keys(DATASET)) {
        if (cleanMessage.toLowerCase().includes(t.toLowerCase())) {
          aiRes = generateResponse(t, "basic", "basic", cleanMessage);
          break;
        }
      }
    }
    
    if (aiRes.type === "html") return res.json({ reply: aiRes.content, isHtml: true });
    return res.json({ reply: aiRes.content, isHtml: false });
  } catch (error) {
    console.error("[LOCAL ENGINE ERROR /chat]:", error);
    return res.status(500).json({ error: "AI service temporarily unavailable" });
  }
});

// Quiz generation Endpoint
app.post("/quiz", async (req, res) => {
  try {
    const { topic } = req.body || {};
    if (!topic || !Object.prototype.hasOwnProperty.call(QUIZZES, topic)) {
      return res.status(404).json({ error: "No quiz available for this topic yet." });
    }
    return res.json({ questions: QUIZZES[topic] });
  } catch (error) {
    console.error("[LOCAL ENGINE ERROR /quiz]:", error);
    return res.status(500).json({ error: "Quiz service unavailable" });
  }
});

// Memory testing Endpoint
app.get("/memory", (req, res) => {
   res.json({ memory: chatMemory });
});

// Health endpoint (top-level)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "LearnSphere AI",
    time: new Date().toISOString(),
  });
});

// Serve static frontend (optional convenience)
const publicDir = path.join(__dirname, "../frontend");
app.use(express.static(publicDir));

// API routes should always return JSON, never SPA HTML
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use("/chat", (req, res) => {
  res.status(404).json({ error: "Chat route must use POST" });
});

app.use("/quiz", (req, res) => {
  res.status(404).json({ error: "Quiz route must use POST" });
});

// Fallback to index.html for SPA routes
app.use((req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`LearnSphere AI server listening on http://localhost:${PORT}`);
    await testConnection();
  });
}

module.exports = app;

