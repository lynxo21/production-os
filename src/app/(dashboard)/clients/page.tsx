"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import ClientForm from "@/components/clients/ClientForm";
import ClientsImportModal from "@/components/clients/ClientsImportModal";

interface ContextMenu {
  x: number;
  y: number;
  client: any;
}

export default function ClientsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editClient, setEditClient] = useState<any | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...clients].sort((a, b) => {
    const aVal = String(a[sortKey] ?? "");
    const bVal = String(b[sortKey] ?? "");
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(data => {
        setClients(Array.isArray(data) ? data : []);
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
    const res = await fetch("/api/clients", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (isEdit) {
      setClients(prev => prev.map(c => c.id === result.id ? result : c));
    } else {
      setClients(prev => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/clients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setClients(prev => prev.filter(c => c.id !== id));
    setContextMenu(null);
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Clients</h1>
          <p style={{ fontSize: 14, color: "#666" }}>
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowImport(true)}
            style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#ccc", fontWeight: 600, fontSize: 13, padding: "10px 18px", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#f0f0f0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; }}
          >
            Import
          </button>
          <button
            onClick={() => { setEditClient(null); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}
          >
            <Plus size={15} /> New Client
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: "#666", fontSize: 14, textAlign: "center", padding: "48px 0" }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "64px 32px", textAlign: "center" }}>
          <FileText size={32} style={{ color: "#333", margin: "0 auto 16px" }} />
          <p style={{ color: "#555", fontSize: 14 }}>No clients yet — add your first client</p>
        </div>
      ) : (
        <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                {([
                  { label: "Client",  key: "name"        },
                  { label: "Company", key: "company"     },
                  { label: "Contact", key: "contactName" },
                  { label: "Email",   key: "email"       },
                  { label: "Phone",   key: "phone"       },
                ] as const).map(({ label, key }) => {
                  const active = sortKey === key;
                  return (
                    <th key={key} onClick={() => handleSort(key)} style={{ textAlign: "left", padding: "12px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? "#ccc" : "#555", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                      {label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map(client => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, client }); }}
                  style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0f0" }}>{client.name}</div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>{client.company || "—"}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>{client.contactName || "—"}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>{client.email || "—"}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#666" }}>{client.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 20px", borderTop: "1px solid #1e1e1e", background: "#111", fontSize: 12, color: "#444" }}>
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div ref={contextRef} style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, background: "#1e1e1e", border: "1px solid #333", borderRadius: 6, zIndex: 300, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <button
            style={menuBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => { setEditClient(contextMenu.client); setShowForm(true); setContextMenu(null); }}
          >
            Edit {contextMenu.client.name}
          </button>
          <div style={{ height: 1, background: "#2a2a2a" }} />
          <button
            style={{ ...menuBtn, color: "#e05252" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
            onClick={() => {
              if (window.confirm(`Delete "${contextMenu.client.name}"? This cannot be undone.`)) {
                handleDelete(contextMenu.client.id);
              }
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ClientsImportModal
          onClose={() => setShowImport(false)}
          onImported={(newClients) => setClients(prev => [...newClients, ...prev])}
        />
      )}

      {/* Form */}
      {showForm && (
        <ClientForm
          onClose={() => { setShowForm(false); setEditClient(null); }}
          onSave={handleSave}
          onDelete={editClient ? () => handleDelete(editClient.id) : undefined}
          initialData={editClient}
        />
      )}
    </div>
  );
}