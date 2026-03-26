import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { AUTH_TOKEN_STORAGE_KEY, loginUser } from "./api/auth";
import AuthButton from "./components/AuthButton";
import AuthCard from "./components/AuthCard";
import AuthField from "./components/AuthField";
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from "./components/SignupPage";

const API_URL = "/api";
const CART_STORAGE_KEY = "devops-platform-cart";
const ADMIN_TOKEN_STORAGE_KEY = "devops-platform-admin-token";

const githubUrl = "https://github.com/alagbaski/devops-fullstack-platform";
const supportEmail = "mailto:support@example.com";

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

function decodeTokenPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function hasRole(token, expectedRole) {
  const payload = decodeTokenPayload(token);
  return payload?.role === expectedRole;
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="social-icon">
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.589 2 12.248c0 4.527 2.865 8.368 6.839 9.724.5.095.683-.222.683-.493 0-.244-.009-.889-.014-1.744-2.782.617-3.369-1.373-3.369-1.373-.455-1.181-1.11-1.496-1.11-1.496-.908-.637.069-.625.069-.625 1.004.072 1.532 1.055 1.532 1.055.892 1.565 2.341 1.113 2.91.851.091-.664.349-1.113.635-1.369-2.22-.259-4.555-1.14-4.555-5.074 0-1.121.391-2.037 1.03-2.755-.103-.259-.446-1.303.098-2.717 0 0 .84-.276 2.75 1.052A9.32 9.32 0 0 1 12 6.838a9.3 9.3 0 0 1 2.504.349c1.909-1.328 2.748-1.052 2.748-1.052.546 1.414.203 2.458.1 2.717.64.718 1.028 1.634 1.028 2.755 0 3.943-2.338 4.812-4.566 5.067.359.318.679.946.679 1.907 0 1.378-.012 2.49-.012 2.829 0 .274.18.593.688.492C19.138 20.612 22 16.773 22 12.248 22 6.589 17.523 2 12 2Z"
      />
    </svg>
  );
}

function AppHeader({ title, description, actions }) {
  return (
    <section className="hero-card panel">
      <div className="hero-copy">
        <p className="eyebrow">DevOps Fullstack Platform</p>
        <h1>{title}</h1>
        <p className="intro">{description}</p>

        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>

      <div className="status-panel">
        <span className="status-chip">Authentication-first UX</span>
        <p className="status-title">Route protection</p>
        <p className="status-text">
          Public visitors land on authentication first, shoppers enter the catalog only after login,
          and admin workflows stay behind a dedicated protected route.
        </p>
      </div>
    </section>
  );
}

