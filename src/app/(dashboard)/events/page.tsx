"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { StatusChip } from "@/components/ui/status-chip";
import Link from "next/link";
import { CalendarPlus, Trash2, X, Send } from "lucide-react";

type EventRecord = {
  id: string;
  title: string;
  date: string;
  venue: string;
  audience: string;
  smsTemplate: string;
  emailSubject: string;
  status: string;
  _count?: { campaigns: number };
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    venue: "",
    audience: "All Contacts",
    smsTemplate: "Hi {{name}}, join us for {{event}} at {{venue}} on {{date}}!",
    emailSubject: "Invitation: {{event}}",
    status: "PLANNING",
  });

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date || !formData.venue.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          title: "",
          date: "",
          venue: "",
          audience: "All Contacts",
          smsTemplate: "Hi {{name}}, join us for {{event}} at {{venue}} on {{date}}!",
          emailSubject: "Invitation: {{event}}",
          status: "PLANNING",
        });
        loadEvents();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create event.");
      }
    } catch (e) {
      console.error("Error creating event", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
      }
    } catch (e) {
      console.error("Error deleting event", e);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Events Management</h2>
            <p className={styles.panelText}>
              Create events, assign SMS broadcast templates, and launch multichannel broadcasts.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={styles.primaryButton}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <CalendarPlus size={16} />
            Create Event
          </button>
        </div>

        <div className={styles.gridThree}>
          {events.length > 0 ? (
            events.map((event) => (
              <article key={event.id} className={styles.card}>
                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{event.title}</h3>
                    <p className={styles.cardSubtle}>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <StatusChip status={event.status} />
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Venue</span>
                  <strong className={styles.metricValue}>{event.venue}</strong>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Target Audience</span>
                  <strong className={styles.metricValue}>{event.audience}</strong>
                </div>

                <div style={{ marginTop: "12px", padding: "12px", background: "#F7EFE6", borderRadius: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#CE631D", textTransform: "uppercase", marginBottom: "4px" }}>
                    SMS Broadcast Message
                  </div>
                  <p style={{ fontSize: "13px", color: "#22150E", margin: 0, lineHeight: 1.4 }}>
                    {event.smsTemplate}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #F0E6DD" }}>
                  <Link
                    href="/campaigns"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#CE631D",
                      textDecoration: "none",
                    }}
                  >
                    <Send size={14} />
                    Launch Campaign
                  </Link>

                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    title="Delete event"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#991B1B",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 0", color: "#8E7F75" }}>
              {loading ? "Loading events..." : "No events created yet. Click 'Create Event' to start."}
            </div>
          )}
        </div>
      </section>

      {/* Create Event Modal */}
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
              maxWidth: "540px",
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
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#22150E" }}>Create New Event</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8E7F75" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. VIP Product Showcase 2026"
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
                      Event Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E4D8CE",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                      Venue / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g. Grand Ballroom, Sydney"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E4D8CE",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    placeholder="e.g. VIP Clients, All Customers"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E4D8CE",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    SMS Broadcast Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.smsTemplate}
                    onChange={(e) => setFormData({ ...formData, smsTemplate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E4D8CE",
                      fontSize: "13px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={formData.emailSubject}
                    onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                    placeholder="e.g. Exclusive Invitation"
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
                    {submitting ? "Saving..." : "Create Event"}
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
