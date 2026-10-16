const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false
}

const make = (children, extra = {}) => function Icon({ size = 20, ...props }) {
  return <svg {...base} {...extra} width={size} height={size} {...props}>{children}</svg>
}

export const PlayIcon = make(<path d="M7 4.5v15a.6.6 0 0 0 .9.5l12-7.5a.6.6 0 0 0 0-1L7.9 4a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none" />)
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />)
export const CheckIcon = make(<path d="M5 12.5l4.5 4.5L19 7.5" />)
export const ChevronDownIcon = make(<path d="M6 9l6 6 6-6" />)
export const ChevronLeftIcon = make(<path d="M15 5l-7 7 7 7" />)
export const ChevronRightIcon = make(<path d="M9 5l7 7-7 7" />)
export const CloseIcon = make(<path d="M6 6l12 12M18 6L6 18" />)
export const SearchIcon = make(<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L20 20" /></>)
export const ListIcon = make(<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />)
export const InfoIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>)
export const CopyIcon = make(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>)
export const DownloadIcon = make(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />)
export const TrashIcon = make(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />)
export const ReportIcon = make(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />)
