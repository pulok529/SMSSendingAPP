"use client";

import { useEffect, useState } from "react";
import styles from "./email-settings-workbench.module.css";
import { Mail, Server, ShieldCheck, Send, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";

export function EmailSettingsWorkbench() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    provider: "SMTP",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Pulse Sender",
  });

  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/email-config", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setForm({
            provider: data.config.provider || "SMTP",
            host: data.config.host || "smtp.gmail.com",
            port: data.config.port || 587,
            secure: Boolean(data.config.secure),
            username: data.config.username || "",
            password: data.config.password || "",
            fromEmail: data.config.fromEmail || "",
            fromName: data.config.fromName || "Pulse Sender",
          });
          if (data.config.fromEmail) {
            setTestEmail(data.config.fromEmail);
          }
        }
      }
    } catch (e: any) {
      setErrorMsg("Failed to load email configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/email-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save email settings.");
      }

      setSuccessMsg("SMTP settings saved successfully! You can now test the connection below.");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setErrorMsg("Please enter a recipient email for testing.");
      return;
    }

    setTesting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipient: testEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Test email delivery failed.");
      }

      setSuccessMsg(`✓ Test email delivered successfully to ${testEmail}!`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>Loading Email Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>
            <Mail size={24} color="#3b82f6" />
            Dynamic Email SMTP Configuration
          </h1>
          <p>Configure and manage your outgoing email transport for multi-channel broadcasts and notifications.</p>
        </div>
      </div>

      {successMsg && (
        <div className={styles.alertSuccess}>
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className={styles.alertError}>
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className={styles.card}>
        <div className={styles.cardHeader}>
          <Server size={20} color="#60a5fa" />
          <h2>SMTP Server Details</h2>
        </div>

        <div className={styles.grid2}>
          <div className={styles.formGroup}>
            <label>SMTP Host Server</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>SMTP Port</label>
            <select
              className={styles.select}
              value={form.port}
              onChange={(e) => {
                const port = parseInt(e.target.value, 10);
                setForm({ ...form, port, secure: port === 465 });
              }}
            >
              <option value={587}>587 (TLS / STARTTLS - Recommended)</option>
              <option value={465}>465 (SSL / Direct Secure)</option>
              <option value={25}>25 (Standard Unencrypted)</option>
              <option value={2525}>2525 (Alternative TLS)</option>
            </select>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>SSL / TLS Secure Connection</span>
            <span className={styles.toggleDesc}>Enable for port 465 or strict TLS handshakes.</span>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={form.secure}
              onChange={(e) => setForm({ ...form, secure: e.target.checked })}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.cardHeader} style={{ marginTop: "1rem" }}>
          <KeyRound size={20} color="#60a5fa" />
          <h2>Authentication & Sender Identity</h2>
        </div>

        <div className={styles.grid2}>
          <div className={styles.formGroup}>
            <label>SMTP Username / Email</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. your-email@gmail.com"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>SMTP Password / App Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Enter SMTP or App password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>From Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="e.g. notifications@yourdomain.com"
              value={form.fromEmail}
              onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>From Display Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Pulse Dispatcher"
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.btnPrimary}>
            <ShieldCheck size={18} />
            {saving ? "Saving..." : "Save SMTP Settings"}
          </button>
        </div>
      </form>

      <div className={styles.testCard}>
        <div className={styles.testCardHeader}>
          <Send size={18} />
          <span>Verify & Send Live Test Email</span>
        </div>
        <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
          Send a quick test message to make sure your mail server connects and dispatches without errors.
        </p>

        <div className={styles.testInputRow}>
          <input
            type="email"
            className={styles.input}
            placeholder="Enter test recipient email address..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testing || !form.host || !form.fromEmail}
            className={styles.btnSecondary}
          >
            {testing ? "Testing..." : "Send Test Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
