"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1c1c1c",
  border: "1px solid #2a2a2a",
  borderRadius: 4,
  color: "#f0f0f0",
  padding: "10px 14px",
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#555",
  marginBottom: 6,
};

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If email confirmation is required, session will be null
      if (!data.session) {
        setCheckEmail(true);
        return;
      }

      // Onboard: create crew member
      await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      router.push("/jobs");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (checkEmail) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 8,
          padding: "36px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 32,
            marginBottom: 16,
          }}
        >
          ✉️
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0", margin: "0 0 12px" }}>
          Check your email
        </h2>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 24px", lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: "#f0f0f0" }}>{email}</strong>.
          Click it to activate your account.
        </p>
        <Link
          href="/login"
          style={{ color: "#e8a045", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 8,
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#e8a045",
          }}
        >
          Production
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#555",
            marginLeft: 6,
          }}
        >
          OS
        </span>
        <p style={{ fontSize: 13, color: "#555", margin: "8px 0 0" }}>
          Create your account
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input
              style={inputStyle}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jamie"
              required
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input
              style={inputStyle}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              required
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "#e05252",
              margin: 0,
              padding: "10px 14px",
              background: "#e0525215",
              border: "1px solid #e0525230",
              borderRadius: 4,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#a06020" : "#e8a045",
            color: "#000",
            border: "none",
            borderRadius: 4,
            padding: "11px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            marginTop: 4,
          }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555", margin: 0 }}>
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: "#e8a045", textDecoration: "none", fontWeight: 600 }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
