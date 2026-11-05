import { useState } from 'react';

export function Field({ label, hint, children, wide }) {
  return (
    <label className={`f${wide ? ' f-wide' : ''}`}>
      <span className="f-label">{label}</span>
      {children}
      {hint && <span className="f-hint">{hint}</span>}
    </label>
  );
}

export function Text({ value, onChange, ...rest }) {
  return <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function Area({ value, onChange, rows = 4, ...rest }) {
  return <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function ConfirmButton({ children, confirmText = 'Yes, delete', onConfirm, disabled }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <button type="button" className="a-btn a-btn-danger-ghost" disabled={disabled} onClick={() => setAsk(true)}>{children}</button>;
  return (
    <span className="confirm">
      <span>Are you sure?</span>
      <button type="button" className="a-btn a-btn-danger" onClick={() => { setAsk(false); onConfirm(); }}>{confirmText}</button>
      <button type="button" className="a-btn a-btn-ghost" onClick={() => setAsk(false)}>Cancel</button>
    </span>
  );
}

// List editor for rows like FAQ items or product details.
export function RowList({ rows, onChange, fields, addLabel, empty }) {
  const set = (i, k, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="rows">
      {rows.length === 0 && <p className="a-muted">{empty}</p>}
      {rows.map((r, i) => (
        <div className="row" key={i}>
          <div className="row-fields">
            {fields.map((f) =>
              f.multiline ? (
                <Area key={f.key} rows={f.rows || 3} value={r[f.key]} onChange={(v) => set(i, f.key, v)} placeholder={f.placeholder} aria-label={f.placeholder} />
              ) : (
                <Text key={f.key} value={r[f.key]} onChange={(v) => set(i, f.key, v)} placeholder={f.placeholder} aria-label={f.placeholder} />
              )
            )}
          </div>
          <div className="row-tools">
            <button type="button" className="a-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button type="button" className="a-icon" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
            <button type="button" className="a-icon" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove">×</button>
          </div>
        </div>
      ))}
      <button type="button" className="a-btn a-btn-ghost" onClick={() => onChange([...rows, Object.fromEntries(fields.map((f) => [f.key, '']))])}>{addLabel}</button>
    </div>
  );
}
