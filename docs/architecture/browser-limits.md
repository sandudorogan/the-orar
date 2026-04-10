# Browser Limits and Expected Dataset Sizes

## Supported Scale

| Metric | Recommended Max | Hard Limit |
|--------|----------------|------------|
| Teachers | 200 | 500 |
| Classes | 100 | 300 |
| Class Groups | 300 | 1000 |
| Classrooms | 100 | 300 |
| Activities | 500 | 2000 |
| Periods per Day | 12 | 20 |
| Active Days | 6 | 7 |
| Availability Rules | 1000 | 5000 |

## Browser Constraints

### Memory
- IndexedDB storage: effectively unlimited (browser-managed)
- In-memory project model: under 50MB for recommended scale
- Web Worker: separate memory space, shares no state with main thread

### CPU
- Generation runs in a Web Worker, keeping the UI responsive
- Single-threaded solver: generation time scales with problem complexity
- Multi-attempt generation: each attempt is independent

### Expected Generation Times
- Small school (3 teachers, 2 classes): < 100ms
- Medium school (8 teachers, 4 classes): < 500ms
- Large school (30 teachers, 20 classes): < 10s
- Very large (100+ teachers): may require multiple attempts, 30-60s

### Export
- DOCX/Excel libraries loaded on demand (~500KB each)
- Export for 100+ entities generates many files sequentially
- Browser download API handles individual files; no ZIP bundling in v1

## Mitigation Strategies

1. **Preprocessing sorts activities by constraint density** so the most constrained are placed first
2. **Multi-attempt generation** with best-result selection improves outcomes for harder problems
3. **Progress reporting** keeps the user informed during long generation runs
4. **Cancellation** allows aborting runs that seem stuck
5. **Auto-save with history** prevents data loss
6. **Lazy-loaded exports** keep the initial bundle small
