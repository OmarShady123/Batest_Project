import { useEffect, useState } from 'react'
import {
  ArrowCounterClockwise,
  Bug,
  Camera,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  CheckCircle,
  Crosshair,
  FloppyDisk,
  Minus,
  Plus,
  Trash,
  X,
} from '@phosphor-icons/react'
import { useI18n, translate } from '../../i18n'

// These helpers run at module scope, outside the component, so they read the
// active language off the document rather than through the hook.
const docLang = () => (document.documentElement.lang === 'en' ? 'en' : 'ar')

const STATUS_LABELS = {
  verified: 'calibration.statusVerified',
  needs_calibration: 'calibration.statusNeedsCalibration',
  unmatched: 'calibration.statusUnmatched',
  hidden: 'calibration.statusHidden',
  removed: 'calibration.statusRemoved',
}

function formatVector(vector) {
  if (!vector) return translate(docLang(), 'calibration.notAvailable')
  return `x ${vector.x.toFixed(3)} · y ${vector.y.toFixed(3)} · z ${vector.z.toFixed(3)}`
}

function formatRotation(rotation) {
  if (!rotation || !Number.isFinite(rotation.x) || !Number.isFinite(rotation.y)) return translate(docLang(), 'calibration.notAvailable')
  return `x ${rotation.x.toFixed(3)} · y ${rotation.y.toFixed(3)}`
}

function issueCount(validation) {
  return [
    validation.artifactsWithoutHotspots,
    validation.hotspotsWithoutArtifacts,
    validation.duplicateCoordinates,
    validation.invalidCoordinates,
    validation.missingFloorIds,
    validation.missingImages,
    validation.missingDescriptions,
    validation.outsideActiveModel,
    validation.differentModelSid,
    validation.unknownSweepIds,
    validation.invalidStatuses,
  ].reduce((total, items) => total + items.length, 0)
}

