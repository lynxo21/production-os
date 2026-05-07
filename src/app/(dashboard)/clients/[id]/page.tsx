"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Plus } from "lucide-react";
import ClientForm from "@/components/clients/ClientForm";
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

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "16px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#f0f0f0", fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showNewJobForm, setShowNewJobForm] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then(r => r.json())
      .then(data => { setClient(data); setLoading(false); });
  }, [id]);

  const handleNewJobSave = async (data: any) => {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.id) {
      router.push(`/jobs/${result.id}`);
    }
  };

  const handleClientSave = async (data: any) => {
    const res = await fetch("/api/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setClient((prev: any) => ({ ...prev, ...result }));
  };

  const handleClientDelete = async () => {
    await fetch("/api/clients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: client.id }),
    });
    router.push("/clients");
  };

  if (loading) return <div style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "64px 0" }}>Loading...</div>;
  if (!client || client.error) return <div style={{ color: "#e05252", fontSize: 14, textAlign: "center", padding: "64px 0" }}>Client not found.</div>;

  const jobs: any[] = client.jobs || [];
  const totalJobs   = jobs.length;
  const activeJobs  = jobs.filter(j => j.status === "CONFIRMED" || j.status === "IN_PROGRESS").length;
  const draftJobs   = jobs.filter(j => j.status === "DRAFT").length;
  const doneJobs    = jobs.filter(j => j.status === "WRAPPED" || j.status === "INVOICED").length;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/clients")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", marginBottom: 24, padding: 0, fontFamily: "inherit" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f0")}
        onMouseLeave={e => (e.currentTarget.style.color = "#555")}
      >
        <ArrowLeft size={14} /> Clients
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f0f0f0", margin: "0 0 4px" }}>{client.name}</h1>
          {client.company && <p style={{ fontSize: 14, color: "#666", margin: 0 }}>{client.company}</p>}
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

      {/* Contact info + Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>

        {/* Contact card */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", margin: 0 }}>Contact</p>

          {client.contactName && (
            <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0" }}>{client.contactName}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {client.email && (
              <ContactRow icon={<Mail size={13} />} value={client.email} href={`mailto:${client.email}`} />
            )}
            {client.phone && (
              <ContactRow icon={<Phone size={13} />} value={client.phone} href={`tel:${client.phone}`} />
            )}
            {client.billingAddress && (
              <ContactRow icon={<MapPin size={13} />} value={client.billingAddress} />
            )}
          </div>

          {!client.contactName && !client.email && !client.phone && !client.billingAddress && (
            <p style={{ fontSize: 13, color: "#444", margin: 0 }}>No contact info yet</p>
          )}

          {client.defaultTier && (
            <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", marginBottom: 4, marginTop: 0 }}>Default Budget Tier</p>
              <span style={{ fontSize: 13, color: "#e8a045" }}>T{client.defaultTier.tierNumber} — {client.defaultTier.name}</span>
            </div>
          )}

          {client.notes && (
            <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444", marginBottom: 4, marginTop: 0 }}>Notes</p>
              <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>{client.notes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start" }}>
          <StatCard label="Total Jobs" value={totalJobs} />
          <StatCard label="Active" value={activeJobs} sub="Confirmed or in progress" />
          <StatCard label="Drafts" value={draftJobs} />
          <StatCard label="Completed" value={doneJobs} sub="Wrapped or invoiced" />
        </div>
      </div>

      {/* Jobs */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", margin: 0 }}>
            Jobs ({totalJobs})
          </p>
          <button
            onClick={() => setShowNewJobForm(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#e8a045", color: "#000", border: "none", fontWeight: 700, fontSize: 12, padding: "6px 14px", borderRadius: 4, cursor: "pointer" }}
          >
            <Plus size={13} /> New Job
          </button>
        </div>

        {jobs.length === 0 ? (
          <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ color: "#333", display: "flex", justifyContent: "center", marginBottom: 12 }}><Briefcase size={28} /></div>
            <p style={{ color: "#555", fontSize: 13, margin: 0 }}>No jobs yet for this client</p>
          </div>
        ) : (
          <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                  {["Job", "Status", "Dates", "Days", "Location"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: any) => (
                  <tr
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0f0" }}>{job.name}</div>
                      {job.jobNumber && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{job.jobNumber}</div>}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        background: STATUS_COLORS[job.status]?.bg || "#33333322",
                        color: STATUS_COLORS[job.status]?.color || "#888",
                      }}>
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#666" }}>
                      {job.startDate ? (
                        <span>{fmtDate(job.startDate)}{job.endDate ? ` → ${fmtDate(job.endDate)}` : ""}</span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#666", fontFamily: "monospace" }}>
                      {job.shootDays ? `${job.shootDays}d` : "—"}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#666" }}>
                      {job.location || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #1e1e1e", background: "#111", fontSize: 12, color: "#444", display: "flex", gap: 20 }}>
              <span>{totalJobs} {totalJobs === 1 ? "job" : "jobs"}</span>
              {activeJobs > 0 && <span style={{ color: "#5cba7d" }}>{activeJobs} active</span>}
              {draftJobs  > 0 && <span>{draftJobs} draft</span>}
              {doneJobs   > 0 && <span>{doneJobs} completed</span>}
            </div>
          </div>
        )}
      </div>

      {/* Edit slide-in */}
      {showEditForm && (
        <ClientForm
          onClose={() => setShowEditForm(false)}
          onSave={handleClientSave}
          onDelete={handleClientDelete}
          initialData={client}
        />
      )}

      {/* New job slide-in */}
      {showNewJobForm && (
        <JobForm
          onClose={() => setShowNewJobForm(false)}
          onSave={handleNewJobSave}
          initialData={{ clientId: client.id }}
        />
      )}
    </div>
  );
}

function ContactRow({ icon, value, href }: { icon: React.ReactNode; value: string; href?: string }) {
  const content = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{ color: "#555", flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: href ? "#aaa" : "#888", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{value}</span>
    </div>
  );
  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none" }}
        onMouseEnter={e => (e.currentTarget.querySelector("span:last-child")! as HTMLElement).style.color = "#e8a045"}
        onMouseLeave={e => (e.currentTarget.querySelector("span:last-child")! as HTMLElement).style.color = "#aaa"}
      >
        {content}
      </a>
    );
  }
  return <div>{content}</div>;
}
