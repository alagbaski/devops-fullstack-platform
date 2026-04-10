import * as React from "react";
import { useEffect, useMemo, useState, ReactNode, FormEvent, ChangeEvent } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AUTH_TOKEN_STORAGE_KEY, loginUser } from "./api/auth";
import AuthButton from "./components/AuthButton";
import AuthCard from "./components/AuthCard";
import AuthField from "./components/AuthField";
import LoginPage from "./components/LoginPage";
import LogoMark from "./components/LogoMark";
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from "./components/SignupPage";

// Types & Interfaces
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  currency: string;
  inventory_count: number;
  image_url: string;
  is_active: boolean;
}

export interface CartItem extends Pick<Product, "id" | "name" | "currency" | "inventory_count"> {
  price: number;
  quantity: number;
}

export interface AdminOverview {
  product_counts: {
    total: number;
    active: number;
    inactive: number;
  };
  system_links: {
    label: string;
    url: string;
  }[];
}

export interface FeedbackEntry {
  id: number;
  user_id: number;
  message: string;
  created_at: string;
}

// Global Constants & Configuration
const API_URL = "/api";
const CART_STORAGE_KEY = "devops-platform-cart";
const ADMIN_TOKEN_STORAGE_KEY = "devops-platform-admin-token";

const supportEmailAddress = import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com";
const supportEmail = `mailto:${supportEmailAddress}`;

// Default state for the product creation form
const initialAdminForm: Omit<Product, "id"> = {
  name: "",
  slug: "",
  description: "",
  price: "19.99",
  currency: "USD",
  inventory_count: 5,
  image_url: "",
  is_active: true,
};

// Helper: Safely read and parse JSON from browser localStorage
function readLocalStorage<T>(key: string, fallback: T): T {
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
function readToken(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) || "";
}

// Helper: Manually decode a JWT payload (base64) without a heavy library
function decodeTokenPayload(token: string | null): any {
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
function hasRole(token: string | null, expectedRole: string): boolean {
  const payload = decodeTokenPayload(token);
  return payload?.role === expectedRole;
}

// Helper: Extract email from JWT payload for form pre-filling
function getTokenEmail(token: string | null): string {
  const payload = decodeTokenPayload(token);
  return payload?.email || "";
}

function isTokenExpired(token: string | null): boolean {
  const payload = decodeTokenPayload(token);
  const exp = payload?.exp;
  if (!exp || typeof exp !== "number") {
    return true;
  }

  return exp * 1000 <= Date.now();
}

function isUserSessionToken(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeTokenPayload(token);
  return Boolean(payload) && payload?.role !== "admin" && !isTokenExpired(token);
}

function isAdminSessionToken(token: string | null): boolean {
  return Boolean(token) && hasRole(token, "admin") && !isTokenExpired(token);
}

interface AppHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

// UI Component: Simple page header with title and intro text
function AppHeader({ title, description, actions }: AppHeaderProps) {
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

function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__brand">
          <span className="app-footer__mark">OD</span>
          <span>&copy; {currentYear} OPSDEV, Inc.</span>
        </div>

        <nav aria-label="Footer" className="app-footer__nav">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/support">Support</Link>
          <Link to="/admin">Admin</Link>
          <a href={supportEmail}>Contact</a>
          <a href={supportEmail}>Privacy</a>
          <a href={supportEmail}>Terms</a>
          <a href={supportEmail}>Security</a>
        </nav>
      </div>
    </footer>
  );
}

