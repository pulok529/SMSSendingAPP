"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Send,
  Trash2,
  Upload,
  UserPlus,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import styles from "./quick-send-workbench.module.css";

export interface RecipientRow {
  id: string;
  name: string;
  phone: string;
  company?: string;
  custom?: string;
}

export function QuickSendWorkbench() {
  const [campaignTitle, setCampaignTitle] = useState("");
  const [message, setMessage] = useState(
    "Hi {{name}}, here is an instant update from our team. Please reply if you have questions!"
  );

  const [activeTab, setActiveTab] = useState<"excel" | "manual" | "paste">("excel");
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  // Manual 1-by-1 fields
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCompany, setManualCompany] = useState("");

  // Paste text
  const [pasteText, setPasteText] = useState("");

  // Status & Dispatch State
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    ok: boolean;
    queuedCount?: number;
    message?: string;
    campaignId?: string;
  } | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variable insertion
  const insertVariable = (tag: string) => {
    if (!textareaRef.current) {
      setMessage((prev) => prev + " " + tag);
      return;
    }
    const elem = textareaRef.current;
    const start = elem.selectionStart;
    const end = elem.selectionEnd;
    const current = message;
    const updated = current.substring(0, start) + tag + current.substring(end);
    setMessage(updated);
    setTimeout(() => {
      elem.focus();
      elem.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // SMS length & segments calculation
  const charCount = message.length;
  const isUnicode = /[^\u0000-\u00ff]/.test(message);
  const maxSingle = isUnicode ? 70 : 160;
  const maxConcat = isUnicode ? 67 : 153;
  const segments =
    charCount === 0
      ? 1
      : charCount <= maxSingle
      ? 1
      : Math.ceil(charCount / maxConcat);

  // Phone validation helper
  const isValidPhone = (phone: string) => {
    const clean = phone.replace(/[^\d+]/g, "");
    return clean.length >= 6 && clean.length <= 16;
  };

  // Render personalized preview text
  const renderPersonalized = (row?: RecipientRow) => {
    const targetName = row?.name?.trim() || "Sophia Miller";
    const targetPhone = row?.phone?.trim() || "+880 1711-000001";
    const targetCompany = row?.company?.trim() || "Pulse Retail Ltd";
    const targetCustom = row?.custom?.trim() || "VIP Member";

    let text = message;
    text = text.replaceAll("{{name}}", targetName);
    text = text.replaceAll("{{phone}}", targetPhone);
    text = text.replaceAll("{{company}}", targetCompany);
    text = text.replaceAll("{{custom}}", targetCustom);
    text = text.replaceAll("[name]", targetName);
    text = text.replaceAll("[phone]", targetPhone);
    text = text.replaceAll("[company]", targetCompany);
    return text;
  };

  // 1. Excel File Import
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorNotice(null);

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      try {
        const data = loadEvt.target?.result;
        if (!data) throw new Error("Could not read file data.");
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rawRows.length === 0) {
          setErrorNotice("The uploaded spreadsheet contains no data rows.");
          return;
        }

        const phoneKeys = ["mobile", "phone", "phone number", "mobile number", "contact", "number", "cell"];
        const nameKeys = ["name", "full name", "customer name", "client name", "contact name"];
        const companyKeys = ["company", "organization", "org", "business", "brand"];
        const customKeys = ["custom", "notes", "tag", "city", "event", "note"];

        const parsedList: RecipientRow[] = rawRows.map((r, idx) => {
          let name = "";
          let phone = "";
          let company = "";
          let custom = "";

          for (const [key, val] of Object.entries(r)) {
            const cleanKey = key.trim().toLowerCase().replaceAll("_", " ");
            const strVal = String(val).trim();
            if (!name && nameKeys.includes(cleanKey)) name = strVal;
            if (!phone && phoneKeys.includes(cleanKey)) phone = strVal;
            if (!company && companyKeys.includes(cleanKey)) company = strVal;
            if (!custom && customKeys.includes(cleanKey)) custom = strVal;
          }

          // Fallback if column names didn't match perfectly
          if (!phone) {
            const values = Object.values(r).map(String);
            const foundPhone = values.find((v) => isValidPhone(v));
            if (foundPhone) phone = foundPhone;
          }

          if (!name) {
            const firstStr = Object.values(r).find((v) => typeof v === "string" && v.length > 1 && !isValidPhone(String(v)));
            if (firstStr) name = String(firstStr);
          }

          return {
            id: `excel-${Date.now()}-${idx}`,
            name: name || `Contact #${idx + 1}`,
            phone: phone || "",
            company: company || undefined,
            custom: custom || undefined,
          };
        });

        setRecipients((prev) => [...prev, ...parsedList]);
      } catch (err: any) {
        setErrorNotice(err.message || "Failed to parse the uploaded Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 2. Download sample excel file
  const downloadSampleExcel = () => {
    const sampleData = [
      { "Full Name": "Sophia Miller", "Mobile Number": "+8801711000001", "Company": "Apex Retail", "Notes": "VIP Guest" },
      { "Full Name": "Liam Johnson", "Mobile Number": "+8801711000002", "Company": "Nova Tech", "Notes": "Invited" },
      { "Full Name": "Emma Watson", "Mobile Number": "+8801711000003", "Company": "Design Studio", "Notes": "Priority" },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Instant_SMS_Recipients");
    XLSX.writeFile(wb, "PulseSender_Instant_Recipients_Sample.xlsx");
  };

  // 3. Manual Add 1-by-1
  const handleAddManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualPhone.trim()) {
      setErrorNotice("Phone number is required to add recipient.");
      return;
    }

    const newRow: RecipientRow = {
      id: `manual-${Date.now()}`,
      name: manualName.trim() || `Contact #${recipients.length + 1}`,
      phone: manualPhone.trim(),
      company: manualCompany.trim() || undefined,
    };

    setRecipients((prev) => [newRow, ...prev]);
    setManualName("");
    setManualPhone("");
    setManualCompany("");
    setErrorNotice(null);
  };

  // 4. Quick Paste Parse
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split(/[\n,;]+/);
    const newItems: RecipientRow[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let name = "";
      let phone = trimmed;

      if (trimmed.includes(":") || trimmed.includes("-")) {
        const parts = trimmed.split(/[:\-]/);
        if (parts.length >= 2) {
          name = parts[0].trim();
          phone = parts[1].trim();
        }
      }

      if (phone) {
        newItems.push({
          id: `paste-${Date.now()}-${idx}`,
          name: name || `Contact #${recipients.length + newItems.length + 1}`,
          phone: phone,
        });
      }
    });

    if (newItems.length > 0) {
      setRecipients((prev) => [...prev, ...newItems]);
      setPasteText("");
      setErrorNotice(null);
    }
  };

  // Remove single row
  const removeRow = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  // Clear all
  const clearAll = () => {
    if (confirm("Are you sure you want to clear all recipients?")) {
      setRecipients([]);
      setErrorNotice(null);
      setDispatchResult(null);
    }
  };

  // Remove invalid rows
  const removeInvalid = () => {
    setRecipients((prev) => prev.filter((r) => isValidPhone(r.phone)));
  };

  // Dispatch Instant SMS
  const handleDispatch = async () => {
    const validRecipients = recipients.filter((r) => isValidPhone(r.phone));
    if (validRecipients.length === 0) {
      setErrorNotice("Please add at least one recipient with a valid phone number.");
      return;
    }
    if (!message.trim()) {
      setErrorNotice("Please enter an SMS message body.");
      return;
    }

    setIsDispatching(true);
    setErrorNotice(null);
    setDispatchResult(null);

    try {
      const res = await fetch("/api/campaigns/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: campaignTitle.trim() || undefined,
          message: message.trim(),
          recipients: validRecipients.map((r) => ({
            name: r.name,
            phone: r.phone,
            company: r.company,
            custom: r.custom,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to queue instant SMS dispatch.");
      }

      setDispatchResult({
        ok: true,
        queuedCount: data.queuedCount || validRecipients.length,
        message: data.message || "Instant SMS batch successfully queued for sending!",
        campaignId: data.campaignId,
      });
    } catch (err: any) {
      setErrorNotice(err.message || "Network error while dispatching SMS.");
    } finally {
      setIsDispatching(false);
    }
  };

  const validCount = recipients.filter((r) => isValidPhone(r.phone)).length;
  const invalidCount = recipients.length - validCount;
  const filteredRecipients = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.phone.includes(searchFilter) ||
      (r.company && r.company.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      {/* Top status notifications */}
      {errorNotice && (
        <div className={styles.errorBanner}>
          <span>⚠️ {errorNotice}</span>
        </div>
      )}

      {dispatchResult?.ok && (
        <div className={styles.successBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>
                {dispatchResult.queuedCount} Instant SMS Dispatched!
              </div>
              <div style={{ fontSize: "12px", color: "#15803d" }}>
                Jobs pushed to the linked Android Gateway. The phone will process and send these SMS immediately.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href="/logs"
              style={{
                background: "#166534",
                color: "#ffffff",
                padding: "8px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              View Delivery Logs →
            </Link>
          </div>
        </div>
      )}

      {/* Main 2-column Workbench */}
      <div className={styles.grid}>
        {/* Left Column: Message Composer */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <Zap size={20} color="#e67a3b" />
                <span>1. Compose Instant SMS</span>
              </div>
              <div className={styles.cardSub}>
                Write your message and insert custom placeholder tags.
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>Batch Title (Optional)</span>
              <span style={{ fontSize: "11px", color: "#8c786a" }}>For delivery logs</span>
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Urgent Customer Notification / Flash Sale"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>SMS Message Body</span>
              <span className={styles.smsBadge}>
                {charCount} chars • {segments} SMS {isUnicode ? "(Unicode)" : "(GSM-7)"}
              </span>
            </label>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Write your SMS text here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#6e5949" }}>
                Click to insert placeholders:
              </span>
              <div className={styles.tagList}>
                <button
                  type="button"
                  className={styles.tagBtn}
                  onClick={() => insertVariable("{{name}}")}
                >
                  + {"{{name}}"}
                </button>
                <button
                  type="button"
                  className={styles.tagBtn}
                  onClick={() => insertVariable("{{phone}}")}
                >
                  + {"{{phone}}"}
                </button>
                <button
                  type="button"
                  className={styles.tagBtn}
                  onClick={() => insertVariable("{{company}}")}
                >
                  + {"{{company}}"}
                </button>
                <button
                  type="button"
                  className={styles.tagBtn}
                  onClick={() => insertVariable("{{custom}}")}
                >
                  + {"{{custom}}"}
                </button>
              </div>
            </div>
          </div>

          {/* Live Mobile Phone Preview */}
          <div className={styles.phonePreviewCard}>
            <div className={styles.phonePreviewHeader}>
              <span>📱 Live Recipient Phone Preview</span>
            </div>
            <div className={styles.phoneBubble}>
              {renderPersonalized(recipients[0])}
              <div className={styles.phoneBubbleMeta}>
                <span>Pulse Sender Gateway</span>
                <span>Just now • Delivered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recipient Selection & Data Grid */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <UserPlus size={20} color="#e67a3b" />
                <span>2. Add SMS Recipients</span>
              </div>
              <div className={styles.cardSub}>
                Upload an Excel file or add phone numbers one by one to the grid below.
              </div>
            </div>
          </div>

          {/* Input Source Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "excel" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("excel")}
            >
              <FileSpreadsheet size={16} />
              <span>Upload Excel / CSV</span>
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "manual" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("manual")}
            >
              <Plus size={16} />
              <span>Add 1-by-1 Manually</span>
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "paste" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("paste")}
            >
              <Upload size={16} />
              <span>Quick Paste Numbers</span>
            </button>
          </div>

          {/* Tab 1: Excel Upload */}
          {activeTab === "excel" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <div
                className={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet size={36} className={styles.dropzoneIcon} />
                <div className={styles.dropzoneTitle}>
                  Click or drag Excel / CSV spreadsheet here
                </div>
                <div className={styles.dropzoneText}>
                  Supports .xlsx, .xls, .csv with columns: Name, Mobile / Phone, Company
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={downloadSampleExcel}
                >
                  <Download size={14} />
                  <span>Download Sample Excel Template</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Manual 1-by-1 */}
          {activeTab === "manual" && (
            <form onSubmit={handleAddManual} className={styles.manualRow}>
              <div>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. John Doe"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>Mobile / Phone *</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="+8801711000000"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>Company (Opt.)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Company Ltd"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.addBtn}>
                <Plus size={16} />
                <span>Add Row</span>
              </button>
            </form>
          )}

          {/* Tab 3: Quick Paste Text */}
          {activeTab === "paste" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <textarea
                className={styles.textarea}
                placeholder="Paste numbers (comma, semicolon, or newline separated)&#10;e.g.&#10;+8801711000001&#10;+8801711000002&#10;John: +8801711000003"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <button
                type="button"
                className={styles.addBtn}
                style={{ alignSelf: "flex-end" }}
                onClick={handleParsePaste}
              >
                <Plus size={16} />
                <span>Parse & Add Numbers</span>
              </button>
            </div>
          )}

          {/* Interactive Recipient Grid / Table */}
          <div className={styles.gridContainer}>
            <div className={styles.gridHeader}>
              <div className={styles.badgeGroup}>
                <span className={`${styles.countBadge} ${styles.badgeTotal}`}>
                  Total: {recipients.length}
                </span>
                <span className={`${styles.countBadge} ${styles.badgeValid}`}>
                  Ready: {validCount}
                </span>
                {invalidCount > 0 && (
                  <span className={`${styles.countBadge} ${styles.badgeInvalid}`}>
                    Invalid: {invalidCount}
                  </span>
                )}
              </div>

              <div className={styles.headerActions}>
                {recipients.length > 5 && (
                  <input
                    type="text"
                    placeholder="Filter grid..."
                    className={styles.input}
                    style={{ width: "130px", padding: "4px 8px", fontSize: "12px" }}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                )}
                {invalidCount > 0 && (
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={removeInvalid}
                    title="Remove rows with invalid numbers"
                  >
                    Clean Invalid ({invalidCount})
                  </button>
                )}
                {recipients.length > 0 && (
                  <button
                    type="button"
                    className={styles.smallBtn}
                    style={{ color: "#991b1b" }}
                    onClick={clearAll}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className={styles.tableWrapper}>
              {recipients.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>No recipients added yet. Upload an Excel file or add contacts above.</span>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>#</th>
                      <th>Recipient Name</th>
                      <th>Phone Number</th>
                      <th>Company</th>
                      <th>Personalized SMS</th>
                      <th style={{ width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipients.map((row, idx) => {
                      const valid = isValidPhone(row.phone);
                      return (
                        <tr key={row.id}>
                          <td style={{ color: "#8c786a", fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{row.name}</td>
                          <td>
                            {valid ? (
                              <span className={styles.phoneValid}>
                                <CheckCircle2 size={13} />
                                {row.phone}
                              </span>
                            ) : (
                              <span className={styles.phoneInvalid}>
                                <AlertCircle size={13} />
                                {row.phone || "Missing"}
                              </span>
                            )}
                          </td>
                          <td style={{ color: "#725f51" }}>{row.company || "—"}</td>
                          <td
                            style={{
                              color: "#59473b",
                              maxWidth: "200px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: "12px",
                            }}
                            title={renderPersonalized(row)}
                          >
                            {renderPersonalized(row)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => removeRow(row.id)}
                              title="Delete row"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dispatch Action Bar */}
      <div className={styles.dispatchBar}>
        <div className={styles.dispatchInfo}>
          <div className={styles.dispatchTitle}>
            <Zap size={20} color="#fb923c" />
            <span>Ready to Dispatch: {validCount} SMS Messages</span>
          </div>
          <div className={styles.dispatchSub}>
            Estimated transmission: {validCount * segments} total SMS segments via linked Android Gateway.
          </div>
        </div>

        <button
          type="button"
          className={styles.sendBtn}
          disabled={validCount === 0 || !message.trim() || isDispatching}
          onClick={handleDispatch}
        >
          {isDispatching ? (
            <span>Queueing Messages...</span>
          ) : (
            <>
              <Send size={18} />
              <span>Send Instant SMS Now ({validCount})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
