"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Plus } from "lucide-react";
import JobForm from "@/components/jobs/JobForm";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", QUOTED: "Quoted", CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress", WRAPPED: "Wrapped", INVOICED: "Invoiced",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:       { bg: "#66666622", color: "#888" },
  QUOTED:      { bg: "#5b9cf622", color: "#5b9cf6" },
  CONFIRMED:   { bg: "#e8a04522", color: "#e8a045" },
  IN_PROGRESS: { bg: "#5cba7d22", color: "#5cba7d" },
  WRAPPED:     { bg: "#88888822", color: "#888" },
  INVOICED:    { bg: "#a855f722", color: "#a855f7" },
};

interface ContextMenu { x: number; y: number; job: any; }

export default function JobsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...jobs].sort((a, b) => {
    let aVal = "", bVal = "";
    if (sortKey === "client") { aVal = a.client?.name || ""; bVal = b.client?.name || ""; }
    else { aVal = String(a[sortKey] ?? ""); bVal = String(b[sortKey] ?? ""); }
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  useEffect(() => {
    fetch("/api/jobs")
      .then(r => r.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async (data: any) => {
    const isEdit = !!data.id;
    const res = await fetch("/api/jobs", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (isEdit) {
      setJobs(prev => prev.map(j => j.id === result.id ? result : j));
    } else {
      setJobs(prev => [result, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setJobs(prev => prev.filter(j => j.id !== id));
    setContextMenu(null);
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const menuBtn: React.CSSProperties = {
    width: "100%", textAlign: "left", padding: "10px 16px",
    background: "none", border: "none", color: "#f0f0f0",
    fontSize: 13, cursor: "pointer", display: "block", fontFamily: "inherit",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Jobs</h1>
          <p style={{ fontSize: 14, color: "#666" }}>
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
          </p>
        </div>
        <button
          onClick={() => { setEditJob(null); setShowForm(true); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}
        >
          <Plus size={15} /> New Job
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "#666", fontSize: 14, textAlign: "center", padding: "48px 0" }}>Loading...</div>
      ) : jobs.length === 0 ? (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "64px 32px", textAlign: "center" }}>
          <Briefcase size={32} style={{ color: "#333", margin: "0 auto 16px" }} />
          <p style={{ color: "#555", fontSize: 14 }}>No jobs yet — create your first production</p>
        </div>
      ) : (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                {([
                  { label: "Job",      key: "name",      align: "left" },
                  { label: "Client",   key: "client",    align: "left" },
                  { label: "Status",   key: "status",    align: "left" },
                  { label: "Date",     key: "startDate", align: "left" },
                  { label: "Days",     key: "shootDays", align: "left" },
                  { label: "Location", key: "location",  align: "left" },
                ] as const).map(({ label, key, align }) => {
                  const active = sortKey === key;
                  return (
                    <th key={key} onClick={() => handleSort(key)} style={{ textAlign: align, padding: "12px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? "#ccc" : "#555", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                      {label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map(job => (
                <tr
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, job }); }}
                  style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0f0" }}>{job.name}</div>
                    {job.jobNumber && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{job.jobNumber}</div>}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>
                    {job.client?.name || "—"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      background: STATUS_COLORS[job.status]?.bg || "#33333322",
                      color: STATUS_COLORS[job.status]?.color || "#888",
                    }}>
                      {STATUS_LABELS[job.status] || job.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>
                    {job.startDate ? (
                      <span>{fmtDate(job.startDate)}{job.endDate ? ` → ${fmtDate(job.endDate)}` : ""}</span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666", fontFamily: "monospace" }}>
                    {job.shootDays ? `${job.shootDays}d` : "—"}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>
                    {job.location || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ padding: "10px 20px", borderTop: "1px solid #1e1e1e", background: "#111", fontSize: 12, color: "#444", display: "flex", gap: 20 }}>
            <span>{jobs.length} jobs</span>
            <span>{jobs.filter(j => j.status === "CONFIRMED" || j.status === "IN_PROGRESS").length} active</span>
            <span>{jobs.filter(j => j.status === "DRAFT").length} drafts</span>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div ref={contextRef} style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, background: "#1e1e1e", border: "1px solid #333", borderRadius: 6, zIndex: 300, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <button style={menuBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => { setEditJob(contextMenu.job); setShowForm(true); setContextMenu(null); }}
          >
            Edit {contextMenu.job.name}
          </button>
          <div style={{ height: 1, background: "#2a2a2a" }} />
          <div style={{ padding: "6px 0" }}>
            <div style={{ padding: "4px 16px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555" }}>
              Change Status
            </div>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <button key={value}
                style={{ ...menuBtn, color: STATUS_COLORS[value]?.color || "#888", paddingLeft: 28 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
                onClick={async () => {
                  const res = await fetch("/api/jobs", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...contextMenu.job, status: value }),
                  });
                  const result = await res.json();
                  setJobs(prev => prev.map(j => j.id === result.id ? result : j));
                  setContextMenu(null);
                }}
              >
                {label}
                {contextMenu.job.status === value && <span style={{ marginLeft: 8, fontSize: 8 }}>●</span>}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: "#2a2a2a" }} />
          <button
            style={{ ...menuBtn, color: "#e05252" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => {
              if (window.confirm(`Delete "${contextMenu.job.name}"? This cannot be undone.`)) {
                handleDelete(contextMenu.job.id);
              }
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <JobForm
          onClose={() => { setShowForm(false); setEditJob(null); }}
          onSave={handleSave}
          onDelete={editJob ? () => handleDelete(editJob.id) : undefined}
          initialData={editJob}
        />
      )}
    </div>
  );
}