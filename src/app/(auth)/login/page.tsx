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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        router.push("/jobs");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
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
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
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
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555", margin: 0 }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          style={{ color: "#e8a045", textDecoration: "none", fontWeight: 600 }}
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
