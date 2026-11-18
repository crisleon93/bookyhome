import { IconTag } from "./Icons";

export default function PromoSectionHeading({ darkMode, title, summary }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{
        width: "50px", height: "50px", borderRadius: "14px",
        background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px rgba(122,30,58,0.25)", flexShrink: 0
      }}>
        <IconTag width={24} height={24} strokeWidth={2.2} style={{ color: "white" }} />
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 900, color: darkMode ? "#f3f4f6" : "#1f2937" }}>
          {title}
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: darkMode ? "#b8b8b8" : "#6b7280" }}>
          {summary}
        </p>
      </div>
    </div>
  );
}
