"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error Caught:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4D8CE",
          borderRadius: "16px",
          padding: "36px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#FEF2F2",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#22150E", marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "14px", color: "#5F5047", lineHeight: 1.5, marginBottom: "20px" }}>
          An unexpected error occurred while loading this view. Your data is safe.
        </p>

        {error?.message && (
          <div
            style={{
              background: "#F7EFE6",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              color: "#8E7F75",
              textAlign: "left",
              fontFamily: "monospace",
              marginBottom: "24px",
              wordBreak: "break-word",
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #CE631D 0%, #ECA051 100%)",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} />
            Try Again
          </button>

          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "#F7EFE6",
              color: "#22150E",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
              border: "1px solid #E4D8CE",
            }}
          >
            <Home size={15} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
