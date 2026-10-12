/**
 * Resolves what the user right-clicked into a help target: the exact button, dropdown,
 * field, tab, card, dialog or page — with a readable name, a breadcrumb
 * (page › card › element) and a stable key that help content is filed under.
 *
 * Names come from what users see (button text, tooltip / aria-label for icon buttons,
 * field label, card title, page title), so screens need no manual tagging.
 * `data-hms-label` on any element overrides the derived name; `data-hms-type` its type
 * (e.g. every notification row is one "Notification" list item, not per-message help).
 */
import { detectPageContext, labelForContext } from "@help/lib/hms-context-registry";
import { getSessionRole } from "../../utils/navigation";

export type HelpTargetType =
  | "Button" | "Dropdown" | "Field" | "Tab" | "Link" | "Menu item" | "Toggle" | "Option"
  | "List item" | "Card" | "Dialog" | "Section" | "Page";

export interface HelpTarget {
  /** Key help content is filed under. Elements: `el:<page>/<card>/<type>:<name>`; pages keep their section key. */
  key: string;
  /** Breadcrumb label, e.g. "Account Settings › Security & Sessions › Change Password". */
  label: string;
  name: string;
  type: HelpTargetType;
  trail: string[];
  element: HTMLElement | null;
}

export const ELEMENT_KEY_PREFIX = "el:";
const SEP = " › ";

const clean = (s: string | null | undefined, max = 48) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

/** Visible text of an element without the text of nested buttons / badges / sr-only spans. */
function ownText(el: Element): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("button, [role=button], .sr-only, .tf-sr-label, svg, [aria-hidden=true]").forEach((n) => {
    if (n !== clone) n.remove();
  });
  return clean(clone.textContent);
}

// ── Page / surface ────────────────────────────────────────────────────────────

const ROUTE_PAGES: Record<string, string> = {
  overview: "Dashboard",
  account: "Account Settings",
  notifications: "Notifications",
  reports: "Report Builder",
  customer: "Customer",
  "theme-studio": "Theme Studio",
};

function routeView(): string {
  const hash = (window.location.hash || "").replace(/^#!?/, "").split("?")[0];
  return hash.split("/")[2] || "overview";
}

/** The surface the click happened on: a window over the page, the shell chrome, or the routed page. */
function resolvePage(el: HTMLElement): { name: string; key: string; root: Element | null } {
  const surfaces: [string, string, string][] = [
    [".gs-modal", "Global Settings", "section-global-settings"],
    [".new-notification-dropdown", "Notifications", "section-notifications"],
    [".dash-header", "Header", "section-workspace"],
    [".sidebar, aside", "Sidebar", "section-workspace"],
  ];
  for (const [sel, name, key] of surfaces) {
    const root = el.closest(sel);
    if (root) return { name, key, root };
  }
  const view = routeView();
  const name =
    view === "admin"
      ? getSessionRole() === "sub_admin" ? "Help Admin" : "Superadmin"
      : ROUTE_PAGES[view] ?? labelForContext(detectPageContext().context);
  return { name, key: detectPageContext().context, root: document.querySelector(".dashboard-container") };
}

// ── Controls ──────────────────────────────────────────────────────────────────

const CONTROL_SELECTOR = [
  "button", "a[href]", "select", "textarea", "input:not([type=hidden])", ".tf-field",
  "[role=button]", "[role=tab]", "[role=menuitem]", "[role=option]", "[role=switch]",
  "[role=checkbox]", "[role=combobox]", "[data-hms-label]",
].join(",");

function controlType(el: HTMLElement): HelpTargetType {
  const explicit = el.getAttribute("data-hms-type");
  if (explicit) return explicit as HelpTargetType;
  const role = el.getAttribute("role");
  const cls = typeof el.className === "string" ? el.className : "";
  const type = (el as HTMLInputElement).type;
  if (el.matches(".tf-field")) return el.querySelector("select, .tf-select") ? "Dropdown" : "Field";
  if (role === "tab" || /\btab\b|-tab\b|tab-btn|tab-pill/.test(cls)) return "Tab";
  if (role === "switch" || role === "checkbox" || type === "checkbox" || type === "radio" || /toggle|switch/i.test(cls)) return "Toggle";
  if (role === "menuitem" || (el.tagName === "A" && el.closest(".sidebar, aside, nav, [role=menu]"))) return "Menu item";
  if (role === "option" || /option/.test(cls)) return "Option";
  if (
    el.tagName === "SELECT" || role === "combobox" || el.getAttribute("aria-haspopup") === "listbox" ||
    /dropdown|select|cookie-trigger|sec-trigger/i.test(cls) || !!el.querySelector(".tf-chevron, .lucide-chevron-down")
  ) return "Dropdown";
  if (el.matches(".tf-field, input, textarea")) return "Field";
  if (el.tagName === "A") return "Link";
  return "Button";
}

function controlName(el: HTMLElement): string {
  const explicit = el.getAttribute("data-hms-label");
  if (explicit) return clean(explicit);
  // Fields: their label (TextField legend / <label for> / aria-label / placeholder)
  const field = el.closest(".tf-field");
  if (field) {
    const legend = field.querySelector(".tf-legend, .tf-sr-label");
    if (legend?.textContent) return clean(legend.textContent);
  }
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl?.textContent) return clean(lbl.textContent);
  }
  // Dropdowns built from a labelled wrapper (Language, Timezone, Edition…)
  const labelled = el.closest("[data-label], .tf-wrapper");
  const wrapperLabel = labelled?.querySelector(".tf-legend")?.textContent;
  if (wrapperLabel) return clean(wrapperLabel);

  // A dropdown trigger shows its current value, so name it by its label / title instead —
  // prefixed with its row's label when several share a card ("Company Name · Font weight").
  if (el.getAttribute("aria-haspopup") === "listbox" || el.getAttribute("aria-haspopup") === "menu") {
    const titled = el.getAttribute("aria-label") || el.getAttribute("title") || el.closest("[title]")?.getAttribute("title");
    const own = clean(titled?.split(" — ")[0]); // drop usage hints ("— double-click to type…")
    if (own) {
      const row = rowLabel(el.closest(".gs-dd-root, [class*=dropdown]") as HTMLElement ?? el);
      return row && row !== own ? `${row} · ${own}` : own;
    }
  }

  // Visible text first; tooltips / titles name icon-only controls.
  return (
    clean(el.getAttribute("aria-label")) ||
    ownText(el) ||
    clean(el.getAttribute("title")) ||
    clean(el.getAttribute("data-tip")) ||
    clean((el as HTMLInputElement).placeholder) ||
    (el.getAttribute("data-hms-context") ? clean(labelForContext(el.getAttribute("data-hms-context")!)) : "")
  );
}

