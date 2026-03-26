import { useState } from "react";

import AuthButton from "./AuthButton";
import AuthField from "./AuthField";
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
    <section className="grid gap-5">
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <AuthField
          id="user-signup-email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AuthField
          id="user-signup-password"
          label="Password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <AuthField
          id="user-signup-confirm-password"
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <AuthButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Sign up"}
        </AuthButton>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button type="button" className="font-semibold text-slate-700 transition hover:text-slate-950" onClick={onSwitch}>
          Login
        </button>
      </p>
    </section>
  );
}
