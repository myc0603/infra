const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "items.json");

function createItemStore(options = {}) {
  const dataDir = options.dataDir || DATA_DIR;
  const dataFile = options.dataFile || path.join(dataDir, "items.json");

  function ensureDataFile() {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, "[]", "utf8");
    }
  }

  function readItems() {
    ensureDataFile();
    const raw = fs.readFileSync(dataFile, "utf8");
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeItems(items) {
    fs.writeFileSync(dataFile, JSON.stringify(items, null, 2), "utf8");
  }

  return {
    dataDir,
    dataFile,
    ensureDataFile,
    readItems,
    writeItems
  };
}

function createApp(options = {}) {
  const app = express();
  const store = createItemStore(options);

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

    const items = store.readItems();
    items.unshift(item);
    store.writeItems(items);

    res.status(201).json(item);
  });

  // Read
  app.get("/api/items", (_req, res) => {
    const items = store.readItems();
    res.json(items);
  });

  // Update
  app.put("/api/items/:id", (req, res) => {
    const { id } = req.params;
    const text = String(req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const items = store.readItems();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "not found" });
    }

    items[idx] = {
      ...items[idx],
      text,
      updatedAt: new Date().toISOString()
    };
    store.writeItems(items);

    res.json(items[idx]);
  });

  // Delete
  app.delete("/api/items/:id", (req, res) => {
    const { id } = req.params;
    const items = store.readItems();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "not found" });
    }

    const [removed] = items.splice(idx, 1);
    store.writeItems(items);

    res.json(removed);
  });

  return app;
}

function startServer(options = {}) {
  const app = createApp(options);
  return app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  createItemStore,
  startServer
};
