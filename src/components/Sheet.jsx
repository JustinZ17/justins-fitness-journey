import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Bottom sheet. Everything modal in the app uses this, so it stays thumb-reachable.
 *
 * Rendered through a portal into <body> rather than where it's written in the
 * tree. Written inline it landed inside .screen — the scrolling element — which
 * clipped the bottom of the sheet behind the tab bar and, worse, meant a drag
 * over the sheet scrolled the page behind it instead of the sheet's own
 * content. A modal can't be a child of the thing it covers.
 */
export function Sheet({ title, onClose, children }) {
  const sheetRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)

    // Freeze the screen behind the sheet. Without this a drag that runs past
    // the end of the sheet's own scroll carries on into the page underneath.
    const screen = document.querySelector('.screen')
    const previous = screen?.style.overflow
    const scrollTop = screen?.scrollTop ?? 0
    if (screen) screen.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      if (screen) {
        screen.style.overflow = previous ?? ''
        // Restoring overflow can drop the scroll position; put it back so
        // closing a sheet doesn't jump you to the top of your workout.
        screen.scrollTop = scrollTop
      }
    }
  }, [onClose])

  return createPortal(
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" ref={sheetRef}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
