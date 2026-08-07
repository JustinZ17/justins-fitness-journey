// Inline SVG so there's no icon-font request and nothing to cache separately.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const CheckIcon = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const ChevronIcon = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const GearIcon = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export const TrashIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
)

export const DumbbellIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
  </svg>
)

export const ListIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
)

export const ChartIcon = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />
  </svg>
)

export const PlusIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/* --- Golden theme ornaments -------------------------------------------------
   Rendered alongside their plain counterparts and swapped by CSS on
   [data-theme='golden'], so no component has to know which theme is active. */

export const PawIcon = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
    <ellipse cx="12" cy="16.2" rx="5.1" ry="4.1" />
    <ellipse cx="5.6" cy="10.6" rx="2.15" ry="2.7" />
    <ellipse cx="10.1" cy="7.4" rx="2.2" ry="2.9" />
    <ellipse cx="14.6" cy="7.4" rx="2.2" ry="2.9" />
    <ellipse cx="18.9" cy="10.6" rx="2.15" ry="2.7" />
  </svg>
)

/** A round-faced shorthair, for empty states. */
export const CatIcon = (p) => (
  <svg viewBox="0 0 64 64" width="56" height="56" {...base} strokeWidth="2.4" {...p}>
    <path d="M17 20.5 14.5 8.5 26 14" />
    <path d="M47 20.5 49.5 8.5 38 14" />
    <circle cx="32" cy="35" r="19" />
    <path d="M31 41.5 32.8 43.2 34.6 41.5" />
    <path d="M32.8 43.2v2.4" />
    <path d="M9 32.5h9M9 38.5h9M55 32.5h-9M55 38.5h-9" />
    <circle cx="24.5" cy="32" r="2.1" fill="currentColor" stroke="none" />
    <circle cx="40" cy="32" r="2.1" fill="currentColor" stroke="none" />
  </svg>
)
