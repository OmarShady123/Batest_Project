import { ARTIFACTS } from '../src/data/artifact-pool.js'
import { DEFAULT_HOTSPOTS, MATTERPORT_MODEL_SID } from '../src/data/hotspots.js'
import { validateTourData } from '../src/utils/hotspotValidation.js'

const report = validateTourData({
  activeModelSid: MATTERPORT_MODEL_SID,
  artifacts: ARTIFACTS,
  hotspots: DEFAULT_HOTSPOTS,
})

console.log(JSON.stringify(report, null, 2))
