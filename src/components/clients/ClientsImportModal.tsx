"use client";

import { useState, useRef } from "react";
import { X, Upload, Download } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ParsedRow {
  name: string;
  contact_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  notes?: string;
  [key: string]: string | undefined;
}

interface Props {
  onClose: () => void;
  onImported: (newClients: any[]) => void;
}

const TEMPLATE_HEADERS = [
  "name",
  "contact_name",
  "company",
  "email",
  "phone",
  "billing_address",
  "notes",
];

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.82)",
  zIndex: 400,
  display: "flex",
  justifyContent: "flex-end",
};

const panelStyle: React.CSSProperties = {
  background: "#111",
  borderLeft: "1px solid #1e1e1e",
  width: "100%",
  maxWidth: 700,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
};

export default function ClientsImportModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let parsed: ParsedRow[] = [];
    const parseErrors: string[] = [];

    if (ext === "csv") {
      const text = await file.text();
      const result = Papa.parse<ParsedRow>(text, { header: true, skipEmptyLines: true });
      parsed = result.data;
      if (result.errors.length > 0) {
        parseErrors.push(...result.errors.map(e => `Parse error row ${e.row}: ${e.message}`));
      }
    } else if (ext === "xlsx" || ext === "xls") {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "" });
      parsed = data;
    } else {
      setErrors(["Unsupported file type. Please upload a CSV or Excel file."]);
      return;
    }

    if (parsed.length === 0) {
      setErrors(["No data rows found in file."]);
      return;
    }

    const firstRow = parsed[0];
    if (!("name" in firstRow)) {
      setErrors(["Required column 'name' is missing. Please use the template."]);
      return;
    }

    const validRows = parsed.filter(r => r.name && String(r.name).trim() !== "");
    if (validRows.length === 0) {
      setErrors(["No valid rows found (all rows are missing a name)."]);
      return;
    }

    setRows(validRows);
    setErrors(parseErrors);
    setStep("preview");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    const clients = rows.map(row => ({
      name: row.name,
      contactName: row.contact_name || null,
      company: row.company || null,
      email: row.email || null,
      phone: row.phone || null,
      billingAddress: row.billing_address || null,
      notes: row.notes || null,
    }));

    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients }),
      });
      const result = await res.json();
      setImportResult({ success: result.success, failed: result.failed });
      if (result.success > 0) {
        const cliRes = await fetch("/api/clients");
        const allClients = await cliRes.json();
        if (Array.isArray(allClients)) {
          onImported(allClients.slice(0, result.success));
        }
      }
      setStep("done");
    } catch {
      setErrors(["Import failed. Please try again."]);
    } finally {
      setImporting(false);
    }
  };

  const previewRows = rows.slice(0, 10);

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Import Clients
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* Step: Upload */}
          {step === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <p style={{ fontSize: 14, color: "#888", margin: "0 0 16px", lineHeight: 1.6 }}>
                  Upload a CSV or Excel file to bulk-import clients. Download the template to see the required format.
                </p>
                <button
                  onClick={downloadTemplate}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#ccc", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#f0f0f0"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; }}
                >
                  <Download size={14} /> Download Template
                </button>
              </div>

              {/* Drag and drop area */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#e8a045" : "#2a2a2a"}`,
                  borderRadius: 8,
                  padding: "48px 32px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "#1a1500" : "#161616",
                  transition: "all .15s",
                }}
              >
                <Upload size={28} style={{ color: dragOver ? "#e8a045" : "#333", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontSize: 14, color: "#666", margin: "0 0 4px" }}>
                  {dragOver ? "Drop to upload" : "Click or drag a file here"}
                </p>
                <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Supports CSV, XLSX, XLS</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>

              {errors.length > 0 && (
                <div style={{ background: "#1a0808", border: "1px solid #3a1515", borderRadius: 6, padding: "12px 16px" }}>
                  {errors.map((err, i) => (
                    <p key={i} style={{ fontSize: 13, color: "#e05252", margin: i > 0 ? "4px 0 0" : 0 }}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
                  <span style={{ color: "#e8a045", fontWeight: 700 }}>{rows.length}</span> rows ready to import
                  {rows.length > 10 && <span style={{ color: "#555" }}> (showing first 10)</span>}
                </p>
              </div>

              {errors.length > 0 && (
                <div style={{ background: "#1a0e00", border: "1px solid #3a2a00", borderRadius: 6, padding: "12px 16px" }}>
                  {errors.map((err, i) => (
                    <p key={i} style={{ fontSize: 12, color: "#e8a045", margin: i > 0 ? "4px 0 0" : 0 }}>{err}</p>
                  ))}
                </div>
              )}

              <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                        {["Name", "Company", "Email", "Phone"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #1e1e1e" }}>
                          <td style={{ padding: "10px 16px", fontSize: 13, color: "#f0f0f0", fontWeight: 500 }}>{row.name}</td>
                          <td style={{ padding: "10px 16px", fontSize: 13, color: "#666" }}>{row.company || "—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 13, color: "#666" }}>{row.email || "—"}</td>
                          <td style={{ padding: "10px 16px", fontSize: 13, color: "#666" }}>{row.phone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && importResult && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: importResult.success > 0 ? "#5cba7d22" : "#e0525222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 24 }}>{importResult.success > 0 ? "✓" : "✗"}</span>
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0", margin: "0 0 8px" }}>
                  {importResult.success} {importResult.success === 1 ? "client" : "clients"} imported
                </p>
                {importResult.failed > 0 && (
                  <p style={{ fontSize: 14, color: "#e05252", margin: 0 }}>
                    {importResult.failed} {importResult.failed === 1 ? "row" : "rows"} failed
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          {step === "upload" && (
            <>
              <div />
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>
                Cancel
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={() => { setStep("upload"); setRows([]); setErrors([]); }}
                style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}
              >
                ← Back
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.7 : 1 }}
                >
                  {importing ? "Importing..." : `Import ${rows.length} ${rows.length === 1 ? "Client" : "Clients"}`}
                </button>
              </div>
            </>
          )}
          {step === "done" && (
            <>
              <div />
              <button
                onClick={onClose}
                style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
