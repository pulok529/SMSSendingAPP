"use client";

import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import styles from "./group-workbench.module.css";
import {
  Users2,
  Plus,
  ArrowUp,
  ArrowDown,
  Layers,
  Search,
  UserPlus,
  FileSpreadsheet,
  History,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  X,
  UploadCloud,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  details: string | null;
  code: string | null;
  rank: number | null;
  _count?: { members: number };
}

interface MemberContact {
  id: string;
  name: string;
  contactNo: string | null;
  email: string | null;
  others: string | null;
}

interface JobHistoryItem {
  id: string;
  name: string;
  channel: string;
  audienceSize: number;
  createdAt: string;
}

export function GroupWorkbench() {
  const [rankedGroups, setRankedGroups] = useState<Group[]>([]);
  const [generalGroups, setGeneralGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<MemberContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddExcelModal, setShowAddExcelModal] = useState(false);
  const [showMissingPromptModal, setShowMissingPromptModal] = useState(false);

  // Create Group Form
  const [createForm, setCreateForm] = useState({ name: "", details: "", code: "", isRanked: false, rank: 1 });

  // Autocomplete Contact Form
  const [contactSearchText, setContactSearchText] = useState("");
  const [directorySuggestions, setDirectorySuggestions] = useState<MemberContact[]>([]);
  const [singleForm, setSingleForm] = useState({ contactId: "", name: "", contactNo: "", email: "", others: "" });

  // Job History
  const [jobsHistory, setJobsHistory] = useState<JobHistoryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRankedGroups(data.ranked || []);
        setGeneralGroups(data.general || []);

        if (!selectedGroup && (data.ranked?.length > 0 || data.general?.length > 0)) {
          const first = data.ranked?.[0] || data.general?.[0];
          setSelectedGroup(first);
          loadMembers(first.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (groupId: string) => {
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/groups/${groupId}/members`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGroupMembers(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSelectGroup = (g: Group) => {
    setSelectedGroup(g);
    loadMembers(g.id);
  };

  const handleMoveRank = async (index: number, direction: "up" | "down") => {
    const newRanked = [...rankedGroups];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newRanked.length) return;

    const temp = newRanked[index]!;
    newRanked[index] = newRanked[targetIdx]!;
    newRanked[targetIdx] = temp;

    setRankedGroups(newRanked);

    await fetch("/api/groups/ranks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        rankedGroupIds: newRanked.map((g) => g.id),
      }),
    });
  };

  const handlePromoteToRanked = async (group: Group) => {
    const newRanked = [...rankedGroups, { ...group, rank: rankedGroups.length + 1 }];
    const newGeneral = generalGroups.filter((g) => g.id !== group.id);

    setRankedGroups(newRanked);
    setGeneralGroups(newGeneral);

    await fetch("/api/groups/ranks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        rankedGroupIds: newRanked.map((g) => g.id),
        generalGroupIds: newGeneral.map((g) => g.id),
      }),
    });
  };

  const handleDemoteToGeneral = async (group: Group) => {
    const newRanked = rankedGroups.filter((g) => g.id !== group.id);
    const newGeneral = [...generalGroups, { ...group, rank: null }];

    setRankedGroups(newRanked);
    setGeneralGroups(newGeneral);

    await fetch("/api/groups/ranks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        rankedGroupIds: newRanked.map((g) => g.id),
        generalGroupIds: newGeneral.map((g) => g.id),
      }),
    });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createForm.name,
          details: createForm.details,
          code: createForm.code,
          rank: createForm.isRanked ? rankedGroups.length + 1 : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group.");

      setFeedback({ type: "success", message: `Group "${createForm.name}" created successfully!` });
      setShowCreateModal(false);
      setCreateForm({ name: "", details: "", code: "", isRanked: false, rank: 1 });
      fetchGroups();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleSearchDirectory = async (query: string) => {
    setContactSearchText(query);
    if (!query || query.length < 2) {
      setDirectorySuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/directory?q=${encodeURIComponent(query)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDirectorySuggestions(data.contacts || []);
      }
    } catch (_) {}
  };

  const handleSelectSuggestion = (c: MemberContact) => {
    setSingleForm({
      contactId: c.id,
      name: c.name,
      contactNo: c.contactNo || "",
      email: c.email || "",
      others: c.others || "",
    });
    setDirectorySuggestions([]);
    setContactSearchText(c.name);
  };

  const handleAddSingleContact = async (autoCreate = false) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contactId: singleForm.contactId || undefined,
          name: singleForm.name || contactSearchText,
          contactNo: singleForm.contactNo,
          email: singleForm.email,
          others: singleForm.others,
          autoCreateDirectory: autoCreate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresDirectoryPrompt) {
          setShowMissingPromptModal(true);
          return;
        }
        throw new Error(data.error || "Failed to add contact.");
      }

      setFeedback({
        type: "success",
        message: data.alreadyMember ? "Contact is already in this group." : "Contact added to group!",
      });

      setShowAddSingleModal(false);
      setShowMissingPromptModal(false);
      setSingleForm({ contactId: "", name: "", contactNo: "", email: "", others: "" });
      setContactSearchText("");
      loadMembers(selectedGroup.id);
      fetchGroups();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleOpenJobModal = async () => {
    try {
      const res = await fetch("/api/campaigns/jobs-history", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJobsHistory(data.jobs || []);
      }
      setShowAddJobModal(true);
    } catch (_) {}
  };

  const handleImportJobContacts = async (campaignId: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/from-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ campaignId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import from job.");

      setFeedback({
        type: "success",
        message: `Imported ${data.addedCount} contacts from past job (${data.existingCount} already present).`,
      });

      setShowAddJobModal(false);
      loadMembers(selectedGroup.id);
      fetchGroups();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedGroup) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        if (!wsName) throw new Error("No sheet in file");
        const ws = wb.Sheets[wsName];
        if (!ws) throw new Error("Could not read sheet");
        const raw = XLSX.utils.sheet_to_json<any>(ws);

        const parsed = raw.map((r) => ({
          name: String(r.Name || r.name || r["Full Name"] || "Unnamed").trim(),
          contactNo: String(r.Phone || r.phone || r.Mobile || r.mobile || "").trim(),
          email: String(r.Email || r.email || "").trim(),
          others: String(r.Company || r.company || "").trim(),
        }));

        const res = await fetch(`/api/groups/${selectedGroup.id}/from-excel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ contacts: parsed, autoCreateDirectory: true }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Excel import failed.");

        setFeedback({
          type: "success",
          message: `Added ${data.addedCount} contacts to group (saved to Phone Directory).`,
        });

        setShowAddExcelModal(false);
        loadMembers(selectedGroup.id);
        fetchGroups();
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleRemoveMember = async (contactId: string) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/members/${contactId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setGroupMembers((prev) => prev.filter((m) => m.id !== contactId));
        setFeedback({ type: "success", message: "Member removed from group." });
        fetchGroups();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>
            <Users2 size={26} color="#3b82f6" />
            Contact Groups & Tiered Hierarchy
          </h1>
          <p>Organize contacts into custom ranked or general groups for rapid multi-channel broadcasts.</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className={styles.btnPrimary}>
          <Plus size={18} />
          Create New Group
        </button>
      </div>

      {feedback && (
        <div style={{ padding: "1rem", borderRadius: "0.5rem", background: feedback.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${feedback.type === "success" ? "#10b981" : "#ef4444"}`, color: feedback.type === "success" ? "#34d399" : "#f87171", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2-Box Ranking Organizer */}
      <div className={styles.rankingBoard}>
        {/* Left: Ranked Groups */}
        <div className={styles.rankingBox}>
          <div className={styles.boxHeader}>
            <h3>
              <Layers size={18} color="#f59e0b" />
              Ranked Groups ({rankedGroups.length})
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Ordered by Priority (1 = Highest)</span>
          </div>

          {rankedGroups.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>No ranked groups yet. Promote a general group below.</p>
          ) : (
            rankedGroups.map((g, idx) => (
              <div
                key={g.id}
                onClick={() => handleSelectGroup(g)}
                className={`${styles.groupCard} ${selectedGroup?.id === g.id ? styles.groupCardActive : ""}`}
              >
                <div className={styles.groupInfo}>
                  <div className={styles.groupNameRow}>
                    <span className={styles.rankBadge}>Rank #{idx + 1}</span>
                    <span className={styles.groupName}>{g.name}</span>
                  </div>
                  <span className={styles.memberCount}>
                    <Users2 size={12} /> {g._count?.members || 0} members {g.code ? `• Code: ${g.code}` : ""}
                  </span>
                </div>

                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleMoveRank(idx, "up")}
                    disabled={idx === 0}
                    className={styles.btnAction}
                    title="Move Rank Up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveRank(idx, "down")}
                    disabled={idx === rankedGroups.length - 1}
                    className={styles.btnAction}
                    title="Move Rank Down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => handleDemoteToGeneral(g)}
                    className={styles.btnAction}
                    title="Unrank / Move to General"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: General Groups */}
        <div className={styles.rankingBox}>
          <div className={styles.boxHeader}>
            <h3>
              <Users2 size={18} color="#60a5fa" />
              General Groups ({generalGroups.length})
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Standard Unranked Groups</span>
          </div>

          {generalGroups.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "1.5rem" }}>No unranked groups.</p>
          ) : (
            generalGroups.map((g) => (
              <div
                key={g.id}
                onClick={() => handleSelectGroup(g)}
                className={`${styles.groupCard} ${selectedGroup?.id === g.id ? styles.groupCardActive : ""}`}
              >
                <div className={styles.groupInfo}>
                  <span className={styles.groupName}>{g.name}</span>
                  <span className={styles.memberCount}>
                    <Users2 size={12} /> {g._count?.members || 0} members {g.code ? `• Code: ${g.code}` : ""}
                  </span>
                </div>

                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handlePromoteToRanked(g)}
                    className={styles.btnAction}
                    style={{ width: "auto", padding: "0 0.5rem", fontSize: "0.75rem" }}
                    title="Promote to Ranked"
                  >
                    + Rank
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Group Member Management */}
      {selectedGroup && (
        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <h2 style={{ margin: "0 0 0.25rem 0", color: "#f9fafb", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>{selectedGroup.name}</span>
                {selectedGroup.rank ? <span className={styles.rankBadge}>Rank #{selectedGroup.rank}</span> : null}
              </h2>
              <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                {groupMembers.length} active contacts in this group
              </span>
            </div>

            <div className={styles.detailActions}>
              <button onClick={() => setShowAddSingleModal(true)} className={styles.btnPrimary}>
                <UserPlus size={16} />
                Add Contact (Search/Autocomplete)
              </button>
              <button onClick={handleOpenJobModal} className={styles.btnSecondary}>
                <History size={16} />
                Add From Past Job
              </button>
              <button onClick={() => setShowAddExcelModal(true)} className={styles.btnSecondary}>
                <FileSpreadsheet size={16} />
                Add From Excel
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Contact Name</th>
                  <th>Phone No</th>
                  <th>Email</th>
                  <th>Company / Notes</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {membersLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                      Loading group members...
                    </td>
                  </tr>
                ) : groupMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                      No contacts inside this group yet. Use the buttons above to add contacts.
                    </td>
                  </tr>
                ) : (
                  groupMembers.map((m, idx) => (
                    <tr key={m.id}>
                      <td style={{ color: "#6b7280" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>
                        {m.contactNo ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#60a5fa" }}>
                            <Phone size={14} />
                            {m.contactNo}
                          </span>
                        ) : (
                          <span style={{ color: "#6b7280" }}>—</span>
                        )}
                      </td>
                      <td>
                        {m.email ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#34d399" }}>
                            <Mail size={14} />
                            {m.email}
                          </span>
                        ) : (
                          <span style={{ color: "#6b7280" }}>—</span>
                        )}
                      </td>
                      <td>{m.others || <span style={{ color: "#6b7280" }}>—</span>}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className={styles.btnDanger}
                          title="Remove from group"
                        >
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

      {/* Modal: Create Group */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create New Contact Group</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGroup}>
                <label>Group Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. VIP Retailers or Melbourne Clients"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Group Details / Description</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Premium tier customers in Victoria"
                  value={createForm.details}
                  onChange={(e) => setCreateForm({ ...createForm, details: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Group Code (Optional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. GRP-VIP-01"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "#1f2937", borderRadius: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="rankCheck"
                  checked={createForm.isRanked}
                  onChange={(e) => setCreateForm({ ...createForm, isRanked: e.target.checked })}
                />
                <label htmlFor="rankCheck" style={{ color: "#f9fafb", fontSize: "0.875rem", cursor: "pointer" }}>
                  Assign to Ranked Hierarchy (Top Priority)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Single Contact with Autocomplete */}
      {showAddSingleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Add Single Contact to Group</h3>
              <button onClick={() => setShowAddSingleModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGroup}>
                <label>Search Phone Directory (by Name, Phone, or Email)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Type name, phone, or email to auto-fill..."
                    value={contactSearchText}
                    onChange={(e) => handleSearchDirectory(e.target.value)}
                  />
                  {directorySuggestions.length > 0 && (
                    <div className={styles.autocompleteList}>
                      {directorySuggestions.map((s) => (
                        <div key={s.id} onClick={() => handleSelectSuggestion(s)} className={styles.autocompleteItem}>
                          <div>
                            <strong style={{ color: "#f9fafb" }}>{s.name}</strong>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.5rem" }}>
                              {s.contactNo || s.email}
                            </span>
                          </div>
                          <ChevronRight size={14} color="#9ca3af" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={singleForm.name}
                  onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                  placeholder="e.g. John Smith"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="text"
                  className={styles.input}
                  value={singleForm.contactNo}
                  onChange={(e) => setSingleForm({ ...singleForm, contactNo: e.target.value })}
                  placeholder="e.g. +61 412 345 678"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  value={singleForm.email}
                  onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" onClick={() => setShowAddSingleModal(false)} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="button" onClick={() => handleAddSingleContact(false)} className={styles.btnPrimary}>
                  Add to Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Missing Contact Directory Prompt */}
      {showMissingPromptModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: "450px", border: "1px solid #f59e0b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#f59e0b" }}>
              <ShieldAlert size={28} />
              <h3 style={{ margin: 0, color: "#f9fafb" }}>Contact Not in Directory</h3>
            </div>

            <p style={{ color: "#d1d5db", fontSize: "0.875rem", lineHeight: "1.5" }}>
              <strong>&quot;{singleForm.name || contactSearchText}&quot;</strong> is not currently stored in your Phone Directory.
              <br /><br />
              <em>Note: Contacts must exist in the central Phone Directory before they can be assigned to a group.</em>
              <br /><br />
              Would you like to save this contact to your Phone Directory now?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowMissingPromptModal(false)}
                className={styles.btnSecondary}
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddSingleContact(true)}
                className={styles.btnPrimary}
              >
                Yes, Add to Directory & Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add from Past Job */}
      {showAddJobModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Import Contacts from Past Dispatch Batch</h3>
              <button onClick={() => setShowAddJobModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
              Select a previous dispatch job to add all its recipient contacts into <strong>{selectedGroup?.name}</strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "350px", overflowY: "auto" }}>
              {jobsHistory.length === 0 ? (
                <p style={{ textAlign: "center", color: "#6b7280", padding: "1rem" }}>No previous dispatch jobs found.</p>
              ) : (
                jobsHistory.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleImportJobContacts(job.id)}
                    className={styles.jobItem}
                  >
                    <div>
                      <strong style={{ color: "#f9fafb", display: "block" }}>{job.name}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        {job.audienceSize} recipients • {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button type="button" className={styles.btnPrimary} style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}>
                      Import Batch
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowAddJobModal(false)} className={styles.btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add from Excel */}
      {showAddExcelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Import Spreadsheet Contacts to Group</h3>
              <button onClick={() => setShowAddExcelModal(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
              Upload an Excel (.xlsx, .xls) or CSV file. All contacts will be validated and automatically saved into the central Phone Directory and assigned to <strong>{selectedGroup?.name}</strong>.
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

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddExcelModal(false)} type="button" className={styles.btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
