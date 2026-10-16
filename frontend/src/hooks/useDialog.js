import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const stack = []
let lockCount = 0

function lockScroll() {
  if (lockCount === 0) {
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
  }
  lockCount += 1
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
}

// Focus trap + Escape to close + page scroll lock for modal dialogs.
// Only the top-most open dialog responds to keys.
export function useDialog(onClose, { onKeyDown } = {}) {
  const ref = useRef(null)
  const handlers = useRef({ onClose, onKeyDown })
  handlers.current = { onClose, onKeyDown }

  useEffect(() => {
    const node = ref.current
    const previous = document.activeElement
    const token = {}
    stack.push(token)
    lockScroll()

    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE)
    ;(first || node)?.focus({ preventScroll: true })

    const handleKey = (e) => {
      if (stack[stack.length - 1] !== token || !node) return
      if (e.key === 'Escape') {
        e.preventDefault()
        handlers.current.onClose?.()
        return
      }
      if (e.key === 'Tab') {
        const items = [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null)
        if (items.length === 0) {
          e.preventDefault()
          node.focus()
          return
        }
        const firstEl = items[0]
        const lastEl = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === firstEl || !node.contains(document.activeElement))) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && (document.activeElement === lastEl || !node.contains(document.activeElement))) {
          e.preventDefault()
          firstEl.focus()
        }
        return
      }
      handlers.current.onKeyDown?.(e)
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      const i = stack.indexOf(token)
      if (i >= 0) stack.splice(i, 1)
      unlockScroll()
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [])

  return ref
}
