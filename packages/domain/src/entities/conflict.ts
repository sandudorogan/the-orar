import { z } from "zod"
import { TimeSlotSchema } from "./time-slot.ts"

export const ConflictType = z.enum([
	"teacher-overlap",
	"class-overlap",
	"room-overlap",
	"unavailability-violation",
	"unplaced-activity",
	"workload-violation",
	"spread-violation",
])
export type ConflictType = z.infer<typeof ConflictType>

export const ConflictSchema = z.object({
	id: z.string().uuid(),
	type: ConflictType,
	activityIds: z.array(z.string().uuid()),
	timeSlot: TimeSlotSchema.optional(),
	description: z.string(),
	severity: z.enum(["hard", "soft"]),
})

export type Conflict = z.infer<typeof ConflictSchema>

export function createConflict(
	data: Pick<Conflict, "type" | "activityIds" | "description" | "severity"> &
		Partial<Pick<Conflict, "id" | "timeSlot">>,
): Conflict {
	return ConflictSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		type: data.type,
		activityIds: data.activityIds,
		timeSlot: data.timeSlot,
		description: data.description,
		severity: data.severity,
	})
}
