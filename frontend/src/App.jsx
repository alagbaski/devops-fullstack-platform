import { useEffect, useMemo, useState } from "react";

const API_URL = "/api";
const CART_STORAGE_KEY = "devops-platform-cart";
const ADMIN_TOKEN_STORAGE_KEY = "devops-platform-admin-token";

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

const initialAdminForm = {
  name: "",
  slug: "",
  description: "",
  price: "19.99",
  currency: "USD",
  inventory_count: "5",
  image_url: "",
  is_active: true,
};

function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
}

export default function App() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => readLocalStorage(CART_STORAGE_KEY, []));
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [adminToken, setAdminToken] = useState(() => readToken());
  const [adminEmail, setAdminEmail] = useState("admin@example.com");
  const [adminPassword, setAdminPassword] = useState("change-me-too");
  const [adminUser, setAdminUser] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminForm, setAdminForm] = useState(initialAdminForm);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  const itemSummary = useMemo(() => {
    if (items.length === 0) return "No items stored yet";
    if (items.length === 1) return "1 item tracked";
    return `${items.length} items tracked`;
  }, [items]);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((total, item) => total + item.quantity * Number(item.price), 0),
    [cart]
  );

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

  function addToCart(product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.inventory_count) }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          currency: product.currency,
          quantity: 1,
          inventory_count: product.inventory_count,
        },
      ];
    });
  }

  function updateCartQuantity(productId, nextQuantity) {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item.id !== productId) {
          return [item];
        }

        if (nextQuantity <= 0) {
          return [];
        }

        return [
          {
            ...item,
            quantity: Math.min(nextQuantity, item.inventory_count),
          },
        ];
      })
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  }

  async function fetchAdminData(token = adminToken) {
    if (!token) {
      return;
    }

    setIsAdminLoading(true);
    setAdminError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [meResponse, overviewResponse, productsResponse] = await Promise.all([
        fetch(`${API_URL}/v1/auth/me`, { headers }),
        fetch(`${API_URL}/v1/admin/overview`, { headers }),
        fetch(`${API_URL}/v1/products/admin`, { headers }),
      ]);

      if ([meResponse, overviewResponse, productsResponse].some((response) => response.status === 401 || response.status === 403)) {
        throw new Error("Admin session expired or does not have access.");
      }

      if (!meResponse.ok || !overviewResponse.ok || !productsResponse.ok) {
        throw new Error("Failed to load admin dashboard.");
      }

      const [meData, overviewData, productsData] = await Promise.all([
        meResponse.json(),
        overviewResponse.json(),
        productsResponse.json(),
      ]);

      setAdminUser(meData);
      setAdminOverview(overviewData);
      setAdminProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      setAdminError(err.message || "Failed to load admin dashboard.");
      setAdminToken("");
      setAdminUser(null);
      setAdminOverview(null);
      setAdminProducts([]);
    } finally {
      setIsAdminLoading(false);
    }
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setIsAdminSubmitting(true);
    setAdminError("");
    setAdminMessage("");

    try {
      const response = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      if (!response.ok) {
        throw new Error("Invalid admin credentials.");
      }

      const data = await response.json();
      setAdminToken(data.access_token);
      setAdminMessage("Admin session ready.");
      await fetchAdminData(data.access_token);
    } catch (err) {
      setAdminError(err.message || "Failed to sign in.");
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  function handleAdminLogout() {
    setAdminToken("");
    setAdminUser(null);
    setAdminOverview(null);
    setAdminProducts([]);
    setAdminMessage("Admin session cleared.");
    setAdminError("");
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setIsAdminSubmitting(true);
    setAdminError("");
    setAdminMessage("");

    try {
      const response = await fetch(`${API_URL}/v1/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...adminForm,
          price: adminForm.price,
          inventory_count: Number(adminForm.inventory_count),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create product.");
      }

      setAdminForm(initialAdminForm);
      setAdminMessage("Product created.");
      await Promise.all([fetchProducts(), fetchAdminData()]);
    } catch (err) {
      setAdminError(err.message || "Failed to create product.");
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  async function toggleProductStatus(product) {
    setIsAdminSubmitting(true);
    setAdminError("");
    setAdminMessage("");

    try {
      const response = await fetch(`${API_URL}/v1/products/${product.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !product.is_active }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update product.");
      }

      setAdminMessage(`Product ${product.is_active ? "hidden" : "published"}.`);
      await Promise.all([fetchProducts(), fetchAdminData()]);
    } catch (err) {
      setAdminError(err.message || "Failed to update product.");
    } finally {
      setIsAdminSubmitting(false);
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (adminToken) {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, adminToken);
      } else {
        window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      }
    }
  }, [adminToken]);

  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        const matchingProduct = products.find((product) => product.id === item.id);
        if (!matchingProduct || !matchingProduct.is_active) {
          return [];
        }

        const nextQuantity = Math.min(item.quantity, matchingProduct.inventory_count);
        if (nextQuantity <= 0) {
          return [];
        }

        return [
          {
            ...item,
            name: matchingProduct.name,
            price: Number(matchingProduct.price),
            currency: matchingProduct.currency,
            inventory_count: matchingProduct.inventory_count,
            quantity: nextQuantity,
          },
        ];
      })
    );
  }, [products]);

  useEffect(() => {
    if (adminToken) {
      fetchAdminData(adminToken).catch(() => {});
    }
  }, [adminToken]);

  return (
    <main className="app-shell">
      <section className="hero-card panel">
        <div className="hero-copy">
          <p className="eyebrow">DevOps Fullstack Platform</p>
          <h1>Run a storefront-ready platform from one calm control room.</h1>
          <p className="intro">
            Browse the catalog through nginx, keep the legacy smoke-test item
            flow available, verify a frontend-managed cart, and unlock an
            admin console for product and system operations.
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
          <span className="status-chip">Admin and cart ready</span>
          <p className="status-title">Current flow</p>
          <p className="status-text">
            React → nginx → FastAPI → PostgreSQL, with RabbitMQ workers and
            Prometheus/Grafana observability around it.
          </p>

          <div className="status-note">
            <strong>Phase status</strong>
            <p>
              {cartCount === 0
                ? "No cart items selected yet."
                : `${cartCount} item${cartCount === 1 ? "" : "s"} selected in the browser-managed cart.`}
            </p>
          </div>
        </div>
      </section>

      <section className="workspace-grid workspace-grid-store">
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
              <small>Create products through the admin dashboard below once an admin user is seeded.</small>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => {
                const cartItem = cart.find((item) => item.id === product.id);
                const quantityInCart = cartItem?.quantity ?? 0;
                const isOutOfStock = product.inventory_count === 0;
                const isAtLimit = quantityInCart >= product.inventory_count;

                return (
                  <article key={product.id} className="product-card">
                    <div className="product-card-header">
                      <p className="product-price">
                        {product.currency} {Number(product.price).toFixed(2)}
                      </p>
                      <span className="status-chip product-chip">{product.inventory_count} in stock</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-card-footer">
                      <button
                        type="button"
                        className="secondary-button cart-button"
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock || isAtLimit}
                      >
                        {isOutOfStock ? "Out of stock" : isAtLimit ? "In cart" : "Add to cart"}
                      </button>
                      <small>
                        {quantityInCart === 0
                          ? "Cart state lives in the browser for this phase."
                          : `${quantityInCart} in cart locally`}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel panel-cart">
          <div className="panel-header">
            <div>
              <p className="section-label">Cart</p>
              <h2>Frontend-managed basket</h2>
            </div>
            <p>Persisted in local storage so we can test cart behavior now without introducing checkout or orders.</p>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              <p>Your cart is empty.</p>
              <small>Add a product to verify quantity updates and browser persistence.</small>
            </div>
          ) : (
            <>
              <ul className="cart-list">
                {cart.map((item) => (
                  <li key={item.id} className="cart-item">
                    <div>
                      <strong>{item.name}</strong>
                      <p>
                        {item.currency} {item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="cart-controls">
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.inventory_count}
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="cart-remove" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <div className="cart-summary">
                <div>
                  <span>Items</span>
                  <strong>{cartCount}</strong>
                </div>
                <div>
                  <span>Subtotal</span>
                  <strong>USD {cartSubtotal.toFixed(2)}</strong>
                </div>
              </div>
            </>
          )}
        </section>
      </section>

      <section className="panel panel-admin">
        <div className="panel-header">
          <div>
            <p className="section-label">Admin</p>
            <h2>Dashboard</h2>
          </div>
          <p>Manage products and open curated system endpoints without exposing raw controls in the storefront.</p>
        </div>

        {adminError ? (
          <p className="error-message" role="alert">
            {adminError}
          </p>
        ) : null}

        {adminMessage ? <p className="success-message">{adminMessage}</p> : null}

        {!adminToken ? (
          <form className="admin-login-form" onSubmit={handleAdminLogin}>
            <input
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="Admin email"
              type="email"
            />
            <input
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Admin password"
              type="password"
            />
            <button type="submit" disabled={isAdminSubmitting}>
              {isAdminSubmitting ? "Signing in..." : "Admin login"}
            </button>
          </form>
        ) : (
          <>
            <div className="admin-toolbar">
              <div>
                <strong>{adminUser?.email || "Admin session"}</strong>
                <p>{isAdminLoading ? "Refreshing admin dashboard..." : "Authenticated admin controls are active."}</p>
              </div>
              <button type="button" className="secondary-button" onClick={handleAdminLogout}>
                Logout
              </button>
            </div>

            <div className="admin-grid">
              <section className="admin-card">
                <div className="panel-header">
                  <div>
                    <p className="section-label">Products</p>
                    <h2>Create product</h2>
                  </div>
                  <p>Minimal admin form for Phase 4 catalog management.</p>
                </div>

                <form className="admin-product-form" onSubmit={handleCreateProduct}>
                  <input
                    value={adminForm.name}
                    onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Product name"
                  />
                  <input
                    value={adminForm.slug}
                    onChange={(event) => setAdminForm((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="product-slug"
                  />
                  <textarea
                    value={adminForm.description}
                    onChange={(event) => setAdminForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Short product description"
                    rows={4}
                  />
                  <div className="admin-form-row">
                    <input
                      value={adminForm.price}
                      onChange={(event) => setAdminForm((current) => ({ ...current, price: event.target.value }))}
                      placeholder="19.99"
                    />
                    <input
                      value={adminForm.currency}
                      onChange={(event) => setAdminForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                      placeholder="USD"
                    />
                    <input
                      value={adminForm.inventory_count}
                      onChange={(event) => setAdminForm((current) => ({ ...current, inventory_count: event.target.value }))}
                      placeholder="5"
                    />
                  </div>
                  <input
                    value={adminForm.image_url}
                    onChange={(event) => setAdminForm((current) => ({ ...current, image_url: event.target.value }))}
                    placeholder="Optional image URL"
                  />
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={adminForm.is_active}
                      onChange={(event) => setAdminForm((current) => ({ ...current, is_active: event.target.checked }))}
                    />
                    Publish immediately
                  </label>
                  <button type="submit" disabled={isAdminSubmitting}>
                    {isAdminSubmitting ? "Saving..." : "Create product"}
                  </button>
                </form>
              </section>

              <section className="admin-card">
                <div className="panel-header">
                  <div>
                    <p className="section-label">Operations</p>
                    <h2>System links</h2>
                  </div>
                  <p>Curated admin-only endpoints for the local platform.</p>
                </div>

                <div className="admin-counts">
                  <div>
                    <span>Total</span>
                    <strong>{adminOverview?.products?.total ?? 0}</strong>
                  </div>
                  <div>
                    <span>Active</span>
                    <strong>{adminOverview?.products?.active ?? 0}</strong>
                  </div>
                  <div>
                    <span>Inactive</span>
                    <strong>{adminOverview?.products?.inactive ?? 0}</strong>
                  </div>
                </div>

                <ul className="service-list admin-service-list">
                  {(adminOverview?.system_links || []).map((link) => (
                    <li key={link.label}>
                      <a href={link.href} target="_blank" rel="noreferrer">
                        <span>{link.label}</span>
                        <small>{link.href}</small>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="admin-card admin-products-card">
              <div className="panel-header">
                <div>
                  <p className="section-label">Catalog</p>
                  <h2>Manage products</h2>
                </div>
                <p>Toggle product visibility without affecting the legacy smoke-test path.</p>
              </div>

              {adminProducts.length === 0 ? (
                <div className="empty-state">
                  <p>No admin products found yet.</p>
                  <small>Create the first product to populate the catalog and dashboard.</small>
                </div>
              ) : (
                <ul className="admin-product-list">
                  {adminProducts.map((product) => (
                    <li key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <p>
                          {product.currency} {Number(product.price).toFixed(2)} · {product.inventory_count} in stock
                        </p>
                      </div>
                      <span className={`admin-badge ${product.is_active ? "is-active" : "is-inactive"}`}>
                        {product.is_active ? "Live" : "Hidden"}
                      </span>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => toggleProductStatus(product)}
                        disabled={isAdminSubmitting}
                      >
                        {product.is_active ? "Hide" : "Publish"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
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
              <button
                type="button"
                className="secondary-button"
                onClick={() => fetchItems().catch((err) => setError(err.message || "Failed to load items."))}
                disabled={isLoading || isSubmitting}
              >
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
            <li>Login in the admin dashboard and create or publish a product.</li>
            <li>Add the product to the frontend cart, then refresh the page to confirm persistence.</li>
            <li>Use metrics, Grafana, Prometheus, and RabbitMQ links for deeper inspection.</li>
          </ol>
        </section>
      </section>
    </main>
  );
}
