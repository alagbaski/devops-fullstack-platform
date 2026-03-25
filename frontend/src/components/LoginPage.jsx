import { useState } from "react";

import { loginUser } from "../api/auth";

export default function LoginPage({ onSuccess, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const data = await loginUser({ email: normalizedEmail, password });
      onSuccess?.(data);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel panel-admin">
      <div className="panel-header">
        <div>
          <p className="section-label">Account</p>
          <h2>Login</h2>
        </div>
        <p>Sign in with your existing account to receive a JWT in local storage.</p>
      </div>

      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}

      <form className="admin-login-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <button type="button" className="secondary-button" onClick={onSwitch}>
        Need an account? Sign up
      </button>
    </section>
  );
}
