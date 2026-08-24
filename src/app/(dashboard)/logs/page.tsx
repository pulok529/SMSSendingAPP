"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import { Search, RefreshCw } from "lucide-react";

type DeliveryLog = {
  id: string;
  detail: string;
  status: string;
  channel: string;
  timestamp: string;
  customer?: { name: string; mobile?: string; email?: string };
  campaign?: { name: string };
};

export default function LogsPage() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (channelFilter !== "ALL") params.append("channel", channelFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.deliveries || []);
      }
    } catch (e) {
      console.error("Failed to load logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [statusFilter, channelFilter, search]);

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Delivery & Broadcast Logs</h2>
            <p className={styles.panelText}>
              Live audit trail of all outgoing SMS and email broadcasts sent through the platform.
            </p>
          </div>
          <button
            onClick={loadLogs}
            className={styles.secondaryButton}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 280px",
              maxWidth: "400px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8E7F75",
              }}
            />
            <input
              type="text"
              placeholder="Search recipient, message, or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "10px",
                border: "1px solid #E4D8CE",
                background: "#FFFFFF",
                fontSize: "14px",
                color: "#22150E",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["ALL", "SENT", "PENDING", "FAILED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: statusFilter === status ? "#CE631D" : "#E4D8CE",
                  background: statusFilter === status ? "#CE631D" : "#FFFFFF",
                  color: statusFilter === status ? "#FFFFFF" : "#5F5047",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {status}
              </button>
            ))}

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{
                padding: "7px 14px",
                borderRadius: "20px",
                border: "1px solid #E4D8CE",
                background: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                color: "#5F5047",
              }}
            >
              <option value="ALL">All Channels</option>
              <option value="SMS">SMS Only</option>
              <option value="EMAIL">Email Only</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Message Content</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className={styles.rowMeta}>
                        <strong>{log.customer?.name || "Recipient"}</strong>
                        <span className={styles.rowSubtle}>
                          {log.customer?.mobile || log.customer?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td>{log.campaign?.name || "Manual Dispatch"}</td>
                    <td>{log.channel}</td>
                    <td style={{ maxWidth: "300px" }}>
                      <span style={{ fontSize: "13px", color: "#22150E" }}>{log.detail}</span>
                    </td>
                    <td>
                      <StatusChip status={log.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "#8E7F75" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px 0", color: "#8E7F75" }}>
                    {loading ? "Loading broadcast logs..." : "No delivery logs found matching your filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
