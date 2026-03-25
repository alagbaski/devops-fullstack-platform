import { useEffect, useMemo, useState } from "react";

const API_URL = "/api";

const quickLinks = [
  { label: "API items", href: "/api/items", note: "Current frontend contract" },
  { label: "Metrics", href: "http://localhost:8000/metrics", note: "Backend Prometheus metrics" },
  { label: "Prometheus", href: "http://localhost:9090", note: "Query collected metrics" },
  { label: "Grafana", href: "http://localhost:3001", note: "Inspect dashboards" },
];

const localServices = [
  { name: "Frontend", href: "http://localhost:5173", detail: "React + Vite development UI" },
  { name: "Nginx", href: "http://localhost", detail: "Main local entrypoint" },
  { name: "FastAPI", href: "http://localhost:8000/health", detail: "Health check endpoint" },
  { name: "RabbitMQ", href: "http://localhost:15672", detail: "Broker management console" },
];

export default function App() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");

  const itemSummary = useMemo(() => {
    if (items.length === 0) return "No items stored yet";
    if (items.length === 1) return "1 item tracked";
    return `${items.length} items tracked`;
  }, [items]);

  async function fetchItems() {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/items`);
      if (!response.ok) {
        throw new Error("Failed to load items.");
      }
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProducts() {
    setIsProductsLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/products`);
      if (!response.ok) {
        throw new Error("Failed to load products.");
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setProductError(err.message || "Failed to load products.");
    } finally {
      setIsProductsLoading(false);
    }
  }

  async function addItem(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter an item name before submitting.");
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
    fetchProducts().catch((err) => {
      setProductError(err.message || "Failed to load products.");
    });
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card panel">
        <div className="hero-copy">
          <p className="eyebrow">DevOps Fullstack Platform</p>
          <h1>Run a storefront-ready platform from one calm control room.</h1>
          <p className="intro">
            Browse the first product catalog slice through nginx, keep the legacy
            smoke-test item flow available, and monitor the broader platform with
            links for metrics, health, queues, and dashboards.
          </p>

          <div className="quick-links" aria-label="Platform shortcuts">
            {quickLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                <span>{link.label}</span>
                <small>{link.note}</small>
              </a>
            ))}
          </div>
        </div>

        <div className="status-panel">
          <span className="status-chip">Local environment</span>
          <p className="status-title">Current flow</p>
          <p className="status-text">
            React → nginx → FastAPI → PostgreSQL, with RabbitMQ workers and
            Prometheus/Grafana observability around it.
          </p>

          <div className="status-note">
            <strong>Phase status</strong>
            <p>Product listing now uses GET /api/v1/products while the legacy item flow stays available for smoke testing.</p>
          </div>
        </div>
      </section>

      <section className="panel panel-products">
        <div className="panel-header panel-header-split">
          <div>
            <p className="section-label">Storefront</p>
            <h2>Product listing</h2>
          </div>
          <div className="panel-actions">
            <p>{isProductsLoading ? "Refreshing catalog..." : `${products.length} active products`}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => fetchProducts().catch((err) => setProductError(err.message || "Failed to load products."))}
              disabled={isProductsLoading}
            >
              {isProductsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {productError ? (
          <p className="error-message" role="alert">
            {productError}
          </p>
        ) : null}

        {isProductsLoading ? (
          <div className="empty-state">
            <p>Loading active products from the catalog API...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products published yet.</p>
            <small>Create products through the admin-ready API once an admin user is seeded.</small>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-card-header">
                  <p className="product-price">
                    {product.currency} {Number(product.price).toFixed(2)}
                  </p>
                  <span className="status-chip product-chip">{product.inventory_count} in stock</span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-grid">
        <section className="panel panel-form">
          <div className="panel-header">
            <div>
              <p className="section-label">Write path</p>
              <h2>Queue an item</h2>
            </div>
            <p>Keep the behavior simple and verify the full app path quickly.</p>
          </div>

          <form className="item-form" onSubmit={addItem}>
            <label className="sr-only" htmlFor="item-name">
              Item name
            </label>
            <input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Try release checklist, smoke test, deploy note..."
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Item"}
            </button>
          </form>

          <p className="form-help">Use a short, recognizable entry so it is easy to confirm in the API response and database.</p>

          {error ? (
            <p className="error-message" role="alert">
              {error} If the issue persists, confirm the compose stack and nginx routing are healthy.
            </p>
          ) : null}
        </section>

        <section className="panel panel-list">
          <div className="panel-header panel-header-split">
            <div>
              <p className="section-label">Read path</p>
              <h2>Items</h2>
            </div>
            <div className="panel-actions">
              <p>{isLoading ? "Refreshing from API..." : itemSummary}</p>
              <button type="button" className="secondary-button" onClick={() => fetchItems().catch((err) => setError(err.message || "Failed to load items."))} disabled={isLoading || isSubmitting}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-state">
              <p>Loading items from the local API...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>No items yet. Add your first one to verify the app end to end.</p>
              <small>The list will refresh from the same /api/items endpoint used by the current local setup.</small>
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

      <section className="workspace-grid">
        <section className="panel panel-services">
          <div className="panel-header">
            <div>
              <p className="section-label">Local services</p>
              <h2>Environment status</h2>
            </div>
            <p>Helpful defaults for checking the stack without changing the workflow.</p>
          </div>

          <ul className="service-list">
            {localServices.map((service) => (
              <li key={service.name}>
                <a href={service.href} target="_blank" rel="noreferrer">
                  <span>{service.name}</span>
                  <small>{service.detail}</small>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel panel-help">
          <div className="panel-header">
            <div>
              <p className="section-label">Help</p>
              <h2>Quick local smoke test</h2>
            </div>
            <p>A safe sequence for validating the current stack behavior.</p>
          </div>

          <ol className="help-list">
            <li>Start the environment with the repository Docker Compose flow.</li>
            <li>Open the frontend, submit an item, and confirm the request succeeds.</li>
            <li>Refresh the list to verify the item is returned by the API.</li>
            <li>Use metrics, Grafana, Prometheus, and RabbitMQ links for deeper inspection.</li>
          </ol>
        </section>
      </section>
    </main>
  );
}
