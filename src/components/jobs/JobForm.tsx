"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface JobFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
  initialData?: any;
}

const STATUSES = ["DRAFT", "QUOTED", "CONFIRMED", "IN_PROGRESS", "WRAPPED", "INVOICED"];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", QUOTED: "Quoted", CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress", WRAPPED: "Wrapped", INVOICED: "Invoiced",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1c1c1c", border: "1px solid #242424",
  borderRadius: 4, color: "#f0f0f0", padding: "9px 12px",
  fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "#444", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default function JobForm({ onClose, onSave, onDelete, initialData }: JobFormProps) {
  const isEdit = !!initialData?.id;
  const [clients, setClients] = useState<any[]>([]);

  const [form, setForm] = useState({
  name: initialData?.name || "",
  jobNumber: initialData?.jobNumber || "",
  clientId: initialData?.clientId || "",
  status: initialData?.status || "DRAFT",
  startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : "",
  endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 10) : "",
  shootDays: initialData?.shootDays?.toString() || "",
  location: initialData?.location || "",
  notes: initialData?.notes || "",
  internalNotes: initialData?.internalNotes || "",
  budgetTier: initialData?.budgetTier || null as number | null,
});

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

 useEffect(() => {
  fetch("/api/clients")
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setClients(data);
    })
    .catch(() => setClients([]));
}, []);

  // Auto-calculate shoot days when dates change
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days > 0) setForm(f => ({ ...f, shootDays: days.toString() }));
    }
  }, [form.startDate, form.endDate]);

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, id: initialData?.id });
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${initialData?.name}"? This cannot be undone.`)) return;
    onDelete?.();
    onClose();
  };

  const statusColors: Record<string, string> = {
    DRAFT: "#666", QUOTED: "#5b9cf6", CONFIRMED: "#e8a045",
    IN_PROGRESS: "#5cba7d", WRAPPED: "#888", INVOICED: "#a855f7",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 600, height: "100vh", background: "#161616", borderLeft: "1px solid #242424", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #242424", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8a045" }}>
            {isEdit ? initialData.name : "New Job"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Core Info */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Job Info</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Job Name *">
                <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Nike Brand Campaign" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Job Number" hint="Optional reference number">
                  <input style={inputStyle} value={form.jobNumber} onChange={e => set("jobNumber", e.target.value)} placeholder="e.g. JOB-001" />
                </Field>
                <Field label="Status">
                  <select style={{ ...inputStyle, appearance: "none" }} value={form.status} onChange={e => set("status", e.target.value)}>
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Client">
                <select style={{ ...inputStyle, appearance: "none" }} value={form.clientId} onChange={e => set("clientId", e.target.value)}>
                  <option value="">— No client —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Schedule</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field label="Start Date">
                <input style={inputStyle} type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
              </Field>
              <Field label="End Date">
                <input style={inputStyle} type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
              </Field>
              <Field label="Shoot Days">
                <input style={inputStyle} type="number" value={form.shootDays} onChange={e => set("shootDays", e.target.value)} placeholder="0" />
              </Field>
            </div>
            <div style={{ marginTop: 14 }}>
              <Field label="Location">
                <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. New York, NY" />
              </Field>
            </div>
          </div>

          {/* Budget Tier */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>Budget Tier</p>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Sets the rate tier for all gear and crew on this job.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { tier: 1, label: "Tier 1", sub: "Low" },
                { tier: 2, label: "Tier 2", sub: "Indie" },
                { tier: 3, label: "Tier 3", sub: "Mid" },
                { tier: 4, label: "Tier 4", sub: "Comm." },
                { tier: 5, label: "Tier 5", sub: "HW" },
              ].map(({ tier, label, sub }) => {
                const selected = form.budgetTier === tier;
                return (
                  <button key={tier}
                    onClick={() => setForm(f => ({ ...f, budgetTier: f.budgetTier === tier ? null : tier }))}
                    style={{ padding: "10px 8px", borderRadius: 4, border: `1px solid ${selected ? "#e8a045" : "#242424"}`, background: selected ? "#e8a04515" : "#111", color: selected ? "#e8a045" : "#666", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>{sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Notes</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Notes" hint="Visible on client-facing documents">
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Project notes..." />
              </Field>
              <Field label="Internal Notes" hint="Never shown to clients">
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={form.internalNotes} onChange={e => set("internalNotes", e.target.value)} placeholder="Internal notes..." />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #242424", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          {isEdit ? (
            <button onClick={handleDelete} style={{ background: "none", border: "1px solid #e05252", color: "#e05252", borderRadius: 4, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Delete
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px" }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {isEdit ? "Save Changes" : "Create Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}