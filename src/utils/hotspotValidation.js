import { HOTSPOT_STATUSES } from '../data/hotspots.js'

function isVector(value) {
  return value && ['x', 'y', 'z'].every((axis) => Number.isFinite(value[axis]))
}

function coordinateKey(position) {
  if (!isVector(position)) return null
  return [position.x, position.y, position.z].map((value) => value.toFixed(3)).join(':')
}

function outsideBounds(position, bounds, padding = 15) {
  if (!bounds || !isVector(position)) return false
  return (
    position.x < bounds.min.x - padding ||
    position.x > bounds.max.x + padding ||
    position.y < bounds.min.y - padding ||
    position.y > bounds.max.y + padding ||
    position.z < bounds.min.z - padding ||
    position.z > bounds.max.z + padding
  )
}

export function calculateModelBounds(sweeps) {
  const positions = sweeps.map((sweep) => sweep?.position).filter(isVector)
  if (!positions.length) return null

  return positions.reduce((bounds, position) => ({
    min: {
      x: Math.min(bounds.min.x, position.x),
      y: Math.min(bounds.min.y, position.y),
      z: Math.min(bounds.min.z, position.z),
    },
    max: {
      x: Math.max(bounds.max.x, position.x),
      y: Math.max(bounds.max.y, position.y),
      z: Math.max(bounds.max.z, position.z),
    },
  }), {
    min: { ...positions[0] },
    max: { ...positions[0] },
  })
}

export function validateTourData({
  activeModelSid,
  artifacts = [],
  hotspots = [],
  modelBounds = null,
  modelSweepIds = [],
}) {
  const artifactsById = new Map(artifacts.map((artifact) => [artifact.id, artifact]))
  const activeHotspots = hotspots.filter((hotspot) => hotspot.status !== 'removed')
  const linkedArtifactIds = new Set(activeHotspots.map((hotspot) => hotspot.artifactId))
  const coordinateGroups = new Map()
  const sweepIds = new Set(modelSweepIds)

  activeHotspots.forEach((hotspot) => {
    const key = coordinateKey(hotspot.anchorPosition)
    if (!key) return
    coordinateGroups.set(key, [...(coordinateGroups.get(key) || []), hotspot.id])
  })

  const duplicateCoordinates = [...coordinateGroups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([coordinate, hotspotIds]) => ({ coordinate, hotspotIds }))

  const invalidCoordinates = activeHotspots
    .filter((hotspot) => !isVector(hotspot.anchorPosition) || !isVector(hotspot.stemVector))
    .map((hotspot) => hotspot.id)

  const differentModelSid = activeHotspots
    .filter((hotspot) => hotspot.modelSid !== activeModelSid)
    .map((hotspot) => hotspot.id)

  const outsideActiveModel = activeHotspots
    .filter((hotspot) => hotspot.modelSid === activeModelSid && outsideBounds(hotspot.anchorPosition, modelBounds))
    .map((hotspot) => hotspot.id)

  const unknownSweepIds = activeHotspots
    .filter((hotspot) => hotspot.sweepId && sweepIds.size && !sweepIds.has(hotspot.sweepId))
    .map((hotspot) => hotspot.id)

  return {
    totals: {
      artifacts: artifacts.length,
      hotspots: activeHotspots.length,
      verifiedMappings: activeHotspots.filter((hotspot) => hotspot.status === 'verified').length,
      unverifiedMappings: activeHotspots.filter((hotspot) => hotspot.status !== 'verified').length,
    },
    artifactsWithoutHotspots: artifacts
      .filter((artifact) => !linkedArtifactIds.has(artifact.id) && artifact.status !== 'removed')
      .map((artifact) => artifact.id),
    hotspotsWithoutArtifacts: activeHotspots
      .filter((hotspot) => !artifactsById.has(hotspot.artifactId))
      .map((hotspot) => hotspot.id),
    duplicateCoordinates,
    invalidCoordinates,
    missingFloorIds: activeHotspots.filter((hotspot) => !hotspot.floorId).map((hotspot) => hotspot.id),
    missingImages: artifacts.filter((artifact) => !artifact.image).map((artifact) => artifact.id),
    missingDescriptions: artifacts.filter((artifact) => !artifact.description?.trim()).map((artifact) => artifact.id),
    outsideActiveModel,
    differentModelSid,
    unknownSweepIds,
    invalidStatuses: activeHotspots
      .filter((hotspot) => !HOTSPOT_STATUSES.includes(hotspot.status))
      .map((hotspot) => hotspot.id),
  }
}
