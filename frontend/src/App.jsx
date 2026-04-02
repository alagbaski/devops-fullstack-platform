import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { AUTH_TOKEN_STORAGE_KEY, loginUser } from "./api/auth";
import AuthButton from "./components/AuthButton";
import AuthCard from "./components/AuthCard";
import AuthField from "./components/AuthField";
import LoginPage from "./components/LoginPage";
import LogoMark from "./components/LogoMark";
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from "./components/SignupPage";

// Global Constants & Configuration
const API_URL = "/api";
const CART_STORAGE_KEY = "devops-platform-cart";
const ADMIN_TOKEN_STORAGE_KEY = "devops-platform-admin-token";

const supportEmail = "mailto:support@example.com";

// Default state for the product creation form
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

// Helper: Safely read and parse JSON from browser localStorage
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

// Helper: Read a raw string token from localStorage
function readToken(key) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) || "";
}

// Helper: Manually decode a JWT payload (base64) without a heavy library
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

// Helper: Check if a JWT contains a specific user role
function hasRole(token, expectedRole) {
  const payload = decodeTokenPayload(token);
  return payload?.role === expectedRole;
}

// Helper: Extract email from JWT payload for form pre-filling
function getTokenEmail(token) {
  const payload = decodeTokenPayload(token);
  return payload?.email || "";
}

// UI Component: Simple page header with title and intro text
function AppHeader({ title, description, actions }) {
  return (
    <section className="hero-card panel">
      <div className="hero-copy">
        <p className="eyebrow">DevOps Fullstack Platform</p>
        <h1>{title}</h1>
        <p className="intro">{description}</p>

        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
    </section>
  );
}

