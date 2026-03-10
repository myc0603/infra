const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "items.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readItems() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Create
app.post("/api/items", (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  const now = new Date().toISOString();
  const item = {
    id: crypto.randomUUID(),
    text,
    createdAt: now,
    updatedAt: now
  };

  const items = readItems();
  items.unshift(item);
  writeItems(items);

  res.status(201).json(item);
});

// Read
app.get("/api/items", (_req, res) => {
  const items = readItems();
  res.json(items);
});

// Update
app.put("/api/items/:id", (req, res) => {
  const { id } = req.params;
  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  const items = readItems();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "not found" });
  }

  items[idx] = {
    ...items[idx],
    text,
    updatedAt: new Date().toISOString()
  };
  writeItems(items);

  res.json(items[idx]);
});

// Delete
app.delete("/api/items/:id", (req, res) => {
  const { id } = req.params;
  const items = readItems();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "not found" });
  }

  const [removed] = items.splice(idx, 1);
  writeItems(items);

  res.json(removed);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});