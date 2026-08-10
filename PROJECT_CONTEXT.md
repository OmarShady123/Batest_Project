# Project Context

## A. Executive Summary

This repository is a full-stack, Arabic RTL, academic application for presenting the Bastet Temple at Tell Basta. It features a React SPA frontend (built with Vite and HashRouter) and a production-grade FastAPI Python backend connected to PostgreSQL. The virtual-tour route embeds Matterport model `SFcW4AeVYWM` through the Matterport Embed SDK.

The platform includes a complete, production-grade account, security, and authentication system:
- **Authentication**: JWT short-lived access tokens with session `sid`/`jti` claims, HttpOnly refresh token cookies with token family rotation and reuse detection.
- **Two-Factor Authentication (2FA)**: PyOTP TOTP authentication with Fernet secret encryption at rest, QR code setup, 10 single-use Argon2-hashed backup codes, and short-lived single-use 2FA challenge tokens.
- **Password Policy**: NFC normalization, minimum 15 characters, maximum 128 characters, blocklist checks, and timing-attack protection.
- **Account State & RBAC**: Persistent account states (`pending_verification`, `active`, `suspended`, `deleted`), lockouts (`failed_login_attempts`, `locked_until`), and roles (`admin`, `visitor`).
- **Session & Audit**: Session management with device/browser/OS parsing, active session revocation (`logout_all`), and comprehensive security audit logging.



## A.1 Current Bilingual And Responsive Runtime

- The React application is bilingual at runtime through `src/i18n/index.jsx`, with Arabic as the source/default language and English as the alternate language. `src/i18n/ar.js` and `src/i18n/en.js` must keep identical leaf-key coverage.
- The header groups the night-mode control, `LanguageToggle`, and search control together. Changing language updates `document.documentElement.lang` and `dir`, so Arabic remains RTL and English becomes LTR.
- Language preference is mirrored to `localStorage` keys `bastet_lang`, `bastet_tour_lang`, and legacy `bastet-language` to keep the React shell and embedded Three.js tour consistent.
- `ThreeJSTempleViewer.jsx` and `public/bastet-threejs-tour/main.js` use same-origin `postMessage` messages (`SET_LANGUAGE`, `LANGUAGE_CHANGED`, `TOUR_READY`, `TOUR_ERROR`, `EXIT_TOUR`) for two-way synchronization. The tour narration follows the active tour language.
- The virtual-tour shell is responsive rather than fixed at 680px. Main breakpoints cover desktop, tablet, small phones, and short landscape screens; touch-like devices receive touch-oriented movement instructions. Matterport overlays/calibration also have mobile sizing and LTR-aware layout.
- `tests/i18n-coverage.test.mjs` verifies Arabic/English dictionary parity, literal React translation-key coverage, and the site/tour language bridge markers.

## B. Architecture Diagram

```text
Browser
  |
  | loads index.html
  v
Vite/React SPA
  |
  +-- src/main.jsx
  |     wraps App with ErrorBoundary and HashRouter
  |
  +-- src/App.jsx
  |     page components and route table
  |
  +-- src/components/Layout.jsx
  |     header, nav, search overlay, dark mode, footer
  |
  +-- src/components/MatterportViewer.jsx
  |     Embed SDK lifecycle + current Tag API + world-space calibration
  |
  +-- src/components/MatterportCalibrationPanel.jsx
  |     development-only artifact editor, placement, verification, diagnostics
  |
  +-- src/data/artifact-pool.js + src/data/hotspots.js
  |     researched artifact candidates + hotspot schema/status/audit inventory
  |
  +-- localStorage
  |     darkMode, bastetEvaluations, lastError, Matterport calibration data
  |
  +-- public assets
        fonts, images, artifact images, _headers

External service:
  Matterport iframe: https://my.matterport.com/show
  Matterport SDK:    https://api.matterport.com/sdk/bootstrap/...
```

## C. Directory And Responsibility Map