export function MatterportCalibrationPanel({
  artifacts,
  hotspots,
  selectedArtifactId,
  selectedHotspotId,
  draftPlacement,
  placing,
  validation,
  placementError,
  onClose,
  onSelectArtifact,
  onSelectHotspot,
  onCreateArtifact,
  onSaveArtifact,
  onCaptureArtifactImage,
  onStartPlacement,
  onCancelPlacement,
  onReposition,
  onConfirmPlacement,
  onDeleteHotspot,
  onRotateCamera,
  onZoomCamera,
  currentSweep,
  sweepIndex,
  sweepCount,
  onStepSweep,
}) {
  const { t, field, dir } = useI18n()
  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedArtifactId) || null
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) || null
  const [verifiedBy, setVerifiedBy] = useState('')
  const [debugVisible, setDebugVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    if (!selectedArtifact) {
      setForm({})
      return
    }
    setForm({
      name: selectedArtifact.name || '',
      nameEn: selectedArtifact.nameEn || '',
      period: selectedArtifact.period || '',
      periodEn: selectedArtifact.periodEn || '',
      image: selectedArtifact.image || '',
      description: selectedArtifact.description || '',
      descriptionEn: selectedArtifact.descriptionEn || '',
    })
  }, [selectedArtifact])

  const debugRecord = draftPlacement || selectedHotspot
  const problems = issueCount(validation)
  const imageFieldValue = form.image?.startsWith('data:image/')
    ? t('calibration.capturedImageValue')
    : (form.image || '')

  return (
    <aside className={`mp-calibration-panel${collapsed ? ' is-collapsed' : ''}`} aria-label={t('calibration.panelLabel')}>
      <header className="mp-calibration-header">
        <div>
          <span>{t('calibration.devOnly')}</span>
          <h2>{t('calibration.title')}</h2>
        </div>
        <div className="mp-calibration-header-actions">
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? t('calibration.expand') : t('calibration.collapse')}>
            {collapsed ? <CaretDown size={18} /> : <CaretUp size={18} />}
          </button>
          <button type="button" onClick={onClose} aria-label={t('calibration.close')}>
            <X size={18} />
          </button>
        </div>
      </header>

      {!collapsed && <div className="mp-calibration-scroll">
        <section className="mp-calibration-section">
          <div className="mp-calibration-section-title">
            <h3>{t('calibration.recordTitle')}</h3>
            <button type="button" className="mp-icon-command" onClick={onCreateArtifact} title={t('calibration.addRecord')} aria-label={t('calibration.addRecordAria')}>
              <Plus size={17} />
            </button>
          </div>
          <label>
            {t('calibration.selectedArtifact')}
            <select value={selectedArtifactId || ''} onChange={(event) => onSelectArtifact(event.target.value)}>
              <option value="" disabled>{t('calibration.chooseRecord')}</option>
              {artifacts.filter((artifact) => artifact.status !== 'removed').map((artifact) => (
                <option key={artifact.id} value={artifact.id}>
                  {field(artifact, 'name')} · {STATUS_LABELS[artifact.status] ? t(STATUS_LABELS[artifact.status]) : artifact.status}
                </option>
              ))}
            </select>
          </label>

          {selectedArtifact && (
            <div className="mp-calibration-form-grid">
              <label>{t('calibration.nameAr')}<input value={form.name || ''} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label>{t('calibration.nameEn')}<input dir="ltr" value={form.nameEn || ''} onChange={(event) => setForm((value) => ({ ...value, nameEn: event.target.value }))} /></label>
              <label>{t('calibration.periodAr')}<input value={form.period || ''} onChange={(event) => setForm((value) => ({ ...value, period: event.target.value }))} /></label>
              <label>{t('calibration.periodEn')}<input dir="ltr" value={form.periodEn || ''} onChange={(event) => setForm((value) => ({ ...value, periodEn: event.target.value }))} /></label>
              <label className="mp-calibration-wide">
                {t('calibration.imagePath')}
                <input
                  dir="ltr"
                  value={imageFieldValue}
                  onChange={(event) => setForm((value) => ({ ...value, image: event.target.value }))}
                />
              </label>
              <button type="button" className="mp-calibration-command secondary mp-calibration-wide" onClick={onCaptureArtifactImage}>
                <Camera size={17} /> {t('calibration.captureImage')}
              </button>
              <label className="mp-calibration-wide">{t('calibration.descriptionAr')}<textarea rows="3" value={form.description || ''} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
              <label className="mp-calibration-wide">{t('calibration.descriptionEn')}<textarea dir="ltr" rows="3" value={form.descriptionEn || ''} onChange={(event) => setForm((value) => ({ ...value, descriptionEn: event.target.value }))} /></label>
              <button type="button" className="mp-calibration-command mp-calibration-wide" onClick={() => onSaveArtifact({ ...selectedArtifact, ...form })}>
                <FloppyDisk size={17} /> {t('calibration.saveArtifact')}
              </button>
            </div>
          )}
        </section>

        <section className="mp-calibration-section">
          <h3>{t('calibration.positionTitle')}</h3>
          {hotspots.length > 0 && (
            <label>
              {t('calibration.savedPoint')}
              <select value={selectedHotspotId || ''} onChange={(event) => onSelectHotspot(event.target.value)}>
                <option value="">{t('calibration.newPoint')}</option>
                {hotspots.filter((hotspot) => hotspot.status !== 'removed').map((hotspot) => (
                  <option key={hotspot.id} value={hotspot.id}>
                    {field(artifacts.find((artifact) => artifact.id === hotspot.artifactId), 'name') || hotspot.label} · {STATUS_LABELS[hotspot.status] ? t(STATUS_LABELS[hotspot.status]) : hotspot.status}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!placing && !draftPlacement && (
            <button type="button" className="mp-calibration-command" onClick={onStartPlacement} disabled={!selectedArtifact}>
              <Crosshair size={18} /> {selectedHotspot ? t('calibration.reposition') : t('calibration.placePoint')}
            </button>
          )}

          {placing && !draftPlacement && (
            <div className="mp-calibration-notice">
              {t('calibration.placementHint')}
              <button type="button" onClick={onCancelPlacement}>{t('calibration.cancel')}</button>
            </div>
          )}

          {placementError && <p className="mp-calibration-error" role="alert">{placementError}</p>}

          {draftPlacement && (
            <div className="mp-calibration-confirm">
              <dl>
                <div><dt>{t('calibration.position')}</dt><dd dir="ltr">{formatVector(draftPlacement.anchorPosition)}</dd></div>
                <div><dt>{t('calibration.stemVector')}</dt><dd dir="ltr">{formatVector(draftPlacement.stemVector)}</dd></div>
                <div><dt>{t('calibration.floor')}</dt><dd dir="ltr">{draftPlacement.floorId || t('calibration.notAvailable')}</dd></div>
                <div><dt>{t('calibration.sweep')}</dt><dd dir="ltr">{draftPlacement.sweepId || t('calibration.notAvailable')}</dd></div>
              </dl>
              <label>{t('calibration.verifiedByLabel')}<input value={verifiedBy} onChange={(event) => setVerifiedBy(event.target.value)} placeholder={t('calibration.verifiedByPlaceholder')} /></label>
              <div className="mp-calibration-actions">
                <button type="button" onClick={() => onConfirmPlacement('needs_calibration', '')}>
                  <FloppyDisk size={17} /> {t('calibration.saveForReview')}
                </button>
                <button type="button" className="is-verified" onClick={() => onConfirmPlacement('verified', verifiedBy.trim())} disabled={!verifiedBy.trim()}>
                  <CheckCircle size={17} /> {t('calibration.approveMapping')}
                </button>
                <button type="button" onClick={onReposition}>
                  <ArrowCounterClockwise size={17} /> {t('calibration.recapture')}
                </button>
                <button type="button" onClick={onCancelPlacement}>{t('calibration.cancel')}</button>
              </div>
            </div>
          )}

          {selectedHotspot && !draftPlacement && (
            <div className="mp-calibration-actions">
              <button type="button" onClick={onReposition}><ArrowCounterClockwise size={17} /> {t('calibration.recalibrate')}</button>
              <button type="button" className="is-danger" onClick={onDeleteHotspot}><Trash size={17} /> {t('calibration.deletePoint')}</button>
            </div>
          )}
        </section>

        <section className="mp-calibration-section">
          <div className="mp-calibration-section-title">
            <h3>{t('calibration.diagnosticsTitle')}</h3>
            <button type="button" className="mp-icon-command" onClick={() => setDebugVisible((value) => !value)} aria-pressed={debugVisible} aria-label={t('calibration.showDiagnostics')}>
              <Bug size={17} />
            </button>
          </div>
          <div className="mp-validation-grid">
            <span><b>{validation.totals.artifacts}</b> {t('calibration.totalArtifacts')}</span>
            <span><b>{validation.totals.hotspots}</b> {t('calibration.totalHotspots')}</span>
            <span><b>{validation.totals.verifiedMappings}</b> {t('calibration.totalVerified')}</span>
            <span><b>{validation.totals.unverifiedMappings}</b> {t('calibration.totalUnverified')}</span>
          </div>
          <p className={problems ? 'mp-validation-problems' : 'mp-validation-clean'}>
            {problems ? t('calibration.problems', { count: problems }) : t('calibration.noProblems')}
          </p>

          {debugVisible && (
            <div className="mp-debug-panel" dir="ltr">
              <div className="mp-debug-actions" dir={dir}>
                <button type="button" onClick={() => onRotateCamera(-20)} aria-label={t('calibration.rotateLeft')}><CaretRight size={16} /></button>
                <button type="button" onClick={() => onRotateCamera(20)} aria-label={t('calibration.rotateRight')}><CaretLeft size={16} /></button>
                <button type="button" onClick={() => onZoomCamera(0.5)} aria-label={t('calibration.zoomIn')}><Plus size={16} /></button>
                <button type="button" onClick={() => onZoomCamera(-0.5)} aria-label={t('calibration.zoomOut')}><Minus size={16} /></button>
              </div>
              <div className="mp-debug-sweep-nav" dir={dir}>
                <button type="button" onClick={() => onStepSweep(-1)} aria-label={t('calibration.prevSweep')}><CaretRight size={16} /></button>
                <span>{t('calibration.sweepCounter', { index: sweepIndex >= 0 ? sweepIndex + 1 : '\u2014', count: sweepCount })}</span>
                <button type="button" onClick={() => onStepSweep(1)} aria-label={t('calibration.nextSweep')}><CaretLeft size={16} /></button>
              </div>
              <code>currentSweep: {currentSweep?.sid || 'missing'}</code>
              {debugRecord ? (
                <>
                  <code>hotspot: {debugRecord.id || 'draft'}</code>
                  <code>artifact: {debugRecord.artifactId}</code>
                  <code>position: {formatVector(debugRecord.anchorPosition)}</code>
                  <code>normal: {formatVector(debugRecord.surfaceNormal)}</code>
                  <code>stem: {formatVector(debugRecord.stemVector)}</code>
                  <code>floor: {debugRecord.floorId || 'missing'}</code>
                  <code>sweep: {debugRecord.sweepId || 'missing'}</code>
                  <code>cameraPosition: {formatVector(debugRecord.capturedCameraPose?.position)}</code>
                  <code>cameraRotation: {formatRotation(debugRecord.capturedCameraPose?.rotation)}</code>
                  <code>status: {debugRecord.status}</code>
                  <code>capturedAt: {debugRecord.capturedAt || 'missing'}</code>
                  <code>verifiedAt: {debugRecord.verifiedAt || 'none'}</code>
                  <code>verifiedBy: {debugRecord.verifiedBy || 'none'}</code>
                </>
              ) : <code>{t('calibration.noHotspotSelected')}</code>}
              <code>artifactsWithoutHotspots: {validation.artifactsWithoutHotspots.join(', ') || 'none'}</code>
              <code>hotspotsWithoutArtifacts: {validation.hotspotsWithoutArtifacts.join(', ') || 'none'}</code>
              <code>duplicateCoordinates: {validation.duplicateCoordinates.length}</code>
              <code>invalidCoordinates: {validation.invalidCoordinates.join(', ') || 'none'}</code>
              <code>missingFloorIds: {validation.missingFloorIds.join(', ') || 'none'}</code>
              <code>missingImages: {validation.missingImages.join(', ') || 'none'}</code>
              <code>missingDescriptions: {validation.missingDescriptions.join(', ') || 'none'}</code>
              <code>outsideActiveModel: {validation.outsideActiveModel.join(', ') || 'none'}</code>
              <code>differentModelSid: {validation.differentModelSid.join(', ') || 'none'}</code>
              <code>unknownSweepIds: {validation.unknownSweepIds.join(', ') || 'none'}</code>
            </div>
          )}
        </section>
      </div>}
    </aside>
  )
}
