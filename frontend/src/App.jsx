import { useEffect, useState } from "react";

const API_URL = "/api";

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
      <section className="panel">
        <p className="eyebrow">Local React Dev Server</p>
        <h1>DevOps Microservices Demo</h1>
        <p className="intro">
          Add items through the React UI and watch them flow through nginx to
          the backend API.
        </p>

        <form className="item-form" onSubmit={addItem}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter item"
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Item"}
          </button>
        </form>

        {error ? <p className="error-message">{error}</p> : null}

        <div className="list-block">
          <h2>Items</h2>
          {items.length === 0 ? (
            <p className="empty-state">No items yet. Add your first one.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