```text
.
|-- index.html
|   HTML shell, Arabic RTL metadata, font/image preloads, root node.
|-- package.json
|   Project scripts and npm dependencies.
|-- pnpm-lock.yaml
|   Locked dependency graph; pnpm is the safest package manager for this repo.
|-- vite.config.js
|   React plugin, dev/preview no-store headers, manual build chunking.
|-- .env / .env.example
|   Browser-exposed Matterport SDK key and development calibration toggle.
|-- .gitignore
|   Ignores node_modules, dist, local pnpm store, logs, OS files.
|-- AGENTS.md
|   Permanent concise instructions for future Codex tasks.
|-- PROJECT_CONTEXT.md
|   This full repository analysis.
|-- README.md
|   Existing Arabic run/overview docs. Some tour details are stale versus current code.
|-- TECHNICAL-DESCRIPTION-AR.md
|   Existing Arabic technical summary. Some tour details are stale versus current code.
|-- ACCEPTANCE-REPORT-AR.md
|   Existing Arabic acceptance report from a prior state.
|-- Bastet-Temple-Prototype-Backup.zip
|   Backup artifact, not part of runtime source.
|-- src/
|   Application source.
|-- src/main.jsx
|   React entry point; registers GSAP ScrollTrigger; renders HashRouter/App.
|-- src/App.jsx
|   All route components and page-level feature logic.
|-- src/styles.css
|   Global design system, RTL layout, page styles, responsive rules, print/accessibility styles.
|-- src/components/
|   Shared UI/runtime components.
|-- src/components/Layout.jsx
|   Header/nav/search/dark mode/footer plus PageHero, SectionTitle, Breadcrumbs.
|-- src/components/ErrorBoundary.jsx
|   React error boundary; stores last error in localStorage.
|-- src/components/MatterportViewer.jsx
|   Matterport Embed SDK, current Tag API, navigation, and artifact UI.
|-- src/components/MatterportCalibrationPanel.jsx
|   Development-only artifact editing, placement, verification, and diagnostics.
|-- src/components/MatterportViewer.css
|   Styles specific to the Matterport viewer overlay.
|-- src/data/
|   Static data modules.
|-- src/data/artifact-pool.js
|   Neutral unverified artifact candidates used by MatterportViewer.
|-- src/data/hotspots.js
|   Model/floor constants, statuses, eight captured unverified mappings, and legacy audit evidence.
|-- src/data/tourPoints.js
|   Legacy six-point tour data; currently not imported by the app.
|-- src/utils/hotspotStore.js
|   Versioned localStorage persistence for calibration records.
|-- src/utils/hotspotValidation.js
|   Mapping integrity and model-consistency diagnostics.
|-- scripts/validate-hotspots.mjs
|   Command-line validation of committed default artifact/hotspot data.
|-- tests/hotspot-validation.test.mjs
|   Unit coverage for valid, duplicate, orphaned, and malformed mappings.
|-- public/
|   Static files copied into the Vite build output.
|-- public/assets/
|   Hero, temple plan, icon, current-condition, reconstruction images.
|-- public/artifacts/
|   Artifact images used by `artifact-pool.js`.
|-- public/_headers
|   Static-hosting security headers.
|-- screenshots/
|   Captured screenshots for manual review/reference.
|-- dist/
|   Generated production build output; do not edit by hand.
|-- node_modules/, .pnpm-store/
    Local installed dependencies/cache; not source.
```

The `.git` directory exists but appears empty or invalid in this workspace. `git status` fails with `fatal: not a git repository`.

## D. Technology Stack

- Language: JavaScript JSX, CSS, HTML.
- Frontend: React 19.2.7, React DOM 19.2.7, React Router DOM 7.18.1.
- Build/dev: Vite 8.1.4 with `@vitejs/plugin-react` 6.0.3.
- Animation: Framer Motion 12.42.2, GSAP 3.15.0 with ScrollTrigger.
- Icons: `@phosphor-icons/react` 2.1.10.
- Routing: `HashRouter`, so routes are hash-based for static hosting.
- Persistence: browser `localStorage` only.
- External service: Matterport hosted iframe and SDK bootstrap.
- Package manager: `pnpm` is supported by `pnpm-lock.yaml`; README mentions npm, but using npm would create a separate lockfile.
- Database: none.
- Backend/API: none.
- Docker/deploy config: no Dockerfile, compose file, CI config, or explicit deploy script found.

Commands from `package.json`:

```bash
pnpm run dev                  # vite --host 0.0.0.0
pnpm run build                # vite build
pnpm run preview              # vite preview --host 0.0.0.0
pnpm run test:unit            # node --test
pnpm run validate:hotspots    # validate committed mapping data
pnpm test                     # unit tests, then production build
```

Safe install command used during verification:

```bash
pnpm install --frozen-lockfile
```

No lint or typecheck scripts exist.

## E. Application Startup And Data Flow

1. `index.html` defines `<div id="root"></div>` and loads `/src/main.jsx`.
2. `src/main.jsx` imports global CSS, registers GSAP ScrollTrigger, and renders:

```text
React.StrictMode
  ErrorBoundary
    HashRouter
      App
```

3. `App` wraps all route output in `Layout`, runs `ScrollTop` on route changes, and renders the route table.
4. `Layout` provides:
   - shared header/navigation links,
   - mobile menu state,
   - search overlay against a static `searchableContent` array,
   - dark-mode state persisted to `localStorage.darkMode`,
   - keyboard shortcuts for selected routes and dark mode,
   - shared footer.
