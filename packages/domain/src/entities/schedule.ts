import { z } from "zod"
import { AssignmentSchema } from "./assignment.ts"

export const ScheduleSchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid(),
	generationRunId: z.string().uuid().optional(),
	assignments: z.array(AssignmentSchema),
	createdAt: z.string().datetime(),
	fitness: z.number().optional(),
})

export type Schedule = z.infer<typeof ScheduleSchema>

export function createSchedule(
	data: Pick<Schedule, "projectId" | "assignments"> &
		Partial<Pick<Schedule, "id" | "generationRunId" | "fitness">>,
): Schedule {
	return ScheduleSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		projectId: data.projectId,
		generationRunId: data.generationRunId,
		assignments: data.assignments,
		createdAt: new Date().toISOString(),
		fitness: data.fitness,
	})
}
