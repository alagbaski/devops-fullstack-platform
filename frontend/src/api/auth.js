const API_URL = "/api/v1/auth";
export const AUTH_TOKEN_STORAGE_KEY = "devops-platform-auth-token";

function formatErrorDetail(detail) {
  if (!detail) {
    return "Authentication request failed.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
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
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token);
  return data;
}