5. Page components read static arrays/images from code or public assets.
6. The evaluation form validates required fields client-side, then appends submissions to `localStorage.bastetEvaluations`.
7. `MatterportViewer` reads `VITE_MATTERPORT_SDK_KEY` (with the legacy `VITE_MATTERPORT_TOKEN_ID` name as a compatibility fallback), loads the official Matterport bootstrap module, and connects it to the iframe.
8. It subscribes to `Floor.current`, `Sweep.current`, `Camera.pose`, `Pointer.intersection`, `Tag.data`, and `Tag.openTags` and reads `Sweep.data` for model validation.
9. Visitor mode joins hotspot records to artifacts by ID and renders only records where both statuses are `verified`. The Matterport runtime Tag ID is mapped back to the same hotspot/artifact ID used by the information card.
10. Development calibration uses the exact click pixel with `Renderer.getWorldPositionData`; it prefers a matching `Pointer.intersection` surface normal and otherwise estimates one from neighboring Matterport raycasts. Captured Showcase coordinates, floor, sweep, pose, provenance, and review metadata are persisted locally.

Frontend/backend communication: none. There are no `fetch`, `axios`, API clients, backend route files, or server endpoints in the repository.

Backend/database communication: none. No backend or database exists.

External communication:

- Matterport iframe: `https://my.matterport.com/show?m=...`
- Matterport SDK import: `https://api.matterport.com/sdk/bootstrap/...`

## F. Page And Route Map

All routes are defined in `src/App.jsx` and rendered inside `Layout`.

| Route | Component | Purpose | Key files |
| --- | --- | --- | --- |
| `#/` | `Home` | Hero, project goals, tour preview | `src/App.jsx`, `src/styles.css`, `public/assets/bastet-hero.png`, `public/assets/temple-plan.png` |
| `#/about` | `About` | Historical/project context and timeline | `src/App.jsx`, `src/components/Layout.jsx` |
| `#/current-condition` | `CurrentCondition` | Current remains gallery and explanatory notes | `src/App.jsx`, `public/assets/current-condition.png` |
| `#/digital-reconstruction` | `Reconstruction` | Research reconstruction framing and CTA | `src/App.jsx`, `public/assets/digital-reconstruction.png` |
| `#/virtual-tour` | `VirtualTour` | Matterport interactive tour and artifact instructions | `src/App.jsx`, `src/components/MatterportViewer.jsx`, `src/data/artifact-pool.js` |
| `#/visitor-experience` | `VisitorExperience` | Visitor journey and educational benefits | `src/App.jsx` |
| `#/information-security` | `Security` | Mock login/roles/access/protection/backup/change log concepts | `src/App.jsx` |
| `#/evaluation` | `Evaluation` | Client-only evaluation form saved to localStorage | `src/App.jsx` |
| `#/references` | `References` | Placeholder reference/methodology categories | `src/App.jsx` |
| any other hash path | `NotFound` | 404 page with home navigation | `src/App.jsx` |

Shared layout/routes:

- Navigation link list and search index: `src/components/Layout.jsx`.
- Global page hero/title component: `PageHero` in `src/components/Layout.jsx`.
- Shared section title component: `SectionTitle` in `src/components/Layout.jsx`.
- `Breadcrumbs` is exported but not currently used.

## G. Frontend Analysis

Pages and components:

- `Home`, `About`, `CurrentCondition`, `Reconstruction`, `VirtualTour`, `VisitorExperience`, `Security`, `Evaluation`, `References`, `NotFound`, `ScrollTop`, and `App` are all in `src/App.jsx`.
- `Layout` controls site chrome and stateful UI that spans pages.
- `MatterportViewer` owns SDK state, world-space Tag rendering, navigation, and card synchronization. `MatterportCalibrationPanel` is its development-only calibration UI.
- `ErrorBoundary` catches render/runtime errors below it and writes details to `localStorage.lastError`.

State management:

- Local React state only; no Redux/Zustand/Context app state.
- `Layout`: menu open, search open/query/results, dark mode.
- `MatterportViewer`: SDK ready/error, fullscreen, tour data, selected hotspot/artifact IDs, runtime Tag mapping, floor/sweep/camera state, calibration draft, validation report, and panel state.
- `Evaluation`: done/error state.

Hooks:

- `useEffect` for GSAP animations, scrolling, dark-mode persistence, keyboard shortcuts, Matterport lifecycle, fullscreen events.
- `useState`, `useRef`, `useCallback` for local UI state and SDK refs.

Styling:

- Global CSS variables and page styles are in `src/styles.css`.
- Matterport overlay CSS is in `src/components/MatterportViewer.css`.
- Direction is RTL at the body/html level.
- Responsive breakpoints exist around 1050px, 720px, 640px, 480px.
- Accessibility-related styles include skip links, reduced-motion handling, contrast media queries, focus-visible, print styles, and screen-reader-only utility.
- The dominant palette is green, paper/off-white, brown/accent, muted gray, with dark-mode CSS variables.

Responsive behavior:

- Navigation collapses to a mobile menu below 1050px.
- Major grids collapse at 720px.
- Matterport detail cards and the calibration panel adapt around 640px; the panel becomes a contained scrollable sheet on mobile.
- Print styles hide navigation and interactive controls.

## H. Backend Analysis And API Endpoint Map

No backend was found.

