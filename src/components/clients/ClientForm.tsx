"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ClientFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
  initialData?: any;
}

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

export default function ClientForm({ onClose, onSave, onDelete, initialData }: ClientFormProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name || "",
    contactName: initialData?.contactName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    company: initialData?.company || "",
    billingAddress: initialData?.billingAddress || "",
    notes: initialData?.notes || "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, id: initialData?.id });
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete ${initialData?.name}? This cannot be undone.`)) return;
    onDelete?.();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 560, height: "100vh", background: "#161616", borderLeft: "1px solid #242424", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #242424", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8a045" }}>
            {isEdit ? initialData.name : "New Client"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Identity */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Identity</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Client Name *" hint="The name that appears on quotes and documents">
                <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Nike, John Smith" />
              </Field>
              <Field label="Company">
                <input style={inputStyle} value={form.company} onChange={e => set("company", e.target.value)} placeholder="Company or agency name" />
              </Field>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Contact</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Contact Name">
                <input style={inputStyle} value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Primary contact" />
              </Field>
              <Field label="Email">
                <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
              </Field>
              <Field label="Phone">
                <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 555 000 0000" />
              </Field>
            </div>
          </div>

          {/* Billing */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Billing</p>
            <Field label="Billing Address">
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                value={form.billingAddress}
                onChange={e => set("billingAddress", e.target.value)}
                placeholder="Street, City, State, ZIP"
              />
            </Field>
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Notes</p>
            <Field label="Notes">
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Any notes about this client..."
              />
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
              {isEdit ? "Save Changes" : "Save Client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}