import { useBundles } from '../BundleContext'
import { PlayIcon, PlusIcon, CheckIcon, ChevronDownIcon } from '../icons'
import { getBundleTitle, STRENGTH_HELP } from '../utils'

export function IconButton({ label, onClick, variant = 'outline', pressed, className = '', children }) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn-${variant} ${className}`}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
    >
      {children}
    </button>
  )
}

export function ListToggleButton({ bundle }) {
  const { isInList, toggleList } = useBundles()
  const title = getBundleTitle(bundle.items)
  const added = isInList(bundle)
  return (
    <IconButton
      label={added ? `Remove ${title} from My Bundle List` : `Add ${title} to My Bundle List`}
      pressed={added}
      className={added ? 'is-added' : ''}
      onClick={() => toggleList(bundle)}
    >
      {added ? <CheckIcon /> : <PlusIcon />}
    </IconButton>
  )
}

export function StrengthBadge({ strength }) {
  return (
    <span className={`badge-strength strength-${strength.toLowerCase()}`} title={STRENGTH_HELP[strength]}>
      {strength}
    </span>
  )
}

export default function BundleActions({ bundle }) {
  const { openWalkthrough, openModal } = useBundles()
  const title = getBundleTitle(bundle.items)
  return (
    <div className="bundle-actions">
      <IconButton variant="play" label={`Play Apriori walkthrough for ${title}`} onClick={() => openWalkthrough(bundle)}>
        <PlayIcon size={18} />
      </IconButton>
      <ListToggleButton bundle={bundle} />
      <IconButton className="push-right" label={`More info about ${title}`} onClick={() => openModal(bundle)}>
        <ChevronDownIcon />
      </IconButton>
    </div>
  )
}
