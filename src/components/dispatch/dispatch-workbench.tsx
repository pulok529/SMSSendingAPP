"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import styles from "./dispatch-workbench.module.css";
import {
  Send,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Users2,
  UserPlus,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Search,
  MessageSquareQuote,
  ShieldCheck,
  Check,
  X,
  Clock,
} from "lucide-react";

interface RecipientRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  custom?: string;
  sendSms: boolean;
  sendEmail: boolean;
}

interface GroupOption {
  id: string;
  name: string;
  rank: number | null;
  _count?: { members: number };
}

interface MessageTemplate {
  id: string;
  title: string | null;
  subject: string | null;
  body: string;
  channel: string;
  type: string;
  version?: number;
  createdAt: string;
}

export function DispatchWorkbench() {
  const [inputMode, setInputMode] = useState<"group" | "excel" | "manual" | "paste">("excel");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("Hello {{name}}, we are glad to connect with you from Pulse Sender!");
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [saveToDirectory, setSaveToDirectory] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // Sender metadata
  const [senderPhone, setSenderPhone] = useState("+61 400 000 000 (Default SIM)");
  const [senderEmail, setSenderEmail] = useState("notifications@pulsesender.com");

  // Groups & Templates
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [templates, setTemplates] = useState<{ auto: MessageTemplate[]; manual: MessageTemplate[] }>({ auto: [], manual: [] });
  const [templateTab, setTemplateTab] = useState<"manual" | "auto">("manual");
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Manual 1-by-1 Form
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualCompany, setManualCompany] = useState("");

  // Quick Paste Form
  const [pasteText, setPasteText] = useState("");

  // Grid Controls
  const [filterQuery, setFilterQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const gRes = await fetch("/api/groups", { credentials: "include" });
      if (gRes.ok) {
        const gData = await gRes.json();
        setGroups(gData.all || []);
      }

      const mRes = await fetch("/api/messages", { credentials: "include" });
      if (mRes.ok) {
        const mData = await mRes.json();
        setTemplates(mData);
      }

      const eRes = await fetch("/api/email-config", { credentials: "include" });
      if (eRes.ok) {
        const eData = await eRes.json();
        if (eData.config?.fromEmail) {
          setSenderEmail(eData.config.fromEmail);
        }
      }

      const dRes = await fetch("/api/devices", { credentials: "include" });
      if (dRes.ok) {
        const dData = await dRes.json();
        if (dData.devices?.length > 0) {
          const d = dData.devices[0];
          setSenderPhone((d.phoneNumber || "Primary SIM") + " (" + (d.deviceName || "Android Gateway") + ")");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectGroup = async (groupId: string) => {
    setSelectedGroupId(groupId);
    if (!groupId) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const loaded: RecipientRow[] = (data.contacts || []).map((c: any) => ({
          id: c.id || Math.random().toString(36).substring(7),
          name: c.name || "Contact",
          phone: c.contactNo || "",
          email: c.email || "",
          company: c.others || "",
          sendSms: Boolean(c.contactNo),
          sendEmail: Boolean(c.email),
        }));

        setRecipients(loaded);
        setFeedback({ type: "success", message: `Loaded ${loaded.length} contacts from group "${data.group?.name}".` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Failed to load group members." });
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        if (!wsName) throw new Error("No sheet in file");
        const ws = wb.Sheets[wsName];
        if (!ws) throw new Error("Could not read sheet");
        const raw = XLSX.utils.sheet_to_json<any>(ws);

        const loaded: RecipientRow[] = raw.map((r, i) => {
          const name = String(r.Name || r.name || r["Full Name"] || ("Contact #" + (i + 1))).trim();
          const phone = String(r.Phone || r.phone || r.Mobile || r.mobile || r["Contact No"] || "").trim();
          const email = String(r.Email || r.email || "").trim();
          const company = String(r.Company || r.company || r.Notes || "").trim();

          return {
            id: `excel_${i}_${Date.now()}`,
            name,
            phone,
            email,
            company,
            sendSms: Boolean(phone && phone.length >= 5),
            sendEmail: Boolean(email && email.includes("@")),
          };
        });

        setRecipients(loaded);
        setFeedback({ type: "success", message: `Successfully parsed ${loaded.length} recipients from spreadsheet!` });
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to parse file." });
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    const sample = [
      { "Full Name": "Alexander Wright", Mobile: "+61412345678", Email: "alex@example.com", Company: "Sydney Tech Ltd" },
      { "Full Name": "Emily Watson", Mobile: "0498765432", Email: "emily.w@example.com", Company: "Apex Retailers" },
      { "Full Name": "David Chen", Mobile: "+61455112233", Email: "david@example.com", Company: "Chen Logistics" },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recipients");
    XLSX.writeFile(wb, "Pulse_Dispatch_Sample.xlsx");
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName && !manualPhone && !manualEmail) return;

    const newRow: RecipientRow = {
      id: `man_${Date.now()}`,
      name: manualName.trim() || "Valued Contact",
      phone: manualPhone.trim(),
      email: manualEmail.trim(),
      company: manualCompany.trim(),
      sendSms: Boolean(manualPhone.trim()),
      sendEmail: Boolean(manualEmail.trim()),
    };

    setRecipients((prev) => [newRow, ...prev]);
    setManualName("");
    setManualPhone("");
    setManualEmail("");
    setManualCompany("");
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split(/[\r\n]+/);
    const parsed: RecipientRow[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/[,;\t]+/);
      if (parts.length === 1) {
        const val = parts[0]?.trim() || "";
        if (val.includes("@")) {
          parsed.push({
            id: `pst_${idx}_${Date.now()}`,
            name: `Recipient #${idx + 1}`,
            phone: "",
            email: val,
            sendSms: false,
            sendEmail: true,
          });
        } else if (val) {
          parsed.push({
            id: `pst_${idx}_${Date.now()}`,
            name: `Recipient #${idx + 1}`,
            phone: val,
            email: "",
            sendSms: true,
            sendEmail: false,
          });
        }
      } else if (parts.length >= 2) {
        const name = parts[0]?.trim() || `Recipient #${idx + 1}`;
        const phone = parts[1]?.trim() || "";
        const email = parts[2]?.trim() || "";

        parsed.push({
          id: `pst_${idx}_${Date.now()}`,
          name,
          phone,
          email,
          sendSms: Boolean(phone),
          sendEmail: Boolean(email),
        });
      }
    });

    setRecipients(parsed);
    setPasteText("");
    setFeedback({ type: "success", message: `Added ${parsed.length} recipients from pasted text.` });
  };

  const handleToggleAllSms = (checked: boolean) => {
    setRecipients((prev) => prev.map((r) => ({ ...r, sendSms: checked })));
  };

  const handleToggleAllEmail = (checked: boolean) => {
    setRecipients((prev) => prev.map((r) => ({ ...r, sendEmail: checked })));
  };

  const handleCleanInvalid = () => {
    setRecipients((prev) =>
      prev.filter(
        (r) => (r.sendSms && r.phone.replace(/[^\d+]/g, "").length >= 5) || (r.sendEmail && r.email.includes("@"))
      )
    );
  };

  const charCount = message.length;
  const isUnicode = /[^\u0000-\u00ff]/.test(message);
  const segmentLimit = isUnicode ? 70 : 160;
  const segments = Math.ceil(charCount / segmentLimit) || 1;

  const smsReadyCount = recipients.filter((r) => r.sendSms && r.phone.replace(/[^\d+]/g, "").length >= 5).length;
  const emailReadyCount = recipients.filter((r) => r.sendEmail && r.email.includes("@")).length;
  const hasEmailSelected = recipients.some((r) => r.sendEmail);

  const handleApplyTemplate = (tpl: MessageTemplate) => {
    setMessage(tpl.body);
    if (tpl.subject) setSubject(tpl.subject);
    setShowTemplateModal(false);
  };

  const insertTag = (tag: string) => {
    setMessage((prev) => prev + " " + tag);
  };

  const handleExecuteDispatch = async () => {
    setDispatching(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/campaigns/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject: hasEmailSelected ? subject || "Update from Pulse Sender" : undefined,
          message,
          recipients: recipients.map((r) => ({
            name: r.name,
            phone: r.phone,
            email: r.email,
            company: r.company,
            custom: r.custom,
            sendSms: r.sendSms,
            sendEmail: r.sendEmail,
          })),
          saveToDirectory,
          scheduledAt: isScheduled && scheduledAt ? scheduledAt : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch messages.");

      setShowConfirmModal(false);
      setFeedback({
        type: "success",
        message: data.message || `Successfully queued ${data.queuedCount} messages!`,
      });

      setRecipients([]);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDispatching(false);
    }
  };

  const filteredRecipients = useMemo(() => {
    if (!filterQuery) return recipients;
    const q = filterQuery.toLowerCase();
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [recipients, filterQuery]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>
            <Send size={26} color="#3b82f6" />
            Universal Dispatch Console (SMS & Email)
          </h1>
          <p>
            Compose and broadcast messages simultaneously across cellular SMS modems and SMTP Email servers with live preview.
          </p>
        </div>

        <button onClick={() => setShowTemplateModal(true)} className={styles.btnSecondary}>
          <MessageSquareQuote size={18} />
          Add from Message Library
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

      <div className={styles.mainGrid}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Message Composer Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Sparkles size={20} color="#60a5fa" />
                1. Message & Email Subject Composer
              </h2>
            </div>

            {hasEmailSelected && (
              <div className={styles.formGroup}>
                <label>Email Subject Line *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Important Account Notification for {{name}}"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <label>Message Content *</label>
                <div className={styles.tagPills}>
                  <button type="button" onClick={() => insertTag("{{name}}")} className={styles.tagPill}>{"+ {{name}}"}</button>
                  <button type="button" onClick={() => insertTag("{{phone}}")} className={styles.tagPill}>{"+ {{phone}}"}</button>
                  <button type="button" onClick={() => insertTag("{{email}}")} className={styles.tagPill}>{"+ {{email}}"}</button>
                  <button type="button" onClick={() => insertTag("{{company}}")} className={styles.tagPill}>{"+ {{company}}"}</button>
                </div>
              </div>

              <textarea
                className={styles.textarea}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your SMS or Email body here..."
              />

              <div className={styles.counterRow}>
                <span>
                  {charCount} characters • <strong>{segments} SMS Segment(s)</strong> ({isUnicode ? "Unicode Mode" : "GSM-7 Standard"})
                </span>
                <span>Variables replaced per contact during transmission</span>
              </div>
            </div>
          </div>

          {/* Recipient Source & Input Modes Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Users2 size={20} color="#60a5fa" />
                2. Select or Add Recipients
              </h2>

              <div className={styles.tabPills}>
                <button
                  type="button"
                  onClick={() => setInputMode("group")}
                  className={`${styles.tabPill} ${inputMode === "group" ? styles.tabPillActive : ""}`}
                >
                  <Users2 size={14} /> Choose Group
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("excel")}
                  className={`${styles.tabPill} ${inputMode === "excel" ? styles.tabPillActive : ""}`}
                >
                  <FileSpreadsheet size={14} /> Upload Excel/CSV
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("manual")}
                  className={`${styles.tabPill} ${inputMode === "manual" ? styles.tabPillActive : ""}`}
                >
                  <UserPlus size={14} /> Manual 1-by-1
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`${styles.tabPill} ${inputMode === "paste" ? styles.tabPillActive : ""}`}
                >
                  <ClipboardPaste size={14} /> Quick Paste
                </button>
              </div>
            </div>

            {inputMode === "group" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#d1d5db" }}>Select Contact Group to Populate Grid:</label>
                <select
                  className={styles.select}
                  value={selectedGroupId}
                  onChange={(e) => handleSelectGroup(e.target.value)}
                >
                  <option value="">-- Choose a Group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g._count?.members || 0} members) {g.rank ? "[" + "Rank #" + g.rank + "]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {inputMode === "excel" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div
                  style={{
                    border: "2px dashed #374151",
                    borderRadius: "0.75rem",
                    padding: "1.75rem",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.75rem",
                    background: "#1f2937",
                    cursor: "pointer",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={36} color="#3b82f6" />
                  <div>
                    <p style={{ fontWeight: 600, color: "#f9fafb", margin: "0 0 0.25rem 0" }}>
                      Drop Excel (.xlsx, .xls) or CSV here
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      Auto-detects Name, Phone, Email, and Company columns
                    </span>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: "none" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={downloadSampleExcel} type="button" className={styles.btnSecondary} style={{ fontSize: "0.75rem" }}>
                    <Download size={14} />
                    Download Sample Excel Template
                  </button>
                </div>
              </div>
            )}

            {inputMode === "manual" && (
              <form onSubmit={handleAddManual} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Sarah Jenkins"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 0412 345 678"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="e.g. sarah@example.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Company / Notes</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Apex Ltd"
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.btnPrimary} style={{ height: "42px" }}>
                  <UserPlus size={16} /> Add Row
                </button>
              </form>
            )}

            {inputMode === "paste" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Paste lines formatted as: Name, Phone, Email (or single column of numbers/emails)"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleParsePaste} type="button" className={styles.btnPrimary}>
                    <ClipboardPaste size={16} /> Parse & Add to Grid
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Recipient Grid Card */}
          <div className={styles.card}>
            <div className={styles.toolbar}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", background: "#1f2937", border: "1px solid #374151", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", gap: "0.5rem", minWidth: "220px" }}>
                  <Search size={16} color="#9ca3af" />
                  <input
                    type="text"
                    placeholder="Filter recipients..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    style={{ background: "transparent", border: "none", color: "#f9fafb", outline: "none", width: "100%", fontSize: "0.85rem" }}
                  />
                </div>

                <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  <strong>{recipients.length}</strong> Total | <span style={{ color: "#60a5fa" }}>{smsReadyCount} SMS</span> | <span style={{ color: "#34d399" }}>{emailReadyCount} Email</span>
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={handleCleanInvalid} className={styles.btnSecondary} style={{ fontSize: "0.75rem" }}>
                  Clean Invalid
                </button>
                <button onClick={() => setRecipients([])} className={styles.btnSecondary} style={{ fontSize: "0.75rem", color: "#f87171" }}>
                  Clear All
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Recipient Name</th>
                    <th>Phone / Mobile</th>
                    <th>Email Address</th>
                    <th style={{ textAlign: "center" }}>
                      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                        <input
                          type="checkbox"
                          checked={recipients.length > 0 && recipients.every((r) => r.sendSms)}
                          onChange={(e) => handleToggleAllSms(e.target.checked)}
                        />
                        SMS
                      </label>
                    </th>
                    <th style={{ textAlign: "center" }}>
                      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                        <input
                          type="checkbox"
                          checked={recipients.length > 0 && recipients.every((r) => r.sendEmail)}
                          onChange={(e) => handleToggleAllEmail(e.target.checked)}
                        />
                        Email
                      </label>
                    </th>
                    <th>Personalized Preview</th>
                    <th style={{ textAlign: "right" }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af" }}>
                        No recipients loaded yet. Select a Group, upload an Excel sheet, or add manually above.
                      </td>
                    </tr>
                  ) : (
                    filteredRecipients.map((r, idx) => {
                      const isValidPhone = r.phone.replace(/[^\d+]/g, "").length >= 5;
                      const isValidEmail = r.email.includes("@");
                      const previewSnippet = message
                        .replaceAll("{{name}}", r.name)
                        .replaceAll("{{phone}}", r.phone)
                        .replaceAll("{{email}}", r.email)
                        .replaceAll("{{company}}", r.company || "");

                      return (
                        <tr key={r.id}>
                          <td style={{ color: "#6b7280" }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{r.name}</td>
                          <td>
                            {r.phone ? (
                              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <span className={isValidPhone ? styles.badgeValid : styles.badgeInvalid}>
                                  {isValidPhone ? "✓" : "⚠"}
                                </span>
                                {r.phone}
                              </span>
                            ) : (
                              <span style={{ color: "#6b7280" }}>—</span>
                            )}
                          </td>
                          <td>
                            {r.email ? (
                              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <span className={isValidEmail ? styles.badgeValid : styles.badgeInvalid}>
                                  {isValidEmail ? "✓" : "⚠"}
                                </span>
                                {r.email}
                              </span>
                            ) : (
                              <span style={{ color: "#6b7280" }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={r.sendSms}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setRecipients((prev) => prev.map((item) => (item.id === r.id ? { ...item, sendSms: checked } : item)));
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={r.sendEmail}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setRecipients((prev) => prev.map((item) => (item.id === r.id ? { ...item, sendEmail: checked } : item)));
                              }}
                            />
                          </td>
                          <td style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#9ca3af", fontSize: "0.75rem" }}>
                            {previewSnippet}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => setRecipients((prev) => prev.filter((item) => item.id !== r.id))}
                              className={styles.btnDanger}
                              title="Delete row"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Options & Big Dispatch CTA */}
          <div className={styles.optionsBox}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="checkbox"
                id="saveDir"
                checked={saveToDirectory}
                onChange={(e) => setSaveToDirectory(e.target.checked)}
              />
              <label htmlFor="saveDir" style={{ color: "#f9fafb", fontSize: "0.875rem", cursor: "pointer" }}>
                <strong>Save new contacts to Phone Directory</strong> (Auto-deduplicated)
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="checkbox"
                id="schedCheck"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
              <label htmlFor="schedCheck" style={{ color: "#f9fafb", fontSize: "0.875rem", cursor: "pointer" }}>
                Schedule for later:
              </label>
              {isScheduled && (
                <input
                  type="datetime-local"
                  className={styles.input}
                  style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem" }}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              )}
            </div>

            <button
              type="button"
              disabled={recipients.length === 0 || (!smsReadyCount && !emailReadyCount)}
              onClick={() => setShowConfirmModal(true)}
              className={styles.btnPrimary}
            >
              <Send size={18} />
              Preview & Dispatch ({smsReadyCount + emailReadyCount} Messages)
            </button>
          </div>
        </div>

        {/* Right Column: Live Mobile Smartphone Mockup */}
        <div className={styles.phonePreview}>
          <div className={styles.phoneHeader}>
            <span>Pulse Mobile Gateway</span>
            <span>LTE • 100%</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Sender Line:</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#60a5fa" }}>{senderPhone}</span>
          </div>

          <div style={{ minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div className={styles.messageBubble}>
              {recipients.length > 0
                ? message
                    .replaceAll("{{name}}", recipients[0]?.name || "Alex")
                    .replaceAll("{{phone}}", recipients[0]?.phone || "0412 345 678")
                    .replaceAll("{{email}}", recipients[0]?.email || "alex@example.com")
                    .replaceAll("{{company}}", recipients[0]?.company || "Acme Retail")
                : message.replaceAll("{{name}}", "Valued Customer")}
            </div>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center" }}>
            Simulated Device Render (Preview for Recipient #1)
          </div>
        </div>
      </div>

      {/* Confirmation Preview Modal (Full Popup before submit) */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.cardHeader}>
              <h2 style={{ color: "#60a5fa" }}>
                <ShieldCheck size={24} />
                Confirm Multi-Channel Dispatch Batch
              </h2>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>

            <div className={styles.previewSenderBox}>
              <div className={styles.senderItem}>
                <span className={styles.senderLabel}>From SMS Gateway Modem:</span>
                <span className={styles.senderValue}>{senderPhone}</span>
              </div>
              <div className={styles.senderItem}>
                <span className={styles.senderLabel}>From SMTP Email Address:</span>
                <span className={styles.senderValue}>{senderEmail}</span>
              </div>
            </div>

            <div className={styles.messagePreviewBox}>
              {hasEmailSelected && (
                <div>
                  <strong style={{ color: "#d1d5db", fontSize: "0.85rem" }}>Email Subject:</strong>
                  <div style={{ color: "#f9fafb", marginTop: "0.25rem" }}>{subject || "Update from Pulse Sender"}</div>
                </div>
              )}

              <div>
                <strong style={{ color: "#d1d5db", fontSize: "0.85rem" }}>Message Body:</strong>
                <div style={{ color: "#f9fafb", marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{message}</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#f9fafb" }}>
                Recipients Summary ({smsReadyCount} SMS, {emailReadyCount} Email)
              </h4>
              <div className={styles.tableWrapper} style={{ maxHeight: "200px" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact No</th>
                      <th>Email</th>
                      <th>Channels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td>{r.phone || "—"}</td>
                        <td>{r.email || "—"}</td>
                        <td>
                          {r.sendSms && <span className={styles.badgeValid} style={{ marginRight: "0.25rem" }}>SMS</span>}
                          {r.sendEmail && <span className={styles.badgeValid} style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>Email</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid #1f2937" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className={styles.btnSecondary}
              >
                <X size={16} /> Cancel & Edit Grid
              </button>

              <button
                type="button"
                disabled={dispatching}
                onClick={handleExecuteDispatch}
                className={styles.btnPrimary}
                style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}
              >
                <Check size={18} />
                {dispatching ? "Queuing Dispatches..." : isScheduled ? "Confirm & Schedule" : "Confirm & Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Message Library Picker */}
      {showTemplateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal} style={{ maxWidth: "680px" }}>
            <div className={styles.cardHeader}>
              <h2>
                <MessageSquareQuote size={20} />
                Select Message from Library
              </h2>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.tabPills}>
              <button
                onClick={() => setTemplateTab("manual")}
                className={`${styles.tabPill} ${templateTab === "manual" ? styles.tabPillActive : ""}`}
              >
                <Sparkles size={14} /> Manual Templates ({templates.manual.length})
              </button>
              <button
                onClick={() => setTemplateTab("auto")}
                className={`${styles.tabPill} ${templateTab === "auto" ? styles.tabPillActive : ""}`}
              >
                <Clock size={14} /> Past Sent Broadcasts ({templates.auto.length})
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "350px", overflowY: "auto" }}>
              {(templateTab === "manual" ? templates.manual : templates.auto).length === 0 ? (
                <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>No messages found in this category.</p>
              ) : (
                (templateTab === "manual" ? templates.manual : templates.auto).map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    style={{
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#f9fafb" }}>{tpl.title || "Broadcast Copy"}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>{tpl.channel}</span>
                    </div>
                    {tpl.subject && <span style={{ fontSize: "0.75rem", color: "#d1d5db" }}>Subject: {tpl.subject}</span>}
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af", whiteSpace: "pre-wrap" }}>{tpl.body}</p>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowTemplateModal(false)} className={styles.btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
