/**
 * Container for Radix portals (dialogs, dropdowns, selects, tooltips).
 *
 * The help feature is styled by scoped CSS under `.help-scope`; Radix would
 * otherwise portal overlays to `document.body`, where those styles and tokens
 * do not apply. Rendering them into `#help-portal-root` (which also carries
 * `.help-scope`) keeps overlays styled. Falls back to the default when the root
 * is not mounted.
 */
export function helpPortalContainer(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.getElementById('help-portal-root') ?? undefined;
}
