import Link from "next/link";
import { ReactNode } from "react";
import {
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  Mail,
  PlugZap,
  ScrollText,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import styles from "./app-shell.module.css";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users & Clients", icon: ShieldCheck },
  { href: "/imports", label: "Imports", icon: Upload },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/events", label: "Events", icon: CalendarRange },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/templates", label: "Templates", icon: ClipboardList },
  { href: "/device", label: "Device", icon: PlugZap },
  { href: "/logs", label: "Logs", icon: ScrollText },
];

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
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandLabel}>Customer Broadcast Hub</span>
          <div className={styles.brandTitle}>Pulse Dispatch</div>
          <p className={styles.brandText}>
            Upload clients, build event campaigns, and push SMS from your linked
            Android device while email sends stay tracked in one dashboard.
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
          <div className={styles.footerValue}>8,124 contacts</div>
          <p className={styles.footerText}>
            SMS-safe contacts with valid AU mobile numbers and active consent.
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

          <div className={styles.actions}>
            <Link href="/imports" className={styles.ghostAction}>
              Import Customers
            </Link>
            <Link href="/campaigns" className={styles.primaryAction}>
              Create Campaign
            </Link>
            <LogoutButton />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
