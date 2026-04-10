/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import App from "../src/App";
import { AUTH_TOKEN_STORAGE_KEY } from "../src/api/auth";

const ADMIN_TOKEN_STORAGE_KEY = "devops-platform-admin-token";

function mockJsonResponse(data: any, ok: boolean = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  } as Response);
}

function createToken(payload: Record<string, unknown>) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `header.${window.btoa(JSON.stringify({ exp, ...payload }))}.signature`;
}

function renderApp(initialEntries: string[] = ["/"]) {
  render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    global.fetch = vi.fn(() => mockJsonResponse([]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the auth landing page by default", async () => {
    renderApp(["/"]);

    expect(
      screen.getByRole("heading", { name: /build your developer stack like a product team\./i })
    ).toBeInTheDocument();
    expect(screen.getByText(/checkout path unlocked|browse freely, sign in when you are ready\./i)).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/products");
    });
  });

  it("keeps the storefront public when visitors open the shop route", async () => {
    renderApp(["/shop"]);

    expect(
      await screen.findByRole("heading", { name: /build your developer stack like a product team\./i })
    ).toBeInTheDocument();
    expect(screen.getByText(/product catalog/i)).toBeInTheDocument();
  });

  it("switches to the signup experience on the account route", async () => {
    renderApp(["/account"]);

    fireEvent.click(screen.getByRole("tab", { name: /^sign up$/i }));

    expect(await screen.findByLabelText(/^username$/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign up$/i })).toBeInTheDocument();
  });

  it("keeps the shopper token separate when an admin signs in", async () => {
    const shopperToken = createToken({ email: "shopper@example.com", role: "customer" });
    const adminToken = createToken({ email: "admin@example.com", role: "admin" });

    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, shopperToken);

    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/v1/products") {
        return mockJsonResponse([]);
      }

      if (url === "/api/v1/auth/login") {
        return mockJsonResponse({ access_token: adminToken, token_type: "bearer" });
      }

      if (url === "/api/v1/admin/overview") {
        return mockJsonResponse({ product_counts: { total: 0, active: 0, inactive: 0 }, system_links: [] });
      }

      if (url === "/api/v1/products/admin") {
        return mockJsonResponse([]);
      }

      if (url === "/api/v1/feedback") {
        return mockJsonResponse([]);
      }

      return mockJsonResponse([]);
    }) as typeof fetch;

    renderApp(["/admin"]);

    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Admin123" } });
    fireEvent.click(screen.getByRole("button", { name: /login to dashboard/i }));

    await screen.findByRole("heading", { name: /manage the protected admin dashboard\./i });

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(shopperToken);
    expect(window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)).toBe(adminToken);
  });

  it("clears stale admin tokens from the auth landing page session affordances", async () => {
    const adminToken = createToken({ email: "admin@example.com", role: "admin", exp: Math.floor(Date.now() / 1000) + 3600 });
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, adminToken);

    renderApp(["/account"]);

    expect(await screen.findByRole("heading", { name: /welcome to your developer store/i })).toBeInTheDocument();
    expect(screen.queryByText(/continue to shop/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^log out$/i)).not.toBeInTheDocument();
  });

  it("prompts guests to sign in when they continue to checkout", async () => {
    renderApp(["/"]);

    fireEvent.click(screen.getByRole("button", { name: /sign in to checkout/i }));

    expect(
      await screen.findByText(/sign in or create an account to continue to checkout\./i)
    ).toBeInTheDocument();
  });

  it("does not contaminate the shopper session when a non-admin uses the admin login form", async () => {
    const shopperToken = createToken({ email: "shopper@example.com", role: "customer" });
    const nonAdminToken = createToken({ email: "user@example.com", role: "customer" });

    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, shopperToken);

    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/v1/products") {
        return mockJsonResponse([]);
      }

      if (url === "/api/v1/auth/login") {
        return mockJsonResponse({ access_token: nonAdminToken, token_type: "bearer" });
      }

      return mockJsonResponse([]);
    }) as typeof fetch;

    renderApp(["/admin"]);

    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: "user" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /login to dashboard/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This account does not have admin access.");
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(shopperToken);
    expect(window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("keeps the admin session during transient dashboard load failures", async () => {
    const adminToken = createToken({ email: "admin@example.com", role: "admin" });

    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, adminToken);

    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/v1/products") {
        return mockJsonResponse([]);
      }

      if (url === "/api/v1/admin/overview") {
        return mockJsonResponse({}, false);
      }

      if (url === "/api/v1/products/admin") {
        return mockJsonResponse([]);
      }

      if (url === "/api/v1/feedback") {
        return mockJsonResponse([]);
      }

      return mockJsonResponse([]);
    }) as typeof fetch;

    renderApp(["/admin/dashboard"]);

    expect(
      await screen.findByRole("heading", { name: /manage the protected admin dashboard\./i })
    ).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load admin dashboard.");
    expect(screen.queryByRole("heading", { name: /admin access portal/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)).toBe(adminToken);
  });
});
