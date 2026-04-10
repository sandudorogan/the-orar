import { z } from "zod"

export const GenerationStatus = z.enum(["pending", "running", "completed", "failed", "cancelled"])
export type GenerationStatus = z.infer<typeof GenerationStatus>

export const GenerationRunSchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid(),
	status: GenerationStatus,
	startedAt: z.string().datetime().optional(),
	completedAt: z.string().datetime().optional(),
	progress: z.number().min(0).max(1).default(0),
	placedCount: z.number().int().min(0).default(0),
	totalCount: z.number().int().min(0).default(0),
	bestFitness: z.number().optional(),
	scheduleId: z.string().uuid().optional(),
	errorMessage: z.string().optional(),
})

export type GenerationRun = z.infer<typeof GenerationRunSchema>

export function createGenerationRun(
	data: Pick<GenerationRun, "projectId"> & Partial<Pick<GenerationRun, "id">>,
): GenerationRun {
	return GenerationRunSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		projectId: data.projectId,
		status: "pending",
		progress: 0,
		placedCount: 0,
		totalCount: 0,
	})
}
