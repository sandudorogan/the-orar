# Standalone Browser Scheduler Product Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone browser-only scheduling product in TypeScript with Bun, React, Vite, Tailwind CSS v4, and shadcn/ui, where users define classes, classrooms, teachers, and availabilities, generate schedules locally in the browser, and export the results as DOCX and Excel.

**Architecture:** Use a Bun workspace with one Vite/React application plus local packages for the native scheduling domain model, solver engine, design system, export layer, localization layer, and UI components. This product is independent from FET at the code, naming, and file-format levels; FET is reference material for use cases, edge cases, and expected feature breadth. Export dependencies and locale catalogs must stay off the initial bundle by isolating them behind dedicated packages, lazy route chunks, and dynamic imports.

**Tech Stack:** Bun workspaces, TypeScript, React, Vite, Tailwind CSS v4, shadcn/ui, Radix, IndexedDB, Web Workers, Zod, native `Intl` APIs, externalized locale catalogs, `docx`, `exceljs`, Vitest, Playwright.

---

## Product Direction

- Browser only:
  - no backend
  - no Postgres
  - no hosted job system
- Standalone product:
  - no `.fet` import/export
  - no desktop file-format parity objective
  - FET is reference material for workflow and constraint coverage, not an implementation target
  - this product should not be positioned as a rewrite or clone
- Data flow:
  - users enter scheduling entities directly in the app
  - users configure availabilities and constraints
  - the app generates schedules in-browser
  - the app exports schedules as DOCX and Excel
  - DOCX/XLSX code is loaded only when the user enters export flows or triggers an export action
  - locale catalogs are loaded only when the selected language requires them
- Implementation posture:
  - one-shot product build ambition
  - no intentionally reduced staged slice
  - feature parity with FET is a product requirement, not code-port parity
  - multilingual support is a product requirement from day one
  - ship with at least one default locale and one additional shipped locale

## What To Learn From FET

- Use cases:
  - school scheduling
  - faculty scheduling
  - teacher availability handling
  - room allocation
  - conflict inspection
  - multiple generation attempts
  - timetable views by teacher, class, and room
- Edge cases:
  - split activities
  - multiple teachers on one activity
  - multiple class groups on one activity
  - hard unavailability windows
  - preferred time and room patterns
  - impossible or near-impossible datasets
  - partial/highest-stage results
  - dense room usage and room collisions
- Data-flow lessons:
  - preprocessing is essential
  - schedule generation must not block the UI thread
  - conflicts and difficult activities need first-class UX
  - timetable output is its own product area, not a byproduct

## What Not To Carry Over From FET

- `.fet` XML compatibility
- Qt UI structure
- desktop-specific settings, dialogs, and persistence behavior
- literal port of every legacy file/export format

## Proposed Repository Structure

```text
/
  apps/
    web/
      src/
        app/
        routes/
        features/
          dashboard/
          setup/
          classes/
          teachers/
          classrooms/
          availabilities/
          activities/
          constraints/
          generate/
          timetables/
          exports/
          settings/
        shared/
        workers/
      index.html
      vite.config.ts
  packages/
    domain/
      src/
        entities/
        constraints/
        generation/
        timetable/
        validation/
        selectors/
    solver/
      src/
        preprocessing/
        heuristics/
        scoring/
        worker-api/
    exports/
      src/
        docx/
        excel/
        mappers/
    locales/
      src/
        catalogs/
        formatting/
        language-registry.ts
        message-types.ts
    design-system/
      src/
        styles/
          brand.css
          semantic.css
          components.css
          theme.css
          motion.css
    ui/
      src/
        primitives/
        patterns/
        timetable/
        forms/
        dialogs/
  docs/
    specs/
    superpowers/
      plans/
  package.json
  bunfig.toml
  tsconfig.base.json
  biome.json
  components.json
```

## Browser Delivery Guidance

- Deliver the product as static assets only.
- Host the built app on a static host or CDN.
- User data remains local to the browser unless the user explicitly backs it up or exports documents.
- Distribution options:
  - standard web app
  - optional installable PWA if Service Worker support is enabled
- Deployment concerns for planning purposes:
  - fast initial load
  - stable cache invalidation on release
  - no server-side dependency for core product use
  - locale assets should be chunked so unused languages do not bloat initial delivery

