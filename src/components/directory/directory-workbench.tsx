"use client";

import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import styles from "./directory-workbench.module.css";
import {
  BookUser,
  UserPlus,
  FileSpreadsheet,
  Search,
  AlertTriangle,
  GitMerge,
  Trash2,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  X,
  UploadCloud,
  Download,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  contactNo: string | null;
  email: string | null;
  others: string | null;
  createdAt: string;
}

interface ConflictPair {
  type: string;
  contacts: Contact[];
}

export function DirectoryWorkbench() {
  const [activeTab, setActiveTab] = useState<"all" | "duplicates" | "errors">("all");
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [duplicates, setDuplicates] = useState<ConflictPair[]>([]);
  const [errors, setErrors] = useState<ConflictPair[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictPair | null>(null);

  // Add Single Form
  const [addForm, setAddForm] = useState({ name: "", contactNo: "", email: "", others: "" });
  const [addLoading, setAddLoading] = useState(false);

  // Merge Form
  const [mergeForm, setMergeForm] = useState({
    keepId: "",
    deleteId: "",
    mergedName: "",
    mergedContactNo: "",
    mergedEmail: "",
    mergedOthers: "",
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes, eRes] = await Promise.all([
        fetch("/api/directory", { credentials: "include" }),
        fetch("/api/directory/duplicates", { credentials: "include" }),
        fetch("/api/directory/errors", { credentials: "include" }),
      ]);

      if (cRes.ok) {
        const d = await cRes.json();
        setContacts(d.contacts || []);
      }
      if (dRes.ok) {
        const d = await dRes.json();
        setDuplicates(d.duplicates || []);
      }
      if (eRes.ok) {
        const d = await eRes.json();
        setErrors(d.errors || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add contact.");

      if (data.alreadyExisted) {
        setFeedback({ type: "error", message: `Notice: ${data.message}` });
      } else {
        setFeedback({ type: "success", message: `Contact "${addForm.name}" successfully added to directory!` });
      }

      setShowAddModal(false);
      setAddForm({ name: "", contactNo: "", email: "", others: "" });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact from directory?")) return;

    try {
      const res = await fetch(`/api/directory/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setFeedback({ type: "success", message: "Contact deleted." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleOpenMerge = (pair: ConflictPair) => {
    if (pair.contacts.length < 2) return;
    const a = pair.contacts[0]!;
    const b = pair.contacts[1]!;

    setSelectedConflict(pair);
    setMergeForm({
      keepId: a.id,
      deleteId: b.id,
      mergedName: a.name || b.name,
      mergedContactNo: a.contactNo || b.contactNo || "",
      mergedEmail: a.email || b.email || "",
      mergedOthers: a.others || b.others || "",
    });
    setShowMergeModal(true);
  };

  const handleExecuteMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/directory/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mergeForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to merge.");

      setFeedback({ type: "success", message: "Contacts successfully merged!" });
      setShowMergeModal(false);
      fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        if (!wsName) throw new Error("No sheet found in workbook");
        const ws = wb.Sheets[wsName];
        if (!ws) throw new Error("Could not read sheet");
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        const parsedContacts = rawData.map((row) => ({
          name: String(row.Name || row.name || row["Full Name"] || "Unnamed").trim(),
          contactNo: String(row.Phone || row.phone || row.Mobile || row.mobile || row["Contact No"] || "").trim(),
          email: String(row.Email || row.email || "").trim(),
          others: String(row.Company || row.company || row.Notes || row.others || "").trim(),
        }));

        const res = await fetch("/api/directory/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ contacts: parsedContacts }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to import excel.");

        setFeedback({
          type: "success",
          message: `Excel Imported: ${data.createdCount} new contacts added, ${data.skippedCount} existing/duplicates skipped.`,
        });

        setShowUploadModal(false);
        fetchData();
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to parse file." });
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleTemplate = () => {
    const sample = [
      { "Full Name": "John Smith", "Phone / Mobile": "+61412345678", Email: "john.smith@example.com", Company: "Acme Corp" },
      { "Full Name": "Sarah Jenkins", "Phone / Mobile": "0498765432", Email: "sarah.j@example.com", Company: "Apex Retail" },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "Pulse_Phone_Directory_Template.xlsx");
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contactNo && c.contactNo.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.others && c.others.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>
            <BookUser size={26} color="#3b82f6" />
            Phone Directory & Contact Library
          </h1>
          <p>Manage your central contact dictionary, detect duplicate identities, and resolve data conflicts.</p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
            <UserPlus size={18} />
            Add Single Contact
          </button>
          <button onClick={() => setShowUploadModal(true)} className={styles.btnSuccess}>
            <FileSpreadsheet size={18} />
            Import Excel / CSV
          </button>
        </div>
      </div>

      {feedback && (
        <div className={feedback.type === "success" ? styles.card : styles.card} style={{ borderColor: feedback.type === "success" ? "#10b981" : "#ef4444" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: feedback.type === "success" ? "#34d399" : "#f87171" }}>
            {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      <div className={styles.tabBar}>
        <button
          onClick={() => setActiveTab("all")}
          className={`${styles.tabButton} ${activeTab === "all" ? styles.tabActive : ""}`}
        >
          <BookUser size={16} />
          All Contacts ({contacts.length})
        </button>

        <button
          onClick={() => setActiveTab("duplicates")}
          className={`${styles.tabButton} ${activeTab === "duplicates" ? styles.tabActive : ""}`}
        >
          <AlertTriangle size={16} />
          Duplicates
          {duplicates.length > 0 && <span className={styles.badgeWarn}>{duplicates.length}</span>}
        </button>

        <button
          onClick={() => setActiveTab("errors")}
          className={`${styles.tabButton} ${activeTab === "errors" ? styles.tabActive : ""}`}
        >
          <GitMerge size={16} />
          Conflicts & Errors
          {errors.length > 0 && <span className={styles.badge}>{errors.length}</span>}
        </button>
      </div>

      {activeTab === "all" && (
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search directory by name, mobile, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
              Showing {filteredContacts.length} of {contacts.length} contacts
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Contact No (Phone)</th>
                  <th>Email Address</th>
                  <th>Company / Notes</th>
                  <th>Added On</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                      No contacts found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c, idx) => (
                    <tr key={c.id}>
                      <td style={{ color: "#6b7280" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        {c.contactNo ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#60a5fa" }}>
                            <Phone size={14} />
                            {c.contactNo}
                          </span>
                        ) : (
                          <span style={{ color: "#6b7280" }}>—</span>
                        )}
                      </td>
                      <td>
                        {c.email ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#34d399" }}>
                            <Mail size={14} />
                            {c.email}
                          </span>
                        ) : (
                          <span style={{ color: "#6b7280" }}>—</span>
                        )}
                      </td>
                      <td>
                        {c.others ? (
                          <span className={styles.contactTag}>{c.others}</span>
                        ) : (
                          <span style={{ color: "#6b7280" }}>—</span>
                        )}
                      </td>
                      <td style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => handleDelete(c.id)} className={styles.btnDanger} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "duplicates" && (
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.875rem" }}>
              These records share the same Name and Phone/Email but have divergent details. You can merge them into a single clean record.
            </p>
          </div>

          {duplicates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#34d399" }}>
              <CheckCircle2 size={36} style={{ margin: "0 auto 0.75rem" }} />
              <h3>No Duplicate Contacts Found!</h3>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Your phone directory is clean and deduplicated.</p>
            </div>
          ) : (
            duplicates.map((dup, idx) => (
              <div key={idx} className={styles.conflictCard}>
                <div className={styles.conflictHeader}>
                  <div className={styles.conflictType}>
                    <AlertTriangle size={16} />
                    <span>{dup.type}</span>
                  </div>
                  <button onClick={() => handleOpenMerge(dup)} className={styles.btnPrimary}>
                    <GitMerge size={16} />
                    Merge Pair
                  </button>
                </div>

                <div className={styles.conflictGrid}>
                  {dup.contacts.map((c) => (
                    <div key={c.id} className={styles.contactBox}>
                      <h4>{c.name}</h4>
                      <div className={styles.contactDetail}>
                        <Phone size={14} /> {c.contactNo || "No Phone"}
                      </div>
                      <div className={styles.contactDetail}>
                        <Mail size={14} /> {c.email || "No Email"}
                      </div>
                      <div className={styles.contactDetail}>
                        <Building size={14} /> {c.others || "No Notes"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "errors" && (
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.875rem" }}>
              These records share the exact same Phone number or Email address but have different Full Names.
            </p>
          </div>

          {errors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#34d399" }}>
              <CheckCircle2 size={36} style={{ margin: "0 auto 0.75rem" }} />
              <h3>No Name Conflicts Detected!</h3>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>All phone numbers and emails have consistent naming.</p>
            </div>
          ) : (
            errors.map((err, idx) => (
              <div key={idx} className={styles.conflictCard}>
                <div className={styles.conflictHeader}>
                  <div className={styles.conflictType} style={{ color: "#ef4444" }}>
                    <AlertTriangle size={16} />
                    <span>{err.type}</span>
                  </div>
                  <button onClick={() => handleOpenMerge(err)} className={styles.btnPrimary}>
                    <GitMerge size={16} />
                    Resolve Conflict
                  </button>
                </div>

                <div className={styles.conflictGrid}>
                  {err.contacts.map((c) => (
                    <div key={c.id} className={styles.contactBox}>
                      <h4>{c.name}</h4>
                      <div className={styles.contactDetail}>
                        <Phone size={14} /> {c.contactNo || "No Phone"}
                      </div>
                      <div className={styles.contactDetail}>
                        <Mail size={14} /> {c.email || "No Email"}
                      </div>
                      <div className={styles.contactDetail}>
                        <Building size={14} /> {c.others || "No Notes"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Add Single Contact */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Add Single Contact to Directory</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. John Smith"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone / Contact No</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 0412 345 678 or +61 412 345 678"
                  value={addForm.contactNo}
                  onChange={(e) => setAddForm({ ...addForm, contactNo: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="e.g. john@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Company / Additional Notes</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Acme Retail Ltd"
                  value={addForm.others}
                  onChange={(e) => setAddForm({ ...addForm, others: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={addLoading} className={styles.btnPrimary}>
                  {addLoading ? "Saving..." : "Save to Directory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Excel */}
      {showUploadModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Import Spreadsheet Contacts</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
              Upload an Excel (.xlsx, .xls) or CSV file. Existing contacts with matching non-null details will be automatically skipped to prevent duplicates.
            </p>

            <div
              style={{
                border: "2px dashed #374151",
                borderRadius: "0.75rem",
                padding: "2rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                background: "#1f2937",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={36} color="#3b82f6" />
              <div>
                <p style={{ fontWeight: 600, color: "#f9fafb", margin: "0 0 0.25rem 0" }}>Click to select or drag spreadsheet here</p>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Supports .xlsx, .xls, .csv</span>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: "none" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={downloadSampleTemplate} type="button" className={styles.btnSecondary} style={{ fontSize: "0.75rem" }}>
                <Download size={14} />
                Download Sample Excel
              </button>
              <button onClick={() => setShowUploadModal(false)} type="button" className={styles.btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Merge Contacts */}
      {showMergeModal && selectedConflict && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Merge & Consolidate Contacts</h3>
              <button onClick={() => setShowMergeModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteMerge} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
                Select the canonical values to keep for this person. The duplicate record will be merged and purged.
              </p>

              <div className={styles.formGroup}>
                <label>Target Full Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={mergeForm.mergedName}
                  onChange={(e) => setMergeForm({ ...mergeForm, mergedName: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Target Phone Number</label>
                <input
                  type="text"
                  className={styles.input}
                  value={mergeForm.mergedContactNo}
                  onChange={(e) => setMergeForm({ ...mergeForm, mergedContactNo: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Target Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  value={mergeForm.mergedEmail}
                  onChange={(e) => setMergeForm({ ...mergeForm, mergedEmail: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Company / Notes</label>
                <input
                  type="text"
                  className={styles.input}
                  value={mergeForm.mergedOthers}
                  onChange={(e) => setMergeForm({ ...mergeForm, mergedOthers: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowMergeModal(false)} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  <GitMerge size={16} />
                  Confirm & Merge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
