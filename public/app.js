const ReactLib = typeof require === "function" ? require("react") : React;
const ReactDOMClient =
  typeof require === "function" ? require("react-dom/client") : ReactDOM;

const { useEffect, useMemo, useState } = ReactLib;

function App() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const placeholder = useMemo(() => {
    return editingId ? "Update text" : "New item";
  }, [editingId]);

  async function loadItems() {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Text is required.");
      return;
    }

    const payload = { text };

    const res = await fetch(
      editingId ? `/api/items/${editingId}` : "/api/items",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Request failed");
      return;
    }

    setText("");
    setEditingId(null);
    loadItems();
  }

  function startEdit(item) {
    setText(item.text);
    setEditingId(item.id);
  }

  async function removeItem(id) {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    loadItems();
  }

  function cancelEdit() {
    setText("");
    setEditingId(null);
  }

  return (
    <div className="page">
      <h1>Minimal CRUD</h1>
      <h2>version 1</h2>
      <p>React UI + Express API, file-based storage.</p>

      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
        />
        <button type="submit">{editingId ? "Update" : "Add"}</button>
        {editingId && (
          <button type="button" className="ghost" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </form>

      {error && <p className="meta">{error}</p>}

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <div>
              <div>{item.text}</div>
              <div className="meta">{new Date(item.updatedAt).toLocaleString()}</div>
            </div>
            <div className="actions">
              <button type="button" className="ghost" onClick={() => startEdit(item)}>
                Edit
              </button>
              <button type="button" onClick={() => removeItem(item.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function mountApp(rootElement) {
  return ReactDOMClient.createRoot(rootElement).render(<App />);
}

if (typeof module !== "undefined") {
  module.exports = {
    App,
    mountApp
  };
}

if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    mountApp(rootElement);
  }
}
