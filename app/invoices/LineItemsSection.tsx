"use client";

import { useState } from "react";

export type LineItemRowData = {
  description: string;
  line_date: string;
  qty: string;
  price: string;
};

const EMPTY_ROW: LineItemRowData = { description: "", line_date: "", qty: "1", price: "" };

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function rowTotal(row: LineItemRowData) {
  const qty = row.qty === "" ? 1 : Number(row.qty);
  const price = row.price === "" ? 0 : Number(row.price);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
  return qty * price;
}

function makeRows(initial: LineItemRowData[] | undefined, minRows: number) {
  const base = initial && initial.length ? [...initial] : [];
  while (base.length < minRows) base.push({ ...EMPTY_ROW });
  return base;
}

function TrashIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 7h16M9 7V4h6v3m-8 0 1 13h10l1-13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Appends a preset as its own new line rather than replacing the field --
 *  lets one row cover two bundled tours sharing a single date/price (e.g.
 *  "1100 MLB Yankees..." + "1101 MLB Yankees..." on one invoice line) by
 *  picking two presets in a row instead of only ever replacing the field.
 *  Leaves a trailing newline after the pick so the field is primed for
 *  another line -- without it, currentLineOf() on refocus would treat the
 *  whole just-picked line as an in-progress search, matching nothing and
 *  hiding the dropdown entirely (the actual bug: picking a first preset
 *  worked, but the list never reappeared to pick a second one). The
 *  trailing newline is invisible in the saved data since parseLineItems
 *  already trims the description before storing it. */
function appendDescriptionLine(current: string, addition: string) {
  const trimmed = current.replace(/\n+$/, "");
  return trimmed ? `${trimmed}\n${addition}\n` : `${addition}\n`;
}

/** The text after the last newline -- what the user is actively typing for
 *  a new line, used to filter the preset dropdown once earlier lines are
 *  already committed (filtering against the whole multi-line value would
 *  never match anything past the first line). */
function currentLineOf(value: string) {
  const lastBreak = value.lastIndexOf("\n");
  return lastBreak === -1 ? value : value.slice(lastBreak + 1);
}

/**
 * Custom dropdown for the description field, replacing native HTML
 * <datalist> -- iOS Safari doesn't render datalist as an actual dropdown,
 * it shows a horizontal row of suggestion chips above the keyboard
 * (easy to miss, doesn't look tappable). This renders a real listbox
 * that behaves the same on every device.
 *
 * A <textarea> (not <input>) so one row can hold more than one description
 * line -- e.g. two tours booked the same day sharing one date/price/total.
 * Picking a preset appends a new line instead of replacing the field, so
 * multiple presets can be combined onto one row.
 */
