import styles from "@/components/ui/dashboard.module.css";
import { customers } from "@/lib/mock-data";

export default function CustomersPage() {
  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Customer grid</h2>
            <p className={styles.panelText}>
              This page is shaped like the CRM grid your client will use before
              selecting recipients for event messaging.
            </p>
          </div>
          <span className={styles.badge}>Bulk-select ready</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Location</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Segments</th>
                <th>Events</th>
                <th>Consent</th>
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
                  <td>{customer.city}</td>
                  <td>{customer.mobile}</td>
                  <td>{customer.email}</td>
                  <td>
                    <div className={styles.pillRow}>
                      {customer.tags.map((tag) => (
                        <span key={tag} className={styles.pill}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{customer.eventCount}</td>
                  <td>
                    SMS {customer.consentSms ? "Yes" : "No"} · Email{" "}
                    {customer.consentEmail ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Selection filters to add next</h2>
              <p className={styles.panelText}>
                These are the targeting controls the UI is now prepared for.
              </p>
            </div>
          </div>
          <div className={styles.splitList}>
            <div className={styles.splitItem}>
              <div className={styles.splitTitle}>Consent and channel filters</div>
              <p className={styles.splitText}>
                Filter to SMS-safe customers, email-ready customers, or both.
              </p>
            </div>
            <div className={styles.splitItem}>
              <div className={styles.splitTitle}>Tags and event history</div>
              <p className={styles.splitText}>
                Target VIPs, repeat attendees, prospects, or location-based lists.
              </p>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Grid actions</h2>
              <p className={styles.panelText}>
                Planned actions for the next backend-connected version.
              </p>
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.buttonGhost}>Select all SMS contacts</button>
            <button className={styles.buttonGhost}>Create event list</button>
            <button className={styles.buttonPrimary}>Launch campaign</button>
          </div>
        </article>
      </section>
    </div>
  );
}
