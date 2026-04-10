import { timeSlotKey, timeSlotKeysForSpan } from "../entities/time-slot.ts"
import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createTeacherAvailability(): Constraint {
	return {
		id: "teacher-availability",
		type: "teacher-availability",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []

			const unavailableSlots = new Map<string, Set<string>>()
			for (const rule of context.availabilityRules) {
				if (rule.targetType !== "teacher" || rule.type !== "unavailable") continue
				const slots = unavailableSlots.get(rule.targetId) ?? new Set<string>()
				for (const ts of rule.timeSlots) {
					slots.add(timeSlotKey(ts))
				}
				unavailableSlots.set(rule.targetId, slots)
			}

			for (const assignment of context.assignments) {
				const activity = context.activities.find((a) => a.id === assignment.activityId)
				if (!activity) continue

				const spanKeys = timeSlotKeysForSpan(assignment.timeSlot, assignment.duration ?? 1)
				for (const teacherId of activity.teacherIds) {
					const blocked = unavailableSlots.get(teacherId)
					if (!blocked) continue
					for (const slotKey of spanKeys) {
						if (blocked.has(slotKey)) {
							const teacher = context.teachers.find((t) => t.id === teacherId)
							violations.push({
								constraintId: "teacher-availability",
								constraintType: "teacher-availability",
								weight: "hard",
								activityIds: [activity.id],
								timeSlot: assignment.timeSlot,
								description: `Teacher ${teacher?.name ?? teacherId} is unavailable at this time`,
							})
							break
						}
					}
				}
			}

			return violations
		},
	}
}
