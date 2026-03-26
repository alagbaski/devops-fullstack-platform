import { useState } from "react";

import AuthButton from "./AuthButton";
import AuthField from "./AuthField";
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
    <section className="grid gap-5">
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <AuthField
          id="user-login-email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AuthField
          id="user-login-password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <AuthButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </AuthButton>
      </form>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <button type="button" className="font-semibold text-slate-700 transition hover:text-slate-950" onClick={onSwitch}>
          Sign up
        </button>
      </p>
    </section>
  );
}
