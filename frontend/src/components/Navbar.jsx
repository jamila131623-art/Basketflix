import { useEffect, useRef, useState } from 'react'
import { SearchIcon, ListIcon, CloseIcon, ChevronDownIcon } from '../icons'

const LINKS = [
  ['home', 'Home'],
  ['top10', 'Top 10'],
  ['hidden', 'Hidden Gems'],
  ['builder', 'Bundle Builder'],
  ['report', 'Report']
]

export default function Navbar({ hasResults, view, onNavigate, searchTerm, onSearch, listCount, onOpenList, onUploadNew }) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  const go = (section) => {
    setMenuOpen(false)
    onNavigate(section)
  }

  const isActive = (section) => (section === 'report' ? view === 'report' : view === 'home' && section === 'home')

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} aria-label="Main">
      <div className="navbar-left">
        <button type="button" className="navbar-brand" onClick={() => go('home')} aria-label="BasketFlix home">
          BASKETFLIX
        </button>
        {hasResults && (
          <>
            <ul className="nav-links">
              {LINKS.map(([id, label]) => (
                <li key={id}>
                  <button type="button" className={isActive(id) ? 'active' : ''} aria-current={isActive(id) ? 'page' : undefined} onClick={() => go(id)}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="browse">
              <button type="button" className="browse-btn" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
                Browse <ChevronDownIcon size={16} />
              </button>
              {menuOpen && (
                <ul className="browse-menu">
                  {LINKS.map(([id, label]) => (
                    <li key={id}><button type="button" onClick={() => go(id)}>{label}</button></li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
      {hasResults && (
        <div className="navbar-right">
          <div className={`search-box ${searchOpen || searchTerm ? 'open' : ''}`} role="search">
            <button type="button" className="nav-icon" aria-label="Search products" onClick={() => setSearchOpen(o => !o || !!searchTerm)}>
              <SearchIcon size={22} />
            </button>
            <input
              ref={inputRef}
              type="search"
              placeholder="Products, e.g. Bread"
              aria-label="Filter bundles by product"
              value={searchTerm}
              tabIndex={searchOpen || searchTerm ? 0 : -1}
              onChange={(e) => onSearch(e.target.value)}
              onBlur={() => { if (!searchTerm) setSearchOpen(false) }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onSearch('')
                  setSearchOpen(false)
                }
              }}
            />
            {searchTerm && (
              <button type="button" className="nav-icon small" aria-label="Clear search" onClick={() => { onSearch(''); inputRef.current?.focus() }}>
                <CloseIcon size={16} />
              </button>
            )}
          </div>
          <button type="button" className="nav-icon list-btn" aria-label={`My Bundle List, ${listCount} saved`} onClick={onOpenList}>
            <ListIcon size={24} />
            {listCount > 0 && <span className="badge-count" aria-hidden="true">{listCount}</span>}
          </button>
          <button type="button" className="upload-new-button" onClick={onUploadNew}>
            <span className="label-long">Upload new dataset</span>
            <span className="label-short">New data</span>
          </button>
        </div>
      )}
    </nav>
  )
}
