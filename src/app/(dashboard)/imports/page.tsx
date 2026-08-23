import { SmsImportSender } from "@/components/import/sms-import-sender";
import styles from "@/components/ui/dashboard.module.css";

const mappingRows = [
  ["name", "Recipient name", "Used by [name]"],
  ["mobile", "SMS destination number", "Required"],
  ["company", "Company or organization", "Optional placeholder"],
  ["city", "Location", "Optional placeholder"],
  ["event_date", "Event or appointment date", "Optional placeholder"],
  ["tags", "Comma-separated segments", "Optional"],
];

export default function ImportsPage() {
  return (
    <div className={styles.page}>
      <SmsImportSender />

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Recommended spreadsheet columns</h2>
            <p className={styles.panelText}>
              The sender accepts any extra columns. Use the column name inside
              square brackets to personalize each SMS.
            </p>
          </div>
          <span className={styles.badge}>Template-ready</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Column</th>
                <th>Purpose</th>
                <th>SMS usage</th>
              </tr>
            </thead>
            <tbody>
              {mappingRows.map(([column, purpose, usage]) => (
                <tr key={column}>
                  <td>{column}</td>
                  <td>{purpose}</td>
                  <td>{usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
