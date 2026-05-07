"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Plus } from "lucide-react";
import CrewForm from "@/components/crew/CrewForm";

const COL_DEFS_CREW = [
  { key: "name",        label: "Name",         hideable: false },
  { key: "type",        label: "Type",         hideable: true  },
  { key: "primaryRole", label: "Primary Role", hideable: true  },
  { key: "otherRoles",  label: "Other Roles",  hideable: true  },
  { key: "tierFloor",   label: "Min. Budget",  hideable: true  },
  { key: "location",    label: "Location",     hideable: true  },
  { key: "experience",  label: "Experience",   hideable: true  },
] as const;

interface ContextMenu {
  x: number;
  y: number;
  member: any;
  showRoles?: boolean;
}

export default function CrewPage() {
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<any | null>(null);
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState("lastName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(COL_DEFS_CREW.map(c => c.key));
    try {
      const saved = localStorage.getItem("cols_crew");
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch {}
    return new Set(COL_DEFS_CREW.map(c => c.key));
  });

  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem("cols_crew", JSON.stringify([...next]));
      return next;
    });
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...crew].sort((a, b) => {
    let aVal = "", bVal = "";
    if (sortKey === "name") { aVal = `${a.firstName} ${a.lastName}`; bVal = `${b.firstName} ${b.lastName}`; }
    else if (sortKey === "primaryRole") { aVal = primaryRole(a) || ""; bVal = primaryRole(b) || ""; }
    else { aVal = String(a[sortKey] ?? ""); bVal = String(b[sortKey] ?? ""); }
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  useEffect(() => {
    fetch("/api/crew")
      .then((r) => r.json())
      .then((data) => {
        setCrew(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  // Close context menu and col menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setColMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async (data: any) => {
    const isEdit = !!data.id;
    const res = await fetch("/api/crew", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (isEdit) {
      setCrew((prev) => prev.map((m) => m.id === result.id ? result : m));
    } else {
      setCrew((prev) => [...prev, result]);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/crew", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCrew((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleHired = async (member: any) => {
    const roles = member.roles?.map((r: any) => ({
      role: r.role?.name,
      isPrimary: r.isPrimary,
    })) || [];
    const res = await fetch("/api/crew", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...member,
        minimumTier: member.tierFloor,
        hiredBefore: !member.hiredBefore,
        roles,
      }),
    });
    const result = await res.json();
    setCrew((prev) => prev.map((m) => m.id === result.id ? result : m));
    setContextMenu(null);
  };

  const handleChangePrimaryRole = async (member: any, roleName: string) => {
    const roles = member.roles?.map((r: any) => ({
      role: r.role?.name,
      isPrimary: r.role?.name === roleName,
    })) || [];
    const res = await fetch("/api/crew", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...member,
        minimumTier: member.tierFloor,
        roles,
      }),
    });
    const result = await res.json();
    setCrew((prev) => prev.map((m) => m.id === result.id ? result : m));
    setContextMenu(null);
  };

  const primaryRole = (member: any) =>
    member.roles?.find((r: any) => r.isPrimary)?.role?.name || null;

  const otherRoles = (member: any) =>
    member.roles?.filter((r: any) => !r.isPrimary).map((r: any) => r.role?.name) || [];

  const allRoles = (member: any) =>
    member.roles?.map((r: any) => r.role?.name).filter(Boolean) || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Crew</h1>
          <p style={{ fontSize: 14, color: "#666" }}>
            {crew.length} {crew.length === 1 ? "person" : "people"} on your roster
          </p>
        </div>
        <button onClick={() => { setEditMember(null); setShowForm(true); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}>
          <Plus size={15} /> Add Person
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "#666", fontSize: 14, textAlign: "center", padding: "48px 0" }}>Loading...</div>
      ) : crew.length === 0 ? (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "64px 32px", textAlign: "center" }}>
          <Users size={32} style={{ color: "#333", margin: "0 auto 16px" }} />
          <p style={{ color: "#555", fontSize: 14 }}>No crew yet — add your first person</p>
        </div>
      ) : (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
          {/* Table toolbar */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px", borderBottom: "1px solid #1e1e1e", position: "relative" }} ref={colMenuRef}>
            <button
              onClick={() => setColMenuOpen(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #2a2a2a", color: colMenuOpen ? "#f0f0f0" : "#555", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#f0f0f0"; }}
              onMouseLeave={e => { if (!colMenuOpen) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; } }}
            >
              Columns
            </button>
            {colMenuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 12, background: "#1e1e1e", border: "1px solid #333", borderRadius: 6, zIndex: 200, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: "6px 0" }}>
                {COL_DEFS_CREW.map(col => (
                  <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", cursor: col.hideable ? "pointer" : "default", opacity: col.hideable ? 1 : 0.4 }}>
                    <input
                      type="checkbox"
                      checked={visibleCols.has(col.key)}
                      disabled={!col.hideable}
                      onChange={() => col.hideable && toggleCol(col.key)}
                      style={{ accentColor: "#e8a045", width: 13, height: 13 }}
                    />
                    <span style={{ fontSize: 13, color: "#ccc" }}>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                {([
                  { label: "Name",         key: "name",        sortKey: "name",        align: "left" },
                  { label: "Type",         key: "type",        sortKey: "type",        align: "left" },
                  { label: "Primary Role", key: "primaryRole", sortKey: "primaryRole", align: "left" },
                  { label: "Other Roles",  key: "otherRoles",  sortKey: null,          align: "left" },
                  { label: "Min. Budget",  key: "tierFloor",   sortKey: "tierFloor",   align: "left" },
                  { label: "Location",     key: "location",    sortKey: "location",    align: "left" },
                  { label: "Experience",   key: "experience",  sortKey: null,          align: "left" },
                ] as const).map(({ label, key, sortKey: sk, align }) => {
                  if (key !== "name" && !visibleCols.has(key)) return null;
                  const active = !!sk && sortKey === sk;
                  return (
                    <th key={key} onClick={() => sk && handleSort(sk)} style={{ textAlign: align, padding: "12px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? "#ccc" : "#555", cursor: sk ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }}>
                      {label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => { setEditMember(member); setShowForm(true); }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, member });
                  }}
                  style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0f0" }}>
                      {member.firstName} {member.lastName}
                    </div>
                  </td>
                  {visibleCols.has("type") && (
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: member.type === "IN_HOUSE" ? "#e8a04520" : "#5b9cf620", color: member.type === "IN_HOUSE" ? "#e8a045" : "#5b9cf6", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {member.type === "IN_HOUSE" ? "In House" : "Freelance"}
                      </span>
                    </td>
                  )}
                  {visibleCols.has("primaryRole") && (
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 13, color: "#e8a045", fontWeight: 500 }}>
                        {primaryRole(member) || "—"}
                      </span>
                    </td>
                  )}
                  {visibleCols.has("otherRoles") && (
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {otherRoles(member).length === 0
                          ? <span style={{ color: "#444", fontSize: 13 }}>—</span>
                          : otherRoles(member).map((r: string) => (
                            <span key={r} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#222", color: "#888" }}>{r}</span>
                          ))}
                      </div>
                    </td>
                  )}
                  {visibleCols.has("tierFloor") && (
                    <td style={{ padding: "14px 20px" }}>
                      {member.tierFloor
                        ? <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", fontFamily: "monospace", background: "#e8a04515", padding: "3px 8px", borderRadius: 4 }}>T{member.tierFloor}</span>
                        : <span style={{ color: "#333", fontSize: 13 }}>—</span>}
                    </td>
                  )}
                  {visibleCols.has("location") && (
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>
                      {member.location || "—"}
                    </td>
                  )}
                  {visibleCols.has("experience") && (
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {member.workedWithBefore && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#5cba7d20", color: "#5cba7d", letterSpacing: "0.06em", textTransform: "uppercase" }}>Worked</span>
                        )}
                        {member.hiredBefore && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#5b9cf620", color: "#5b9cf6", letterSpacing: "0.06em", textTransform: "uppercase" }}>Hired</span>
                        )}
                        {!member.workedWithBefore && !member.hiredBefore && (
                          <span style={{ color: "#333", fontSize: 13 }}>—</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ padding: "10px 20px", borderTop: "1px solid #1e1e1e", background: "#111", fontSize: 12, color: "#444" }}>
            {crew.length} {crew.length === 1 ? "person" : "people"} · {crew.filter(m => m.type === "IN_HOUSE").length} in house · {crew.filter(m => m.type === "FREELANCE").length} freelance
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div ref={contextRef} style={{
          position: "fixed", top: contextMenu.y, left: contextMenu.x,
          background: "#1e1e1e", border: "1px solid #333", borderRadius: 6,
          zIndex: 300, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>
          {/* Edit */}
          <button onClick={() => { setEditMember(contextMenu.member); setShowForm(true); setContextMenu(null); }}
            style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", color: "#f0f0f0", fontSize: 13, cursor: "pointer", display: "block" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            Edit {contextMenu.member.firstName}
          </button>

          {/* Change Primary Role */}
          {allRoles(contextMenu.member).length > 1 && (
            <>
              <div style={{ height: 1, background: "#2a2a2a", margin: "2px 0" }} />
              <div style={{ padding: "6px 0" }}>
                <div style={{ padding: "4px 16px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555" }}>
                  Set Primary Role
                </div>
                {allRoles(contextMenu.member).map((role: string) => {
                  const isPrimary = primaryRole(contextMenu.member) === role;
                  return (
                    <button key={role}
                      onClick={() => handleChangePrimaryRole(contextMenu.member, role)}
                      style={{ width: "100%", textAlign: "left", padding: "8px 16px 8px 28px", background: "none", border: "none", color: isPrimary ? "#e8a045" : "#aaa", fontSize: 13, cursor: isPrimary ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={e => { if (!isPrimary) e.currentTarget.style.background = "#2a2a2a"; }}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      {isPrimary && <span style={{ fontSize: 8 }}>●</span>}
                      {role}
                      {isPrimary && <span style={{ fontSize: 10, color: "#e8a045", marginLeft: "auto" }}>Primary</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Toggle Hired */}
          <div style={{ height: 1, background: "#2a2a2a", margin: "2px 0" }} />
          <button onClick={() => handleToggleHired(contextMenu.member)}
            style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", color: contextMenu.member.hiredBefore ? "#e05252" : "#5cba7d", fontSize: 13, cursor: "pointer", display: "block" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            {contextMenu.member.hiredBefore ? "Unmark as Hired" : "Mark as Hired"}
        </button>
         <div style={{ height: 1, background: "#2a2a2a" }} />
                <button
                style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", color: "#e05252", fontSize: 13, cursor: "pointer", display: "block", fontFamily: "inherit" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
                onClick={() => {
                if (window.confirm(`Delete ${contextMenu.member.firstName} ${contextMenu.member.lastName}? This cannot be undone.`)) {
                    handleDelete(contextMenu.member.id);
                }
                setContextMenu(null);
                }}
                >
                Delete {contextMenu.member.firstName}
         </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <CrewForm
          onClose={() => { setShowForm(false); setEditMember(null); }}
          onSave={handleSave}
          onDelete={editMember ? () => handleDelete(editMember.id) : undefined}
          initialData={editMember}
        />
      )}
    </div>
  );
}