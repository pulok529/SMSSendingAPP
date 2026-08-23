import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import {
  campaigns,
  customers,
  dashboardStats,
  deliveryLogs,
  deviceStatus,
  events,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>Today&apos;s pulse</div>
        <h2 className={styles.heroTitle}>
          One dashboard for imports, event messaging, and mobile-number SMS
          dispatch.
        </h2>
        <p className={styles.heroText}>
          The web app is now shaped around your workflow: bring customer records
          in through Excel, review the list, create event campaigns, then send
          bulk SMS from your linked Android phone while email sends remain
          tracked in the same control panel.
        </p>
      </section>

      <section className={styles.statsGrid}>
        {dashboardStats.map((stat) => (
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
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <div className={styles.rowMeta}>
                        <strong>{campaign.name}</strong>
                        <span className={styles.rowSubtle}>
                          {campaign.sent} sent, {campaign.failed} failed
                        </span>
                      </div>
                    </td>
                    <td>{campaign.channel}</td>
                    <td>{campaign.audienceSize}</td>
                    <td>
                      <StatusChip status={campaign.status} />
                    </td>
                  </tr>
                ))}
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
            <StatusChip status={deviceStatus.status} />
          </div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Device</span>
            <strong className={styles.metricValue}>{deviceStatus.deviceName}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Phone number</span>
            <strong className={styles.metricValue}>{deviceStatus.phoneNumber}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Operator</span>
            <strong className={styles.metricValue}>{deviceStatus.operator}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Battery</span>
            <strong className={styles.metricValue}>{deviceStatus.battery}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Queued jobs</span>
            <strong className={styles.metricValue}>{deviceStatus.queuedJobs}</strong>
          </div>
        </article>
      </section>

      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Upcoming events</h2>
              <p className={styles.panelText}>
                Event records already shaped for SMS and email campaigns.
              </p>
            </div>
            <span className={styles.badge}>{events.length} event records</span>
          </div>
          <div className={styles.splitList}>
            {events.map((event) => (
              <div key={event.id} className={styles.splitItem}>
                <div className={styles.panelHeader} style={{ marginBottom: 0 }}>
                  <div>
                    <div className={styles.splitTitle}>{event.title}</div>
                    <p className={styles.splitText}>
                      {event.date} at {event.venue} for {event.audience}.
                    </p>
                  </div>
                  <StatusChip status={event.status} />
                </div>
              </div>
            ))}
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
            {deliveryLogs.map((log) => (
              <div key={log.id} className={styles.splitItem}>
                <div className={styles.panelHeader} style={{ marginBottom: 0 }}>
                  <div>
                    <div className={styles.splitTitle}>
                      {log.customer} · {log.campaign}
                    </div>
                    <p className={styles.splitText}>
                      {log.timestamp} · {log.detail}
                    </p>
                  </div>
                  <StatusChip status={log.status} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>High-value customers</h2>
            <p className={styles.panelText}>
              A sample of the records you&apos;ll use for bulk event communication.
            </p>
          </div>
          <span className={styles.badge}>{customers.length} loaded in demo</span>
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
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className={styles.rowMeta}>
                      <strong>{customer.name}</strong>
                      <span className={styles.rowSubtle}>{customer.company}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.rowMeta}>
                      <span>{customer.mobile}</span>
                      <span className={styles.rowSubtle}>{customer.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.pillRow}>
                      {customer.tags.map((tag) => (
                        <span key={tag} className={styles.pill}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    SMS {customer.consentSms ? "Yes" : "No"} · Email{" "}
                    {customer.consentEmail ? "Yes" : "No"}
                  </td>
                  <td>{customer.lastContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
