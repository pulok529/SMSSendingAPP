import styles from "@/components/ui/dashboard.module.css";
import { deliveryLogs } from "@/lib/mock-data";
import { StatusChip } from "@/components/ui/status-chip";

export default function LogsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Delivery log</h2>
            <p className={styles.panelText}>
              Customer-by-customer delivery history for both SMS and email.
            </p>
          </div>
          <span className={styles.badge}>Audit trail</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Timestamp</th>
                <th>Result</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {deliveryLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.customer}</td>
                  <td>{log.campaign}</td>
                  <td>{log.channel}</td>
                  <td>{log.timestamp}</td>
                  <td>
                    <StatusChip status={log.status} />
                  </td>
                  <td>{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
