import type { ScheduleProject } from "@orar/domain"
import type { SolverConfig, SolverResponse } from "@orar/solver"
import { DEFAULT_SOLVER_CONFIG } from "@orar/solver"

export type GenerationCallback = (response: SolverResponse) => void

export class GenerationClient {
	private worker: Worker | null = null

	start(
		project: ScheduleProject,
		callback: GenerationCallback,
		config: SolverConfig = DEFAULT_SOLVER_CONFIG,
	): void {
		this.cancel()
		this.worker = new Worker(new URL("../../workers/generate.worker.ts", import.meta.url), {
			type: "module",
		})
		this.worker.onmessage = (event: MessageEvent<SolverResponse>) => {
			callback(event.data)
			if (
				event.data.type === "complete" ||
				event.data.type === "failed" ||
				event.data.type === "cancelled"
			) {
				this.cleanup()
			}
		}
		this.worker.postMessage({ type: "start", project, config })
	}

	cancel(): void {
		if (this.worker) {
			this.worker.postMessage({ type: "cancel" })
			this.cleanup()
		}
	}

	private cleanup(): void {
		this.worker?.terminate()
		this.worker = null
	}
}
