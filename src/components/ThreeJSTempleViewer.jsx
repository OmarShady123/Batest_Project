import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowsOut, ArrowCounterClockwise, Keyboard, WarningCircle, Eye } from '@phosphor-icons/react';
import { useI18n } from '../i18n';

export function ThreeJSTempleViewer() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [isTouchLike, setIsTouchLike] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(hover: none), (pointer: coarse)').matches
  );
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const languageRef = useRef('ar');
  const navigate = useNavigate();

  const { t, lang: language, setLang } = useI18n();
  const [initialLang] = useState(language);
  languageRef.current = language;

  const baseUrl = import.meta.env.BASE_URL || '/';
  const tourUrl = `${baseUrl.replace(/\/?$/, '/')}bastet-threejs-tour/index.html?lang=${initialLang}`;

  useEffect(() => {
    const media = window.matchMedia?.('(hover: none), (pointer: coarse)');
    if (!media) return undefined;
    const update = () => setIsTouchLike(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'TOUR_READY') {
        setIsLoading(false);
        setHasError(false);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'SET_LANGUAGE', language: languageRef.current },
          window.location.origin
        );
      } else if (event.data.type === 'TOUR_ERROR') {
        setIsLoading(false);
        setHasError(true);
      } else if (event.data.type === 'EXIT_TOUR') {
        navigate('/');
      } else if (event.data.type === 'LANGUAGE_CHANGED') {
        if (['ar', 'en'].includes(event.data.language)) setLang(event.data.language);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage({ type: 'STOP_AUDIO' }, window.location.origin);
          iframeRef.current.contentWindow.postMessage({ type: 'PAUSE_TOUR' }, window.location.origin);
          iframeRef.current.contentWindow.postMessage({ type: 'RELEASE_POINTER_LOCK' }, window.location.origin);
        } catch (error) {
          console.error(error);
        }
      }
    };
  }, [navigate, setLang]);

  useEffect(() => {
    if (!hasError && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_LANGUAGE', language },
        window.location.origin
      );
    }
  }, [language, hasError, reloadKey]);

  const handleIframeLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'SET_LANGUAGE', language: languageRef.current },
      window.location.origin
    );
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleReload = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setReloadKey((prev) => prev + 1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((error) => console.error('Failed to enter fullscreen:', error));
    } else {
      document.exitFullscreen?.().catch((error) => console.error('Failed to exit fullscreen:', error));
    }
  }, []);

  return (
    <div ref={containerRef} className="threejs-viewer-container">
      <div className="threejs-viewer-toolbar">
        <div className="threejs-viewer-title">
          <Eye size={20} aria-hidden="true" />
          <span>{t('viewer.title')}</span>
        </div>
        <div className="threejs-viewer-actions">
          <button type="button" onClick={() => setShowControlsHint((prev) => !prev)} title={t('viewer.controlsTitle')} aria-label={t('viewer.controlsTitle')} aria-pressed={showControlsHint} className={showControlsHint ? 'is-active' : ''}>
            <Keyboard size={16} aria-hidden="true" /><span>{t('viewer.controls')}</span>
          </button>
          <button type="button" onClick={handleReload} title={t('viewer.reloadTitle')} aria-label={t('viewer.reloadTitle')}>
            <ArrowCounterClockwise size={16} aria-hidden="true" /><span>{t('viewer.reload')}</span>
          </button>
          <button type="button" onClick={toggleFullscreen} title={t('viewer.fullscreenTitle')} aria-label={t('viewer.fullscreenTitle')} className="is-primary">
            <ArrowsOut size={16} aria-hidden="true" /><span>{t('viewer.fullscreen')}</span>
          </button>
        </div>
      </div>

      {showControlsHint && (
        <div className="threejs-controls-hint">
          <div>
            <strong>{t('viewer.hintPrefix')}</strong>
            {isTouchLike ? t('viewer.mobileHintBody') : t('viewer.hintBody', { wasd: 'W, A, S, D', shift: 'Shift', e: 'E', esc: 'Esc' })}
          </div>
          <button type="button" onClick={() => setShowControlsHint(false)} aria-label={t('viewer.closeHint')} title={t('viewer.closeHint')}>✕</button>
        </div>
      )}

      <div className="threejs-viewer-frame">
        {isLoading && <div className="threejs-viewer-loading"><div className="loading-spinner" /><span>{t('viewer.loading')}</span></div>}
        {hasError ? (
          <div className="threejs-viewer-error">
            <WarningCircle size={48} aria-hidden="true" />
            <h3>{t('viewer.errorTitle')}</h3><p>{t('viewer.errorText')}</p>
            <button type="button" className="button primary" onClick={handleReload}>{t('viewer.retry')}</button>
          </div>
        ) : (
          <iframe key={reloadKey} ref={iframeRef} src={tourUrl} title={t('viewer.iframeTitle')} onLoad={handleIframeLoad} onError={handleIframeError} className="threejs-viewer-iframe" allow="autoplay; fullscreen; pointer-lock" allowFullScreen loading="lazy" />
        )}
      </div>
    </div>
  );
}
