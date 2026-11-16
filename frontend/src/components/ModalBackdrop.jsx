export default function ModalBackdrop({ label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        padding: 0,
        border: 0,
        background: "transparent",
        cursor: "default",
      }}
    />
  );
}
