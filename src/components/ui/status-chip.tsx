import styles from "./dashboard.module.css";

type StatusChipProps = {
  status: string;
};

export function StatusChip({ status }: StatusChipProps) {
  const key = status.toLowerCase();

  const className =
    key === "sent"
      ? styles.statusSent
      : key === "queued"
        ? styles.statusQueued
        : key === "failed"
          ? styles.statusFailed
          : key === "online"
            ? styles.statusOnline
            : key === "offline"
              ? styles.statusOffline
              : key === "idle"
                ? styles.statusIdle
                : key === "draft"
                  ? styles.statusDraft
                  : key === "scheduled"
                    ? styles.statusScheduled
                    : key === "sending"
                      ? styles.statusSending
                      : styles.statusCompleted;

  return <span className={className}>{status}</span>;
}
