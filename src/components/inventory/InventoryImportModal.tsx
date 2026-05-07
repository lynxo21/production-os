"use client";

import { useState, useRef } from "react";
import { X, Upload, Download } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ParsedRow {
  name?: string;
  category?: string;
  short_name?: string;
  shorthand?: string;
  manufacturer?: string;
  day_rate?: string;
  replacement_cost?: string;
  size?: string;
  narrative_description?: string;
  purchase_cost?: string;
  country_of_manufacture?: string;
  notes?: string;
  serial_number?: string;
  unit_id?: string;
  purchase_date?: string;
  purchase_price?: string;
  vendor?: string;
  condition?: string;
  [key: string]: string | undefined;
}

interface ImportResult {
  modelsCreated: number;
  modelsUpdated: number;
  unitsAdded: number;
  rowsSkipped: number;
}

interface Props {
  onClose: () => void;
  onImported: (newItems: any[]) => void;
}

const MODEL_COLS = ["name", "category", "short_name", "shorthand", "manufacturer", "day_rate", "replacement_cost", "size", "narrative_description", "purchase_cost", "country_of_manufacture", "notes"];
const UNIT_COLS  = ["serial_number", "unit_id", "purchase_date", "purchase_price", "vendor", "condition"];

const TEMPLATE_EXAMPLE = [
  MODEL_COLS.concat(UNIT_COLS).join(","),
  "Sony FX6,MODEL,FX6,,Sony,350,5999,,,,,Full-frame cinema camera,SN-FX6-001,AN-00001,2023-06-01,3200,B&H Photo,Excellent",
  "Sony FX6,MODEL,FX6,,Sony,350,5999,,,,,Full-frame cinema camera,SN-FX6-002,AN-00002,2023-06-01,3200,B&H Photo,Excellent",
  "Sigma 24-70 f/2.8,MODEL,,,,200,1200,,,,,,,,,,",
].join("\n");

function hasUnitData(row: ParsedRow): boolean {
  return !!(row.serial_number || row.unit_id || row.purchase_date || row.purchase_price || row.vendor);
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 400, display: "flex", justifyContent: "flex-end",
};
const panelStyle: React.CSSProperties = {
  background: "#111", borderLeft: "1px solid #1e1e1e", width: "100%", maxWidth: 760,
  display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
};