## Native Domain Model

The product should have its own vocabulary and schema instead of inheriting FET naming or serialization.

Core entities:
- `Institution`
- `ScheduleProject`
- `Calendar`
- `TimeSlot`
- `Class`
- `ClassGroup`
- `Teacher`
- `Classroom`
- `AvailabilityRule`
- `Activity`
- `Assignment`
- `Schedule`
- `GenerationRun`
- `Conflict`

Core relationships:
- classes can be split into groups
- activities can target one or more class groups
- activities can require one or more teachers
- activities can require one classroom or a compatible classroom set
- teachers, classes, and classrooms all support availability constraints

## Browser-Only Runtime Model

- Persistence:
  - IndexedDB as canonical local storage
  - versioned local schema migrations
  - manual JSON export/import for project backup if desired
  - optional File System Access API where supported
- Compute:
  - Web Worker for single generation
  - worker pool for multiple generation
  - message-based progress, partial results, and cancellation
- Offline:
  - optional Service Worker for installability and cached assets
- Localization:
  - message catalogs externalized from components
  - current locale stored in local settings
  - locale-aware formatting through native `Intl`
  - language bundles lazy-loaded where possible
- Bundle discipline:
  - export route is lazy-loaded
  - `packages/exports` is never imported by eager app-shell code
  - `packages/locales` catalogs are never all loaded eagerly by default
  - DOCX/XLSX libraries are loaded with `import()` at the export boundary

## Bundle-Splitting Rule

- Put `docx` and `exceljs` in `packages/exports/package.json`, not in the root app package.
- The web app may import only lightweight export facades in eagerly loaded code.
- Real export implementations must be behind:
  - route-level lazy loading
  - action-level dynamic imports
- Non-default locale catalogs must also be behind lazy loading or dynamic import boundaries.
- No dashboard, setup, authoring, generation, or timetable route may statically import `docx`, `exceljs`, or heavy export implementation modules.
- Add a bundle check in CI so accidental eager imports fail review quickly.

## Multilingual Rule

- All user-facing copy must be externalized from the start.
- Locale selection must be a first-class application setting.
- Dates, times, numbers, and exported document labels must be locale-aware.
- The product must ship with at least two supported locales in full v1 scope.
- Shipped features are not complete unless required messages exist for shipped locales.
- Adding a new locale should normally be a catalog-and-registry change, not a feature-refactor event.

## Design System And Tokens

### Brand Tokens

- Keep the provided palette as raw immutable tokens in `packages/design-system/src/styles/brand.css`.
- Use:
  - `--brand-ink-black-*`
  - `--brand-prussian-blue-*`
  - `--brand-dusk-blue-*`
  - `--brand-dusty-denim-*`
  - `--brand-alabaster-grey-*`

### Semantic Tokens

- Map brand tokens to semantic tokens in `semantic.css`.
- Semantic groups:
  - surface
  - text
  - border
  - action
  - feedback
  - scheduling state

Scheduling state tokens must include:
- `--status-conflict`
- `--status-unplaced`
- `--status-locked`
- `--status-generated`
- `--status-selected`

### Tailwind v4 Strategy

- Use `@import "tailwindcss"` and `@theme inline`.
- Expose semantic tokens only.
- Forbid raw palette utilities in feature code.

## shadcn Strategy

- Use shadcn as source-owned primitives.
- Generate source into `packages/ui/src/primitives`.
- Export branded compositions from `packages/ui/src/patterns`.
- App code imports only from `@orar/ui`.
- Own early:
  - `Sidebar`
  - `Table`
  - `Tabs`
  - `Dialog`
  - `Field`
  - `ScrollArea`
  - custom timetable grid components

## Export Strategy

Primary exports:
- DOCX schedule documents
- Excel schedule workbooks

Export surfaces:
- per teacher
- per class
- per classroom
- full institutional workbook/document set

The export layer should own:
- schedule-to-document mapping
- layout templates
- print-ready formatting
- localization of labels and document headings
- dynamic loading boundaries so export code stays out of the main app chunk

## Feature-Parity Inventory Rule

- Feature parity with FET must be tracked by a capability inventory, not by a generic parity claim.
- Before deep execution starts, the project needs a written coverage matrix mapping:
  - FET-inspired capability area
  - standalone product equivalent
  - support target
  - planned tests or scenario coverage
