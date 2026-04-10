# The Orar

Browser-only, local-first scheduling app for schools and universities. Users create institutional data (classes, teachers, classrooms, activities) and generate optimized timetables using a constraint satisfaction engine. No backend -- everything runs in the browser with IndexedDB persistence.

Inspired by FET timetable software's capabilities, but standalone with its own data model, naming, and architecture.

## Stack

- **Runtime:** Bun (use `bun` for all commands -- not npm/yarn/node)
- **Framework:** React 19 + TanStack Router
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS v4 with semantic design tokens
- **Components:** shadcn/ui (Radix UI primitives + CVA variants)
- **Validation:** Zod
- **Linter:** Biome (tabs, 100-char lines, double quotes, ASI)
- **Tests:** Vitest
- **Types:** TypeScript (strict, ESNext, composite refs)

## Monorepo layout

```
apps/web/             React SPA (Vite, TanStack Router, IndexedDB persistence)
packages/domain/      Core entities, constraints, validation, timetable helpers
packages/solver/      Heuristic schedule generation, fitness scoring, Web Worker API
packages/exports/     DOCX + Excel export pipelines (lazy-loaded, not in initial bundle)
packages/locales/     Message catalogs (en, ro), formatting, language registry
packages/ui/          Reusable React components (primitives, forms, dialogs, patterns)
packages/design-system/  Tailwind v4 tokens (brand palette, semantic layers, motion)
```

Package naming: `@orar/domain`, `@orar/solver`, `@orar/exports`, `@orar/locales`, `@orar/ui`, `@orar/design-system`, `@orar/web`.

## Commands

```sh
bun install           # install deps
bun run dev           # vite dev server (apps/web)
bun run build         # typecheck + vite build
bun run test          # vitest run (all packages + apps + tests/)
bun run test:watch    # vitest watch mode
bun run typecheck     # tsc -b (composite project refs)
bun run lint          # biome check
bun run lint:fix      # biome check --write
bun run bundle-check  # scripts/bundle-check.ts
```

## Domain model

Root aggregate is `ScheduleProject`. All entities use Zod schemas + factory functions (`createEntity(data)`).

```
ScheduleProject
  ├── Institution (name, type: school | university)
  ├── Calendar (activeDays, periodsPerDay, periodDuration, startTime)
  ├── Class[] (grade/cohort)
  │   └── ClassGroup[] (subgroups, e.g. "9A All", "9A Science-track")
  ├── Teacher[]
  ├── Classroom[] (tags for room type matching)
  ├── Activity[] (teacherIds, classGroupIds, duration, totalPerWeek, splitConfig, preferredRoomIds, roomTags)
  └── AvailabilityRule[] (targetType + targetId + unavailable/preferred + timeSlots)
```

`Schedule` is separate -- a collection of `Assignment[]` (activityId + timeSlot + roomId + locked flag) with a fitness score.

`TimeSlot` = `{ day: DayOfWeek, period: number }`. Key format: `"monday:3"`. Multi-period activities span consecutive periods.

## Constraint system

Hard constraints (penalty -10 each):
- NoTeacherOverlap, NoClassOverlap, NoRoomOverlap
- TeacherAvailability, ClassAvailability, ClassroomAvailability

Soft constraints (penalty -1 each):
- ActivityPreferredTime, ActivityPreferredRoom

`ConstraintRegistry` manages constraint instances. `createDefaultRegistry()` wires up the hard constraints.

## Solver algorithm

1. **Preprocessing** (`prepareProblem`): expand split activities, compute available slots per activity (filtering by availability rules), find compatible rooms, sort most-constrained-first
2. **Generation** (`generate`): greedy placement with randomized top-3 candidate selection. Tracks used slots for teachers/classes/rooms. Supports cancellation callback.
3. **Fitness** (`computeFitness`): `100 - (hardViolations * 10) - (softViolations * 1)`, scaled by placement ratio, clamped to [0, 100]

Generation runs in a Web Worker (`apps/web/src/workers/generate.worker.ts`) with typed message protocol (`SolverRequest`/`SolverResponse`).

## Persistence

IndexedDB stores: `projects`, `schedules`, `generationRuns`, `settings`, `history`. Debounced writes (300ms) on project updates. Assignments saved on generation complete.

## i18n

Shipped locales: English (default), Romanian. Message catalogs in `packages/locales/src/catalogs/`. All user-facing copy externalized. Exports use the active locale for labels and formatting.

Adding a locale: create catalog file, register in `language-registry.ts`, add to TypeScript union.

## Design system

Brand palette: ink-black, prussian-blue, dusk-blue, dusty-denim, alabaster-grey.

Token layers in `packages/design-system/`:
- `brand.css` -- raw color values
- `semantic.css` -- intent tokens (surface, text, border, action, feedback, status)
- `theme.css` -- Tailwind v4 `@theme` block
- `components.css` -- reusable compositions
- `motion.css` -- animation utilities

Scheduling-specific status tokens: conflict, unplaced, locked, generated, selected.

## Web app structure

```
apps/web/src/
  app/           providers, layout, router, project-context, i18n, styles
  features/      page-level components (dashboard, classes, teachers, classrooms,
                 activities, constraints, generate, timetables, exports, settings, landing)
  shared/        generation worker client, IndexedDB storage layer
  workers/       Web Worker entry points
```

Routing: TanStack Router with lazy-loaded landing and exports pages. App shell wraps all routes except landing in `AppLayout`.

State: `ProjectProvider` React context owns the `ScheduleProject` and exposes CRUD operations via `useProject()` hook.

## Testing patterns

- **Domain:** entity creation, schema validation, individual constraint evaluation, project validation
- **Solver:** preprocessing correctness, generation placement, cancellation, fitness scoring
- **Exports:** export model building, locale-aware labels
- **Locales:** catalog completeness, registry validity, formatting functions
- **Integration scenarios:** `tests/scenarios/` (small-school, medium-school, university)

Tests verify zero hard-constraint violations when schedules are fully placed.

## Key conventions

- Tabs for indentation, double quotes, ASI (no semicolons unless needed)
- Entity factory functions: `createEntity(data)` with Zod parse
- Exports must be lazy-loaded (docx, exceljs not in initial bundle)
- All user-facing text goes through locale catalogs, never hardcoded
- Design tokens, not raw colors -- reference semantic tokens in components
