const API_URL = "/api/v1/auth";
export const AUTH_TOKEN_STORAGE_KEY = "devops-platform-auth-token";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Authentication request failed.");
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
