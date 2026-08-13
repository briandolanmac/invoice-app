"use client";

import { useState } from "react";

export type LineItemRowData = {
  description: string;
  line_date: string;
  qty: string;
  unit: string;
  price: string;
};

const EMPTY_ROW: LineItemRowData = { description: "", line_date: "", qty: "1", unit: "", price: "" };

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

function RowGroup({
  title,
  prefix,
  rows,
  setRows,
}: {
  title: string;
  prefix: "svc" | "exp";
  rows: LineItemRowData[];
  setRows: React.Dispatch<React.SetStateAction<LineItemRowData[]>>;
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
        <div
          key={i}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            display: "grid",
            gap: 10,
            padding: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
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
                name={`${prefix}_desc_${i}`}
                onChange={(e) => updateRow(i, { description: e.target.value })}
                placeholder="Description"
                style={inputStyle}
                type="text"
                value={row.description}
              />
            </label>
            <label className="grid" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 13 }}>Qty</span>
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
              <span className="muted" style={{ fontSize: 13 }}>Unit</span>
              <input
                name={`${prefix}_unit_${i}`}
                onChange={(e) => updateRow(i, { unit: e.target.value })}
                placeholder="hour"
                style={inputStyle}
                type="text"
                value={row.unit}
              />
            </label>
            <label className="grid" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: 13 }}>Unit price</span>
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
          </div>
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <button
              className="button secondary"
              onClick={() => removeRow(i)}
              style={{ fontSize: 13, padding: "6px 12px" }}
              type="button"
            >
              Remove row
            </button>
            {row.description.trim() ? (
              <div>
                <span className="muted">Row total: </span>
                <strong>{money(rowTotal(row))}</strong>
              </div>
            ) : null}
          </div>
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
}: {
  initialServiceRows?: LineItemRowData[];
  initialExpenseRows?: LineItemRowData[];
  minRows?: number;
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
      <RowGroup prefix="svc" rows={serviceRows} setRows={setServiceRows} title="Service charges" />
      <RowGroup prefix="exp" rows={expenseRows} setRows={setExpenseRows} title="Expenses" />

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
