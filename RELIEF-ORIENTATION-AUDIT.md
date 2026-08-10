# Bastet Temple Three.js — Relief Orientation Audit

## Scope

This audit covers the wall-relief texture sets used by the Three.js tour. The goal is to preserve the archaeological reading orientation of the published scenes, not merely the raw rotation of scanned book pages.

## Primary reference

Édouard Naville, *The Festival-Hall of Osorkon II in the Great Temple of Bubastis* (London, 1892).

- Heidelberg University Library digital volume: https://digi.ub.uni-heidelberg.de/diglit/naville1892
- NYU Institute of Fine Arts scan used for page-by-page comparison: https://mc.dlib.nyu.edu/files/books/ifa_egypt000163/ifa_egypt000163_lo.pdf

Some plates in the digitized scan are themselves sideways. Therefore, the correction below is based on the upright reading direction of figures, registers, and inscriptions in the plate, rather than on the raw PDF page orientation.

## Result

- 21 attested unique relief texture sets were checked against their cited Naville scan pages.
- 7 contextual aliases reuse those attested texture sets and inherit the same correction.
- 6 interpretive/generated sanctuary texture sets were retained in their designed orientation.
- No horizontal mirror is required for any attested set.
- All spatial PBR maps are rotated together. Tangent-space normal maps are regenerated from the corrected height maps so lighting remains physically coherent.
- Relief panels preserve the corrected source-image aspect ratio in Three.js instead of stretching the image to fill the wall bounding box.

## Verified orientation corrections

| Texture set | Naville scan page | Correction from project source texture | Horizontal mirror |
|---|---:|---:|---|
| `sed_royal_kiosk` | 107 | 180° | No |
| `sed_multi_register_01` | 100 | 90° CW | No |
| `sed_multi_register_02` | 101 | 90° CW | No |
| `sed_procession_fragment` | 91 | 90° CW | No |
| `sed_figures_and_text` | 94 | 0° | No |
| `sed_kiosk_fragment` | 95 | 90° CW | No |
| `sed_offering_registers` | 97 | 90° CW | No |
| `sed_ritual_objects` | 104 | 0° | No |
| `sed_boat_or_emblem` | 105 | 90° CW | No |
| `sed_divine_figures` | 109 | 90° CW | No |
| `sed_long_register` | 110 | 0° | No |
| `sed_grouped_deities` | 112 | 90° CW | No |
| `sed_seated_and_standing` | 113 | 90° CW | No |
| `sed_processional_group` | 116 | 90° CW | No |
| `sed_offering_bands` | 117 | 90° CW | No |
| `sed_small_fragments` | 119 | 180° | No |
| `sed_kiosk_procession_02` | 122 | 0° | No |
| `sed_ritual_group_03` | 123 | 90° CW | No |
| `sed_deity_rows` | 126 | 90° CW | No |
| `sed_deity_inventory` | 127 | 90° CW | No |
| `sed_large_composite` | 129 | 180° | No |

## Scan-orientation caveat

The raw PDF pages are not consistently upright. In particular, the audit had to normalize the scan orientation of pages 107, 110, 119, and 129 before comparing the extracted reliefs. This is why simply rotating every image to match the raw PDF viewport would produce incorrect wall scenes.

## Implementation notes

The reproducible correction utility is:

`scripts/fix-relief-orientation.py`

It is idempotent: it compares the correction already recorded in the relief manifest against the desired correction and applies only the rotation delta. It updates both manifest metadata and texture dimensions. Normal maps are rebuilt from the corrected height data whenever a spatial rotation is applied.

The runtime manifest records:

- `referenceOrientationCorrectionDeg`
- `referenceOrientationDirection`
- `horizontalMirror`
- `orientationAudit`
- `textureResolution`

These fields make future visual audits traceable and reduce the risk of reintroducing scan-orientation errors.
