import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CaretLeft,
  CaretRight,
  Compass,
  CornersIn,
  CornersOut,
  List,
  MapPin,
  SlidersHorizontal,
  X,
} from '@phosphor-icons/react'
import { MatterportCalibrationPanel } from './MatterportCalibrationPanel'
import { loadTourData, saveTourData } from '../../utils/hotspotStore'
import { calculateModelBounds, validateTourData } from '../../utils/hotspotValidation'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../i18n'
import './MatterportViewer.css'

const SDK_KEY =
  import.meta.env.VITE_MATTERPORT_SDK_KEY ||
  import.meta.env.VITE_MATTERPORT_TOKEN_ID ||
  ''

// CALIBRATION_ENABLED is resolved dynamically inside the component body based on user role.

const SDK_BOOTSTRAP_URL =
  'https://api.matterport.com/sdk/bootstrap/3.0.0-0-g0517b8d76c/sdk.es6.js'

let sdkModulePromise

function loadSdkModule() {
  if (!sdkModulePromise) {
    const url = `${SDK_BOOTSTRAP_URL}?applicationKey=${encodeURIComponent(SDK_KEY)}`
    sdkModulePromise = import(/* @vite-ignore */ url)
  }
  return sdkModulePromise
}

function isVector(value) {
  return value && ['x', 'y', 'z'].every((axis) => Number.isFinite(value[axis]))
}

function normalizeStem(normal, length = 0.3) {
  const magnitude = Math.hypot(normal.x, normal.y, normal.z)
  if (!Number.isFinite(magnitude) || magnitude < 0.0001) return null
  return {
    x: (normal.x / magnitude) * length,
    y: (normal.y / magnitude) * length,
    z: (normal.z / magnitude) * length,
  }
}

