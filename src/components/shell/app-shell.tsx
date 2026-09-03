"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
  BookUser,
  CalendarRange,
  ClipboardList,
  FolderGit2,
  LayoutDashboard,
  Mail,
  MailCheck,
  MessageSquareQuote,
  PlugZap,
  ScrollText,
  Send,
  ShieldCheck,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import styles from "./app-shell.module.css";
import { LogoutButton } from "./logout-button";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dispatch", label: "Dispatch Console", icon: Send },
  { href: "/directory", label: "Phone Directory", icon: BookUser },
  { href: "/groups", label: "Contact Groups", icon: FolderGit2 },
  { href: "/messages", label: "Message Library", icon: MessageSquareQuote },
  { href: "/email-settings", label: "Email Settings", icon: MailCheck },
  { href: "/quick-send", label: "Quick Send", icon: Zap },
  { href: "/users", label: "Users & Clients", icon: ShieldCheck, superOnly: true },
  { href: "/imports", label: "Imports", icon: Upload },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/events", label: "Events", icon: CalendarRange },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/templates", label: "Templates", icon: ClipboardList },
  { href: "/device", label: "Device", icon: PlugZap },
  { href: "/logs", label: "Logs", icon: ScrollText },
];

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string | null;
  phone?: string | null;
}

type AppShellProps = {
  children: ReactNode;
  pathname: string;
  title: string;
  description: string;
};

export function AppShell({
  children,
  pathname,
  title,
  description,
}: AppShellProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [readyCount, setReadyCount] = useState<number | null>(null);

  useEffect(() => {
    // 1. Fetch user role and profile details
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });

    // 2. Fetch live ready count
    fetch("/api/dashboard/summary", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.counts?.smsReady === "number") {
          setReadyCount(data.counts.smsReady);
        }
      })
      .catch(() => {});
  }, []);

  const isSuperUser = currentUser?.role === "SUPERADMIN" || currentUser?.role === "ADMIN";
  const userRole = currentUser?.role || "CLIENT";
  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("")
    : "PS";

  const navItems = allNavItems.filter(
    (item) => !item.superOnly || isSuperUser
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandLabel}>⚡ SMS & Broadcast Gateway</span>
          <div className={styles.brandTitle}>Pulse Sender</div>
          <p className={styles.brandText}>
            Import clients, schedule event campaigns, and dispatch live SMS from your linked
            Android phone.
          </p>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerLabel}>Ready to Send</div>
          <div className={styles.footerValue}>
            {readyCount !== null ? `${readyCount.toLocaleString()} contacts` : "Loading..."}
          </div>
          <p className={styles.footerText}>
            SMS-safe contacts with valid mobile numbers and active consent.
          </p>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <div className={styles.topbarTitle}>Web Control Panel</div>
            <h1 className={styles.topbarHeading}>{title}</h1>
            <p className={styles.topbarText}>{description}</p>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.userProfileCard}>
              <div
                className={`${styles.userAvatar} ${
                  isSuperUser ? styles.superAvatar : styles.clientAvatar
                }`}
              >
                {initials}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userHeaderRow}>
                  <span className={styles.userName}>{currentUser?.name || "Loading..."}</span>
                  <span
                    className={`${styles.roleBadge} ${
                      isSuperUser ? styles.superRoleBadge : styles.clientRoleBadge
                    }`}
                  >
                    {isSuperUser ? "🛡️ SUPER USER" : "🏢 CLIENT USER"}
                  </span>
                </div>
                <div className={styles.userSubRow}>
                  <span className={styles.userEmail}>{currentUser?.email || "—"}</span>
                  {currentUser?.company && !isSuperUser && (
                    <span className={styles.userCompany}>• {currentUser.company}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/imports" className={styles.ghostAction}>
                Import Customers
              </Link>
              <Link href="/campaigns" className={styles.primaryAction}>
                Create Campaign
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
