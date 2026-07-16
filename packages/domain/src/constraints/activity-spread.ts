import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createActivitySpread(): Constraint {
	return {
		id: "activity-spread",
		type: "activity-spread",
		weight: "soft",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []

			const sameDayCounts = new Map<string, number>()
			for (const assignment of context.assignments) {
				const key = `${assignment.activityId}|${assignment.timeSlot.day}`
				sameDayCounts.set(key, (sameDayCounts.get(key) ?? 0) + 1)
			}

			for (const [key, count] of sameDayCounts) {
				if (count < 2) continue
				const [activityId, day] = key.split("|")
				const activity = context.activities.find((a) => a.id === activityId)
				if (!activity) continue
				violations.push({
					constraintId: "activity-spread",
					constraintType: "activity-spread",
					weight: "soft",
					activityIds: [activity.id],
					description: `${activity.name} has ${count} sessions on ${day}`,
				})
			}

			return violations
		},
	}
}
