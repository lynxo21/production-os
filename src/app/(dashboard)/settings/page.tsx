"use client";

import { useState, useEffect } from "react";
import { Plus, X, Pencil } from "lucide-react";

// ── constants ────────────────────────────────────────────────────────────────

const TIER_SLOTS = [1, 2, 3, 4, 5] as const;

const TIER_COLORS = [
  "#888888", "#5b9cf6", "#5cba7d", "#e8a045",
  "#a855f7", "#e05252", "#14b8a6", "#f59e0b",
];

const TIER_DEFAULTS: Record<number, { name: string; description: string }> = {
  1: { name: "Low Budget",  description: "Student, passion projects, minimal budget" },
  2: { name: "Indie",       description: "Indie films, small commercial, non-profit" },
  3: { name: "Mid-Range",   description: "Regional commercial, mid-tier branded content" },
  4: { name: "Commercial",  description: "National commercial, agency-produced content" },
  5: { name: "Hollywood",   description: "Feature film, major network, premium tier" },
};

// ── shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#1c1c1c", border: "1px solid #2a2a2a", borderRadius: 4,
  color: "#f0f0f0", padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6,
};

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", margin: "0 0 4px" }}>{title}</h2>
      {description && <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{description}</p>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "#3a3a3a", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

// ── Budget Tiers ──────────────────────────────────────────────────────────────

function TierCard({ n, tier, onEdit }: { n: number; tier: any | null; onEdit: (n: number, tier: any | null) => void }) {
  const color = tier?.color || "#333";
  const configured = !!tier;

  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: configured ? color : "#2a2a2a", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: configured ? color : "#3a3a3a", letterSpacing: "0.06em" }}>T{n}</span>
        </div>
        <button
          onClick={() => onEdit(n, tier)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #2a2a2a", borderRadius: 4, color: "#666", fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#f0f0f0"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#666"; }}
        >
          {configured ? <><Pencil size={11} /> Edit</> : <><Plus size={11} /> Configure</>}
        </button>
      </div>

      {configured ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{tier.name}</div>
          {tier.description && (
            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{tier.description}</div>
          )}
          {(tier.budgetMin != null || tier.budgetMax != null) && (
            <div style={{ fontSize: 12, color: "#555", fontFamily: "monospace" }}>
              {tier.budgetMin != null ? `$${Number(tier.budgetMin).toLocaleString()}` : ""}
              {tier.budgetMin != null && tier.budgetMax != null ? " – " : ""}
              {tier.budgetMax != null ? `$${Number(tier.budgetMax).toLocaleString()}` : ""}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 13, color: "#3a3a3a" }}>Not configured</div>
      )}
    </div>
  );
}

