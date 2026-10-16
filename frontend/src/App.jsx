import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { playIntroSound } from './sound'
import {
  getAllProducts, dedupeBundles, filterBundles, topBundles, popularBundles, hiddenGems, bundlesWithProduct
} from './utils'
import { BundleContext } from './BundleContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Row, { SizeChips } from './components/Row'
import HoverPreview from './components/HoverPreview'
import BundleModal from './components/BundleModal'
import Walkthrough from './components/Walkthrough'
import MyListDrawer from './components/MyListDrawer'
import Toasts from './components/Toasts'
import Report from './components/Report'
import BundleBuilder from './components/BundleBuilder'
import Explainer from './components/Explainer'
import UploadPage from './components/UploadPage'
import StatsStrip from './components/StatsStrip'
import { ResultsSkeleton } from './components/Skeleton'

function App() {
  const [stage, setStage] = useState('gate') // gate, intro, main
  const [serverStatus, setServerStatus] = useState('checking')
  const [file, setFile] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [minSupport, setMinSupport] = useState(2)
  const [minConfidence, setMinConfidence] = useState(30)
  const [results, setResults] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [view, setView] = useState('home')
  const [pendingScroll, setPendingScroll] = useState(null)
  const [sizeFilter, setSizeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductForRow, setSelectedProductForRow] = useState(null)
  const [myList, setMyList] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalBundle, setModalBundle] = useState(null)
  const [walkthroughBundle, setWalkthroughBundle] = useState(null)
  const [showExplainer, setShowExplainer] = useState(false)
  const [preview, setPreview] = useState(null)
  const [toasts, setToasts] = useState([])
  const fileInputRef = useRef(null)

  // Check server health on mount
  useEffect(() => {
    checkServerHealth()
  }, [])

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        setServerStatus('connected')
      } else {
        setServerStatus('offline')
      }
    } catch (e) {
      setServerStatus('offline')
    }
  }

  const handleStart = async () => {
    setStage('intro')
    try {
      await playIntroSound()
    } catch (e) {
      // Audio failure is OK
    }
    setTimeout(() => {
      setStage('main')
    }, 3800)
  }

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setValidationResult(null)
    setValidationError(null)
    setResults(null)

    // Client-side pre-checks
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setValidationError('The file must be a CSV with a .csv extension.')
      return
    }
    if (selectedFile.size === 0) {
      setValidationError('The file is empty. Please upload a CSV file with data.')
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setValidationError('The file is too large. Please upload a file under 10 MB.')
      return
    }

    // Read first line to check header
    const reader = new FileReader()
    reader.onload = (e) => {
      const firstLine = e.target.result.split('\n')[0].trim()
      const normalizedHeader = firstLine.toLowerCase().replace(/\s+/g, '')
      if (normalizedHeader !== 'transaction_id,item') {
        setValidationError('The CSV header must be exactly: transaction_id,item')
        return
      }
      validateFile(selectedFile)
    }
    reader.readAsText(selectedFile)
  }

  const validateFile = async (fileToValidate) => {
    setLoading(true)
    setValidationError(null)
    setValidationResult(null)

    const formData = new FormData()
    formData.append('file', fileToValidate)

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (res.ok) {
        setValidationResult(data)
      } else {
        setValidationError(data.detail || 'Validation failed')
      }
    } catch (e) {
      if (e instanceof TypeError) {
        setValidationError('Cannot reach the analysis server. Start the backend on port 8000.')
      } else {
        setValidationError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!file || !validationResult) return

    setLoading(true)
    setAnalyzing(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('min_support', minSupport / 100)
    formData.append('min_confidence', minConfidence / 100)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (res.ok) {
        setResults(data)
        setView('home')
        window.scrollTo({ top: 0 })
      } else {
        setValidationError(data.detail || 'Analysis failed')
      }
    } catch (e) {
      if (e instanceof TypeError) {
        setValidationError('Cannot reach the analysis server. Start the backend on port 8000.')
      } else {
        setValidationError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
      setAnalyzing(false)
    }
  }

  const handleUseSample = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sample.csv')
      if (!res.ok) throw new Error('Failed to fetch sample')
      const blob = await res.blob()
      const sampleFile = new File([blob], 'basketflix_sample.csv', { type: 'text/csv' })
      handleFileSelect(sampleFile)
    } catch (e) {
      if (e instanceof TypeError) {
        setValidationError('Cannot reach the analysis server. Start the backend on port 8000.')
      } else {
        setValidationError('Failed to load sample dataset.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUploadNew = () => {
    setFile(null)
    setValidationResult(null)
    setValidationError(null)
    setResults(null)
    setModalBundle(null)
    setWalkthroughBundle(null)
    setPreview(null)
    setDrawerOpen(false)
    setMyList([])
    setSearchTerm('')
    setSizeFilter('all')
    setSelectedProductForRow(null)
    setView('home')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/template.csv')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'basketflix_template.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setValidationError('Failed to download template.')
    }
  }

  const handleDownloadSample = async () => {
    try {
      const res = await fetch('/api/sample.csv')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'basketflix_sample.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setValidationError('Failed to download sample dataset.')
    }
  }

  const allBundles = useMemo(() => (results ? dedupeBundles(results.bundles) : []), [results])
  const visible = useMemo(() => filterBundles(allBundles, { size: sizeFilter, search: searchTerm }), [allBundles, sizeFilter, searchTerm])
  const top10 = useMemo(() => topBundles(visible, 10), [visible])
  const rankMap = useMemo(() => new Map(top10.map((b, i) => [b.id, i + 1])), [top10])
  const popular = useMemo(() => popularBundles(visible), [visible])
  const gems = useMemo(() => hiddenGems(visible, allBundles), [visible, allBundles])
  const because = useMemo(() => (selectedProductForRow
    ? bundlesWithProduct(filterBundles(allBundles, { size: sizeFilter }), selectedProductForRow)
    : []), [allBundles, sizeFilter, selectedProductForRow])
  const allProducts = useMemo(() => getAllProducts(results), [results])

  const pushToast = useCallback((text) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(t => [...t.slice(-2), { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])

  const toggleList = useCallback((bundle) => {
    const inList = myList.some(b => b.id === bundle.id)
    setMyList(list => (inList ? list.filter(b => b.id !== bundle.id) : [...list, bundle]))
    pushToast(inList ? 'Removed from My Bundle List' : 'Added to My Bundle List')
  }, [myList, pushToast])

  const ctx = useMemo(() => ({
    results,
    total: results?.report.transactions || 0,
    isInList: (b) => myList.some(x => x.id === b.id),
    toggleList,
    openModal: (b) => { setPreview(null); setModalBundle(b) },
    openWalkthrough: (b) => { setPreview(null); setWalkthroughBundle(b) },
    showPreview: setPreview,
    hidePreview: () => setPreview(null),
    topRank: (b) => rankMap.get(b.id) || null
  }), [results, myList, toggleList, rankMap])

  useEffect(() => {
    const hide = () => setPreview(null)
    window.addEventListener('resize', hide)
    return () => window.removeEventListener('resize', hide)
  }, [])

  useEffect(() => {
    if (!pendingScroll) return
    const t = setTimeout(() => {
      if (pendingScroll === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
      else document.getElementById(pendingScroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setPendingScroll(null)
    }, 30)
    return () => clearTimeout(t)
  }, [pendingScroll, view])

  const handleNavigate = (section) => {
    setPreview(null)
    if (!results) return
    if (section === 'report') {
      setView('report')
      setPendingScroll('top')
    } else {
      setView('home')
      setPendingScroll(section === 'home' ? 'top' : section)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    if (view !== 'home') setView('home')
    const term = value.trim().toLowerCase()
    setSelectedProductForRow(term ? allProducts.find(p => p.toLowerCase().includes(term)) || null : null)
  }

  // Gate screen
  if (stage === 'gate') {
    return (
      <div className="gate-screen">
        <button
          className="start-button"
          onClick={handleStart}
          autoFocus
        >
          Start BasketFlix
        </button>
        <p className="sound-hint">Turn your sound on</p>
      </div>
    )
  }

  // Intro screen
  if (stage === 'intro') {
    return (
      <div className="intro-screen">
        <h1 className="intro-title">BASKETFLIX</h1>
      </div>
    )
  }

  // Main app
  return (
    <BundleContext.Provider value={ctx}>
      <div className="app">
        <Navbar
          hasResults={!!results}
          view={view}
          onNavigate={handleNavigate}
          searchTerm={searchTerm}
          onSearch={handleSearch}
          listCount={myList.length}
          onOpenList={() => { setPreview(null); setDrawerOpen(true) }}
          onUploadNew={handleUploadNew}
        />

        {analyzing ? (
          <ResultsSkeleton />
        ) : !results ? (
          <UploadPage
            serverStatus={serverStatus}
            file={file}
            validationResult={validationResult}
            validationError={validationError}
            loading={loading}
            minSupport={minSupport}
            minConfidence={minConfidence}
            onFileSelect={handleFileSelect}
            onUseSample={handleUseSample}
            onDownloadTemplate={handleDownloadTemplate}
            onDownloadSample={handleDownloadSample}
            onAnalyze={handleAnalyze}
            onMinSupportChange={setMinSupport}
            onMinConfidenceChange={setMinConfidence}
          />
        ) : view === 'report' ? (
          <Report results={results} />
        ) : (
          <main className="results-page">
            <Hero bundles={top10.slice(0, 5)} />
            <div className="rows">
              <SizeChips value={sizeFilter} onChange={setSizeFilter} />
              {searchTerm && (
                <p className="search-note">Showing bundles with &ldquo;{searchTerm}&rdquo; <button type="button" className="text-btn" onClick={() => handleSearch('')}>Clear search</button></p>
              )}
              <Row id="top10" title="Top 10 Bundles in Your Store" bundles={top10} variant="top10" />
              <Row id="popular" title="Most Popular Combos" bundles={popular} />
              <Row id="hidden" title="Hidden Gems" bundles={gems} emptyText="No hidden gems at these settings: no bundle with lift of 1.5 or more is below the median basket share." />
              {selectedProductForRow && (
                <Row id="because" title={`Because you picked ${selectedProductForRow}`} bundles={because} />
              )}
              <StatsStrip report={results.report} summary={results.summary} />
              <BundleBuilder rules={results.rules} allProducts={allProducts} onProductSelect={setSelectedProductForRow} onToast={pushToast} />
              <div className="how-link">
                <button type="button" className="text-btn" onClick={() => setShowExplainer(true)}>How does this work?</button>
              </div>
            </div>
          </main>
        )}

        {results && !analyzing && (
          <footer className="site-footer">
            <p className="disclaimer">Results describe patterns in the dataset you uploaded. Frequent co-purchase is not proof that a bundle will raise sales. Test bundles before rolling them out.</p>
            <p className="footer-meta">BasketFlix · Apriori association rule mining · {results.report.transactions} baskets analysed</p>
          </footer>
        )}

        {preview && <HoverPreview preview={preview} onClose={() => setPreview(null)} />}
        {modalBundle && <BundleModal bundle={modalBundle} onClose={() => setModalBundle(null)} />}
        {walkthroughBundle && <Walkthrough bundle={walkthroughBundle} onClose={() => setWalkthroughBundle(null)} />}
        {drawerOpen && (
          <MyListDrawer
            list={myList}
            onClose={() => setDrawerOpen(false)}
            onRemove={toggleList}
            onOpen={(b) => { setDrawerOpen(false); setModalBundle(b) }}
            onToast={pushToast}
          />
        )}
        {showExplainer && <Explainer onClose={() => setShowExplainer(false)} />}
        <Toasts toasts={toasts} />
      </div>
    </BundleContext.Provider>
  )
}

export default App