/** Unlabelled controls (e.g. a switch) take the label text of their row. */
function rowLabel(el: HTMLElement): string {
  for (let p = el.parentElement, depth = 0; p && depth < 3; p = p.parentElement, depth++) {
    if (isContainer(p)) break;
    const fieldLabel = p.querySelector(".tf-legend")?.textContent; // e.g. the switch beside "Company Name"
    if (fieldLabel) return clean(fieldLabel);
    const text = ownText(p);
    if (text && text.length <= 48) return text;
  }
  return "";
}

// ── Containers (cards, dialogs, sections) ─────────────────────────────────────

const TITLE_SELECTOR =
  ".figma-card-heading, .gs-card-header, .hms-card-title, .hms-window-title, .new-notification-title, [class*='card-title'], [class*='card-heading']";
const HEADING_SELECTOR =
  "h1, h2, h3, h4, .figma-card-heading, .gs-card-header, .hms-card-title, .hms-window-title, [class*='card-title'], [class*='card-heading']";
/** A class name segment that marks a container (`figma-card`, `gs-config-card`, `hms-window` — not `gs-cards-2x2`). */
const CONTAINER_WORD = /(^|[-_])(card|panel|widget|modal|dialog|window|section|accordion|popover|drawer)([-_]|$)/i;
const hasContainerClass = (cls: string) =>
  cls.split(/\s+/).some((c) => CONTAINER_WORD.test(c)) ||
  // Tailwind cards in the help module: a rounded, bordered, white / card box
  (/(^|\s)rounded-(lg|xl|2xl)(\s|$)/.test(cls) && /(^|\s)border(\s|$)/.test(cls) && /(^|\s)bg-(white|card|background)(\s|$)/.test(cls));

function isContainer(el: HTMLElement) {
  const cls = typeof el.className === "string" ? el.className : "";
  return el.getAttribute("role") === "dialog" || hasContainerClass(cls);
}

