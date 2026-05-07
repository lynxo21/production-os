"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ItemForm from "@/components/inventory/ItemForm";

interface ContextMenu {
  x: number;
  y: number;
  item: any;
}

interface Group {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}

function getDescendantIds(groupId: string, allGroups: { id: string; parentId: string | null }[]): string[] {
  const result = [groupId];
  const children = allGroups.filter(g => g.parentId === groupId);
  for (const child of children) result.push(...getDescendantIds(child.id, allGroups));
  return result;
}

function getGroupPath(groupId: string, allGroups: Group[]): Group[] {
  const map = new Map(allGroups.map(g => [g.id, g]));
  const path: Group[] = [];
  let current = map.get(groupId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return path;
}

function InventoryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedGroup = searchParams.get("group");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = selectedGroup
    ? items.filter(i => i.primaryGroupId && getDescendantIds(selectedGroup, groups).includes(i.primaryGroupId))
    : items;

  const sorted = [...filtered].sort((a, b) => {
    const aVal = String(a[sortKey] ?? "");
    const bVal = String(b[sortKey] ?? "");
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGroups(data);
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
    const isEdit = !!data.id && items.some(i => i.id === data.id);
    const res = await fetch("/api/inventory", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (isEdit) {
      setItems((prev) => prev.map((i) => i.id === result.id ? result : i));
    } else {
      setItems((prev) => [result, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/inventory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setContextMenu(null);
  };

  const handleDuplicate = async (item: any) => {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        id: undefined,
        name: `${item.name} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined,
      }),
    });
    const result = await res.json();
    setItems((prev) => [result, ...prev]);
    setContextMenu(null);
  };

  const menuBtn: React.CSSProperties = {
    width: "100%", textAlign: "left", padding: "10px 16px",
    background: "none", border: "none", color: "#f0f0f0",
    fontSize: 13, cursor: "pointer", display: "block",
    fontFamily: "inherit",
  };

  const breadcrumbPath = selectedGroup && groups.length > 0 ? getGroupPath(selectedGroup, groups) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Inventory</h1>
          <p style={{ fontSize: 14, color: "#666" }}>
            {filtered.length} {filtered.length === 1 ? "item" : "items"}{selectedGroup ? " in this group" : " in your gear catalog"}
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          style={{ background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}
        >
          + Add Item
        </button>
      </div>

      {/* Breadcrumb */}
      {selectedGroup && groups.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13, color: "#666" }}>
          <span
            style={{ cursor: "pointer", color: "#888" }}
            onClick={() => router.push("/inventory")}
          >
            All Items
          </span>
          {breadcrumbPath.map(g => (
            <>
              <span key={`sep-${g.id}`} style={{ color: "#333" }}>/</span>
              <span
                key={g.id}
                style={{ cursor: "pointer", color: g.id === selectedGroup ? "#e8a045" : "#888" }}
                onClick={() => router.push(`/inventory?group=${g.id}`)}
              >
                {g.name}
              </span>
            </>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ color: "#666", fontSize: 14, textAlign: "center", padding: "48px 0" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "64px 32px", textAlign: "center" }}>
          <p style={{ color: "#555", fontSize: 14 }}>No gear yet — add your first item</p>
        </div>
      ) : (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                  {([
                    { label: "Name",        key: "name",            align: "left"  },
                    { label: "Category",    key: "preset",          align: "left"  },
                    { label: "Manufacturer",key: "manufacturer",    align: "left"  },
                    { label: "Day Rate",    key: "standardDayRate", align: "right" },
                    { label: "Replacement", key: "replacementCost", align: "right" },
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
                {sorted.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/inventory/${item.id}`)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, item });
                    }}
                    style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0f0" }}>{item.name}</div>
                      {item.shortName && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{item.shortName}</div>}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "#222", color: "#888" }}>
                        {item.preset || "MODEL"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>{item.manufacturer || "—"}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: item.standardDayRate ? "#e8a045" : "#333" }}>
                      {item.standardDayRate ? `$${Number(item.standardDayRate).toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "#666" }}>
                      {item.replacementCost ? `$${Number(item.replacementCost).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 20px", borderTop: "1px solid #1e1e1e", background: "#111", fontSize: 12, color: "#444" }}>
            {sorted.length} {sorted.length === 1 ? "item" : "items"}
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
          <button
            style={menuBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => { setEditItem(contextMenu.item); setShowForm(true); setContextMenu(null); }}
          >
            Edit {contextMenu.item.name}
          </button>

          <div style={{ height: 1, background: "#2a2a2a" }} />

          <button
            style={menuBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => handleDuplicate(contextMenu.item)}
          >
            Duplicate
          </button>

          <div style={{ height: 1, background: "#2a2a2a" }} />

          <button
            style={{ ...menuBtn, color: "#e05252" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => {
              if (window.confirm(`Delete "${contextMenu.item.name}"? This cannot be undone.`)) {
                handleDelete(contextMenu.item.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ItemForm
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
          onDelete={editItem ? () => handleDelete(editItem.id) : undefined}
          initialData={editItem}
          initialGroupId={selectedGroup || undefined}
        />
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryPageInner />
    </Suspense>
  );
}
