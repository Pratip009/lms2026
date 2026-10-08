import React, { useEffect, useRef, useState } from 'react';

// Small, accessible form controls for the enrollment wizard. Every control
// takes `label`, `value`, `onChange(value)` and an optional `error`.

let uid = 0;
const useId = (prefix) => {
  const ref = useRef(null);
  if (ref.current === null) ref.current = `${prefix}-${++uid}`;
  return ref.current;
};

export function Field({ label, required, hint, error, children, htmlFor }) {
  return (
    <div className={`enr-field ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="enr-label" htmlFor={htmlFor}>
          {label}{required && <span className="enr-req" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="enr-hint">{hint}</div>}
      {error && <div className="enr-error" role="alert">{error}</div>}
    </div>
  );
}

export function Text({ label, value, onChange, required, hint, error, type = 'text', placeholder, autoComplete, inputMode, maxLength }) {
  const id = useId('t');
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={id}>
      <input
        id={id} type={type} value={value || ''} placeholder={placeholder} autoComplete={autoComplete}
        inputMode={inputMode} maxLength={maxLength} aria-invalid={Boolean(error)} aria-required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextArea({ label, value, onChange, required, hint, error, rows = 3 }) {
  const id = useId('ta');
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={id}>
      <textarea id={id} rows={rows} value={value || ''} aria-invalid={Boolean(error)} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Select({ label, value, onChange, options, required, hint, error, placeholder = 'Choose…' }) {
  const id = useId('s');
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={id}>
      <select id={id} value={value || ''} aria-invalid={Boolean(error)} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </Field>
  );
}

export function YesNo({ label, value, onChange, required, error, hint }) {
  const name = useId('yn');
  return (
    <fieldset className={`enr-field enr-yesno ${error ? 'has-error' : ''}`}>
      <legend className="enr-label">{label}{required && <span className="enr-req" aria-hidden="true"> *</span>}</legend>
      <div className="enr-pills">
        {[['yes', 'Yes'], ['no', 'No']].map(([v, l]) => (
          <label key={v} className={`enr-pill ${value === v ? 'on' : ''}`}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            {l}
          </label>
        ))}
      </div>
      {hint && !error && <div className="enr-hint">{hint}</div>}
      {error && <div className="enr-error" role="alert">{error}</div>}
    </fieldset>
  );
}

export function Checks({ label, value = [], onChange, options, hint, error }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className={`enr-field ${error ? 'has-error' : ''}`}>
      <legend className="enr-label">{label}</legend>
      <div className="enr-pills wrap">
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return (
            <label key={v} className={`enr-pill ${value.includes(v) ? 'on' : ''}`}>
              <input type="checkbox" checked={value.includes(v)} onChange={() => toggle(v)} />
              {l}
            </label>
          );
        })}
      </div>
      {hint && !error && <div className="enr-hint">{hint}</div>}
      {error && <div className="enr-error" role="alert">{error}</div>}
    </fieldset>
  );
}

export function Checkbox({ label, checked, onChange, error }) {
  return (
    <div className={`enr-field ${error ? 'has-error' : ''}`}>
      <label className="enr-check">
        <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
      {error && <div className="enr-error" role="alert">{error}</div>}
    </div>
  );
}

export const Row = ({ children }) => <div className="enr-row">{children}</div>;

/**
 * Signature pad — mouse, pen and touch via Pointer Events.
 * Calls onChange(dataUrl) after each stroke, or onChange('') when cleared.
 */
export function SignaturePad({ value, onChange, error }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [empty, setEmpty] = useState(!value);

  // Size the canvas to its CSS box at device pixel ratio for crisp lines.
  useEffect(() => {
    const c = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#13213f';
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (empty) setEmpty(false);
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL('image/png'));
  };
  const clear = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange('');
  };

  return (
    <div className={`enr-field ${error ? 'has-error' : ''}`}>
      <div className="enr-label">Draw your signature <span className="enr-req" aria-hidden="true">*</span></div>
      <div className="enr-sigwrap">
        <canvas
          ref={canvasRef} className="enr-sig" aria-label="Signature area. Draw with your finger, pen or mouse."
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        />
        {empty && <div className="enr-sig-placeholder">Sign here with your finger or mouse</div>}
        <div className="enr-sig-line" />
      </div>
      <button type="button" className="enr-linkbtn" onClick={clear}>Clear signature</button>
      {error && <div className="enr-error" role="alert">{error}</div>}
    </div>
  );
}

export const money = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;
