"use client";

import { useState } from "react";

export const LINE_ITEM_ROWS = 6;

type Row = {
  type: string;
  description: string;
  qty: string;
  unit: string;
  price: string;
};

const EMPTY_ROW: Row = { type: "service", description: "", qty: "1", unit: "", price: "" };

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function rowTotal(row: Row) {
  const qty = row.qty === "" ? 1 : Number(row.qty);
  const price = row.price === "" ? 0 : Number(row.price);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
  return qty * price;
}

export default function LineItemsSection() {
  const [rows, setRows] = useState<Row[]>(
    Array.from({ length: LINE_ITEM_ROWS }, () => ({ ...EMPTY_ROW }))
  );

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const activeRows = rows.filter((row) => row.description.trim().length > 0);
  const subtotal = activeRows
    .filter((row) => row.type !== "expense")
    .reduce((sum, row) => sum + rowTotal(row), 0);
  const expenses = activeRows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + rowTotal(row), 0);
  const grandTotal = subtotal + expenses;

  return (
    <div style={{ display: "grid", gap: 14 }}>
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
              <span className="muted" style={{ fontSize: 13 }}>Type</span>
              <select
                name={`line_type_${i}`}
                onChange={(e) => updateRow(i, { type: e.target.value })}
                style={inputStyle}
                value={row.type}
              >
                <option value="service">Service</option>
                <option value="expense">Expense</option>
                <option value="tip">Tip</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </label>
            <label className="grid" style={{ gap: 4, gridColumn: "span 2" }}>
              <span className="muted" style={{ fontSize: 13 }}>Description</span>
              <input
                name={`line_desc_${i}`}
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
                name={`line_qty_${i}`}
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
                name={`line_unit_${i}`}
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
                name={`line_price_${i}`}
                onChange={(e) => updateRow(i, { price: e.target.value })}
                placeholder="0.00"
                step="0.01"
                style={inputStyle}
                type="number"
                value={row.price}
              />
            </label>
          </div>
          {row.description.trim() ? (
            <div style={{ textAlign: "right" }}>
              <span className="muted">Row total: </span>
              <strong>{money(rowTotal(row))}</strong>
            </div>
          ) : null}
        </div>
      ))}

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
