/**
 * Authentication API Utilities
 *
 * This file centralizes all network calls related to authentication.
 * It handles the 'fetch' logic and error formatting for FastAPI's
 * validation errors. Token persistence is intentionally owned by the
 * calling flow so shopper and admin sessions stay isolated.
 */

const API_URL = "/api/v1/auth";
export const AUTH_TOKEN_STORAGE_KEY = "devops-platform-auth-token";

export interface SignupPayload {
  email: string;
  username: string;
  password?: string;
  [key: string]: any;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
}

export interface ErrorDetailItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export type ErrorDetail = string | ErrorDetailItem[] | { message: string } | any;

function formatErrorDetail(detail: ErrorDetail): string {
  // FastAPI returns errors in different formats (strings, objects, or arrays).
  // This function normalizes them into a single readable string for the UI.
  if (!detail) {
    return "Authentication request failed.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    // Handle Pydantic validation error arrays
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          // Extract field names (e.g., 'body.email') and map them to messages
          const field = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
          const message = item.msg || "Invalid value";
          return field ? `${field}: ${message}` : message;
        }

        return "";
      })
      .filter(Boolean);

    return messages[0] || "Authentication request failed.";
  }

  if (typeof detail === "object") {
    return (detail as any).message || JSON.stringify(detail);
  }

  return "Authentication request failed.";
}

async function parseResponse<T>(response: Response): Promise<T> {
  // Helper to parse JSON and throw a formatted error if the
  // HTTP status code indicates failure (not in 200-299 range).
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(formatErrorDetail(data.detail));
  }

  return data as T;
}

export async function signupUser(payload: SignupPayload): Promise<any> {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<any>(response);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<AuthResponse>(response);
}
