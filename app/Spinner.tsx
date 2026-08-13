export default function Spinner() {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <div
        style={{
          animation: "spin 0.8s linear infinite",
          border: "4px solid var(--accent-soft)",
          borderRadius: "50%",
          borderTopColor: "var(--accent)",
          height: 48,
          width: 48,
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
