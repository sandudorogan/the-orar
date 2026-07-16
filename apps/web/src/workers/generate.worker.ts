import type { Assignment, ScheduleProject } from "@orar/domain"
import type { SolverConfig, SolverRequest, SolverResponse } from "@orar/solver"
import { computeFitness, generate, prepareProblem } from "@orar/solver"

let cancelled = false

self.onmessage = async (event: MessageEvent<SolverRequest>) => {
	const msg = event.data

	if (msg.type === "cancel") {
		cancelled = true
		return
	}

	if (msg.type === "start") {
		cancelled = false
		try {
			await runGeneration(msg.project, msg.config)
		} catch (error) {
			post({ type: "failed", reason: error instanceof Error ? error.message : String(error) })
		}
	}
}

interface BestResult {
	assignments: Assignment[]
	fitness: number
	unplacedActivityIds: string[]
}

async function runGeneration(project: ScheduleProject, config: SolverConfig): Promise<void> {
	const problem = prepareProblem(
		project.calendar,
		project.activities,
		project.teachers,
		project.classGroups,
		project.classrooms,
		project.availabilityRules,
	)

	let best: BestResult | null = null
	const startTime = Date.now()
	let lastReport = 0

	for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
		if (cancelled) {
			post({ type: "cancelled" })
			return
		}

		const result = generate(
			problem,
			(placed, total) => {
				const now = Date.now()
				if (now - lastReport >= config.reportIntervalMs || placed === total) {
					lastReport = now
					post({
						type: "progress",
						progress: placed / Math.max(total, 1),
						placedCount: placed,
						totalCount: total,
					})
				}
			},
			() => cancelled,
			{ seed: config.seed === undefined ? undefined : config.seed + attempt },
		)

		const fitness = computeFitness(project, result.assignments)
		if (!best || fitness > best.fitness) {
			best = {
				assignments: result.assignments,
				fitness,
				unplacedActivityIds: result.unplacedActivityIds,
			}
			post({ type: "partial", assignments: best.assignments, fitness })
		}

		if (result.placedCount === result.totalCount && fitness === 100) break
		if (Date.now() - startTime >= config.timeoutMs) break
		await yieldToEventLoop()
	}

	if (cancelled) {
		post({ type: "cancelled" })
		return
	}

	post({
		type: "complete",
		assignments: best?.assignments ?? [],
		fitness: best?.fitness ?? 0,
		unplacedActivityIds: best?.unplacedActivityIds ?? [],
	})
}

function yieldToEventLoop(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0))
}

function post(response: SolverResponse) {
	self.postMessage(response)
}
