"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const PRESETS = ["MODEL", "CONTAINER", "PACKAGE"];

interface ItemFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
  initialData?: any;
  initialGroupId?: string;
}

export interface ItemFormData {
  name: string;
  shortName: string;
  shorthand: string;
  size: string;
  narrativeDescription: string;
  purchaseCost: string;
  replacementCost: string;
  standardDayRate: string;
  manufacturer: string;
  countryOfManufacture: string;
  trackRunningHours: boolean;
  hidden: boolean;
  lineMuteDefault: boolean;
  noteMuteDefault: boolean;
  notes: string;
  preset: string;
  trackedBySerial: boolean;
  isUnitContainer: boolean;
  primaryGroupId: string;
  quantityOwned: string;
}

interface FlatGroup {
  id: string;
  label: string;
  depth: number;
}

interface GroupRaw {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}

interface GroupNode extends GroupRaw {
  children: GroupNode[];
}

function buildGroupTree(flat: GroupRaw[]): GroupNode[] {
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

function flattenGroups(nodes: GroupNode[], depth = 0): FlatGroup[] {
  const result: FlatGroup[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, label: node.name, depth });
    result.push(...flattenGroups(node.children, depth + 1));
  }
  return result;
}

const C = {
  bg: '#161616', border: '#242424', accent: '#e8a045',
  text: '#efefef', muted: '#666', dim: '#333', red: '#e05252',
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1c1c1c', border: `1px solid ${C.border}`,
  borderRadius: 3, color: C.text, padding: '8px 10px', fontSize: 14,
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
};

function Field({ label, hint, span, children }: { label: string; hint?: string; span?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: span ? '1/-1' : undefined, marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.muted, marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div onClick={() => onChange(!value)}
        style={{ width: 36, height: 20, borderRadius: 10, background: value ? C.accent : '#2a2a2a', position: 'relative', transition: 'background .15s', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
      </div>
      <span style={{ fontSize: 13, color: C.text }}>{label}</span>
    </label>
  );
}

function Btn({ variant = 'primary', onClick, children }: { variant?: string; onClick?: () => void; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.accent, color: '#000', border: 'none' },
    ghost: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: 'transparent', color: C.red, border: `1px solid ${C.red}` },
  };
  return (
    <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'inherit', ...styles[variant] }}>
      {children}
    </button>
  );
}