function DescriptionField({
  name,
  onChange,
  options,
  value,
}: {
  name: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const currentLine = currentLineOf(value).trim();
  const filtered = currentLine
    ? options.filter((opt) => opt.toLowerCase().includes(currentLine.toLowerCase()))
    : options;

  return (
    <div style={{ position: "relative" }}>
      <textarea
        autoComplete="off"
        name={name}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Description"
        rows={2}
        style={{ ...inputStyle, resize: "vertical" }}
        value={value}
      />
      {open && filtered.length > 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 24px rgb(58 31 46 / 15%)",
            left: 0,
            maxHeight: 220,
            overflowY: "auto",
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            zIndex: 50,
          }}
        >
          {filtered.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(appendDescriptionLine(value, opt));
                setOpen(false);
              }}
              style={{
                cursor: "pointer",
                fontSize: 14,
                padding: "10px 12px",
                whiteSpace: "pre-line",
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RowGroup({
  title,
  prefix,
  rows,
  setRows,
  descriptionOptions,
}: {
  title: string;
  prefix: "svc" | "exp";
  rows: LineItemRowData[];
  setRows: React.Dispatch<React.SetStateAction<LineItemRowData[]>>;
  descriptionOptions?: string[];
}) {
  function updateRow(index: number, patch: Partial<LineItemRowData>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }
  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <input name={`${prefix}_count`} type="hidden" value={rows.length} />
      {rows.map((row, i) => (
        <div key={i} style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              display: "flex",
              flex: 1,
              flexWrap: "wrap",
              gap: 10,
              padding: 14,
            }}
          >
            <label className="grid" style={{ flex: "1 1 130px", gap: 4, minWidth: 0 }}>
              <span className="muted" style={{ fontSize: 13 }}>Date</span>
              <input
                name={`${prefix}_date_${i}`}
                onChange={(e) => updateRow(i, { line_date: e.target.value })}
                style={{ ...inputStyle, minWidth: 0 }}
                type="date"
                value={row.line_date}
              />
            </label>
            <label className="grid" style={{ flex: "4 1 240px", gap: 4, minWidth: 0 }}>
              <span className="muted" style={{ fontSize: 13 }}>Description</span>
              {descriptionOptions?.length ? (
                <DescriptionField
                  name={`${prefix}_desc_${i}`}
                  onChange={(value) => updateRow(i, { description: value })}
                  options={descriptionOptions}
                  value={row.description}
                />
              ) : (
                <textarea
                  name={`${prefix}_desc_${i}`}
                  onChange={(e) => updateRow(i, { description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  style={{ ...inputStyle, minWidth: 0, resize: "vertical" }}
                  value={row.description}
                />
              )}
            </label>
            <label className="grid" style={{ flex: "0 1 70px", gap: 4, minWidth: 0 }}>
              <span className="muted" style={{ fontSize: 13 }}>Hours</span>
              <input
                name={`${prefix}_qty_${i}`}
                onChange={(e) => updateRow(i, { qty: e.target.value })}
                step="0.01"
                style={{ ...inputStyle, minWidth: 0 }}
                type="number"
                value={row.qty}
              />
            </label>
            <label className="grid" style={{ flex: "0 1 95px", gap: 4, minWidth: 0 }}>
              <span className="muted" style={{ fontSize: 13 }}>Rate</span>
              <div style={{ position: "relative" }}>
                <span
                  className="muted"
                  style={{ left: 10, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
                >
                  $
                </span>
                <input
                  name={`${prefix}_price_${i}`}
                  onBlur={(e) => {
                    if (e.target.value !== "") updateRow(i, { price: Number(e.target.value).toFixed(2) });
                  }}
                  onChange={(e) => updateRow(i, { price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  style={{ ...inputStyle, minWidth: 0, paddingLeft: 20 }}
                  type="number"
                  value={row.price}
                />
              </div>
            </label>
            <div className="grid" style={{ flex: "0 1 90px", gap: 4, minWidth: 0 }}>
              <span className="muted" style={{ fontSize: 13 }}>Total</span>
              <div style={{ ...inputStyle, background: "var(--accent-soft)", fontWeight: 700 }}>
                {money(rowTotal(row))}
              </div>
            </div>
          </div>
          <button
            aria-label="Remove row"
            className="button secondary"
            onClick={() => removeRow(i)}
            style={{ color: "var(--danger)", flexShrink: 0, padding: 10 }}
            type="button"
          >
            <TrashIcon />
          </button>
        </div>
      ))}
      <button className="button secondary" onClick={addRow} style={{ justifySelf: "start" }} type="button">
        + Add row
      </button>
    </div>
  );
}

export default function LineItemsSection({
  initialServiceRows,
  initialExpenseRows,
  minRows = 3,
  serviceDescriptionOptions,
  expenseDescriptionOptions,
}: {
  initialServiceRows?: LineItemRowData[];
  initialExpenseRows?: LineItemRowData[];
  minRows?: number;
  serviceDescriptionOptions?: string[];
  expenseDescriptionOptions?: string[];
}) {
  const [serviceRows, setServiceRows] = useState<LineItemRowData[]>(() =>
    makeRows(initialServiceRows, minRows)
  );
  const [expenseRows, setExpenseRows] = useState<LineItemRowData[]>(() =>
    makeRows(initialExpenseRows, minRows)
  );

  const activeService = serviceRows.filter((row) => row.description.trim());
  const activeExpense = expenseRows.filter((row) => row.description.trim());
  const subtotal = activeService.reduce((sum, row) => sum + rowTotal(row), 0);
  const expenses = activeExpense.reduce((sum, row) => sum + rowTotal(row), 0);
  const grandTotal = subtotal + expenses;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <RowGroup
        descriptionOptions={serviceDescriptionOptions}
        prefix="svc"
        rows={serviceRows}
        setRows={setServiceRows}
        title="Service charges"
      />
      <RowGroup
        descriptionOptions={expenseDescriptionOptions}
        prefix="exp"
        rows={expenseRows}
        setRows={setExpenseRows}
        title="Expenses"
      />

      <div
        className="card"
        style={{
          background: "var(--background)",
          display: "grid",
          gap: 6,
          justifyItems: "end",
          padding: 16,
        }}
      >
        <span className="muted">Charges subtotal: {money(subtotal)}</span>
        <span className="muted">Expenses: {money(expenses)}</span>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Total: {money(grandTotal)}</span>
      </div>
    </div>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "10px 12px",
  width: "100%",
};