function TierModal({
  tierNumber, tier, onClose, onSave, onDelete,
}: {
  tierNumber: number;
  tier: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
}) {
  const isEdit = !!tier;
  const defaults = TIER_DEFAULTS[tierNumber];

  const [form, setForm] = useState({
    name:        tier?.name        || defaults?.name        || "",
    description: tier?.description || defaults?.description || "",
    budgetMin:   tier?.budgetMin   != null ? String(tier.budgetMin)  : "",
    budgetMax:   tier?.budgetMax   != null ? String(tier.budgetMax)  : "",
    color:       tier?.color       || TIER_COLORS[tierNumber - 1] || "#888888",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, tierNumber, id: tier?.id });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #242424" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {isEdit ? `Edit T${tierNumber}` : `Configure T${tierNumber}`}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0 }}><X size={15} /></button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Tier Name *">
            <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder={defaults?.name || `Tier ${tierNumber}`} autoFocus />
          </Field>

          <Field label="Description">
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder={defaults?.description || "Describe when this tier applies..."}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Daily Budget Min ($)" hint="Per-day production budget">
              <input style={inputStyle} type="number" value={form.budgetMin} onChange={e => set("budgetMin", e.target.value)} placeholder="e.g. 50000" />
            </Field>
            <Field label="Daily Budget Max ($)" hint="Per-day production budget">
              <input style={inputStyle} type="number" value={form.budgetMax} onChange={e => set("budgetMax", e.target.value)} placeholder="e.g. 250000" />
            </Field>
          </div>

          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TIER_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", background: c, border: `2px solid ${form.color === c ? "#f0f0f0" : "transparent"}`,
                    cursor: "pointer", outline: "none", padding: 0,
                    boxShadow: form.color === c ? `0 0 0 3px ${c}44` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #242424", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isEdit ? (
            <button
              onClick={() => { if (window.confirm(`Delete T${tierNumber}?`)) onDelete(); }}
              style={{ background: "none", border: "1px solid #e05252", color: "#e05252", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}
            >
              Delete
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleSave} style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {isEdit ? "Save Changes" : "Create Tier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Roles ─────────────────────────────────────────────────────────────────────

function RoleModal({
  role, onClose, onSave, onDelete,
}: {
  role: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
}) {
  const isEdit = !!role;
  const [form, setForm] = useState({
    name:       role?.name       || "",
    department: role?.department || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #242424" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {isEdit ? "Edit Role" : "Add Role"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0 }}><X size={15} /></button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Role Name *">
            <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Director of Photography" autoFocus />
          </Field>
          <Field label="Department">
            <input style={inputStyle} value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Camera, Audio, Production" />
          </Field>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #242424", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isEdit ? (
            <button
              onClick={() => { if (window.confirm(`Delete "${role.name}"?`)) onDelete(); }}
              style={{ background: "none", border: "1px solid #e05252", color: "#e05252", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}
            >
              Delete
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>Cancel</button>
            <button
              onClick={() => { if (!form.name.trim()) return; onSave({ ...form, id: role?.id }); }}
              style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              {isEdit ? "Save Changes" : "Add Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // Tiers state
  const [tiers, setTiers] = useState<any[]>([]);
  const [tierModal, setTierModal] = useState<{ n: number; tier: any | null } | null>(null);

  // Roles state
  const [roles, setRoles] = useState<any[]>([]);
  const [roleModal, setRoleModal] = useState<{ role: any | null } | null>(null);

  // Org settings (job numbering)
  const [orgSettings, setOrgSettings] = useState<any>({ autoJobNumber: false, jobNumberPrefix: "JOB" });
  const [jobNumSaving, setJobNumSaving] = useState(false);
  const [jobNumSaved, setJobNumSaved] = useState(false);

  // Unit ID Format settings
  const [savedUnitIdPrefix, setSavedUnitIdPrefix] = useState<string | null>(null);
  const [unitIdSaved, setUnitIdSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/tiers").then(r => r.json()).then(data => setTiers(Array.isArray(data) ? data : []));
    fetch("/api/settings/roles").then(r => r.json()).then(data => setRoles(Array.isArray(data) ? data : []));
    fetch("/api/settings/org").then(r => r.json()).then(data => {
      if (data && !data.error) {
        setOrgSettings((prev: any) => ({ ...prev, ...data }));
        setSavedUnitIdPrefix(data.unitIdPrefix || null);
      }
    });
  }, []);

  // ── tier handlers ──
  const handleTierSave = async (data: any) => {
    const isEdit = !!data.id;
    const res = await fetch("/api/settings/tiers", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (isEdit) {
      setTiers(prev => prev.map(t => t.id === result.id ? result : t));
    } else {
      setTiers(prev => [...prev, result].sort((a, b) => a.tierNumber - b.tierNumber));
    }
    setTierModal(null);
  };

  const handleTierDelete = async (id: string) => {
    await fetch("/api/settings/tiers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTiers(prev => prev.filter(t => t.id !== id));
    setTierModal(null);
  };

  // ── role handlers ──
  const handleRoleSave = async (data: any) => {
    const isEdit = !!data.id;
    const res = await fetch("/api/settings/roles", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (isEdit) {
      setRoles(prev => prev.map(r => r.id === result.id ? result : r));
    } else {
      setRoles(prev => [...prev, result].sort((a, b) => (a.department || "").localeCompare(b.department || "") || a.name.localeCompare(b.name)));
    }
    setRoleModal(null);
  };

  const handleRoleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/settings/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.error) {
        alert("Cannot delete: this role is assigned to crew members or jobs.");
        return;
      }
      setRoles(prev => prev.filter(r => r.id !== id));
      setRoleModal(null);
    } catch {
      alert("Failed to delete role.");
    }
  };

  // ── org settings handler ──
  const handleSaveOrgSettings = async () => {
    setJobNumSaving(true);
    await fetch("/api/settings/org", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orgSettings),
    });
    setJobNumSaving(false);
    setJobNumSaved(true);
    setTimeout(() => setJobNumSaved(false), 2000);
  };

  // ── Unit ID Format handler ──
  const handleSaveUnitIdSettings = async () => {
    const newPrefix = orgSettings.unitIdPrefix || "UNIT";
    const oldPrefix = savedUnitIdPrefix || "UNIT";
    const prefixChanged = newPrefix !== oldPrefix;

    if (prefixChanged) {
      const confirmed = window.confirm(
        `This will update all existing unit IDs. Change ${oldPrefix}-##### to ${newPrefix}-#####?`
      );
      if (!confirmed) return;
    }

    await fetch("/api/settings/org", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orgSettings),
    });

    if (prefixChanged) {
      await fetch("/api/inventory/units/reprefix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPrefix, newPrefix }),
      });
    }

    setSavedUnitIdPrefix(newPrefix);
    setUnitIdSaved(true);
    setTimeout(() => setUnitIdSaved(false), 2000);
  };

  // Group roles by department
  const rolesByDept = roles.reduce<Record<string, any[]>>((acc, r) => {
    const dept = r.department || "Uncategorized";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(r);
    return acc;
  }, {});

  const prefix = orgSettings.jobNumberPrefix || "JOB";
  const previewNums = ["001", "002", "003"].map(n => `${prefix}-${n}`).join(", ");

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", margin: "0 0 4px" }}>Settings</h1>
        <p style={{ fontSize: 14, color: "#555", margin: 0 }}>Configure your organization's tiers, roles, and defaults</p>
      </div>

      {/* ── Job Numbering ── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Job Numbering"
          description="Configure how job numbers are assigned."
        />
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div
              onClick={() => setOrgSettings((s: any) => ({ ...s, autoJobNumber: !s.autoJobNumber }))}
              style={{ width: 36, height: 20, borderRadius: 10, background: orgSettings.autoJobNumber ? "#e8a045" : "#2a2a2a", position: "relative", transition: "background .15s", cursor: "pointer", flexShrink: 0 }}
            >
              <div style={{ position: "absolute", top: 2, left: orgSettings.autoJobNumber ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 500 }}>Auto-generate job numbers</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Automatically assign sequential numbers when new jobs are created</div>
            </div>
          </label>

          {orgSettings.autoJobNumber && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, paddingLeft: 48 }}>
              <div style={{ width: 160 }}>
                <Field label="Prefix">
                  <input
                    style={inputStyle}
                    value={orgSettings.jobNumberPrefix || "JOB"}
                    onChange={e => setOrgSettings((s: any) => ({ ...s, jobNumberPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") }))}
                    placeholder="JOB"
                    maxLength={8}
                  />
                </Field>
              </div>
              <div style={{ fontSize: 12, color: "#555", paddingBottom: 10 }}>
                Preview: <span style={{ fontFamily: "monospace", color: "#888" }}>{previewNums}</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSaveOrgSettings}
              disabled={jobNumSaving}
              style={{ background: jobNumSaved ? "#5cba7d" : "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "8px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "background .2s" }}
            >
              {jobNumSaved ? "Saved" : jobNumSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Unit ID Format ── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Unit ID Format"
          description="Auto-generated IDs for inventory units."
        />
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
            Auto-generated IDs for inventory units. Format: [PREFIX]-00001
          </p>
          <Field label="Prefix">
            <input
              style={{ ...inputStyle, width: 160 }}
              value={orgSettings.unitIdPrefix || "UNIT"}
              onChange={e => setOrgSettings((s: any) => ({ ...s, unitIdPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") }))}
              placeholder="e.g. AN"
              maxLength={10}
            />
          </Field>
          <div style={{ fontSize: 12, color: "#444", fontFamily: "monospace" }}>
            Preview: {(orgSettings.unitIdPrefix || "UNIT")}-00001, {(orgSettings.unitIdPrefix || "UNIT")}-00002, {(orgSettings.unitIdPrefix || "UNIT")}-00003
          </div>
          {orgSettings.unitIdPrefix && orgSettings.unitIdPrefix !== (savedUnitIdPrefix || "UNIT") && (
            <p style={{ fontSize: 12, color: "#e8a045", margin: 0 }}>
              ⚠ Changing the prefix will update all existing unit IDs for your org.
            </p>
          )}
          <button
            onClick={handleSaveUnitIdSettings}
            style={{ alignSelf: "flex-start", background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            {unitIdSaved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Budget Tiers ── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Budget Tiers"
          description="Budget tiers drive rate resolution for gear and crew. T1 = lowest budget · T5 = highest."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {TIER_SLOTS.map(n => {
            const tier = tiers.find(t => t.tierNumber === n) || null;
            return (
              <TierCard
                key={n}
                n={n}
                tier={tier}
                onEdit={(n, t) => setTierModal({ n, tier: t })}
              />
            );
          })}
        </div>
      </div>

      {/* ── Roles ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <SectionHeader
            title="Roles"
            description="Roles are assigned to crew members and job slots. Crew members can hold multiple roles."
          />
          <button
            onClick={() => setRoleModal({ role: null })}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer", flexShrink: 0, marginTop: 2 }}
          >
            <Plus size={14} /> Add Role
          </button>
        </div>

        {roles.length === 0 ? (
          <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "48px 32px", textAlign: "center" }}>
            <p style={{ color: "#555", fontSize: 13, margin: 0 }}>No roles yet — add your first role to start building your crew structure</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(rolesByDept).sort(([a], [b]) => a.localeCompare(b)).map(([dept, deptRoles]) => (
              <div key={dept}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", margin: "0 0 10px" }}>{dept}</p>
                <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
                  {deptRoles.map((role, i) => (
                    <div
                      key={role.id}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: i < deptRoles.length - 1 ? "1px solid #1e1e1e" : "none", cursor: "pointer" }}
                      onClick={() => setRoleModal({ role })}
                      onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: 14, color: "#f0f0f0", fontWeight: 500 }}>{role.name}</span>
                      <Pencil size={13} style={{ color: "#3a3a3a", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier modal */}
      {tierModal && (
        <TierModal
          tierNumber={tierModal.n}
          tier={tierModal.tier}
          onClose={() => setTierModal(null)}
          onSave={handleTierSave}
          onDelete={() => handleTierDelete(tierModal.tier.id)}
        />
      )}

      {/* Role modal */}
      {roleModal && (
        <RoleModal
          role={roleModal.role}
          onClose={() => setRoleModal(null)}
          onSave={handleRoleSave}
          onDelete={() => handleRoleDelete(roleModal.role.id)}
        />
      )}
    </div>
  );
}
