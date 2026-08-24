"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import { Smartphone, RefreshCw, Battery, Radio, ShieldCheck } from "lucide-react";

type Device = {
  id: string;
  deviceName: string;
  phoneNumber: string;
  operator: string;
  status: string;
  queuedJobs: number;
  battery?: string;
  lastSeenAt?: string;
  user?: { name: string; email: string; company?: string };
};

export default function DevicePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDevices = async () => {
    try {
      const res = await fetch("/api/devices", {
        credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (e) {
      console.error("Failed to load devices", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Linked Android Devices</h2>
            <p className={styles.panelText}>
              Real-time telemetry and SIM gateway status of your registered Android phones.
            </p>
          </div>
          <button
            onClick={loadDevices}
            className={styles.secondaryButton}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} />
            Refresh Telemetry
          </button>
        </div>

        <div className={styles.gridThree}>
          {devices.length > 0 ? (
            devices.map((device) => (
              <article key={device.id} className={styles.card}>
                <div className={styles.panelHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: "#F7EFE6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#CE631D",
                      }}
                    >
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 className={styles.cardTitle}>{device.deviceName}</h3>
                      <p className={styles.cardSubtle}>{device.operator}</p>
                    </div>
                  </div>
                  <StatusChip status={device.status} />
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>SIM Phone Number</span>
                  <strong className={styles.metricValue}>{device.phoneNumber}</strong>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Battery Level</span>
                  <strong className={styles.metricValue} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Battery size={16} color="#15803D" />
                    {device.battery || "N/A"}
                  </strong>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Pending Queue</span>
                  <strong className={styles.metricValue}>{device.queuedJobs} SMS</strong>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Last Heartbeat</span>
                  <strong className={styles.metricValue}>
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : "Never"}
                  </strong>
                </div>
              </article>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 0", color: "#8E7F75" }}>
              {loading
                ? "Loading device connections..."
                : "No Android companion devices linked yet. Install the Android App on your phone and sign in to connect."}
            </div>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>How to Pair Your Android Phone</h2>
            <p className={styles.panelText}>
              Your phone acts as your private SMS gateway hardware.
            </p>
          </div>
        </div>

        <div className={styles.splitList}>
          <div className={styles.splitItem}>
            <div className={styles.splitTitle}>1. Install Pulse Sender APK</div>
            <p className={styles.splitText}>
              Download and install the companion Android application on any Android phone with an active SIM card.
            </p>
          </div>
          <div className={styles.splitItem}>
            <div className={styles.splitTitle}>2. Sign In with Client Credentials</div>
            <p className={styles.splitText}>
              Log in with your client account credentials. The phone will automatically link to your tenant profile and report its SIM number.
            </p>
          </div>
          <div className={styles.splitItem}>
            <div className={styles.splitTitle}>3. Automatic SIM Dispatch</div>
            <p className={styles.splitText}>
              When you launch an SMS campaign from the web dashboard, your phone will automatically pull pending jobs and dispatch them through your carrier SIM.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