- Minimum inventory categories:
  - scheduling contexts
  - data model breadth
  - availability and resource rules
  - generation behaviors
  - conflict inspection
  - timetable views
  - export outputs
  - multilingual coverage
  - difficult/impossible dataset handling

## Scope Rule

This plan targets a complete standalone product, not a reduced compatibility slice or a thin homage app.

That means the implementation target includes:
- complete native data-entry flows
- feature parity with FET across the core scheduling surface
- availability and constraint authoring
- in-browser generation
- conflict inspection
- multiple generation attempts
- timetable views
- DOCX and Excel export

## Task 1: Bootstrap The Browser-Only Bun Workspace

**Files:**
- Create: `package.json`
- Create: `bunfig.toml`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `components.json`
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `packages/domain/package.json`
- Create: `packages/solver/package.json`
- Create: `packages/exports/package.json`
- Create: `packages/locales/package.json`
- Create: `packages/design-system/package.json`
- Create: `packages/ui/package.json`
- Create: `.github/workflows/ci.yml`

- [x] **Step 1: Initialize the Bun workspace**

Run: `bun init -y`
Expected: root `package.json` exists.

- [x] **Step 2: Convert to workspaces**

Add:
- `apps/*`
- `packages/*`

- [x] **Step 3: Create the workspace directories**

Run: `mkdir -p apps/web packages/{domain,solver,exports,locales,design-system,ui}`
Expected: workspace skeleton exists.

- [x] **Step 4: Add shared tooling**

Run: `bun add -d typescript vite vitest playwright @types/node @types/react @types/react-dom biome`
Expected: base toolchain installed.

- [x] **Step 5: Add runtime dependencies**

Run: `bun add react react-dom @tanstack/react-router zod`
Expected: browser app runtime dependencies installed without export libraries in the base bundle path.

- [x] **Step 6: Add export-package dependencies in the export package only**

Run: `cd packages/exports && bun add docx exceljs`
Expected: heavy document dependencies are isolated to the export package.

- [x] **Step 7: Add initial CI and bundle-policy scaffolding**

Include:
- typecheck/test baseline
- placeholder bundle-policy enforcement so later export work cannot silently pull heavy libraries into the initial bundle

- [x] **Step 8: Commit**

```bash
git add package.json bunfig.toml tsconfig.base.json biome.json components.json apps packages .github
git commit -m "chore: bootstrap standalone browser scheduler workspace"
```

## Task 2: Install Tailwind v4, shadcn, And The Token System

**Files:**
- Create: `packages/design-system/src/styles/brand.css`
- Create: `packages/design-system/src/styles/semantic.css`
- Create: `packages/design-system/src/styles/components.css`
- Create: `packages/design-system/src/styles/theme.css`
- Create: `packages/design-system/src/styles/motion.css`
- Create: `apps/web/src/app/styles.css`
- Create: `packages/ui/src/index.ts`

- [x] **Step 1: Install Tailwind v4 and Vite integration**

Run: `bun add -d tailwindcss @tailwindcss/vite`
Expected: Tailwind packages installed.

- [x] **Step 2: Configure Vite + Tailwind**

Wire Tailwind into `apps/web/vite.config.ts`.

- [x] **Step 3: Add the raw palette**

Put the complete provided color scales into `brand.css`.

- [x] **Step 4: Map semantic and component tokens**

Create semantic and component token files for surfaces, controls, and timetable states.

- [x] **Step 5: Initialize shadcn for the Vite app**

Run: `bunx --bun shadcn@latest init`
Expected: `components.json` points at the Vite app and Tailwind v4 global CSS.

- [x] **Step 6: Generate the first owned primitives**

Add:
- `button`
- `card`
- `dialog`
- `input`
- `select`
- `tabs`
- `table`
- `scroll-area`
- `sheet`

- [x] **Step 7: Commit**

```bash
git add components.json apps/web packages/design-system packages/ui
git commit -m "feat: add token-driven ui foundation"
```

## Task 3: Add Localization Scaffolding

