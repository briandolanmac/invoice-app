"use client";

import { useState } from "react";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import LineItemsSection, { type LineItemRowData } from "./LineItemsSection";

type AgencyOption = { id: string; name: string; default_invoice_prefix: string | null };

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  minWidth: 0,
  padding: "12px 14px",
  width: "100%",
};

export default function InvoiceFormFields({
  agencies,
  agencyServicePresets,
  agencyExpensePresets,
  agencyInvoiceNumbers,
  defaultAgencyId = "",
  defaultInvoiceNumber = "",
  defaultInvoiceDate,
  defaultStatus,
  defaultTourGroupName = "",
  initialServiceRows,
  initialExpenseRows,
  minRows = 3,
}: {
  agencies: AgencyOption[];
  agencyServicePresets: Record<string, string[]>;
  agencyExpensePresets: Record<string, string[]>;
  /** Only needed on the New Invoice form -- powers auto-filling the
   *  invoice number when an agent is picked. */
  agencyInvoiceNumbers?: Record<string, string[]>;
  defaultAgencyId?: string;
  defaultInvoiceNumber?: string;
  defaultInvoiceDate: string;
  /** Only passed on the Edit form -- new invoices always start as 'draft'. */
  defaultStatus?: string;
  defaultTourGroupName?: string;
  initialServiceRows?: LineItemRowData[];
  initialExpenseRows?: LineItemRowData[];
  minRows?: number;
}) {
  const [agencyId, setAgencyId] = useState(defaultAgencyId);
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [invoiceNumberTouched, setInvoiceNumberTouched] = useState(Boolean(defaultInvoiceNumber));

  function handleAgencyChange(newAgencyId: string) {
    setAgencyId(newAgencyId);
    if (invoiceNumberTouched || !agencyInvoiceNumbers) return;

    const agency = agencies.find((a) => a.id === newAgencyId);
    const prefix = agency?.default_invoice_prefix;
    if (!prefix) return;

    setInvoiceNumber(nextInvoiceNumber(prefix, agencyInvoiceNumbers[newAgencyId] || []));
  }

  const selectedAgencyPrefix = agencies.find((a) => a.id === agencyId)?.default_invoice_prefix;
  const canGenerateNumber = Boolean(agencyInvoiceNumbers && selectedAgencyPrefix);

  function handleGenerateNumber() {
    if (!agencyInvoiceNumbers || !selectedAgencyPrefix) return;
    setInvoiceNumber(nextInvoiceNumber(selectedAgencyPrefix, agencyInvoiceNumbers[agencyId] || []));
    setInvoiceNumberTouched(true);
  }

  return (
    <>
      <section className="card" style={{ display: "grid", gap: 14, padding: 24 }}>
        <h2 style={{ margin: 0 }}>Details</h2>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label className="grid" style={{ gap: 6 }}>
            <span>Agent</span>
            <select
              name="agency_id"
              onChange={(e) => handleAgencyChange(e.target.value)}
              required
              style={inputStyle}
              value={agencyId}
            >
              <option disabled value="">Select an agent</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
          </label>
          <label className="grid" style={{ gap: 6 }}>
            <span>Invoice number</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                name="invoice_number"
                onChange={(e) => {
                  setInvoiceNumber(e.target.value);
                  setInvoiceNumberTouched(true);
                }}
                placeholder="e.g. RD-2026-001"
                required
                style={{ ...inputStyle, flex: 1 }}
                type="text"
                value={invoiceNumber}
              />
              {agencyInvoiceNumbers ? (
                <button
                  className="button secondary"
                  disabled={!canGenerateNumber}
                  onClick={handleGenerateNumber}
                  style={{ padding: "0 16px", whiteSpace: "nowrap" }}
                  title={canGenerateNumber ? "Suggest the next number for this agent" : "Select an agent first"}
                  type="button"
                >
                  Generate
                </button>
              ) : null}
            </div>
          </label>
        </div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label className="grid" style={{ gap: 6 }}>
            <span>Invoice date</span>
            <input defaultValue={defaultInvoiceDate} name="invoice_date" style={inputStyle} type="date" />
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
          <label className="grid" style={{ gap: 6 }}>
            <span>Tour / group name</span>
            <input
              defaultValue={defaultTourGroupName}
              name="tour_group_name"
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
          expenseDescriptionOptions={agencyExpensePresets[agencyId]}
          initialExpenseRows={initialExpenseRows}
          initialServiceRows={initialServiceRows}
          minRows={minRows}
          serviceDescriptionOptions={agencyServicePresets[agencyId]}
        />
      </section>
    </>
  );
}