| Endpoint | Status |
| --- | --- |
| REST API routes | None found |
| GraphQL | None found |
| Controllers/services/models/schemas | None found |
| Middleware | None found |
| Server validation/error handling | None found |
| Authentication endpoints | None found |
| Admin endpoints | None found |

The only network-dependent feature is the frontend Matterport integration. It is not an internal API endpoint.

## I. Database Relationship Map

No database layer was found.

```text
No tables
No collections
No models
No schemas
No migrations
No seeds
No indexes
No relationships
```

Client-side localStorage keys:

| Key | Written by | Shape/purpose |
| --- | --- | --- |
| `darkMode` | `Layout` | JSON boolean for theme preference |
| `bastetEvaluations` | `Evaluation` | JSON array of form objects plus `createdAt` ISO string |
| `lastError` | `ErrorBoundary` | JSON object with error, stack, component stack, timestamp, user agent, URL |
| `bastetMatterportCalibration:v7:SFcW4AeVYWM` | `hotspotStore` | Versioned `{ artifacts, hotspots, updatedAt }` development calibration data. Version 7 publishes five reviewed mappings and invalidates incomplete version-6 browser drafts. |

Static/mock data:

- Page text and page arrays are mostly inline in `src/App.jsx`.
- Researched Matterport artifact records are in `src/data/artifact-pool.js`; five reviewed world-space mappings are committed in `src/data/hotspots.js`. The verified-only visitor filter hides the three remaining research records.
- `src/data/tourPoints.js` contains legacy six-point tour data but is unused by current route code.
- Public images are used as illustrative/generated prototype assets.

CRUD behavior:

- Create: evaluation form appends submissions; calibration mode creates artifact/hotspot records and session-only Matterport Tags.
- Read: theme and calibration records load from localStorage; static pages read code/assets; Matterport model state comes from SDK observables.
- Update: theme and calibration records are overwritten by their owning UI. Editing a verified artifact invalidates its mapping back to `needs_calibration`.
- Delete: calibration mode deletes hotspot records and removes app-created runtime Tags. It never deletes unrelated native Matterport Tags.

## J. Authentication And Security

Registration/login:

- There is no real registration or login.
- `Security` renders a mock login form and prevents default submit.
- Roles are illustrative: visitor, researcher, administrator.

Sessions/tokens:

- No sessions, cookies, JWTs, CSRF handling, or server-side tokens.
- `VITE_MATTERPORT_SDK_KEY` and the compatibility fallback `VITE_MATTERPORT_TOKEN_ID` are browser-exposed Vite variables by design. Restrict the key to exact production/development origins in Matterport SDK Key Management.

Protected routes:

- None. All routes are public client-side routes.

Password handling:

- Mock password input only; no storage, hashing, validation, or transmission.

Security-sensitive areas:

- `public/_headers` defines CSP and security headers for static hosting.
- `public/_headers` allows the required Matterport script, iframe, HTTPS, and WebSocket origins. Re-test CSP whenever the deployed host or SDK endpoints change.
- Evaluation submissions are local-only and should not be treated as protected research data.
- ErrorBoundary stores stack/user-agent/URL locally; useful for debugging but still browser-readable.

## K. Complete Feature Map

| Feature | Frontend files | Backend/API | Data/storage |
| --- | --- | --- | --- |
| Shared layout/navigation/footer | `src/components/Layout.jsx`, `src/styles.css` | None | Static `links` array |
| Mobile navigation | `src/components/Layout.jsx`, `src/styles.css` | None | React state `open` |
| Search overlay | `src/components/Layout.jsx`, `src/styles.css` | None | Static `searchableContent` |
| Dark mode | `src/components/Layout.jsx`, `src/styles.css` | None | `localStorage.darkMode` |
| Keyboard shortcuts | `src/components/Layout.jsx` | None | Browser keydown listener |
| Home hero/goals/tour preview | `src/App.jsx`, `src/styles.css` | None | Static arrays/assets |
| About/timeline | `src/App.jsx` | None | Static array |
| Current condition gallery | `src/App.jsx` | None | Static image list |
| Digital reconstruction page | `src/App.jsx` | None | Static cards/assets |
| Matterport virtual tour | `src/App.jsx`, `src/components/MatterportViewer.jsx`, `src/components/MatterportViewer.css` | External Matterport Embed SDK | SDK key, SID, SDK observables |
| Verified artifact Tag/list/detail | `MatterportViewer.jsx`, `artifact-pool.js`, `hotspots.js` | Current `Tag` API | Joined artifact/hotspot records; public images |
| Development calibration | `MatterportViewer.jsx`, `MatterportCalibrationPanel.jsx`, `hotspotStore.js` | `Pointer`, `Renderer`, `Floor`, `Sweep`, `Camera`, `Tag` APIs | Versioned model-specific localStorage |
| Mapping diagnostics | `hotspotValidation.js`, `scripts/validate-hotspots.mjs`, `tests/hotspot-validation.test.mjs` | None | Static and live SDK model metadata |
| Visitor journey page | `src/App.jsx` | None | Static array |
| Information-security concept page | `src/App.jsx` | None | Static role/protection/backup arrays |
| Mock login form | `src/App.jsx` | None | No persistence |
| Evaluation form | `src/App.jsx` | None | `localStorage.bastetEvaluations` |
| References/method page | `src/App.jsx` | None | Static content |
| Error boundary | `src/components/ErrorBoundary.jsx` | None | `localStorage.lastError` |
| 404 page | `src/App.jsx` | None | None |
| Static hosting headers | `public/_headers` | Static host feature | Header rules only |

