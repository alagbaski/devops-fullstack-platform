import { useEffect, useMemo, useState } from "react";

import { AUTH_TOKEN_STORAGE_KEY } from "./api/auth";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";

const API_URL = "/api";
const CART_STORAGE_KEY = "devops-platform-cart";
const ADMIN_TOKEN_STORAGE_KEY = "devops-platform-admin-token";

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/alagbaski/devops-fullstack-platform",
    note: "Source code and deployment history",
  },
  {
    label: "Issues",
    href: "https://github.com/alagbaski/devops-fullstack-platform/issues",
    note: "Track bugs and feature requests",
  },
  {
    label: "Email",
    href: "mailto:support@example.com",
    note: "Replace with your production support inbox",
  },
];

const pageOptions = [
  { id: "home", label: "Home" },
  { id: "shop", label: "Shop" },
  { id: "cart", label: "Cart" },
  { id: "account", label: "Account" },
  { id: "admin", label: "Admin" },
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

function readToken(key) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) || "";
}

export default function App() {
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => readLocalStorage(CART_STORAGE_KEY, []));
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [userToken, setUserToken] = useState(() => readToken(AUTH_TOKEN_STORAGE_KEY));
  const [authMessage, setAuthMessage] = useState("");
  const [adminToken, setAdminToken] = useState(() => readToken(ADMIN_TOKEN_STORAGE_KEY));
  const [adminEmail, setAdminEmail] = useState("admin@example.com");
  const [adminPassword, setAdminPassword] = useState("change-me-too");
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminForm, setAdminForm] = useState(initialAdminForm);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((total, item) => total + item.quantity * Number(item.price), 0),
    [cart]
  );

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
      const [overviewResponse, productsResponse] = await Promise.all([
        fetch(`${API_URL}/v1/admin/overview`, { headers }),
        fetch(`${API_URL}/v1/products/admin`, { headers }),
      ]);

      if ([overviewResponse, productsResponse].some((response) => response.status === 401 || response.status === 403)) {
        throw new Error("Admin session expired or does not have access.");
      }

      if (!overviewResponse.ok || !productsResponse.ok) {
        throw new Error("Failed to load admin dashboard.");
      }

      const [overviewData, productsData] = await Promise.all([
        overviewResponse.json(),
        productsResponse.json(),
      ]);

      setAdminOverview(overviewData);
      setAdminProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      setAdminError(err.message || "Failed to load admin dashboard.");
      setAdminToken("");
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
      if (userToken) {
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, userToken);
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    }
  }, [userToken]);

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

  const pageLabel = pageOptions.find((option) => option.id === page)?.label || "Home";

  return (
    <main className="app-shell">
      <section className="hero-card panel">
        <div className="hero-copy">
          <p className="eyebrow">DevOps Fullstack Platform</p>
          <h1>Operate a storefront, not a raw API surface.</h1>
          <p className="intro">
            The public UI now focuses on real pages for shopping, cart, account,
            and admin workflows, while direct operational endpoints stay tucked
            behind protected backend routes.
          </p>

          <nav className="store-nav" aria-label="Site navigation">
            {pageOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={page === option.id ? "secondary-button is-active-tab" : "secondary-button"}
                onClick={() => setPage(option.id)}
              >
                {option.label}
                {option.id === "cart" ? ` (${cartCount})` : ""}
              </button>
            ))}
          </nav>
        </div>

        <div className="status-panel">
          <span className="status-chip">{pageLabel} page</span>
          <p className="status-title">Current experience</p>
          <p className="status-text">
            Public visitors use page-based flows for browsing products, managing
            a local cart, and accessing account screens. Operational links stay
            in the protected admin area.
          </p>

          <div className="status-note">
            <strong>Store status</strong>
            <p>
              {cartCount === 0
                ? "No products selected yet."
                : `${cartCount} item${cartCount === 1 ? "" : "s"} currently saved in the cart.`}
            </p>
          </div>
        </div>
      </section>

      {page === "home" ? (
        <section className="workspace-grid">
          <section className="panel panel-home">
            <div className="panel-header">
              <div>
                <p className="section-label">Welcome</p>
                <h2>Storefront pages</h2>
              </div>
              <p>Use the page navigation above instead of jumping into raw backend URLs.</p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <strong>Shop</strong>
                <p>Browse the active product catalog and add items to the cart.</p>
              </article>
              <article className="feature-card">
                <strong>Cart</strong>
                <p>Review saved items, update quantities, and keep state in local storage.</p>
              </article>
              <article className="feature-card">
                <strong>Account</strong>
                <p>Use the login and signup forms to connect with the FastAPI auth endpoints.</p>
              </article>
              <article className="feature-card">
                <strong>Admin</strong>
                <p>Manage products and system links from the protected admin dashboard.</p>
              </article>
            </div>
          </section>

          <section className="panel panel-home">
            <div className="panel-header">
              <div>
                <p className="section-label">Connect</p>
                <h2>Social links</h2>
              </div>
              <p>Replace placeholder contact links with your production brand accounts before launch.</p>
            </div>

            <div className="social-grid">
              {socialLinks.map((link) => (
                <a key={link.label} className="social-card" href={link.href} target="_blank" rel="noreferrer">
                  <span>{link.label}</span>
                  <small>{link.note}</small>
                </a>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {page === "shop" ? (
        <section className="panel panel-products page-panel">
          <div className="panel-header panel-header-split">
            <div>
              <p className="section-label">Shop</p>
              <h2>Product catalog</h2>
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
              <small>An admin can create and publish products from the admin page.</small>
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
                          ? "Saved to the local cart when selected."
                          : `${quantityInCart} in cart locally`}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {page === "cart" ? (
        <section className="panel panel-cart-page">
          <div className="panel-header panel-header-split">
            <div>
              <p className="section-label">Cart</p>
              <h2>Your saved cart</h2>
            </div>
            <div className="panel-actions">
              <p>{cartCount === 0 ? "No items saved" : `${cartCount} item${cartCount === 1 ? "" : "s"} saved locally`}</p>
              <button type="button" className="secondary-button" onClick={() => setPage("shop")}>
                Continue shopping
              </button>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              <p>Your cart is empty.</p>
              <small>Add products from the shop page and they will persist in local storage.</small>
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
      ) : null}

      {page === "account" ? (
        <section className="workspace-grid">
          {authMode === "login" ? (
            <LoginPage
              onSuccess={(data) => {
                setUserToken(data.access_token);
                setAuthMessage("Login successful. JWT stored in local storage.");
              }}
              onSwitch={() => {
                setAuthMessage("");
                setAuthMode("signup");
              }}
            />
          ) : (
            <SignupPage
              onSuccess={() => {
                setAuthMessage("Signup successful. You can log in now.");
                setAuthMode("login");
              }}
              onSwitch={() => {
                setAuthMessage("");
                setAuthMode("login");
              }}
            />
          )}

          <section className="panel panel-admin">
            <div className="panel-header">
              <div>
                <p className="section-label">Session</p>
                <h2>User JWT</h2>
              </div>
              <p>The account pages connect to the backend auth API and store the JWT locally.</p>
            </div>

            {authMessage ? <p className="success-message">{authMessage}</p> : null}

            {userToken ? (
              <>
                <p className="form-help">
                  A user token is stored in local storage under <code>{AUTH_TOKEN_STORAGE_KEY}</code>.
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setUserToken("");
                    setAuthMessage("JWT removed from local storage.");
                  }}
                >
                  Clear JWT
                </button>
              </>
            ) : (
              <div className="empty-state">
                <p>No user JWT stored yet.</p>
                <small>Sign up first, then log in to store a token locally.</small>
              </div>
            )}
          </section>
        </section>
      ) : null}

      {page === "admin" ? (
        <section className="panel panel-admin page-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Admin</p>
              <h2>Dashboard</h2>
            </div>
            <p>Manage products and open curated operational links from a protected page.</p>
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
                  <strong>{adminEmail || "Admin session"}</strong>
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
                    <p>Minimal admin form for catalog management.</p>
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
                    <p>Operational endpoints stay here instead of the public storefront.</p>
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
                  <p>Publish or hide products without exposing operational controls publicly.</p>
                </div>

                {adminProducts.length === 0 ? (
                  <div className="empty-state">
                    <p>No admin products found yet.</p>
                    <small>Create the first product to populate the storefront and admin page.</small>
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
      ) : null}

      <section className="panel panel-home page-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Community</p>
            <h2>Social links</h2>
          </div>
          <p>Keep public navigation friendly and move technical endpoints out of the customer-facing UI.</p>
        </div>

        <div className="social-grid">
          {socialLinks.map((link) => (
            <a key={link.label} className="social-card" href={link.href} target="_blank" rel="noreferrer">
              <span>{link.label}</span>
              <small>{link.note}</small>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
