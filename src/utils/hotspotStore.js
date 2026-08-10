import { ARTIFACTS } from '../data/artifact-pool.js'
import { DEFAULT_HOTSPOTS } from '../data/hotspots.js'

// Version 7 publishes the five reviewed surface mappings and discards older
// browser drafts whose artifact links or positions were incomplete.
export const CALIBRATION_STORAGE_VERSION = 7

export function calibrationStorageKey(modelSid) {
  return `bastetMatterportCalibration:v${CALIBRATION_STORAGE_VERSION}:${modelSid}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createDefaultTourData(modelSid) {
  return {
    version: CALIBRATION_STORAGE_VERSION,
    modelSid,
    artifacts: clone(ARTIFACTS),
    hotspots: clone(DEFAULT_HOTSPOTS),
    updatedAt: null,
  }
}

export function loadTourData(modelSid) {
  const defaults = createDefaultTourData(modelSid)
  if (typeof window === 'undefined') return defaults

  try {
    const raw = window.localStorage.getItem(calibrationStorageKey(modelSid))
    if (!raw) return defaults

    const saved = JSON.parse(raw)
    if (saved?.version !== CALIBRATION_STORAGE_VERSION || saved?.modelSid !== modelSid) {
      return defaults
    }

    const savedArtifacts = Array.isArray(saved.artifacts) ? saved.artifacts : []
    const artifactsById = new Map(defaults.artifacts.map((artifact) => [artifact.id, artifact]))
    savedArtifacts.forEach((artifact) => {
      if (artifact?.id) artifactsById.set(artifact.id, artifact)
    })

    return {
      ...defaults,
      ...saved,
      artifacts: [...artifactsById.values()],
      hotspots: Array.isArray(saved.hotspots) ? saved.hotspots : [],
    }
  } catch (error) {
    console.error('[Matterport] Could not read calibration data:', error)
    return defaults
  }
}

export function saveTourData(tourData) {
  if (typeof window === 'undefined') return tourData

  const next = {
    ...tourData,
    version: CALIBRATION_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(calibrationStorageKey(next.modelSid), JSON.stringify(next))
  return next
}
