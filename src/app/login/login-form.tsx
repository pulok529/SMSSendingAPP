"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Invalid email or password.");
      }

      const nextPath = searchParams.get("next");
      router.replace(nextPath?.startsWith("/") ? nextPath : "/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reach server. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        Email Address
        <input
          className={styles.field}
          type="email"
          required
          autoComplete="email"
          placeholder="e.g. client@yourbusiness.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className={styles.label}>
        Password
        <input
          className={styles.field}
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button className={styles.button} type="submit" disabled={isSubmitting || !email || !password}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      {message ? <div className={styles.message}>{message}</div> : null}
    </form>
  );
}