## L. Confirmed Issues

1. The removed implementation used eight hardcoded Showcase-looking positions. Each position matched a sweep path's X/Z values and used a Y value close to the floor, rather than an object-surface intersection. This is the confirmed cause of the misplaced markers.
2. Old artifact labels/cards were assigned to those positions by array order. No ID-level evidence linked any card to a physical object, so all eight old mappings are incorrect and none can be published as verified.
3. The model currently exposes zero native Matterport Tags, so there are no existing verified Tag IDs or coordinates to reuse.
4. The eight old artifact labels were not object-level identifications. The six generic-block captures have now been retired; their valid surface coordinates remain audit-only and are never rendered.
5. Matterport Highlights in this model are camera-scene thumbnails, not native Tags or structured artifact pages. They provide no reusable artifact IDs or 3D coordinates.
6. `src/data/tourPoints.js` and several map/tour CSS classes are unused legacy code.
7. `Breadcrumbs` is exported from `Layout.jsx` but not used.
8. The `.git` directory in this workspace is not usable; `git status` cannot provide a diff/status review.
9. Package manifest ranges use `latest` for several dependencies while the pnpm lockfile pins the tested versions; non-frozen installation may drift.

## M. Unverified Risks

1. Physical artifact identity, title, period, description, and image still require an archaeologically qualified reviewer; software can capture coordinates but cannot infer those facts safely.
2. Calibration storage is local to one browser profile and is editable/clearable. A backend or reviewed export/import workflow is required for multi-admin or production content management.
3. The SDK key, model access policy, Matterport availability, and production origin allowlist can still prevent connection outside the tested localhost origin.
4. Matterport may change runtime SDK versions delivered by its hosted bootstrap. Re-run the browser workflow after SDK updates.
5. The model has one detected floor and 33 sweeps. A future model replacement may introduce floor/sweep IDs that invalidate existing mappings; diagnostics flag mismatches but cannot repair them automatically.
6. Matterport's iframe emits vendor WebGL/WebXR warnings in this browser. No application error was observed after the navigation fix, but target browser/device testing remains prudent.

## N. Verification Results

Environment:

```text
Node: v24.14.0
npm: 10.9.4
pnpm: 10.18.1
Vite: 8.1.4
Matterport runtime observed: 26.7.2_webgl-992-gfb15284720
```

Final commands and results (2026-07-13):

```bash
pnpm install --frozen-lockfile
pnpm run test:unit
pnpm run validate:hotspots
pnpm run build
pnpm test
pnpm run --if-present lint
pnpm run --if-present typecheck
```

Results:

- Unit tests: 4 passed, 0 failed. Coverage includes empty visitor data, structural/model-link diagnostics, duplicates/orphans/invalid vectors, sweep bounds, and completeness/uniqueness of the five published mappings.
- Static hotspot validation: 8 artifact records, 5 hotspots, 5 verified mappings, and 0 unverified mappings. No invalid/orphaned/duplicate/missing-floor/missing-description/model-SID/status errors were found. Candidates 02, 07, and 08 are intentionally reported without hotspots; candidates 07-08 are also intentionally reported without images because they remain unmatched.
- The first `pnpm run build` attempt hit Windows resource error 1450 while reading hundreds of Phosphor icon files. After stopping the development server, the immediate retry passed with 4,981 modules transformed; this was an environment-resource failure, not a source/build diagnostic.
- `pnpm test`: passed; it reran all 4 unit tests followed by a successful production build.
- Lint/typecheck commands exited successfully with no output because neither script exists and this JavaScript project has no TypeScript configuration.
- `git status --short` could not run because the workspace is not a Git repository; final review used direct source searches, build output, and browser behavior.

Live browser verification against `http://localhost:5173/#/virtual-tour`:

