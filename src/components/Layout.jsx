import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { List, X, ArrowUpLeft, ArrowUpRight, Moon, Sun, MagnifyingGlass } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n'
import { LanguageToggle } from './LanguageToggle'

// Route -> translation key. Labels resolve at render time so they follow the
// active language instead of being frozen at module load.
const links = [
  ['/', 'nav.home'], ['/about', 'nav.about'], ['/current-condition', 'nav.condition'],
  ['/digital-reconstruction', 'nav.reconstruction'], ['/virtual-tour', 'nav.tour'],
  ['/visitor-experience', 'nav.visitor'], ['/information-security', 'nav.security'],
  ['/evaluation', 'nav.evaluation'], ['/references', 'nav.references']
]

const searchableContent = [
  { path: '/', titleKey: 'nav.home', keywordsKey: 'search.keywords.home' },
  { path: '/about', titleKey: 'nav.about', keywordsKey: 'search.keywords.about' },
  { path: '/current-condition', titleKey: 'nav.condition', keywordsKey: 'search.keywords.condition' },
  { path: '/digital-reconstruction', titleKey: 'nav.reconstruction', keywordsKey: 'search.keywords.reconstruction' },
  { path: '/virtual-tour', titleKey: 'nav.tour', keywordsKey: 'search.keywords.tour' },
  { path: '/visitor-experience', titleKey: 'nav.visitor', keywordsKey: 'search.keywords.visitor' },
  { path: '/information-security', titleKey: 'nav.security', keywordsKey: 'search.keywords.security' },
  { path: '/evaluation', titleKey: 'nav.evaluation', keywordsKey: 'search.keywords.evaluation' },
  { path: '/references', titleKey: 'nav.references', keywordsKey: 'search.keywords.references' }
]

export function Layout({ children }) {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { t, isAr } = useI18n()
  const isAuthenticated = !!user
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode))
      if (darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [darkMode])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'h') {
        e.preventDefault()
        navigate('/')
      }
      if (e.altKey && e.key === 't') {
        e.preventDefault()
        navigate('/virtual-tour')
      }
      if (e.altKey && e.key === 'e') {
        e.preventDefault()
        navigate('/evaluation')
      }
      if (e.altKey && e.key === 'd') {
        e.preventDefault()
        setDarkMode(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const runSearch = (query) => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return []
    return searchableContent.filter(item => {
      const title = t(item.titleKey).toLowerCase()
      const keywords = t(item.keywordsKey)
      return title.includes(needle) ||
        (Array.isArray(keywords) && keywords.some(k => k.toLowerCase().includes(needle)))
    })
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setSearchResults(runSearch(query))
  }

  // Results are language-dependent; re-run when the language changes.
  useEffect(() => {
    setSearchResults(searchQuery ? runSearch(searchQuery) : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr])

  const ForwardArrow = isAr ? ArrowUpLeft : ArrowUpRight

  return <>
    <a className="skip-link" href="#main">{t('nav.skipToContent')}</a>
    <header className="site-header" role="banner">
      <div className="nav-shell">
        <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label={t('nav.backHome')}>
          <span className="brand-mark"><img src="/assets/icon-temple.svg" alt={t('nav.brandIconAlt')} /></span>
          <span><b>{t('nav.brandTitle')}</b><small>{t('nav.brandSubtitle')}</small></span>
        </Link>
        <div className="header-tools" aria-label={t('nav.headerTools')}>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? t('theme.toLight') : t('theme.toDark')}
            aria-pressed={darkMode}
          >
            {darkMode ? <Sun /> : <Moon />}
          </button>
          <LanguageToggle onSwitch={() => setOpen(false)} />
          <button
            className="search-toggle"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={t('search.open')}
            aria-expanded={searchOpen}
          >
            <MagnifyingGlass />
          </button>
        </div>
        <button
          className="menu-button"
          onClick={() => setOpen(v => !v)}
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={open}
          aria-controls="primary-navigation"
        >
          {open ? <X /> : <List />}
        </button>
        <nav
          id="primary-navigation"
          className={open ? 'nav-links open' : 'nav-links'}
          aria-label={t('nav.primaryNav')}
          role="navigation"
        >
          {links.map(([to, labelKey]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
            >
              {t(labelKey)}
            </NavLink>
          ))}
          {!loading && (
            // Sizing lives in CSS (.nav-auth) so the header's responsive rules
            // can tighten these buttons along with the nav links.
            isAuthenticated ? (
              <div className="nav-auth">
                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin/users"
                    onClick={() => setOpen(false)}
                    className="button secondary nav-auth-link"
                  >
                    {t('nav.adminUsers')}
                  </NavLink>
                )}
                <NavLink
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="button primary nav-auth-link is-primary"
                >
                  {t('nav.account')}
                </NavLink>
              </div>
            ) : (

              <div className="nav-auth">
                <NavLink
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="nav-auth-plain"
                >
                  {t('nav.login')}
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="button primary nav-auth-link is-primary"
                >
                  {t('nav.signup')}
                </NavLink>
              </div>
            )
          )}
        </nav>
      </div>
    </header>

    {searchOpen && (
      <div className="search-overlay" role="dialog" aria-modal="true" aria-label={t('search.dialogLabel')}>
        <div className="search-container">
          <div className="search-header">
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              aria-label={t('search.label')}
            />
            <button onClick={() => setSearchOpen(false)} aria-label={t('search.close')}>
              <X />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(result => (
                <Link
                  key={result.path}
                  to={result.path}
                  onClick={() => setSearchOpen(false)}
                  className="search-result-item"
                >
                  <strong>{t(result.titleKey)}</strong>
                  <small>{result.path}</small>
                </Link>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <div className="search-no-results">{t('search.noResults')}</div>
          )}
        </div>
      </div>
    )}
    <main id="main" role="main" tabIndex={-1}>{children}</main>
    <footer className="site-footer" role="contentinfo">
      <div><b>{t('footer.title')}</b><p>{t('footer.text')}</p></div>
      <Link to="/evaluation" aria-label={t('footer.evaluationAria')}>{t('footer.evaluationLink')} <ForwardArrow /></Link>
      <small>{t('footer.note')}</small>
    </footer>
  </>
}

export function PageHero({ title, text, image, label }) {
  const { t } = useI18n()
  return <section className="page-hero page-shell"><div><span className="kicker">{label}</span><h1 id="page-title">{title}</h1><p>{text}</p></div>{image && <img src={image} alt={t('common.heroImageAlt')} loading="lazy" />}</section>
}

export function SectionTitle({ title, text }) { return <div className="section-title" id={`section-${String(title).replace(/\s+/g, '-').toLowerCase()}`}><h2>{title}</h2>{text && <p>{text}</p>}</div> }

export function Breadcrumbs({ items }) {
  const { t } = useI18n()
  return (
    <nav className="breadcrumbs" aria-label={t('nav.breadcrumbs')}>
      {items.map((item, index) => (
        <span key={item.path}>
          {index > 0 && <span className="breadcrumb-separator">/</span>}
          {index === items.length - 1 ? (
            <span className="breadcrumb-current">{item.label}</span>
          ) : (
            <Link to={item.path} className="breadcrumb-link">{item.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}
