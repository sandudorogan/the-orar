import { timeSlotKey } from "../entities/time-slot.ts"
import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createClassAvailability(): Constraint {
	return {
		id: "class-availability",
		type: "class-availability",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []

			const unavailableSlots = new Map<string, Set<string>>()
			for (const rule of context.availabilityRules) {
				if (rule.targetType !== "class" && rule.targetType !== "classGroup") continue
				if (rule.type !== "unavailable") continue
				const slots = unavailableSlots.get(rule.targetId) ?? new Set<string>()
				for (const ts of rule.timeSlots) {
					slots.add(timeSlotKey(ts))
				}
				unavailableSlots.set(rule.targetId, slots)
			}

			for (const assignment of context.assignments) {
				const activity = context.activities.find((a) => a.id === assignment.activityId)
				if (!activity) continue

				const slotKey = timeSlotKey(assignment.timeSlot)
				for (const groupId of activity.classGroupIds) {
					const blocked = unavailableSlots.get(groupId)
					if (blocked?.has(slotKey)) {
						const group = context.classGroups.find((g) => g.id === groupId)
						violations.push({
							constraintId: "class-availability",
							constraintType: "class-availability",
							weight: "hard",
							activityIds: [activity.id],
							timeSlot: assignment.timeSlot,
							description: `Class group ${group?.name ?? groupId} is unavailable at this time`,
						})
					}
				}
			}

			return violations
		},
	}
}
