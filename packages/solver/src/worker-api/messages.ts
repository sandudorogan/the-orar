import type { Assignment, ScheduleProject } from "@orar/domain"

export type SolverRequest =
	| { type: "start"; project: ScheduleProject; config: SolverConfig }
	| { type: "cancel" }

export type SolverResponse =
	| { type: "progress"; progress: number; placedCount: number; totalCount: number }
	| { type: "partial"; assignments: Assignment[]; fitness: number }
	| {
			type: "complete"
			assignments: Assignment[]
			fitness: number
			unplacedActivityIds: string[]
	  }
	| { type: "failed"; reason: string }
	| { type: "cancelled" }

export interface SolverConfig {
	maxAttempts: number
	timeoutMs: number
	reportIntervalMs: number
	seed?: number
}

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
	maxAttempts: 3,
	timeoutMs: 60_000,
	reportIntervalMs: 500,
}
