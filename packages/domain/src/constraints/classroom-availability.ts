import { timeSlotKey, timeSlotKeysForSpan } from "../entities/time-slot.ts"
import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createClassroomAvailability(): Constraint {
	return {
		id: "classroom-availability",
		type: "classroom-availability",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []

			const unavailableSlots = new Map<string, Set<string>>()
			for (const rule of context.availabilityRules) {
				if (rule.targetType !== "classroom" || rule.type !== "unavailable") continue
				const slots = unavailableSlots.get(rule.targetId) ?? new Set<string>()
				for (const ts of rule.timeSlots) {
					slots.add(timeSlotKey(ts))
				}
				unavailableSlots.set(rule.targetId, slots)
			}

			for (const assignment of context.assignments) {
				if (!assignment.roomId) continue
				const blocked = unavailableSlots.get(assignment.roomId)
				if (!blocked) continue
				const spanKeys = timeSlotKeysForSpan(assignment.timeSlot, assignment.duration ?? 1)
				for (const slotKey of spanKeys) {
					if (blocked.has(slotKey)) {
						const room = context.classrooms.find((r) => r.id === assignment.roomId)
						violations.push({
							constraintId: "classroom-availability",
							constraintType: "classroom-availability",
							weight: "hard",
							activityIds: [assignment.activityId],
							timeSlot: assignment.timeSlot,
							description: `Classroom ${room?.name ?? assignment.roomId} is unavailable at this time`,
						})
						break
					}
				}
			}

			return violations
		},
	}
}
