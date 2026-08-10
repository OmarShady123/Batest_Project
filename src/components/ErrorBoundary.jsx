import { Component } from 'react'
import { translate } from '../i18n'

// The boundary renders outside the React tree that survived the crash,
// so it resolves copy from the <html lang> attribute rather than context.
const tr = (key) => translate(document.documentElement.lang === 'en' ? 'en' : 'ar', key)

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Log error details for debugging
    if (typeof window !== 'undefined') {
      const errorLog = {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      console.log('Error Log:', errorLog)
      localStorage.setItem('lastError', JSON.stringify(errorLog))
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'Markazi, Tahoma, Arial, sans-serif',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ color: '#a45f2c', fontSize: 'clamp(32px, 5vw, 48px)' }}>{tr('errorBoundary.title')}</h1>
          <p style={{ color: '#68736f', fontSize: '18px', maxWidth: '600px', margin: '20px 0' }}>
            {tr('errorBoundary.text')}
          </p>
          {this.state.error && (
            <details style={{ margin: '20px 0', textAlign: 'start', direction: 'ltr' }}>
              <summary style={{ cursor: 'pointer', color: '#a45f2c' }}>{tr('errorBoundary.details')}</summary>
              <pre style={{
                background: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '8px', 
                overflow: 'auto',
                fontSize: '14px',
                direction: 'ltr',
                textAlign: 'left'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#a45f2c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '20px',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#74401d'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#a45f2c'}
          >
            {tr('errorBoundary.reload')}
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#a45f2c',
              border: '2px solid #a45f2c',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '10px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#a45f2c'; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#a45f2c'; }}
          >
            {tr('notFound.backHome')}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
