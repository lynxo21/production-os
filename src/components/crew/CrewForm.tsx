"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface CrewFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
  initialData?: any;
}

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

const inputStyle = {
  width: "100%", background: "#1c1c1c", border: "1px solid #2a2a2a",
  borderRadius: 4, color: "#f0f0f0", padding: "9px 12px",
  fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const, outline: "none",
};

export default function CrewForm({ onClose, onSave, onDelete, initialData }: CrewFormProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    type: initialData?.type || "FREELANCE",
    location: initialData?.location || "",
    unionStatus: initialData?.unionStatus || "",
    workedWithBefore: initialData?.workedWithBefore || false,
    hiredBefore: initialData?.hiredBefore || false,
    minimumTier: initialData?.tierFloor || null as number | null,
    notes: initialData?.notes || "",
  });

  const [roles, setRoles] = useState<{ role: string; isPrimary: boolean }[]>(
    initialData?.roles?.map((r: any) => ({
      role: r.role?.name || r.role,
      isPrimary: r.isPrimary,
    })) || []
  );

  const [dbRoles, setDbRoles] = useState<{ id: string; name: string; department: string | null }[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetch("/api/settings/roles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDbRoles(data);
      })
      .catch(() => {});
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addRole = () => {
    if (!newRole) return;
    if (roles.find(r => r.role === newRole)) return;
    setRoles(prev => [...prev, { role: newRole, isPrimary: prev.length === 0 }]);
    setNewRole("");
  };

  const removeRole = (role: string) => {
    const filtered = roles.filter(r => r.role !== role);
    if (filtered.length > 0 && !filtered.find(r => r.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    setRoles(filtered);
  };

  const setPrimary = (role: string) => {
    setRoles(prev => prev.map(r => ({ ...r, isPrimary: r.role === role })));
  };

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    onSave({ ...form, roles, id: initialData?.id });
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete ${initialData?.firstName} ${initialData?.lastName}? This cannot be undone.`)) return;
    onDelete?.();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 600, height: "100vh", background: "#161616", borderLeft: "1px solid #242424", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #242424", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8a045" }}>
            {isEdit ? `${initialData.firstName} ${initialData.lastName}` : "Add Person"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Identity */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Identity</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="First Name *">
                <input style={inputStyle} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Jamie" />
              </Field>
              <Field label="Last Name *">
                <input style={inputStyle} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Smith" />
              </Field>
              <Field label="Email">
                <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jamie@email.com" />
              </Field>
              <Field label="Phone">
                <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 555 000 0000" />
              </Field>
              <Field label="Type">
                <select style={{ ...inputStyle, appearance: "none" }} value={form.type} onChange={e => set("type", e.target.value)}>
                  <option value="IN_HOUSE">In House</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </Field>
              <Field label="Location / Region">
                <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. New York, NY" />
              </Field>
            </div>
          </div>

          {/* Roles */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Roles</p>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Add all roles this person can fill. Click the circle to set primary.</p>
            {dbRoles.length === 0 ? (
              <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Add roles in Settings first</p>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {/* Department filter */}
                <select
                  style={{ ...inputStyle, flex: "0 0 140px", appearance: "none" }}
                  value={selectedDept}
                  onChange={e => { setSelectedDept(e.target.value); setNewRole(""); }}
                >
                  <option value="">All Depts</option>
                  {[...new Set(dbRoles.map(r => r.department || "Uncategorized"))].sort().map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {/* Role filter */}
                <select
                  style={{ ...inputStyle, flex: 1, appearance: "none" }}
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="">— Select a role —</option>
                  {dbRoles
                    .filter(r => !selectedDept || (r.department || "Uncategorized") === selectedDept)
                    .filter(r => !roles.find(x => x.role === r.name))
                    .map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))
                  }
                </select>
                <button onClick={addRole} style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
                  <Plus size={15} />
                </button>
              </div>
            )}
            {roles.length === 0 ? (
              <div style={{ background: "#111", border: "1px solid #242424", borderRadius: 4, padding: "20px", textAlign: "center", color: "#444", fontSize: 13 }}>
                No roles added yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {roles.map((r) => (
                  <div key={r.role} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: r.isPrimary ? "#e8a04515" : "#111", border: `1px solid ${r.isPrimary ? "#e8a04540" : "#242424"}`, borderRadius: 4 }}>
                    <button onClick={() => setPrimary(r.role)} style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${r.isPrimary ? "#e8a045" : "#444"}`, background: r.isPrimary ? "#e8a045" : "transparent", cursor: "pointer", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: r.isPrimary ? "#f0f0f0" : "#888", fontWeight: r.isPrimary ? 600 : 400 }}>{r.role}</span>
                    {r.isPrimary && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e8a045" }}>Primary</span>}
                    <button onClick={() => removeRole(r.role)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: 2 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Experience</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "workedWithBefore", label: "Worked with before", hint: "You've been on a job together" },
                { key: "hiredBefore", label: "Hired before", hint: "You've booked them for a job" },
              ].map(({ key, label, hint }) => (
                <div key={key} onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#111", border: "1px solid #242424", borderRadius: 4, cursor: "pointer" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${form[key as keyof typeof form] ? "#e8a045" : "#333"}`, background: form[key as keyof typeof form] ? "#e8a045" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form[key as keyof typeof form] && <span style={{ color: "#000", fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Minimum Budget */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>Minimum Budget</p>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>The lowest tier this person will work on. Rates per tier are configured in Settings.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { tier: 1, label: "Tier 1", sub: "Low" },
                { tier: 2, label: "Tier 2", sub: "Indie" },
                { tier: 3, label: "Tier 3", sub: "Mid" },
                { tier: 4, label: "Tier 4", sub: "Comm." },
                { tier: 5, label: "Tier 5", sub: "HW" },
              ].map(({ tier, label, sub }) => {
                const selected = form.minimumTier === tier;
                return (
                  <button key={tier} onClick={() => setForm(f => ({ ...f, minimumTier: f.minimumTier === tier ? null : tier }))}
                    style={{ padding: "10px 8px", borderRadius: 4, border: `1px solid ${selected ? "#e8a045" : "#242424"}`, background: selected ? "#e8a04515" : "#111", color: selected ? "#e8a045" : "#666", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>{sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Union & Notes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <Field label="Union Status">
              <input style={inputStyle} value={form.unionStatus} onChange={e => set("unionStatus", e.target.value)} placeholder="Union, Non-union, SAG..." />
            </Field>
            <Field label="Notes">
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes about this person..." />
            </Field>
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
              {isEdit ? "Save Changes" : "Save Person"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}