**Files:**
- Create: `packages/locales/src/language-registry.ts`
- Create: `packages/locales/src/message-types.ts`
- Create: `packages/locales/src/catalogs/en.json`
- Create: `packages/locales/src/catalogs/<secondary-locale>.json`
- Create: `packages/locales/src/formatting/intl.ts`
- Create: `apps/web/src/app/i18n/provider.tsx`
- Create: `apps/web/src/app/i18n/use-i18n.ts`
- Create: `apps/web/src/app/i18n/load-locale.ts`
- Create: `apps/web/src/app/i18n/messages.ts`
- Test: `packages/locales/src/**/*.test.ts`

- [x] **Step 1: Define the locale registry and message schema**

- [x] **Step 2: Add one default locale and one additional shipped locale**

- [x] **Step 3: Add typed message access so features cannot rely on ad hoc string keys**

- [x] **Step 4: Add app-level locale provider and selection state**

- [x] **Step 5: Add lazy loading for non-default locale catalogs**

- [x] **Step 6: Add locale-aware date/time/number formatting helpers**

- [x] **Step 7: Add tests for locale loading, fallback behavior, and missing-message detection**

- [x] **Step 8: Add a CI/local verification check that detects hard-coded user-facing strings in feature code where practical**

- [x] **Step 9: Commit**

```bash
git add packages/locales apps/web/src/app/i18n
git commit -m "feat: add multilingual scaffolding"
```

## Task 4: Build The Native Scheduling Domain Model

**Files:**
- Create: `packages/domain/src/entities/institution.ts`
- Create: `packages/domain/src/entities/calendar.ts`
- Create: `packages/domain/src/entities/time-slot.ts`
- Create: `packages/domain/src/entities/class.ts`
- Create: `packages/domain/src/entities/class-group.ts`
- Create: `packages/domain/src/entities/teacher.ts`
- Create: `packages/domain/src/entities/classroom.ts`
- Create: `packages/domain/src/entities/activity.ts`
- Create: `packages/domain/src/entities/availability-rule.ts`
- Create: `packages/domain/src/entities/assignment.ts`
- Create: `packages/domain/src/entities/schedule.ts`
- Create: `packages/domain/src/entities/conflict.ts`
- Create: `packages/domain/src/entities/schedule-project.ts`
- Create: `packages/domain/src/entities/generation-run.ts`
- Test: `packages/domain/src/**/*.test.ts`

- [x] **Step 1: Model institution, calendar, and time slots**

- [x] **Step 2: Model classes and class groups**

- [x] **Step 3: Model teachers and classrooms**

- [x] **Step 4: Model activities and their resource requirements**

- [x] **Step 5: Model availabilities and schedule constraints**

- [x] **Step 6: Add entity tests**

Cover:
- split groups
- multi-teacher activities
- room compatibility
- availability invariants

- [x] **Step 7: Commit**

```bash
git add packages/domain
git commit -m "feat: add native scheduling domain model"
```

## Task 5: Build Local Persistence And History

**Files:**
- Create: `apps/web/src/shared/storage/indexeddb.ts`
- Create: `apps/web/src/shared/storage/project-store.ts`
- Create: `apps/web/src/shared/storage/history-store.ts`
- Create: `apps/web/src/shared/storage/settings-store.ts`
- Test: `apps/web/src/shared/storage/**/*.test.ts`

- [x] **Step 1: Define IndexedDB schemas for projects, runs, and settings**

- [x] **Step 2: Implement versioned migrations**

- [x] **Step 3: Add autosave and local history snapshots**

- [x] **Step 4: Add manual JSON backup/import flows**

Support explicit user backup and restore of native project files.

- [x] **Step 5: Add tests for migration, backup, and recovery**

- [x] **Step 6: Commit**

```bash
git add apps/web/src/shared/storage
git commit -m "feat: add local persistence and history"
```

## Task 6: Build The Feature-Parity Inventory And Constraint Registry

**Files:**
- Create: `docs/architecture/fet-capability-inventory.md`
- Create: `docs/architecture/standalone-coverage-matrix.md`
- Create: `packages/domain/src/constraints/registry.ts`
- Create: `packages/domain/src/constraints/teacher-availability.ts`
- Create: `packages/domain/src/constraints/class-availability.ts`
- Create: `packages/domain/src/constraints/classroom-availability.ts`
- Create: `packages/domain/src/constraints/activity-preferred-time.ts`
- Create: `packages/domain/src/constraints/activity-preferred-room.ts`
- Create: `packages/domain/src/constraints/no-overlap.ts`
- Create: `packages/domain/src/validation/project-validator.ts`
- Test: `packages/domain/src/constraints/**/*.test.ts`

