import styles from "@/components/ui/dashboard.module.css";
import { events } from "@/lib/mock-data";
import { StatusChip } from "@/components/ui/status-chip";

export default function EventsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Create event</h2>
              <p className={styles.panelText}>
                Event records become the anchor for bulk customer communication.
              </p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.label}>
              Event title
              <input className={styles.field} defaultValue="Winter client briefing" />
            </label>
            <label className={styles.label}>
              Event date
              <input className={styles.field} type="datetime-local" />
            </label>
            <label className={styles.label}>
              Venue
              <input className={styles.field} defaultValue="Sydney Harbour Room" />
            </label>
            <label className={styles.label}>
              Audience segment
              <input className={styles.field} defaultValue="VIP + repeat customers" />
            </label>
          </div>

          <label className={styles.label} style={{ marginTop: 16 }}>
            Event notes
            <textarea
              className={styles.textarea}
              defaultValue="Use this event record to anchor both the invite campaign and the same-day reminder."
            />
          </label>

          <div className={styles.buttonRow} style={{ marginTop: 16 }}>
            <button className={styles.buttonPrimary}>Save event draft</button>
            <button className={styles.buttonGhost}>Generate campaign shell</button>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Existing events</h2>
              <p className={styles.panelText}>
                Current and upcoming event records already mapped to outreach.
              </p>
            </div>
          </div>
          <div className={styles.splitList}>
            {events.map((event) => (
              <div key={event.id} className={styles.splitItem}>
                <div className={styles.panelHeader} style={{ marginBottom: 0 }}>
                  <div>
                    <div className={styles.splitTitle}>{event.title}</div>
                    <p className={styles.splitText}>
                      {event.date} · {event.venue} · {event.audience}
                    </p>
                  </div>
                  <StatusChip status={event.status} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
