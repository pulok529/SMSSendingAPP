"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import { CampaignQueuePanel } from "@/components/campaigns/campaign-queue-panel";
import { Mail, Plus, Send, X } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  audienceSize: number;
  sentCount: number;
  failedCount: number;
  status: string;
  launchedAt?: string;
  event?: { title: string };
};

type EventOption = {
  id: string;
  title: string;
  smsTemplate: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    channel: "SMS",
    eventId: "",
    message: "Hi {{name}}, update from Pulse Dispatch.",
    limit: 50,
  });

  const loadData = async () => {
    try {
      const [campRes, evRes] = await Promise.all([
        fetch("/api/campaigns", {
        credentials: "include" }),
        fetch("/api/events", {
        credentials: "include" }),
      ]);

      if (campRes.ok) {
        const data = await campRes.json();
        setCampaigns(data.campaigns || []);
      }

      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData.events || []);
      }
    } catch (e) {
      console.error("Failed to load campaigns", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          channel: "SMS",
          eventId: "",
          message: "Hi {{name}}, update from Pulse Dispatch.",
          limit: 50,
        });
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create campaign.");
      }
    } catch (e) {
      console.error("Error creating campaign", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Campaigns Manager</h2>
            <p className={styles.panelText}>
              Launch SMS and email broadcasts to consented customers and dispatch jobs to your linked Android device.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={styles.primaryButton}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} />
            Create Campaign
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Linked Event</th>
                <th>Audience</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <div className={styles.rowMeta}>
                        <strong>{campaign.name}</strong>
                        <span className={styles.rowSubtle}>
                          Launched {campaign.launchedAt ? new Date(campaign.launchedAt).toLocaleDateString() : "Just now"}
                        </span>
                      </div>
                    </td>
                    <td>{campaign.channel}</td>
                    <td>{campaign.event?.title || "Standalone"}</td>
                    <td>{campaign.audienceSize} contacts</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
                        <span style={{ color: "#15803D", fontWeight: 600 }}>{campaign.sentCount} sent</span>
                        {campaign.failedCount > 0 && (
                          <span style={{ color: "#991B1B" }}>{campaign.failedCount} failed</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusChip status={campaign.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px 0", color: "#8E7F75" }}>
                    {loading ? "Loading campaigns..." : "No campaigns created yet. Click 'Create Campaign' to start."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Live SIM SMS Dispatch Queue Panel */}
      <CampaignQueuePanel />

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#22150E" }}>Create New Campaign</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8E7F75" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. VIP Product Launch SMS"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E4D8CE",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                      Channel
                    </label>
                    <select
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E4D8CE",
                        fontSize: "14px",
                      }}
                    >
                      <option value="SMS">SMS (Android SIM)</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                      Linked Event (Optional)
                    </label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => {
                        const evId = e.target.value;
                        const ev = events.find((x) => x.id === evId);
                        setFormData({
                          ...formData,
                          eventId: evId,
                          message: ev ? ev.smsTemplate : formData.message,
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E4D8CE",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">None (Standalone)</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Message Content *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E4D8CE",
                      fontSize: "13px",
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{ fontSize: "12px", color: "#8E7F75", marginTop: "4px" }}>
                    Placeholder <code>{"{{name}}"}</code> will be replaced with recipient name.
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Audience Send Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E4D8CE",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={styles.secondaryButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.primaryButton}
                  >
                    {submitting ? "Launching..." : "Launch & Queue SMS"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
