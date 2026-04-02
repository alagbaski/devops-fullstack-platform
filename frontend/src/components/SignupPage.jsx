import { useState } from "react";

import AuthButton from "./AuthButton";
import AuthField from "./AuthField";
import { signupUser } from "../api/auth";

export default function SignupPage({ onSuccess, onSwitch }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!normalizedUsername) {
      setError("Username is required.");
      return;
    }

    if (normalizedUsername.length < 3) {
      setError("Username must be at least 3 characters.");
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
      const data = await signupUser({
        email: normalizedEmail,
        username: normalizedUsername,
        password,
      });
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
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
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
          id="user-signup-username"
          label="Username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
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

      <p className="text-center text-sm text-gray-500">
        Create a developer account with your email, username, and secure password.
      </p>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          type="button"
          className="font-medium text-gray-900 transition duration-200 hover:text-blue-600"
          onClick={onSwitch}
        >
          Login
        </button>
      </p>
    </section>
  );
}
