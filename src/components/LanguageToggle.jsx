import { Translate } from '@phosphor-icons/react'
import { useI18n } from '../i18n'

/**
 * Switches the whole site between Arabic (RTL) and English (LTR).
 * The label always shows the language you would switch *to*.
 */
export function LanguageToggle({ onSwitch }) {
  const { t, lang, toggleLang } = useI18n()

  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={() => {
        toggleLang()
        onSwitch?.()
      }}
      aria-label={t('lang.switchLabel')}
      title={t('lang.switchLabel')}
      lang={lang === 'ar' ? 'en' : 'ar'}
    >
      <Translate size={18} aria-hidden="true" />
      <span>{t('lang.toggleTo')}</span>
    </button>
  )
}
