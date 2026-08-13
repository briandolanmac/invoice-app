"use client";

import { useState } from "react";
import LineItemsSection, { type LineItemRowData } from "./LineItemsSection";

type AgencyOption = { id: string; name: string };

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "12px 14px",
};

export default function InvoiceFormFields({
  agencies,
  agencyPresets,
  defaultAgencyId = "",
  defaultInvoiceNumber = "",
  defaultInvoiceDate,
  defaultDueDate = "",
  defaultStatus,
  defaultTourGroupName = "",
  defaultCustomerReference = "",
  initialServiceRows,
  initialExpenseRows,
  minRows = 3,
}: {
  agencies: AgencyOption[];
  agencyPresets: Record<string, string[]>;
  defaultAgencyId?: string;
  defaultInvoiceNumber?: string;
  defaultInvoiceDate: string;
  defaultDueDate?: string;
  /** Only passed on the Edit form -- new invoices always start as 'draft'. */
  defaultStatus?: string;
  defaultTourGroupName?: string;
  defaultCustomerReference?: string;
  initialServiceRows?: LineItemRowData[];
  initialExpenseRows?: LineItemRowData[];
  minRows?: number;
}) {
  const [agencyId, setAgencyId] = useState(defaultAgencyId);

  return (
    <>
      <section className="card" style={{ display: "grid", gap: 14, padding: 24 }}>
        <h2 style={{ margin: 0 }}>Details</h2>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label className="grid" style={{ gap: 6 }}>
            <span>Agency</span>
            <select
              name="agency_id"
              onChange={(e) => setAgencyId(e.target.value)}
              required
              style={inputStyle}
              value={agencyId}
            >
              <option disabled value="">Select an agency</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
          </label>
          <label className="grid" style={{ gap: 6 }}>
            <span>Invoice number</span>
            <input
              defaultValue={defaultInvoiceNumber}
              name="invoice_number"
              placeholder="e.g. RD-2026-001"
              required
              style={inputStyle}
              type="text"
            />
          </label>
        </div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label className="grid" style={{ gap: 6 }}>
            <span>Invoice date</span>
            <input defaultValue={defaultInvoiceDate} name="invoice_date" style={inputStyle} type="date" />
          </label>
          <label className="grid" style={{ gap: 6 }}>
            <span>Due date</span>
            <input defaultValue={defaultDueDate} name="due_date" style={inputStyle} type="date" />
          </label>
          {defaultStatus ? (
            <label className="grid" style={{ gap: 6 }}>
              <span>Status</span>
              <select defaultValue={defaultStatus} name="status" style={inputStyle}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="void">Void</option>
              </select>
            </label>
          ) : null}
        </div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label className="grid" style={{ gap: 6 }}>
            <span>Tour / group name</span>
            <input
              defaultValue={defaultTourGroupName}
              name="tour_group_name"
              style={inputStyle}
              type="text"
            />
          </label>
          <label className="grid" style={{ gap: 6 }}>
            <span>Customer reference</span>
            <input
              defaultValue={defaultCustomerReference}
              name="customer_reference"
              style={inputStyle}
              type="text"
            />
          </label>
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: 14, padding: 24 }}>
        <h2 style={{ margin: 0 }}>Charges &amp; expenses</h2>
        <p className="muted" style={{ margin: 0 }}>
          Leave a row&apos;s description blank to skip it. Hours defaults to 1, rate to 0.
        </p>
        <LineItemsSection
          descriptionOptions={agencyPresets[agencyId]}
          initialExpenseRows={initialExpenseRows}
          initialServiceRows={initialServiceRows}
          minRows={minRows}
        />
      </section>
    </>
  );
}
