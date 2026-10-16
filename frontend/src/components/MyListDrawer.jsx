import { createPortal } from 'react-dom'
import { useDialog } from '../hooks/useDialog'
import Poster from './Poster'
import { CloseIcon, CopyIcon, DownloadIcon, TrashIcon } from '../icons'
import { getBundleTitle, pct, supportPct, formatLift, copyText, downloadText, bundleListCsv, LIFT_TOOLTIP } from '../utils'

export default function MyListDrawer({ list, onClose, onRemove, onOpen, onToast }) {
  const ref = useDialog(onClose)

  const copy = async () => {
    const ok = await copyText(list.map(b => getBundleTitle(b.items)).join('\n'))
    onToast(ok ? 'List copied to clipboard' : 'Could not copy the list')
  }
  const download = () => {
    downloadText('basketflix_bundle_list.csv', bundleListCsv(list))
    onToast('Downloaded bundle list CSV')
  }

  return createPortal(
    <div className="drawer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" ref={ref} tabIndex={-1}>
        <header className="drawer-header">
          <h2 id="drawer-title">My Bundle List <span className="muted">({list.length})</span></h2>
          <button type="button" className="round-close" aria-label="Close My Bundle List" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </header>
        {list.length === 0 ? (
          <p className="drawer-empty">Add bundles with the + button.</p>
        ) : (
          <ul className="drawer-list">
            {list.map(b => (
              <li key={b.id} className="drawer-item">
                <button type="button" className="drawer-thumb" aria-label={`Open details for ${getBundleTitle(b.items)}`} onClick={() => onOpen(b)}>
                  <Poster items={b.items} variant="landscape" />
                </button>
                <div className="drawer-info">
                  <button type="button" className="drawer-title" onClick={() => onOpen(b)}>{getBundleTitle(b.items)}</button>
                  <div className="drawer-stats">
                    <span className="match">{pct(b.best_rule.confidence)}% bought together</span>
                    <span>in {supportPct(b.support)}% of baskets</span>
                    <span className="has-tip" title={LIFT_TOOLTIP}>{formatLift(b.best_rule.lift)} chance</span>
                  </div>
                  <button type="button" className="text-btn" aria-label={`Remove ${getBundleTitle(b.items)}`} onClick={() => onRemove(b)}>
                    <TrashIcon size={16} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <footer className="drawer-footer">
          <button type="button" className="btn btn-grey small" onClick={copy} disabled={!list.length}><CopyIcon size={18} /> Copy list</button>
          <button type="button" className="btn btn-white small" onClick={download} disabled={!list.length}><DownloadIcon size={18} /> Download CSV</button>
        </footer>
      </aside>
    </div>,
    document.body
  )
}