function AuthLanding({ authMode, setAuthMode, userToken, setUserToken }) {
  const navigate = useNavigate();
  const [authMessage, setAuthMessage] = useState("");

  return (
    <main className="min-h-screen bg-auth-gradient px-5 py-10 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col items-center justify-center gap-6">
        <header className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">YourCompany</p>
          <h1 className="font-display text-5xl leading-none tracking-[-0.04em] text-slate-950 sm:text-6xl">
            Welcome to our store
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Sign in or create an account to start shopping
          </p>
        </header>

        <AuthCard className="w-full max-w-2xl p-8 sm:p-10">
          <div className="w-full space-y-5">
            <div className="flex w-full justify-center mb-8">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/90 p-1 shadow-sm">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === "login"}
                  className={`h-12 min-w-[140px] rounded-full px-6 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                    authMode === "login"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => {
                    setAuthMessage("");
                    setAuthMode("login");
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === "signup"}
                  className={`h-12 min-w-[140px] rounded-full px-6 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                    authMode === "signup"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => {
                    setAuthMessage("");
                    setAuthMode("signup");
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {authMessage ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {authMessage}
              </p>
            ) : null}

            {authMode === "login" ? (
              <LoginPage
                onSuccess={(data) => {
                  setUserToken(data.access_token);
                  setAuthMessage("Welcome back. Redirecting to the shop.");
                  navigate("/shop", { replace: true });
                }}
                onSwitch={() => {
                  setAuthMessage("");
                  setAuthMode("signup");
                }}
              />
            ) : (
              <SignupPage
                onSuccess={() => {
                  setAuthMessage("Account created. You can sign in now.");
                  setAuthMode("login");
                }}
                onSwitch={() => {
                  setAuthMessage("");
                  setAuthMode("login");
                }}
              />
            )}

            <div className="flex items-center gap-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>OR</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <a
              className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              <GithubMark />
              <span>Continue with GitHub</span>
            </a>

            {userToken ? (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-sm">
                <Link className="font-semibold text-slate-700 hover:text-slate-950" to="/shop">
                  Continue to shop
                </Link>
                <button
                  type="button"
                  className="font-semibold text-slate-500 hover:text-slate-900"
                  onClick={() => {
                    setUserToken("");
                    setAuthMessage("You have been signed out.");
                  }}
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </AuthCard>

        <AuthCard className="w-full max-w-xl border-slate-200/80 bg-white/65 p-7 shadow-support">
          <div className="space-y-3 text-center">
            <h2 className="font-display text-3xl leading-tight tracking-[-0.03em] text-slate-950">Need help?</h2>
            <p className="mx-auto max-w-md text-sm text-slate-600">
              If you&apos;re having trouble signing in, contact support.
            </p>
            <div className="pt-2">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
                href={supportEmail}
              >
                Email us
              </a>
            </div>
          </div>
        </AuthCard>

        <footer className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
          <span>&copy; YourCompany</span>
          <a className="font-semibold text-slate-700 hover:text-slate-950" href={githubUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </footer>
      </section>
    </main>
  );
}

function ShopPage({ products, cart, isProductsLoading, productError, cartCount, cartSubtotal, onRefresh, onAddToCart, onUpdateCartQuantity, onRemoveFromCart, onLogout }) {
  return (
    <main className="app-shell">
      <AppHeader
        title="Browse the protected storefront."
        description="Signed-in users can browse active products and keep a simple cart in local storage."
        actions={
          <>
            <Link className="secondary-button button-link" to="/">
              Account
            </Link>
            <Link className="secondary-button button-link" to="/admin">
              Admin
            </Link>
            <button type="button" className="secondary-button" onClick={onLogout}>
              Log out
            </button>
          </>
        }
      />

      <section className="workspace-grid workspace-grid-store">
        <section className="panel panel-products">
          <div className="panel-header panel-header-split">
            <div>
              <p className="section-label">Shop</p>
              <h2>Product catalog</h2>
            </div>
            <div className="panel-actions">
              <p>{isProductsLoading ? "Refreshing catalog..." : `${products.length} active products`}</p>
              <button type="button" className="secondary-button" onClick={onRefresh} disabled={isProductsLoading}>
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
              <small>An admin can create and publish products from the admin dashboard.</small>
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
                      <span className="status-chip product-chip">{product.currency}</span>
                      <span className="section-label">{product.inventory_count} in stock</span>
                    </div>

                    <h3>{product.name}</h3>
                    <p>{product.description}</p>

                    <div className="product-card-footer">
                      <span className="product-price">
                        {product.currency} {Number(product.price).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className="secondary-button cart-button"
                        onClick={() => onAddToCart(product)}
                        disabled={isOutOfStock || isAtLimit}
                      >
                        {isOutOfStock ? "Out of stock" : isAtLimit ? "Cart full" : "Add to cart"}
                      </button>
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
              <h2>Saved items</h2>
            </div>
            <p>{cartCount === 0 ? "No products selected yet." : `${cartCount} item${cartCount === 1 ? "" : "s"} in cart.`}</p>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              <p>Your cart is empty.</p>
              <small>Add products from the shop to keep them in local storage.</small>
            </div>
          ) : (
            <>
              <ul className="cart-list">
                {cart.map((item) => (
                  <li key={item.id} className="cart-item">
                    <div>
                      <strong>{item.name}</strong>
                      <p>
                        {item.currency} {Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="cart-controls">
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => onUpdateCartQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <strong>{item.quantity}</strong>
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => onUpdateCartQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.inventory_count}
                      >
                        +
                      </button>
                    </div>

                    <button type="button" className="cart-remove" onClick={() => onRemoveFromCart(item.id)}>
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
    </main>
  );
}

function AdminLoginPage({ adminEmail, adminPassword, adminError, adminMessage, isAdminSubmitting, setAdminEmail, setAdminPassword, onSubmit, hasAdminSession, onClearSession }) {
  return (
    <main className="min-h-screen bg-auth-gradient px-5 py-10 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col items-center justify-center gap-8">
        <header className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">YourCompany</p>
          <h1 className="font-display text-5xl leading-none tracking-[-0.04em] text-slate-950 sm:text-6xl">
            Admin login
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-600">
            Sign in with your admin account to manage the store
          </p>
        </header>

        <AuthCard className="w-full max-w-xl">
          {adminError ? (
            <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
              {adminError}
            </p>
          ) : null}

          {adminMessage ? (
            <p className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {adminMessage}
            </p>
          ) : null}

          <form className="grid gap-5" onSubmit={onSubmit}>
            <AuthField
              id="admin-login-email"
              label="Email"
              type="email"
              placeholder="admin@example.com"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
            <AuthField
              id="admin-login-password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
            />
            <AuthButton type="submit" disabled={isAdminSubmitting}>
              {isAdminSubmitting ? "Signing in..." : "Login to dashboard"}
            </AuthButton>
          </form>

          {hasAdminSession ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link className="font-semibold text-slate-700 hover:text-slate-950" to="/admin/dashboard">
                Open dashboard
              </Link>
              <button type="button" className="font-semibold text-slate-500 hover:text-slate-900" onClick={onClearSession}>
                Clear session
              </button>
            </div>
          ) : null}
        </AuthCard>
      </section>
    </main>
  );
}

function AdminDashboardPage({
  adminOverview,
  adminProducts,
  adminForm,
  adminError,
  adminMessage,
  isAdminLoading,
  isAdminSubmitting,
  onFieldChange,
  onCreateProduct,
  onToggleProductStatus,
  onLogout,
}) {
  return (
    <main className="app-shell">
      <AppHeader
        title="Manage the protected admin dashboard."
        description="This route is reserved for admins only and uses the stored admin JWT to load product and system data."
        actions={
          <>
            <Link className="secondary-button button-link" to="/shop">
              Shop
            </Link>
            <button type="button" className="secondary-button" onClick={onLogout}>
              Log out
            </button>
          </>
        }
      />

      <section className="page-panel panel panel-admin">
        <div className="panel-header panel-header-split">
          <div>
            <p className="section-label">Admin</p>
            <h2>Dashboard</h2>
          </div>
          <div className="panel-actions">
            <p>{isAdminLoading ? "Syncing dashboard..." : "Admin session active"}</p>
          </div>
        </div>

        {adminError ? (
          <p className="error-message" role="alert">
            {adminError}
          </p>
        ) : null}

        {adminMessage ? <p className="success-message">{adminMessage}</p> : null}

        <div className="admin-grid">
          <section className="admin-card">
            <div className="panel-header">
              <div>
                <p className="section-label">Create</p>
                <h2>New product</h2>
              </div>
              <p>Add catalog items without leaving the dashboard route.</p>
            </div>

            <form className="admin-product-form" onSubmit={onCreateProduct}>
              <input
                type="text"
                placeholder="Name"
                value={adminForm.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
              />
              <input
                type="text"
                placeholder="Slug"
                value={adminForm.slug}
                onChange={(event) => onFieldChange("slug", event.target.value)}
              />
              <textarea
                rows="4"
                placeholder="Description"
                value={adminForm.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
              />

              <div className="admin-form-row">
                <input
                  type="text"
                  placeholder="Price"
                  value={adminForm.price}
                  onChange={(event) => onFieldChange("price", event.target.value)}
                />
                <input
                  type="text"
                  placeholder="Currency"
                  value={adminForm.currency}
                  onChange={(event) => onFieldChange("currency", event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Inventory"
                  value={adminForm.inventory_count}
                  onChange={(event) => onFieldChange("inventory_count", event.target.value)}
                />
              </div>

              <input
                type="url"
                placeholder="Image URL"
                value={adminForm.image_url}
                onChange={(event) => onFieldChange("image_url", event.target.value)}
              />

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={adminForm.is_active}
                  onChange={(event) => onFieldChange("is_active", event.target.checked)}
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
                <p className="section-label">Overview</p>
                <h2>System summary</h2>
              </div>
              <p>Protected counts and service links stay on the admin route.</p>
            </div>

            {adminOverview?.product_counts ? (
              <div className="admin-counts">
                <div>
                  <span>Total</span>
                  <strong>{adminOverview.product_counts.total}</strong>
                </div>
                <div>
                  <span>Active</span>
                  <strong>{adminOverview.product_counts.active}</strong>
                </div>
                <div>
                  <span>Inactive</span>
                  <strong>{adminOverview.product_counts.inactive}</strong>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Overview data will appear after the dashboard finishes loading.</p>
              </div>
            )}

            {adminOverview?.system_links?.length ? (
              <ul className="service-list admin-service-list">
                {adminOverview.system_links.map((link) => (
                  <li key={link.label}>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      <strong>{link.label}</strong>
                      <small>{link.url}</small>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <section className="admin-card admin-products-card">
          <div className="panel-header">
            <div>
              <p className="section-label">Catalog</p>
              <h2>Existing products</h2>
            </div>
            <p>Toggle product visibility directly from the protected dashboard.</p>
          </div>

          {adminProducts.length === 0 ? (
            <div className="empty-state">
              <p>No products created yet.</p>
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
                    {product.is_active ? "Active" : "Hidden"}
                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onToggleProductStatus(product)}
                    disabled={isAdminSubmitting}
                  >
                    {product.is_active ? "Hide" : "Publish"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => readLocalStorage(CART_STORAGE_KEY, []));
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [userToken, setUserToken] = useState(() => readToken(AUTH_TOKEN_STORAGE_KEY));
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

  const hasUserSession = Boolean(userToken);
  const hasAdminSession = Boolean(adminToken) && hasRole(adminToken, "admin");

  async function fetchProducts() {
    setIsProductsLoading(true);
    setProductError("");

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
      navigate("/admin", { replace: true });
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
      const data = await loginUser({ email: adminEmail.trim().toLowerCase(), password: adminPassword });
      if (!hasRole(data.access_token, "admin")) {
        throw new Error("This account does not have admin access.");
      }

      setAdminToken(data.access_token);
      setAdminMessage("Admin session ready.");
      await fetchAdminData(data.access_token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setAdminError(err.message || "Failed to sign in.");
      setAdminToken("");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  function handleUserLogout() {
    setUserToken("");
    navigate("/", { replace: true });
  }

  function handleAdminLogout() {
    setAdminToken("");
    setAdminOverview(null);
    setAdminProducts([]);
    setAdminMessage("Admin session cleared.");
    setAdminError("");
    navigate("/admin", { replace: true });
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
    if (hasAdminSession) {
      fetchAdminData(adminToken).catch(() => {});
    }
  }, [adminToken, hasAdminSession]);

  useEffect(() => {
    if (adminToken && !hasAdminSession) {
      setAdminToken("");
    }
  }, [adminToken, hasAdminSession]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthLanding
            authMode={authMode}
            setAuthMode={setAuthMode}
            userToken={userToken}
            setUserToken={setUserToken}
          />
        }
      />
      <Route
        path="/shop"
        element={
          <ProtectedRoute isAllowed={hasUserSession} redirectTo="/">
            <ShopPage
              products={products}
              cart={cart}
              isProductsLoading={isProductsLoading}
              productError={productError}
              cartCount={cartCount}
              cartSubtotal={cartSubtotal}
              onRefresh={() => fetchProducts()}
              onAddToCart={addToCart}
              onUpdateCartQuantity={updateCartQuantity}
              onRemoveFromCart={removeFromCart}
              onLogout={handleUserLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminLoginPage
            adminEmail={adminEmail}
            adminPassword={adminPassword}
            adminError={adminError}
            adminMessage={adminMessage}
            isAdminSubmitting={isAdminSubmitting}
            setAdminEmail={setAdminEmail}
            setAdminPassword={setAdminPassword}
            onSubmit={handleAdminLogin}
            hasAdminSession={hasAdminSession}
            onClearSession={handleAdminLogout}
          />
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute isAllowed={hasAdminSession} redirectTo="/admin">
            <AdminDashboardPage
              adminOverview={adminOverview}
              adminProducts={adminProducts}
              adminForm={adminForm}
              adminError={adminError}
              adminMessage={adminMessage}
              isAdminLoading={isAdminLoading}
              isAdminSubmitting={isAdminSubmitting}
              onFieldChange={(field, value) => setAdminForm((current) => ({ ...current, [field]: value }))}
              onCreateProduct={handleCreateProduct}
              onToggleProductStatus={toggleProductStatus}
              onLogout={handleAdminLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
