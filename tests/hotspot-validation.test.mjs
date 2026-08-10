import test from 'node:test'
import assert from 'node:assert/strict'
import { ARTIFACTS } from '../src/data/artifact-pool.js'
import { DEFAULT_HOTSPOTS, MATTERPORT_MODEL_SID } from '../src/data/hotspots.js'
import { calculateModelBounds, validateTourData } from '../src/utils/hotspotValidation.js'

const validHotspot = {
  id: 'hotspot-1',
  artifactId: ARTIFACTS[0].id,
  modelSid: MATTERPORT_MODEL_SID,
  label: 'Test',
  anchorPosition: { x: 1, y: 1, z: 1 },
  stemVector: { x: 0, y: 0.3, z: 0 },
  floorId: 'floor-1',
  sweepId: 'sweep-1',
  status: 'verified',
  verifiedAt: '2026-01-01T00:00:00.000Z',
  verifiedBy: 'Reviewer',
}

test('empty seed data exposes no visitor mappings', () => {
  const report = validateTourData({
    activeModelSid: MATTERPORT_MODEL_SID,
    artifacts: ARTIFACTS,
    hotspots: [],
  })

  assert.equal(report.totals.artifacts, 10)
  assert.equal(report.totals.hotspots, 0)
  assert.equal(report.totals.verifiedMappings, 0)
  assert.equal(report.artifactsWithoutHotspots.length, 10)
})

test('validator reports structural and model-link errors', () => {
  const report = validateTourData({
    activeModelSid: MATTERPORT_MODEL_SID,
    artifacts: [ARTIFACTS[0]],
    hotspots: [
      validHotspot,
      { ...validHotspot, id: 'hotspot-2', artifactId: 'missing-artifact', modelSid: 'wrong-model', floorId: '' },
      { ...validHotspot, id: 'hotspot-3', anchorPosition: { x: Number.NaN, y: 0, z: 0 }, status: 'unknown' },
    ],
    modelSweepIds: ['sweep-1'],
  })

  assert.equal(report.duplicateCoordinates.length, 1)
  assert.deepEqual(report.hotspotsWithoutArtifacts, ['hotspot-2'])
  assert.deepEqual(report.differentModelSid, ['hotspot-2'])
  assert.deepEqual(report.missingFloorIds, ['hotspot-2'])
  assert.deepEqual(report.invalidCoordinates, ['hotspot-3'])
  assert.deepEqual(report.invalidStatuses, ['hotspot-3'])
})

test('bounds are calculated from SDK sweep positions', () => {
  const bounds = calculateModelBounds([
    { position: { x: -4, y: 1, z: 8 } },
    { position: { x: 6, y: 3, z: -2 } },
  ])

  assert.deepEqual(bounds, {
    min: { x: -4, y: 1, z: -2 },
    max: { x: 6, y: 3, z: 8 },
  })
})

test('published hotspot records are complete, unique and linked to verified artifacts', () => {
  const artifactsById = new Map(ARTIFACTS.map((artifact) => [artifact.id, artifact]))
  const report = validateTourData({
    activeModelSid: MATTERPORT_MODEL_SID,
    artifacts: ARTIFACTS,
    hotspots: DEFAULT_HOTSPOTS,
  })

  assert.equal(DEFAULT_HOTSPOTS.length, 8)
  assert.equal(report.totals.verifiedMappings, 8)
  assert.equal(report.totals.unverifiedMappings, 0)
  assert.deepEqual(report.hotspotsWithoutArtifacts, [])
  assert.deepEqual(report.duplicateCoordinates, [])
  assert.deepEqual(report.invalidCoordinates, [])
  assert.deepEqual(report.missingFloorIds, [])
  assert.deepEqual(report.differentModelSid, [])

  DEFAULT_HOTSPOTS.forEach((hotspot) => {
    assert.equal(hotspot.modelSid, MATTERPORT_MODEL_SID)
    assert.equal(hotspot.coordinateSystem, 'showcase_sdk')
    assert.ok(hotspot.sweepId)
    assert.ok(hotspot.verifiedAt)
    assert.ok(hotspot.verifiedBy)
    assert.equal(artifactsById.get(hotspot.artifactId)?.status, 'verified')
  })
})
