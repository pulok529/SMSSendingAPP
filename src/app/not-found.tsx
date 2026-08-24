import Link from "next/link";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "75vh",
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
          padding: "40px",
          maxWidth: "460px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#F7EFE6",
            color: "#CE631D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px auto",
          }}
        >
          <Compass size={32} />
        </div>

        <div style={{ fontSize: "13px", fontWeight: 700, color: "#CE631D", textTransform: "uppercase", marginBottom: "6px" }}>
          404 — Page Not Found
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#22150E", marginBottom: "8px" }}>
          Looking for something?
        </h2>
        <p style={{ fontSize: "14px", color: "#5F5047", lineHeight: 1.5, marginBottom: "28px" }}>
          The page you requested could not be found or has been moved.
        </p>

        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 22px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #CE631D 0%, #ECA051 100%)",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(206, 99, 29, 0.25)",
          }}
        >
          <Home size={16} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
