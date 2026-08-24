"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import Link from "next/link";

type DashboardSummary = {
  stats: Array<{ label: string; value: string; note: string }>;
  counts: {
    customers: number;
    smsReady: number;
    emailReady: number;
    campaigns: number;
    activeCampaigns: number;
    deliveriesSent: number;
    deliveriesFailed: number;
  };
  activeCampaigns: Array<{
    id: string;
    name: string;
    channel: string;
    audienceSize: number;
    sentCount: number;
    failedCount: number;
    status: string;
  }>;
  recentDeliveries: Array<{
    id: string;
    detail: string;
    status: string;
    timestamp: string;
    customer: { name: string; mobile?: string };
    campaign: { name: string };
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    venue: string;
    audience: string;
    status: string;
  }>;
  device: {
    deviceName: string;
    phoneNumber: string;
    operator: string;
    battery?: string;
    status: string;
    queuedJobs: number;
  } | null;
};

type CustomerRecord = {
  id: string;
  name: string;
  company?: string;
  mobile?: string;
  email?: string;
  tags: string[];
  consentSms: boolean;
  consentEmail: boolean;
  lastContact?: string;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, custRes] = await Promise.all([
          fetch("/api/dashboard/summary"),
          fetch("/api/customers"),
        ]);

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        }

        if (custRes.ok) {
          const custData = await custRes.json();
          setCustomers(custData.customers || []);
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const stats = summary?.stats || [
    { label: "Ready to send", value: "0 SMS", note: "Consented mobile contacts" },
    { label: "Active campaigns", value: "0 live", note: "0 total campaigns" },
    { label: "Delivered Messages", value: "0", note: "100% success rate" },
    { label: "Linked Android Senders", value: "Offline", note: "Ready to pair" },
  ];

  const device = summary?.device;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>Today&apos;s pulse</div>
        <h2 className={styles.heroTitle}>
          One dashboard for imports, event messaging, and mobile-number SMS
          dispatch.
        </h2>
        <p className={styles.heroText}>
          The web app is connected directly to your database and companion Android
          phone: import customer spreadsheets, schedule event campaigns, and dispatch
          bulk SMS seamlessly through your device SIM.
        </p>
      </section>

      <section className={styles.statsGrid}>
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={styles.statValue}>{stat.value}</div>
            <p className={styles.statNote}>{stat.note}</p>
          </article>
        ))}
      </section>

      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Active campaigns</h2>
              <p className={styles.panelText}>
                SMS and email activity across current event announcements.
              </p>
            </div>
            <span className={styles.badge}>Live queue</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Channel</th>
                  <th>Audience</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.activeCampaigns && summary.activeCampaigns.length > 0 ? (
                  summary.activeCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <div className={styles.rowMeta}>
                          <strong>{campaign.name}</strong>
                          <span className={styles.rowSubtle}>
                            {campaign.sentCount} sent, {campaign.failedCount} failed
                          </span>
                        </div>
                      </td>
                      <td>{campaign.channel}</td>
                      <td>{campaign.audienceSize}</td>
                      <td>
                        <StatusChip status={campaign.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "24px 0", color: "#8E7F75" }}>
                      {loading ? "Loading campaigns..." : "No campaigns created yet. Click 'Create Campaign' to begin."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Linked phone</h2>
              <p className={styles.panelText}>
                This is the device the web app will target for SMS dispatch.
              </p>
            </div>
            <StatusChip status={device?.status || "OFFLINE"} />
          </div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Device</span>
            <strong className={styles.metricValue}>{device?.deviceName || "No Android Phone Registered"}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Phone number</span>
            <strong className={styles.metricValue}>{device?.phoneNumber || "—"}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Operator</span>
            <strong className={styles.metricValue}>{device?.operator || "—"}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Battery</span>
            <strong className={styles.metricValue}>{device?.battery || "N/A"}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Queued jobs</span>
            <strong className={styles.metricValue}>{device?.queuedJobs || 0}</strong>
          </div>
        </article>
      </section>

      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Upcoming events</h2>
              <p className={styles.panelText}>
                Event records shaped for SMS and email campaigns.
              </p>
            </div>
            <span className={styles.badge}>{summary?.upcomingEvents?.length || 0} scheduled</span>
          </div>
          <div className={styles.splitList}>
            {summary?.upcomingEvents && summary.upcomingEvents.length > 0 ? (
              summary.upcomingEvents.map((event) => (
                <div key={event.id} className={styles.splitItem}>
                  <div className={styles.panelHeader} style={{ marginBottom: 0 }}>
                    <div>
                      <div className={styles.splitTitle}>{event.title}</div>
                      <p className={styles.splitText}>
                        {new Date(event.date).toLocaleDateString()} at {event.venue} for {event.audience}.
                      </p>
                    </div>
                    <StatusChip status={event.status} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ padding: "16px 0", color: "#8E7F75" }}>
                {loading ? "Loading events..." : "No events scheduled yet. Create an event in the Events menu."}
              </p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Recent delivery activity</h2>
              <p className={styles.panelText}>
                A quick cross-channel view of the latest send outcomes.
              </p>
            </div>
          </div>
          <div className={styles.splitList}>
            {summary?.recentDeliveries && summary.recentDeliveries.length > 0 ? (
              summary.recentDeliveries.map((log) => (
                <div key={log.id} className={styles.splitItem}>
                  <div className={styles.panelHeader} style={{ marginBottom: 0 }}>
                    <div>
                      <div className={styles.splitTitle}>
                        {log.customer?.name || "Recipient"} · {log.campaign?.name || "Broadcast"}
                      </div>
                      <p className={styles.splitText}>
                        {new Date(log.timestamp).toLocaleTimeString()} · {log.detail}
                      </p>
                    </div>
                    <StatusChip status={log.status} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ padding: "16px 0", color: "#8E7F75" }}>
                {loading ? "Loading activity..." : "No delivery activity recorded yet."}
              </p>
            )}
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Customer contacts</h2>
            <p className={styles.panelText}>
              Your live directory of customers for bulk event communication.
            </p>
          </div>
          <Link href="/customers" className={styles.badge}>
            {customers.length} total contacts
          </Link>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Tags</th>
                <th>Consent</th>
                <th>Last contact</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.slice(0, 10).map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className={styles.rowMeta}>
                        <strong>{customer.name}</strong>
                        <span className={styles.rowSubtle}>{customer.company || "Individual"}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowMeta}>
                        <span>{customer.mobile || "—"}</span>
                        <span className={styles.rowSubtle}>{customer.email || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.pillRow}>
                        {customer.tags && customer.tags.length > 0 ? (
                          customer.tags.map((tag) => (
                            <span key={tag} className={styles.pill}>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className={styles.rowSubtle}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      SMS {customer.consentSms ? "Yes" : "No"} · Email{" "}
                      {customer.consentEmail ? "Yes" : "No"}
                    </td>
                    <td>{customer.lastContact ? new Date(customer.lastContact).toLocaleDateString() : "Never"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px 0", color: "#8E7F75" }}>
                    {loading ? "Loading customers..." : "No customers found. Import from Excel or add a customer."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
