"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Package } from "lucide-react";
import ItemForm from "@/components/inventory/ItemForm";

const COL_DEFS_UNITS = [
  { key: "barcode",       label: "Unit ID",       hideable: false },
  { key: "serialNumber",  label: "Serial #",       hideable: true  },
  { key: "condition",     label: "Condition",      hideable: true  },
  { key: "purchaseDate",  label: "Purchase Date",  hideable: true  },
  { key: "purchasePrice", label: "Purchase Price", hideable: true  },
  { key: "vendor",        label: "Vendor",         hideable: true  },
  { key: "status",        label: "Status",         hideable: true  },
] as const;

const UNIT_STATUS = {
  AVAILABLE:  { color: "#5cba7d", bg: "#5cba7d20", label: "Available" },
  OUT_ON_JOB: { color: "#5b9cf6", bg: "#5b9cf620", label: "Out on Job" },
  IN_REPAIR:  { color: "#e8a045", bg: "#e8a04520", label: "In Repair" },
  RETIRED:    { color: "#666",    bg: "#66666620", label: "Retired" },
} as const;

const UNIT_STATUSES = ["AVAILABLE", "OUT_ON_JOB", "IN_REPAIR", "RETIRED"] as const;

const inputStyle: React.CSSProperties = {
  background: "#1c1c1c", border: "1px solid #2a2a2a", borderRadius: 4,
  color: "#f0f0f0", padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

function MetaItem({ label, value, mono, amber }: { label: string; value: string; mono?: boolean; amber?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: amber ? "#e8a045" : "#888", fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
    </div>
  );
}

const CONDITIONS = ["Mint", "Excellent", "Good", "Fair", "Poor"] as const;

const EMPTY_UNIT_FORM = { serialNumber: "", unitId: "", condition: "", purchaseDate: "", purchasePrice: "", vendor: "", runningHours: "0", status: "AVAILABLE", notes: "" };

export default function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);
  const [unitForm, setUnitForm] = useState({ ...EMPTY_UNIT_FORM });

  const [unitSortKey, setUnitSortKey] = useState("barcode");
  const [unitSortDir, setUnitSortDir] = useState<"asc" | "desc">("asc");

  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(COL_DEFS_UNITS.map(c => c.key));
    try {
      const saved = localStorage.getItem("cols_units");
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch {}
    return new Set(COL_DEFS_UNITS.map(c => c.key));
  });

  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem("cols_units", JSON.stringify([...next]));
      return next;
    });
  };

  const handleUnitSort = (key: string) => {
    if (unitSortKey === key) setUnitSortDir(d => d === "asc" ? "desc" : "asc");
    else { setUnitSortKey(key); setUnitSortDir("asc"); }
  };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; unit: any } | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/inventory/${id}`)
      .then(r => r.json())
      .then(data => { setItem(data); setLoading(false); });
  }, [id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node))
        setContextMenu(null);
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node))
        setColMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openAddUnit = () => {
    setEditUnit(null);
    setUnitForm({ ...EMPTY_UNIT_FORM });
    setShowUnitModal(true);
  };

  const openEditUnit = (unit: any) => {
    setEditUnit(unit);
    setUnitForm({
      serialNumber: unit.serialNumber || "",
      unitId: unit.barcode || "",
      condition: unit.condition || "",
      status: unit.status || "AVAILABLE",
      purchaseDate: unit.purchaseDate ? new Date(unit.purchaseDate).toISOString().slice(0, 10) : "",
      purchasePrice: unit.purchasePrice?.toString() || "",
      vendor: unit.vendor || "",
      runningHours: unit.runningHours?.toString() || "0",
      notes: unit.notes || "",
    });
    setShowUnitModal(true);
    setContextMenu(null);
  };

  const handleSaveUnit = async () => {
    const basePayload = {
      serialNumber: unitForm.serialNumber || null,
      unitId: unitForm.unitId || null,
      condition: unitForm.condition || null,
      purchaseDate: unitForm.purchaseDate || null,
      purchasePrice: unitForm.purchasePrice !== "" ? unitForm.purchasePrice : null,
      vendor: unitForm.vendor || null,
      runningHours: parseFloat(unitForm.runningHours) || 0,
      notes: unitForm.notes || null,
    };

    if (editUnit) {
      const res = await fetch(`/api/inventory/${id}/units`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editUnit.id, ...basePayload, status: unitForm.status }),
      });
      if (!res.ok) { alert("Failed to save unit."); return; }
      const updated = await res.json();
      setItem((prev: any) => ({ ...prev, units: prev.units.map((u: any) => u.id === updated.id ? updated : u) }));
    } else {
      const res = await fetch(`/api/inventory/${id}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload),
      });
      if (!res.ok) { alert("Failed to create unit."); return; }
      const newUnit = await res.json();
      setItem((prev: any) => ({ ...prev, units: [...(prev.units || []), newUnit] }));
    }
    setShowUnitModal(false);
  };

  const handleDeleteUnit = async (unitId: string) => {
    await fetch(`/api/inventory/${id}/units`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId }),
    });
    setItem((prev: any) => ({ ...prev, units: prev.units.filter((u: any) => u.id !== unitId) }));
    setContextMenu(null);
  };

  const handleItemSave = async (data: any) => {
    const res = await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setItem((prev: any) => ({ ...prev, ...result }));
  };

  const handleItemDelete = async () => {
    await fetch("/api/inventory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    router.push("/inventory");
  };

  const setU = (k: string, v: string) => setUnitForm(f => ({ ...f, [k]: v }));

  const fmtMoney = (v: unknown) => v != null ? `$${Number(v).toLocaleString()}` : null;
  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return <div style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "64px 0" }}>Loading...</div>;
  if (!item || item.error) return <div style={{ color: "#e05252", fontSize: 14, textAlign: "center", padding: "64px 0" }}>Item not found.</div>;

  const units: any[] = item.units || [];
  const available = units.filter((u: any) => u.status === "AVAILABLE").length;
  const outCount  = units.filter((u: any) => u.status === "OUT_ON_JOB").length;
  const repairCnt = units.filter((u: any) => u.status === "IN_REPAIR").length;
  const retiredCnt = units.filter((u: any) => u.status === "RETIRED").length;

  const sortedUnits = [...units].sort((a, b) => {
    const aVal = String(a[unitSortKey] ?? "");
    const bVal = String(b[unitSortKey] ?? "");
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
    return unitSortDir === "asc" ? cmp : -cmp;
  });

  const menuBtnStyle: React.CSSProperties = {
    width: "100%", textAlign: "left", padding: "10px 16px", background: "none",
    border: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "block",
  };

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/inventory")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", marginBottom: 24, padding: 0, fontFamily: "inherit" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f0")}
        onMouseLeave={e => (e.currentTarget.style.color = "#555")}
      >
        <ArrowLeft size={14} /> Inventory
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: item.shortName ? 6 : 0 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>{item.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: "#222", color: "#888", letterSpacing: "0.06em" }}>
                {item.preset || "MODEL"}
              </span>
              {!item.active && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: "#e0525215", color: "#e05252", letterSpacing: "0.06em" }}>INACTIVE</span>
              )}
            </div>
            {item.shortName && <p style={{ fontSize: 14, color: "#666", margin: 0 }}>{item.shortName}</p>}
          </div>
          <button
            onClick={() => setShowEditForm(true)}
            style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#ccc", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#f0f0f0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; }}
          >
            Edit
          </button>
        </div>

        {/* Metadata */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px 24px", marginBottom: item.notes ? 16 : 0 }}>
          {item.manufacturer && <MetaItem label="Manufacturer" value={item.manufacturer} />}
          {item.size && <MetaItem label="Size" value={item.size} />}
          {item.standardDayRate != null && <MetaItem label="Day Rate" value={fmtMoney(item.standardDayRate)!} mono amber />}
          {item.replacementCost != null && <MetaItem label="Replacement Cost" value={fmtMoney(item.replacementCost)!} mono />}
          {item.countryOfManufacture && <MetaItem label="Country" value={item.countryOfManufacture} />}
          <MetaItem label="Tracking" value={item.trackedBySerial ? "Serial / Unit" : "Stock Qty"} />
        </div>

        {item.notes && (
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "12px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", margin: "0 0 6px" }}>Notes</p>
            <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>{item.notes}</p>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: "1px solid #242424", marginBottom: 24 }}>
        <button style={{ background: "none", border: "none", cursor: "default", padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: "#e8a045", borderBottom: "2px solid #e8a045", marginBottom: -1 }}>
          Units{item.trackedBySerial ? ` (${units.length})` : ""}
        </button>
      </div>

      {/* Units content */}
      {!item.trackedBySerial ? (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "28px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
            This item uses quantity tracking, not individual serial numbers.{" "}
            <button onClick={() => setShowEditForm(true)} style={{ background: "none", border: "none", color: "#e8a045", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}>
              Enable serial tracking
            </button>{" "}
            in the item settings to start tracking individual units.
          </p>
        </div>
      ) : (
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#555" }}>
              {units.length === 0 ? "No units yet" : [
                available > 0 && `${available} available`,
                outCount  > 0 && `${outCount} out`,
                repairCnt > 0 && `${repairCnt} in repair`,
                retiredCnt > 0 && `${retiredCnt} retired`,
              ].filter(Boolean).join(" · ")}
            </span>
            <button
              onClick={openAddUnit}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
            >
              <Plus size={14} /> Add Unit
            </button>
          </div>

          {units.length === 0 ? (
            <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ color: "#333", display: "flex", justifyContent: "center", marginBottom: 12 }}><Package size={28} /></div>
              <p style={{ color: "#555", fontSize: 13, margin: 0 }}>No units added yet — each physical unit gets its own record</p>
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
                    {COL_DEFS_UNITS.map(col => (
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
                      { label: "Unit ID",        key: "barcode",       align: "left"  },
                      { label: "Serial #",        key: "serialNumber",  align: "left"  },
                      { label: "Condition",       key: "condition",     align: "left"  },
                      { label: "Purchase Date",   key: "purchaseDate",  align: "left"  },
                      { label: "Purchase Price",  key: "purchasePrice", align: "right" },
                      { label: "Vendor",          key: "vendor",        align: "left"  },
                      { label: "Status",          key: "status",        align: "left"  },
                    ] as const).map(({ label, key, align }) => {
                      if (key !== "barcode" && !visibleCols.has(key)) return null;
                      const active = unitSortKey === key;
                      return (
                        <th key={key} onClick={() => handleUnitSort(key)} style={{ textAlign: align, padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? "#ccc" : "#555", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                          {label}{active ? (unitSortDir === "asc" ? " ↑" : " ↓") : ""}
                        </th>
                      );
                    })}
                    {item.trackRunningHours && (
                      <th style={{ textAlign: "right", padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Hours</th>
                    )}
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {sortedUnits.map((unit: any) => {
                    const sc = UNIT_STATUS[unit.status as keyof typeof UNIT_STATUS] ?? UNIT_STATUS.AVAILABLE;
                    return (
                      <tr
                        key={unit.id}
                        onClick={() => openEditUnit(unit)}
                        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, unit }); }}
                        style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#e8a045" }}>
                          {unit.barcode || "—"}
                        </td>
                        {visibleCols.has("serialNumber") && (
                          <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 13, color: unit.serialNumber ? "#f0f0f0" : "#444" }}>
                            {unit.serialNumber || "—"}
                          </td>
                        )}
                        {visibleCols.has("condition") && (
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#888" }}>
                            {unit.condition || "—"}
                          </td>
                        )}
                        {visibleCols.has("purchaseDate") && (
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#666" }}>
                            {fmtDate(unit.purchaseDate)}
                          </td>
                        )}
                        {visibleCols.has("purchasePrice") && (
                          <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "#666" }}>
                            {unit.purchasePrice != null ? `$${Number(unit.purchasePrice).toLocaleString()}` : "—"}
                          </td>
                        )}
                        {visibleCols.has("vendor") && (
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#666" }}>
                            {unit.vendor || "—"}
                          </td>
                        )}
                        {visibleCols.has("status") && (
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase", background: sc.bg, color: sc.color }}>
                              {sc.label}
                            </span>
                          </td>
                        )}
                        {item.trackRunningHours && (
                          <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "#666" }}>
                            {Number(unit.runningHours || 0).toLocaleString()}h
                          </td>
                        )}
                        <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { if (window.confirm("Delete this unit? This cannot be undone.")) handleDeleteUnit(unit.id); }}
                            style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", padding: 4, lineHeight: 0 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#e05252")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#3a3a3a")}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Unit context menu */}
      {contextMenu && (
        <div ref={contextRef} style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, background: "#1e1e1e", border: "1px solid #333", borderRadius: 6, zIndex: 300, minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <button style={{ ...menuBtnStyle, color: "#f0f0f0" }} onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")} onMouseLeave={e => (e.currentTarget.style.background = "none")} onClick={() => openEditUnit(contextMenu.unit)}>
            Edit Unit
          </button>
          <div style={{ height: 1, background: "#2a2a2a" }} />
          <button
            style={{ ...menuBtnStyle, color: "#e05252" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => { if (window.confirm("Delete this unit?")) handleDeleteUnit(contextMenu.unit.id); }}
          >
            Delete Unit
          </button>
        </div>
      )}

      {/* Add / Edit Unit modal */}
      {showUnitModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #242424", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {editUnit ? "Edit Unit" : "Add Unit"}
              </span>
              <button onClick={() => setShowUnitModal(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0 }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Serial Number</label>
                  <input style={inputStyle} value={unitForm.serialNumber} onChange={e => setU("serialNumber", e.target.value)} placeholder="e.g. SN-001234" autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Unit ID</label>
                  <input style={inputStyle} value={unitForm.unitId} onChange={e => setU("unitId", e.target.value)} placeholder="Auto-generated if blank" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Condition</label>
                  <select style={{ ...inputStyle, appearance: "none" }} value={unitForm.condition} onChange={e => setU("condition", e.target.value)}>
                    <option value="">— Select —</option>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Purchase Date</label>
                  <input style={inputStyle} type="date" value={unitForm.purchaseDate} onChange={e => setU("purchaseDate", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Purchase Price ($)</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" value={unitForm.purchasePrice} onChange={e => setU("purchasePrice", e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Vendor / Source</label>
                  <input style={inputStyle} value={unitForm.vendor} onChange={e => setU("vendor", e.target.value)} placeholder="e.g. B&H Photo" />
                </div>
              </div>

              {editUnit && (
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Status</label>
                  <select style={{ ...inputStyle, appearance: "none" }} value={unitForm.status} onChange={e => setU("status", e.target.value)}>
                    {UNIT_STATUSES.map(s => (
                      <option key={s} value={s}>{UNIT_STATUS[s].label}</option>
                    ))}
                  </select>
                </div>
              )}

              {item.trackRunningHours && (
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Running Hours</label>
                  <input style={inputStyle} type="number" min="0" step="0.5" value={unitForm.runningHours} onChange={e => setU("runningHours", e.target.value)} />
                </div>
              )}

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Notes</label>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 64 }} value={unitForm.notes} onChange={e => setU("notes", e.target.value)} placeholder="Any notes about this unit..." />
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #242424", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              {editUnit ? (
                <button
                  onClick={() => { if (window.confirm("Delete this unit?")) { handleDeleteUnit(editUnit.id); setShowUnitModal(false); } }}
                  style={{ background: "none", border: "1px solid #e05252", color: "#e05252", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Delete
                </button>
              ) : <div />}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowUnitModal(false)} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleSaveUnit} style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {editUnit ? "Save Changes" : "Add Unit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit item slide-in */}
      {showEditForm && (
        <ItemForm
          onClose={() => setShowEditForm(false)}
          onSave={handleItemSave}
          onDelete={handleItemDelete}
          initialData={item}
        />
      )}
    </div>
  );
}
