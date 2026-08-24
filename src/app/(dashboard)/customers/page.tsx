"use client";

import { useEffect, useState } from "react";
import styles from "@/components/ui/dashboard.module.css";
import Link from "next/link";
import { Search, Trash2, UserPlus, X } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  company?: string;
  mobile?: string;
  email?: string;
  city?: string;
  tags: string[];
  eventCount: number;
  consentSms: boolean;
  consentEmail: boolean;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [consentFilter, setConsentFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    mobile: "",
    email: "",
    city: "",
    tags: "",
    consentSms: true,
    consentEmail: true,
  });

  const loadCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (consentFilter !== "ALL") params.append("consent", consentFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error("Failed to load customers", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, consentFilter]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          company: formData.company.trim() || undefined,
          mobile: formData.mobile.trim() || undefined,
          email: formData.email.trim() || undefined,
          city: formData.city.trim() || undefined,
          tags: formData.tags
            ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          consentSms: formData.consentSms,
          consentEmail: formData.consentEmail,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          company: "",
          mobile: "",
          email: "",
          city: "",
          tags: "",
          consentSms: true,
          consentEmail: true,
        });
        loadCustomers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create customer.");
      }
    } catch (e) {
      console.error("Error creating customer", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error("Error deleting customer", e);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Customer Directory</h2>
            <p className={styles.panelText}>
              Manage customer records, verify SMS/Email broadcast consent, and target audience segments.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/imports" className={styles.secondaryButton}>
              Upload Excel
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className={styles.primaryButton}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <UserPlus size={16} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 280px",
              maxWidth: "420px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8E7F75",
              }}
            />
            <input
              type="text"
              placeholder="Search by name, mobile, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "10px",
                border: "1px solid #E4D8CE",
                background: "#FFFFFF",
                fontSize: "14px",
                color: "#22150E",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {["ALL", "SMS", "EMAIL"].map((filter) => (
              <button
                key={filter}
                onClick={() => setConsentFilter(filter)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: consentFilter === filter ? "#CE631D" : "#E4D8CE",
                  background: consentFilter === filter ? "#CE631D" : "#FFFFFF",
                  color: consentFilter === filter ? "#FFFFFF" : "#5F5047",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {filter === "ALL" ? "All Contacts" : `${filter} Consented`}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Location</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Segments</th>
                <th>Consent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className={styles.rowMeta}>
                        <strong>{customer.name}</strong>
                        <span className={styles.rowSubtle}>{customer.company || "Individual"}</span>
                      </div>
                    </td>
                    <td>{customer.city || "—"}</td>
                    <td>{customer.mobile || "—"}</td>
                    <td>{customer.email || "—"}</td>
                    <td>
                      <div className={styles.pillRow}>
                        {customer.tags && customer.tags.length > 0 ? (
                          customer.tags.map((tag) => (
                            <span key={tag} className={styles.pill}>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className={styles.rowSubtle}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: customer.consentSms ? "#15803D" : "#991B1B" }}>
                        SMS {customer.consentSms ? "✓" : "✗"}
                      </span>
                      {" · "}
                      <span style={{ fontSize: "13px", color: customer.consentEmail ? "#15803D" : "#991B1B" }}>
                        Email {customer.consentEmail ? "✓" : "✗"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        title="Delete customer"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#991B1B",
                          padding: "4px",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px 0", color: "#8E7F75" }}>
                    {loading ? "Loading customer directory..." : "No customers found matching your filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Customer Modal */}
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
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#22150E" }}>Add New Customer</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8E7F75" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. David Miller"
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
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Corp"
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
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Sydney"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E4D8CE",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                      Mobile Phone (for SMS)
                    </label>
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="e.g. +61 422 000 111"
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
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. david@apex.com"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E4D8CE",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#5F5047", marginBottom: "4px" }}>
                    Tags / Segments (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. VIP, Conference, Repeat Client"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E4D8CE",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#22150E", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.consentSms}
                      onChange={(e) => setFormData({ ...formData, consentSms: e.target.checked })}
                    />
                    Consents to SMS Broadcasts
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#22150E", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.consentEmail}
                      onChange={(e) => setFormData({ ...formData, consentEmail: e.target.checked })}
                    />
                    Consents to Email Broadcasts
                  </label>
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
                    {submitting ? "Saving..." : "Save Customer"}
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