interface WorkspaceSidebarProps {
  badge: string;
  title: string;
  description: string;
  stats?: { label: string; value: string | number }[];
  links?: ({ label: string; href: string } | { label: string; to: string })[];
  actions?: { label: string; onClick: () => void; tone?: "primary" | "danger" }[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
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
}: WorkspaceSidebarProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
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
        className={`fixed top-5 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white/65 text-slate-800 shadow-[0_18px_45px_rgba(59,130,246,0.14)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/80 lg:top-6 ${isOpen ? "left-[12.95rem]" : "left-5 lg:left-6"}`}
        onClick={onToggle}
      >
        <span className="grid gap-1.5">
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
        </span>
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[16rem] flex-col overflow-hidden border-r border-slate-800/80 bg-slate-950 text-slate-100 shadow-[0_26px_90px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-4 border-b border-white/5 px-6 pb-6 pt-16">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-black text-white shadow-lg ring-1 ring-white/10">
            OD
          </div>
          <div className={`min-w-0 transition duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-indigo-400">{badge}</div>
            <div className="mt-0.5 text-lg font-bold tracking-tight text-white">{title}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className={`grid gap-8 transition duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="px-3">
              <p className="text-sm leading-relaxed text-slate-400">{description}</p>
            </div>

            {stats.length ? (
              <div className="grid gap-3 px-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </span>
                    <strong className="text-lg text-white">{stat.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {links.length ? (
              <div className="grid gap-1">
                <div className="px-3 mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Navigation</div>
                {links.map((link) => {
                  const linkClass = "group flex items-center rounded-xl px-4 py-3 text-[0.95rem] font-semibold text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white";
                  return "href" in link ? (
                    <a key={link.label} className={linkClass} href={link.href} onClick={onClose}>
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} className={linkClass} to={link.to} onClick={onClose}>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`grid gap-3 border-t border-white/5 bg-slate-900 px-6 py-6 transition duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`rounded-xl px-4 py-3 text-[0.95rem] font-semibold transition duration-200 ${
                action.tone === "danger"
                  ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 ring-1 ring-rose-500/30"
                  : "bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/10"
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

interface AuthBackdropProps {
  admin?: boolean;
}

// UI Component: Animated background glows for Auth pages
function AuthBackdrop({ admin = false }: AuthBackdropProps) {
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

interface AuthPromoPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets: { title: string; copy: string }[];
  admin?: boolean;
}

// UI Component: Marketing panel shown next to Login/Signup forms
function AuthPromoPanel({ eyebrow, title, description, bullets, admin = false }: AuthPromoPanelProps) {
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
function ProductMedia({ product }: { product: Product }) {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(product.image_url) && !hasImageError;

  return showImage ? (
    <div className="product-media">
      <img
        src={product.image_url as string}
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

interface AuthLandingProps {
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
  userToken: string | null;
  setUserToken: (token: string | null) => void;
}

// Page Component: The first screen users see (Login/Signup toggle)
function AuthLanding({ authMode, setAuthMode, userToken, setUserToken }: AuthLandingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMessage, setAuthMessage] = useState<string>("");
  const checkoutIntent = location.state && (location.state as { reason?: string }).reason === "checkout";

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

              {checkoutIntent && !authMessage ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Sign in or create an account to continue to checkout.
                </p>
              ) : null}

              {authMode === "login" ? (
                <LoginPage
                  onSuccess={(data) => {
                    setUserToken(data.access_token);
                    setAuthMessage("Welcome back. Redirecting to the storefront.");
                    navigate("/", { replace: true });
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

              {isUserSessionToken(userToken) ? (
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
      <AppFooter />
    </main>
  );
}

interface ShopPageProps {
  products: Product[];
  cart: CartItem[];
  isProductsLoading: boolean;
  productError: string;
  cartCount: number;
  cartSubtotal: number;
  hasUserSession: boolean;
  onRefresh: () => void;
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: number, nextQuantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onStartCheckout: () => void;
  onOpenAccount: () => void;
  onLogout: () => void;
}

// Page Component: The main customer shopping experience
function ShopPage({
  products,
  cart,
  isProductsLoading,
  productError,
  cartCount,
  cartSubtotal,
  hasUserSession,
  onRefresh,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onStartCheckout,
  onOpenAccount,
  onLogout,
}: ShopPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const featuredProducts = products.slice(0, 3);

  return (
    <>
      <WorkspaceSidebar
        badge="Storefront"
        title="OPSDEV Shop"
        description="Browse the public storefront first, save items locally, and move into account-gated flows only when you are ready to check out."
        stats={[
          { label: "Products", value: isProductsLoading ? "..." : products.length },
          { label: "Cart Items", value: cartCount },
          { label: "Subtotal", value: `USD ${cartSubtotal.toFixed(2)}` },
        ]}
        links={[
          { label: "Storefront home", to: "/" },
          { label: "Catalog", href: "#shop-catalog" },
          { label: "Cart", href: "#shop-cart" },
          { label: hasUserSession ? "Support" : "Account access", to: hasUserSession ? "/support" : "/account" },
          { label: "Admin login", to: "/admin" },
        ]}
        actions={[
          { label: isProductsLoading ? "Refreshing..." : "Refresh catalog", onClick: onRefresh },
          hasUserSession
            ? { label: "Log out", onClick: onLogout, tone: "danger" }
            : { label: "Sign in", onClick: onOpenAccount },
        ]}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className={`app-shell px-4 pb-8 pt-24 transition-all duration-300 sm:px-6 lg:pr-8 ${isSidebarOpen ? "lg:pl-[17rem]" : "lg:pl-24"}`}>
      <section className="mx-auto mb-12 grid w-full max-w-7xl gap-5 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-center text-white shadow-2xl relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px] opacity-30"></div>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-indigo-600/30 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-purple-600/30 blur-[100px]"></div>
        
        <div className="relative z-10 px-6 py-20 lg:py-28">
          <span className="mb-6 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-5 py-2 text-sm font-bold tracking-widest text-indigo-300 uppercase">
            {hasUserSession ? "Welcome Back, Engineer" : "Premium Developer Store"}
          </span>
          <h1 className="font-display mb-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            Ship faster with curated <br className="hidden lg:block"/> production workflow tools
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-indigo-200/80 sm:text-xl">
            Blend infrastructure utilities, team kits, and operational assets into one cleaner purchasing experience. Browse our full catalog below and save items instantly to your cart.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <button
              type="button"
              className="relative overflow-hidden rounded-[1.2rem] bg-white px-8 py-4 text-[1.1rem] font-bold text-indigo-950 shadow-[0_10px_25px_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[0_15px_30px_rgba(255,255,255,0.25)] disabled:cursor-wait disabled:opacity-70"
              onClick={onRefresh}
              disabled={isProductsLoading}
            >
              {isProductsLoading ? "Refreshing..." : "Shop The Collection"}
            </button>
            {hasUserSession ? (
              <button
                type="button"
                className="rounded-[1.2rem] border border-white/20 bg-white/5 px-8 py-4 text-[1.1rem] font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10"
                onClick={onLogout}
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                className="rounded-[1.2rem] border border-white/20 bg-white/5 px-8 py-4 text-[1.1rem] font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10"
                onClick={onOpenAccount}
              >
                Sign Up / Login
              </button>
            )}
          </div>
        </div>
      </section>

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
              <p>The storefront is waiting for the first product drop.</p>
              <small>Publish products from the admin dashboard and this page will turn into the public shop experience.</small>
            </div>
          ) : (
            <div className="product-grid storefront-product-grid">
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

                    <div className="product-card-insight">
                      <span>{product.slug}</span>
                      <small>{product.is_active ? "Live in the storefront" : "Not published"}</small>
                    </div>

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
              <h2>Cart</h2>
            </div>
            <p>{cartCount === 0 ? "No products selected yet." : `${cartCount} item${cartCount === 1 ? "" : "s"} in cart.`}</p>
          </div>

          <div className="storefront-checkout-banner">
            <div>
              <strong>{hasUserSession ? "Checkout path unlocked" : "Browse freely, sign in when you are ready."}</strong>
              <p>
                {hasUserSession
                  ? "Your cart is ready for account-gated next steps."
                  : "Guests can collect items first. We only ask for login when you continue to checkout or support flows."}
              </p>
            </div>
            <button type="button" className="secondary-button" onClick={hasUserSession ? onStartCheckout : onOpenAccount}>
              Checkout
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              <p>Your cart is empty.</p>
              <small>Add products from the storefront to keep them saved locally while you browse.</small>
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
      <AppFooter />
      </main>
    </>
  );
}

interface SupportPageProps {
  feedbackText: string;
  feedbackError: string;
  feedbackSuccess: string;
  isFeedbackSubmitting: boolean;
  contactForm: { email: string; subject: string; message: string };
  contactError: string;
  contactSuccess: string;
  isContactSubmitting: boolean;
  onFeedbackChange: (text: string) => void;
  onSubmitFeedback: (event: React.FormEvent) => void;
  onContactFieldChange: (field: string, value: string) => void;
  onSubmitContact: (event: React.FormEvent) => void;
  onLogout: () => void;
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
}: SupportPageProps) {
  return (
    <main className="app-shell">
      <AppHeader
        title="Reach the team without leaving the store."
        description="Send a message to the admin or dev team when you need help with the storefront, account access, or product issues."
        actions={
          <>
            <Link className="secondary-button button-link" to="/">
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
              rows={8}
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
              rows={6}
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
                <small>{supportEmailAddress}</small>
              </a>
            </li>
          </ul>
        </section>
      </section>
      <AppFooter />
    </main>
  );
}

interface AdminLoginPageProps {
  adminUsername: string;
  adminPassword: string;
  adminError: string;
  adminMessage: string;
  isAdminSubmitting: boolean;
  setAdminUsername: (username: string) => void;
  setAdminPassword: (password: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  hasAdminSession: boolean;
  onClearSession: () => void;
}

// Page Component: Specialized login screen for Admin access
function AdminLoginPage({
  adminUsername,
  adminPassword,
  adminError,
  adminMessage,
  isAdminSubmitting,
  setAdminUsername,
  setAdminPassword,
  onSubmit,
  hasAdminSession,
  onClearSession,
}: AdminLoginPageProps) {
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
      <AppFooter />
    </main>
  );
}

interface AdminDashboardPageProps {
  adminOverview: AdminOverview | null;
  adminProducts: Product[];
  adminFeedback: FeedbackEntry[];
  adminForm: Omit<Product, "id">;
  adminError: string;
  adminMessage: string;
  isAdminLoading: boolean;
  isAdminSubmitting: boolean;
  isImageUploading: boolean;
  onFieldChange: (field: string, value: any) => void;
  onCreateProduct: (event: React.FormEvent) => void;
  onUploadProductImage: (file: File | null) => void;
  onToggleProductStatus: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onLogout: () => void;
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
}: AdminDashboardPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (adminForm.name === "" && adminForm.description === "") {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [adminForm.name, adminForm.description]);

  return (
    <>
      <WorkspaceSidebar
        badge="Operations"
        title="OPSDEV Admin"
        description="Use the left workspace rail to rapidly navigate through protected admin modules."
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

      <main className={`app-shell px-4 pb-8 pt-24 transition-all duration-300 sm:px-6 lg:pr-8 ${isSidebarOpen ? "lg:pl-[17rem]" : "lg:pl-24"}`}>
      <div className="mx-auto w-full max-w-7xl mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-3 border border-indigo-200/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-emerald-200"></span> 
            Protected Environment
          </span>
          <h1 className="font-display text-4xl md:text-[3rem] font-black text-slate-900 tracking-tight leading-none">
            Command Center
          </h1>
          <p className="text-slate-500 mt-3 text-lg max-w-xl">
            Manage your storefront inventory, control visibility states, and monitor live customer feedback from a single pane of glass.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/60 p-2 pr-6 rounded-full border border-white/80 shadow-sm backdrop-blur-md">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-xl ring-2 ring-white">
            OD
          </div>
          <div className="text-left hidden sm:block">
             <p className="text-sm font-black text-slate-900 leading-tight">Admin Principal</p>
             <p className="text-[0.7rem] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">{isAdminLoading ? "Syncing data..." : "Session Secure"}</p>
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl">
        {adminError ? (
          <p className="error-message mb-6" role="alert">
            {adminError}
          </p>
        ) : null}

        {adminMessage ? <p className="success-message mb-6">{adminMessage}</p> : null}

        <div className="admin-grid">
          <section id="admin-create" className="admin-card scroll-mt-24">
            <div className="panel-header">
              <div>
                <p className="section-label">Create</p>
                <h2>New product</h2>
              </div>
              <p>Add catalog items instantly to the storefront.</p>
            </div>

            <form className="admin-product-form mt-8" onSubmit={onCreateProduct}>
              <input
                type="text"
                placeholder="Product Name"
                value={adminForm.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
              />
              <input
                type="text"
                placeholder="URL Slug (e.g. fresh-app-kit)"
                value={adminForm.slug}
                onChange={(event) => onFieldChange("slug", event.target.value)}
              />
              <textarea
                rows={4}
                placeholder="Describe the product details..."
                value={adminForm.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
              />

              <div className="admin-form-row pt-2">
                <input
                  type="text"
                  placeholder="Price"
                  value={adminForm.price}
                  onChange={(event) => onFieldChange("price", event.target.value)}
                />
                <input
                  type="text"
                  placeholder="Currency (USD)"
                  value={adminForm.currency}
                  onChange={(event) => onFieldChange("currency", event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Inventory Count"
                  value={adminForm.inventory_count}
                  onChange={(event) => onFieldChange("inventory_count", event.target.value)}
                />
              </div>

              <input
                type="text"
                placeholder="External Image URL or Upload below"
                value={adminForm.image_url}
                onChange={(event) => onFieldChange("image_url", event.target.value)}
              />

              <label className="grid gap-2 text-[0.95rem] font-bold text-slate-700 mt-2">
                <span>Upload Product Image</span>
                <div className="relative group p-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100/50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="w-full text-slate-500 outline-none file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-indigo-50 file:px-5 file:py-3 file:text-sm file:font-bold file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                    onChange={(event) => onUploadProductImage(event.target.files?.[0] || null)}
                    disabled={isImageUploading || isAdminSubmitting}
                  />
                </div>
              </label>

              {adminForm.image_url ? (
                <div className="admin-upload-preview mt-2">
                  <img src={adminForm.image_url} alt="Product preview" />
                </div>
              ) : null}

              {isImageUploading ? (
                <p className="text-sm font-bold text-indigo-500 animate-pulse">Uploading product media...</p>
              ) : null}

              <label className="checkbox-row mt-4">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  checked={adminForm.is_active}
                  onChange={(event) => onFieldChange("is_active", event.target.checked)}
                />
                Publish immediately to public storefront
              </label>

              <button type="submit" disabled={isAdminSubmitting} className="mt-2">
                {isAdminSubmitting ? "Committing..." : "Create Product Draft"}
              </button>
            </form>
          </section>

          <div className="grid gap-6">
            <section id="admin-overview" className="admin-card scroll-mt-24">
              <div className="panel-header">
                <div>
                  <p className="section-label">Overview</p>
                  <h2>System Status</h2>
                </div>
              </div>

              {adminOverview?.product_counts ? (
                <div className="admin-counts">
                  <div>
                    <span>Total Listings</span>
                    <strong>{adminOverview.product_counts.total}</strong>
                  </div>
                  <div>
                    <span>Visible</span>
                    <strong>{adminOverview.product_counts.active}</strong>
                  </div>
                  <div>
                    <span>Hidden</span>
                    <strong>{adminOverview.product_counts.inactive}</strong>
                  </div>
                </div>
              ) : (
                <div className="empty-state !min-h-[140px] mt-4">
                  <p>Initializing telemetry parameters...</p>
                </div>
              )}

              {adminOverview?.system_links?.length ? (
                <ul className="service-list admin-service-list mt-6">
                  {adminOverview.system_links.map((link) => (
                    <li key={link.label}>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        <strong>{link.label}</strong>
                        <small className="text-slate-400 block mt-0.5">{link.url}</small>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section id="admin-feedback" className="admin-card scroll-mt-24">
              <div className="panel-header mb-6">
                <div>
                  <p className="section-label">Support Inbox</p>
                  <h2>Customer Feedback</h2>
                </div>
              </div>

              {adminFeedback.length === 0 ? (
                <div className="empty-state !min-h-[160px]">
                  <p>No active support tickets.</p>
                </div>
              ) : (
                <ul className="admin-product-list !gap-3">
                  {adminFeedback.map((entry) => (
                    <li key={entry.id} className="!p-4 !grid-cols-1 gap-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-1">
                        <strong className="text-sm">User #{entry.user_id}</strong>
                        <span className="section-label !mb-0">{new Date(entry.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{entry.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <section id="admin-products" className="admin-card mt-8 scroll-mt-24 w-full">
          <div className="panel-header mb-6">
            <div>
              <p className="section-label">Catalog Manager</p>
              <h2>Assortment & Inventory</h2>
            </div>
          </div>

          {adminProducts.length === 0 ? (
            <div className="empty-state">
              <p>The catalog is currently empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <ul className="admin-product-list !mt-0 min-w-[700px]">
                {adminProducts.map((product) => (
                  <li key={product.id} className="!px-6 !py-5">
                    <div>
                      <strong className="text-lg">{product.name}</strong>
                      <p className="mt-1">
                        <span className="font-bold text-slate-800">{product.currency} {Number(product.price).toFixed(2)}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        {product.inventory_count} units available
                      </p>
                    </div>

                    <span className={`admin-badge ${product.is_active ? "is-active" : "is-inactive"}`}>
                      {product.is_active ? "Live" : "Draft"}
                    </span>

                    <button
                      type="button"
                      className="secondary-button !py-2 !px-5"
                      onClick={() => onToggleProductStatus(product)}
                      disabled={isAdminSubmitting}
                    >
                      {product.is_active ? "Revoke" : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="secondary-button !py-2 !px-5 !text-rose-600 hover:!bg-rose-50 hover:!border-rose-200"
                      onClick={() => onDeleteProduct(product)}
                      disabled={isAdminSubmitting}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </section>
      <AppFooter />
      </main>
    </>
  );
}

// THE MAIN APPLICATION COMPONENT
export default function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => readLocalStorage(CART_STORAGE_KEY, []));
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);
  const [productError, setProductError] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [userToken, setUserToken] = useState<string | null>(() => readToken(AUTH_TOKEN_STORAGE_KEY));
  const [adminToken, setAdminToken] = useState<string | null>(() => readToken(ADMIN_TOKEN_STORAGE_KEY));
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminFeedback, setAdminFeedback] = useState<FeedbackEntry[]>([]);
  const [adminForm, setAdminForm] = useState<Omit<Product, "id">>(initialAdminForm);
  const [adminError, setAdminError] = useState<string>("");
  const [adminMessage, setAdminMessage] = useState<string>("");
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState<boolean>(false);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [feedbackError, setFeedbackError] = useState<string>("");
  const [feedbackSuccess, setFeedbackSuccess] = useState<string>("");
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState<boolean>(false);
  const [contactForm, setContactForm] = useState<{ email: string; subject: string; message: string }>(() => ({
    email: getTokenEmail(readToken(AUTH_TOKEN_STORAGE_KEY)) || "",
    subject: "",
    message: "",
  }));
  const [contactError, setContactError] = useState<string>("");
  const [contactSuccess, setContactSuccess] = useState<string>("");
  const [isContactSubmitting, setIsContactSubmitting] = useState<boolean>(false);

  function openAccountForCheckout() {
    navigate("/account", { replace: true, state: { reason: "checkout" } });
  }

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
  const hasUserSession = isUserSessionToken(userToken);
  const hasAdminSession = isAdminSessionToken(adminToken);

  function resetAdminSession() {
    setAdminToken("");
    setAdminOverview(null);
    setAdminProducts([]);
    setAdminFeedback([]);
  }

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
    } catch (err: any) {
      setProductError(err.message || "Failed to load products.");
    } finally {
      setIsProductsLoading(false);
    }
  }

  // Cart Logic: Add item or increment quantity if already present
  function addToCart(product: Product) {
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
  function updateCartQuantity(productId: number, nextQuantity: number) {
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
  function removeFromCart(productId: number) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  }

  // Admin Logic: Fetch protected dashboard data (overview, catalog, feedback)
  async function fetchAdminData(token: string | null = adminToken) {
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
        const authError = new Error("Admin session expired or does not have access.");
        (authError as Error & { code?: string }).code = "AUTH";
        throw authError;
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
    } catch (err: any) {
      setAdminError(err.message || "Failed to load admin dashboard.");

      if (err?.code === "AUTH") {
        resetAdminSession();
        navigate("/admin", { replace: true });
      }
    } finally {
      setIsAdminLoading(false);
    }
  }

  // Admin Logic: Authenticate specifically for administrative access
  async function handleAdminLogin(event: React.FormEvent) {
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
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      setAdminError(err.message || "Failed to sign in.");
      resetAdminSession();
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  // Logout Logic: Clear tokens and redirect to landing
  function handleUserLogout() {
    setUserToken("");
    navigate("/", { replace: true });
  }

  function handleCheckoutEntry() {
    if (!hasUserSession) {
      openAccountForCheckout();
      return;
    }

    navigate("/support", { replace: true });
  }

  // Logout Logic: Reset all admin state
  function handleAdminLogout() {
    resetAdminSession();
    setAdminMessage("Admin session cleared.");
    setAdminError("");
    navigate("/admin", { replace: true });
  }

  // Product Logic: Upload image to server and update form state
  async function handleUploadProductImage(file: File | null) {
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
        let errMsg = data.detail || "Failed to upload image.";
        if (Array.isArray(data.detail)) {
          errMsg = data.detail.map((e: any) => `${e.loc?.[e.loc?.length - 1] ?? "Field"}: ${e.msg}`).join(", ");
        } else if (typeof data.detail === "object") {
          errMsg = JSON.stringify(data.detail);
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setAdminForm((current) => ({
        ...current,
        image_url: data.image_url || "",
      }));
      setAdminMessage("Image uploaded and attached to the product form.");
    } catch (err: any) {
      setAdminError(err.message || "Failed to upload image.");
    } finally {
      setIsImageUploading(false);
    }
  }

  // Feedback Logic: Submit user message to database
  async function handleSubmitFeedback(event: React.FormEvent) {
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
        let errMsg = data.detail || "Failed to send feedback.";
        if (Array.isArray(data.detail)) {
          errMsg = data.detail.map((e: any) => `${e.loc?.[e.loc?.length - 1] ?? "Field"}: ${e.msg}`).join(", ");
        } else if (typeof data.detail === "object") {
          errMsg = JSON.stringify(data.detail);
        }
        throw new Error(errMsg);
      }

      setFeedbackText("");
      setFeedbackSuccess("Your message has been sent to the team.");

      if (hasAdminSession) {
        await fetchAdminData();
      }
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to send feedback.");
    } finally {
      setIsFeedbackSubmitting(false);
    }
  }

  // Support Logic: Queue an email in the background worker
  async function handleSubmitContact(event: React.FormEvent) {
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
        let errMsg = data.detail || "Failed to queue support email.";
        if (Array.isArray(data.detail)) {
          errMsg = data.detail.map((e: any) => `${e.loc?.[e.loc?.length - 1] ?? "Field"}: ${e.msg}`).join(", ");
        } else if (typeof data.detail === "object") {
          errMsg = JSON.stringify(data.detail);
        }
        throw new Error(errMsg);
      }

      setContactForm((current) => ({
        ...current,
        subject: "",
        message: "",
      }));
      setContactSuccess("Support email queued successfully.");
    } catch (err: any) {
      setContactError(err.message || "Failed to queue support email.");
    } finally {
      setIsContactSubmitting(false);
    }
  }

  // Admin Logic: POST new product to the catalog
  async function handleCreateProduct(event: React.FormEvent) {
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
        let errMsg = data.detail || "Failed to create product.";
        if (Array.isArray(data.detail)) {
          errMsg = data.detail.map((e: any) => `${e.loc?.[e.loc?.length - 1] ?? "Field"}: ${e.msg}`).join(", ");
        } else if (typeof data.detail === "object") {
          errMsg = JSON.stringify(data.detail);
        }
        throw new Error(errMsg);
      }

      setAdminForm(initialAdminForm);
      setAdminMessage("Product created.");
      await Promise.all([fetchProducts(), fetchAdminData()]);
    } catch (err: any) {
      setAdminError(err.message || "Failed to create product.");
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  // Admin Logic: Toggle product visibility (is_active)
  async function toggleProductStatus(product: Product) {
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
        let errMsg = data.detail || "Failed to update product.";
        if (Array.isArray(data.detail)) {
          errMsg = data.detail.map((e: any) => `${e.loc?.[e.loc?.length - 1] ?? "Field"}: ${e.msg}`).join(", ");
        } else if (typeof data.detail === "object") {
          errMsg = JSON.stringify(data.detail);
        }
        throw new Error(errMsg);
      }

      setAdminMessage(`Product ${product.is_active ? "hidden" : "published"}.`);
      await Promise.all([fetchProducts(), fetchAdminData()]);
    } catch (err: any) {
      setAdminError(err.message || "Failed to update product.");
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  // Admin Logic: Permanent product deletion
  async function handleDeleteProduct(product: Product) {
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
    } catch (err: any) {
      setAdminError(err.message || "Failed to delete product.");
    } finally {
      setIsAdminSubmitting(false);
    }
  }

  // Effect: Initial product load on app mount
  useEffect(() => {
    fetchProducts().catch((err: any) => {
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

  // Effect: Drop stale or cross-role tokens from local state on load.
  useEffect(() => {
    if (userToken && !isUserSessionToken(userToken)) {
      setUserToken("");
    }
  }, [userToken]);

  useEffect(() => {
    if (adminToken && !isAdminSessionToken(adminToken)) {
      resetAdminSession();
    }
  }, [adminToken]);

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

  // Routing Configuration
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ShopPage
            products={products}
            cart={cart}
            isProductsLoading={isProductsLoading}
            productError={productError}
            cartCount={cartCount}
            cartSubtotal={cartSubtotal}
            hasUserSession={hasUserSession}
            onRefresh={() => fetchProducts()}
            onAddToCart={addToCart}
            onUpdateCartQuantity={updateCartQuantity}
            onRemoveFromCart={removeFromCart}
            onStartCheckout={handleCheckoutEntry}
            onOpenAccount={openAccountForCheckout}
            onLogout={handleUserLogout}
          />
        }
      />
      <Route
        path="/account"
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
          <Navigate to="/" replace />
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute isAllowed={hasUserSession} redirectTo="/account">
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
