import styles from "@/components/ui/dashboard.module.css";
import { deviceStatus } from "@/lib/mock-data";
import { StatusChip } from "@/components/ui/status-chip";

export default function DevicePage() {
  return (
    <div className={styles.page}>
      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Android sender bridge</h2>
              <p className={styles.panelText}>
                This screen is the web-side monitor for the companion phone that
                will actually send your SMS messages from your mobile number.
              </p>
            </div>
            <StatusChip status={deviceStatus.status} />
          </div>

          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Registered device</span>
            <strong className={styles.metricValue}>{deviceStatus.deviceName}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Phone number</span>
            <strong className={styles.metricValue}>{deviceStatus.phoneNumber}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Carrier</span>
            <strong className={styles.metricValue}>{deviceStatus.operator}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Last seen</span>
            <strong className={styles.metricValue}>{deviceStatus.lastSeen}</strong>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Queue depth</span>
            <strong className={styles.metricValue}>{deviceStatus.queuedJobs}</strong>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Connection lifecycle</h2>
              <p className={styles.panelText}>
                Planned backend-to-phone behavior for production.
              </p>
            </div>
          </div>
          <div className={styles.splitList}>
            <div className={styles.splitItem}>
              <div className={styles.splitTitle}>1. Device registration</div>
              <p className={styles.splitText}>
                The Android app signs in, uploads its device token, and becomes
                the approved SMS sender for the user account.
              </p>
            </div>
            <div className={styles.splitItem}>
              <div className={styles.splitTitle}>2. Job assignment</div>
              <p className={styles.splitText}>
                When the web app queues SMS, the backend assigns pending jobs to
                this device in controlled batches.
              </p>
            </div>
            <div className={styles.splitItem}>
              <div className={styles.splitTitle}>3. Status sync</div>
              <p className={styles.splitText}>
                The phone reports sent, failed, and retryable messages so the
                dashboard can show campaign progress live.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
