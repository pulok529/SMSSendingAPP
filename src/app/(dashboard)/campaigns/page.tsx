import { CampaignQueuePanel } from "@/components/campaigns/campaign-queue-panel";
import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import { campaigns } from "@/lib/mock-data";

export default function CampaignsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.twoColumn}>
        <CampaignQueuePanel />

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Campaign monitor</h2>
              <p className={styles.panelText}>
                Sample campaign states to shape the backend integration.
              </p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Channel</th>
                  <th>Launched</th>
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
                          {campaign.sent}/{campaign.audienceSize} processed
                        </span>
                      </div>
                    </td>
                    <td>{campaign.channel}</td>
                    <td>{campaign.launchedAt}</td>
                    <td>
                      <StatusChip status={campaign.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
