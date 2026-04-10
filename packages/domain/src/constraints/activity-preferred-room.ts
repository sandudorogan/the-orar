import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createActivityPreferredRoom(
	activityId: string,
	preferredRoomIds: string[],
): Constraint {
	const preferred = new Set(preferredRoomIds)
	return {
		id: `preferred-room:${activityId}`,
		type: "activity-preferred-room",
		weight: "soft",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []

			for (const assignment of context.assignments) {
				if (assignment.activityId !== activityId) continue
				if (!assignment.roomId || !preferred.has(assignment.roomId)) {
					violations.push({
						constraintId: `preferred-room:${activityId}`,
						constraintType: "activity-preferred-room",
						weight: "soft",
						activityIds: [activityId],
						timeSlot: assignment.timeSlot,
						description: "Activity placed in a non-preferred room",
					})
				}
			}

			return violations
		},
	}
}