export default function InventoryImportModal({ onClose, onImported }: Props) {
  const [step, setStep]               = useState<"upload" | "preview" | "done">("upload");
  const [rows, setRows]               = useState<ParsedRow[]>([]);
  const [errors, setErrors]           = useState<string[]>([]);
  const [importing, setImporting]     = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_EXAMPLE], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "inventory_template.csv"; a.click();
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
      parseErrors.push(...result.errors.map(e => `Parse error row ${e.row}: ${e.message}`));
    } else if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(new Uint8Array(buf), { type: "array" });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      parsed    = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });
    } else {
      setErrors(["Unsupported file type. Please upload a CSV or Excel file."]); return;
    }

    if (parsed.length === 0) { setErrors(["No data rows found in file."]); return; }

    if (!("name" in parsed[0])) {
      setErrors(["Required column 'name' is missing. Please use the template."]); return;
    }

    const valid = parsed.filter(r => r.name && String(r.name).trim() !== "");
    if (valid.length === 0) { setErrors(["No valid rows found (all rows are missing a name)."]); return; }

    setRows(valid);
    setErrors(parseErrors);
    setStep("preview");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0]; if (file) parseFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors([`Import failed: ${json.error || res.statusText}`]);
        return;
      }
      const result: ImportResult = json;
      setImportResult(result);
      if (result.modelsCreated > 0 || result.modelsUpdated > 0) {
        const invRes = await fetch("/api/inventory");
        const allItems = await invRes.json();
        if (Array.isArray(allItems)) onImported(allItems);
      }
      setStep("done");
    } catch (err) {
      setErrors([`Import failed: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setImporting(false);
    }
  };

  // Group rows by model name for preview
  const grouped: { name: string; rows: ParsedRow[] }[] = [];
  for (const row of rows) {
    const name = String(row.name || "").trim();
    const existing = grouped.find(g => g.name === name);
    if (existing) existing.rows.push(row);
    else grouped.push({ name, rows: [row] });
  }
  const previewGroups = grouped.slice(0, 8);
  const totalModels = grouped.length;
  const totalUnits  = rows.filter(hasUnitData).length;

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e8a045", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Import Inventory
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", lineHeight: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* ── Upload ── */}
          {step === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <p style={{ fontSize: 14, color: "#888", margin: "0 0 8px", lineHeight: 1.6 }}>
                  Upload a CSV or Excel file to bulk-import inventory models and their units.
                  Each row is a model + optional unit. Repeat the model info across rows to add multiple units to the same model.
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

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? "#e8a045" : "#2a2a2a"}`, borderRadius: 8, padding: "48px 32px", textAlign: "center", cursor: "pointer", background: dragOver ? "#1a1500" : "#161616", transition: "all .15s" }}
              >
                <Upload size={28} style={{ color: dragOver ? "#e8a045" : "#333", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontSize: 14, color: "#666", margin: "0 0 4px" }}>{dragOver ? "Drop to upload" : "Click or drag a file here"}</p>
                <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Supports CSV, XLSX, XLS</p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} />
              </div>

              {/* Column reference */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: 6, padding: "14px 16px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", margin: "0 0 10px" }}>Model Columns</p>
                  {MODEL_COLS.map(c => (
                    <div key={c} style={{ fontSize: 12, color: c === "name" ? "#e8a045" : "#555", fontFamily: "monospace", marginBottom: 3 }}>
                      {c}{c === "name" ? " *" : ""}
                    </div>
                  ))}
                </div>
                <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: 6, padding: "14px 16px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", margin: "0 0 10px" }}>Unit Columns <span style={{ color: "#333", fontWeight: 400 }}>(optional)</span></p>
                  {UNIT_COLS.map(c => (
                    <div key={c} style={{ fontSize: 12, color: "#555", fontFamily: "monospace", marginBottom: 3 }}>{c}</div>
                  ))}
                </div>
              </div>

              {errors.length > 0 && (
                <div style={{ background: "#1a0808", border: "1px solid #3a1515", borderRadius: 6, padding: "12px 16px" }}>
                  {errors.map((err, i) => <p key={i} style={{ fontSize: 13, color: "#e05252", margin: i > 0 ? "4px 0 0" : 0 }}>{err}</p>)}
                </div>
              )}
            </div>
          )}

          {/* ── Preview ── */}
          {step === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 20 }}>
                <span style={{ fontSize: 13, color: "#888" }}>
                  <span style={{ color: "#e8a045", fontWeight: 700 }}>{totalModels}</span> {totalModels === 1 ? "model" : "models"}
                </span>
                <span style={{ fontSize: 13, color: "#888" }}>
                  <span style={{ color: "#e8a045", fontWeight: 700 }}>{totalUnits}</span> {totalUnits === 1 ? "unit" : "units"}
                </span>
                {grouped.length > 8 && <span style={{ fontSize: 13, color: "#555" }}>(showing first 8 models)</span>}
              </div>

              {errors.length > 0 && (
                <div style={{ background: "#1a0e00", border: "1px solid #3a2a00", borderRadius: 6, padding: "12px 16px" }}>
                  {errors.map((err, i) => <p key={i} style={{ fontSize: 12, color: "#e8a045", margin: i > 0 ? "4px 0 0" : 0 }}>{err}</p>)}
                </div>
              )}

              <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#111", borderBottom: "1px solid #242424" }}>
                      {["Model", "Category", "Mfr.", "Day Rate", "Serial #", "Unit ID", "Condition"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewGroups.map(group => (
                      group.rows.map((row, ri) => (
                        <tr key={`${group.name}-${ri}`} style={{ borderBottom: "1px solid #1e1e1e", background: ri > 0 ? "#0f0f0f" : "transparent" }}>
                          <td style={{ padding: "9px 14px", fontSize: 13, color: ri === 0 ? "#f0f0f0" : "#444", fontWeight: ri === 0 ? 600 : 400 }}>
                            {ri === 0 ? group.name : "↳"}
                          </td>
                          <td style={{ padding: "9px 14px", fontSize: 12, color: "#555" }}>{ri === 0 ? (row.category || "—") : ""}</td>
                          <td style={{ padding: "9px 14px", fontSize: 12, color: "#555" }}>{ri === 0 ? (row.manufacturer || "—") : ""}</td>
                          <td style={{ padding: "9px 14px", fontSize: 12, color: ri === 0 && row.day_rate ? "#e8a045" : "#333", fontFamily: "monospace" }}>
                            {ri === 0 ? (row.day_rate ? `$${row.day_rate}` : "—") : ""}
                          </td>
                          <td style={{ padding: "9px 14px", fontSize: 12, color: "#666", fontFamily: "monospace" }}>{row.serial_number || "—"}</td>
                          <td style={{ padding: "9px 14px", fontSize: 12, color: "#666", fontFamily: "monospace" }}>{row.unit_id || <span style={{ color: "#333" }}>auto</span>}</td>
                          <td style={{ padding: "9px 14px", fontSize: 12, color: "#555" }}>{hasUnitData(row) ? (row.condition || "Excellent") : "—"}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {step === "done" && importResult && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "40px 0", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#5cba7d22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 24, color: "#5cba7d" }}>✓</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {importResult.modelsCreated > 0 && (
                  <p style={{ fontSize: 15, color: "#f0f0f0", margin: 0 }}>
                    <span style={{ fontWeight: 700, color: "#e8a045" }}>{importResult.modelsCreated}</span> {importResult.modelsCreated === 1 ? "model" : "models"} created
                  </p>
                )}
                {importResult.modelsUpdated > 0 && (
                  <p style={{ fontSize: 15, color: "#f0f0f0", margin: 0 }}>
                    <span style={{ fontWeight: 700, color: "#e8a045" }}>{importResult.modelsUpdated}</span> existing {importResult.modelsUpdated === 1 ? "model" : "models"} updated with units
                  </p>
                )}
                {importResult.unitsAdded > 0 && (
                  <p style={{ fontSize: 15, color: "#f0f0f0", margin: 0 }}>
                    <span style={{ fontWeight: 700, color: "#e8a045" }}>{importResult.unitsAdded}</span> {importResult.unitsAdded === 1 ? "unit" : "units"} added
                  </p>
                )}
                {importResult.rowsSkipped > 0 && (
                  <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
                    {importResult.rowsSkipped} {importResult.rowsSkipped === 1 ? "row" : "rows"} skipped (missing name or duplicate serial)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          {step === "upload" && (
            <><div /><button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>Cancel</button></>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => { setStep("upload"); setRows([]); setErrors([]); }} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>← Back</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleImport} disabled={importing} style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.7 : 1 }}>
                  {importing ? "Importing..." : `Import ${totalModels} ${totalModels === 1 ? "Model" : "Models"}${totalUnits > 0 ? ` + ${totalUnits} Units` : ""}`}
                </button>
              </div>
            </>
          )}
          {step === "done" && (
            <><div /><button onClick={onClose} style={{ background: "#e8a045", color: "#000", border: "none", borderRadius: 4, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Done</button></>
          )}
        </div>
      </div>
    </div>
  );
}
