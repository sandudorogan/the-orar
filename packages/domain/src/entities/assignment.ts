import { z } from "zod"
import { TimeSlotSchema } from "./time-slot.ts"

export const AssignmentSchema = z.object({
	activityId: z.string().uuid(),
	timeSlot: TimeSlotSchema,
	roomId: z.string().uuid().optional(),
	locked: z.boolean().default(false),
	duration: z.number().int().min(1).default(1),
})

export type Assignment = z.infer<typeof AssignmentSchema>

export function createAssignment(
	data: Pick<Assignment, "activityId" | "timeSlot"> &
		Partial<Pick<Assignment, "roomId" | "locked" | "duration">>,
): Assignment {
	return AssignmentSchema.parse({
		activityId: data.activityId,
		timeSlot: data.timeSlot,
		roomId: data.roomId,
		locked: data.locked ?? false,
		duration: data.duration ?? 1,
	})
}
