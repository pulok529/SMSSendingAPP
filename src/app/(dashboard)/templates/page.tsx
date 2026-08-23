import styles from "@/components/ui/dashboard.module.css";
import { templates } from "@/lib/mock-data";

export default function TemplatesPage() {
  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Reusable message templates</h2>
            <p className={styles.panelText}>
              Store the copy your client uses often for invites, reminders, and
              follow-ups.
            </p>
          </div>
          <span className={styles.badge}>{templates.length} templates</span>
        </div>

        <div className={styles.splitList}>
          {templates.map((template) => (
            <article key={template.id} className={styles.splitItem}>
              <div className={styles.panelHeader} style={{ marginBottom: 0 }}>
                <div>
                  <div className={styles.splitTitle}>
                    {template.name} · {template.channel}
                  </div>
                  <p className={styles.splitText}>
                    Updated {template.updatedAt}
                    <br />
                    {template.body}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