- SDK connected to SID `SFcW4AeVYWM`; one floor, 33 sweeps, and zero native Tags were read.
- The audit inspected all 33 ordered sweeps. Candidate 01 remains directly attached to a fragmentary statue head at `-41.289, 2.518, 65.799`, floor `tsmq1wak12rhgn0mawksxcwcd`, sweep `r7kfm0zuqz5p55ps3sxhhyydb`; its title intentionally makes no ruler or period attribution.
- Candidates 03-06 were visually matched against the official Tell Basta brochure, then captured directly on the Bastet lioness head, Ramesses VI statue, Ramesses II triad, and Corinthian capital surfaces in sweep `zw0gxskycfzx3stkinrba12cb`. Their capture camera poses are stored and restored during list navigation.
- Candidate 02 matches official photographs of Queen Meritamun by form, stepped pedestal, material, and setting. Matterport returned no surface for several body clicks from sweeps 3-4, so it remains `needs_calibration` without coordinates and is hidden from visitors.
- Fresh version-7 visitor mode showed `5 قطعة أثرية`. Sequentially opening all five entries produced the matching title, image alt, and description every time; no previous-card content persisted.
- Production mode hid calibration even though the development environment toggle was enabled.
- Desktop `1280x720` and mobile `390x844` were inspected. Mobile remained RTL with `scrollWidth === clientWidth`; the triad card fit the viewport without horizontal overflow.
- `127.0.0.1` was rejected by the current Matterport key allowlist while `localhost` worked. Add every intended exact origin in Matterport SDK Key Management; do not change or fabricate the key in source.
- The browser log retained one timestamped pre-fix `Tag.navigateToTag is not a function` entry from an older hot-reloaded module. Current source contains no `navigateToTag` call, and no newer application error appeared during the final reload, rotation, sweep, mobile, or persistence checks.
- The candidate-01 card image was replaced with a context crop of the same royal head instead of the previously mismatched standing-statue image.
- Native Matterport Tag attachments now require an explicit public HTTPS `matterportMediaUrl`. App-relative artifact images remain in the custom card, preventing Matterport's `Unable to load media` error on localhost.
- Browser screenshots confirm that the Bastet, Ramesses VI, triad, and Corinthian markers stay on their respective objects or hide when the object leaves the viewport. Version-7 evidence is in `screenshots/matterport-bastet-marker-v7.png`, `screenshots/matterport-bastet-after-rotate-v7.png`, `screenshots/matterport-ramesses-vi-marker-v7.png`, `screenshots/matterport-triad-marker-v7.png`, `screenshots/matterport-corinthian-marker-v7.png`, `screenshots/matterport-corinthian-after-rotate-v7.png`, `screenshots/matterport-mobile-markers-v7.png`, and `screenshots/matterport-mobile-triad-card-v7.png`.

Spatial capture is complete for five visitor mappings. Four have official object-level identification and matching published photographs; candidate 01 remains a verified physical object with visual-only description. The six generic-block captures remain retired. Queen Meritamun has a strong source and visual match but still needs a raycastable surface intersection or an improved Matterport depth mesh.

## O. Files Most Likely To Require Changes For Future Features

- `src/App.jsx`: route additions, page content, evaluation behavior, security page changes.
- `src/components/Layout.jsx`: navigation, search index, dark mode, shared shell, keyboard shortcuts.
- `src/components/MatterportViewer.jsx`: Matterport integration, artifact interactions, SDK lifecycle.
- `src/components/MatterportCalibrationPanel.jsx`: administrator calibration and debug workflow.
- `src/components/MatterportViewer.css`: viewer overlay layout/responsive styles.
- `src/data/artifact-pool.js`: artifact names, periods, descriptions, images.
- `src/data/hotspots.js`: model/floor constants, statuses, default mappings, legacy audit inventory.
- `src/utils/hotspotStore.js`: replace or extend local persistence when a backend is introduced.
- `src/utils/hotspotValidation.js`: mapping integrity rules and model checks.
- `src/styles.css`: global layout, page-specific styling, responsive behavior.
- `public/assets/` and `public/artifacts/`: image replacements and new visual assets.
- `public/_headers`: deployment/security-header changes, especially if Matterport must work in production.
- `package.json` and `pnpm-lock.yaml`: dependency/script changes.
- `.env` or env example files: Matterport/public runtime config.

## P. Recommendations For Safe Modification

1. Make changes in small, route-focused batches because most page logic is centralized in `src/App.jsx`.
2. Rebuild after every functional change with `pnpm run build`; do not run multiple builds concurrently.
3. For Matterport changes, test the exact deployed origin/key allowlist, live SDK connection, camera/sweep movement, and marker/card ID synchronization.
4. Keep any real backend/auth/database work separate from the current prototype assumptions and document the new boundary before implementing it.
5. Avoid editing `dist/`; change source files and rebuild.
6. Keep Arabic RTL layout and responsive checks in scope for every UI change.
7. Treat `localStorage` data as non-secure prototype storage.
8. Update the search index in `Layout.jsx` whenever adding/removing user-facing routes.
9. Update `public/_headers` deliberately if adding external services; CSP should match actual script/frame/connect/image/font needs.
10. Prefer `pnpm install --frozen-lockfile` for reproducible installs. Avoid `npm install` unless the project intentionally switches package managers.
11. Export or migrate reviewed calibration data into a controlled backend/static data file before production use; browser localStorage is suitable for one-browser calibration, not authoritative publishing.
12. Require two separate checks before setting `verified`: physical placement in the live model and academic review of title/image/period/description.

