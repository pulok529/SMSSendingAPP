"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          background: "#F7EFE6",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "36px",
            maxWidth: "460px",
            textAlign: "center",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
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
            Critical System Error
          </h2>
          <p style={{ fontSize: "14px", color: "#5F5047", marginBottom: "24px" }}>
            A core application exception occurred. Please try reloading.
          </p>

          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#CE631D",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
