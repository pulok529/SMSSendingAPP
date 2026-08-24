"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import { Plus, Trash2, X, MessageSquare, Mail } from "lucide-react";

type Template = {
  id: string;
  title: string;
  category: string;
  channel: string;
  body: string;
  variables: string[];
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Promotional",
    channel: "SMS",
    body: "Hi {{name}}, your exclusive offer is ready!",
    variables: "name",
  });

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error("Failed to load templates", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category.trim(),
          channel: formData.channel,
          body: formData.body.trim(),
          variables: formData.variables.split(",").map((v) => v.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          title: "",
          category: "Promotional",
          channel: "SMS",
          body: "Hi {{name}}, your exclusive offer is ready!",
          variables: "name",
        });
        loadTemplates();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create template.");
      }
    } catch (e) {
      console.error("Error creating template", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error("Error deleting template", e);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Message Templates</h2>
            <p className={styles.panelText}>
              Design and store reusable SMS and email messages with dynamic merge tags.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={styles.primaryButton}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>

        <div className={styles.gridThree}>
          {templates.length > 0 ? (
            templates.map((template) => (
              <article key={template.id} className={styles.card}>
                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{template.title}</h3>
                    <p className={styles.cardSubtle}>{template.category}</p>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: template.channel === "SMS" ? "#FEF3C7" : "#DBEAFE",
                      color: template.channel === "SMS" ? "#B45309" : "#1D4ED8",
                    }}
                  >
                    {template.channel === "SMS" ? <MessageSquare size={12} /> : <Mail size={12} />}
                    {template.channel}
                  </span>
                </div>

                <div style={{ padding: "12px", background: "#F7EFE6", borderRadius: "8px", marginTop: "10px" }}>
                  <p style={{ fontSize: "13px", color: "#22150E", margin: 0, lineHeight: 1.4 }}>
                    {template.body}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                  <div className={styles.pillRow}>
                    {template.variables && template.variables.map((v) => (
                      <span key={v} className={styles.pill}>
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDelete(template.id, template.title)}
                    title="Delete template"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 0", color: "#8E7F75" }}>
              {loading ? "Loading templates..." : "No message templates saved yet. Click 'Create Template' to start."}
            </div>
          )}
        </div>
      </section>

      {/* Create Template Modal */}
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
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#22150E" }}>Create Message Template</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8E7F75" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Template Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Booking Reminder"
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
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Promotional, Reminder"
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
                      <option value="SMS">SMS</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Template Message Body *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
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
                    Variables / Merge Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="e.g. name, event, venue"
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
                    {submitting ? "Saving..." : "Save Template"}
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
