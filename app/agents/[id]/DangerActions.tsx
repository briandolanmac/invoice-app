"use client";

export function DeleteAgencyForm({
  action,
  agencyId,
}: {
  action: (formData: FormData) => void;
  agencyId: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this agent permanently? This also removes its standard descriptions. Existing invoices keep their data but lose the agent link."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input name="agency_id" type="hidden" value={agencyId} />
      <button className="button secondary" style={{ color: "var(--danger)" }} type="submit">
        Delete agent
      </button>
    </form>
  );
}
