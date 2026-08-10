#!/usr/bin/env python3
"""Normalize relief texture orientation against Naville's published plates.

The source scans include plates printed sideways. Earlier derived textures preserved
that scan orientation for many relief sets. This script rotates the complete PBR set
and regenerates tangent-space normal maps from the corrected height maps.

Rotation values are degrees clockwise in image space.
"""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "bastet-threejs-tour" / "assets" / "reliefs-v2"
MANIFEST_JSON = ASSET_DIR / "manifest.json"
MANIFEST_JS = ASSET_DIR / "manifest.js"

# Verified against the upright reading orientation of the corresponding Naville plates.
# No horizontal mirroring is required for any attested source set.
ROTATION_CW = {
    "sed_royal_kiosk": 180,
    "sed_multi_register_01": 90,
    "sed_multi_register_02": 90,
    "sed_procession_fragment": 90,
    "sed_figures_and_text": 0,
    "sed_kiosk_fragment": 90,
    "sed_offering_registers": 90,
    "sed_ritual_objects": 0,
    "sed_boat_or_emblem": 90,
    "sed_divine_figures": 90,
    "sed_long_register": 0,
    "sed_grouped_deities": 90,
    "sed_seated_and_standing": 90,
    "sed_processional_group": 90,
    "sed_offering_bands": 90,
    "sed_small_fragments": 180,
    "sed_kiosk_procession_02": 0,
    "sed_ritual_group_03": 90,
    "sed_deity_rows": 90,
    "sed_deity_inventory": 90,
    "sed_large_composite": 180,
}

# Contextual aliases reuse the source texture files, so their sourceId correction applies.
PBR_KEYS = ("color", "stone", "height", "roughness", "alpha", "ao")


def rotate_image(path: Path, deg: int) -> None:
    if deg == 0 or not path.exists():
        return
    with Image.open(path) as im:
        if deg == 90:
            out = im.transpose(Image.Transpose.ROTATE_270)
        elif deg == 180:
            out = im.transpose(Image.Transpose.ROTATE_180)
        elif deg == 270:
            out = im.transpose(Image.Transpose.ROTATE_90)
        else:
            raise ValueError(f"Unsupported rotation {deg}")
        out.save(path, optimize=True)


def rebuild_normal(height_path: Path, normal_path: Path, strength: float = 0.50) -> None:
    """Rebuild tangent-space normal map using the convention already used by this tour.

    Existing project maps correlate with nx=-dH/dx and ny=+dH/dy in image coordinates.
    Sobel strength ~0.5 closely reproduces the original maps while guaranteeing that
    normal direction follows the newly rotated height data.
    """
    h = np.asarray(Image.open(height_path).convert("L"), dtype=np.float32) / 255.0
    dx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3)
    dy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3)
    nx = -strength * dx
    ny = strength * dy
    nz = np.ones_like(nx)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack((nx / length, ny / length, nz / length), axis=-1)
    rgb = np.clip((normal * 0.5 + 0.5) * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(rgb, "RGB").save(normal_path, optimize=True)


def rel_path(value: str | None) -> Path | None:
    if not value:
        return None
    return ASSET_DIR / Path(value).name


def main() -> None:
    manifest = json.loads(MANIFEST_JSON.read_text(encoding="utf-8"))
    by_id = {entry["id"]: entry for entry in manifest}

    # Rotate each unique physical texture set only by the delta between the current
    # recorded correction and the desired correction. This makes the script safe to
    # re-run and also lets future audits change a correction without starting over.
    touched: set[str] = set()
    changed: set[str] = set()
    for source_id, desired_deg in ROTATION_CW.items():
        entry = by_id[source_id]
        color_path = rel_path(entry.get("color"))
        if color_path is None:
            continue
        stem = color_path.name.removesuffix("_color.png")
        if stem in touched:
            continue
        touched.add(stem)
        current_deg = int(entry.get("referenceOrientationCorrectionDeg", 0) or 0) % 360
        delta_deg = (desired_deg - current_deg) % 360
        if delta_deg:
            changed.add(stem)
            for key in PBR_KEYS:
                p = rel_path(entry.get(key))
                if p and p.exists():
                    rotate_image(p, delta_deg)
            height_path = rel_path(entry.get("height"))
            normal_path = rel_path(entry.get("normal"))
            if height_path and normal_path and height_path.exists():
                rebuild_normal(height_path, normal_path)

    # Record the audit in every manifest entry, including contextual aliases.
    for entry in manifest:
        source_id = entry.get("sourceId") or entry["id"]
        deg = ROTATION_CW.get(source_id, 0)
        entry["referenceOrientationCorrectionDeg"] = deg
        entry["referenceOrientationDirection"] = (
            "CW" if deg == 90 else "HALF_TURN" if deg == 180 else "CCW" if deg == 270 else "NONE"
        )
        entry["horizontalMirror"] = False
        if entry.get("sourcePage"):
            entry["orientationAudit"] = (
                f"Aligned to the upright reading orientation of Naville scan page "
                f"{entry['sourcePage']}; no horizontal mirroring applied."
            )
        else:
            entry["orientationAudit"] = "Interpretive reconstruction; retained designed orientation."
        color_path = rel_path(entry.get("color"))
        if color_path and color_path.exists():
            with Image.open(color_path) as im:
                entry["textureResolution"] = [im.width, im.height]

    payload = json.dumps(manifest, ensure_ascii=False, indent=2)
    MANIFEST_JSON.write_text(payload + "\n", encoding="utf-8")
    MANIFEST_JS.write_text("export const RELIEF_ASSETS = " + payload + ";\n", encoding="utf-8")
    print(
        f"Audited {len(touched)} unique attested relief texture sets; "
        f"applied orientation deltas to {len(changed)} set(s)."
    )


if __name__ == "__main__":
    main()
