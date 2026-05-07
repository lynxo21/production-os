"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Briefcase,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface Group {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}

interface GroupNode extends Group {
  children: GroupNode[];
}

// ── Navigation ─────────────────────────────────────────────────────────────

const navigation = [
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Inventory", href: "/inventory", icon: Box },
  { label: "Crew", href: "/crew", icon: Users },
  { label: "Clients", href: "/clients", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

// ── Build tree ─────────────────────────────────────────────────────────────

function buildTree(flat: Group[]): GroupNode[] {
  const map = new Map<string, GroupNode>();
  flat.forEach((g) => map.set(g.id, { ...g, children: [] }));
  const roots: GroupNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function flattenTree(nodes: GroupNode[]): Group[] {
  const result: Group[] = [];
  const traverse = (n: GroupNode) => {
    result.push({ id: n.id, name: n.name, parentId: n.parentId, sortOrder: n.sortOrder });
    n.children.forEach(traverse);
  };
  nodes.forEach(traverse);
  return result;
}

// ── GroupNode Component ────────────────────────────────────────────────────

function GroupNodeItem({
  node,
  depth,
  selectedId,
  onAddChild,
  draggingId,
  dragOverId,
  setDraggingId,
  setDragOverId,
  onDrop,
  onContextMenu,
  renamingGroupId,
  onRenameKeyDown,
  renameValue,
  setRenameValue,
}: {
  node: GroupNode;
  depth: number;
  selectedId: string | null;
  onAddChild: (parentId: string) => void;
  draggingId: string | null;
  dragOverId: string | null;
  setDraggingId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
  onDrop: (targetId: string) => void;
  onContextMenu: (x: number, y: number, groupId: string, groupName: string) => void;
  renamingGroupId: string | null;
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const isSelected = selectedId === node.id;
  const isDragOver = dragOverId === node.id;
  const isRenaming = renamingGroupId === node.id;

  return (
    <div>
      <div
        draggable={true}
        onDragStart={() => setDraggingId(node.id)}
        onDragOver={(e) => { e.preventDefault(); setDragOverId(node.id); }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={(e) => { e.preventDefault(); onDrop(node.id); setDragOverId(null); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e.clientX, e.clientY, node.id, node.name); }}
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: 12 + depth * 14,
          paddingRight: 8,
          paddingTop: 6,
          paddingBottom: 6,
          cursor: "pointer",
          color: hovered || isSelected ? "#e8a045" : "#888",
          background: isDragOver ? "#e8a04520" : isSelected ? "#e8a04510" : "transparent",
          outline: isDragOver ? "1px solid #e8a04540" : "none",
          outlineOffset: -1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (!isRenaming) router.push(`/inventory?group=${node.id}`); }}
      >
        {/* Collapse toggle */}
        {node.children.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "inherit",
              lineHeight: 0,
              marginRight: 4,
              flexShrink: 0,
            }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}

        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => onRenameKeyDown(e, node.id)}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              background: "#1c1c1c",
              border: "1px solid #e8a04560",
              borderRadius: 4,
              color: "#f0f0f0",
              padding: "2px 6px",
              fontSize: 12,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>
            {node.name}
          </span>
        )}

        {hovered && !isRenaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            style={{
              background: "none",
              border: "none",
              padding: "1px 4px",
              cursor: "pointer",
              color: "#e8a045",
              lineHeight: 0,
              flexShrink: 0,
            }}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {!collapsed && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <GroupNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onAddChild={onAddChild}
              draggingId={draggingId}
              dragOverId={dragOverId}
              setDraggingId={setDraggingId}
              setDragOverId={setDragOverId}
              onDrop={onDrop}
              onContextMenu={onContextMenu}
              renamingGroupId={renamingGroupId}
              onRenameKeyDown={onRenameKeyDown}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inventory Panel inner (needs searchParams) ─────────────────────────────

function InventoryPanelInner({
  groups,
  onAddRoot,
  onAddChild,
  newGroupParentId,
  newGroupName,
  setNewGroupName,
  onSaveNewGroup,
  onCancelNewGroup,
  draggingId,
  dragOverId,
  setDraggingId,
  setDragOverId,
  onDrop,
  onContextMenu,
  renamingGroupId,
  onRenameKeyDown,
  renameValue,
  setRenameValue,
}: {
  groups: GroupNode[];
  onAddRoot: () => void;
  onAddChild: (parentId: string) => void;
  newGroupParentId: string | null | undefined;
  newGroupName: string;
  setNewGroupName: (v: string) => void;
  onSaveNewGroup: () => void;
  onCancelNewGroup: () => void;
  draggingId: string | null;
  dragOverId: string | null;
  setDraggingId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
  onDrop: (targetId: string) => void;
  onContextMenu: (x: number, y: number, groupId: string, groupName: string) => void;
  renamingGroupId: string | null;
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
}) {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("group");
  const router = useRouter();
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (newGroupParentId !== undefined && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [newGroupParentId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 12px 10px",
          borderBottom: "1px solid #1e1e1e",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#555",
          }}
        >
          Groups
        </span>
        <button
          onClick={onAddRoot}
          style={{
            background: "none",
            border: "none",
            padding: "2px 6px",
            cursor: "pointer",
            color: "#e8a045",
            lineHeight: 0,
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* All Items */}
      <button
        onClick={() => router.push("/inventory")}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 14px",
          background: !selectedId ? "#e8a04510" : "transparent",
          border: "none",
          borderBottom: "1px solid #1a1a1a",
          color: !selectedId ? "#e8a045" : "#888",
          fontSize: 13,
          fontWeight: !selectedId ? 600 : 400,
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
          fontFamily: "inherit",
        }}
      >
        All Items
      </button>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* New root group input */}
        {newGroupParentId === null && (
          <div style={{ padding: "6px 10px" }}>
            <input
              ref={newInputRef}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveNewGroup();
                if (e.key === "Escape") onCancelNewGroup();
              }}
              placeholder="Group name…"
              style={{
                width: "100%",
                background: "#1c1c1c",
                border: "1px solid #e8a04560",
                borderRadius: 4,
                color: "#f0f0f0",
                padding: "5px 8px",
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {groups.map((node) => (
          <div key={node.id}>
            <GroupNodeItem
              node={node}
              depth={0}
              selectedId={selectedId}
              onAddChild={onAddChild}
              draggingId={draggingId}
              dragOverId={dragOverId}
              setDraggingId={setDraggingId}
              setDragOverId={setDragOverId}
              onDrop={onDrop}
              onContextMenu={onContextMenu}
              renamingGroupId={renamingGroupId}
              onRenameKeyDown={onRenameKeyDown}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
            />
            {/* New child group input */}
            {newGroupParentId === node.id && (
              <div style={{ padding: "4px 10px 4px", paddingLeft: 12 + 14 }}>
                <input
                  ref={newInputRef}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveNewGroup();
                    if (e.key === "Escape") onCancelNewGroup();
                  }}
                  placeholder="Group name…"
                  style={{
                    width: "100%",
                    background: "#1c1c1c",
                    border: "1px solid #e8a04560",
                    borderRadius: 4,
                    color: "#f0f0f0",
                    padding: "5px 8px",
                    fontSize: 12,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inventory Panel (with Suspense wrapper) ────────────────────────────────

function InventoryPanel({
  groups,
  onAddRoot,
  onAddChild,
  newGroupParentId,
  newGroupName,
  setNewGroupName,
  onSaveNewGroup,
  onCancelNewGroup,
  draggingId,
  dragOverId,
  setDraggingId,
  setDragOverId,
  onDrop,
  onContextMenu,
  renamingGroupId,
  onRenameKeyDown,
  renameValue,
  setRenameValue,
}: {
  groups: GroupNode[];
  onAddRoot: () => void;
  onAddChild: (parentId: string) => void;
  newGroupParentId: string | null | undefined;
  newGroupName: string;
  setNewGroupName: (v: string) => void;
  onSaveNewGroup: () => void;
  onCancelNewGroup: () => void;
  draggingId: string | null;
  dragOverId: string | null;
  setDraggingId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
  onDrop: (targetId: string) => void;
  onContextMenu: (x: number, y: number, groupId: string, groupName: string) => void;
  renamingGroupId: string | null;
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
}) {
  return (
    <Suspense fallback={null}>
      <InventoryPanelInner
        groups={groups}
        onAddRoot={onAddRoot}
        onAddChild={onAddChild}
        newGroupParentId={newGroupParentId}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        onSaveNewGroup={onSaveNewGroup}
        onCancelNewGroup={onCancelNewGroup}
        draggingId={draggingId}
        dragOverId={dragOverId}
        setDraggingId={setDraggingId}
        setDragOverId={setDragOverId}
        onDrop={onDrop}
        onContextMenu={onContextMenu}
        renamingGroupId={renamingGroupId}
        onRenameKeyDown={onRenameKeyDown}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
      />
    </Suspense>
  );
}

// ── AppShell ───────────────────────────────────────────────────────────────

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Groups state
  const [groups, setGroups] = useState<GroupNode[]>([]);
  const [newGroupParentId, setNewGroupParentId] = useState<string | null | undefined>(undefined);
  const [newGroupName, setNewGroupName] = useState("");

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Context menu state
  const [groupContextMenu, setGroupContextMenu] = useState<{
    x: number;
    y: number;
    groupId: string;
    groupName: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Rename state
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const isInventory = pathname.startsWith("/inventory");

  // Load user email
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  // Load groups when on inventory route
  useEffect(() => {
    if (!isInventory) return;
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data: Group[]) => {
        if (Array.isArray(data)) setGroups(buildTree(data));
      })
      .catch(() => {});
  }, [isInventory]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setGroupContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddRoot = useCallback(() => {
    setNewGroupParentId(null);
    setNewGroupName("");
  }, []);

  const handleAddChild = useCallback((parentId: string) => {
    setNewGroupParentId(parentId);
    setNewGroupName("");
  }, []);

  const handleCancelNewGroup = useCallback(() => {
    setNewGroupParentId(undefined);
    setNewGroupName("");
  }, []);

  const handleSaveNewGroup = useCallback(async () => {
    const name = newGroupName.trim();
    if (!name) {
      handleCancelNewGroup();
      return;
    }
    const parentId = newGroupParentId === null ? null : newGroupParentId;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId, sortOrder: 0 }),
      });
      const created: Group = await res.json();
      setGroups((prev) => buildTree([...flattenTree(prev), created]));
    } catch {}
    setNewGroupParentId(undefined);
    setNewGroupName("");
  }, [newGroupName, newGroupParentId, handleCancelNewGroup]);

  const handleDrop = useCallback(async (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }
    const dragId = draggingId;
    setDraggingId(null);
    setGroups((prev) => {
      const flat = flattenTree(prev);
      return buildTree(flat.map((g) => g.id === dragId ? { ...g, parentId: targetId } : g));
    });
    try {
      await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dragId, parentId: targetId }),
      });
    } catch {}
  }, [draggingId]);

  const handleGroupContextMenu = useCallback((x: number, y: number, groupId: string, groupName: string) => {
    setGroupContextMenu({ x, y, groupId, groupName });
  }, []);

  const handleRenameKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
    if (e.key === "Enter") {
      const name = renameValue.trim();
      if (name) {
        setGroups((prev) => {
          const flat = flattenTree(prev);
          return buildTree(flat.map((g) => g.id === groupId ? { ...g, name } : g));
        });
        try {
          await fetch("/api/groups", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: groupId, name }),
          });
        } catch {}
      }
      setRenamingGroupId(null);
    } else if (e.key === "Escape") {
      setRenamingGroupId(null);
    }
  }, [renameValue]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    setGroups((prev) => {
      const flat = flattenTree(prev);
      return buildTree(flat.filter((g) => g.id !== groupId));
    });
    try {
      await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: groupId }),
      });
    } catch {}
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuBtnStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "10px 16px",
    background: "none",
    border: "none",
    color: "#f0f0f0",
    fontSize: 13,
    cursor: "pointer",
    display: "block",
    fontFamily: "inherit",
  };

  const sidebarWidth = expanded ? 220 : 48;
  const contentMarginLeft = isInventory ? 268 : 48;

  return (
    <>
      {/* Sidebar */}
      <div
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: sidebarWidth,
          background: "#0d0d0d",
          borderRight: "1px solid #1e1e1e",
          zIndex: 50,
          overflow: "hidden",
          transition: "width 0.18s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            paddingLeft: 14,
            borderBottom: "1px solid #1e1e1e",
            flexShrink: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? (
            <>
              <span
                style={{
                  fontSize: 13,
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
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#444",
                  marginLeft: 5,
                }}
              >
                OS
              </span>
            </>
          ) : (
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#e8a045",
                letterSpacing: "0.05em",
              }}
            >
              P
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 14px",
                  gap: 12,
                  textDecoration: "none",
                  color: active ? "#e8a045" : "#888",
                  background: active ? "#e8a04510" : "transparent",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  borderLeft: active ? "2px solid #e8a045" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLAnchorElement).style.color = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLAnchorElement).style.color = "#888";
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    opacity: expanded ? 1 : 0,
                    transition: "opacity 0.12s",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #1e1e1e",
            padding: "10px 0",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {expanded && userEmail && (
            <p
              style={{
                fontSize: 11,
                color: "#555",
                padding: "0 14px 6px",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </p>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 14px",
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              width: "100%",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#555";
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: 13,
                opacity: expanded ? 1 : 0,
                transition: "opacity 0.12s",
              }}
            >
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Inventory tree panel */}
      {isInventory && (
        <div
          style={{
            position: "fixed",
            left: 48,
            top: 0,
            height: "100vh",
            width: 220,
            background: "#111",
            borderRight: "1px solid #1e1e1e",
            zIndex: 40,
            overflow: "hidden",
          }}
        >
          <InventoryPanel
            groups={groups}
            onAddRoot={handleAddRoot}
            onAddChild={handleAddChild}
            newGroupParentId={newGroupParentId}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            onSaveNewGroup={handleSaveNewGroup}
            onCancelNewGroup={handleCancelNewGroup}
            draggingId={draggingId}
            dragOverId={dragOverId}
            setDraggingId={setDraggingId}
            setDragOverId={setDragOverId}
            onDrop={handleDrop}
            onContextMenu={handleGroupContextMenu}
            renamingGroupId={renamingGroupId}
            onRenameKeyDown={handleRenameKeyDown}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
          />
        </div>
      )}

      {/* Group context menu */}
      {groupContextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            top: groupContextMenu.y,
            left: groupContextMenu.x,
            background: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: 6,
            zIndex: 300,
            minWidth: 180,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          <button
            style={menuBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            onClick={() => {
              setRenameValue(groupContextMenu.groupName);
              setRenamingGroupId(groupContextMenu.groupId);
              setGroupContextMenu(null);
            }}
          >
            Rename
          </button>
          <div style={{ height: 1, background: "#2a2a2a" }} />
          <button
            style={{ ...menuBtnStyle, color: "#e05252" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            onClick={() => {
              const name = groupContextMenu.groupName;
              const id = groupContextMenu.groupId;
              setGroupContextMenu(null);
              if (window.confirm(`Delete group "${name}"?`)) {
                handleDeleteGroup(id);
              }
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Content area */}
      <div
        style={{
          marginLeft: contentMarginLeft,
          flex: 1,
          minWidth: 0,
          padding: 32,
        }}
      >
        {children}
      </div>
    </>
  );
}
