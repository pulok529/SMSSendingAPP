"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import styles from "@/components/ui/dashboard.module.css";

type ParsedCell = string | number | boolean | null;
type ParsedRow = Record<string, ParsedCell>;

type QueueResponse = {
  ok?: boolean;
  queued?: number;
  skipped?: number;
  campaign?: {
    id: string;
    name: string;
    status: string;
  };
  error?: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

const phoneCandidates = [
  "mobile",
  "phone",
  "phone number",
  "phone_number",
  "mobile number",
  "mobile_number",
  "number",
];

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replaceAll("_", " ");
}

function rowValue(row: ParsedRow, key: string): string {
  const wantedKey = normalizeKey(key);

  if (wantedKey === "name") {
    return firstRowValue(row, ["name", "full name", "customer name"]);
  }

  if (wantedKey === "mobile" || wantedKey === "phone") {
    return firstRowValue(row, phoneCandidates);
  }

  const match = Object.entries(row).find(
    ([rowKey]) => normalizeKey(rowKey) === wantedKey
  );

  return match?.[1] === null || match?.[1] === undefined ? "" : String(match[1]);
}

function firstRowValue(row: ParsedRow, candidates: string[]): string {
  for (const candidate of candidates) {
    const value = rowValueWithoutAliases(row, candidate).trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function rowValueWithoutAliases(row: ParsedRow, key: string): string {
  const wantedKey = normalizeKey(key);
  const match = Object.entries(row).find(
    ([rowKey]) => normalizeKey(rowKey) === wantedKey
  );

  return match?.[1] === null || match?.[1] === undefined ? "" : String(match[1]);
}

function personalize(template: string, row: ParsedRow): string {
  return template.replace(/\[([^\]]+)\]/g, (_placeholder, key: string) =>
    rowValue(row, key).trim()
  );
}

function detectPhoneColumn(columns: string[]): string {
  return (
    columns.find((column) =>
      phoneCandidates.includes(normalizeKey(column))
    ) ?? columns[0] ?? ""
  );
}

export function SmsImportSender() {
  const [fileName, setFileName] = useState("No file selected yet");
  const [sheetName, setSheetName] = useState("Awaiting upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [phoneColumn, setPhoneColumn] = useState("");
  const [campaignName, setCampaignName] = useState("Imported SMS Campaign");
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi [name], this is a reminder from Pulse Dispatch."
  );
  const [notice, setNotice] = useState("");
  const [isQueueing, setIsQueueing] = useState(false);

  const columns = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => Object.keys(row)))),
    [rows]
  );

  const previewRows = useMemo(() => {
    const seenPhones = new Set<string>();

    return rows.slice(0, 100).map((row, index) => {
      const name = rowValue(row, "name");
      const phone = phoneColumn ? rowValue(row, phoneColumn) : "";
      const message = personalize(messageTemplate, row);
      const issues = [];

      if (!phone.trim()) {
        issues.push("Missing phone");
      }

      if (!name.trim()) {
        issues.push("Missing name");
      }

      if (phone && seenPhones.has(phone)) {
        issues.push("Duplicate phone");
      }

      if (phone) {
        seenPhones.add(phone);
      }

      return {
        index,
        name,
        phone,
        message,
        status: issues.length > 0 ? issues.join(", ") : "Ready",
      };
    });
  }, [messageTemplate, phoneColumn, rows]);

  const readyCount = previewRows.filter((row) => row.status === "Ready").length;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setNotice("");

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const data = loadEvent.target?.result;

        if (!data) {
          throw new Error("The selected file could not be read.");
        }

        const workbook = XLSX.read(data, { type: "array" });
        const currentSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[currentSheet];
        const parsedRows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, {
          defval: "",
        });
        const detectedColumns = Array.from(
          new Set(parsedRows.flatMap((row) => Object.keys(row)))
        );

        setSheetName(currentSheet);
        setRows(parsedRows);
        setPhoneColumn(detectPhoneColumn(detectedColumns));
        setNotice(`${parsedRows.length} row(s) loaded from ${currentSheet}.`);
      } catch (error) {
        setRows([]);
        setSheetName("Unreadable sheet");
        setNotice(
          error instanceof Error
            ? error.message
            : "The spreadsheet could not be parsed."
        );
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function queueSmsCampaign() {
    if (rows.length === 0) {
      setNotice("Upload an Excel or CSV file before queueing SMS.");
      return;
    }

    if (!messageTemplate.trim()) {
      setNotice("Write the SMS text before queueing.");
      return;
    }

    setIsQueueing(true);
    setNotice("Queueing SMS jobs...");

    try {
      const response = await fetch(`${apiBaseUrl}/api/imports/sms`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignName,
          messageTemplate,
          phoneColumn,
          rows,
        }),
      });
      const data = (await response.json()) as QueueResponse;

      if (!response.ok) {
        throw new Error(data.error ?? `API returned ${response.status}`);
      }

      setNotice(
        `Queued ${data.queued ?? 0} SMS job(s). Skipped ${data.skipped ?? 0}.`
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? `Queue failed: ${error.message}` : "Queue failed."
      );
    } finally {
      setIsQueueing(false);
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Excel SMS Sender</h2>
          <p className={styles.panelText}>
            Upload contacts, write one SMS template, preview personalized
            messages, then queue jobs for the Android sender.
          </p>
        </div>
        <span className={styles.badge}>Protected sender page</span>
      </div>

      <div className={styles.uploadBox}>
        <label className={styles.label}>
          Upload `.xlsx` or `.csv`
          <input
            className={styles.field}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
        </label>
        <div className={styles.previewBox}>
          <strong>Selected file:</strong> {fileName}
          <br />
          <strong>Detected sheet:</strong> {sheetName}
          <br />
          <strong>Loaded rows:</strong> {rows.length}
          <br />
          <Link href="/sample-sms-recipients.xlsx">Download sample Excel file</Link>
        </div>
      </div>

      <div className={styles.formGrid} style={{ marginTop: 18 }}>
        <label className={styles.label}>
          Campaign name
          <input
            className={styles.field}
            value={campaignName}
            onChange={(event) => setCampaignName(event.target.value)}
          />
        </label>
        <label className={styles.label}>
          Phone column
          <select
            className={styles.field}
            value={phoneColumn}
            onChange={(event) => setPhoneColumn(event.target.value)}
          >
            <option value="">Select phone column</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.label} style={{ marginTop: 18 }}>
        SMS text
        <textarea
          className={styles.textarea}
          value={messageTemplate}
          onChange={(event) => setMessageTemplate(event.target.value)}
        />
      </label>

      <p className={styles.helper} style={{ marginTop: 10 }}>
        Use placeholders from the spreadsheet columns, for example `[name]`,
        `[company]`, `[city]`, or `[event_date]`.
      </p>

      <div className={styles.summaryGrid} style={{ marginTop: 18 }}>
        <div className={styles.previewBox}>
          <strong>Total rows:</strong> {rows.length}
        </div>
        <div className={styles.previewBox}>
          <strong>Preview-ready rows:</strong> {readyCount}
        </div>
        <div className={styles.previewBox}>
          <strong>Previewed:</strong> {previewRows.length}
        </div>
      </div>

      {notice ? (
        <div className={styles.notice} style={{ marginTop: 18 }}>
          {notice}
        </div>
      ) : null}

      <div className={styles.buttonRow} style={{ marginTop: 18 }}>
        <button
          className={styles.buttonPrimary}
          disabled={isQueueing || rows.length === 0}
          onClick={queueSmsCampaign}
          type="button"
        >
          {isQueueing ? "Queueing..." : "Queue SMS Campaign"}
        </button>
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 18 }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Personalized SMS</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.length > 0 ? (
              previewRows.slice(0, 20).map((row) => (
                <tr key={`${row.index}-${row.phone}`}>
                  <td>{row.name}</td>
                  <td>{row.phone}</td>
                  <td>{row.message}</td>
                  <td>{row.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>Upload a spreadsheet to preview SMS messages.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
