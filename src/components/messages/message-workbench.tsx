"use client";

import { useEffect, useState } from "react";
import styles from "./message-workbench.module.css";
import {
  MessageSquareQuote,
  Plus,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
} from "lucide-react";

interface MessageItem {
  id: string;
  title: string | null;
  subject: string | null;
  body: string;
  channel: "SMS" | "EMAIL" | "BOTH";
  type: "AUTO" | "MANUAL";
  status: "ACTIVE" | "DISABLED";
  version: number;
  fromNumber: string | null;
  createdAt: string;
}

export function MessageWorkbench() {
  const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual");
  const [autoMessages, setAutoMessages] = useState<MessageItem[]>([]);
  const [manualMessages, setManualMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal: Create or Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    body: "",
    channel: "SMS" as "SMS" | "EMAIL" | "BOTH",
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/messages", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAutoMessages(data.auto || []);
        setManualMessages(data.manual || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ title: "", subject: "", body: "", channel: "SMS" });
    setShowModal(true);
  };

  const handleOpenEdit = (m: MessageItem) => {
    setIsEditing(true);
    setEditingId(m.id);
    setForm({
      title: m.title || "",
      subject: m.subject || "",
      body: m.body,
      channel: m.channel,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      if (isEditing && editingId) {
        const res = await fetch(`/api/messages/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to edit template.");

        setFeedback({
          type: "success",
          message: `Template updated! Incremented to version v${data.newVersionNumber} (previous v${data.previousVersion} disabled).`,
        });
      } else {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create template.");

        setFeedback({
          type: "success",
          message: `Template "${form.title}" created successfully!`,
        });
      }

      setShowModal(false);
      fetchMessages();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive this template?")) return;
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setManualMessages((prev) => prev.filter((m) => m.id !== id));
        setFeedback({ type: "success", message: "Template archived." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const insertTag = (tag: string) => {
    setForm((prev) => ({ ...prev, body: prev.body + " " + tag }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>
            <MessageSquareQuote size={26} color="#3b82f6" />
            Message & Template Library
          </h1>
          <p>Draft reusable broadcast templates with auto-versioning, and review automatically logged sent copy.</p>
        </div>

        <button onClick={handleOpenCreate} className={styles.btnPrimary}>
          <Plus size={18} />
          Create New Template
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            background: feedback.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${feedback.type === "success" ? "#10b981" : "#ef4444"}`,
            color: feedback.type === "success" ? "#34d399" : "#f87171",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className={styles.tabBar}>
        <button
          onClick={() => setActiveTab("manual")}
          className={`${styles.tabButton} ${activeTab === "manual" ? styles.tabActive : ""}`}
        >
          <Sparkles size={16} />
          Manual Templates ({manualMessages.length})
        </button>

        <button
          onClick={() => setActiveTab("auto")}
          className={`${styles.tabButton} ${activeTab === "auto" ? styles.tabActive : ""}`}
        >
          <Clock size={16} />
          Auto-Logged Dispatches ({autoMessages.length})
        </button>
      </div>

      {activeTab === "manual" && (
        <div className={styles.card}>
          {manualMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <MessageSquare size={36} style={{ margin: "0 auto 0.75rem", color: "#60a5fa" }} />
              <h3>No Draft Templates Yet</h3>
              <p style={{ fontSize: "0.875rem" }}>Click &quot;Create New Template&quot; above to build your first template.</p>
            </div>
          ) : (
            <div className={styles.gridCards}>
              {manualMessages.map((m) => (
                <div key={m.id} className={styles.templateCard}>
                  <div className={styles.templateHeader}>
                    <div>
                      <h3 className={styles.templateTitle}>{m.title || "Untitled Template"}</h3>
                      <span className={styles.versionBadge}>v{m.version}</span>
                    </div>

                    <span
                      className={`${styles.channelBadge} ${
                        m.channel === "SMS" ? styles.channelSms : m.channel === "EMAIL" ? styles.channelEmail : styles.channelBoth
                      }`}
                    >
                      {m.channel}
                    </span>
                  </div>

                  {m.subject && (
                    <div className={styles.templateSubject}>
                      <strong>Subject:</strong> {m.subject}
                    </div>
                  )}

                  <div className={styles.templateBody}>{m.body}</div>

                  <div className={styles.cardFooter}>
                    <span>Created {new Date(m.createdAt).toLocaleDateString()}</span>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button onClick={() => handleOpenEdit(m)} className={styles.btnSmall} title="Edit Template">
                        <Edit size={12} /> Edit (v{m.version + 1})
                      </button>
                      <button onClick={() => handleDelete(m.id)} className={styles.btnSmall} style={{ color: "#f87171" }} title="Archive">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "auto" && (
        <div className={styles.card}>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
            Every time an ad-hoc message is dispatched from the Dispatch Console, a read-only audit copy is automatically stored here.
          </p>

          {autoMessages.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>No automatic messages logged yet.</p>
          ) : (
            <div className={styles.gridCards}>
              {autoMessages.map((m) => (
                <div key={m.id} className={styles.templateCard} style={{ opacity: 0.9 }}>
                  <div className={styles.templateHeader}>
                    <div>
                      <h3 className={styles.templateTitle}>{m.title || "Dispatched Copy"}</h3>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Auto Audit Record</span>
                    </div>

                    <span
                      className={`${styles.channelBadge} ${
                        m.channel === "SMS" ? styles.channelSms : m.channel === "EMAIL" ? styles.channelEmail : styles.channelBoth
                      }`}
                    >
                      {m.channel}
                    </span>
                  </div>

                  {m.subject && (
                    <div className={styles.templateSubject}>
                      <strong>Subject:</strong> {m.subject}
                    </div>
                  )}

                  <div className={styles.templateBody}>{m.body}</div>

                  <div className={styles.cardFooter}>
                    <span>Sent on {new Date(m.createdAt).toLocaleString()}</span>
                    <span style={{ color: "#10b981", fontSize: "0.75rem", fontWeight: 600 }}>Active Audit</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create or Edit Template */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{isEditing ? "Edit Template (Creates New Version)" : "Create Message Template"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGroup}>
                <label>Template Title *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Appointment Reminder or Flash Promo"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Target Channel</label>
                <select
                  className={styles.select}
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value as any })}
                >
                  <option value="SMS">SMS Message</option>
                  <option value="EMAIL">Email Message</option>
                  <option value="BOTH">Dual (SMS & Email)</option>
                </select>
              </div>

              {(form.channel === "EMAIL" || form.channel === "BOTH") && (
                <div className={styles.formGroup}>
                  <label>Email Subject</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Special Offer for {{name}}"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>Message Content *</label>
                  <div className={styles.tagPills}>
                    <button type="button" onClick={() => insertTag("{{name}}")} className={styles.tagPill}>
                      {"+ {{name}}"}
                    </button>
                    <button type="button" onClick={() => insertTag("{{phone}}")} className={styles.tagPill}>
                      {"+ {{phone}}"}
                    </button>
                    <button type="button" onClick={() => insertTag("{{email}}")} className={styles.tagPill}>
                      {"+ {{email}}"}
                    </button>
                    <button type="button" onClick={() => insertTag("{{company}}")} className={styles.tagPill}>
                      {"+ {{company}}"}
                    </button>
                  </div>
                </div>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  placeholder="Hello {{name}}, we are glad to inform you..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {isEditing ? "Save as New Version" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