- [x] **Step 1: Create the capability inventory and coverage matrix**

Document which FET-inspired capabilities map to which standalone product modules and tests.

- [x] **Step 2: Translate required use cases and edge cases into a typed constraint registry**

- [x] **Step 3: Implement first-class availability constraints**

- [x] **Step 4: Implement activity placement and resource constraints**

- [x] **Step 5: Add validation and impossible-input detection**

- [x] **Step 6: Add scenario-based tests derived from FET-style edge cases**

- [x] **Step 7: Commit**

```bash
git add packages/domain docs/architecture
git commit -m "feat: add scheduling constraint registry"
```

## Task 7: Port The Solver To Run In Web Workers

**Files:**
- Create: `packages/solver/src/worker-api/messages.ts`
- Create: `packages/solver/src/preprocessing/**`
- Create: `packages/solver/src/heuristics/**`
- Create: `packages/solver/src/scoring/**`
- Create: `apps/web/src/workers/generate.worker.ts`
- Create: `apps/web/src/workers/generate-multiple.worker.ts`
- Create: `apps/web/src/shared/generation/worker-client.ts`
- Test: `packages/solver/src/**/*.test.ts`

- [x] **Step 1: Freeze the worker message protocol**

- [x] **Step 2: Build preprocessing for clashes, availabilities, and candidate slots**

- [x] **Step 3: Implement the heuristic generation engine**

- [x] **Step 4: Add multiple-generation worker orchestration**

- [x] **Step 5: Add cancellation, partial progress, and highest-stage results**

- [x] **Step 6: Add benchmark and scenario tests**

- [x] **Step 7: Commit**

```bash
git add packages/solver apps/web/src/workers apps/web/src/shared/generation
git commit -m "feat: add in-browser schedule generation engine"
```

## Task 8: Build The Full Data-Entry Application Shell

**Files:**
- Create: `apps/web/src/app/router.tsx`
- Create: `apps/web/src/app/providers.tsx`
- Create: `apps/web/src/routes/**`
- Create: `apps/web/src/features/**`

- [x] **Step 1: Build the application shell and navigation**

- [x] **Step 2: Build classes and class-group authoring flows**

- [x] **Step 3: Build teachers and classrooms authoring flows**

- [x] **Step 4: Build activities and availability authoring flows**

- [x] **Step 5: Add settings and local project management flows**

- [x] **Step 6: Add language selection and localized app-shell copy**

- [x] **Step 7: Require setup, authoring, and timetable screens to use externalized messages instead of inline copy**

- [x] **Step 8: Add route and feature tests**

- [x] **Step 9: Commit**

```bash
git add apps/web
git commit -m "feat: add full scheduling app shell and data entry flows"
```

## Task 9: Build Generation UX, Conflict Inspection, And Timetable Views

**Files:**
- Create: `packages/ui/src/patterns/constraint-builder/**`
- Create: `packages/ui/src/timetable/**`
- Create: `packages/domain/src/timetable/**`
- Create: `apps/web/src/features/generate/**`
- Create: `apps/web/src/features/timetables/**`

- [x] **Step 1: Build constraint editing screens**

- [x] **Step 2: Build generation controls and progress UI**

- [x] **Step 3: Build conflict logs and difficult-activity inspection**

- [x] **Step 4: Build timetable views by class, teacher, and classroom**

- [x] **Step 5: Add rendering and interaction tests**

- [x] **Step 6: Commit**

```bash
git add packages/ui packages/domain/src/timetable apps/web/src/features/generate apps/web/src/features/timetables
git commit -m "feat: add generation and timetable workflows"
```

## Task 10: Build DOCX And Excel Export

