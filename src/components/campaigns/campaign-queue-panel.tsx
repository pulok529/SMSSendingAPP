"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import { RefreshCw, Smartphone, CheckCircle2 } from "lucide-react";

type QueueJob = {
  id: string;
  phoneNumber: string;
  customerName: string;
  campaignName: string;
  message: string;
  status: string;
};

export function CampaignQueuePanel() {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/mobile/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error("Failed to fetch pending jobs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.panel} style={{ marginTop: "24px" }}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Live Android SIM Dispatch Queue</h2>
          <p className={styles.panelText}>
            Real-time queue of outgoing SMS jobs waiting for your linked Android phone to dispatch.
          </p>
        </div>
        <button
          onClick={fetchJobs}
          className={styles.secondaryButton}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} />
          Refresh Queue
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone Number</th>
              <th>Campaign</th>
              <th>Message Preview</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.customerName}</strong>
                  </td>
                  <td>{job.phoneNumber}</td>
                  <td>{job.campaignName}</td>
                  <td style={{ maxWidth: "320px" }}>
                    <span style={{ fontSize: "13px", color: "#22150E" }}>{job.message}</span>
                  </td>
                  <td>
                    <StatusChip status={job.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "#8E7F75" }}>
                  {loading ? (
                    "Loading live queue..."
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#15803D", fontWeight: 600 }}>
                      <CheckCircle2 size={18} />
                      Queue is clear. All SMS jobs have been dispatched by your Android phone!
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
