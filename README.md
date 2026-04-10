# Orar

**School scheduling, solved.**

Build conflict-free timetables for your school or university -- entirely in your browser. No servers, no accounts, no installers.

---

## Why this exists

Every school needs a timetable. The tools that exist today all share the same problems:

| Tool | Problem |
|------|---------|
| **FET** | Desktop-only, Qt-based, requires installation, dated UI |
| **aSc Timetables** | Closed source, paid license, Windows-centric |
| **Untis** | Enterprise pricing, server infrastructure, steep learning curve |
| **Prime Timetable** | Cloud-dependent, subscription model, your data lives on their servers |
| **iMagic Timetable Master** | Windows-only, abandonware-tier UI, no longer maintained |

Orar is none of these things.

It's a **free, open-source, browser-only** timetable generator. You open a URL, define your school, hit generate, and export. That's it. No installers, no accounts, no servers, no subscriptions. Your data never leaves your device.

---

## What it does

```
Define your school          Generate schedules          Export & share
                                                        
  Classes                                                 DOCX
  Teachers          -->     Constraint-based          -->  Excel
  Classrooms                heuristic solver               JSON
  Activities                (runs in a Web Worker)
  Constraints
```

**8 core modules, one workflow:**

| | Module | What you do |
|---|---|---|
| :mortar_board: | **Classes** | Define classes and groups (sections) |
| :bust_in_silhouette: | **Teachers** | Add teachers with optional hour limits |
| :door: | **Classrooms** | Set up rooms with capacity and tags |
| :books: | **Activities** | Link teachers to class groups, set durations |
| :shield: | **Constraints** | Mark unavailable times, set preferences |
| :zap: | **Generate** | Run the solver, review conflicts and fitness score |
| :calendar: | **Timetables** | View schedules by class, teacher, or room |
| :outbox_tray: | **Exports** | Download as DOCX, Excel, or JSON |

---

## Key principles

- **Runs offline** -- works without internet, installable as a PWA
- **Local-first** -- data stays on your device in IndexedDB, never uploaded anywhere
- **No backend** -- all computation happens client-side using Web Workers
- **Bilingual** -- full English and Romanian support with instant switching
- **Transparent** -- clear conflict reporting and fitness scoring for every generation
- **Portable** -- export/import your entire project as JSON for backup or transfer

---

## Quick start

```bash
git clone https://github.com/sandudorogan/the-orar.git
cd the-orar
bun install
bun run dev
```

Open `http://localhost:5173` and start scheduling.

---

## Project structure

```
the-orar/
  apps/web/             React app (Vite, TanStack Router)
  packages/
    domain/             Entities, constraints, validation (Zod)
    solver/             Heuristic scheduling engine
    exports/            DOCX & Excel generators
    ui/                 Component library (shadcn/ui)
    locales/            i18n message catalogs
    design-system/      Design tokens
```

---

## Tech stack

TypeScript -- React 19 -- Vite -- Tailwind CSS 4 -- Bun -- Zod -- Web Workers -- IndexedDB

---

## License

MIT
