/**
 * Authentication API Utilities
 * 
 * This file centralizes all network calls related to authentication.
 * It handles the 'fetch' logic, error formatting for FastAPI's 
 * validation errors, and local storage persistence for JWT tokens.
 */

const API_URL = "/api/v1/auth";
export const AUTH_TOKEN_STORAGE_KEY = "devops-platform-auth-token";

function formatErrorDetail(detail) {
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
    return detail.message || JSON.stringify(detail);
  }

  return "Authentication request failed.";
}

async function parseResponse(response) {
  // Helper to parse JSON and throw a formatted error if the 
  // HTTP status code indicates failure (not in 200-299 range).
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(formatErrorDetail(data.detail));
  }

  return data;
}

export async function signupUser(payload) {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function loginUser(payload) {
  // Perform login and automatically save the resulting token to localStorage.
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token);
  return data;
}