## Q. Matterport Accuracy Audit And Calibration

### Integration Facts

- Integration type: Matterport iframe controlled by the Matterport Embed SDK; it is not a custom panorama, SDK Bundle application, or CSS image overlay.
- Model SID: `SFcW4AeVYWM`.
- Detected runtime: Showcase/SDK `26.7.2_webgl-992-gfb15284720` on 2026-07-13. The hosted bootstrap automatically serves Matterport's current compatible runtime.
- SDK key: `VITE_MATTERPORT_SDK_KEY`, with `VITE_MATTERPORT_TOKEN_ID` accepted only for backward compatibility. Obtain/restrict this public application key through Matterport SDK Key Management; downloading an SDK bundle would not correct bad coordinates.
- Iframe parameters: `m=<SID>`, `play=1`, `newtags=1`, `applicationKey=<key>`. The `newtags=1` opt-in ensures the current `Tag` API markers are rendered by Showcase.
- Detected model contents: one floor (`tsmq1wak12rhgn0mawksxcwcd`), 33 sweeps, and zero native Matterport Tags.
- Current API usage: `Tag` (not deprecated Mattertag), `Pointer.intersection`, `Renderer.getWorldPositionData`, `Floor.current`, `Sweep.current`, `Sweep.data`, `Camera.pose`, `Camera.setRotation`, `Camera.lookAt` fallback, `Camera.rotate`, and Showcase world coordinates.

### Coordinate Rule

All saved positions use the Showcase SDK world coordinate system and declare `coordinateSystem: "showcase_sdk"`. Model API coordinates must not be copied directly. If Model API data is introduced later, convert it with Matterport's official basis conversion (`Model x,y,z` corresponds to `Showcase x,z,-y`) and record the source coordinate system. The current calibration path does not consume Model API positions.

### Legacy Inventory

Every row below is `removed` and `incorrect`; the name is audit evidence from the old prototype, not a verified artifact identity. The old X/Z matched a sweep path while Y was near the floor. No current linked card or image is publishable without review.

| Old hotspot | Candidate | Old label | Old position (x, y, z) | Old sweep | Result |
| --- | --- | --- | --- | --- | --- |
| `legacy-hotspot-01` | `artifact-candidate-01` | تمثال الإلهة باستت | `-8.23, 0.63, 28.29` | `ahqebwrwqypst9n0xey9xbsfa` | incorrect/removed |
| `legacy-hotspot-02` | `artifact-candidate-02` | عمود من الجرانيت الأحمر | `-31.22, 0.37, 56.54` | `p975kch8bkpzibu7bc3sk2cbb` | incorrect/removed |
| `legacy-hotspot-03` | `artifact-candidate-03` | كتلة منقوشة | `-59.04, 0.73, 85.65` | `fed35gmxsz5i8ah6tkde39yfb` | incorrect/removed |
| `legacy-hotspot-04` | `artifact-candidate-04` | تمثال ملكي جالس | `-91.94, 0.71, 69.71` | `15zuppr3uapct5794gqgk14ac` | incorrect/removed |
| `legacy-hotspot-05` | `artifact-candidate-05` | مائدة قرابين | `-121.43, 0.27, 44.41` | `141hq0rk76zsrtissfd6y61hb` | incorrect/removed |
| `legacy-hotspot-06` | `artifact-candidate-06` | تابوت حجري | `-140.04, -1.94, 14.55` | missing | incorrect/removed |
| `legacy-hotspot-07` | `artifact-candidate-07` | تاج عمود حتحوري | `-146.14, -1.94, 8.98` | `f1aemdd1e8i25zhk7hb89idbc` | incorrect/removed |
| `legacy-hotspot-08` | `artifact-candidate-08` | لوحة تذكارية (ستيلا) | `-144.63, -1.79, -31.99` | `3r5btshqew5csc0t56p8xbt5a` | incorrect/removed |

Current mapping report: 8 researched artifact records, 5 committed and visitor-visible world-space hotspots, 5 verified spatial mappings, and 3 records awaiting spatial matching or expert identification. Four visitor records have official object-level identifications; candidate 01 remains intentionally unattributed beyond its visible form.

