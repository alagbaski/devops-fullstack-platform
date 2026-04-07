import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AUTH_TOKEN_STORAGE_KEY, loginUser, signupUser } from "../src/api/auth";

function jsonResponse({ ok = true, data = {} }: { ok?: boolean; data?: any }) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  } as Response);
}

describe("auth api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("signs up a user through the auth API", async () => {
    global.fetch = vi.fn(() =>
      jsonResponse({
        data: { id: 1, email: "new@example.com", username: "newuser" },
      })
    );

    const payload = {
      email: "new@example.com",
      username: "newuser",
      password: "password123",
    };
    const data = await signupUser(payload);

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(data.email).toBe("new@example.com");
    expect(data.username).toBe("newuser");
  });

  it("stores the token after login", async () => {
    global.fetch = vi.fn(() =>
      jsonResponse({
        data: { access_token: "token-123", token_type: "bearer" },
      })
    );

    const payload = { identifier: "user@example.com", password: "password123" };
    const data = await loginUser(payload);

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(data.access_token).toBe("token-123");
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("token-123");
  });

  it("surfaces backend auth errors", async () => {
    global.fetch = vi.fn(() =>
      jsonResponse({
        ok: false,
        data: { detail: "Invalid email/username or password" },
      })
    );

    await expect(
      loginUser({ identifier: "user@example.com", password: "badpass123" })
    ).rejects.toThrow("Invalid email/username or password");
  });
});