function containerInfo(el: HTMLElement): { name: string; type: HelpTargetType } | null {
  const role = el.getAttribute("role");
  const cls = typeof el.className === "string" ? el.className : "";
  const isDialog = role === "dialog" || role === "alertdialog" || /modal|dialog/i.test(cls);
  const explicit = el.getAttribute("data-hms-label");
  if (explicit) return { name: clean(explicit), type: isDialog ? "Dialog" : "Card" };
  if (!isDialog && !hasContainerClass(cls) && !el.hasAttribute("data-hms-context")) return null;

  // The container's own title: a dedicated card / window title wins; otherwise the first plain
  // heading that is not inside a nested container.
  const ownTitle = Array.from(el.querySelectorAll<HTMLElement>(TITLE_SELECTOR)).find((h) => {
    const dialog = h.closest("[role=dialog]"); // skip titles of dialogs nested inside this container
    return !dialog || dialog === el || !el.contains(dialog);
  });
  const heading =
    ownTitle ??
    Array.from(el.querySelectorAll<HTMLElement>(HEADING_SELECTOR)).find((h) => {
      for (let p = h.parentElement; p && p !== el; p = p.parentElement) if (isContainer(p)) return false;
      return true;
    });
  const name = heading ? ownText(heading) : el.hasAttribute("data-hms-context") ? clean(labelForContext(el.getAttribute("data-hms-context")!)) : "";
  if (!name) return null;
  return { name, type: isDialog ? "Dialog" : cls.split(/\s+/).some((c) => /(^|[-_])section([-_]|$)/i.test(c)) ? "Section" : "Card" };
}

// ── Resolver ──────────────────────────────────────────────────────────────────

export function resolveHelpTarget(target: Element | null): HelpTarget {
  const start = (target instanceof HTMLElement ? target : target?.parentElement) ?? document.body;
  const page = resolvePage(start);
  const inPage = (el: Element | null) => !!el && el !== document.body && (!page.root || page.root.contains(el) || page.root === el);

  // 1. Nearest control
  const control = start.closest<HTMLElement>(CONTROL_SELECTOR);
  let name = "";
  let type: HelpTargetType = "Page";
  let element: HTMLElement | null = null;
  if (control && inPage(control)) {
    name = controlName(control) || rowLabel(control);
    if (name) {
      type = controlType(control);
      element = control.closest<HTMLElement>(".tf-field") ?? control;
    }
  }

  // 2. Nearest named container (the card the control lives in, or the target itself)
  let card: { name: string; type: HelpTargetType; el: HTMLElement } | null = null;
  for (let el: HTMLElement | null = (element ?? start); el && inPage(el) && el !== page.root; el = el.parentElement) {
    if (element && el === element) continue;
    const info = containerInfo(el);
    if (info && info.name !== page.name && info.name !== name) {
      card = { ...info, el };
      break;
    }
  }

  if (!element && card) {
    // Right-clicked a card / dialog / section itself
    name = card.name;
    type = card.type;
    element = card.el;
    card = null;
    // its parent container, if any, becomes the middle crumb
    for (let el = element.parentElement; el && inPage(el) && el !== page.root; el = el.parentElement) {
      const info = containerInfo(el);
      if (info && info.name !== page.name && info.name !== name) { card = { ...info, el }; break; }
    }
  }

  if (!element) {
    return { key: page.key, label: page.name, name: page.name, type: "Page", trail: [page.name], element: null };
  }

  const trail = [page.name, ...(card ? [card.name] : []), name];
  const key = `${ELEMENT_KEY_PREFIX}${slug(page.name)}/${card ? `${slug(card.name)}/` : ""}${slug(type)}:${slug(name)}`;
  return { key, label: trail.join(SEP), name, type, trail, element };
}

/** Name / type / trail back from a stored scope (key + breadcrumb label). */
export function describeScope(key: string, label: string): { name: string; type: HelpTargetType; trail: string[] } {
  const trail = label.split(SEP).map((s) => s.trim()).filter(Boolean);
  if (!key.startsWith(ELEMENT_KEY_PREFIX)) return { name: trail[trail.length - 1] || label, type: "Page", trail: trail.length ? trail : [label] };
  const typeSlug = key.slice(key.lastIndexOf("/") + 1).split(":")[0].replace(/-/g, " ");
  const type = (typeSlug.charAt(0).toUpperCase() + typeSlug.slice(1)) as HelpTargetType;
  return { name: trail[trail.length - 1] || label, type, trail };
}

/** Briefly outlines the element the help is about. */
export function flashHelpTarget(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("hms-target-flash");
  void el.offsetWidth; // restart the animation
  el.classList.add("hms-target-flash");
  window.setTimeout(() => el.classList.remove("hms-target-flash"), 1600);
}