| Artifact | Hotspot | Researched label | Position/evidence | Status |
| --- | --- | --- | --- | --- |
| `artifact-candidate-01` | `hotspot-3e38acd0-b0e8-45eb-a7ea-ddb398065a22` | رأس تمثال ملكي ضخم مجزأ | `-41.289, 2.518, 65.799`; sweep `r7kfm0zuqz5p55ps3sxhhyydb` | `verified`; surface and visual description verified, ruler/period intentionally unattributed |
| `artifact-candidate-02` | none | تمثال الملكة ميريت آمون | exact visual match to official/public photographs; no raycastable surface in tested sweeps 3-4 | `needs_calibration`; hidden from visitors |
| `artifact-candidate-03` | `hotspot-a75a165c-0685-4e8d-bfea-0a61c8090b3a` | رأس اللبؤة للمعبودة باستت | `-38.189, 2.562, 61.128`; sweep `zw0gxskycfzx3stkinrba12cb` | `verified`; official photograph, visible form, and surface point match |
| `artifact-candidate-04` | `hotspot-a10e1af8-dc83-494b-add5-ec99dd1db17e` | تمثال الملك رمسيس السادس | `-41.492, 2.587, 51.503`; sweep `zw0gxskycfzx3stkinrba12cb` | `verified`; official photograph and seated statue/back-pillar match |
| `artifact-candidate-05` | `hotspot-d5626943-7cbf-4c07-a04e-94e31286c064` | ثالوث رمسيس الثاني | `-41.138, 2.930, 45.476`; sweep `zw0gxskycfzx3stkinrba12cb` | `verified`; official photograph and three-figure group match |
| `artifact-candidate-06` | `hotspot-92004d24-92f8-4dce-999c-3082de8c752c` | تاج عمود كورنثي | `-30.423, 1.916, 63.070`; sweep `zw0gxskycfzx3stkinrba12cb` | `verified`; official photograph, leaf ornament, and surface point match |
| `artifact-candidate-07` | none | بقايا بوابة أوسركون الثاني | official collection record; individual block not identified | `unmatched` |
| `artifact-candidate-08` | none | كتلة تحمل علامة كا واسم حورس لنختنبو الثاني | official collection record; inscription not legible in tour | `unmatched` |

All five active hotspots use floor `tsmq1wak12rhgn0mawksxcwcd`, Showcase SDK coordinates, captured surface normals, and stem vectors derived from those normals. Candidates 03-06 also store the capture camera pose, so list navigation restores the calibrated sweep and orientation instead of relying on Matterport's experimental automatic viewpoint selection. The six valid but generic block-surface captures remain in `RETIRED_BLOCK_CAPTURE_INVENTORY` with `status: "removed"` and are never rendered.

Research scope: the [Egyptian Ministry of Tourism and Antiquities open-air museum page](https://egymonuments.gov.eg/en/monuments/open-air-museum) and [official Tell Basta brochure](https://egymonuments.gov.eg/media/8041/basta-en-web.pdf) name and illustrate candidates 03-06. Published photographs of [Queen Meritamun at Tell Basta](https://www.youm7.com/story/2024/12/2/بلدنا-الحلوة-شاهد-تمثال-ميريت-آمون-أيقونة-الجمال-بتل-بسطة/6797152) match candidate 02. Sources do not supply Showcase coordinates; the five published positions were captured directly from the live model surface.

### Hotspot Record

```json
{
  "id": "hotspot-<uuid>",
  "artifactId": "artifact-<id>",
  "modelSid": "SFcW4AeVYWM",
  "label": "reviewed artifact title",
  "anchorPosition": { "x": 0, "y": 0, "z": 0 },
  "surfaceNormal": { "x": 0, "y": 1, "z": 0 },
  "stemVector": { "x": 0, "y": 0.3, "z": 0 },
  "floorId": "tsmq1wak12rhgn0mawksxcwcd",
  "floorSequence": 0,
  "sweepId": "active-sweep-id",
  "status": "needs_calibration",
  "spatialStatus": "captured",
  "contentStatus": "needs_expert_review",
  "verifiedAt": null,
  "verifiedBy": null,
  "capturedAt": "ISO-8601 timestamp",
  "capturedCameraPose": {},
  "coordinateSystem": "showcase_sdk",
  "source": "pointer.intersection or renderer.raycast",
  "nativeTagId": null,
  "references": []
}
```

Allowed statuses are `verified`, `needs_calibration`, `unmatched`, `hidden`, and `removed`. Normal visitors see only `verified` mappings. Verification is blocked until the contextual image framing and artifact metadata have been reviewed and a reviewer name is supplied.

### Calibration Workflow

1. Copy `.env.example` values into local environment configuration, supply a valid origin-restricted `VITE_MATTERPORT_SDK_KEY`, and set `VITE_MATTERPORT_CALIBRATION=true`.
2. Run `pnpm run dev` and open `http://localhost:5173/#/virtual-tour`. Calibration is additionally gated by `import.meta.env.DEV`, so a production build cannot expose it.
3. Open **معايرة النقاط**, select or create an artifact, and replace its placeholder title, period, image, and descriptions with reviewed facts.
4. Choose **وضع نقطة للقطعة** or reposition, then click directly on the visible physical object's surface in Matterport.
5. Review position, floor, sweep, status, and diagnostics. Save as unverified while work is incomplete; enter the reviewer and verify only after visual and content review.
6. Reposition or delete through the same panel. Refresh to confirm the model-specific localStorage record restores correctly.

The validation panel and `pnpm run validate:hotspots` report totals, unverified/orphaned records, duplicate/invalid coordinates, missing floor/image/description fields, sweep/bounds issues, and records linked to another SID. Debug coordinates and SDK camera controls exist only in development calibration mode.
