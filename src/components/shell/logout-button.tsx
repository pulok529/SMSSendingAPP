"use client";

import { useRouter } from "next/navigation";
import styles from "./app-shell.module.css";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <button className={styles.ghostActionButton} type="button" onClick={logout}>
      Log out
    </button>
  );
}
