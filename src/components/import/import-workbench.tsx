"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";
import styles from "@/components/ui/dashboard.module.css";

type ParsedRow = Record<string, string | number | boolean | null>;

export function ImportWorkbench() {
  const [fileName, setFileName] = useState("No file selected yet");
  const [sheetName, setSheetName] = useState("Awaiting upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setError(null);

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
        const parsed = XLSX.utils.sheet_to_json<ParsedRow>(sheet, {
          defval: "",
        });

        setSheetName(currentSheet);
        setRows(parsed.slice(0, 6));
      } catch (caught) {
        setRows([]);
        setSheetName("Unreadable sheet");
        setError(
          caught instanceof Error
            ? caught.message
            : "The spreadsheet could not be parsed."
        );
      }
    };

    reader.readAsArrayBuffer(file);
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Excel Import Workbench</h2>
          <p className={styles.panelText}>
            Upload a spreadsheet, preview the first rows, and confirm that the
            customer columns match the web app structure before we connect real
            backend import endpoints.
          </p>
        </div>
        <span className={styles.badge}>Client input page</span>
      </div>

      <div className={styles.uploadBox}>
        <div className={styles.label}>
          Upload `.xlsx` or `.csv`
          <input
            className={styles.field}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
        </div>
        <div className={styles.previewBox}>
          <strong>Selected file:</strong> {fileName}
          <br />
          <strong>Detected sheet:</strong> {sheetName}
          <br />
          <strong>Preview rows:</strong> {rows.length}
          {error ? (
            <>
              <br />
              <strong>Issue:</strong> {error}
            </>
          ) : null}
        </div>
      </div>

      {columns.length > 0 ? (
        <div className={styles.tableWrap} style={{ marginTop: 18 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${index}-${row[columns[0]] ?? "row"}`}>
                  {columns.map((column) => (
                    <td key={column}>{String(row[column] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.helper} style={{ marginTop: 18 }}>
          Drop in a customer spreadsheet to preview the first records here.
        </p>
      )}
    </div>
  );
}