// UI Component: A sophisticated slide-out menu used for Shop and Admin navigation
function WorkspaceSidebar({
  badge,
  title,
  description,
  stats = [],
  links = [],
  actions = [],
  isOpen,
  onToggle,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Toggle workspace menu"
        className={`fixed top-5 z-[70] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900 lg:top-6 ${isOpen ? "left-[15.6rem]" : "left-5 lg:left-6"}`}
        onClick={onToggle}
      >
        <span className="grid gap-1.5">
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
        </span>
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[18.5rem] flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-slate-100 shadow-[0_24px_80px_rgba(15,23,42,0.35)] transition duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-4 border-b border-white/10 px-5 pb-5 pt-20">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-base font-bold text-white shadow-lg">
            OD
          </div>
          <div className={`min-w-0 transition duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">{badge}</div>
            <div className="mt-1 text-lg font-semibold text-white">{title}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className={`grid gap-5 transition duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-6 text-slate-300">{description}</p>
            </div>

            {stats.length ? (
              <div className="grid gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {links.length ? (
              <div className="grid gap-2">
                {links.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition duration-200 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
                      href={link.href}
                      onClick={onClose}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition duration-200 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
                      to={link.to}
                      onClick={onClose}
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`grid gap-2 border-t border-white/10 px-4 py-5 transition duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                action.tone === "danger"
                  ? "bg-white text-slate-950 hover:bg-slate-100"
                  : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              }`}
              onClick={() => {
                onClose();
                action.onClick();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

// UI Component: Animated background glows for Auth pages
function AuthBackdrop({ admin = false }) {
  const glowClasses = admin
    ? {
        top: "bg-indigo-500/20",
        middle: "bg-blue-500/20",
        bottom: "bg-slate-900/10",
      }
    : {
        top: "bg-blue-500/20",
        middle: "bg-indigo-500/20",
        bottom: "bg-cyan-400/15",
      };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full blur-3xl ${glowClasses.top}`} />
      <div className={`absolute right-[-5rem] top-1/3 h-72 w-72 rounded-full blur-3xl ${glowClasses.middle}`} />
      <div className={`absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl ${glowClasses.bottom}`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
    </div>
  );
}

// UI Component: Marketing panel shown next to Login/Signup forms
function AuthPromoPanel({ eyebrow, title, description, bullets, admin = false }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 p-8 shadow-[0_32px_120px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div
        aria-hidden="true"
        className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r ${admin ? "from-transparent via-indigo-400/70 to-transparent" : "from-transparent via-blue-400/70 to-transparent"}`}
      />
      <div className="relative grid gap-8">
        <div className="grid gap-4">
          <span className="mx-auto inline-flex w-fit rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-gray-600 shadow-sm xl:mx-0">
            {eyebrow}
          </span>
          <div className="grid gap-3">
            <h2 className="mx-auto max-w-[14ch] text-center text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl xl:mx-0 xl:text-left">
              {title}
            </h2>
            <p className="mx-auto max-w-xl text-center text-base leading-7 text-gray-500 xl:mx-0 xl:text-left">
              {description}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {bullets.map((bullet) => (
            <div
              key={bullet.title}
              className="grid gap-1 rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-sm font-semibold text-gray-900">{bullet.title}</div>
              <div className="text-sm leading-6 text-gray-500">{bullet.copy}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// UI Component: Handles product image display with a fallback for broken links
function ProductMedia({ product }) {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(product.image_url) && !hasImageError;

  return showImage ? (
    <div className="product-media">
      <img
        src={product.image_url}
        alt={product.name}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setHasImageError(true)}
      />
    </div>
  ) : (
    <div className="product-media product-media-fallback" aria-hidden="true">
      <span>{product.name.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

// Page Component: The first screen users see (Login/Signup toggle)
function AuthLanding({ authMode, setAuthMode, userToken, setUserToken }) {
  const navigate = useNavigate();
  const [authMessage, setAuthMessage] = useState("");

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10 sm:px-6 lg:px-8">
      <AuthBackdrop />
      <section className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 py-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] xl:gap-10">
        <div className="grid gap-8">
          <div className="grid gap-6">
            <LogoMark />

            <header className="grid gap-4 text-center xl:text-left">
              <h1 className="mx-auto max-w-[16ch] text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl xl:mx-0 xl:max-w-none xl:whitespace-nowrap">
                Welcome to your developer store
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-gray-500 xl:mx-0">
                Sign in or create an account to access curated tooling, developer resources, and a cleaner workflow.
              </p>
            </header>
          </div>

          <AuthPromoPanel
            eyebrow="Premium SaaS Workflow"
            title="Built for engineers who want clarity."
            description="OPSDEV brings store access, account flow, and admin tooling into one consistent product experience with a cleaner front door."
            bullets={[
              {
                title: "One polished entry point",
                copy: "Users can sign in or create an account without leaving the same focused workspace.",
              },
              {
                title: "Technical, not noisy",
                copy: "The interface stays minimal while still feeling premium, branded, and intentional.",
              },
              {
                title: "Ready for protected flows",
                copy: "Shoppers continue into the catalog, while admins stay on their own controlled path.",
              },
            ]}
          />
        </div>

        <div className="mx-auto grid w-full max-w-md gap-5 xl:max-w-none">
          <AuthCard className="w-full">
            <div className="space-y-5">
              <div className="flex w-full justify-center">
                <div className="inline-flex w-full max-w-[17rem] rounded-full border border-white/70 bg-gray-100/90 p-1 shadow-sm">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === "login"}
                    className={`flex-1 rounded-full px-5 py-2 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      authMode === "login"
                        ? "bg-white text-gray-900 shadow-md"
                        : "text-gray-500 hover:text-gray-900"
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
                    className={`flex-1 rounded-full px-5 py-2 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      authMode === "signup"
                        ? "bg-white text-gray-900 shadow-md"
                        : "text-gray-500 hover:text-gray-900"
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
                <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
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

              {userToken ? (
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <Link
                    className="font-medium text-gray-900 transition duration-200 hover:text-blue-600"
                    to="/shop"
                  >
                    Continue to shop
                  </Link>
                  <button
                    type="button"
                    className="font-medium text-gray-500 transition duration-200 hover:text-gray-900"
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

          <div className="text-center text-sm text-gray-500 xl:text-left">
            Need help?{" "}
            <a
              className="font-medium text-gray-900 transition duration-200 hover:text-blue-600"
              href={supportEmail}
            >
              Contact support
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

// Page Component: The main customer shopping experience
function ShopPage({ products, cart, isProductsLoading, productError, cartCount, cartSubtotal, onRefresh, onAddToCart, onUpdateCartQuantity, onRemoveFromCart, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <WorkspaceSidebar
        badge="Storefront"
        title="OPSDEV Shop"
        description="Move through your signed-in workspace with a proper app menu instead of a floating utility drawer."
        stats={[
          { label: "Products", value: isProductsLoading ? "..." : products.length },
          { label: "Cart Items", value: cartCount },
          { label: "Subtotal", value: `USD ${cartSubtotal.toFixed(2)}` },
        ]}
        links={[
          { label: "Account home", to: "/" },
          { label: "Catalog", href: "#shop-catalog" },
          { label: "Cart", href: "#shop-cart" },
          { label: "Support", to: "/support" },
          { label: "Admin login", to: "/admin" },
        ]}
        actions={[
          { label: isProductsLoading ? "Refreshing..." : "Refresh catalog", onClick: onRefresh },
          { label: "Log out", onClick: onLogout, tone: "danger" },
        ]}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className={`app-shell px-4 pb-8 pt-24 transition-all duration-300 sm:px-6 lg:pr-8 ${isSidebarOpen ? "lg:pl-[20.5rem]" : "lg:pl-24"}`}>
      <AppHeader
        title="Browse the protected storefront."
        description="Signed-in users can browse active products and keep a simple cart in local storage."
      />

      <section className="workspace-grid workspace-grid-store">
        <section id="shop-catalog" className="panel panel-products scroll-mt-24">
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
                    <ProductMedia product={product} />

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

        <section id="shop-cart" className="panel panel-cart scroll-mt-24">
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
    </>
  );
}

// Page Component: Support and Contact forms for users
function SupportPage({
  feedbackText,
  feedbackError,
  feedbackSuccess,
  isFeedbackSubmitting,
  contactForm,
  contactError,
  contactSuccess,
  isContactSubmitting,
  onFeedbackChange,
  onSubmitFeedback,
  onContactFieldChange,
  onSubmitContact,
  onLogout,
}) {
  return (
    <main className="app-shell">
      <AppHeader
        title="Reach the team without leaving the store."
        description="Send a message to the admin or dev team when you need help with the storefront, account access, or product issues."
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

      <section className="workspace-grid">
        <section className="panel panel-home">
          <div className="panel-header">
            <div>
              <p className="section-label">Support</p>
              <h2>Send feedback</h2>
            </div>
            <p>Messages go straight into the protected admin inbox.</p>
          </div>

          {feedbackError ? (
            <p className="error-message" role="alert">
              {feedbackError}
            </p>
          ) : null}

          {feedbackSuccess ? <p className="success-message">{feedbackSuccess}</p> : null}

          <form className="admin-product-form" onSubmit={onSubmitFeedback}>
            <textarea
              rows="8"
              placeholder="Tell us what you need help with."
              value={feedbackText}
              onChange={(event) => onFeedbackChange(event.target.value)}
            />
            <button type="submit" disabled={isFeedbackSubmitting}>
              {isFeedbackSubmitting ? "Sending..." : "Send message"}
            </button>
          </form>
        </section>

        <section className="panel panel-home">
          <div className="panel-header">
            <div>
              <p className="section-label">Contact</p>
              <h2>Email support</h2>
            </div>
            <p>Queue an email for the support team when you need a direct follow-up.</p>
          </div>

          {contactError ? (
            <p className="error-message" role="alert">
              {contactError}
            </p>
          ) : null}

          {contactSuccess ? <p className="success-message">{contactSuccess}</p> : null}

          <form className="admin-product-form" onSubmit={onSubmitContact}>
            <input
              type="email"
              placeholder="Your email"
              value={contactForm.email}
              onChange={(event) => onContactFieldChange("email", event.target.value)}
            />
            <input
              type="text"
              placeholder="Subject"
              value={contactForm.subject}
              onChange={(event) => onContactFieldChange("subject", event.target.value)}
            />
            <textarea
              rows="6"
              placeholder="How can we help?"
              value={contactForm.message}
              onChange={(event) => onContactFieldChange("message", event.target.value)}
            />
            <button type="submit" disabled={isContactSubmitting}>
              {isContactSubmitting ? "Queueing..." : "Email support"}
            </button>
          </form>

          <ul className="service-list">
            <li>
              <a href={supportEmail}>
                <strong>Support inbox</strong>
                <small>{supportEmail.replace("mailto:", "")}</small>
              </a>
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}

// Page Component: Specialized login screen for Admin access
function AdminLoginPage({ adminUsername, adminPassword, adminError, adminMessage, isAdminSubmitting, setAdminUsername, setAdminPassword, onSubmit, hasAdminSession, onClearSession }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-100 px-4 py-10 sm:px-6 lg:px-8">
      <AuthBackdrop admin />
      <section className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 py-8 xl:grid-cols-[minmax(380px,0.95fr)_minmax(0,1.05fr)] xl:gap-10">
        <div className="order-2 mx-auto grid w-full max-w-md gap-5 xl:order-1 xl:max-w-none">
          <AuthCard className="w-full">
            {adminError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
                {adminError}
              </p>
            ) : null}

            {adminMessage ? (
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                {adminMessage}
              </p>
            ) : null}

            <form className="grid gap-5" onSubmit={onSubmit}>
              <AuthField
                id="admin-login-username"
                label="Username"
                type="text"
                placeholder="admin"
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
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

            <p className="text-center text-sm text-gray-500">
              Admin access is restricted to authorized usernames only.
            </p>

            {hasAdminSession ? (
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <Link className="font-medium text-gray-900 transition duration-200 hover:text-blue-600" to="/admin/dashboard">
                  Open dashboard
                </Link>
                <button
                  type="button"
                  className="font-medium text-gray-500 transition duration-200 hover:text-gray-900"
                  onClick={onClearSession}
                >
                  Clear session
                </button>
              </div>
            ) : null}
          </AuthCard>

          <div className="text-center text-sm text-gray-500 xl:text-left">
            Need help?{" "}
            <a
              className="font-medium text-gray-900 transition duration-200 hover:text-blue-600"
              href={supportEmail}
            >
              Contact support
            </a>
          </div>
        </div>

        <div className="order-1 grid gap-8 xl:order-2">
          <div className="grid gap-6">
            <LogoMark />

            <header className="grid gap-4 text-center xl:text-left">
              <h1 className="mx-auto max-w-[14ch] text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl xl:mx-0 xl:max-w-none xl:whitespace-nowrap">
                Admin access portal
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-gray-500 xl:mx-0">
                Sign in with your admin username to manage protected workflows, product publishing, and platform visibility.
              </p>
            </header>
          </div>

          <AuthPromoPanel
            admin
            eyebrow="Controlled Workspace"
            title="A cleaner gate for privileged actions."
            description="The admin experience keeps the same OPSDEV visual language, but with a sharper operational tone for restricted access."
            bullets={[
              {
                title: "Username-only admin access",
                copy: "The dashboard path is tuned for operational control and avoids the public login pattern.",
              },
              {
                title: "Consistent product identity",
                copy: "Admin screens now feel like part of the same platform instead of a separate utility page.",
              },
              {
                title: "Sharper hierarchy",
                copy: "Brand, message, and action areas are separated more clearly for a more premium first impression.",
              },
            ]}
          />
        </div>
      </section>
    </main>
  );
}

// Page Component: Privileged dashboard for product and system management
function AdminDashboardPage({
  adminOverview,
  adminProducts,
  adminFeedback,
  adminForm,
  adminError,
  adminMessage,
  isAdminLoading,
  isAdminSubmitting,
  isImageUploading,
  onFieldChange,
  onCreateProduct,
  onUploadProductImage,
  onToggleProductStatus,
  onDeleteProduct,
  onLogout,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <WorkspaceSidebar
        badge="Operations"
        title="OPSDEV Admin"
        description="Use the left workspace rail to move through admin actions the way a proper application shell should behave."
        stats={[
          { label: "Total Products", value: adminOverview?.product_counts?.total ?? "..." },
          { label: "Active", value: adminOverview?.product_counts?.active ?? "..." },
          { label: "Feedback", value: adminFeedback.length },
        ]}
        links={[
          { label: "Back to shop", to: "/shop" },
          { label: "Create product", href: "#admin-create" },
          { label: "Overview", href: "#admin-overview" },
          { label: "Catalog", href: "#admin-products" },
          { label: "Inbox", href: "#admin-feedback" },
        ]}
        actions={[
          { label: "Log out", onClick: onLogout, tone: "danger" },
        ]}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className={`app-shell px-4 pb-8 pt-24 transition-all duration-300 sm:px-6 lg:pr-8 ${isSidebarOpen ? "lg:pl-[20.5rem]" : "lg:pl-24"}`}>
      <AppHeader
        title="Manage the protected admin dashboard."
        description="This route is reserved for admins only and uses the stored admin JWT to load product and system data."
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
          <section id="admin-create" className="admin-card scroll-mt-24">
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

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Upload image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  onChange={(event) => onUploadProductImage(event.target.files?.[0] || null)}
                  disabled={isImageUploading || isAdminSubmitting}
                />
              </label>

              {adminForm.image_url ? (
                <div className="admin-upload-preview">
                  <img src={adminForm.image_url} alt="Product preview" className="h-full w-full object-cover" />
                </div>
              ) : null}

              {isImageUploading ? (
                <p className="text-sm text-slate-500">Uploading image...</p>
              ) : null}

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

          <section id="admin-overview" className="admin-card scroll-mt-24">
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

        <section id="admin-products" className="admin-card admin-products-card scroll-mt-24">
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

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onDeleteProduct(product)}
                    disabled={isAdminSubmitting}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="admin-feedback" className="admin-card admin-products-card scroll-mt-24">
          <div className="panel-header">
            <div>
              <p className="section-label">Support Inbox</p>
              <h2>User feedback</h2>
            </div>
            <p>Latest customer messages sent from the storefront support page.</p>
          </div>

          {adminFeedback.length === 0 ? (
            <div className="empty-state">
              <p>No feedback messages yet.</p>
            </div>
          ) : (
            <ul className="admin-product-list">
              {adminFeedback.map((entry) => (
                <li key={entry.id} className="xl:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <strong>User #{entry.user_id}</strong>
                    <p>{entry.message}</p>
                  </div>
                  <span className="section-label">{new Date(entry.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
      </main>
    </>
  );
}

// THE MAIN APPLICATION COMPONENT
export default function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => readLocalStorage(CART_STORAGE_KEY, []));
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [userToken, setUserToken] = useState(() => readToken(AUTH_TOKEN_STORAGE_KEY));
  const [adminToken, setAdminToken] = useState(() => readToken(ADMIN_TOKEN_STORAGE_KEY));
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("change-me-too");
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminFeedback, setAdminFeedback] = useState([]);
  const [adminForm, setAdminForm] = useState(initialAdminForm);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState(() => ({
    email: getTokenEmail(readToken(AUTH_TOKEN_STORAGE_KEY)),
    subject: "",
    message: "",
  }));
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  // useMemo prevents expensive re-calculations of cart totals unless 'cart' changes
  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  // Calculate total price of all items in the cart
  const cartSubtotal = useMemo(
    () => cart.reduce((total, item) => total + item.quantity * Number(item.price), 0),
    [cart]
  );

  // Session Checks: Convert tokens into booleans for UI logic
  const hasUserSession = Boolean(userToken);
  const hasAdminSession = Boolean(adminToken) && hasRole(adminToken, "admin");

  // API Logic: Fetch the public product list
  async function fetchProducts() {
    setIsProductsLoading(true); // Start loading state
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

  // Cart Logic: Add item or increment quantity if already present
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

  // Cart Logic: Adjust quantity or remove item if quantity drops to 0
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

  // Cart Logic: Instant removal of a product
  function removeFromCart(productId) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  }

  // Admin Logic: Fetch protected dashboard data (overview, catalog, feedback)
  async function fetchAdminData(token = adminToken) {
    if (!token) {
      return;
    }

    setIsAdminLoading(true);
    setAdminError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [overviewResponse, productsResponse, feedbackResponse] = await Promise.all([
        fetch(`${API_URL}/v1/admin/overview`, { headers }),
        fetch(`${API_URL}/v1/products/admin`, { headers }),
        fetch(`${API_URL}/v1/feedback`, { headers }),
      ]);

      // Check for authentication failures
      if ([overviewResponse, productsResponse, feedbackResponse].some((response) => response.status === 401 || response.status === 403)) {
        throw new Error("Admin session expired or does not have access.");
      }

      if (!overviewResponse.ok || !productsResponse.ok || !feedbackResponse.ok) {
        throw new Error("Failed to load admin dashboard.");
      }

      const [overviewData, productsData, feedbackData] = await Promise.all([
        overviewResponse.json(),
        productsResponse.json(),
        feedbackResponse.json(),
      ]);

      setAdminOverview(overviewData);
      setAdminProducts(Array.isArray(productsData) ? productsData : []);
      setAdminFeedback(Array.isArray(feedbackData) ? feedbackData : []);
    } catch (err) {
      setAdminError(err.message || "Failed to load admin dashboard.");
      setAdminToken("");
      setAdminOverview(null);
      setAdminProducts([]);
      setAdminFeedback([]);
      navigate("/admin", { replace: true });
    } finally {
      setIsAdminLoading(false);
    }
  }

  // Admin Logic: Authenticate specifically for administrative access
  async function handleAdminLogin(event) {
    event.preventDefault();
    setIsAdminSubmitting(true);
    setAdminError("");
    setAdminMessage("");

    try {
      const data = await loginUser({ identifier: adminUsername.trim().toLowerCase(), password: adminPassword });
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

  // Logout Logic: Clear tokens and redirect to landing
  function handleUserLogout() {
    setUserToken("");
    navigate("/", { replace: true });
  }

  // Logout Logic: Reset all admin state
  function handleAdminLogout() {
    setAdminToken("");
    setAdminOverview(null);
    setAdminProducts([]);
    setAdminFeedback([]);
    setAdminMessage("Admin session cleared.");
    setAdminError("");
    navigate("/admin", { replace: true });
  }

  // Product Logic: Upload image to server and update form state
  async function handleUploadProductImage(file) {
    if (!file) {
      return;
    }

    setIsImageUploading(true);
    setAdminError("");
    setAdminMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/v1/products/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to upload image.");
      }

      const data = await response.json();
      setAdminForm((current) => ({
        ...current,
        image_url: data.image_url || "",
      }));
      setAdminMessage("Image uploaded and attached to the product form.");
    } catch (err) {
      setAdminError(err.message || "Failed to upload image.");
    } finally {
      setIsImageUploading(false);
    }
  }

  // Feedback Logic: Submit user message to database
  async function handleSubmitFeedback(event) {
    event.preventDefault();
    setIsFeedbackSubmitting(true);
    setFeedbackError("");
    setFeedbackSuccess("");

    try {
      const trimmedMessage = feedbackText.trim();
      if (!trimmedMessage) {
        throw new Error("Please enter a message before sending.");
      }

      const response = await fetch(`${API_URL}/v1/feedback`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to send feedback.");
      }

      setFeedbackText("");
      setFeedbackSuccess("Your message has been sent to the team.");

      if (hasAdminSession) {
        await fetchAdminData();
      }
    } catch (err) {
      setFeedbackError(err.message || "Failed to send feedback.");
    } finally {
      setIsFeedbackSubmitting(false);
    }
  }

  // Support Logic: Queue an email in the background worker
  async function handleSubmitContact(event) {
    event.preventDefault();
    setIsContactSubmitting(true);
    setContactError("");
    setContactSuccess("");

    try {
      const payload = {
        email: contactForm.email.trim().toLowerCase(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
      };

      if (!payload.email || !payload.subject || !payload.message) {
        throw new Error("Please complete the email, subject, and message fields.");
      }

      const response = await fetch(`${API_URL}/v1/support/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to queue support email.");
      }

      setContactForm((current) => ({
        ...current,
        subject: "",
        message: "",
      }));
      setContactSuccess("Support email queued successfully.");
    } catch (err) {
      setContactError(err.message || "Failed to queue support email.");
    } finally {
      setIsContactSubmitting(false);
    }
  }

  // Admin Logic: POST new product to the catalog
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

  // Admin Logic: Toggle product visibility (is_active)
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

  // Admin Logic: Permanent product deletion
  async function handleDeleteProduct(product) {
    setIsAdminSubmitting(true);
    setAdminError("");
    setAdminMessage("");

    try {
      const response = await fetch(`${API_URL}/v1/products/${product.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete product.");
      }

      setAdminMessage("Product deleted.");
      await Promise.all([fetchProducts(), fetchAdminData()]);
    } catch (err) {
      setAdminError(err.message || "Failed to delete product.");
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  // Effect: Initial product load on app mount
  useEffect(() => {
    fetchProducts().catch((err) => {
      setProductError(err.message || "Failed to load products.");
    });
  }, []);

  // Effect: Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  // Effect: Sync userToken state with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (userToken) {
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, userToken);
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    }
  }, [userToken]);

  // Effect: Automatically update contact email when user logs in
  useEffect(() => {
    const tokenEmail = getTokenEmail(userToken);
    setContactForm((current) => ({
      ...current,
      email: tokenEmail || current.email,
    }));
  }, [userToken]);

  // Effect: Sync adminToken state with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (adminToken) {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, adminToken);
      } else {
        window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      }
    }
  }, [adminToken]);

  // Effect: Validate cart items against the latest product list (remove inactive/deleted items)
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

  // Effect: Fetch admin data if a valid admin session exists
  useEffect(() => {
    if (hasAdminSession) {
      fetchAdminData(adminToken).catch(() => {});
    }
  }, [adminToken, hasAdminSession]);

  // Effect: Auto-logout admin if the token expires or is invalid
  useEffect(() => {
    if (adminToken && !hasAdminSession) {
      setAdminToken("");
    }
  }, [adminToken, hasAdminSession]);

  // Routing Configuration
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
        path="/support"
        element={
          <ProtectedRoute isAllowed={hasUserSession} redirectTo="/">
            <SupportPage
              feedbackText={feedbackText}
              feedbackError={feedbackError}
              feedbackSuccess={feedbackSuccess}
              isFeedbackSubmitting={isFeedbackSubmitting}
              contactForm={contactForm}
              contactError={contactError}
              contactSuccess={contactSuccess}
              isContactSubmitting={isContactSubmitting}
              onFeedbackChange={(value) => setFeedbackText(value)}
              onSubmitFeedback={handleSubmitFeedback}
              onContactFieldChange={(field, value) =>
                setContactForm((current) => ({ ...current, [field]: value }))
              }
              onSubmitContact={handleSubmitContact}
              onLogout={handleUserLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminLoginPage
            adminUsername={adminUsername}
            adminPassword={adminPassword}
            adminError={adminError}
            adminMessage={adminMessage}
            isAdminSubmitting={isAdminSubmitting}
            setAdminUsername={setAdminUsername}
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
              adminFeedback={adminFeedback}
              adminForm={adminForm}
              adminError={adminError}
              adminMessage={adminMessage}
              isAdminLoading={isAdminLoading}
              isAdminSubmitting={isAdminSubmitting}
              isImageUploading={isImageUploading}
              onFieldChange={(field, value) => setAdminForm((current) => ({ ...current, [field]: value }))}
              onCreateProduct={handleCreateProduct}
              onUploadProductImage={handleUploadProductImage}
              onToggleProductStatus={toggleProductStatus}
              onDeleteProduct={handleDeleteProduct}
              onLogout={handleAdminLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