export default function ItemForm({ onClose, onSave, onDelete, initialData, initialGroupId }: ItemFormProps) {
  const isEdit = !!initialData;

  const [f, setF] = useState<ItemFormData>({
    name: initialData?.name || '',
    shortName: initialData?.shortName || '',
    shorthand: initialData?.shorthand || '',
    size: initialData?.size || '',
    narrativeDescription: initialData?.narrativeDescription || '',
    purchaseCost: initialData?.purchaseCost?.toString() || '',
    replacementCost: initialData?.replacementCost?.toString() || '',
    standardDayRate: initialData?.standardDayRate?.toString() || '',
    manufacturer: initialData?.manufacturer || '',
    countryOfManufacture: initialData?.countryOfManufacture || '',
    trackRunningHours: initialData?.trackRunningHours || false,
    hidden: initialData?.hidden || false,
    lineMuteDefault: initialData?.lineMuteDefault || false,
    noteMuteDefault: initialData?.noteMuteDefault || false,
    notes: initialData?.notes || '',
    preset: initialData?.preset || 'MODEL',
    trackedBySerial: initialData?.trackedBySerial || false,
    isUnitContainer: initialData?.isUnitContainer || false,
    primaryGroupId: initialData?.primaryGroupId || initialGroupId || '',
    quantityOwned: initialData?.stock?.quantityOwned?.toString() || '1',
  });

  const [groups, setGroups] = useState<FlatGroup[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupParentId, setNewGroupParentId] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data: GroupRaw[]) => {
        if (Array.isArray(data)) {
          const tree = buildGroupTree(data);
          setGroups(flattenGroups(tree));
        }
      })
      .catch(() => {});
  }, []);

  const set = (k: keyof ItemFormData, v: string | boolean) => setF(x => ({ ...x, [k]: v }));

  const save = () => {
    if (!f.name.trim()) return;
    const payload = {
      ...(isEdit ? { id: initialData.id } : {}),
      ...f,
      primaryGroupId: f.primaryGroupId || null,
    };
    onSave(payload);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 660, height: '100vh', background: C.bg, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
            {isEdit ? initialData.name : 'Add Gear'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* Identity */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: 14 }}>Identity</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Item Name *" span>
              <input style={inputStyle} value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sony FX6 Cinema Camera" />
            </Field>
            <Field label="Short Name" hint="Appears in inventory tree">
              <input style={inputStyle} value={f.shortName} onChange={e => set('shortName', e.target.value)} placeholder="e.g. FX6" />
            </Field>
            <Field label="Shorthand" hint="Quick search alias">
              <input style={inputStyle} value={f.shorthand} onChange={e => set('shorthand', e.target.value)} placeholder="e.g. fx6, sony-fx6" />
            </Field>
            <Field label="Size">
              <input style={inputStyle} value={f.size} onChange={e => set('size', e.target.value)} placeholder='e.g. 50ft, 24"' />
            </Field>
            <Field label="Preset">
              <select style={{ ...inputStyle, appearance: 'none' }} value={f.preset} onChange={e => set('preset', e.target.value)}>
                {PRESETS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Group">
              {!creatingGroup ? (
                <select
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={f.primaryGroupId}
                  onChange={e => {
                    if (e.target.value === '__new__') { setCreatingGroup(true); }
                    else set('primaryGroupId', e.target.value);
                  }}
                >
                  <option value="">— No group —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {"  ".repeat(g.depth) + g.label}
                    </option>
                  ))}
                  <option value="__new__">+ Create new group…</option>
                </select>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    style={inputStyle}
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="New group name"
                    autoFocus
                  />
                  <select
                    style={{ ...inputStyle, appearance: 'none' }}
                    value={newGroupParentId}
                    onChange={e => setNewGroupParentId(e.target.value)}
                  >
                    <option value="">— No parent (top level) —</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {"  ".repeat(g.depth) + g.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={!newGroupName.trim() || savingGroup}
                      onClick={async () => {
                        if (!newGroupName.trim()) return;
                        setSavingGroup(true);
                        try {
                          const res = await fetch('/api/groups', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newGroupName.trim(), parentId: newGroupParentId || null }),
                          });
                          const newGroup = await res.json();
                          const gr = await fetch('/api/groups').then(r => r.json());
                          if (Array.isArray(gr)) {
                            const tree = buildGroupTree(gr);
                            setGroups(flattenGroups(tree));
                          }
                          set('primaryGroupId', newGroup.id);
                          setCreatingGroup(false);
                          setNewGroupName('');
                          setNewGroupParentId('');
                        } finally {
                          setSavingGroup(false);
                        }
                      }}
                      style={{ background: '#e8a045', color: '#000', border: 'none', borderRadius: 3, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {savingGroup ? 'Creating…' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreatingGroup(false); setNewGroupName(''); setNewGroupParentId(''); }}
                      style={{ background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </Field>
            <Field label="Narrative Description" span>
              <textarea value={f.narrativeDescription} onChange={e => set('narrativeDescription', e.target.value)}
                placeholder="Full description..." rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
          </div>

          {/* Manufacturer */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', margin: '20px 0 14px' }}>Manufacturer</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Manufacturer">
              <input style={inputStyle} value={f.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Sony" />
            </Field>
            <Field label="Country of Manufacture" hint="Printed on equipment manifest">
              <input style={inputStyle} value={f.countryOfManufacture} onChange={e => set('countryOfManufacture', e.target.value)} placeholder="e.g. Japan" />
            </Field>
          </div>

          {/* Financials */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', margin: '20px 0 14px' }}>Financials</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Replacement Cost ($)" hint="Used for insurance / loss calculations">
              <input style={inputStyle} type="number" value={f.replacementCost} onChange={e => set('replacementCost', e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Day Rate ($)">
              <input style={inputStyle} type="number" value={f.standardDayRate} onChange={e => set('standardDayRate', e.target.value)} placeholder="0.00" />
            </Field>
          </div>

          {/* Tracking */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', margin: '20px 0 14px' }}>Tracking</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle value={f.trackedBySerial} onChange={v => set('trackedBySerial', v)} label="Track by Serial Number — each unit gets its own barcode" />
            {!f.trackedBySerial && (
              <Field label="Quantity Owned">
                <input
                  style={{ ...inputStyle, width: 120 }}
                  type="number"
                  min={0}
                  value={f.quantityOwned}
                  onChange={e => set('quantityOwned', e.target.value)}
                  placeholder="1"
                />
              </Field>
            )}
            <Toggle value={f.isUnitContainer} onChange={v => set('isUnitContainer', v)} label="Unit Container — can contain other units" />
            <Toggle value={f.trackRunningHours} onChange={v => set('trackRunningHours', v)} label="Track Running Hours" />
          </div>

          {/* Display */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', margin: '20px 0 14px' }}>Display Options</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle value={f.hidden} onChange={v => set('hidden', v)} label="Hidden — only visible to users with permission" />
            <Toggle value={f.lineMuteDefault} onChange={v => set('lineMuteDefault', v)} label="Line Mute by Default — charged but not printed on quote" />
            <Toggle value={f.noteMuteDefault} onChange={v => set('noteMuteDefault', v)} label="Note Mute by Default — notes not printed on quote" />
          </div>

          {/* Notes */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', margin: '20px 0 14px' }}>Notes</p>
          <Field label="Notes" hint="Appears as a note when item is placed on a quote">
            <textarea value={f.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this item..." rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          {isEdit ? (
            <Btn variant="danger" onClick={() => { if (window.confirm('Delete this item?')) { onDelete?.(); onClose(); } }}>Delete</Btn>
          ) : <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={save}>{isEdit ? 'Save Changes' : 'Save Item'}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
