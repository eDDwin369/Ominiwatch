import { useHmsStore } from "./hmsStore";
import { X } from "lucide-react";

/** Launcher follows the Theme Studio button colour. */
const NAVY = "var(--hs-primary)";

export function HmsLauncher() {
  const { isOpen, togglePanel, state, role, clearRightClickPos } = useHmsStore();
  const count =
    role === "admin"
      ? state.notifications.admin
      : role === "help-admin"
        ? state.notifications.helpAdmin
        : state.notifications.customer;

  const handleClick = () => {
    clearRightClickPos();
    togglePanel();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isOpen
          ? "Close help panel"
          : count > 0
            ? `Open help panel, ${count} new help updates`
            : "Open help panel"
      }
      aria-expanded={isOpen}
      className="fixed flex items-center justify-center text-[var(--hs-primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]"
      style={{
        right: 24,
        bottom: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: NAVY,
        zIndex: 9999,
        boxShadow: "var(--card-shadow)",
      }}
    >
      {isOpen ? (
        <X style={{ width: 16, height: 16 }} strokeWidth={2.5} />
      ) : (
        <span aria-hidden="true" style={{ fontSize: "var(--hs-fs-18)", lineHeight: 1 }}>✦</span>
      )}
      {!isOpen && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center rounded-full text-white font-bold"
          style={{
            top: -4,
            right: -4,
            width: 14,
            height: 14,
            // Help admins get an amber "new request" cue; others stay red.
            backgroundColor: role === "help-admin" ? "var(--color-amber-500)" : "var(--color-red-500)",
            border: "1.5px solid var(--bg-card)",
            fontSize: "var(--hs-fs-8)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
