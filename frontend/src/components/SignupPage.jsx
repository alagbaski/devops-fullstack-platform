import { useState } from "react";

import { signupUser } from "../api/auth";

export default function SignupPage({ onSuccess, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const data = await signupUser({ email: normalizedEmail, password });
      onSuccess?.(data);
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel panel-admin">
      <div className="panel-header">
        <div>
          <p className="section-label">Account</p>
          <h2>Signup</h2>
        </div>
        <p>Create an account first, then sign in to receive a JWT in local storage.</p>
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
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <button type="button" className="secondary-button" onClick={onSwitch}>
        Already have an account? Login
      </button>
    </section>
  );
}
