import { timeSlotKey } from "../entities/time-slot.ts"
import type { TimeSlot } from "../entities/time-slot.ts"
import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createActivityPreferredTime(
	activityId: string,
	preferredSlots: TimeSlot[],
): Constraint {
	const preferred = new Set(preferredSlots.map(timeSlotKey))
	return {
		id: `preferred-time:${activityId}`,
		type: "activity-preferred-time",
		weight: "soft",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []

			for (const assignment of context.assignments) {
				if (assignment.activityId !== activityId) continue
				const key = timeSlotKey(assignment.timeSlot)
				if (!preferred.has(key)) {
					violations.push({
						constraintId: `preferred-time:${activityId}`,
						constraintType: "activity-preferred-time",
						weight: "soft",
						activityIds: [activityId],
						timeSlot: assignment.timeSlot,
						description: "Activity placed outside preferred time slots",
					})
				}
			}

			return violations
		},
	}
}
