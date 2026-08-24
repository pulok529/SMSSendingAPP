"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Smartphone,
  KeyRound,
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Clock,
  Send,
  Ticket,
} from "lucide-react";
import styles from "@/components/ui/dashboard.module.css";

type ApiDevice = {
  id: string;
  deviceName: string;
  phoneNumber: string;
  operator: string;
  status: string;
  battery: string | null;
  lastSeenAt: string | null;
};

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "CLIENT" | "SENDER";
  isActive: boolean;
  company: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    devices: number;
    campaigns: number;
    tickets: number;
    mobileLogs: number;
  };
  devices?: ApiDevice[];
};

type UserDetail = ApiUser & {
  campaigns?: Array<{ id: string; name: string; channel: string; status: string; sentCount: number }>;
  tickets?: Array<{ id: string; ticketNumber: string; subject: string; priority: string; status: string; createdAt: string }>;
  mobileLogs?: Array<{ id: string; type: string; title: string; detail: string; timestamp: string }>;
};



export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: "",
    dateOfBirth: "",
    gender: "Male",
    address: "",
    notes: "",
    role: "CLIENT",
  });
  const [isCreating, setIsCreating] = useState(false);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : "Failed to load users.",
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.company && u.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "DISABLED" && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Toggle user status
  async function toggleUserStatus(user: ApiUser) {
    const newStatus = !user.isActive;
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
      );
      setNotice({
        text: `User ${user.name} is now ${newStatus ? "ACTIVE" : "DISABLED"}.`,
      });
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : "Error updating status.",
        isError: true,
      });
    }
  }

  // Create Client
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch(`/api/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      setNotice({ text: `Client ${data.user.name} created successfully!` });
      setIsAddModalOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        company: "",
        phone: "",
        dateOfBirth: "",
        gender: "Male",
        address: "",
        notes: "",
        role: "CLIENT",
      });
      loadUsers();
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : "Failed to create user.",
        isError: true,
      });
    } finally {
      setIsCreating(false);
    }
  }

  // View User Details & Activity
  async function viewUserDetails(userId: string) {
    setIsDetailLoading(true);
    setSelectedUser(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load user details.");
      const data = await res.json();
      setSelectedUser(data.user);
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : "Failed to load user info.",
        isError: true,
      });
    } finally {
      setIsDetailLoading(false);
    }
  }

  // Reset password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPasswordUserId || !newPassword) return;
    try {
      const res = await fetch(`/api/users/${resetPasswordUserId}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed.");
      setNotice({ text: data.message || "Password reset successfully!" });
      setResetPasswordUserId(null);
      setNewPassword("");
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : "Failed to reset password.",
        isError: true,
      });
    }
  }

  const clientCount = users.filter((u) => u.role === "CLIENT").length;
  const activeCount = users.filter((u) => u.isActive).length;
  const disabledCount = users.filter((u) => !u.isActive).length;
  const totalDevices = users.reduce((acc, u) => acc + (u._count?.devices || 0), 0);

  return (
    <div className={styles.page}>
      {notice && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            backgroundColor: notice.isError ? "#FEE2E2" : "#DCFCE7",
            color: notice.isError ? "#991B1B" : "#166534",
            border: `1px solid ${notice.isError ? "#F87171" : "#86EFAC"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              color: "inherit",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Total Users</div>
          <div className={styles.statValue}>{users.length}</div>
          <p className={styles.statNote}>Across all system roles</p>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Client Accounts</div>
          <div className={styles.statValue}>{clientCount}</div>
          <p className={styles.statNote}>Dedicated service tenants</p>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Active Status</div>
          <div className={styles.statValue} style={{ color: "#16A34A" }}>
            {activeCount}
          </div>
          <p className={styles.statNote}>{disabledCount} disabled account(s)</p>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>Linked Phones</div>
          <div className={styles.statValue}>{totalDevices}</div>
          <p className={styles.statNote}>Registered Android senders</p>
        </article>
      </section>

      {/* Action Bar */}
      <section className={styles.panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#888",
                }}
              />
              <input
                type="text"
                placeholder="Search name, email, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.field}
                style={{ paddingLeft: "32px" }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={styles.field}
              style={{ width: "auto" }}
            >
              <option value="ALL">All Roles</option>
              <option value="SUPERADMIN">Superadmin</option>
              <option value="ADMIN">Admin</option>
              <option value="CLIENT">Client</option>
              <option value="SENDER">Sender</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.field}
              style={{ width: "auto" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DISABLED">Disabled Only</option>
            </select>

            <button
              onClick={loadUsers}
              className={styles.buttonGhost}
              title="Refresh list"
              style={{ padding: "8px 12px" }}
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={styles.buttonPrimary}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <UserPlus size={16} />
            <span>Create Client User</span>
          </button>
        </div>

        {/* Users Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User / Organization</th>
                <th>Contact Info</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Connected Phones</th>
                <th>Activity</th>
                <th style={{ textAlign: "right" }}>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    {isLoading ? "Loading users..." : "No users matched your criteria."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: u.role === "SUPERADMIN" ? "#7C3AED" : u.role === "CLIENT" ? "#CE631D" : "#3B82F6",
                              color: "#FFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "13px",
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <strong style={{ fontSize: "14px" }}>{u.name}</strong>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {u.company || "Individual Account"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "13px" }}>{u.email}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          {u.phone || "No phone listed"}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor:
                              u.role === "SUPERADMIN"
                                ? "#F3E8FF"
                                : u.role === "CLIENT"
                                ? "#FFEDD5"
                                : "#DBEAFE",
                            color:
                              u.role === "SUPERADMIN"
                                ? "#6B21A8"
                                : u.role === "CLIENT"
                                ? "#9A3412"
                                : "#1E40AF",
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: u.isActive ? "#DCFCE7" : "#FEE2E2",
                            color: u.isActive ? "#166534" : "#991B1B",
                          }}
                        >
                          {u.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {u.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Smartphone size={14} color="#666" />
                          <span style={{ fontSize: "13px", fontWeight: "600" }}>
                            {u._count?.devices || 0} device(s)
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {u._count?.campaigns || 0} campaigns · {u._count?.tickets || 0} tickets
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() => viewUserDetails(u.id)}
                            className={styles.buttonGhost}
                            style={{ padding: "4px 8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Inspect full profile & mobile activity"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setResetPasswordUserId(u.id)}
                            className={styles.buttonGhost}
                            style={{ padding: "4px 8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Reset client password"
                          >
                            <KeyRound size={13} />
                            <span>Pass</span>
                          </button>

                          <button
                            onClick={() => toggleUserStatus(u)}
                            style={{
                              padding: "4px 10px",
                              fontSize: "12px",
                              borderRadius: "6px",
                              border: "none",
                              cursor: "pointer",
                              fontWeight: "600",
                              backgroundColor: u.isActive ? "#FEE2E2" : "#DCFCE7",
                              color: u.isActive ? "#991B1B" : "#166534",
                            }}
                            title={u.isActive ? "Disable this client account" : "Enable this client account"}
                          >
                            {u.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE CLIENT MODAL */}
      {isAddModalOpen && (
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
              backgroundColor: "#FFF",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                Create New Client User
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className={styles.label}>
                  Full Name *
                  <input
                    type="text"
                    required
                    className={styles.field}
                    placeholder="e.g. Acme Retail Admin"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </label>

                <label className={styles.label}>
                  Email Address *
                  <input
                    type="email"
                    required
                    className={styles.field}
                    placeholder="client@company.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </label>

                <label className={styles.label}>
                  Initial Password *
                  <input
                    type="password"
                    required
                    className={styles.field}
                    placeholder="Min 6 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </label>

                <label className={styles.label}>
                  Company / Organization
                  <input
                    type="text"
                    className={styles.field}
                    placeholder="e.g. Acme Corporation"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                  />
                </label>

                <label className={styles.label}>
                  Phone Number
                  <input
                    type="text"
                    className={styles.field}
                    placeholder="e.g. +880 1711-000000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </label>

                <label className={styles.label}>
                  Role
                  <select
                    className={styles.field}
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="CLIENT">Client (Standard Tenant)</option>
                    <option value="ADMIN">Admin (Co-Administrator)</option>
                    <option value="SENDER">Sender (Dispatch Operator)</option>
                  </select>
                </label>

                <label className={styles.label} style={{ gridColumn: "span 2" }}>
                  Physical Address
                  <input
                    type="text"
                    className={styles.field}
                    placeholder="e.g. 123 Commercial Ave, Sydney AU"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  />
                </label>

                <label className={styles.label} style={{ gridColumn: "span 2" }}>
                  Internal Notes
                  <textarea
                    className={styles.textarea}
                    placeholder="Account purpose or plan details..."
                    rows={2}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={styles.buttonGhost}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={styles.buttonPrimary}
                >
                  {isCreating ? "Creating..." : "Save & Activate Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAIL & ACTIVITY MODAL */}
      {selectedUser && (
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
              backgroundColor: "#FFF",
              borderRadius: "12px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#CE631D",
                    color: "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                    {selectedUser.name}
                  </h3>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    {selectedUser.email} · {selectedUser.company || "Individual"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Profile Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#F7EFE6", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <div><strong>Role:</strong> {selectedUser.role}</div>
              <div><strong>Status:</strong> {selectedUser.isActive ? "ACTIVE" : "DISABLED"}</div>
              <div><strong>Phone:</strong> {selectedUser.phone || "N/A"}</div>
              <div><strong>Address:</strong> {selectedUser.address || "N/A"}</div>
              <div><strong>Member Since:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              <div><strong>Notes:</strong> {selectedUser.notes || "None"}</div>
            </div>

            {/* Linked Devices Section */}
            <h4 style={{ fontSize: "15px", fontWeight: "bold", margin: "16px 0 8px 0" }}>
              Connected Android Senders ({selectedUser.devices?.length || 0})
            </h4>
            {(!selectedUser.devices || selectedUser.devices.length === 0) ? (
              <p style={{ color: "#888", fontSize: "13px" }}>No Android phones registered under this user yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {selectedUser.devices.map((dev) => (
                  <div key={dev.id} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px", backgroundColor: "#FAFAFA" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{dev.deviceName}</strong>
                      <span style={{ fontSize: "11px", fontWeight: "bold", color: dev.status === "ONLINE" ? "#16A34A" : "#888" }}>
                        ● {dev.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                      {dev.phoneNumber} ({dev.operator}) · Battery {dev.battery || "100%"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Mobile Logs */}
            <h4 style={{ fontSize: "15px", fontWeight: "bold", margin: "16px 0 8px 0" }}>
              Recent Device Activity Logs ({selectedUser.mobileLogs?.length || 0})
            </h4>
            {(!selectedUser.mobileLogs || selectedUser.mobileLogs.length === 0) ? (
              <p style={{ color: "#888", fontSize: "13px" }}>No activity logs recorded for this account.</p>
            ) : (
              <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
                {selectedUser.mobileLogs.map((log) => (
                  <div key={log.id} style={{ padding: "8px 12px", borderBottom: "1px solid #EEE", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{log.title}</strong>
                      <span style={{ color: "#888" }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: "#555" }}>{log.detail}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setSelectedUser(null)} className={styles.buttonPrimary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUserId && (
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
              backgroundColor: "#FFF",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
              Reset User Password
            </h3>
            <form onSubmit={handleResetPassword}>
              <label className={styles.label}>
                New Password *
                <input
                  type="password"
                  required
                  className={styles.field}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setResetPasswordUserId(null)}
                  className={styles.buttonGhost}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.buttonPrimary}>
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
