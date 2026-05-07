"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Briefcase, Users } from "lucide-react";
import JobForm from "@/components/jobs/JobForm";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", QUOTED: "Quoted", CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress", WRAPPED: "Wrapped", INVOICED: "Invoiced", CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:       { bg: "#66666622", color: "#888" },
  QUOTED:      { bg: "#5b9cf622", color: "#5b9cf6" },
  CONFIRMED:   { bg: "#e8a04522", color: "#e8a045" },
  IN_PROGRESS: { bg: "#5cba7d22", color: "#5cba7d" },
  WRAPPED:     { bg: "#88888822", color: "#888" },
  INVOICED:    { bg: "#a855f722", color: "#a855f7" },
  CANCELLED:   { bg: "#e0525222", color: "#e05252" },
};
const CREW_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#66666620", color: "#888",    label: "Pending" },
  CONFIRMED: { bg: "#5cba7d20", color: "#5cba7d", label: "Confirmed" },
  DECLINED:  { bg: "#e0525220", color: "#e05252", label: "Declined" },
  WRAPPED:   { bg: "#44444420", color: "#666",    label: "Wrapped" },
};

const inputStyle: React.CSSProperties = {
  background: "#1c1c1c", border: "1px solid #2a2a2a", borderRadius: 4,
  color: "#f0f0f0", padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtMoney(v: unknown) {
  return v != null ? `$${Number(v).toLocaleString()}` : "—";
}

function MetaItem({ label, value, mono, amber }: { label: string; value: string; mono?: boolean; amber?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: amber ? "#e8a045" : "#888", fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "48px 32px", textAlign: "center" }}>
      <div style={{ color: "#333", display: "flex", justifyContent: "center", marginBottom: 12 }}>{icon}</div>
      <p style={{ color: "#555", fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gear" | "crew">("gear");
  const [showEditForm, setShowEditForm] = useState(false);

  // Gear modal
  const [showGearModal, setShowGearModal] = useState(false);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [gearSearch, setGearSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [gearQty, setGearQty] = useState("1");
  const [gearDays, setGearDays] = useState("1");

  // Crew modal
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [allCrew, setAllCrew] = useState<any[]>([]);
  const [crewSearch, setCrewSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [agreedRate, setAgreedRate] = useState("");

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.json())
      .then(data => { setJob(data); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (showGearModal && allItems.length === 0) {
      fetch("/api/inventory").then(r => r.json()).then(data => setAllItems(Array.isArray(data) ? data : []));
    }
  }, [showGearModal]);

  useEffect(() => {
    if (showCrewModal && allCrew.length === 0) {
      fetch("/api/crew").then(r => r.json()).then(data => setAllCrew(Array.isArray(data) ? data : []));
    }
  }, [showCrewModal]);

  useEffect(() => {
    if (selectedMember) {
      const primary = selectedMember.roles?.find((r: any) => r.isPrimary);
      setSelectedRoleId(primary?.roleId || selectedMember.roles?.[0]?.roleId || "");
      setAgreedRate(selectedMember.standardDayRate?.toString() || "");
    }
  }, [selectedMember]);

  const handleJobSave = async (data: any) => {
    const res = await fetch("/api/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setJob((prev: any) => ({ ...prev, ...result }));
  };

  const handleJobDelete = async () => {
    await fetch("/api/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: job.id }),
    });
    router.push("/jobs");
  };

  const handleAddGear = async () => {
    if (!selectedItem) return;
    const res = await fetch(`/api/jobs/${id}/gear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: selectedItem.id,
        displayName: selectedItem.name,
        quantityRequested: parseInt(gearQty) || 1,
        dayRate: selectedItem.standardDayRate ?? null,
        days: parseInt(gearDays) || 1,
      }),
    });
    const newLine = await res.json();
    setJob((prev: any) => ({ ...prev, lineItems: [...(prev.lineItems || []), newLine] }));
    setShowGearModal(false);
    setSelectedItem(null);
    setGearQty("1");
    setGearDays("1");
    setGearSearch("");
  };

  const handleRemoveGear = async (lineItemId: number) => {
    await fetch(`/api/jobs/${id}/gear`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineItemId }),
    });
    setJob((prev: any) => ({ ...prev, lineItems: prev.lineItems.filter((li: any) => li.id !== lineItemId) }));
  };

  const handleAddCrew = async () => {
    if (!selectedMember || !selectedRoleId) return;
    const res = await fetch(`/api/jobs/${id}/crew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crewMemberId: selectedMember.id,
        roleId: selectedRoleId,
        agreedRate: agreedRate || null,
        sourceType: selectedMember.type === "IN_HOUSE" ? "IN_HOUSE" : "FREELANCE",
      }),
    });
    const newSlot = await res.json();
    setJob((prev: any) => ({ ...prev, crew: [...(prev.crew || []), newSlot] }));
    setShowCrewModal(false);
    setSelectedMember(null);
    setSelectedRoleId("");
    setAgreedRate("");
    setCrewSearch("");
  };

  const handleRemoveCrew = async (crewSlotId: string) => {
    await fetch(`/api/jobs/${id}/crew`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crewSlotId }),
    });
    setJob((prev: any) => ({ ...prev, crew: prev.crew.filter((c: any) => c.id !== crewSlotId) }));
  };

  const closeGearModal = () => { setShowGearModal(false); setSelectedItem(null); setGearSearch(""); };
  const closeCrewModal = () => { setShowCrewModal(false); setSelectedMember(null); setCrewSearch(""); };

  if (loading) {
    return <div style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "64px 0" }}>Loading...</div>;
  }
  if (!job || job.error) {
    return <div style={{ color: "#e05252", fontSize: 14, textAlign: "center", padding: "64px 0" }}>Job not found.</div>;
  }

  const lineItems: any[] = job.lineItems || [];
  const crew: any[] = job.crew || [];
  const gearTotal = lineItems.reduce((sum, li) => sum + (Number(li.dayRate || 0) * li.days * li.quantityRequested), 0);

  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(gearSearch.toLowerCase()) ||
    (item.manufacturer || "").toLowerCase().includes(gearSearch.toLowerCase())
  );
  const filteredCrew = allCrew.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(crewSearch.toLowerCase())
  );

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/jobs")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", marginBottom: 24, padding: 0, fontFamily: "inherit" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f0")}
        onMouseLeave={e => (e.currentTarget.style.color = "#555")}
      >
        <ArrowLeft size={14} /> Jobs
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>{job.name}</h1>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
              letterSpacing: "0.06em", textTransform: "uppercase",
              background: STATUS_COLORS[job.status]?.bg || "#33333322",
              color: STATUS_COLORS[job.status]?.color || "#888",
            }}>
              {STATUS_LABELS[job.status] || job.status}
            </span>
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

        {/* Metadata pills */}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {job.client && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", marginBottom: 3 }}>Client</div>
              <button
                onClick={() => router.push(`/clients/${job.client.id}`)}
                style={{ background: "none", border: "none", padding: 0, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e8a045")}
                onMouseLeave={e => (e.currentTarget.style.color = "#888")}
              >
                {job.client.name}
              </button>
            </div>
          )}
          {job.jobNumber && <MetaItem label="Job #" value={job.jobNumber} mono />}
          {(job.startDate || job.endDate) && (
            <MetaItem
              label="Dates"
              value={[fmtDate(job.startDate), fmtDate(job.endDate)].filter(Boolean).join(" → ")}
            />
          )}
          {job.shootDays && <MetaItem label="Days" value={`${job.shootDays}d`} mono />}
          {job.location && <MetaItem label="Location" value={job.location} />}
          {job.tier && <MetaItem label="Budget Tier" value={`T${job.tier.tierNumber} — ${job.tier.name}`} amber />}
        </div>

        {/* Notes */}
        {(job.notes || job.internalNotes) && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {job.notes && (
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "12px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", marginBottom: 6, marginTop: 0 }}>Notes</p>
                <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>{job.notes}</p>
              </div>
            )}
            {job.internalNotes && (
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "12px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", marginBottom: 6, marginTop: 0 }}>Internal Notes</p>
                <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>{job.internalNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #242424", marginBottom: 24, display: "flex" }}>
        {(["gear", "crew"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              color: activeTab === tab ? "#e8a045" : "#555",
              borderBottom: `2px solid ${activeTab === tab ? "#e8a045" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {tab === "gear" ? `Gear (${lineItems.length})` : `Crew (${crew.length})`}
          </button>
        ))}
      </div>

      {/* ── Gear Tab ── */}
      {activeTab === "gear" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#555" }}>
              {gearTotal > 0 ? <>Total: <span style={{ fontFamily: "monospace", color: "#e8a045", fontWeight: 700 }}>${gearTotal.toLocaleString()}</span></> : "No gear added yet"}
            </span>
            <button
              onClick={() => setShowGearModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
            >
              <Plus size={14} /> Add Gear
            </button>
          </div>

          {lineItems.length === 0 ? (
            <EmptyState icon={<Briefcase size={28} />} text="No gear on this job yet" />
          ) : (
            <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                    <th style={{ textAlign: "left",   padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Item</th>
                    <th style={{ textAlign: "right",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Qty</th>
                    <th style={{ textAlign: "right",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Days</th>
                    <th style={{ textAlign: "right",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Day Rate</th>
                    <th style={{ textAlign: "right",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Total</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li: any) => (
                    <tr key={li.id} style={{ borderBottom: "1px solid #1e1e1e" }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#f0f0f0", fontWeight: 500 }}>{li.displayName}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "#aaa" }}>{li.quantityRequested}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "#aaa" }}>{li.days}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "#aaa" }}>
                        {li.dayRate ? fmtMoney(li.dayRate) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: li.dayRate ? "#e8a045" : "#444" }}>
                        {li.dayRate ? fmtMoney(Number(li.dayRate) * li.days * li.quantityRequested) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleRemoveGear(li.id)}
                          style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", padding: 4, lineHeight: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#e05252")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#3a3a3a")}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gearTotal > 0 && (
                <div style={{ padding: "10px 16px", borderTop: "1px solid #1e1e1e", background: "#111", display: "flex", justifyContent: "flex-end", fontSize: 13, color: "#666", gap: 8 }}>
                  Total <span style={{ fontFamily: "monospace", color: "#e8a045", fontWeight: 700 }}>${gearTotal.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Crew Tab ── */}
      {activeTab === "crew" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#555" }}>
              {crew.length === 0 ? "No crew added yet" : `${crew.length} ${crew.length === 1 ? "person" : "people"}`}
            </span>
            <button
              onClick={() => setShowCrewModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
            >
              <Plus size={14} /> Add Crew
            </button>
          </div>

          {crew.length === 0 ? (
            <EmptyState icon={<Users size={28} />} text="No crew on this job yet" />
          ) : (
            <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                    <th style={{ textAlign: "left",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Name</th>
                    <th style={{ textAlign: "left",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Role</th>
                    <th style={{ textAlign: "left",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Type</th>
                    <th style={{ textAlign: "left",  padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Status</th>
                    <th style={{ textAlign: "right", padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>Rate</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {crew.map((slot: any) => {
                    const sc = CREW_STATUS[slot.status] || CREW_STATUS.PENDING;
                    return (
                      <tr key={slot.id} style={{ borderBottom: "1px solid #1e1e1e" }}>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#f0f0f0", fontWeight: 500 }}>
                          {slot.crewMember ? `${slot.crewMember.firstName} ${slot.crewMember.lastName}` : <span style={{ color: "#555" }}>Open Slot</span>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#e8a045" }}>{slot.role?.name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em", background: slot.sourceType === "IN_HOUSE" ? "#e8a04520" : "#5b9cf620", color: slot.sourceType === "IN_HOUSE" ? "#e8a045" : "#5b9cf6" }}>
                            {slot.sourceType === "IN_HOUSE" ? "In House" : "Freelance"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em", background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "#aaa" }}>
                          {slot.agreedRate ? fmtMoney(slot.agreedRate) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            onClick={() => handleRemoveCrew(slot.id)}
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

      {/* ── Add Gear Modal ── */}
      {showGearModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, width: "100%", maxWidth: 520, maxHeight: "76vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #242424", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", letterSpacing: "0.1em", textTransform: "uppercase" }}>Add Gear</span>
              <button onClick={closeGearModal} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0 }}><X size={15} /></button>
            </div>

            {selectedItem ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0, padding: 0 }}>
                    <ArrowLeft size={14} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0" }}>{selectedItem.name}</span>
                  {selectedItem.standardDayRate && (
                    <span style={{ fontSize: 12, color: "#555", marginLeft: "auto", fontFamily: "monospace" }}>
                      {fmtMoney(selectedItem.standardDayRate)}/day
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Quantity</label>
                    <input style={inputStyle} type="number" min="1" value={gearQty} onChange={e => setGearQty(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Days</label>
                    <input style={inputStyle} type="number" min="1" value={gearDays} onChange={e => setGearDays(e.target.value)} />
                  </div>
                </div>

                {selectedItem.standardDayRate && (
                  <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#555" }}>Total</span>
                    <span style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "#e8a045" }}>
                      {fmtMoney(Number(selectedItem.standardDayRate) * (parseInt(gearQty) || 1) * (parseInt(gearDays) || 1))}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>Back</button>
                  <button onClick={handleAddGear} style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Add to Job
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
                  <input style={inputStyle} placeholder="Search gear..." value={gearSearch} onChange={e => setGearSearch(e.target.value)} autoFocus />
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {filteredItems.length === 0 ? (
                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>
                      {allItems.length === 0 ? "Loading inventory..." : "No items match"}
                    </div>
                  ) : filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{ width: "100%", textAlign: "left", padding: "12px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #1c1c1c", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#1c1c1c")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 500 }}>{item.name}</div>
                        {item.manufacturer && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{item.manufacturer}</div>}
                      </div>
                      {item.standardDayRate && (
                        <span style={{ fontSize: 12, color: "#666", fontFamily: "monospace", flexShrink: 0, marginLeft: 16 }}>{fmtMoney(item.standardDayRate)}/day</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Add Crew Modal ── */}
      {showCrewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, width: "100%", maxWidth: 520, maxHeight: "76vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #242424", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", letterSpacing: "0.1em", textTransform: "uppercase" }}>Add Crew</span>
              <button onClick={closeCrewModal} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0 }}><X size={15} /></button>
            </div>

            {selectedMember ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => setSelectedMember(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0, padding: 0 }}>
                    <ArrowLeft size={14} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0" }}>{selectedMember.firstName} {selectedMember.lastName}</span>
                </div>

                {selectedMember.roles?.length > 0 ? (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Role on This Job</label>
                    <select
                      style={{ ...inputStyle, appearance: "none" }}
                      value={selectedRoleId}
                      onChange={e => setSelectedRoleId(e.target.value)}
                    >
                      {selectedMember.roles.map((r: any) => (
                        <option key={r.roleId} value={r.roleId}>
                          {r.role?.name}{r.isPrimary ? " (Primary)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, padding: "12px 14px", fontSize: 13, color: "#666" }}>
                    No roles assigned — edit this crew member first to add roles.
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: 6 }}>Agreed Day Rate</label>
                  <input style={inputStyle} type="number" placeholder="e.g. 800" value={agreedRate} onChange={e => setAgreedRate(e.target.value)} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={() => setSelectedMember(null)} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>Back</button>
                  <button
                    onClick={handleAddCrew}
                    disabled={!selectedRoleId}
                    style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: selectedRoleId ? "pointer" : "not-allowed", opacity: selectedRoleId ? 1 : 0.45 }}
                  >
                    Add to Job
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
                  <input style={inputStyle} placeholder="Search crew..." value={crewSearch} onChange={e => setCrewSearch(e.target.value)} autoFocus />
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {filteredCrew.length === 0 ? (
                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>
                      {allCrew.length === 0 ? "Loading crew..." : "No crew match"}
                    </div>
                  ) : filteredCrew.map(member => {
                    const primary = member.roles?.find((r: any) => r.isPrimary)?.role?.name;
                    return (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        style={{ width: "100%", textAlign: "left", padding: "12px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #1c1c1c", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#1c1c1c")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                      >
                        <div>
                          <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 500 }}>{member.firstName} {member.lastName}</div>
                          {primary && <div style={{ fontSize: 11, color: "#e8a045", marginTop: 2 }}>{primary}</div>}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, marginLeft: 16, background: member.type === "IN_HOUSE" ? "#e8a04520" : "#5b9cf620", color: member.type === "IN_HOUSE" ? "#e8a045" : "#5b9cf6" }}>
                          {member.type === "IN_HOUSE" ? "In House" : "Freelance"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit form (slide-in drawer) */}
      {showEditForm && (
        <JobForm
          onClose={() => setShowEditForm(false)}
          onSave={handleJobSave}
          onDelete={handleJobDelete}
          initialData={job}
        />
      )}
    </div>
  );
}
