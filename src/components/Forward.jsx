import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useI18n } from '../i18n'

/**
 * Arrow that always points along the reading direction:
 * left in Arabic (RTL), right in English (LTR).
 */
export function Forward(props) {
  const { isAr } = useI18n()
  return isAr ? <ArrowLeft {...props} /> : <ArrowRight {...props} />
}

/** Arrow pointing back against the reading direction. */
export function Backward(props) {
  const { isAr } = useI18n()
  return isAr ? <ArrowRight {...props} /> : <ArrowLeft {...props} />
}
