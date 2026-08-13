"use client";

import { useId, useState } from "react";

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

function RowGroup({
  title,
  prefix,
  rows,
  setRows,
  descriptionListId,
}: {
  title: string;
  prefix: "svc" | "exp";
  rows: LineItemRowData[];
  setRows: React.Dispatch<React.SetStateAction<LineItemRowData[]>>;
  descriptionListId?: string;
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
              display: "grid",
              flex: 1,
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              padding: 14,
            }}
          >
            <label className="grid" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 13 }}>Date</span>
              <input
                name={`${prefix}_date_${i}`}
                onChange={(e) => updateRow(i, { line_date: e.target.value })}
                style={inputStyle}
                type="date"
                value={row.line_date}
              />
            </label>
            <label className="grid" style={{ gap: 4, gridColumn: "span 2" }}>
              <span className="muted" style={{ fontSize: 13 }}>Description</span>
              <input
                list={descriptionListId}
                name={`${prefix}_desc_${i}`}
                onChange={(e) => updateRow(i, { description: e.target.value })}
                placeholder="Description"
                style={inputStyle}
                type="text"
                value={row.description}
              />
            </label>
            <label className="grid" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 13 }}>Hours</span>
              <input
                name={`${prefix}_qty_${i}`}
                onChange={(e) => updateRow(i, { qty: e.target.value })}
                step="0.01"
                style={inputStyle}
                type="number"
                value={row.qty}
              />
            </label>
            <label className="grid" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 13 }}>Rate</span>
              <input
                name={`${prefix}_price_${i}`}
                onChange={(e) => updateRow(i, { price: e.target.value })}
                placeholder="0.00"
                step="0.01"
                style={inputStyle}
                type="number"
                value={row.price}
              />
            </label>
            <div className="grid" style={{ gap: 4 }}>
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
  descriptionOptions,
}: {
  initialServiceRows?: LineItemRowData[];
  initialExpenseRows?: LineItemRowData[];
  minRows?: number;
  descriptionOptions?: string[];
}) {
  const [serviceRows, setServiceRows] = useState<LineItemRowData[]>(() =>
    makeRows(initialServiceRows, minRows)
  );
  const [expenseRows, setExpenseRows] = useState<LineItemRowData[]>(() =>
    makeRows(initialExpenseRows, minRows)
  );
  const datalistId = useId();

  const activeService = serviceRows.filter((row) => row.description.trim());
  const activeExpense = expenseRows.filter((row) => row.description.trim());
  const subtotal = activeService.reduce((sum, row) => sum + rowTotal(row), 0);
  const expenses = activeExpense.reduce((sum, row) => sum + rowTotal(row), 0);
  const grandTotal = subtotal + expenses;
  const hasOptions = !!descriptionOptions?.length;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {hasOptions ? (
        <datalist id={datalistId}>
          {descriptionOptions!.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      ) : null}

      <RowGroup
        descriptionListId={hasOptions ? datalistId : undefined}
        prefix="svc"
        rows={serviceRows}
        setRows={setServiceRows}
        title="Service charges"
      />
      <RowGroup
        descriptionListId={hasOptions ? datalistId : undefined}
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
