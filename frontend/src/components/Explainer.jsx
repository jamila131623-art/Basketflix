import { createPortal } from 'react-dom'
import { useDialog } from '../hooks/useDialog'
import { CloseIcon } from '../icons'

export default function Explainer({ onClose }) {
  const ref = useDialog(onClose)
  const steps = [
    'We look at every basket in your data.',
    'Apriori finds products that often appear together (support).',
    'It measures how likely one product is when another is in the basket (confidence) and whether that beats chance (lift).',
    'You decide which bundles to test in your store.'
  ]
  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="explainer-title" ref={ref} tabIndex={-1}>
        <div className="modal-scroll">
          <div className="modal-close-bar">
            <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><CloseIcon size={22} /></button>
          </div>
          <div className="explainer-body">
            <h2 id="explainer-title">How BasketFlix works</h2>
            <ol className="explainer-steps">
              {steps.map((s, i) => <li key={s}><span className="step-number">{i + 1}</span><p>{s}</p></li>)}
            </ol>
            <p className="muted">These are patterns in your data, not guaranteed sales increases. Always test bundles before rolling them out.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