**Files:**
- Create: `packages/exports/src/docx/export-class-schedule.ts`
- Create: `packages/exports/src/docx/export-teacher-schedule.ts`
- Create: `packages/exports/src/docx/export-classroom-schedule.ts`
- Create: `packages/exports/src/docx/export-institution-pack.ts`
- Create: `packages/exports/src/excel/export-class-workbook.ts`
- Create: `packages/exports/src/excel/export-teacher-workbook.ts`
- Create: `packages/exports/src/excel/export-classroom-workbook.ts`
- Create: `packages/exports/src/excel/export-institution-workbook.ts`
- Create: `packages/exports/src/mappers/schedule-to-export-model.ts`
- Create: `apps/web/src/features/exports/**`
- Test: `packages/exports/src/**/*.test.ts`

- [x] **Step 1: Define export view models**

- [x] **Step 2: Implement DOCX export templates**

- [x] **Step 3: Add locale-aware labels and formatting to DOCX templates**

- [x] **Step 4: Implement Excel workbook export**

- [x] **Step 5: Add locale-aware labels and formatting to Excel outputs**

- [x] **Step 6: Implement full institutional export pack generation**

Support bundled output for institution-wide handoff.

- [x] **Step 7: Ensure export language follows the active app locale with explicit fallback rules**

- [x] **Step 8: Build export screens and download flows**

- [x] **Step 9: Add lazy-loading boundaries**

Implement:
- lazy route/module loading for export screens
- dynamic `import()` around DOCX generation
- dynamic `import()` around Excel generation

- [x] **Step 10: Add tests for document/workbook structure, localized output labels, and fallback behavior**

- [x] **Step 11: Add bundle-splitting verification**

Verify the initial app bundle does not contain `docx` or `exceljs`.

- [x] **Step 12: Commit**

```bash
git add packages/exports apps/web/src/features/exports
git commit -m "feat: add docx and excel schedule exports"
```

## Task 11: Add Offline Reliability, Performance, And Scenario Harnesses

**Files:**
- Create: `tests/scenarios/**`
- Create: `docs/architecture/browser-limits.md`
- Create: `.github/workflows/ci.yml`

- [x] **Step 1: Decide whether Service Worker support is in full v1 scope**

If yes:
- Create: `apps/web/src/shared/offline/service-worker.ts`
If no:
- document the exclusion clearly and keep the browser-only product usable without installable offline caching

- [x] **Step 2: Add large-scenario performance tests**

- [x] **Step 3: Build scenario fixtures from FET-inspired use cases and edge cases**

- [x] **Step 4: Document browser limits and expected dataset sizes**

- [x] **Step 5: Extend CI for scenario, bundle, and Playwright checks**

- [x] **Step 6: Commit**

```bash
git add tests/scenarios docs/architecture/browser-limits.md .github/workflows/ci.yml apps/web/src
git commit -m "chore: add offline hardening and scenario harnesses"
```

## Testing Strategy

- Unit tests:
  - native domain entities
  - constraints
  - preprocessing
  - solver logic
  - export mappers
- Scenario tests:
  - representative school cases
  - representative faculty cases
  - impossible datasets
  - multi-resource conflicts
  - dense availability restrictions
- Localization tests:
  - locale switching
  - fallback behavior
  - localized export labels
- UI tests:
  - full offline data entry
  - generation worker lifecycle
  - conflict inspection
  - timetable views
  - export flows
- Performance tests:
  - large schedule datasets
  - multiple generation attempts
- Bundle tests:
  - export libraries absent from initial bundle
  - export chunk loaded only when export flow is opened or used

## Delivery Order

1. Workspace and design system
2. Native domain model
3. Local persistence
4. Local persistence
5. Constraint registry
6. In-browser solver
7. App shell and data-entry flows
8. Generation and timetable UX
9. DOCX/Excel exports
10. Offline and scenario hardening

## Risks To Manage Early

- One-shot full product ambition is materially riskier than a staged rollout.
- Removing `.fet` compatibility lowers migration complexity, but it also means the product must stand on the quality of its own data-entry UX from day one.
- Browser memory and CPU limits remain hard constraints for large generation problems.
- Solver correctness still depends on preserving the important use cases and edge cases from FET even though the product no longer shares its file model.
- DOCX and Excel exports are product features in their own right and need template ownership, not last-minute serialization glue.
- It is easy to accidentally pull export libraries into the initial bundle; the lazy-loading boundary needs tests and CI checks from the start.
- Multilingual support becomes expensive if copy is not externalized early; locale scaffolding needs to be part of the foundation, not a later polish pass.
