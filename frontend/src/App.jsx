import { useEffect, useState } from "react";

const API_URL = "/api";
const quickLinks = [
  { label: "API", href: "/api/items" },
  { label: "Metrics", href: "http://localhost:8000/metrics" },
  { label: "Prometheus", href: "http://localhost:9090" },
  { label: "Grafana", href: "http://localhost:3001" },
];

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchItems() {
    const response = await fetch(`${API_URL}/items`);
    if (!response.ok) {
      throw new Error("Failed to load items.");
    }
    const data = await response.json();
    setItems(data);
  }

  async function addItem(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        throw new Error("Failed to save item.");
      }

      setName("");
      await fetchItems();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    fetchItems().catch((err) => {
      setError(err.message || "Failed to load items.");
    });
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Local React Dev Server</p>
          <h1>Operate the stack from one calm little control room.</h1>
          <p className="intro">
            Add items through the React interface, route requests through nginx,
            and keep the rest of the platform within reach through monitoring
            links that match your local setup.
          </p>

          <div className="quick-links" aria-label="Platform shortcuts">
            {quickLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="status-panel">
          <span className="status-chip">Compose stack ready</span>
          <p className="status-title">Current flow</p>
          <p className="status-text">
            React -> nginx -> FastAPI -> PostgreSQL, with RabbitMQ workers and
            Prometheus/Grafana observability around it.
          </p>
        </div>
      </section>

      <section className="workspace-grid">
        <section className="panel panel-form">
          <div className="panel-header">
            <h2>Queue an item</h2>
            <p>Keep the behavior simple and test the full app path quickly.</p>
          </div>

          <form className="item-form" onSubmit={addItem}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Try release checklist, smoke test, deploy note..."
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Item"}
            </button>
          </form>

          {error ? <p className="error-message">{error}</p> : null}
        </section>

        <section className="panel panel-list">
          <div className="panel-header">
            <h2>Items</h2>
            <p>{items.length === 0 ? "Nothing added yet." : `${items.length} item${items.length === 1 ? "" : "s"} tracked.`}</p>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>No items yet. Add your first one to verify the app end to end.</p>
            </div>
          ) : (
            <ul className="item-list">
              {items.map((item, index) => (
                <li key={item.id}>
                  <span className="item-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>Persisted through the backend API and database.</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
