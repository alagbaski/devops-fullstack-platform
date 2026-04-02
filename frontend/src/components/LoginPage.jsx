/**
 * LoginPage Component
 * 
 * Handles the user login form, input validation, and 
 * execution of the login API call.
 */
import { useState } from "react";

import AuthButton from "./AuthButton";
import AuthField from "./AuthField";
import { loginUser } from "../api/auth";

// onSuccess: Callback triggered after valid login
// onSwitch: Callback to toggle to the Signup view
export default function LoginPage({ onSuccess, onSwitch }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic frontend validation before hitting the server
  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier) {
      setError("Email or username is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // loginUser saves the token to localStorage automatically
      const data = await loginUser({ identifier: normalizedIdentifier, password });
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
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <AuthField
          id="user-login-identifier"
          label="Email/Username"
          type="text"
          placeholder="Email/Username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
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

      <p className="text-center text-sm text-gray-500">
        Use your email or username with your password to access your account.
      </p>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="font-medium text-gray-900 transition duration-200 hover:text-blue-600"
          onClick={onSwitch}
        >
          Sign up
        </button>
      </p>
    </section>
  );
}