function subtractVectors(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function crossProduct(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function rotationToward(position, target) {
  if (!isVector(position) || !isVector(target)) return null
  const delta = subtractVectors(target, position)
  const horizontalDistance = Math.hypot(delta.x, delta.z)
  return {
    x: Math.atan2(delta.y, horizontalDistance) * (180 / Math.PI),
    y: -Math.atan2(delta.x, -delta.z) * (180 / Math.PI),
  }
}

async function estimateSurfaceNormal(sdk, screenPoint, centerPosition, cameraPosition) {
  const offset = 4
  const [right, left, down, up] = await Promise.all([
    sdk.Renderer.getWorldPositionData({ x: screenPoint.x + offset, y: screenPoint.y }),
    sdk.Renderer.getWorldPositionData({ x: screenPoint.x - offset, y: screenPoint.y }),
    sdk.Renderer.getWorldPositionData({ x: screenPoint.x, y: screenPoint.y + offset }),
    sdk.Renderer.getWorldPositionData({ x: screenPoint.x, y: screenPoint.y - offset }),
  ])

  const horizontal = right?.position
    ? subtractVectors(right.position, centerPosition)
    : left?.position
      ? subtractVectors(centerPosition, left.position)
      : null
  const vertical = down?.position
    ? subtractVectors(down.position, centerPosition)
    : up?.position
      ? subtractVectors(centerPosition, up.position)
      : null

  if (!horizontal || !vertical) return null
  let normal = normalizeStem(crossProduct(horizontal, vertical), 1)
  if (!normal) return null

  if (cameraPosition) {
    const towardCamera = subtractVectors(cameraPosition, centerPosition)
    if (dotProduct(normal, towardCamera) < 0) {
      normal = { x: -normal.x, y: -normal.y, z: -normal.z }
    }
  }
  return normal
}

function copyVector(vector) {
  return { x: vector.x, y: vector.y, z: vector.z }
}

function attachmentUrl(source) {
  if (!source) return null
  try {
    const url = new URL(source)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function createId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${random}`
}

function disposeSubscription(subscription) {
  subscription?.cancel?.()
  subscription?.unsubscribe?.()
}

function currentOpenTagId(state) {
  if (state?.docked) return state.docked
  if (state?.hovered) return state.hovered
  if (!state?.selected) return null
  if (typeof state.selected.values === 'function') {
    return state.selected.values().next().value || null
  }
  return Array.isArray(state.selected) ? state.selected[0] || null : null
}

function artifactIsReadyForVerification(artifact) {
  return Boolean(
    artifact &&
    artifact.source === 'admin-calibration' &&
    artifact.imageStatus !== 'placeholder' &&
    artifact.name?.trim() &&
    artifact.period?.trim() &&
    artifact.description?.trim() &&
    artifact.image?.trim()
  )
}

export function MatterportViewer({ spaceId }) {
  const { user, loading: authLoading } = useAuth()
  const { t, isAr } = useI18n()
  
  const CALIBRATION_ENABLED =
    !authLoading &&
    user?.role === 'admin' &&
    import.meta.env.DEV &&
    import.meta.env.VITE_MATTERPORT_CALIBRATION === 'true'
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const sdkRef = useRef(null)
  const connectionPromiseRef = useRef(null)
  const cameraPoseRef = useRef(null)
  const currentFloorRef = useRef(null)
  const currentSweepRef = useRef(null)
  const latestIntersectionRef = useRef(null)
  const previewTagIdRef = useRef(null)
  const runtimeTagsRef = useRef(new Map())
  const runtimeTagToHotspotRef = useRef(new Map())
  const runtimeAddedTagIdsRef = useRef(new Set())
  const nativeTagsRef = useRef(new Map())
  const tourDataRef = useRef(null)

  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkFailed, setSdkFailed] = useState(false)
  const [sdkError, setSdkError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showList, setShowList] = useState(false)
  const [selectedHotspotId, setSelectedHotspotId] = useState(null)
  const [tourData, setTourData] = useState(() => loadTourData(spaceId))
  const [modelSweeps, setModelSweeps] = useState([])
  const [currentFloor, setCurrentFloor] = useState(null)
  const [currentSweep, setCurrentSweep] = useState(null)

  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [selectedArtifactId, setSelectedArtifactId] = useState(
    () => loadTourData(spaceId).artifacts[0]?.id || null,
  )
  const [placing, setPlacing] = useState(false)
  const [draftPlacement, setDraftPlacement] = useState(null)
  const [placementError, setPlacementError] = useState('')

  tourDataRef.current = tourData

  const commitTourData = useCallback((nextData) => {
    const saved = saveTourData(nextData)
    tourDataRef.current = saved
    setTourData(saved)
    return saved
  }, [])

  const artifactsById = useMemo(
    () => new Map(tourData.artifacts.map((artifact) => [artifact.id, artifact])),
    [tourData.artifacts],
  )

  const displayedMappings = useMemo(() => tourData.hotspots
    .filter((hotspot) => {
      const artifact = artifactsById.get(hotspot.artifactId)
      if (!artifact || hotspot.modelSid !== spaceId) return false
      if (CALIBRATION_ENABLED && calibrationOpen) {
        return hotspot.status !== 'hidden' && hotspot.status !== 'removed'
      }
      return hotspot.status === 'verified' && artifact.status === 'verified'
    })
    .map((hotspot) => ({ hotspot, artifact: artifactsById.get(hotspot.artifactId) })), [
      artifactsById,
      calibrationOpen,
      spaceId,
      tourData.hotspots,
    ])

  const selectedMapping = useMemo(
    () => displayedMappings.find(({ hotspot }) => hotspot.id === selectedHotspotId) || null,
    [displayedMappings, selectedHotspotId],
  )

  const modelBounds = useMemo(() => calculateModelBounds(modelSweeps), [modelSweeps])
  const validation = useMemo(() => validateTourData({
    activeModelSid: spaceId,
    artifacts: tourData.artifacts,
    hotspots: tourData.hotspots,
    modelBounds,
    modelSweepIds: modelSweeps.map((sweep) => sweep.sid || sweep.id),
  }), [modelBounds, modelSweeps, spaceId, tourData.artifacts, tourData.hotspots])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    if (!SDK_KEY || !iframeLoaded || !iframeRef.current) {
      if (!SDK_KEY) {
        setSdkFailed(true)
        setSdkError('No SDK key')
      }
      return undefined
    }

    let cancelled = false
    setSdkFailed(false)
    setSdkError('')

    if (!connectionPromiseRef.current) {
      connectionPromiseRef.current = (async () => {
        const { connect } = await loadSdkModule()
        return Promise.race([
          connect(iframeRef.current),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('SDK connection timeout after 30 seconds')), 30000)
          }),
        ])
      })()
    }

    connectionPromiseRef.current
      .then((sdk) => {
        if (cancelled) {
          try { sdk.disconnect?.() } catch(e) {}
          return
        }
        sdkRef.current = sdk
        setSdkReady(true)
      })
      .catch((error) => {
        console.error('[Matterport] Embed SDK connection failed:', error)
        if (cancelled) return
        setSdkError(String(error?.message || error))
        setSdkFailed(true)
      })

    return () => {
      cancelled = true
      if (sdkRef.current) {
        try { sdkRef.current.disconnect?.() } catch(e) {}
        sdkRef.current = null
      }
      connectionPromiseRef.current = null
    }
  }, [iframeLoaded])

  useEffect(() => {
    const sdk = sdkRef.current
    if (!sdkReady || !sdk) return undefined

    const subscriptions = []
    const sweeps = new Map()

    subscriptions.push(sdk.Camera.pose.subscribe((pose) => {
      cameraPoseRef.current = pose
    }))

    subscriptions.push(sdk.Floor.current.subscribe((floor) => {
      currentFloorRef.current = floor
      setCurrentFloor(floor)
    }))

    subscriptions.push(sdk.Sweep.current.subscribe((sweep) => {
      currentSweepRef.current = sweep
      setCurrentSweep(sweep)
    }))

    subscriptions.push(sdk.Sweep.data.subscribe({
      onAdded(id, sweep) {
        sweeps.set(id, { ...sweep, sid: sweep.sid || id })
      },
      onUpdated(id, sweep) {
        sweeps.set(id, { ...sweep, sid: sweep.sid || id })
      },
      onRemoved(id) {
        sweeps.delete(id)
      },
      onCollectionUpdated() {
        setModelSweeps([...sweeps.values()])
      },
    }))

    subscriptions.push(sdk.Tag.data.subscribe({
      onAdded(id, tag) {
        nativeTagsRef.current.set(tag.id || id, tag)
      },
      onRemoved(id, tag) {
        nativeTagsRef.current.delete(tag?.id || id)
      },
    }))

    subscriptions.push(sdk.Tag.openTags.subscribe({
      onChanged(state) {
        const runtimeTagId = currentOpenTagId(state)
        if (!runtimeTagId) return
        const hotspotId = runtimeTagToHotspotRef.current.get(runtimeTagId)
        setSelectedHotspotId(hotspotId || null)
      },
    }))

    return () => subscriptions.forEach(disposeSubscription)
  }, [sdkReady])

  useEffect(() => {
    const sdk = sdkRef.current
    if (!sdkReady || !sdk) return undefined

    let cancelled = false

    const syncTags = async () => {
      for (const tagId of runtimeAddedTagIdsRef.current) {
        try {
          await sdk.Tag.remove(tagId)
        } catch { }
      }
      runtimeAddedTagIdsRef.current.clear()
      runtimeTagsRef.current.clear()
      runtimeTagToHotspotRef.current.clear()

      for (const { hotspot, artifact } of displayedMappings) {
        if (cancelled) return

        if (hotspot.nativeTagId && nativeTagsRef.current.has(hotspot.nativeTagId)) {
          runtimeTagsRef.current.set(hotspot.id, hotspot.nativeTagId)
          runtimeTagToHotspotRef.current.set(hotspot.nativeTagId, hotspot.id)
          continue
        }

        try {
          let attachmentIds = []
          // Matterport cannot load localhost, data URLs, or app-relative assets
          // inside its hosted Tag card. Keep those images in our own detail card.
          const mediaUrl = attachmentUrl(artifact.matterportMediaUrl)
          if (mediaUrl && artifact.imageStatus !== 'placeholder') {
            try {
              attachmentIds = await sdk.Tag.registerAttachment(mediaUrl)
            } catch (error) {
              console.warn(`[Matterport] Could not attach image for ${artifact.id}:`, error)
            }
          }
          const [tagId] = await sdk.Tag.add({
            label: isAr ? artifact.name : artifact.nameEn,
            description: isAr ? artifact.description : artifact.descriptionEn,
            anchorPosition: hotspot.anchorPosition,
            stemVector: hotspot.stemVector,
            color: hotspot.status === 'verified'
              ? { r: 0.83, g: 0.62, b: 0.35 }
              : { r: 0.95, g: 0.67, b: 0.18 },
            keywords: [`hotspot:${hotspot.id}`, `artifact:${artifact.id}`],
            attachments: attachmentIds,
          })
          if (cancelled) {
            if (tagId) {
              try {
                await sdk.Tag.remove(tagId)
              } catch { }
            }
            return
          }
          if (!tagId) continue
          runtimeAddedTagIdsRef.current.add(tagId)
          runtimeTagsRef.current.set(hotspot.id, tagId)
          runtimeTagToHotspotRef.current.set(tagId, hotspot.id)
        } catch (error) {
          console.error(`[Matterport] Could not render hotspot ${hotspot.id}:`, error)
        }
      }
    }

    syncTags()
    return () => {
      cancelled = true
    }
  }, [displayedMappings, isAr, sdkReady])

  useEffect(() => {
    const sdk = sdkRef.current
    if (!sdkReady || !sdk || !placing) return undefined

    latestIntersectionRef.current = null
    sdk.Pointer.setVisible?.(true).catch?.(() => {})

    const pointerSubscription = sdk.Pointer.intersection.subscribe((intersection) => {
      const modelCollider = sdk.Pointer.Colliders?.MODEL
      const isModel = modelCollider === undefined || intersection.object === modelCollider
      if (!isModel || !isVector(intersection.position) || !isVector(intersection.normal)) {
        latestIntersectionRef.current = null
        return
      }
      latestIntersectionRef.current = intersection
    })

    return () => {
      disposeSubscription(pointerSubscription)
      sdk.Pointer.setVisible?.(false).catch?.(() => {})
    }
  }, [placing, sdkReady])

  const removePreviewTag = useCallback(async () => {
    const tagId = previewTagIdRef.current
    previewTagIdRef.current = null
    if (!tagId || !sdkRef.current) return
    try {
      await sdkRef.current.Tag.remove(tagId)
    } catch { }
  }, [])

  const addPreviewTag = useCallback(async (placement) => {
    const sdk = sdkRef.current
    if (!sdk) return
    await removePreviewTag()
    try {
      const [tagId] = await sdk.Tag.add({
        label: t('calibration.previewLabel'),
        description: t('calibration.previewDescription'),
        anchorPosition: placement.anchorPosition,
        stemVector: placement.stemVector,
        color: { r: 0.96, g: 0.55, b: 0.12 },
      })
      previewTagIdRef.current = tagId || null
    } catch (error) {
      setPlacementError(String(error?.message || error))
    }
  }, [removePreviewTag, t])

  const startPlacement = useCallback(() => {
    if (!selectedArtifactId) {
      setPlacementError(t('calibration.chooseArtifactFirst'))
      return
    }
    removePreviewTag()
    setDraftPlacement(null)
    setPlacementError('')
    setPlacing(true)
  }, [removePreviewTag, selectedArtifactId, t])

  const captureSurface = useCallback((surface) => {
    const intersection = surface || latestIntersectionRef.current
    const artifact = tourDataRef.current.artifacts.find((item) => item.id === selectedArtifactId)
    const stemVector = intersection?.normal ? normalizeStem(intersection.normal) : null

    if (!artifact || !intersection || !isVector(intersection.position) || !stemVector) {
      setPlacementError(t('calibration.invalidSurface'))
      return
    }

    const floor = currentFloorRef.current
    const sweep = currentSweepRef.current
    const pose = cameraPoseRef.current
    const existing = tourDataRef.current.hotspots.find((hotspot) => hotspot.id === selectedHotspotId)
    const floorId = intersection.floorId || floor?.id || null
    const sweepId = sweep?.sid || pose?.sweep || null

    if (!floorId) {
      setPlacementError(t('calibration.missingFloor'))
      return
    }

    const placement = {
      id: existing?.id || createId('hotspot'),
      artifactId: artifact.id,
      modelSid: spaceId,
      label: artifact.name,
      anchorPosition: copyVector(intersection.position),
      surfaceNormal: copyVector(intersection.normal),
      stemVector,
      floorId,
      floorSequence: intersection.floorIndex ?? floor?.sequence ?? null,
      sweepId,
      status: 'needs_calibration',
      spatialStatus: 'captured',
      contentStatus: artifact.identificationConfidence === 'verified'
        ? 'verified'
        : 'needs_expert_review',
      references: artifact.references || [],
      verifiedAt: null,
      verifiedBy: null,
      capturedAt: new Date().toISOString(),
      capturedCameraPose: pose ? {
        position: copyVector(pose.position),
        rotation: { ...pose.rotation },
        sweep: pose.sweep || null,
        mode: pose.mode || null,
      } : null,
      coordinateSystem: 'showcase_sdk',
      source: intersection.source || 'pointer.intersection',
      nativeTagId: existing?.nativeTagId || null,
    }

    setPlacementError('')
    setPlacing(false)
    setDraftPlacement(placement)
    addPreviewTag(placement)
  }, [addPreviewTag, selectedArtifactId, selectedHotspotId, spaceId, t])

  const captureClickedSurface = useCallback(async (event) => {
    const sdk = sdkRef.current
    const iframe = iframeRef.current
    if (!sdk || !iframe) return

    const rect = iframe.getBoundingClientRect()
    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    setPlacementError(t('calibration.readingSurface'))

    try {
      const worldData = await sdk.Renderer.getWorldPositionData(screenPoint)
      if (!isVector(worldData?.position)) {
        setPlacementError(t('calibration.noSurfaceFound'))
        return
      }

      const pointerIntersection = latestIntersectionRef.current
      const pointerMatchesClick =
        isVector(pointerIntersection?.position) &&
        isVector(pointerIntersection?.normal) &&
        distanceBetween(pointerIntersection.position, worldData.position) < 0.2
      const normal = pointerMatchesClick
        ? copyVector(pointerIntersection.normal)
        : await estimateSurfaceNormal(
            sdk,
            screenPoint,
            worldData.position,
            cameraPoseRef.current?.position,
          )

      if (!normal) {
        setPlacementError(t('calibration.unstableNormal'))
        return
      }

      captureSurface({
        position: copyVector(worldData.position),
        normal,
        floorId: worldData.floorInfo?.id || currentFloorRef.current?.id || null,
        floorIndex: worldData.floorInfo?.sequence ?? worldData.floor ?? null,
        source: pointerMatchesClick ? 'pointer.intersection' : 'renderer.raycast',
      })
    } catch (error) {
      setPlacementError(String(error?.message || error))
    }
  }, [captureSurface, t])

  const cancelPlacement = useCallback(() => {
    removePreviewTag()
    latestIntersectionRef.current = null
    setPlacing(false)
    setDraftPlacement(null)
    setPlacementError('')
  }, [removePreviewTag])

  const confirmPlacement = useCallback((status, verifiedBy) => {
    if (!draftPlacement) return
    const data = tourDataRef.current
    const artifact = data.artifacts.find((item) => item.id === draftPlacement.artifactId)

    if (status === 'verified' && !artifactIsReadyForVerification(artifact)) {
      setPlacementError(t('calibration.reviewBeforeApprove'))
      return
    }

    const now = new Date().toISOString()
    const hotspot = {
      ...draftPlacement,
      label: artifact.name,
      status,
      verifiedAt: status === 'verified' ? now : null,
      verifiedBy: status === 'verified' ? verifiedBy : null,
    }
    const hotspots = data.hotspots.some((item) => item.id === hotspot.id)
      ? data.hotspots.map((item) => item.id === hotspot.id ? hotspot : item)
      : [...data.hotspots, hotspot]
    const artifacts = data.artifacts.map((item) => item.id === artifact.id
      ? {
          ...item,
          status,
          imageStatus: status === 'verified' ? 'verified' : item.imageStatus,
          verifiedAt: status === 'verified' ? now : null,
          verifiedBy: status === 'verified' ? verifiedBy : null,
        }
      : item)

    commitTourData({ ...data, artifacts, hotspots })
    removePreviewTag()
    setSelectedHotspotId(hotspot.id)
    setDraftPlacement(null)
    setPlacementError('')
  }, [commitTourData, draftPlacement, removePreviewTag, t])

  const saveArtifact = useCallback((updatedArtifact) => {
    const data = tourDataRef.current
    const existing = data.artifacts.find((artifact) => artifact.id === updatedArtifact.id)
    if (!existing) return
    const fields = ['name', 'nameEn', 'period', 'periodEn', 'image', 'description', 'descriptionEn']
    const changed = fields.some((field) => existing[field] !== updatedArtifact[field])
    const imageChanged = existing.image !== updatedArtifact.image
    const nextArtifact = {
      ...existing,
      ...updatedArtifact,
      ...(changed ? {
        source: 'admin-calibration',
        reviewedAt: new Date().toISOString(),
        status: existing.status === 'verified' ? 'needs_calibration' : existing.status,
        imageStatus: imageChanged ? 'needs_review' : existing.imageStatus,
      } : {}),
    }
    const hotspots = data.hotspots.map((hotspot) => hotspot.artifactId === nextArtifact.id
      ? { ...hotspot, label: nextArtifact.name, status: hotspot.status === 'verified' && changed ? 'needs_calibration' : hotspot.status }
      : hotspot)
    commitTourData({
      ...data,
      artifacts: data.artifacts.map((artifact) => artifact.id === nextArtifact.id ? nextArtifact : artifact),
      hotspots,
    })
  }, [commitTourData])

  const createArtifact = useCallback(() => {
    const data = tourDataRef.current
    const number = data.artifacts.length + 1
    const artifact = {
      id: createId('artifact'),
      status: 'needs_calibration',
      name: `سجل قطعة جديد ${number}`,
      nameEn: `New artifact record ${number}`,
      period: '',
      periodEn: '',
      description: '',
      descriptionEn: '',
      image: '',
      imageStatus: 'missing',
      source: 'admin-calibration',
      createdAt: new Date().toISOString(),
    }
    commitTourData({ ...data, artifacts: [...data.artifacts, artifact] })
    setSelectedArtifactId(artifact.id)
    setSelectedHotspotId(null)
  }, [commitTourData])

  const captureArtifactImage = useCallback(async () => {
    const sdk = sdkRef.current
    const data = tourDataRef.current
    const artifact = data.artifacts.find((item) => item.id === selectedArtifactId)
    if (!sdk || !artifact) return
    try {
      setPlacementError(t('calibration.capturingImage'))
      const image = await sdk.Renderer.takeScreenShot(
        { width: 800, height: 450 },
        { mattertags: false, sweeps: false, views: false, measurements: false },
      )
      const nextArtifact = {
        ...artifact,
        image,
        imageStatus: 'captured',
        source: 'admin-calibration',
        status: artifact.status === 'verified' ? 'needs_calibration' : artifact.status,
        imageCapturedAt: new Date().toISOString(),
        imageSweepId: currentSweepRef.current?.sid || null,
      }
      commitTourData({
        ...data,
        artifacts: data.artifacts.map((item) => item.id === artifact.id ? nextArtifact : item),
        hotspots: data.hotspots.map((hotspot) => hotspot.artifactId === artifact.id && hotspot.status === 'verified'
          ? { ...hotspot, status: 'needs_calibration', verifiedAt: null, verifiedBy: null }
          : hotspot),
      })
      setPlacementError(t('calibration.imageCaptured'))
    } catch (error) {
      setPlacementError(String(error?.message || error))
    }
  }, [commitTourData, selectedArtifactId, t])

  const selectHotspot = useCallback((hotspotId) => {
    cancelPlacement()
    setSelectedHotspotId(hotspotId || null)
    const hotspot = tourDataRef.current.hotspots.find((item) => item.id === hotspotId)
    if (hotspot) setSelectedArtifactId(hotspot.artifactId)
  }, [cancelPlacement])

  const deleteHotspot = useCallback(() => {
    if (!selectedHotspotId) return
    const data = tourDataRef.current
    const deleted = data.hotspots.find((hotspot) => hotspot.id === selectedHotspotId)
    const hotspots = data.hotspots.filter((hotspot) => hotspot.id !== selectedHotspotId)
    const artifacts = data.artifacts.map((artifact) => artifact.id === deleted?.artifactId
      ? { ...artifact, status: 'needs_calibration', verifiedAt: null, verifiedBy: null }
      : artifact)
    commitTourData({ ...data, artifacts, hotspots })
    setSelectedHotspotId(null)
  }, [commitTourData, selectedHotspotId])

  const flyToMapping = useCallback(async (mapping) => {
    const sdk = sdkRef.current
    setSelectedHotspotId(mapping.hotspot.id)
    setShowList(false)
    if (!sdk) return

    try {
      if (mapping.hotspot.sweepId) {
        await sdk.Sweep.moveTo(mapping.hotspot.sweepId, {
          transition: sdk.Camera.TransitionType?.FLY,
        })
      }

      const capturedRotation = mapping.hotspot.capturedCameraPose?.rotation
      const targetRotation = Number.isFinite(capturedRotation?.x) && Number.isFinite(capturedRotation?.y)
        ? capturedRotation
        : rotationToward(cameraPoseRef.current?.position, mapping.hotspot.anchorPosition)

      if (targetRotation && sdk.Camera.setRotation) {
        await sdk.Camera.setRotation(targetRotation, { speed: 120 })
      } else {
        await sdk.Camera.lookAt?.(mapping.hotspot.anchorPosition, {
          mode: sdk.Mode.Mode?.INSIDE,
          transition: sdk.Camera.TransitionType?.FLY,
        })
      }
    } catch (error) {
      console.error(`[Matterport] Could not navigate to hotspot ${mapping.hotspot.id}:`, error)
    }
  }, [])

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      return
    }
    containerRef.current?.requestFullscreen?.().catch(() => {})
  }

  const rotateCamera = async (horizontal) => {
    try {
      await sdkRef.current?.Camera.rotate(horizontal, 0, { speed: 90 })
    } catch (error) {
      setPlacementError(String(error?.message || error))
    }
  }

  const zoomCamera = async (delta) => {
    try {
      await sdkRef.current?.Camera.zoomBy(delta)
    } catch (error) {
      setPlacementError(String(error?.message || error))
    }
  }

  const orderedSweeps = useMemo(() => [...modelSweeps].sort((left, right) => {
    const leftX = Number(left.position?.x)
    const rightX = Number(right.position?.x)
    if (!Number.isFinite(leftX) && !Number.isFinite(rightX)) return 0
    if (!Number.isFinite(leftX)) return 1
    if (!Number.isFinite(rightX)) return -1
    return rightX - leftX
  }), [modelSweeps])

  const sweepIndex = useMemo(() => {
    const currentSid = currentSweep?.sid
    return orderedSweeps.findIndex((sweep) => (sweep.sid || sweep.id) === currentSid)
  }, [currentSweep, orderedSweeps])

  const stepSweep = useCallback(async (direction) => {
    const sdk = sdkRef.current
    if (!sdk || orderedSweeps.length === 0) return
    const currentSid = currentSweepRef.current?.sid
    const currentIndex = orderedSweeps.findIndex((sweep) => (sweep.sid || sweep.id) === currentSid)
    const baseIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (baseIndex + direction + orderedSweeps.length) % orderedSweeps.length
    const nextSid = orderedSweeps[nextIndex]?.sid || orderedSweeps[nextIndex]?.id
    if (!nextSid) return
    try {
      await sdk.Sweep.moveTo(nextSid, { transition: sdk.Camera.TransitionType.INSTANT })
      setPlacementError('')
    } catch (error) {
      setPlacementError(String(error?.message || error))
    }
  }, [orderedSweeps])

  const closeCalibration = () => {
    cancelPlacement()
    setCalibrationOpen(false)
  }

  const iframeSrc = SDK_KEY
    ? `https://my.matterport.com/show?m=${spaceId}&play=1&newtags=1&applicationKey=${encodeURIComponent(SDK_KEY)}`
    : `https://my.matterport.com/show?m=${spaceId}&play=1&newtags=1`

  const artifact = selectedMapping?.artifact

  return (
    <div ref={containerRef} className="mp-viewer-container">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        allowFullScreen
        allow="fullscreen; xr-spatial-tracking"
        className="mp-viewer-iframe"
        title={t('matterport.iframeTitle')}
        onLoad={() => setIframeLoaded(true)}
      />

      {sdkFailed && SDK_KEY && (
        <div className="mp-viewer-error-banner">
          {t('matterport.sdkConnectionFailed')}
          <div className="mp-viewer-error-details">{sdkError}</div>
          <div className="mp-viewer-error-help">
            {t('matterport.sdkAllowDomain', { host: window.location.host })}
          </div>
        </div>
      )}

      {sdkFailed && !SDK_KEY && (
        <div className="mp-viewer-error-banner">
          {t('matterport.sdkKeyMissing')}
        </div>
      )}

      {!sdkReady && !sdkFailed && (
        <div className="mp-viewer-status-bubble">
          <Compass className="mp-spin" size={16} />
          {t('matterport.connecting')}
        </div>
      )}

      {sdkReady && displayedMappings.length === 0 && !calibrationOpen && (
        <div className="mp-viewer-empty-bubble">
          {t('matterport.noVerifiedArtifacts')}
        </div>
      )}

      {sdkReady && displayedMappings.length > 0 && (
        <button type="button" onClick={() => setShowList((value) => !value)} className="mp-viewer-list-toggle">
          <List size={16} />
          {t('matterport.artifactCount', { count: displayedMappings.length })}
        </button>
      )}

      {showList && displayedMappings.length > 0 && (
        <div className="mp-viewer-list-container">
          <div className="mp-viewer-list-header">
            <h3>{t('matterport.artifactsTitle')}</h3>
            <button type="button" onClick={() => setShowList(false)} className="mp-viewer-close-button" aria-label={t('matterport.close')}>
              <X size={16} />
            </button>
          </div>
          <div className="mp-viewer-list-items">
            {displayedMappings.map((mapping, index) => (
              <button type="button" key={mapping.hotspot.id} onClick={() => flyToMapping(mapping)} className="mp-viewer-list-item-btn">
                <span className="mp-viewer-list-item-num">{index + 1}</span>
                <span className="mp-viewer-list-item-text">{isAr ? mapping.artifact.name : mapping.artifact.nameEn}</span>
                <span className="mp-viewer-list-item-icon"><MapPin size={14} /></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!placing && artifact && selectedMapping && (
        <div className="mp-viewer-detail-card" key={selectedMapping.hotspot.id}>
          <div className="mp-viewer-detail-img-container">
            <img src={artifact.image || '/placeholder.svg'} alt={isAr ? artifact.name : artifact.nameEn} />
            <button type="button" onClick={() => setSelectedHotspotId(null)} className="mp-viewer-detail-close-btn" aria-label={t('matterport.close')}>
              <X size={16} />
            </button>
          </div>
          <div className="mp-viewer-detail-content">
            <span className="mp-viewer-detail-badge">{isAr ? artifact.period : artifact.periodEn}</span>
            <h3 className="mp-viewer-detail-title">{isAr ? artifact.name : artifact.nameEn}</h3>
            <p className="mp-viewer-detail-desc">{isAr ? artifact.description : artifact.descriptionEn}</p>
          </div>
        </div>
      )}

      {CALIBRATION_ENABLED && sdkReady && !calibrationOpen && (
        <button type="button" className="mp-calibration-toggle" onClick={() => setCalibrationOpen(true)}>
          <SlidersHorizontal size={17} /> {t('calibration.calibrationToggle')}
        </button>
      )}

      {CALIBRATION_ENABLED && calibrationOpen && placing && (
        <button
          type="button"
          className="mp-calibration-click-layer"
          onClick={captureClickedSurface}
          aria-label={t('calibration.clickSurfaceAria')}
        />
      )}

      {CALIBRATION_ENABLED && calibrationOpen && !placing && (
        <div className="mp-sweep-explorer" aria-label={t('calibration.sweepExplorerAria')}>
          <button type="button" onClick={() => stepSweep(-1)} aria-label={t('calibration.prevSweepShort')}><CaretRight size={17} /></button>
          <span dir="ltr">{sweepIndex >= 0 ? sweepIndex + 1 : '—'} / {modelSweeps.length}</span>
          <button type="button" onClick={() => stepSweep(1)} aria-label={t('calibration.nextSweepShort')}><CaretLeft size={17} /></button>
        </div>
      )}

      {CALIBRATION_ENABLED && calibrationOpen && (
        <MatterportCalibrationPanel
          artifacts={tourData.artifacts}
          hotspots={tourData.hotspots}
          selectedArtifactId={selectedArtifactId}
          selectedHotspotId={selectedHotspotId}
          draftPlacement={draftPlacement}
          placing={placing}
          validation={validation}
          placementError={placementError}
          currentFloor={currentFloor}
          currentSweep={currentSweep}
          sweepIndex={sweepIndex}
          sweepCount={modelSweeps.length}
          onClose={closeCalibration}
          onSelectArtifact={(artifactId) => {
            cancelPlacement()
            setSelectedArtifactId(artifactId)
            setSelectedHotspotId(null)
          }}
          onSelectHotspot={selectHotspot}
          onCreateArtifact={createArtifact}
          onSaveArtifact={saveArtifact}
          onCaptureArtifactImage={captureArtifactImage}
          onStartPlacement={startPlacement}
          onCancelPlacement={cancelPlacement}
          onReposition={startPlacement}
          onConfirmPlacement={confirmPlacement}
          onDeleteHotspot={deleteHotspot}
          onRotateCamera={rotateCamera}
          onZoomCamera={zoomCamera}
          onStepSweep={stepSweep}
        />
      )}

      <div className="mp-viewer-footer">
        <div className="mp-viewer-footer-buttons">
          <button type="button" onClick={handleFullscreen} className="mp-viewer-fullscreen-btn">
            {isFullscreen ? <CornersIn size={16} /> : <CornersOut size={16} />}
            {isFullscreen ? t('matterport.exitFullscreen') : t('matterport.fullscreen')}
          </button>
        </div>
        <div className="mp-viewer-footer-instructions">
          {t('matterport.instructions')}
        </div>
      </div>
    </div>
  )
}
