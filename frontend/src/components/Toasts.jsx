import { CheckIcon } from '../icons'

export default function Toasts({ toasts }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="toast"><CheckIcon size={18} /> {t.text}</div>
      ))}
    </div>
  )
}
