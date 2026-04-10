import type { Assignment } from "@orar/domain"
import type { SolverRequest, SolverResponse } from "@orar/solver"
import { generate, prepareProblem } from "@orar/solver"

let cancelled = false

self.onmessage = (event: MessageEvent<SolverRequest>) => {
	const msg = event.data

	if (msg.type === "cancel") {
		cancelled = true
		return
	}

	if (msg.type === "start") {
		cancelled = false
		const { project, config } = msg

		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		let bestResult = { assignments: [] as Assignment[], fitness: -1, placedCount: 0, totalCount: problem.activities.length }

		for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
			if (cancelled) {
				post({ type: "cancelled" })
				return
			}

			const result = generate(
				problem,
				(placed, total) => {
					post({
						type: "progress",
						progress: placed / Math.max(total, 1),
						placedCount: placed,
						totalCount: total,
					})
				},
				() => cancelled,
			)

			if (result.fitness > bestResult.fitness) {
				bestResult = result
				post({
					type: "partial",
					assignments: result.assignments,
					fitness: result.fitness,
				})
			}

			if (result.placedCount === result.totalCount) break
		}

		if (cancelled) {
			post({ type: "cancelled" })
		} else {
			post({
				type: "complete",
				assignments: bestResult.assignments,
				fitness: bestResult.fitness,
			})
		}
	}
}

function post(response: SolverResponse) {
	self.postMessage(response)
}
